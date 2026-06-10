import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StatsService } from '../src/services/StatsService';
import { AppError } from '../src/middlewares/errorHandler';
import { User } from '../src/entities/User';

function makeUser(overrides: Partial<User> = {}): User {
  return Object.assign(new User(), {
    id: 'u1', email: 'a@b.c', displayName: 'Alice',
    createdAt: new Date('2024-01-15T00:00:00Z'),
    ...overrides,
  });
}

function makeRepos(opts: {
  user?: User | null;
  journalStats?: { counts: Record<string, number>; perLink: Map<string, number> };
  actedNudges?: number;
  messagesExchanged?: number;
  links?: { id: string; contactName: string; status: string }[];
} = {}) {
  const repos = {
    users: { findById: vi.fn(async () => opts.user ?? null) },
    journal: {
      statsForUser: vi.fn(async () => opts.journalStats ?? {
        counts: { gratitude: 0, memory: 0, reflection: 0 },
        perLink: new Map(),
      }),
    },
    nudges: { countActedForUser: vi.fn(async () => opts.actedNudges ?? 0) },
    messages: { countForUser: vi.fn(async () => opts.messagesExchanged ?? 0) },
    links: { listForOwner: vi.fn(async () => opts.links ?? []) },
  } as never;
  return repos;
}

describe('StatsService.getMyStats', () => {
  beforeEach(() => vi.clearAllMocks());

  it("lève une erreur si l'utilisateur est introuvable", async () => {
    const repos = makeRepos({ user: null });
    const svc = new StatsService(repos);

    await expect(svc.getMyStats('ghost')).rejects.toThrow(AppError);
  });

  it('agrège les compteurs personnels (jamais de comparaison ni de score)', async () => {
    const repos = makeRepos({
      user: makeUser(),
      journalStats: {
        counts: { gratitude: 5, memory: 2, reflection: 1 },
        perLink: new Map([['l1', 3]]),
      },
      actedNudges: 4,
      messagesExchanged: 42,
      links: [
        { id: 'l1', contactName: 'Bob', status: 'active' },
        { id: 'l2', contactName: 'Carla', status: 'active' },
      ],
    });
    const svc = new StatsService(repos);

    const stats = await svc.getMyStats('u1');

    expect(stats.memberSince).toBe('2024-01-15T00:00:00.000Z');
    expect(stats.journal).toEqual({ gratitude: 5, memory: 2, reflection: 1 });
    expect(stats.actedNudges).toBe(4);
    expect(stats.messagesExchanged).toBe(42);
    expect(stats.links).toEqual([
      { id: 'l1', contactName: 'Bob', entries: 3 },
      { id: 'l2', contactName: 'Carla', entries: 0 },
    ]);
  });

  it('exclut les liens supprimés et conserve l\'ordre (pas de tri par score)', async () => {
    const repos = makeRepos({
      user: makeUser(),
      links: [
        { id: 'l1', contactName: 'Bob', status: 'active' },
        { id: 'l2', contactName: 'Removed', status: 'removed' },
      ],
    });
    const svc = new StatsService(repos);

    const stats = await svc.getMyStats('u1');

    expect(stats.links).toEqual([{ id: 'l1', contactName: 'Bob', entries: 0 }]);
  });
});
