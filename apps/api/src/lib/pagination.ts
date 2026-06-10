// Cursor-based pagination — plus stable que OFFSET sur données mutables.
// Cursor = createdAt ISO string. Renvoie items + next cursor pour la suite.

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface CursorPageOptions {
  before?: string;     // ISO datetime
  limit?: number;
}

export function normalizeLimit(limit: number | undefined, max = 50): number {
  const n = limit ?? 20;
  return Math.min(Math.max(1, n), max);
}
