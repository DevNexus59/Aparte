import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { services } from '../services';
import { requireAuth, currentUser, AuthedRequest } from '../middlewares/auth';
import { asyncHandler, AppError } from "../middlewares/errorHandler";
import { parseBody as parse } from "../lib/validation";

export const heartbeatRouter = Router();
heartbeatRouter.use(requireAuth);

const journalSchema = z.object({
  content: z.string().min(1).max(5000),
  type: z.enum(['gratitude', 'memory', 'reflection']),
  linkId: z.string().uuid().optional(),
  promptId: z.number().int().positive().optional(),
});

const nudgeStatusSchema = z.object({ status: z.enum(['acted', 'dismissed']) });

// Anti cost-amplification : la mise en cache côté AIService limite déjà les
// appels OpenAI, ce rate limit borne le coût même si le cache est contourné.
const journalSuggestionsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

heartbeatRouter.get('/prompt', asyncHandler(async (_req, res) => {
  const prompt = await services.heartbeat.getCurrentWeeklyPrompt();
  res.json({ prompt });
}));

heartbeatRouter.get('/journal/suggestions', journalSuggestionsLimiter, asyncHandler(async (req: AuthedRequest, res) => {
  const suggestions = await services.ai.getJournalSuggestions(currentUser(req).id);
  res.json({ suggestions });
}));

heartbeatRouter.post('/journal', asyncHandler(async (req: AuthedRequest, res) => {
  const input = parse(journalSchema, req.body);
  const result = await services.heartbeat.addJournalEntry({
    userId: currentUser(req).id,
    ...input,
  });
  res.status(201).json(result);
}));

// M3 : pagination cursor — ?before=<iso>&limit=20
heartbeatRouter.get('/journal', asyncHandler(async (req: AuthedRequest, res) => {
  const before = typeof req.query.before === 'string' ? req.query.before : undefined;
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
  const page = await services.heartbeat.listJournal(currentUser(req).id, { before, limit });
  res.json(page);
}));

heartbeatRouter.get('/nudges', asyncHandler(async (req: AuthedRequest, res) => {
  const nudges = await services.heartbeat.listSuggestedNudges(currentUser(req).id);
  res.json({ nudges });
}));

heartbeatRouter.patch('/nudges/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const { status } = parse(nudgeStatusSchema, req.body);
  await services.heartbeat.updateNudgeStatus(currentUser(req).id, req.params.id, status);
  res.status(204).send();
}));
