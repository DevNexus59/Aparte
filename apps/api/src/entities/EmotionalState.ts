import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './User';

export type StateValue = 'need_to_talk' | 'socially_tired' | 'available' | 'want_to_see';

@Entity({ name: 'emotional_states' })
@Index(['userId', 'expiresAt'])
export class EmotionalState {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({
    type: 'enum',
    enum: ['need_to_talk', 'socially_tired', 'available', 'want_to_see'],
  })
  state!: StateValue;

  @CreateDateColumn()
  setAt!: Date;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  isActive(now: Date = new Date()): boolean {
    return this.expiresAt > now;
  }
}
