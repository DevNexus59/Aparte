import { DataSource } from 'typeorm';
import { Repositories } from '../repositories';
import { WeeklyPrompt } from '../entities/WeeklyPrompt';
import { JournalEntry, JournalType } from '../entities/JournalEntry';
import { Nudge } from '../entities/Nudge';
import { Link } from '../entities/Link';
import { CursorPage, CursorPageOptions } from '../lib/pagination';
import { AppError } from '../middlewares/errorHandler';

function isoWeek(d = new Date()): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

interface JournalInput {
  userId: string;
  content: string;
  type: JournalType;
  linkId?: string;
  promptId?: number;
}

export class HeartbeatService {
  constructor(
    private readonly repos: Repositories,
    private readonly dataSource: DataSource,
  ) {}

  // Une seule question stable sur toute la semaine, qui tourne d'une semaine à l'autre.
  async getCurrentWeeklyPrompt(): Promise<WeeklyPrompt | null> {
    const prompts = await this.dataSource
      .getRepository(WeeklyPrompt)
      .find({ where: { active: true }, order: { id: 'ASC' } });
    if (prompts.length === 0) return null;
    return prompts[isoWeek() % prompts.length];
  }

  // Cœur de la boucle : journal entry + nudge (si linkId) dans une transaction
  // pour qu'on ait toujours les deux ou aucun des deux.
  async addJournalEntry(input: JournalInput): Promise<{ entry: JournalEntry; nudge: Nudge | null }> {
    return this.dataSource.transaction(async (em) => {
      let validLinkId: string | null = null;
      if (input.linkId) {
        const link = await em.findOne(Link, {
          where: { id: input.linkId, ownerUserId: input.userId, status: 'active' as never },
        });
        if (!link) throw new AppError(404, 'Lien introuvable');
        validLinkId = link.id;
      }

      const entry = em.create(JournalEntry, {
        userId: input.userId,
        linkId: validLinkId,
        promptId: input.promptId ?? null,
        type: input.type,
        content: input.content,
      });
      const savedEntry = await em.save(entry);

      let savedNudge: Nudge | null = null;
      if (validLinkId) {
        const nudge = em.create(Nudge, {
          userId: input.userId,
          linkId: validLinkId,
          type: 'checkin',
          source: 'weekly',
          status: 'suggested',
        });
        savedNudge = await em.save(nudge);
      }

      return { entry: savedEntry, nudge: savedNudge };
    });
  }

  listSuggestedNudges(userId: string): Promise<Nudge[]> {
    return this.repos.nudges.listSuggestedForUser(userId);
  }

  updateNudgeStatus(userId: string, nudgeId: string, status: 'acted' | 'dismissed'): Promise<void> {
    return this.repos.nudges.updateStatus(nudgeId, userId, status);
  }

  listJournal(userId: string, opts?: CursorPageOptions): Promise<CursorPage<JournalEntry>> {
    return this.repos.journal.listForUser(userId, opts);
  }
}
