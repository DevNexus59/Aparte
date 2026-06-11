# Préparation publication — Google Play

> Checklist de mise en production : ce qu'il reste à traiter pour soumettre
> l'app sur le Google Play Store, passer la revue de sécurité/conformité de
> Google, et préparer (sans l'activer) une intégration publicitaire.
> Complète les audits sécurité (`03-audit-initial.md`, `04-audit-v2.md`),
> qui restent la référence pour le détail technique des items hérités.
>
> Conventions : 🔴 bloquant pour la soumission/revue · 🟠 à faire avant
> l'ouverture au public · 🟡 recommandé, différable · 🟢 préparé, décision
> différée.

---

## A. Spécifique Google Play

### 🔴 D1. URL API en HTTP / IP locale

**Lieu** : `apps/app/app.json > extra.apiUrl` (`http://192.168.1.87:4000`)
**Constat** : Android bloque par défaut le trafic non chiffré
(`usesCleartextTraffic=false` depuis l'API 28) sur les builds release. Une
IP locale n'est de toute façon pas joignable hors du réseau du dev.
**Correction** : domaine HTTPS public pointant vers l'API (certificat
valide), avant tout build de test/prod.

### 🔴 D2. Pas de configuration EAS (signature, versioning)

**Lieu** : racine `apps/app` — aucun `eas.json`
**Constat** : Play App Signing nécessite un build signé via EAS (ou un
keystore géré manuellement). `app.json` n'a pas de `android.versionCode`.
**Correction** : créer un projet EAS, `eas.json` avec profils
`development`/`preview`/`production`, initialiser `versionCode`
(incrémenté à chaque soumission).

### 🔴 D3. Politique de confidentialité publique absente

**Lieu** : aucune page trouvée (le contenu existe en substance au §8 de
`01-spec-mvp.md`)
**Constat** : Play exige une URL publique vers une politique de
confidentialité pour toute app avec compte utilisateur — champ obligatoire
de la fiche store.
**Correction** : rédiger une page (markdown hébergé / site statique
suffit) couvrant : données collectées (compte, photo, journal, états
émotionnels, messages), finalité, durée de conservation, droits RGPD,
sous-traitants (hébergeur, futur AdMob si activé — voir section C).

### 🔴 D4. Suppression de compte — procédure web publique manquante

**Lieu** : `DeleteAccountSheet` (in-app, existant et fonctionnel)
**Constat** : depuis 2023, Play exige un lien web public vers la procédure
de suppression de compte/données, **en plus** du in-app — accessible même
sans avoir l'app installée.
**Correction** : page statique expliquant la marche à suivre (ou
formulaire de demande), URL renseignée dans la Play Console.

### 🔴 D5. Formulaire « Sécurité des données » (Data Safety)

**Lieu** : Play Console → fiche de l'app
**Constat** : à remplir avant publication — déclarer les données
collectées (compte, photo, état émotionnel, messages), si elles sont
chiffrées en transit, si elles sont supprimables, et tout partage avec des
tiers.
**Correction** : préparer le mapping données ↔ déclarations à partir du §8
RGPD de la spec. À mettre à jour si la pub (section C) est activée
(partage avec Google/AdMob).

### 🔴 D6. Classification du contenu (IARC) & ciblage adulte

**Lieu** : Play Console → questionnaire de classification
**Constat** : app avec contenu généré par les utilisateurs, messagerie, et
un age-gate 18+ (§8) — le questionnaire IARC doit refléter ça honnêtement,
avec un ciblage cohérent (hors programme « Designed for Families »).
**Correction** : remplir le questionnaire en cohérence avec le périmètre
Trust & Safety déjà défini.

### 🟡 D7. Compte développeur Play + test fermé obligatoire

**Constat** : vérification d'identité à l'inscription (peut prendre
plusieurs jours) ; pour les comptes personnels créés récemment, Google
impose un test fermé avec un nombre minimum de testeurs pendant une durée
minimale avant l'accès à la production (politique à reconfirmer au moment
de la création du compte — elle évolue régulièrement).
**Correction** : démarrer la création du compte développeur et le test
fermé tôt — c'est un délai largement incompressible, indépendant de
l'avancement technique.

### 🟡 D8. Play Integrity API (optionnel)

**Constat** : permettrait de vérifier côté API que les requêtes viennent
bien d'une app non modifiée — complément naturel à B3/B4 (anti-abus).
**Correction** : à évaluer après la mise en place de Redis (section B), pas
bloquant pour une première soumission.

---

## B. TODOs sécurité hérités — à boucler avant publication

Ces points sont déjà documentés dans les audits ; ils sont repris ici parce
qu'ils conditionnent une ouverture publique (et donc la publication Play),
pas seulement la « qualité » du code.

### 🟠 M12. Push hebdo : fuseau horaire de l'utilisateur

Déjà documenté dans `04-audit-v2.md` (« à faire avant tout déploiement
public »). Sans ça, des users hors UE/Afrique reçoivent la notif hebdo en
pleine nuit — contraire à la promesse « pas de notifications agressives »
(§4) dès le premier jour public.

### 🟠 I13. Photo de profil obligatoire — middleware `requirePhoto`

