import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, DeleteDateColumn, OneToMany,
} from 'typeorm';
import { AuthRefreshToken } from './AuthRefreshToken';
import { Link } from './Link';
import { JournalEntry } from './JournalEntry';
import { EmotionalState } from './EmotionalState';

export type UserRole = 'user' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'banned';
export type OnboardingIntent = 'maintain' | 'meet';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 80 })
  displayName!: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  photoUrl!: string | null;

  @Column({ type: 'date' })
  birthdate!: string;

  @Column({ type: 'enum', enum: ['maintain', 'meet'], default: 'maintain' })
  onboardingIntent!: OnboardingIntent;

  @Column({ type: 'enum', enum: ['user', 'moderator', 'admin'], default: 'user' })
  role!: UserRole;

  @Index()
  @Column({ type: 'enum', enum: ['active', 'suspended', 'banned'], default: 'active' })
  status!: UserStatus;

  @Column({ type: 'int', default: 0 })
  failedLoginAttempts!: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;

  @OneToMany(() => Link, (l) => l.owner) ownedLinks!: Link[];
  @OneToMany(() => JournalEntry, (j) => j.user) journalEntries!: JournalEntry[];
  @OneToMany(() => EmotionalState, (s) => s.user) emotionalStates!: EmotionalState[];
  @OneToMany(() => AuthRefreshToken, (t) => t.user) refreshTokens!: AuthRefreshToken[];

  // --- Domain rules ---

  getAge(now: Date = new Date()): number {
    const dob = new Date(this.birthdate);
    if (Number.isNaN(dob.getTime())) {
      throw new Error('birthdate invalide');
    }
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age;
  }

  isAdult(): boolean {
    try { return this.getAge() >= 18; }
    catch { return false; }
  }

  isLocked(now: Date = new Date()): boolean {
    return this.lockedUntil !== null && this.lockedUntil > now;
  }

  canLogin(): boolean {
    return this.status === 'active' && !this.isLocked();
  }
}
