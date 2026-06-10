import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Link } from './Link';

export type NudgeType = 'call' | 'coffee' | 'voice' | 'checkin';
export type NudgeSource = 'weekly' | 'inactivity' | 'manual';
export type NudgeStatus = 'suggested' | 'acted' | 'dismissed';

@Entity({ name: 'nudges' })
@Index(['userId', 'status'])
export class Nudge {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'uuid' })
  linkId!: string;

  @ManyToOne(() => Link, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'link_id' })
  link!: Link;

  @Column({ type: 'enum', enum: ['call', 'coffee', 'voice', 'checkin'] })
  type!: NudgeType;

  @Column({ type: 'enum', enum: ['weekly', 'inactivity', 'manual'], default: 'weekly' })
  source!: NudgeSource;

  @Column({ type: 'enum', enum: ['suggested', 'acted', 'dismissed'], default: 'suggested' })
  status!: NudgeStatus;

  @CreateDateColumn()
  suggestedAt!: Date;
}
