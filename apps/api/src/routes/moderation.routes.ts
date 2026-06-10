import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { services } from '../services';
import { requireAuth, requireRole, currentUser, AuthedRequest } from '../middlewares/auth';
import { asyncHandler, AppError } from "../middlewares/errorHandler";
import { parseBody as parse } from "../lib/validation";

export const moderationRouter = Router();
moderationRouter.use(requireAuth);

// M8 : rate limit applicatif sur le signalement — un user ne spamme pas 100 reports.
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const reportSchema = z.object({
  reportedUserId: z.string().uuid().optional(),
  reason: z.enum(['sexual', 'discriminatory', 'harassment', 'other']),
  contentType: z.string().min(1).max(40),
  contentId: z.string().uuid().optional(),
  description: z.string().max(2000).optional(),
});

const resolveSchema = z.object({ status: z.enum(['resolved', 'dismissed']) });

const actSchema = z.object({
  targetUserId: z.string().uuid(),
  action: z.enum(['warning', 'suspension', 'ban']),
  reason: z.string().min(1).max(500),
  reportId: z.string().uuid().optional(),
  durationMinutes: z.number().int().positive().optional(),
});

// User : signaler.
moderationRouter.post('/reports', reportLimiter, asyncHandler(async (req: AuthedRequest, res) => {
  const input = parse(reportSchema, req.body);
  const report = await services.moderation.fileReport({
    reporterUserId: currentUser(req).id,
    ...input,
  });
  res.status(201).json({ report });
}));

// Modération : lire la file ouverte.
moderationRouter.get(
  '/reports',
  requireRole('moderator', 'admin'),
  asyncHandler(async (req, res) => {
    const before = typeof req.query.before === 'string' ? req.query.before : undefined;
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const page = await services.moderation.listOpenReports(before, limit);
    res.json(page);
  }),
);

// Modération : résoudre un signalement.
moderationRouter.patch(
  '/reports/:id',
  requireRole('moderator', 'admin'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { status } = parse(resolveSchema, req.body);
    await services.moderation.resolveReport(req.params.id, status, currentUser(req).id);
    res.status(204).send();
  }),
);

// Modération : appliquer une sanction.
moderationRouter.post(
  '/actions',
  requireRole('moderator', 'admin'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = parse(actSchema, req.body);
    const action = await services.moderation.actOnUser({
      ...input,
      moderatorId: currentUser(req).id,
    });
    res.status(201).json({ action });
  }),
);
