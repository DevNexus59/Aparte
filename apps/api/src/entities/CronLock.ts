import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'cron_locks' })
export class CronLock {
  @PrimaryColumn({ type: 'varchar', length: 80 })
  jobName!: string;

  @Column({ type: 'timestamp' })
  acquiredAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
