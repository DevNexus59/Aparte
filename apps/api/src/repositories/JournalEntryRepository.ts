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
