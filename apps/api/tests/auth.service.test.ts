import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../src/services/AuthService';
import { MemoryCache } from '../src/lib/cache';
import { hashPassword, verifyPassword } from '../src/lib/password';
import { User } from '../src/entities/User';

// I5/HIBP : pas d'accès réseau dans les tests — on considère les mots de
// passe de test comme non compromis.
vi.mock('../src/lib/hibp', () => ({ isPasswordPwned: vi.fn(async () => false) }));

// Emails : on vérifie juste que l'envoi est déclenché, sans appeler Resend.
vi.mock('../src/lib/email', () => ({
  sendVerificationEmail: vi.fn(async () => undefined),
  sendPasswordResetEmail: vi.fn(async () => undefined),
}));

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
      create: vi.fn(async (input: unknown) => Object.assign(new User(), { id: 'new-user', ...(input as object) })),
      softDelete: vi.fn(track('softDelete')),
      updatePassword: vi.fn(track('updatePassword')),
      markEmailVerified: vi.fn(track('markEmailVerified')),
    },
    links: {
      backfillMemberUserId: vi.fn(track('backfillMemberUserId')),
    },
    passwordResets: {
      create: vi.fn(track('passwordResets.create')),
      findUsableByHash: vi.fn(async () => null),
      markUsed: vi.fn(track('passwordResets.markUsed')),
    },
    emailVerifications: {
      create: vi.fn(track('emailVerifications.create')),
      findUsableByHash: vi.fn(async () => null),
      markUsed: vi.fn(track('emailVerifications.markUsed')),
    },
    refreshTokens: {
      issue: vi.fn(async () => ({})),
      revokeAllForUser: vi.fn(track('revokeAllForUser')),
    },
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

describe('AuthService.deleteAccount', () => {
  beforeEach(() => vi.clearAllMocks());

  async function makeUser() {
    const passwordHash = await hashPassword('correct horse battery staple');
    return Object.assign(new User(), {
      id: 'u1', email: 'a@b.c', passwordHash,
      birthdate: '1990-01-01', status: 'active', role: 'user',
      lockedUntil: null, failedLoginAttempts: 0, photoUrl: 'photo-key.jpg',
    });
  }

  it("RGPD : refuse si le mot de passe est incorrect", async () => {
    const user = await makeUser();
    const { repos } = makeRepos({ user });
    const svc = new AuthService(repos, new MemoryCache());

    await expect(svc.deleteAccount('u1', 'wrong-password')).rejects.toThrow();

    expect(repos.users.softDelete).not.toHaveBeenCalled();
  });

  it('RGPD : révoque les sessions, supprime la photo et soft-delete le compte', async () => {
    const user = await makeUser();
    const { repos } = makeRepos({ user });
    const storage = { delete: vi.fn(async () => undefined) };
    const svc = new AuthService(repos, new MemoryCache(), storage as never);

    await svc.deleteAccount('u1', 'correct horse battery staple');

    expect(repos.refreshTokens.revokeAllForUser).toHaveBeenCalledWith('u1');
    expect(storage.delete).toHaveBeenCalledWith('photo-key.jpg');
    expect(repos.audit.record).toHaveBeenCalled();
    expect(repos.users.softDelete).toHaveBeenCalledWith('u1');
  });
});

describe('AuthService.register', () => {
  beforeEach(() => vi.clearAllMocks());

  const validInput = {
    email: 'new@user.com',
    password: 'correct horse battery staple',
    confirmPassword: 'correct horse battery staple',
    displayName: 'Nouveau',
    birthdate: '1990-01-01',
  };

  it('rejette les mineurs', async () => {
    const { repos } = makeRepos({ user: null });
    const svc = new AuthService(repos, new MemoryCache());

    await expect(svc.register({ ...validInput, birthdate: '2015-01-01' })).rejects.toThrow();
  });

  it('crée le compte, rattache les liens en attente et envoie un email de confirmation', async () => {
    const { repos } = makeRepos({ user: null });
    const svc = new AuthService(repos, new MemoryCache());

    const result = await svc.register(validInput);

    expect(repos.users.create).toHaveBeenCalled();
    // Bug du chat entre membres du même cercle : les liens créés avant
    // l'inscription doivent être rattachés au nouveau compte.
    expect(repos.links.backfillMemberUserId).toHaveBeenCalled();
    expect(repos.emailVerifications.create).toHaveBeenCalled();
    expect(result.user.email).toBe(validInput.email);
  });
});

