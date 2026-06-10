import { DataSource, LessThan } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { AuthRefreshToken } from '../entities/AuthRefreshToken';

interface CreateInput {
  userId: string;
  tokenHash: string;
  deviceInfo?: string;
  ttlMs: number;
}

const MAX_SESSIONS_PER_USER = 5;

export class RefreshTokenRepository extends BaseRepository<AuthRefreshToken> {
  constructor(dataSource: DataSource) {
    super(dataSource, AuthRefreshToken);
  }

  // I3 : au-delà de 5 sessions actives par user, on révoque les plus anciennes.
  async issue(input: CreateInput): Promise<AuthRefreshToken> {
    return this.dataSource.transaction(async (em) => {
      const repo = em.getRepository(AuthRefreshToken);

      // Émission du nouveau token.
      const token = repo.create({
        userId: input.userId,
        tokenHash: input.tokenHash,
        deviceInfo: input.deviceInfo ?? null,
        expiresAt: new Date(Date.now() + input.ttlMs),
      });
      const saved = await repo.save(token);

      // Si plus de N sessions actives, révoquer les plus anciennes.
      const active = await repo.find({
        where: { userId: input.userId, revoked: false },
        order: { createdAt: 'ASC' },
      });
      if (active.length > MAX_SESSIONS_PER_USER) {
        const toRevoke = active.slice(0, active.length - MAX_SESSIONS_PER_USER);
        await repo.update(toRevoke.map((t) => t.id), { revoked: true });
      }

      return saved;
    });
  }

  findUsableByHash(tokenHash: string): Promise<AuthRefreshToken | null> {
    return this.repo
      .createQueryBuilder('t')
      .where('t.token_hash = :hash', { hash: tokenHash })
      .andWhere('t.revoked = FALSE')
      .andWhere('t.expires_at > NOW()')
      .getOne();
  }

  async revokeByHash(tokenHash: string): Promise<void> {
    await this.repo.update({ tokenHash }, { revoked: true });
  }

  async revokeAllForUser(userId: string, exceptHash?: string): Promise<void> {
    const qb = this.repo.createQueryBuilder()
      .update(AuthRefreshToken)
      .set({ revoked: true })
      .where('user_id = :userId AND revoked = FALSE', { userId });
    if (exceptHash) qb.andWhere('token_hash <> :exceptHash', { exceptHash });
    await qb.execute();
  }

  // I4 : purge des tokens expirés depuis plus de N jours.
  async cleanupExpired(graceDays = 7): Promise<number> {
    const before = new Date(Date.now() - graceDays * 24 * 60 * 60 * 1000);
    const result = await this.repo.delete({ expiresAt: LessThan(before) });
    return result.affected ?? 0;
  }
}
