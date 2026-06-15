import { Router } from 'express';
import { page } from '../lib/htmlPage';

export const legalRouter = Router();

const CONTACT_EMAIL = 'devnexus59@gmail.com';

legalRouter.get('/mentions-legales', (_req, res) => {
  res.type('html').send(page('Mentions légales', `
<h1>Mentions légales — Aparté</h1>

<h2>Éditeur</h2>
<p>L'application Aparté est éditée à titre individuel par :</p>
<ul>
  <li>Pierre Fourdin</li>
  <li>Contact : <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></li>
</ul>

<h2>Hébergement</h2>
<p>L'application (back-end et base de données) est hébergée sur une
infrastructure privée gérée par l'éditeur.</p>

<h2>Propriété intellectuelle</h2>
<p>L'application Aparté, son code, son design et les éléments graphiques
qui la composent sont la propriété de l'éditeur, sauf mention contraire.
Toute reproduction non autorisée est interdite.</p>

<h2>Données personnelles</h2>
<p>Le traitement des données personnelles est décrit dans la
<a href="/legal/confidentialite">politique de confidentialité</a>.</p>

<h2>Contact</h2>
<p>Pour toute question relative à l'application, écrivez à
<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
`));
});

legalRouter.get('/cgu', (_req, res) => {
  res.type('html').send(page("Conditions générales d'utilisation", `
<h1>Conditions générales d'utilisation — Aparté</h1>
<p>Dernière mise à jour : 14 juin 2026.</p>

<p>L'utilisation de l'application Aparté implique l'acceptation pleine et
entière des présentes conditions générales d'utilisation (« CGU »).</p>

<h2>1. Objet</h2>
<p>Aparté est une application permettant de rester en contact avec son
cercle de proches : partage d'état émotionnel, journal personnel et
messagerie privée entre membres d'un même cercle.</p>

<h2>2. Accès au service</h2>
<p>L'inscription est réservée aux personnes majeures (18 ans et plus). La
création d'un compte nécessite une adresse email valide, confirmée par un
lien de vérification.</p>

<h2>3. Compte utilisateur</h2>
<p>Vous êtes responsable de la confidentialité de vos identifiants. Toute
activité réalisée depuis votre compte est présumée effectuée par vous.
Signalez immédiatement toute utilisation non autorisée à
<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>

<h2>4. Comportement et contenu</h2>
<p>Vous vous engagez à ne publier ou transmettre, via le journal ou la
messagerie, aucun contenu illicite, injurieux, diffamatoire ou portant
atteinte aux droits d'un tiers. L'éditeur peut suspendre ou supprimer un
compte en cas de manquement grave à ces règles.</p>

<h2>5. Données personnelles</h2>
<p>L'utilisation de l'application implique le traitement de données
personnelles décrit dans la <a href="/legal/confidentialite">politique de
confidentialité</a>, qui constitue votre consentement éclairé conformément
au RGPD et à la loi Informatique et Libertés.</p>

<h2>6. Disponibilité du service</h2>
<p>L'éditeur s'efforce d'assurer la disponibilité du service mais ne peut
garantir un fonctionnement ininterrompu. Des interruptions peuvent survenir
pour maintenance ou pour des raisons indépendantes de sa volonté.</p>

<h2>7. Responsabilité</h2>
<p>Aparté est un outil d'aide au maintien du lien social et ne se substitue
en aucun cas à un avis médical, psychologique ou d'urgence. En cas de
détresse, contactez les services d'urgence ou une ligne d'écoute dédiée.</p>

<h2>8. Résiliation</h2>
<p>Vous pouvez supprimer votre compte à tout moment depuis l'application
(voir <a href="/legal/suppression-compte">suppression de compte</a>).
L'éditeur peut résilier l'accès au service en cas de violation des
présentes CGU.</p>

<h2>9. Droit applicable</h2>
<p>Les présentes CGU sont soumises au droit français. Tout litige relève de
la compétence des juridictions françaises, sous réserve des règles
impératives de protection du consommateur.</p>

<h2>10. Modifications</h2>
<p>Les présentes CGU peuvent être modifiées ; la date de dernière
modification est indiquée en haut de cette page. En cas de modification
substantielle, un nouveau consentement pourra être demandé.</p>
`));
});

