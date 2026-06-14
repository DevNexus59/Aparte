import { DataSource, MoreThan } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { PasswordReset } from '../entities/PasswordReset';

export class PasswordResetRepository extends BaseRepository<PasswordReset> {
  constructor(dataSource: DataSource) {
    super(dataSource, PasswordReset);
  }

  create(userId: string, tokenHash: string, expiresAt: Date): Promise<PasswordReset> {
    const entry = this.repo.create({ userId, tokenHash, expiresAt });
    return this.repo.save(entry);
  }

  findUsableByHash(tokenHash: string): Promise<PasswordReset | null> {
    return this.repo.findOne({
      where: { tokenHash, used: false, expiresAt: MoreThan(new Date()) },
    });
  }

  async markUsed(id: string): Promise<void> {
    await this.repo.update(id, { used: true });
  }
}
