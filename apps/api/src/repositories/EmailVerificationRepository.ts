import { DataSource, MoreThan } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { EmailVerification } from '../entities/EmailVerification';

export class EmailVerificationRepository extends BaseRepository<EmailVerification> {
  constructor(dataSource: DataSource) {
    super(dataSource, EmailVerification);
  }

  create(userId: string, tokenHash: string, expiresAt: Date): Promise<EmailVerification> {
    const entry = this.repo.create({ userId, tokenHash, expiresAt });
    return this.repo.save(entry);
  }

  findUsableByHash(tokenHash: string): Promise<EmailVerification | null> {
    return this.repo.findOne({
      where: { tokenHash, used: false, expiresAt: MoreThan(new Date()) },
    });
  }

  async markUsed(id: string): Promise<void> {
    await this.repo.update(id, { used: true });
  }

  async invalidatePending(userId: string): Promise<void> {
    await this.repo.update({ userId, used: false }, { used: true });
  }
}
