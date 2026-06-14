# Notes de version — Aparté 0.3.0

Version EAS : **0.3.0**

## Nouveautés

- **Mot de passe oublié** : un nouvel écran « Mot de passe oublié ? »
  (accessible depuis l'écran de connexion) permet de recevoir un code à 6
  chiffres par email, valable 1 heure, pour choisir un nouveau mot de
  passe.
- **Changement de mot de passe depuis le profil** : un nouveau bouton
  « Changer de mot de passe » dans la page Profil ouvre un formulaire qui
  vérifie l'ancien mot de passe avant d'enregistrer le nouveau.
- **Confirmation du mot de passe à l'inscription** : le formulaire
  d'inscription demande désormais de saisir le mot de passe deux fois et
  bloque l'envoi si les deux ne correspondent pas.
- **Affichage du mot de passe** : un icône « œil » permet d'afficher ou de
  masquer temporairement le mot de passe saisi, sur tous les formulaires
  concernés (inscription, connexion, réinitialisation, changement de mot
  de passe).
- **Validation de compte par email** : à l'inscription, un email de
  confirmation est envoyé. Un compte non confirmé dans les 24 heures
  suivant sa création est automatiquement supprimé.
- **Mentions légales et politique de confidentialité** : des liens vers
  les mentions légales et la politique de confidentialité sont désormais
  disponibles depuis la page Profil.
- **Bouton de déconnexion** : la déconnexion est maintenant accessible via
  un bouton dédié sur la page Profil.

## Corrections

- **Chat entre membres d'un même cercle** : correction d'un bug empêchant
  la discussion entre deux personnes pourtant inscrites et membres du même
  cercle (le rattachement des comptes aux liens de cercle n'était pas
  toujours effectué correctement à l'inscription).
