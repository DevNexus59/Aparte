# Déploiement infra — k3s sur `portfolio-vm`

Ce document décrit comment héberger l'API **Aparté** (`apps/api`) sur
**`portfolio-vm`** (VM `virsh` qui héberge déjà tes autres projets/apps) avec
**k3s** (Kubernetes léger, 1 nœud), MySQL dans le cluster, et un déploiement
automatisé depuis GitHub Actions.

> Tous les fichiers `deploy/k8s/*.yaml` utilisent le sous-domaine
> **`aparte.pierrefourdin.dev`** et l'image **`ghcr.io/devnexus59/cercle-api`**.

## Architecture retenue

Ton reverse proxy existant **termine déjà le TLS** (il a les certificats
Let's Encrypt) et redirige le trafic HTTP en clair vers les VMs cibles. On
réutilise exactement ce modèle :

```
Internet ──HTTPS──> reverse proxy (TLS) ──HTTP──> portfolio-vm:30080 ──> Service "api" (NodePort) ──> Pod api:4000
```

Conséquences concrètes par rapport à une install k3s "par défaut" :

- **Pas de cert-manager / Let's Encrypt dans le cluster** : le TLS est déjà
  géré par ton reverse proxy, donc inutile de le refaire dans k3s.
- **Pas d'Ingress Traefik** : on expose l'API directement via un Service
  Kubernetes de type **NodePort** (port fixe `30080`), que ton reverse proxy
  appelle en HTTP — exactement comme il le fait pour tes autres VMs/apps.
- **On désactive Traefik à l'install de k3s** : par défaut, k3s installe
  Traefik et essaie de réserver les ports **80/443** sur la VM. Comme un
  autre service écoute déjà sur ces ports sur `portfolio-vm`, on évite tout
  conflit en ne l'installant pas (on n'en a pas besoin avec l'approche
  NodePort).

## 0. Prérequis

