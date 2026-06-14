import { hashPassword } from './password';
import { Repositories } from '../repositories';

// Compte de test exigé par Google Play pour la revue de l'app (section
// "Informations de connexion"). Créé/synchronisé au démarrage à partir du
// .env, et marqué comme email vérifié pour ne jamais être supprimé par le
// cron de purge des comptes non confirmés (voir cron/index.ts).
export async function ensureGooglePlayReviewAccount(repos: Repositories): Promise<void> {
  const email = process.env.GOOGLE_REVIEW_EMAIL;
  const password = process.env.GOOGLE_REVIEW_PASSWORD;
  if (!email || !password) return;

  const passwordHash = await hashPassword(password);
  const existing = await repos.users.findByEmail(email);

  if (!existing) {
    const user = await repos.users.create({
      email,
      passwordHash,
      displayName: 'Revue Google Play',
      birthdate: '1990-01-01',
    });
    await repos.users.markEmailVerified(user.id);
    console.log(`[seed] compte de revue Google Play créé (${email})`);
    return;
  }

  await repos.users.updatePassword(existing.id, passwordHash);
  if (!existing.emailVerifiedAt) await repos.users.markEmailVerified(existing.id);
}
