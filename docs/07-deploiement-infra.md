# Déploiement infra — Docker Compose sur `portfolio-vm`

Ce document décrit comment héberger l'API **Aparté** (`apps/api`) sur
**`portfolio-vm`** (VM `virsh` qui héberge déjà tes autres projets/apps) avec
**Docker Compose** (API + MySQL), et un déploiement automatisé depuis
GitHub Actions.

## Architecture retenue

Ton reverse proxy existant **termine déjà le TLS** (il a les certificats
Let's Encrypt) et redirige le trafic HTTP en clair vers les VMs cibles. On
réutilise exactement ce modèle :

```
Internet ──HTTPS──> reverse proxy (TLS) ──HTTP──> portfolio-vm:30080 ──> conteneur api:4000
```

Deux conteneurs gérés par `docker compose` :

- **`mysql`** (image `mysql:8.4`), données dans un volume Docker nommé
  `mysql-data`.
- **`api`** (image `ghcr.io/devnexus59/cercle-api`, buildée par la CI),
  uploads dans un volume Docker nommé `aparte-uploads`, port `4000` du
  conteneur publié sur le port `30080` de la VM.

> Si tu avais commencé l'install k3s sur `portfolio-vm`, désinstalle-la :
> ```bash
> sudo /usr/local/bin/k3s-uninstall.sh
> ```

## 0. Prérequis

- Docker + Docker Compose (plugin `docker compose`, pas l'ancien
  `docker-compose` en Python) installés sur `portfolio-vm`. Vérifie :
  ```bash
  docker compose version
  ```
  Si absent : https://docs.docker.com/engine/install/ubuntu/ puis
  `sudo apt install docker-compose-plugin`.
- Un Personal Access Token GitHub avec le scope `read:packages` (pour pull
  l'image privée depuis ghcr.io).
- Ton utilisateur doit pouvoir lancer `docker` sans `sudo` :
  ```bash
  sudo usermod -aG docker $USER
  # puis se reconnecter (logout/login, ou `newgrp docker`)
  ```

## 1. Récupérer les fichiers du repo

```bash
git clone https://github.com/DevNexus59/cercle.git
cd cercle
```

> Le même clone pourra aussi servir de `WORKDIR` au runner GitHub Actions
> self-hébergé (section 6).

## 2. Préparer `/opt/aparte`

C'est le dossier de déploiement, séparé du clone git (il contient le `.env`
avec les secrets, qui ne doit jamais être commité).

```bash
sudo mkdir -p /opt/aparte
sudo chown $USER:$USER /opt/aparte
cp deploy/docker-compose.prod.yml /opt/aparte/docker-compose.yml
cp deploy/.env.production.example /opt/aparte/.env
```

Édite `/opt/aparte/.env` et remplace toutes les valeurs `change-me` :

- `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD` : génère avec `openssl rand -hex 24`
  (note bien `MYSQL_PASSWORD`, il doit être **identique** à `DB_PASSWORD`
  plus bas dans le même fichier).
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` : `openssl rand -hex 64`.
- `MESSAGE_ENCRYPTION_KEY` : `openssl rand -hex 32`.
- `DB_PASSWORD` : copie la valeur de `MYSQL_PASSWORD`.

`CORS_ORIGIN` et `DB_HOST=mysql` sont déjà corrects, pas besoin de les
changer.

## 3. Se connecter à ghcr.io

```bash
echo <PAT avec scope read:packages> | docker login ghcr.io -u <ton-user-github> --password-stdin
```

Ça enregistre les credentials dans `~/.docker/config.json` — `docker compose
pull` pourra ensuite télécharger l'image privée `ghcr.io/devnexus59/cercle-api`.

## 4. Premier déploiement

```bash
cd /opt/aparte
docker compose pull
docker compose up -d mysql

# Attendre que MySQL soit prêt (healthcheck), puis lancer les migrations
docker compose run --rm api pnpm migration:run:prod

# Démarrer l'API
docker compose up -d
```

> `docker compose run --rm api ...` attend automatiquement que `mysql` soit
> "healthy" (`depends_on.condition: service_healthy` dans le compose file)
> avant de lancer la commande.

Vérifie :

```bash
docker compose ps
curl http://localhost:30080/health
# -> {"ok":true}
```

## 5. Configurer le reverse proxy

Sur la machine où tourne ton reverse proxy (celui qui a déjà le certificat
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

Puis depuis l'extérieur :

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
   sur `portfolio-vm`, ci-dessous) qui : `docker compose pull`, lance les
   migrations (`docker compose run --rm api pnpm migration:run:prod`), puis
   `docker compose up -d` pour redémarrer l'API avec la nouvelle image.

### Installer le runner self-hébergé sur `portfolio-vm`

Sur GitHub : Settings → Actions → Runners → "New self-hosted runner", choisir
Linux x64, puis suivre les commandes affichées (téléchargement de
`actions-runner-linux-x64-*.tar.gz`, `./config.sh --url ... --token ...`).

Installe-le ensuite comme service pour qu'il tourne en continu :

```bash
sudo ./svc.sh install
sudo ./svc.sh start
```

Le runner doit pouvoir exécuter `docker compose` dans `/opt/aparte` :
ajoute l'utilisateur sous lequel tourne le service du runner au groupe
`docker` (`sudo usermod -aG docker <user-du-runner>`), et vérifie qu'il a le
droit d'écrire/lire dans `/opt/aparte` (même utilisateur que celui qui a créé
le dossier à l'étape 2, ou ajuste les permissions).

### Premier déploiement automatique

Une fois le runner actif, un push sur `main` qui touche `apps/api/**`
déclenche automatiquement build → push ghcr.io → migration → redémarrage.

## 7. Sauvegardes

Les données vivent dans deux volumes Docker (`mysql-data`, `aparte-uploads`),
stockés sous `/var/lib/docker/volumes/` sur la VM. Aucune sauvegarde
automatique n'est fournie ici — au minimum, prévoir un `cron` sur la VM qui
fait un dump périodique vers un stockage externe :

```bash
# Dump MySQL
docker compose -f /opt/aparte/docker-compose.yml exec -T mysql \
  sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" aparte' \
  > aparte-$(date +%F).sql

# Sauvegarde des uploads
docker run --rm -v aparte_aparte-uploads:/data -v "$PWD":/backup alpine \
  tar czf /backup/aparte-uploads-$(date +%F).tar.gz -C /data .
```
