import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError } from 'zod';

// Erreur métier porteuse d'un status HTTP.
export class AppError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

// Évite les try/catch répétés dans chaque handler async.
// Accepte aussi les middlewares async (pas seulement les handlers).
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => unknown): RequestHandler {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Middleware d'erreurs à monter en dernier.
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Erreurs métier : on renvoie tel quel.
  if (err instanceof AppError) {
    const body: { error: string; details?: unknown } = { error: err.message };
    if (err.details !== undefined) body.details = err.details;
    res.status(err.status).json(body);
    return;
  }

  // Erreurs Zod non transformées en AppError : on extrait les détails.
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[400] ${req.method} ${req.path}`, issues);
    }
    res.status(400).json({ error: 'Données invalides', details: issues });
    return;
  }

  // Erreur inconnue : log complet pour le dev.
  console.error(`[500] ${req.method} ${req.path}`, err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Erreur interne'
      : (err instanceof Error ? err.message : 'Erreur interne'),
  });
}

// Petit middleware de log pour les requêtes — surtout utile en dev.
export function requestLogger(): RequestHandler {
  return (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      // On log surtout les non-2xx pour ne pas spammer.
      if (res.statusCode >= 400 || process.env.LOG_ALL === '1') {
        console.log(`[${res.statusCode}] ${req.method} ${req.path} (${ms}ms)`);
      }
    });
    next();
  };
}
