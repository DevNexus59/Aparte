import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { services } from '../services';
import { asyncHandler, AppError } from "../middlewares/errorHandler";
import { parseBody as parse } from "../lib/validation";
import { hashToken } from '../lib/jwt';
import { page, escapeHtml } from '../lib/htmlPage';
import { requireAuth, currentUser, AuthedRequest } from '../middlewares/auth';

export const authRouter = Router();

// SEC-06 : 3 tentatives / 15 min par IP — séparé du budget global auth.
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 3,
  standardHeaders: 'draft-7', legacyHeaders: false,
});

// SEC-05 : 3 renvois / 15 min par IP pour éviter le spam d'emails.
const resendVerifLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 3,
  standardHeaders: 'draft-7', legacyHeaders: false,
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),                  // I5 : longueur > complexité
  confirmPassword: z.string().min(12),
  displayName: z.string().min(1).max(80),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phone: z.string().max(30).optional(),
  acceptTerms: z.literal(true),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({ refreshToken: z.string().min(10) });

const deleteAccountSchema = z.object({ password: z.string().min(12) });

const forgotPasswordSchema = z.object({ email: z.string().email() });

const resetPasswordSchema = z.object({
  code: z.string().length(64).regex(/^[0-9a-f]+$/),
  newPassword: z.string().min(12),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(12),
});

const verifyEmailSchema = z.object({ token: z.string().min(1) });

function ctxOf(req: { ip?: string; get(h: string): string | undefined }) {
  return { ip: req.ip, userAgent: req.get('user-agent') ?? undefined };
}

authRouter.post('/register', asyncHandler(async (req, res) => {
  const input = parse(registerSchema, req.body);
  const result = await services.auth.register(input, ctxOf(req));
  res.status(201).json(result);
}));

authRouter.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = parse(loginSchema, req.body);
  const result = await services.auth.login(email, password, ctxOf(req));
  res.json(result);
}));

authRouter.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = parse(refreshSchema, req.body);
  const result = await services.auth.refresh(refreshToken, ctxOf(req));
  res.json(result);
}));

// SEC-04 : requireAuth pour que req.accessToken soit populé et blacklisté.
authRouter.post('/logout', requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
  const { refreshToken } = parse(refreshSchema, req.body);
  await services.auth.logout(refreshToken, req.accessToken);
  res.status(204).send();
}));

// I3 : déconnecter toutes les autres sessions, en gardant la courante.
authRouter.post('/logout-all', requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
  const { refreshToken } = parse(refreshSchema, req.body);
  await services.auth.logoutAllOtherSessions(currentUser(req).id, hashToken(refreshToken));
  res.status(204).send();
}));

// RGPD : droit à la portabilité — export JSON de toutes les données personnelles.
authRouter.get('/export', requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
  const data = await services.auth.exportData(currentUser(req).id);
  res.setHeader('Content-Disposition', 'attachment; filename="aparte-export.json"');
  res.json(data);
}));

// RGPD : droit à l'effacement — re-confirmation du mot de passe requise.
authRouter.delete('/me', requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
  const { password } = parse(deleteAccountSchema, req.body);
  await services.auth.deleteAccount(currentUser(req).id, password, ctxOf(req), req.accessToken);
  res.status(204).send();
}));

// Mot de passe oublié : envoie un code de réinitialisation par email.
// Réponse toujours 204, même si l'email n'existe pas (anti-énumération).
authRouter.post('/forgot-password', forgotPasswordLimiter, asyncHandler(async (req, res) => {
  const { email } = parse(forgotPasswordSchema, req.body);
  await services.auth.requestPasswordReset(email, ctxOf(req));
  res.status(204).send();
}));

// Confirmation de la réinitialisation via le code reçu par email.
authRouter.post('/reset-password', asyncHandler(async (req, res) => {
  const { code, newPassword } = parse(resetPasswordSchema, req.body);
  await services.auth.confirmPasswordReset(code, newPassword);
  res.status(204).send();
}));

// Changement de mot de passe par un utilisateur connecté — vérifie l'ancien mot de passe.
authRouter.post('/change-password', requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
  const { oldPassword, newPassword } = parse(changePasswordSchema, req.body);
  await services.auth.changePassword(currentUser(req).id, oldPassword, newPassword, ctxOf(req));
  res.status(204).send();
}));

// Renvoi de l'email de confirmation de compte.
authRouter.post('/resend-verification', requireAuth, resendVerifLimiter, asyncHandler(async (req: AuthedRequest, res) => {
  await services.auth.resendVerificationEmail(currentUser(req).id);
  res.status(204).send();
}));

// Lien cliqué depuis l'email de confirmation — page HTML de résultat.
authRouter.get('/verify-email', asyncHandler(async (req, res) => {
  const { token } = parse(verifyEmailSchema, req.query);
  try {
    await services.auth.verifyEmail(token);
    res.type('html').send(page('Compte confirmé', `
      <h1>Ton compte est confirmé !</h1>
      <p>Tu peux retourner sur l'application Aparté et continuer à l'utiliser.</p>
    `));
  } catch (err) {
    const message = err instanceof AppError ? err.message : 'Lien invalide ou expiré';
    res.type('html').send(page('Lien invalide', `
      <h1>Lien invalide ou expiré</h1>
      <p>${escapeHtml(message)}</p>
      <p>Reconnecte-toi à l'application pour demander un nouveau lien de confirmation.</p>
    `));
  }
}));
