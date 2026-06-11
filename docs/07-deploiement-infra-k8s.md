# Déploiement infra — VM perso + Kubernetes (k3s)

Ce document décrit comment héberger l'API **Aparté** (`apps/api`) sur une VM
Ubuntu Server personnelle avec **k3s** (Kubernetes léger, 1 nœud), MySQL dans
le cluster, TLS via Let's Encrypt, et un déploiement automatisé depuis
GitHub Actions.

> Tous les fichiers `deploy/k8s/*.yaml` utilisent le placeholder
> **`api.aparte.example`** et l'image **`ghcr.io/devnexus59/cercle-api`**.
> Remplace `api.aparte.example` par ton vrai sous-domaine partout
> (`grep -rl api.aparte.example deploy/`) avant de déployer.

## 0. Prérequis

- Une VM **Ubuntu Server** (22.04/24.04), avec un accès SSH root/sudo.
- Un nom de domaine dont tu contrôles la zone DNS, avec un sous-domaine (ex.
  `api.tondomaine.fr`) que tu vas pointer vers l'IP publique de la VM.
- Le routeur/box devant la VM doit rediriger les ports **80** et **443**
  (TCP) vers la VM (nécessaires pour le challenge HTTP-01 de Let's Encrypt et
  pour le trafic HTTPS).
- Un Personal Access Token GitHub avec le scope `read:packages` (pour que la
  VM puisse pull l'image privée depuis ghcr.io).

## 1. Installer k3s

Oui, **k3s s'installe très bien sur Ubuntu Server** — c'est même l'un des cas
d'usage principaux (1 seul service systemd, ~100 Mo de RAM pour le control
plane, ingress Traefik + `local-path-provisioner` inclus par défaut).

```bash
curl -sfL https://get.k3s.io | sh -
```

Ça installe k3s comme service systemd (`k3s.service`), démarré
automatiquement. Vérifie :

```bash
sudo systemctl status k3s
sudo k3s kubectl get nodes
```

### Récupérer le kubeconfig pour ton utilisateur

```bash
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
# k3s utilise un alias "kubectl" — sinon :
echo 'alias kubectl="k3s kubectl"' >> ~/.bashrc
```

À partir d'ici, `kubectl get nodes` doit fonctionner sans `sudo`.

### DNS

Dans la zone DNS de ton domaine, crée un enregistrement `A` :

```
api.tondomaine.fr.   A   <IP publique de la VM>
```

## 2. Installer cert-manager

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.16.2/cert-manager.yaml
kubectl get pods -n cert-manager   # attendre que les 3 pods soient Running
```

## 3. Créer le namespace et les Secrets réels

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

## 4. Appliquer les manifests

Ordre important : namespace → MySQL → ConfigMap/Secrets API → migration →
API → ingress.

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

kubectl apply -f deploy/k8s/31-cluster-issuer.yaml
kubectl apply -f deploy/k8s/30-ingress.yaml
```

> Le Deployment `api` va d'abord échouer à puller `ghcr.io/.../cercle-api:latest`
> tant qu'aucune image n'a été poussée (Lot CI/CD ci-dessous). C'est normal —
> il se mettra à jour automatiquement après le premier push sur `main`.

## 5. Vérifications

```bash
kubectl get pods -n aparte
kubectl get certificate -n aparte     # READY=True une fois Let's Encrypt validé
curl https://api.tondomaine.fr/health
# -> {"ok":true}
```

Note WebSocket : Traefik (ingress par défaut de k3s) supporte nativement les
upgrades HTTP → WebSocket, donc Socket.IO fonctionne sans configuration
supplémentaire sur cet Ingress.

## 6. CI/CD — build & déploiement automatique

Le workflow `.github/workflows/docker-publish.yml` :
1. Sur chaque push sur `main` touchant `apps/api/**`, build l'image Docker
   (`apps/api/Dockerfile`) et la pousse sur
   `ghcr.io/devnexus59/cercle-api:latest` + `:<sha>`.
2. Lance ensuite un job `deploy` sur un **runner self-hébergé** (à installer
   sur la VM, étape suivante) qui : relance le Job de migration, puis met à
   jour le Deployment avec la nouvelle image (`kubectl set image` +
   `kubectl rollout status`).

### Installer le runner self-hébergé sur la VM

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
commandes de la section 4 avec une image que tu as buildée et poussée à la
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
