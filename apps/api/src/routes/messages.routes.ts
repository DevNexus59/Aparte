import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { services } from '../services';
import { requireAuth, currentUser, AuthedRequest } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { parseBody as parse } from '../lib/validation';

export const messagesRouter = Router();
messagesRouter.use(requireAuth);

const sendSchema = z.object({ content: z.string().min(1).max(2000) });

// Rate limit applicatif sur l'envoi — performance + anti-spam.
const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Anti cost-amplification : la mise en cache côté AIService limite déjà les
// appels OpenAI, ce rate limit borne le coût même si le cache est contourné.
const suggestionsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Liste des conversations (cercle réciproque) avec aperçu du dernier message.
messagesRouter.get('/', asyncHandler(async (req: AuthedRequest, res) => {
  const conversations = await services.messages.listConversations(currentUser(req).id);
  res.json({ conversations });
}));

// Historique paginé d'une conversation — ?before=<iso>&limit=20
messagesRouter.get('/:userId', asyncHandler(async (req: AuthedRequest, res) => {
  const before = typeof req.query.before === 'string' ? req.query.before : undefined;
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
  const page = await services.messages.listConversation(
    currentUser(req).id, req.params.userId, { before, limit },
  );
  res.json(page);
}));

// Suggestions d'accroche IA pour relancer la conversation.
messagesRouter.get('/:userId/suggestions', suggestionsLimiter, asyncHandler(async (req: AuthedRequest, res) => {
  const suggestions = await services.ai.getConversationStarters(currentUser(req).id, req.params.userId);
  res.json({ suggestions });
}));

messagesRouter.post('/:userId', sendLimiter, asyncHandler(async (req: AuthedRequest, res) => {
  const { content } = parse(sendSchema, req.body);
  const message = await services.messages.send(currentUser(req).id, req.params.userId, content);
  res.status(201).json(message);
}));

messagesRouter.delete('/:userId/:messageId', asyncHandler(async (req: AuthedRequest, res) => {
  await services.messages.deleteMessage(currentUser(req).id, req.params.messageId);
  res.status(204).send();
}));
