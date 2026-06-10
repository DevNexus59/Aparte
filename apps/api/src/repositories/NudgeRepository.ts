import { DataSource } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { Nudge, NudgeStatus, NudgeType, NudgeSource } from '../entities/Nudge';
import { AppError } from '../middlewares/errorHandler';

interface CreateInput {
  userId: string;
  linkId: string;
  type: NudgeType;
  source: NudgeSource;
}

export class NudgeRepository extends BaseRepository<Nudge> {
  constructor(dataSource: DataSource) {
    super(dataSource, Nudge);
  }

  createSuggested(input: CreateInput): Promise<Nudge> {
    const nudge = this.repo.create({ ...input, status: 'suggested' });
    return this.repo.save(nudge);
  }

  listSuggestedForUser(userId: string): Promise<Nudge[]> {
    return this.repo.find({
      where: { userId, status: 'suggested' as never },
      order: { suggestedAt: 'DESC' },
    });
  }

  async updateStatus(nudgeId: string, userId: string, status: 'acted' | 'dismissed'): Promise<void> {
    const result = await this.repo.update(
      { id: nudgeId, userId, status: 'suggested' as never },
      { status: status as NudgeStatus },
    );
    if (result.affected === 0) throw new AppError(404, 'Relance introuvable ou déjà traitée');
  }

  // Stats non-anxiogènes : nombre de relances suivies d'effet — un compteur
  // de gestes accomplis, jamais comparé à un total ou un taux.
  countActedForUser(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, status: 'acted' as never } });
  }
}
