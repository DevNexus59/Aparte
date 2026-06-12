import { Router } from 'express';
import { z } from 'zod';
import { services } from '../services';
import { asyncHandler, AppError } from "../middlewares/errorHandler";
import { parseBody as parse } from "../lib/validation";
import { hashToken } from '../lib/jwt';
import { requireAuth, currentUser, AuthedRequest } from '../middlewares/auth';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),                  // I5 : longueur > complexité
  displayName: z.string().min(1).max(80),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phone: z.string().max(30).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({ refreshToken: z.string().min(10) });

const deleteAccountSchema = z.object({ password: z.string().min(1) });

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

authRouter.post('/logout', asyncHandler(async (req: AuthedRequest, res) => {
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

// RGPD : droit à l'effacement — re-confirmation du mot de passe requise.
authRouter.delete('/me', requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
  const { password } = parse(deleteAccountSchema, req.body);
  await services.auth.deleteAccount(currentUser(req).id, password, ctxOf(req), req.accessToken);
  res.status(204).send();
}));
