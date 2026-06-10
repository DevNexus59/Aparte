import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Report } from './Report';

export type ModerationActionType = 'warning' | 'suspension' | 'ban';

@Entity({ name: 'moderation_actions' })
export class ModerationAction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  targetUserId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_user_id' })
  target!: User;

  @Column({ type: 'uuid', nullable: true })
  reportId!: string | null;

  @ManyToOne(() => Report, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'report_id' })
  report!: Report | null;

  @Column({ type: 'uuid', nullable: true })
  moderatorId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'moderator_id' })
  moderator!: User | null;

  @Column({ type: 'enum', enum: ['warning', 'suspension', 'ban'] })
  action!: ModerationActionType;

  @Column({ type: 'boolean', default: false })
  automated!: boolean;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt!: Date | null;
}
