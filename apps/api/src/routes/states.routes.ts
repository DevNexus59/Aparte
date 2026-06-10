import { Router } from 'express';
import { z } from 'zod';
import { services } from '../services';
import { requireAuth, currentUser, AuthedRequest } from '../middlewares/auth';
import { asyncHandler, AppError } from "../middlewares/errorHandler";
import { parseBody as parse } from "../lib/validation";

export const statesRouter = Router();
statesRouter.use(requireAuth);

const setStateSchema = z.object({
  state: z.enum(['need_to_talk', 'socially_tired', 'available', 'want_to_see']),
  durationHours: z.number().int().min(1).max(72).optional(),
});

statesRouter.put('/me', asyncHandler(async (req: AuthedRequest, res) => {
  const { state, durationHours } = parse(setStateSchema, req.body);
  const result = await services.states.set(currentUser(req).id, state, durationHours);
  res.status(201).json({ state: result });
}));

statesRouter.get('/me', asyncHandler(async (req: AuthedRequest, res) => {
  const state = await services.states.getMyCurrent(currentUser(req).id);
  res.json({ state });
}));

statesRouter.delete('/me', asyncHandler(async (req: AuthedRequest, res) => {
  await services.states.clearMine(currentUser(req).id);
  res.status(204).send();
}));

statesRouter.get('/circle', asyncHandler(async (req: AuthedRequest, res) => {
  const states = await services.states.listCircle(currentUser(req).id);
  res.json({ states });
}));
