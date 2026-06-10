import { DataSource } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { AuditLog } from '../entities/AuditLog';

interface RecordInput {
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  ip?: string;
}

export class AuditLogRepository extends BaseRepository<AuditLog> {
  constructor(dataSource: DataSource) {
    super(dataSource, AuditLog);
  }

  // Fire-and-forget — un échec d'audit ne doit jamais bloquer la requête.
  async record(input: RecordInput): Promise<void> {
    try {
      const entry = this.repo.create({
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity ?? null,
        entityId: input.entityId ?? null,
        ip: input.ip ?? null,
      });
      await this.repo.save(entry);
    } catch (err) {
      // Logger côté process, mais ne pas propager.
      console.error('[audit] failed to record:', err);
    }
  }
}
