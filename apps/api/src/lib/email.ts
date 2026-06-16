import { Resend } from 'resend';

const FROM = process.env.EMAIL_FROM ?? 'Aparté <noreply@aparte.pierrefourdin.dev>';
const PUBLIC_URL = process.env.APP_PUBLIC_URL ?? 'http://localhost:4000';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface SendOptions {
  to: string;
  subject: string;
  html: string;
}

// Sans clé Resend (dev/test) : on journalise au lieu d'envoyer, pour ne pas
// bloquer le flux et permettre de récupérer le lien depuis les logs.
async function send({ to, subject, html }: SendOptions): Promise<void> {
  if (!resend) {
    console.log(`[email] (dev, non envoyé) à ${to} — ${subject}`);
    return;
  }
  await resend.emails.send({ from: FROM, to, subject, html });
}

export function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${PUBLIC_URL}/auth/verify-email?token=${encodeURIComponent(token)}`;
  return send({
    to,
    subject: 'Confirme ton compte Aparté',
    html: `
      <p>Bienvenue sur Aparté !</p>
      <p>Confirme ton adresse email pour activer ton compte (valable 24h) :</p>
      <p><a href="${link}">${link}</a></p>
      <p>Si tu n'as pas créé de compte, ignore cet email — il sera supprimé automatiquement.</p>
    `,
  });
}

export function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  return send({
    to,
    subject: 'Réinitialisation de ton mot de passe Aparté',
    html: `
      <p>Tu as demandé la réinitialisation de ton mot de passe Aparté.</p>
      <p>Voici ton code de réinitialisation (valable 1h), à saisir dans
      l'application :</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${token}</p>
      <p>Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>
    `,
  });
}
