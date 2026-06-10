import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './User';

export type ReportReason = 'sexual' | 'discriminatory' | 'harassment' | 'other';
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

@Entity({ name: 'reports' })
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  reporterUserId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reporter_user_id' })
  reporter!: User | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  reportedUserId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reported_user_id' })
  reported!: User | null;

  @Column({ type: 'enum', enum: ['sexual', 'discriminatory', 'harassment', 'other'] })
  reason!: ReportReason;

  @Column({ type: 'varchar', length: 40 })
  contentType!: string;

  @Column({ type: 'uuid', nullable: true })
  contentId!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Index()
  @Column({
    type: 'enum',
    enum: ['open', 'reviewing', 'resolved', 'dismissed'],
    default: 'open',
  })
  status!: ReportStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt!: Date | null;
}
