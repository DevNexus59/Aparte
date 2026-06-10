import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret';

// En prod, refuser les secrets par défaut (sinon n'importe qui peut forger des tokens).
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_ACCESS_SECRET et JWT_REFRESH_SECRET doivent être définis en production');
  }
  if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_ACCESS_SECRET et JWT_REFRESH_SECRET doivent être distincts');
  }
}

export const ACCESS_TTL_MS = 15 * 60 * 1000;    // 15 min
export const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 j

export type Role = 'user' | 'moderator' | 'admin';

export interface TokenPayload {
  sub: string;   // user id
  role: Role;
  jti?: string;  // identifiant unique du token (pour blacklist B4)
  exp?: number;
}

export function signAccess(payload: Omit<TokenPayload, 'jti' | 'exp'>): { token: string; jti: string } {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ ...payload, jti }, ACCESS_SECRET, {
    expiresIn: Math.floor(ACCESS_TTL_MS / 1000),
  });
  return { token, jti };
}

export function signRefresh(payload: Omit<TokenPayload, 'jti' | 'exp'>): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: Math.floor(REFRESH_TTL_MS / 1000),
  });
}

export function verifyAccess(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

export function verifyRefresh(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
}

// On ne stocke jamais le refresh token en clair : seulement son empreinte.
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
