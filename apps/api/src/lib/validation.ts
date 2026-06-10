import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../middlewares/errorHandler';

// Helper de validation : safeParse + AppError détaillée.
// Le client reçoit le détail (champ + message) en plus du status 400.
// En dev, l'errorHandler log aussi côté serveur.
export function parseBody<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    throw new AppError(400, 'Données invalides', details);
  }
  return result.data;
}

// Compat : permet aussi de catcher des ZodError jetés ailleurs.
export function isZodError(e: unknown): e is ZodError {
  return e instanceof ZodError;
}
