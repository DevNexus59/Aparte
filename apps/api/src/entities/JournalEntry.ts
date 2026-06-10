import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Link } from './Link';
import { WeeklyPrompt } from './WeeklyPrompt';

export type JournalType = 'gratitude' | 'memory' | 'reflection';

@Entity({ name: 'journal_entries' })
@Index(['userId', 'createdAt'])
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  linkId!: string | null;

  @ManyToOne(() => Link, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'link_id' })
  link!: Link | null;

  @Column({ type: 'int', nullable: true })
  promptId!: number | null;

  @ManyToOne(() => WeeklyPrompt, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'prompt_id' })
  prompt!: WeeklyPrompt | null;

  @Column({ type: 'enum', enum: ['gratitude', 'memory', 'reflection'], default: 'reflection' })
  type!: JournalType;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
