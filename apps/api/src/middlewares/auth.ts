import { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyAccess, Role, TokenPayload } from '../lib/jwt';
import { AppError, asyncHandler } from './errorHandler';
import { accessBlacklist } from '../services';

export interface AuthUser {
  id: string;
  role: Role;
  jti?: string;
}

// Request enrichie d'un utilisateur authentifié.
export interface AuthedRequest extends Request {
  user?: AuthUser;
  accessToken?: string;
}

// IMPORTANT : middleware async wrapped pour Express 4. Sans ça, les throw
// dans le corps async ne sont pas captés par errorHandler.
export const requireAuth: RequestHandler = asyncHandler(async (req: AuthedRequest, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'Token manquant');
  }
  const token = header.slice(7);
  let payload: TokenPayload;
  try {
    payload = verifyAccess(token);
  } catch {
    throw new AppError(401, 'Token invalide ou expiré');
  }

  // B4 : refus si le jti est dans la blacklist (logout récent).
  if (payload.jti && (await accessBlacklist.has(payload.jti))) {
    throw new AppError(401, 'Token révoqué');
  }

  req.user = { id: payload.sub, role: payload.role, jti: payload.jti };
  req.accessToken = token;
  next();
});

export function requireRole(...roles: Role[]): RequestHandler {
  return (req: AuthedRequest, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, 'Accès refusé'));
    }
    next();
  };
}

export function currentUser(req: AuthedRequest): AuthUser {
  if (!req.user) throw new AppError(401, 'Non authentifié');
  return req.user;
}
