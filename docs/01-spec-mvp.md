# Spec Produit — MVP
### (nom de travail : « Aparté » — anciennement « Cercle »)

> **Note de nommage** (voir `docs/05-publication-play-store.md`, item D11) :
> une recherche de conflits de marque a identifié des risques sérieux sur
> « Cercle » (app concurrente du même nom, positionnement quasi identique
> chez « Mon Cercle », marque déposée probable en classe logiciel). Nom de
> travail retenu : **« Aparté »** — recherche préliminaire propre,
> vérification INPI complète à faire avant tout dépôt. Le mot « Cercle »
> reste utilisé ci-dessous pour désigner la **fonctionnalité** « ton cercle
> de proches » (§7, §10) — ce n'est plus le nom de l'app.

---

## 1. Vision

Un **sanctuaire relationnel minimaliste**. Pas un réseau social : un outil pour prendre soin de 1 à 3 relations qui comptent vraiment, à contre-courant des mécaniques de dopamine.

> *« L'app qui t'aide à ne pas laisser filer les gens qui comptent. »*

---

## 2. Problème

Hyperconnexion superficielle, fatigue sociale, et des liens proches qui s'effritent faute de temps et d'attention — bouffés par le scroll. On reste « connecté » à des centaines de gens et on néglige les 3 qui comptent vraiment.

---

## 3. Cible

Jeunes adultes (~18–30) qui **ont** des liens proches mais les laissent s'effriter à mesure que la vie accélère.

Onboarding **« pourquoi tu es là »** qui branche le parcours :
- « Entretenir mes liens » → parcours MVP (invitation + entretien)
- « Créer des liens profonds » → mis en file pour la V2 (rencontre)

**Accès réservé aux 18+** — age-gate dès l'onboarding (voir Trust & Safety).

---

## 4. Principes directeurs — ce que l'app REFUSE d'être

- Pas de feed algorithmique ni de scroll infini
- Pas de streak, pas de score, pas de classement
- Pas de métriques publiques ni de likes
- Pas de notifications agressives ; le silence numérique est respecté
- Pas de course aux contacts : **3 liens max, point**

---

## 5. Mécanique cœur — le battement hebdomadaire

**question douce → entrée de journal → relance douce**

Une seule boucle, une fois par semaine :
1. L'app pose une question douce (« Qui t'a fait du bien cette semaine ? »)
2. La réponse devient une entrée du journal relationnel
3. Si pertinent, l'app glisse un nudge doux (« envie de faire signe à X ? »)

**Aucun streak, aucune pénalité si tu sautes une semaine.** La régularité est invitée, jamais imposée.

---

## 6. Décision produit clé — « couche au-dessus », pas un messager de plus

Le MVP ne reconstruit **pas** la messagerie. Les relances renvoient vers les canaux existants (appel, SMS, WhatsApp, vocal) via deep-links.

**Conséquence majeure :** l'app a de la valeur **en solo**, même si tes amis ne l'installent jamais. Elle t'aide *toi* à te souvenir et à agir ; la conversation se passe là où elle a déjà lieu.

→ Ça neutralise le piège « il faut que mes 3 potes installent l'app aussi ». L'inscription de l'ami devient un **bonus** (états partagés, souvenirs co-écrits), pas un prérequis.

---

## 7. Périmètre MVP (in scope)

| Feature | Détail |
|---|---|
| Onboarding + intention | Question « pourquoi tu es là » qui adapte le parcours |
| Le Cercle | Ajouter jusqu'à 3 liens depuis les contacts (l'autre n'a pas à être inscrit) |
| Question douce hebdo | Un prompt relationnel par semaine, sautable sans pénalité |
| Journal relationnel | Souvenirs, gratitude, moments importants |
| Relances douces | Suggestions non intrusives, deep-link vers les canaux existants |
| États émotionnels privés | « besoin de parler », « fatigué socialement », « dispo » — visibles uniquement par le cercle inscrit |
| Design | Dark mode natif, beaucoup d'espace, micro-interactions calmes |
| Photo de profil | **Obligatoire**, privée par défaut (visible par le cercle seulement) |
| Age-gate | Accès réservé aux **18+**, vérifié à l'onboarding |

---

## 8. Trust & Safety

L'app se veut « émotionnellement safe » — la sécurité fait partie de l'ADN, pas un bolt-on.

