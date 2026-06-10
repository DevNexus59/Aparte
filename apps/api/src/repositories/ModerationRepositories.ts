import { DataSource } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { ModerationAction, ModerationActionType } from '../entities/ModerationAction';
import { ModerationFlag } from '../entities/ModerationFlag';
import { User } from '../entities/User';

interface ActInput {
  targetUserId: string;
  action: ModerationActionType;
  automated: boolean;
  reason?: string | null;
  reportId?: string | null;
  moderatorId?: string | null;
  durationMinutes?: number;
}

export class ModerationActionRepository extends BaseRepository<ModerationAction> {
  constructor(dataSource: DataSource) {
    super(dataSource, ModerationAction);
  }

  // Action + mise à jour du status de l'user dans la même transaction.
  // suspension -> status='suspended' ; ban -> status='banned' ; warning -> rien.
  async apply(input: ActInput): Promise<ModerationAction> {
    return this.dataSource.transaction(async (em) => {
      const action = em.create(ModerationAction, {
        targetUserId: input.targetUserId,
        action: input.action,
        automated: input.automated,
        reason: input.reason ?? null,
        reportId: input.reportId ?? null,
        moderatorId: input.moderatorId ?? null,
        expiresAt: input.durationMinutes
          ? new Date(Date.now() + input.durationMinutes * 60_000)
          : null,
      });
      const saved = await em.save(action);

      if (input.action === 'suspension') {
        await em.update(User, input.targetUserId, { status: 'suspended' });
      } else if (input.action === 'ban') {
        await em.update(User, input.targetUserId, { status: 'banned' });
      }

      return saved;
    });
  }
}

export class ModerationFlagRepository extends BaseRepository<ModerationFlag> {
  constructor(dataSource: DataSource) {
    super(dataSource, ModerationFlag);
  }

  record(input: {
    targetUserId: string;
    contentType: string;
    contentId?: string;
    classifier: string;
    score: number;
    autoActioned: boolean;
  }): Promise<ModerationFlag> {
    const flag = this.repo.create({
      targetUserId: input.targetUserId,
      contentType: input.contentType,
      contentId: input.contentId ?? null,
      classifier: input.classifier,
      score: input.score.toFixed(3),
      autoActioned: input.autoActioned,
    });
    return this.repo.save(flag);
  }
}
