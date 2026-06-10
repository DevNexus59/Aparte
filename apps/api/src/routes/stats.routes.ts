import { Router } from 'express';
import { services } from '../services';
import { asyncHandler } from '../middlewares/errorHandler';
import { requireAuth, currentUser, AuthedRequest } from '../middlewares/auth';

export const statsRouter = Router();

// Stats non-anxiogènes (spec §10) : compteurs personnels, jamais de comparaison.
statsRouter.get('/me', requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
  const stats = await services.stats.getMyStats(currentUser(req).id);
  res.json(stats);
}));
