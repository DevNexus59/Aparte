import { Repositories } from '../repositories';
import {
  Classifier, ClassificationResult,
  FLAG_THRESHOLD, AUTO_ACTION_THRESHOLD,
} from '../lib/moderation';
import { ReportReason, ReportStatus } from '../entities/Report';
import { ModerationActionType } from '../entities/ModerationAction';
import { AppError } from '../middlewares/errorHandler';

interface ReportInput {
  reporterUserId: string;
  reportedUserId?: string;
  reason: ReportReason;
  contentType: string;
  contentId?: string;
  description?: string;
}

export class ModerationService {
  constructor(
    private readonly repos: Repositories,
    private readonly classifiers: Classifier[], // injectés (1+ classifieurs en prod)
  ) {}

  // --- Modération auto (upload de photo, bio, displayName…) ---
  // Renvoie true si le contenu est OK, false si auto-bloqué.
  async screenText(opts: {
    userId: string;
    text: string;
    contentType: string;
    contentId?: string;
  }): Promise<boolean> {
    const results = await this.runText(opts.text);
    return this.handleResults(results, opts);
  }

  async screenImage(opts: {
    userId: string;
    buffer: Buffer;
    mime: string;
    contentType: string;
    contentId?: string;
  }): Promise<boolean> {
    const results = await this.runImage(opts.buffer, opts.mime);
    return this.handleResults(results, {
      userId: opts.userId, contentType: opts.contentType, contentId: opts.contentId,
    });
  }

  // --- Signalement par un utilisateur ---
  async fileReport(input: ReportInput) {
    if (input.reportedUserId === input.reporterUserId) {
      throw new AppError(400, 'On ne se signale pas soi-même');
    }
    const report = await this.repos.reports.create(input);
    await this.repos.audit.record({
      userId: input.reporterUserId,
      action: 'report.filed',
      entity: 'report',
      entityId: report.id,
    });
    return report;
  }

  // --- Outils modérateur (rôle moderator/admin requis côté route) ---
  listOpenReports(before?: string, limit?: number) {
    return this.repos.reports.listOpenForModeration({ before, limit });
  }

  async resolveReport(reportId: string, status: ReportStatus, moderatorId: string) {
    await this.repos.reports.updateStatus(reportId, status);
    await this.repos.audit.record({
      userId: moderatorId, action: `report.${status}`, entity: 'report', entityId: reportId,
    });
  }

  async actOnUser(opts: {
    targetUserId: string;
    moderatorId: string;
    action: ModerationActionType;
    reason: string;
    reportId?: string;
    durationMinutes?: number;
  }) {
    return this.repos.modActions.apply({
      ...opts,
      automated: false,
    });
  }

  // --- internal ---

  private async runText(text: string): Promise<ClassificationResult[]> {
    const out: ClassificationResult[] = [];
    for (const c of this.classifiers) {
      if (!c.classifyText) continue;
      try { out.push(await c.classifyText(text)); }
      catch (e) { console.error(`[moderation] ${c.name} text failed`, e); }
    }
    return out;
  }

  private async runImage(buffer: Buffer, mime: string): Promise<ClassificationResult[]> {
    const out: ClassificationResult[] = [];
    for (const c of this.classifiers) {
      if (!c.classifyImage) continue;
      try { out.push(await c.classifyImage(buffer, mime)); }
      catch (e) { console.error(`[moderation] ${c.name} image failed`, e); }
    }
    return out;
  }

  // Politique :
  //   score >= AUTO_ACTION : on enregistre un flag auto-actioned + on rejette ;
  //   FLAG <= score < AUTO_ACTION : on enregistre un flag pour revue humaine, on laisse passer ;
  //   score < FLAG : silencieux.
  private async handleResults(
    results: ClassificationResult[],
    ctx: { userId: string; contentType: string; contentId?: string },
  ): Promise<boolean> {
    let blocked = false;
    for (const r of results) {
      if (r.score >= FLAG_THRESHOLD) {
        const auto = r.score >= AUTO_ACTION_THRESHOLD;
        await this.repos.modFlags.record({
          targetUserId: ctx.userId,
          contentType: ctx.contentType,
          contentId: ctx.contentId,
          classifier: r.classifier,
          score: r.score,
          autoActioned: auto,
        });
        if (auto) blocked = true;
      }
    }
    return !blocked;
  }
}
