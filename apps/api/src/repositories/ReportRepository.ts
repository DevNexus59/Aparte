import { DataSource, LessThan } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { Report, ReportReason, ReportStatus } from '../entities/Report';
import { CursorPage, CursorPageOptions, normalizeLimit } from '../lib/pagination';

interface CreateInput {
  reporterUserId: string;
  reportedUserId?: string | null;
  reason: ReportReason;
  contentType: string;
  contentId?: string | null;
  description?: string | null;
}

export class ReportRepository extends BaseRepository<Report> {
  constructor(dataSource: DataSource) {
    super(dataSource, Report);
  }

  create(input: CreateInput): Promise<Report> {
    const report = this.repo.create({
      reporterUserId: input.reporterUserId,
      reportedUserId: input.reportedUserId ?? null,
      reason: input.reason,
      contentType: input.contentType,
      contentId: input.contentId ?? null,
      description: input.description ?? null,
      status: 'open',
    });
    return this.repo.save(report);
  }

  async listOpenForModeration(opts: CursorPageOptions = {}): Promise<CursorPage<Report>> {
    const limit = normalizeLimit(opts.limit);
    const where: Record<string, unknown> = { status: 'open' as never };
    if (opts.before) where.createdAt = LessThan(new Date(opts.before));

    const items = await this.repo.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit + 1,
    });
    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    return {
      items: page,
      nextCursor: hasMore ? page[page.length - 1].createdAt.toISOString() : null,
    };
  }

  async updateStatus(reportId: string, status: ReportStatus): Promise<void> {
    await this.repo.update(reportId, {
      status,
      resolvedAt: status === 'resolved' || status === 'dismissed' ? new Date() : null,
    });
  }
}
