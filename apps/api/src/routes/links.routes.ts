import { Router } from 'express';
import { z } from 'zod';
import { services } from '../services';
import { requireAuth, currentUser, AuthedRequest } from '../middlewares/auth';
import { asyncHandler, AppError } from "../middlewares/errorHandler";
import { parseBody as parse } from "../lib/validation";

export const linksRouter = Router();
linksRouter.use(requireAuth);

const createSchema = z.object({
  contactName: z.string().min(1).max(80),
  contactPhone: z.string().max(30).optional(),
  memberEmail: z.string().email().optional(),
});

const updateSchema = z.object({
  contactName: z.string().min(1).max(80).optional(),
  contactPhone: z.string().max(30).nullable().optional(),
});

linksRouter.get('/', asyncHandler(async (req: AuthedRequest, res) => {
  const links = await services.links.list(currentUser(req).id);
  res.json({ links });
}));

linksRouter.post('/', asyncHandler(async (req: AuthedRequest, res) => {
  const input = parse(createSchema, req.body);
  const link = await services.links.create({ ownerUserId: currentUser(req).id, ...input });
  res.status(201).json({ link });
}));

linksRouter.patch('/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const updates = parse(updateSchema, req.body);
  await services.links.update(req.params.id, currentUser(req).id, updates);
  res.status(204).send();
}));

linksRouter.delete('/:id', asyncHandler(async (req: AuthedRequest, res) => {
  await services.links.remove(req.params.id, currentUser(req).id);
  res.status(204).send();
}));
