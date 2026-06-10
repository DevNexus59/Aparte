import { DataSource, MoreThan } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { EmotionalState, StateValue } from '../entities/EmotionalState';

interface SetInput {
  userId: string;
  state: StateValue;
  durationHours: number;
}

interface CircleStateRow {
  userId: string;
  displayName: string;
  photoUrl: string | null;
  state: StateValue;
  setAt: Date;
  expiresAt: Date;
}

export class EmotionalStateRepository extends BaseRepository<EmotionalState> {
  constructor(dataSource: DataSource) {
    super(dataSource, EmotionalState);
  }

  set(input: SetInput): Promise<EmotionalState> {
    const hours = Math.min(Math.max(input.durationHours, 1), 72);
    const state = this.repo.create({
      userId: input.userId,
      state: input.state,
      expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
    });
    return this.repo.save(state);
  }

  // Mon état actif le plus récent.
  getMyCurrent(userId: string): Promise<EmotionalState | null> {
    return this.repo.findOne({
      where: { userId, expiresAt: MoreThan(new Date()) },
      order: { setAt: 'DESC' },
    });
  }

  async clearMine(userId: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(EmotionalState)
      .set({ expiresAt: () => 'NOW()' })
      .where('user_id = :userId AND expires_at > NOW()', { userId })
      .execute();
  }

  // Cercle RÉCIPROQUE : moi je les ai en lien actif, ET ils m'ont en lien actif.
  // SQL brut : la requête est complexe (latest per user + double join réciproque),
  // l'ORM ne l'exprimerait pas plus clairement.
  async listVisibleForUser(userId: string): Promise<CircleStateRow[]> {
    const rows = await this.dataSource.query(
      `SELECT s.user_id AS userId,
              u.display_name AS displayName,
              u.photo_url AS photoUrl,
              s.state, s.set_at AS setAt, s.expires_at AS expiresAt
       FROM emotional_states s
       JOIN users u ON u.id = s.user_id AND u.deleted_at IS NULL
       INNER JOIN (
         SELECT user_id, MAX(set_at) AS max_set
         FROM emotional_states
         WHERE expires_at > NOW()
         GROUP BY user_id
       ) latest ON latest.user_id = s.user_id AND latest.max_set = s.set_at
       WHERE s.user_id IN (
         SELECT la.member_user_id
         FROM links la
         JOIN links lb
           ON lb.owner_user_id = la.member_user_id
          AND lb.member_user_id = la.owner_user_id
          AND lb.status = 'active'
         WHERE la.owner_user_id = ?
           AND la.member_user_id IS NOT NULL
           AND la.status = 'active'
       )
       ORDER BY s.set_at DESC`,
      [userId],
    );
    return rows as CircleStateRow[];
  }
}
