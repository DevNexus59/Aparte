import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { services } from '../services';
import { requireAuth, currentUser, AuthedRequest } from '../middlewares/auth';
import { asyncHandler, AppError } from "../middlewares/errorHandler";
import { parseBody as parse } from "../lib/validation";

export const pushRouter = Router();
pushRouter.use(requireAuth);

// I11 : empêche un user de spammer 10 000 tokens.
const deviceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const registerSchema = z.object({
  token: z.string().min(10).max(255),
  platform: z.enum(['ios', 'android', 'web']),
  deviceInfo: z.string().max(255).optional(),
});

const forgetSchema = z.object({
  token: z.string().min(10).max(255),
});

pushRouter.post('/devices', deviceLimiter, asyncHandler(async (req: AuthedRequest, res) => {
  const input = parse(registerSchema, req.body);
  await services.push.registerDevice({
    userId: currentUser(req).id,
    ...input,
  });
  res.status(204).send();
}));

pushRouter.delete('/devices', deviceLimiter, asyncHandler(async (req: AuthedRequest, res) => {
  const { token } = parse(forgetSchema, req.body);
  await services.push.dropDeviceByToken(currentUser(req).id, token);
  res.status(204).send();
}));
