import { Router } from 'express';
import { page } from '../lib/htmlPage';

export const legalRouter = Router();

const CONTACT_EMAIL = 'devnexus59@gmail.com';

legalRouter.get('/confidentialite', (_req, res) => {
  res.type('html').send(page('Politique de confidentialité', `
<h1>Politique de confidentialité — Aparté</h1>
<p>Dernière mise à jour : 13 juin 2026.</p>

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
partagées avec aucun tiers et ne sont pas utilisées à des fins
publicitaires.</p>

<h2>2. Accès aux contacts de votre téléphone</h2>
<p>Si vous choisissez d'ajouter une présence « depuis vos contacts », l'app
vous présente le sélecteur de contacts natif de votre téléphone. Seul le
contact que vous sélectionnez explicitement (nom et numéro) est transmis à
nos serveurs — l'app n'accède jamais à l'ensemble de votre répertoire et ne
le synchronise pas.</p>

<h2>3. Sécurité</h2>
<ul>
  <li>Mots de passe hachés avec Argon2id (aucun mot de passe en clair n'est
  jamais stocké).</li>
  <li>Messages privés chiffrés au repos (AES-256-GCM).</li>
  <li>Communications chiffrées en transit (HTTPS/TLS).</li>
</ul>

<h2>4. Conservation des données</h2>
<p>Vos données sont conservées tant que votre compte est actif. En cas de
suppression de compte (voir
<a href="/legal/suppression-compte">page dédiée</a>), vos messages et vos
appareils enregistrés pour les notifications sont supprimés immédiatement et
définitivement. Les autres données liées à votre compte sont rendues
inaccessibles immédiatement et supprimées définitivement dans un délai
maximum de 30 jours, sauf obligation légale de conservation plus longue
(journaux de sécurité, conservés au maximum 12 mois).</p>

<h2>5. Vos droits</h2>
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

<h2>6. Modifications</h2>
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