**Plancher d'âge : 18+ strict.** Age-gate dès l'onboarding. Une app de connexion avec photo obligatoire (et, en V2, mise en relation d'inconnus) ne peut pas accueillir de mineurs — non négociable, à verrouiller par design avant toute ouverture de la rencontre.

**Politique de contenu (tolérance zéro) :** aucun contenu sexuel, aucune discrimination / propos haineux, aucun harcèlement.

**Chaîne de modération en couches :**
1. Modération **automatique** à l'upload (API image + texte sur photos, bios, noms)
2. **Signalement** utilisateur (1 tap, sur tout profil ou contenu)
3. **Revue humaine** pour les cas limites et les appels
4. **Sanctions graduées** : avertissement → suspension → bannissement

> **Réalisme :** l'auto-modération seule ne suffit jamais (faux positifs + ratés). Et la photo obligatoire **≠ vérification** : sans contrôle type selfie / liveness, on peut uploader une fausse photo. En MVP (tu ajoutes tes propres contacts) la surface d'abus est faible ; la modération devient **critique** en V2 avec la rencontre d'inconnus.

**Photo de profil obligatoire**, mais **privée par défaut** (visible uniquement par ton cercle) pour ne pas créer d'anxiété d'apparence chez les users isolés qu'on veut aider.

**RGPD :** la photo est une donnée personnelle → stockage chiffré, consentement explicite, droit à la suppression complète.

---

## 9. Hors périmètre MVP (→ V2+)

- Système de **rencontre verrouillé à 3** (avec états « lien en formation » vs « lien établi »)
- Analyses relationnelles avancées
- IA de personnalisation poussée
- Messagerie E2E intégrée
- Widgets, thèmes premium, sync avancée

---

## 10. Modèle freemium (éthique)

**Gratuit :** le Cercle (3 liens), question hebdo, journal de base, relances, états émotionnels.

**Premium :**
- stats non anxiogènes (voir principe ci-dessous)
- journal enrichi (photos, audio, historique étendu)
- export des souvenirs
- thèmes
- sauvegarde / synchronisation

**Principe « stats non anxiogènes » — la ligne rouge :**
- **OK** : tournées vers soi, positives, non comparatives (« 24 moments de gratitude cette année », ressenti de connexion auto-déclaré)
- **Interdit** : tout ce qui score ou compare (jours sans contact affichés en rouge, taux de réponse, « santé » du lien, classement des amis)
- **Test** : la stat doit donner de la gratitude / du recul, **jamais** le sentiment d'être en retard

---

## 11. Risques & questions ouvertes

- **Rétention** : le battement hebdo suffit-il à créer l'habitude ? → à tester tôt
- **Monétisation** : base intime = petit marché ; taux de conversion premium à valider
- **V2 rencontre** : liquidité locale + sécurité / modération = gros chantier, dépendant d'une masse d'utilisateurs
- **Nom & branding** : à définir

---

## 12. Critères de succès du MVP

- % d'utilisateurs qui répondent à la question hebdo plusieurs semaines de suite (= habitude créée)
- Nombre de relances effectivement suivies d'une action réelle (l'app pousse-t-elle à agir ?)
- Rétention à 4 semaines **sans** notifications agressives
- Verbatim qualitatif : « je me sens plus proche de mes gens »

---

## 13. Accessibilité (conformité UE)

L'app doit être utilisable avec un lecteur d'écran (VoiceOver / TalkBack), un
contraste suffisant et sans dépendre uniquement de la couleur — exigences de
la **Directive UE 2019/882 (European Accessibility Act)**, déclinées pour le
mobile via la norme **EN 301 549**, elle-même alignée sur **WCAG 2.1 niveau AA**.
C'est un principe directeur au même titre que le Trust & Safety (§8), pas une
fonctionnalité optionnelle.

**Mis en place :**
- Tous les éléments interactifs (boutons, sélecteurs d'état, options,
  cartes cliquables) annoncent leur rôle, leur libellé et leur état
  (sélectionné / coché / désactivé / en cours) aux lecteurs d'écran.
- Les titres d'écran et de section sont navigables comme « titres ».
- Le réglage OS « Réduire les animations » est respecté : l'orbe (Battement,
  Cercle, sélecteur d'état) cesse de « respirer ».
- Contrastes texte conformes AA (4.5:1 minimum) ; les couleurs des états
  émotionnels (orbes) atteignent ≥ 5:1 sur tous les fonds de l'app (norme
  non-textuelle WCAG 1.4.11 : 3:1 minimum).
- Sur l'écran Cercle, l'état d'un proche n'est plus signalé **seulement**
  par la couleur de son orbe : le libellé (« Disponible », « Fatigué·e
  socialement »…) est inclus dans sa description vocale.
- Les fenêtres modales (signaler, supprimer le compte, poser sa lueur, fiche
  de lien) isolent le focus du lecteur d'écran : le contenu derrière n'est
  plus atteignable tant que la fenêtre est ouverte.
- Langue de l'app déclarée (français) pour une prononciation correcte par
  VoiceOver/TalkBack.
- Un lint dédié (`eslint-plugin-react-native-a11y`, `pnpm --filter
  cercle-app lint`) tourne en CI pour empêcher les régressions
  d'accessibilité sur les futurs écrans.

**Reste à faire :** tests manuels VoiceOver (iOS) et TalkBack (Android) sur
le parcours complet — seule façon de valider une conformité EN 301 549
réelle, non automatisable.

---

## 14. Publicité (préparation, format non figé)

Le modèle économique repose d'abord sur le freemium éthique (§10). La
publicité est envisagée comme **revenu complémentaire**, pas comme
fondation : elle doit respecter les principes du §4 ou ne pas exister.

**Principes (non négociables, indépendants du format choisi) :**
- Jamais sur les écrans cœur (Battement, Cercle, sélecteur d'état) — la
  boucle hebdomadaire reste intacte et silencieuse.
- Jamais de format qui interrompt une action en cours (pas d'interstitiel
  entre deux écrans, pas de rewarded video imposé).
- **Premium reste sans publicité** — ça devient un avantage Premium
  supplémentaire, cohérent avec le §10.
- Consentement RGPD (UE/France) systématique avant toute publicité
  personnalisée — pas de tracking publicitaire silencieux.

**Format et emplacement : à décider.** Une bannière discrète sur un écran
secondaire (Journal/Stats) est l'option la plus alignée avec l'esprit de
l'app, mais rien n'est figé.

**État de la préparation technique :** voir
`docs/05-publication-play-store.md` (section C) — le SDK et le consentement
RGPD peuvent être intégrés en amont, publicité désactivée par défaut, en
attendant la décision de format et la création du compte AdMob.
