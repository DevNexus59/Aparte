import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { authRouter } from './routes/auth.routes';
import { heartbeatRouter } from './routes/heartbeat.routes';
import { legalRouter } from './routes/legal.routes';
import { linksRouter } from './routes/links.routes';
import { statesRouter } from './routes/states.routes';
import { moderationRouter } from './routes/moderation.routes';
import { photosRouter } from './routes/photos.routes';
import { pushRouter } from './routes/push.routes';
import { messagesRouter } from './routes/messages.routes';
import { statsRouter } from './routes/stats.routes';
import { errorHandler, requestLogger } from './middlewares/errorHandler';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet());

  // I1 : CORS strict en prod. SEC-09 : le fallback open est limité au dev.
  const origins = process.env.CORS_ORIGIN?.split(',').map((s) => s.trim());
  if (process.env.NODE_ENV === 'production' && (!origins || origins.length === 0)) {
    throw new Error('CORS_ORIGIN doit être défini en production');
  }
  const corsOrigin = origins ?? (process.env.NODE_ENV === 'development');
  app.use(cors({ origin: corsOrigin, credentials: true }));

  app.use(express.json({ limit: '100kb' }));

  // Log des erreurs (4xx/5xx) en dev. Mets LOG_ALL=1 pour tout voir.
  app.use(requestLogger());

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 20,
    standardHeaders: 'draft-7', legacyHeaders: false,
  });

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/legal', legalRouter);
  app.use('/auth', authLimiter, authRouter);
  app.use('/heartbeat', heartbeatRouter);
  app.use('/links', linksRouter);
  app.use('/states', statesRouter);
  app.use('/moderation', moderationRouter);
  app.use('/photos', photosRouter);
  app.use('/push', pushRouter);
  app.use('/messages', messagesRouter);
  app.use('/stats', statsRouter);

  app.use(errorHandler);
  return app;
}
