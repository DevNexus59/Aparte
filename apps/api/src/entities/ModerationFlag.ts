import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './User';

@Entity({ name: 'moderation_flags' })
export class ModerationFlag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  targetUserId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_user_id' })
  target!: User;

  @Column({ type: 'varchar', length: 40 })
  contentType!: string;

  @Column({ type: 'uuid', nullable: true })
  contentId!: string | null;

  @Column({ type: 'varchar', length: 60 })
  classifier!: string;

  @Column({ type: 'decimal', precision: 4, scale: 3 })
  score!: string;

  @Column({ type: 'boolean', default: false })
  autoActioned!: boolean;

  @CreateDateColumn()
  flaggedAt!: Date;
}
