import { DataSource } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { UserRepository } from './UserRepository';
import { LinkRepository } from './LinkRepository';
import { JournalEntryRepository } from './JournalEntryRepository';
import { NudgeRepository } from './NudgeRepository';
import { EmotionalStateRepository } from './EmotionalStateRepository';
import { RefreshTokenRepository } from './RefreshTokenRepository';
import { AuditLogRepository } from './AuditLogRepository';
import { ReportRepository } from './ReportRepository';
import { ModerationActionRepository, ModerationFlagRepository } from './ModerationRepositories';
import { PushDeviceRepository } from './PushDeviceRepository';
import { MessageRepository } from './MessageRepository';
import { PasswordResetRepository } from './PasswordResetRepository';
import { EmailVerificationRepository } from './EmailVerificationRepository';

// Container léger : un point d'entrée pour les repositories, simple à injecter
// dans les services (et à mocker dans les tests).
export class Repositories {
  readonly users: UserRepository;
  readonly links: LinkRepository;
  readonly journal: JournalEntryRepository;
  readonly nudges: NudgeRepository;
  readonly states: EmotionalStateRepository;
  readonly refreshTokens: RefreshTokenRepository;
  readonly audit: AuditLogRepository;
  readonly reports: ReportRepository;
  readonly modActions: ModerationActionRepository;
  readonly modFlags: ModerationFlagRepository;
  readonly pushDevices: PushDeviceRepository;
  readonly messages: MessageRepository;
  readonly passwordResets: PasswordResetRepository;
  readonly emailVerifications: EmailVerificationRepository;

  constructor(dataSource: DataSource) {
    this.users = new UserRepository(dataSource);
    this.links = new LinkRepository(dataSource);
    this.journal = new JournalEntryRepository(dataSource);
    this.nudges = new NudgeRepository(dataSource);
    this.states = new EmotionalStateRepository(dataSource);
    this.refreshTokens = new RefreshTokenRepository(dataSource);
    this.audit = new AuditLogRepository(dataSource);
    this.reports = new ReportRepository(dataSource);
    this.modActions = new ModerationActionRepository(dataSource);
    this.modFlags = new ModerationFlagRepository(dataSource);
    this.pushDevices = new PushDeviceRepository(dataSource);
    this.messages = new MessageRepository(dataSource);
    this.passwordResets = new PasswordResetRepository(dataSource);
    this.emailVerifications = new EmailVerificationRepository(dataSource);
  }
}

// Instance applicative — initialisée au démarrage après AppDataSource.initialize().
export let repositories: Repositories;

export function initRepositories(): Repositories {
  repositories = new Repositories(AppDataSource);
  return repositories;
}
