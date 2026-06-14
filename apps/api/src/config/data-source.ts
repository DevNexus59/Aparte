import 'reflect-metadata';
import path from 'node:path';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { User } from '../entities/User';
import { WeeklyPrompt } from '../entities/WeeklyPrompt';
import { AuthRefreshToken } from '../entities/AuthRefreshToken';
import { PasswordReset } from '../entities/PasswordReset';
import { EmailVerification } from '../entities/EmailVerification';
import { Link } from '../entities/Link';
import { JournalEntry } from '../entities/JournalEntry';
import { Nudge } from '../entities/Nudge';
import { EmotionalState } from '../entities/EmotionalState';
import { Report } from '../entities/Report';
import { ModerationAction } from '../entities/ModerationAction';
import { ModerationFlag } from '../entities/ModerationFlag';
import { AuditLog } from '../entities/AuditLog';
import { PushDevice } from '../entities/PushDevice';
import { CronLock } from '../entities/CronLock';
import { Message } from '../entities/Message';

// Source de vérité du schéma : les entities. Le `schema.sql` initial devient une
// référence historique — pour la prod on génère des migrations TypeORM.
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'cercle',
  charset: 'utf8mb4',
  timezone: 'Z',
  // synchronize=true UNIQUEMENT en dev — en prod, migrations.
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV !== 'production' ? ['error', 'warn'] : ['error'],
  namingStrategy: new SnakeNamingStrategy(), // camelCase TS -> snake_case SQL
  entities: [
    User, WeeklyPrompt, AuthRefreshToken, PasswordReset, EmailVerification,
    Link, JournalEntry, Nudge, EmotionalState,
    Report, ModerationAction, ModerationFlag, AuditLog,
    PushDevice, CronLock, Message,
  ],
  // __dirname pointe vers src/config en dev (ts-node) et dist/config en prod
  // (build tsc) : le glob retombe donc naturellement sur les fichiers .ts ou
  // .js du dossier migrations correspondant.
  migrations: [path.join(__dirname, '..', 'migrations', '*.{ts,js}')],
});
