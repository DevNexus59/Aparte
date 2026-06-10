import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { User } from './User';
import { Nudge } from './Nudge';

export type LinkStatus = 'active' | 'pending' | 'removed';

@Entity({ name: 'links' })
@Index(['ownerUserId', 'status'])
export class Link {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  ownerUserId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_user_id' })
  owner!: User;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  memberUserId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'member_user_id' })
  member!: User | null;

  @Column({ type: 'varchar', length: 80 })
  contactName!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  contactPhone!: string | null;

  @Column({ type: 'enum', enum: ['active', 'pending', 'removed'], default: 'active' })
  status!: LinkStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Nudge, (n) => n.link)
  nudges!: Nudge[];

  isActive(): boolean {
    return this.status === 'active';
  }
}