- Accès SSH à `portfolio-vm` (utilisateur avec `sudo`).
- Un Personal Access Token GitHub avec le scope `read:packages` (pour que la
  VM puisse pull l'image privée depuis ghcr.io).
- Connaître l'IP de `portfolio-vm` sur le réseau où vit ton reverse proxy
  (ex. réseau `virsh` interne ou IP de la VM hôte) — c'est cette IP que le
  reverse proxy utilisera pour joindre `:30080`.

## 1. Installer k3s sans Traefik

Connecte-toi en SSH sur `portfolio-vm`, puis vérifie d'abord que les ports
80/443 sont bien occupés par autre chose (pour confirmer pourquoi on
désactive Traefik) :

```bash
sudo ss -tlnp | grep -E ':80|:443'
```

Installe k3s en désactivant Traefik (et le `local-storage` LoadBalancer
associé, `servicelb`, qui n'est utile que pour des Services de type
`LoadBalancer` — on n'en utilise pas) :

```bash
curl -sfL https://get.k3s.io | sh -s - --disable=traefik --disable=servicelb
```

Ça installe k3s comme service systemd (`k3s.service`), démarré
automatiquement, avec :
- le control plane Kubernetes (~100 Mo de RAM),
- `local-path-provisioner` (fournit le `StorageClass` par défaut, utilisé
  par MySQL et le volume d'uploads — voir plus bas),
- **sans** Traefik ni servicelb, donc sans toucher aux ports 80/443.

Vérifie que ça tourne :

```bash
sudo systemctl status k3s
sudo k3s kubectl get nodes
```

Tu dois voir un nœud `Ready`.

### Récupérer le kubeconfig pour ton utilisateur

```bash
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
# k3s utilise un alias "kubectl" — sinon :
echo 'alias kubectl="k3s kubectl"' >> ~/.bashrc
source ~/.bashrc
```

À partir d'ici, `kubectl get nodes` doit fonctionner sans `sudo`.

## 2. Créer le namespace et les Secrets réels

Les fichiers `deploy/k8s/*-secret.example.yaml` sont des **modèles** —
génère les vrais secrets directement sur la VM, ils ne doivent jamais être
committés.

```bash
kubectl apply -f deploy/k8s/00-namespace.yaml

# Secrets MySQL
kubectl create secret generic mysql-credentials -n aparte \
  --from-literal=MYSQL_ROOT_PASSWORD="$(openssl rand -hex 24)" \
  --from-literal=MYSQL_DATABASE=aparte \
  --from-literal=MYSQL_USER=aparte \
  --from-literal=MYSQL_PASSWORD="$(openssl rand -hex 24)"

# Récupère le mot de passe généré pour MYSQL_PASSWORD :
kubectl get secret mysql-credentials -n aparte -o jsonpath='{.data.MYSQL_PASSWORD}' | base64 -d; echo

# Secrets API — DB_PASSWORD doit être identique à MYSQL_PASSWORD ci-dessus
kubectl create secret generic api-secrets -n aparte \
  --from-literal=DB_USER=aparte \
  --from-literal=DB_PASSWORD="<colle MYSQL_PASSWORD ici>" \
  --from-literal=JWT_ACCESS_SECRET="$(openssl rand -hex 64)" \
  --from-literal=JWT_REFRESH_SECRET="$(openssl rand -hex 64)" \
  --from-literal=MESSAGE_ENCRYPTION_KEY="$(openssl rand -hex 32)"

# Image pull secret pour ghcr.io (package privé)
kubectl create secret docker-registry ghcr-pull-secret -n aparte \
  --docker-server=ghcr.io \
  --docker-username=<ton-user-github> \
  --docker-password=<PAT avec scope read:packages> \
  --docker-email=<ton-email>
```

## 3. Appliquer les manifests

Ordre important : namespace → MySQL → ConfigMap/Secrets API → API → Service
→ migration.

```bash
kubectl apply -f deploy/k8s/00-namespace.yaml
kubectl apply -f deploy/k8s/11-mysql-statefulset.yaml
kubectl apply -f deploy/k8s/21-api-configmap.yaml
kubectl apply -f deploy/k8s/22-api-deployment.yaml
kubectl apply -f deploy/k8s/23-api-service.yaml

# Attendre que MySQL soit prêt avant la migration initiale
kubectl rollout status statefulset/mysql -n aparte

kubectl apply -f deploy/k8s/24-migration-job.yaml
kubectl wait --for=condition=complete --timeout=120s job/aparte-migrate -n aparte
```

> Le Deployment `api` va d'abord échouer à puller `ghcr.io/.../cercle-api:latest`
> tant qu'aucune image n'a été poussée (Lot CI/CD ci-dessous). C'est normal —
> il se mettra à jour automatiquement après le premier push sur `main`.

## 4. Configurer le reverse proxy

Sur la VM/machine où tourne ton reverse proxy (celui qui a déjà le certificat
TLS pour `aparte.pierrefourdin.dev` ou qui peut en obtenir un), ajoute un
site qui :
- termine le TLS pour `aparte.pierrefourdin.dev`,
- forward en HTTP vers `http://<IP de portfolio-vm>:30080`,
- propage les en-têtes nécessaires aux WebSockets (Socket.IO).

Exemple nginx :

```nginx
server {
    listen 443 ssl;
    server_name aparte.pierrefourdin.dev;

    # ... directives ssl_certificate / ssl_certificate_key existantes ...

    location / {
        proxy_pass http://<IP de portfolio-vm>:30080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Adapte la syntaxe si ton reverse proxy est Traefik, Caddy ou HAProxy — les
trois points importants restent : TLS côté reverse proxy, forward HTTP vers
`portfolio-vm:30080`, et upgrade WebSocket.

## 5. Vérifications

Depuis `portfolio-vm` (ou toute machine du même réseau), vérifie que l'API
répond bien sur le NodePort :

```bash
kubectl get pods -n aparte
curl http://localhost:30080/health
# -> {"ok":true}
```

Puis depuis l'extérieur, via le reverse proxy :

```bash
curl https://aparte.pierrefourdin.dev/health
# -> {"ok":true}
```

## 6. CI/CD — build & déploiement automatique

Le workflow `.github/workflows/docker-publish.yml` :
1. Sur chaque push sur `main` touchant `apps/api/**`, build l'image Docker
   (`apps/api/Dockerfile`) et la pousse sur
   `ghcr.io/devnexus59/cercle-api:latest` + `:<sha>`.
2. Lance ensuite un job `deploy` sur un **runner self-hébergé** (à installer
   sur la VM, étape suivante) qui : relance le Job de migration, puis met à
   jour le Deployment avec la nouvelle image (`kubectl set image` +
   `kubectl rollout status`).

### Installer le runner self-hébergé sur `portfolio-vm`

Sur GitHub : Settings → Actions → Runners → "New self-hosted runner", choisir
Linux x64, puis suivre les commandes affichées (téléchargement de
`actions-runner-linux-x64-*.tar.gz`, `./config.sh --url ... --token ...`).

Installe-le ensuite comme service pour qu'il tourne en continu :

```bash
sudo ./svc.sh install
sudo ./svc.sh start
```

Le runner doit pouvoir exécuter `kubectl` sur le cluster : comme il tourne
sur la même VM que k3s, donne-lui le même `~/.kube/config` que ton
utilisateur (ou exporte `KUBECONFIG=/etc/rancher/k3s/k3s.yaml` dans
l'environnement du service du runner, avec les permissions de lecture
adéquates).

### Premier déploiement

Une fois le runner actif, un push sur `main` qui touche `apps/api/**`
déclenche automatiquement build → push ghcr.io → migration → rollout. Tu
peux aussi déclencher le tout manuellement la première fois en suivant les
commandes de la section 3 avec une image que tu as buildée et poussée à la
main :

```bash
docker build -f apps/api/Dockerfile -t ghcr.io/devnexus59/cercle-api:latest .
echo <PAT> | docker login ghcr.io -u <ton-user-github> --password-stdin
docker push ghcr.io/devnexus59/cercle-api:latest
```

## 7. Sauvegardes

MySQL tourne dans un PVC `local-path` (= un dossier sur le disque de la VM,
`/var/lib/rancher/k3s/storage/...`). Aucune sauvegarde automatique n'est
fournie ici — au minimum, prévoir un `cron` sur la VM qui fait un
`mysqldump` périodique vers un stockage externe (autre disque, cloud, etc.).
Idem pour le PVC `aparte-uploads` (photos uploadées).