legalRouter.get('/confidentialite', (_req, res) => {
  res.type('html').send(page('Politique de confidentialité', `
<h1>Politique de confidentialité — Aparté</h1>
<p>Dernière mise à jour : 15 juin 2026.</p>

<p>Aparté (« l'application », « nous ») est éditée à titre individuel par
Pierre Fourdin, responsable du traitement des données personnelles décrites
ci-dessous. Pour toute question ou demande relative à vos données, contactez
<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>

<h2>1. Données collectées</h2>
<table>
  <tr><th>Donnée</th><th>Finalité</th><th>Base légale</th></tr>
  <tr><td>Email, mot de passe (haché, jamais stocké en clair)</td><td>Création et sécurisation du compte</td><td>Exécution du contrat (CGU)</td></tr>
  <tr><td>Prénom / surnom affiché, date de naissance</td><td>Identification, vérification de l'âge minimum (18 ans)</td><td>Exécution du contrat</td></tr>
  <tr><td>Numéro de téléphone (optionnel)</td><td>Retrouver un·e proche déjà inscrit·e</td><td>Consentement</td></tr>
  <tr><td>Photo de profil</td><td>Identification visuelle dans le cercle</td><td>Exécution du contrat</td></tr>
  <tr><td>Présences ajoutées au cercle (nom, téléphone éventuel d'un contact)</td><td>Construction de votre cercle de proches</td><td>Consentement</td></tr>
  <tr><td>Entrées de journal (texte)</td><td>Fonctionnalité de journal personnel</td><td>Exécution du contrat</td></tr>
  <tr><td>État émotionnel partagé</td><td>Affichage de votre disponibilité à votre cercle</td><td>Exécution du contrat</td></tr>
  <tr><td>Messages privés (chiffrés au repos, AES-256-GCM)</td><td>Messagerie entre membres d'un même cercle</td><td>Exécution du contrat</td></tr>
  <tr><td>Jeton de notification push, type d'appareil</td><td>Envoi de notifications</td><td>Consentement</td></tr>
  <tr><td>Adresse IP, journal d'actions de sécurité</td><td>Prévention de la fraude, sécurité du service</td><td>Intérêt légitime</td></tr>
</table>

<p>Aparté n'intègre <strong>aucun outil publicitaire ni de mesure
d'audience tiers</strong> (pas d'AdMob, pas d'analytics). Vos données ne sont
partagées avec aucun tiers à des fins publicitaires — voir toutefois la
section « Services tiers » ci-dessous concernant les suggestions générées par
IA.</p>

<h2>2. Services tiers — suggestions générées par IA</h2>
<p>Aparté propose, à titre optionnel, des suggestions générées par
intelligence artificielle (idées d'accroche pour relancer une conversation,
idées d'écriture pour votre journal, et certaines des « questions de la
semaine »). Ces suggestions sont générées via l'API d'<strong>OpenAI</strong>
(OpenAI, L.L.C., États-Unis), qui agit en tant que sous-traitant.</p>
<p>Seules des <strong>métadonnées minimales, calculées par nos serveurs</strong>,
sont transmises à OpenAI : par exemple le nombre de jours depuis votre dernier
message avec une personne de votre cercle, les libellés de votre état
émotionnel et de celui de cette personne, les catégories de vos entrées de
journal récentes, ou la liste des questions hebdomadaires déjà existantes.
<strong>Le contenu de vos messages privés et de votre journal n'est jamais
transmis à OpenAI.</strong></p>
<p>Ces fonctionnalités sont désactivées automatiquement (aucune suggestion
n'est générée) si le service n'est pas configuré, sans impact sur le reste de
l'application.</p>

<h2>3. Accès aux contacts de votre téléphone</h2>
<p>Si vous choisissez d'ajouter une présence « depuis vos contacts », l'app
vous présente le sélecteur de contacts natif de votre téléphone. Seul le
contact que vous sélectionnez explicitement (nom et numéro) est transmis à
nos serveurs — l'app n'accède jamais à l'ensemble de votre répertoire et ne
le synchronise pas.</p>

<h2>4. Sécurité</h2>
<ul>
  <li>Mots de passe hachés avec Argon2id (aucun mot de passe en clair n'est
  jamais stocké).</li>
  <li>Messages privés chiffrés au repos (AES-256-GCM).</li>
  <li>Communications chiffrées en transit (HTTPS/TLS).</li>
</ul>

<h2>5. Conservation des données</h2>
<p>Vos données sont conservées tant que votre compte est actif. En cas de
suppression de compte (voir
<a href="/legal/suppression-compte">page dédiée</a>), vos messages et vos
appareils enregistrés pour les notifications sont supprimés immédiatement et
définitivement. Les autres données liées à votre compte sont rendues
inaccessibles immédiatement et supprimées définitivement dans un délai
maximum de 30 jours, sauf obligation légale de conservation plus longue
(journaux de sécurité, conservés au maximum 12 mois).</p>

<h2>6. Vos droits</h2>
<p>Conformément au Règlement Général sur la Protection des Données (RGPD) et
à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de
rectification, d'effacement, de limitation, d'opposition et de portabilité
sur vos données. Vous pouvez exercer ces droits :</p>
<ul>
  <li>directement dans l'app (export et suppression de compte) ;</li>
  <li>par email à <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</li>
</ul>
<p>Vous disposez également du droit d'introduire une réclamation auprès de
la CNIL (<a href="https://www.cnil.fr">www.cnil.fr</a>).</p>

<h2>7. Modifications</h2>
<p>Cette politique peut être mise à jour ; la date de dernière modification
est indiquée en haut de cette page.</p>
`));
});

legalRouter.get('/suppression-compte', (_req, res) => {
  res.type('html').send(page('Suppression de compte', `
<h1>Suppression de compte — Aparté</h1>

<h2>Depuis l'application (recommandé)</h2>
<ol>
  <li>Ouvrir Aparté et se connecter.</li>
  <li>Aller dans <strong>Profil → Paramètres → Supprimer mon compte</strong>.</li>
  <li>Confirmer avec votre mot de passe.</li>
</ol>
<p>La suppression est immédiate : votre compte devient inaccessible, vos
messages et appareils enregistrés sont supprimés définitivement sur le
champ. Le détail de la conservation des autres données est décrit dans la
<a href="/legal/confidentialite">politique de confidentialité</a>.</p>

<h2>Sans accès à l'application</h2>
<p>Si vous ne pouvez pas vous connecter à l'application, envoyez une demande
de suppression de compte à
<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> depuis l'adresse
email associée à votre compte Aparté. Votre demande sera traitée dans un
délai maximum de 30 jours.</p>

<h2>Données concernées</h2>
<p>La suppression porte sur l'ensemble des données décrites dans la
<a href="/legal/confidentialite">politique de confidentialité</a> : compte,
profil, photo, présences (cercle), entrées de journal, états émotionnels et
messages.</p>
`));
});