Déjà documenté dans `03/04-audit*.md` (🟡 partiel — front en place, pas
d'enforcement serveur). Règle métier explicite du §7 ; à boucler avant
publication pour que la promesse produit soit réelle dès le premier user
public.

### 🟡 B3. Rate-limit en mémoire ne tient pas en cluster

Déjà documenté dans `03-audit-initial.md`. Si le déploiement initial est
mono-instance, peut suivre la charge réelle — mais à garder en tête dès
qu'une 2e instance est ajoutée (l'auto-scaling Play peut créer un pic de
trafic après publication).

### 🟡 B4. Blacklist d'access tokens en mémoire

Déjà documenté dans `03-audit-initial.md`. Même bascule Redis que B3,
naturellement groupées.

### 🟡 I8. SecureStore Android sans verrou device

Déjà documenté dans `03-audit-initial.md`. Pas un critère du scan
automatique de Play, mais à garder dans le même sprint de durcissement
avant l'ouverture publique.

---

## C. Préparation publicité (intégration différée)

Le format n'est pas encore décidé (voir `01-spec-mvp.md` §14). On prépare
la mécanique technique sans l'activer, pour ne pas bloquer la suite sur une
décision produit.

### 🟢 D9. SDK publicitaire + consentement RGPD (UMP)

**Approche** : `react-native-google-mobile-ads` (remplaçant standard
d'`expo-ads-admob`, retiré du SDK Expo) + son module **UMP** (consentement
RGPD/TCF), intégrés avec des IDs de **test** et une publicité **désactivée
par défaut** (flag de config). Le format réel (bannière ou autre) sera
branché une fois la décision prise (§14) et le compte AdMob créé/approuvé
par toi — je ne peux pas créer ce compte.

### 🟢 D10. Data Safety & politique de confidentialité — volet publicité

**Constat** : si la pub est activée plus tard, le formulaire Data Safety
(D5) et la politique de confidentialité (D3) devront être mis à jour pour
déclarer le partage de données avec Google/AdMob (identifiant publicitaire,
etc.).
**Correction** : à traiter au moment de l'activation, pas avant — éviter de
déclarer un partage de données qui n'existe pas encore.

### 🟡 D11. Nom final de l'app — vérification de marque complète

**Constat** : une recherche préliminaire (App Store/Play Store + INPI) sur
« Cercle » a identifié des conflits significatifs : une app « Cercle App »
existe déjà sur l'App Store FR, « Mon Cercle » occupe un positionnement
quasi identique (cercle privé, sans pub), et une marque « CERCLE » est
probablement déposée en classe 9 (logiciels). Nouveau nom de travail
retenu : **« Aparté »** — recherche préliminaire propre (aucune app ni
marque logiciel identifiée), un point dans le BOPI non vérifié.
**Correction** : avant tout dépôt de marque INPI ou investissement
branding (logo, store listing, domaine, bundle id), faire une recherche
d'antériorités complète (outil officiel INPI ou conseil en propriété
industrielle) sur « Aparté ». Le mot « Cercle » reste utilisé dans
`01-spec-mvp.md` pour désigner la fonctionnalité « ton cercle de proches »
(§7, §10) — pas de renommage de code/bundle id à ce stade.

---

## Ordre suggéré

1. **D1, D3, D4, D5, D6** — bloquants Play, indépendants du code
   applicatif (config, pages, formulaires).
2. **D2** — config EAS + premier build de test interne.
3. **M12, I13** — déjà « avant public » dans les audits, à boucler
   maintenant.
4. **B3, B4, I8** — durcissement, peut suivre selon le calendrier de D7
   (test fermé).
5. **D7** — à démarrer en parallèle dès que possible (délai
   incompressible).
6. **D11** — recherche d'antériorités complète sur « Aparté », à boucler
   avant D6 (la fiche store a besoin du nom final) et avant tout dépôt de
   marque.
7. **D9, D10** — préparation pub, sans urgence tant que le format (§14)
   n'est pas choisi.
8. **D8** — optionnel, après B3/B4.

## Statut détaillé

| # | Item | Statut |
|---|---|---|
| D1 | URL API HTTPS publique | ⬜ à faire |
| D2 | Config EAS (signature, versioning) | ⬜ à faire |
| D3 | Politique de confidentialité publique | ⬜ à faire |
| D4 | Suppression de compte — page web | ⬜ à faire |
| D5 | Formulaire Data Safety | ⬜ à faire |
| D6 | Classification contenu (IARC) | ⬜ à faire |
| D7 | Compte développeur + test fermé | ⬜ à faire |
| D8 | Play Integrity API | ⬜ optionnel |
| M12 | Push hebdo — fuseaux | 🟡 cf. `04-audit-v2.md` |
| I13 | Photo obligatoire — `requirePhoto` | 🟡 cf. `03/04-audit*.md` |
| B3 | Rate-limit cluster (Redis) | 🟡 cf. `03-audit-initial.md` |
| B4 | Blacklist tokens (Redis) | 🟡 cf. `03-audit-initial.md` |
| I8 | SecureStore Android | 🟡 cf. `03-audit-initial.md` |
| D9 | SDK pub + UMP (préparation) | 🟢 différé — décision format |
| D10 | Data Safety / politique — volet pub | 🟢 différé — au moment de l'activation |
| D11 | Nom final + recherche d'antériorités complète | 🟡 « Aparté » retenu, vérif. INPI complète à faire |