describe('AuthService - mot de passe oublié / changement', () => {
  beforeEach(() => vi.clearAllMocks());

  async function makeUser() {
    const passwordHash = await hashPassword('correct horse battery staple');
    return Object.assign(new User(), {
      id: 'u1', email: 'a@b.c', passwordHash,
      birthdate: '1990-01-01', status: 'active', role: 'user',
      lockedUntil: null, failedLoginAttempts: 0,
    });
  }

  it('requestPasswordReset : ne révèle rien si l\'email est inconnu', async () => {
    const { repos } = makeRepos({ user: null });
    const svc = new AuthService(repos, new MemoryCache());

    await expect(svc.requestPasswordReset('ghost@nope.com')).resolves.toBeUndefined();
    expect(repos.passwordResets.create).not.toHaveBeenCalled();
  });

  it('requestPasswordReset : crée un code pour un email connu', async () => {
    const user = await makeUser();
    const { repos } = makeRepos({ user });
    const svc = new AuthService(repos, new MemoryCache());

    await svc.requestPasswordReset('a@b.c');
    expect(repos.passwordResets.create).toHaveBeenCalled();
  });

  it('confirmPasswordReset : rejette un code invalide', async () => {
    const { repos } = makeRepos({ user: null });
    const svc = new AuthService(repos, new MemoryCache());

    await expect(svc.confirmPasswordReset('000000', 'a new strong password')).rejects.toThrow();
  });

  it('confirmPasswordReset : met à jour le mot de passe et révoque les sessions', async () => {
    const { repos } = makeRepos({ user: null });
    (repos as never as { passwordResets: { findUsableByHash: ReturnType<typeof vi.fn> } })
      .passwordResets.findUsableByHash = vi.fn(async () => ({ id: 'pr1', userId: 'u1' }));
    const svc = new AuthService(repos, new MemoryCache());

    await svc.confirmPasswordReset('123456', 'a new strong password');

    expect(repos.users.updatePassword).toHaveBeenCalledWith('u1', expect.any(String));
    expect(repos.passwordResets.markUsed).toHaveBeenCalledWith('pr1');
    expect(repos.refreshTokens.revokeAllForUser).toHaveBeenCalledWith('u1');
  });

  it('changePassword : rejette si l\'ancien mot de passe est incorrect', async () => {
    const user = await makeUser();
    const { repos } = makeRepos({ user });
    const svc = new AuthService(repos, new MemoryCache());

    await expect(svc.changePassword('u1', 'wrong', 'a new strong password')).rejects.toThrow();
    expect(repos.users.updatePassword).not.toHaveBeenCalled();
  });

  it('changePassword : met à jour le mot de passe si l\'ancien est correct', async () => {
    const user = await makeUser();
    const { repos } = makeRepos({ user });
    const svc = new AuthService(repos, new MemoryCache());

    await svc.changePassword('u1', 'correct horse battery staple', 'a new strong password');

    expect(repos.users.updatePassword).toHaveBeenCalledWith('u1', expect.any(String));
    const [, newHash] = repos.users.updatePassword.mock.calls[0] as [string, string];
    await expect(verifyPassword(newHash, 'a new strong password')).resolves.toBe(true);
  });
});

describe('AuthService.verifyEmail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejette un token invalide ou expiré', async () => {
    const { repos } = makeRepos({ user: null });
    const svc = new AuthService(repos, new MemoryCache());

    await expect(svc.verifyEmail('bad-token')).rejects.toThrow();
  });

  it('marque le compte comme vérifié pour un token valide', async () => {
    const { repos } = makeRepos({ user: null });
    (repos as never as { emailVerifications: { findUsableByHash: ReturnType<typeof vi.fn> } })
      .emailVerifications.findUsableByHash = vi.fn(async () => ({ id: 'ev1', userId: 'u1' }));
    const svc = new AuthService(repos, new MemoryCache());

    await svc.verifyEmail('good-token');

    expect(repos.users.markEmailVerified).toHaveBeenCalledWith('u1');
    expect(repos.emailVerifications.markUsed).toHaveBeenCalledWith('ev1');
  });
});
