import { DataSource, LessThan, IsNull } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { JournalEntry, JournalType } from '../entities/JournalEntry';
import { CursorPage, CursorPageOptions, normalizeLimit } from '../lib/pagination';

interface CreateInput {
  userId: string;
  linkId?: string | null;
  promptId?: number | null;
  type: JournalType;
  content: string;
}

export class JournalEntryRepository extends BaseRepository<JournalEntry> {
  constructor(dataSource: DataSource) {
    super(dataSource, JournalEntry);
  }

  createInTransaction(input: CreateInput): Promise<JournalEntry> {
    const entry = this.repo.create({
      ...input,
      linkId: input.linkId ?? null,
      promptId: input.promptId ?? null,
    });
    return this.repo.save(entry);
  }

  // Stats non-anxiogènes (§10 spec) : compteurs bruts par type + par lien,
  // jamais de ratio/score — l'agrégation reste côté SQL pour rester O(1) en mémoire.
  async statsForUser(userId: string): Promise<{
    counts: Record<JournalType, number>;
    perLink: Map<string, number>;
  }> {
    const rows = await this.repo
      .createQueryBuilder('j')
      .select('j.type', 'type')
      .addSelect('j.linkId', 'linkId')
      .addSelect('COUNT(*)', 'count')
      .where('j.userId = :userId', { userId })
      .andWhere('j.deletedAt IS NULL')
      .groupBy('j.type')
      .addGroupBy('j.linkId')
      .getRawMany<{ type: JournalType; linkId: string | null; count: string }>();

    const counts: Record<JournalType, number> = { gratitude: 0, memory: 0, reflection: 0 };
    const perLink = new Map<string, number>();
    for (const row of rows) {
      const n = Number(row.count);
      counts[row.type] += n;
      if (row.linkId) perLink.set(row.linkId, (perLink.get(row.linkId) ?? 0) + n);
    }
    return { counts, perLink };
  }

  // M3 : cursor-based pagination — stable même avec inserts/deletes concurrents.
  async listForUser(userId: string, opts: CursorPageOptions = {}): Promise<CursorPage<JournalEntry>> {
    const limit = normalizeLimit(opts.limit);

    const where: Record<string, unknown> = { userId, deletedAt: IsNull() };
    if (opts.before) where.createdAt = LessThan(new Date(opts.before));

    const items = await this.repo.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit + 1, // +1 pour savoir s'il y a une page suivante
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? page[page.length - 1].createdAt.toISOString() : null;

    return { items: page, nextCursor };
  }
}
