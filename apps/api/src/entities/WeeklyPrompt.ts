import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity({ name: 'weekly_prompts' })
export class WeeklyPrompt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  text!: string;

  @Column({ type: 'varchar', length: 50, default: 'general' })
  category!: string;

  @Index()
  @Column({ type: 'boolean', default: true })
  active!: boolean;

  // 'ai' pour les questions générées via OpenAI (cf. AIService.enrichWeeklyPrompts).
  @Column({ type: 'enum', enum: ['manual', 'ai'], default: 'manual' })
  source!: 'manual' | 'ai';
}
