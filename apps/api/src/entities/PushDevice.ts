import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './User';

export type PushPlatform = 'ios' | 'android' | 'web';

@Entity({ name: 'push_devices' })
export class PushDevice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  token!: string;

  @Column({ type: 'enum', enum: ['ios', 'android', 'web'] })
  platform!: PushPlatform;

  @Column({ type: 'varchar', length: 255, nullable: true })
  deviceInfo!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  lastSeenAt!: Date;
}
