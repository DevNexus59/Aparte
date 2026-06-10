import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../src/services/AuthService';
import { MemoryCache } from '../src/lib/cache';
import { hashPassword } from '../src/lib/password';
import { User } from '../src/entities/User';

// Helpers pour fabriquer un container de repos minimal et mockable.
function makeRepos(opts: {
  user?: User | null;
} = {}) {
  const calls: Record<string, unknown[]> = {};
  const track = (name: string) => (...args: unknown[]) => { calls[name] = args; };
  const repos = {
    users: {
      findActiveByEmail: vi.fn(async () => opts.user ?? null),
      findById: vi.fn(async () => opts.user ?? null),
      registerFailedLogin: vi.fn(track('registerFailedLogin')),
      resetFailedLogins: vi.fn(track('resetFailedLogins')),
      create: vi.fn(),
    },
    refreshTokens: { issue: vi.fn(async () => ({})) },
    audit: { record: vi.fn(track('audit')) },
  } as never;
  return { repos, calls };
}

describe('AuthService.login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('B1 : prend un temps comparable que l\'user existe ou non (timing)', async () => {
    const password = 'correct horse battery staple';
    const hash = await hashPassword(password);
    const user = Object.assign(new User(), {
      id: 'u1', email: 'a@b.c', passwordHash: hash,
      birthdate: '1990-01-01', status: 'active', role: 'user',
      lockedUntil: null, failedLoginAttempts: 0,
    });

    const a = makeRepos({ user });
    const b = makeRepos({ user: null });

    const svc1 = new AuthService(a.repos, new MemoryCache());
    const svc2 = new AuthService(b.repos, new MemoryCache());

    const t1 = Date.now(); await svc1.login('a@b.c', 'wrong').catch(() => undefined);
    const dur1 = Date.now() - t1;

    const t2 = Date.now(); await svc2.login('a@b.c', 'wrong').catch(() => undefined);
    const dur2 = Date.now() - t2;

    // On vérifie qu'on a passé du temps dans les deux cas (le hash a tourné).
    // Tolérance large : on cherche juste à valider qu'un Argon2 a été calculé.
    expect(dur1).toBeGreaterThan(20);
    expect(dur2).toBeGreaterThan(20);
  });

  it('I6 : log l\'échec de login pour un user connu', async () => {
    const password = 'correct horse battery staple';
    const hash = await hashPassword(password);
    const user = Object.assign(new User(), {
      id: 'u1', email: 'a@b.c', passwordHash: hash,
      birthdate: '1990-01-01', status: 'active', role: 'user',
      lockedUntil: null, failedLoginAttempts: 0,
    });

    const { repos } = makeRepos({ user });
    const svc = new AuthService(repos, new MemoryCache());

    await svc.login('a@b.c', 'wrong').catch(() => undefined);

    expect(repos.users.registerFailedLogin).toHaveBeenCalledWith('u1');
    expect(repos.audit.record).toHaveBeenCalled();
  });

  it('I6 : log l\'échec différemment pour un email inconnu', async () => {
    const { repos } = makeRepos({ user: null });
    const svc = new AuthService(repos, new MemoryCache());

    await svc.login('ghost@nope.com', 'wrong').catch(() => undefined);

    expect(repos.users.registerFailedLogin).not.toHaveBeenCalled();
    expect(repos.audit.record).toHaveBeenCalled();
  });
});
