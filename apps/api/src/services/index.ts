import { DataSource } from 'typeorm';
import path from 'node:path';
import { Repositories } from '../repositories';
import { Cache, MemoryCache } from '../lib/cache';
import { NoopClassifier } from '../lib/moderation';
import { LocalFileStorage, FileStorage } from '../lib/storage';
import { AuthService } from './AuthService';
import { HeartbeatService } from './HeartbeatService';
import { LinkService } from './LinkService';
import { EmotionalStateService } from './EmotionalStateService';
import { ModerationService } from './ModerationService';
import { PhotoService } from './PhotoService';
import { PushService } from './PushService';
import { MessageService } from './MessageService';
import { StatsService } from './StatsService';

export class Services {
  readonly auth: AuthService;
  readonly heartbeat: HeartbeatService;
  readonly links: LinkService;
  readonly states: EmotionalStateService;
  readonly moderation: ModerationService;
  readonly photos: PhotoService;
  readonly push: PushService;
  readonly messages: MessageService;
  readonly stats: StatsService;

  constructor(repos: Repositories, dataSource: DataSource, blacklist: Cache, storage: FileStorage) {
    this.auth = new AuthService(repos, blacklist, storage);
    this.heartbeat = new HeartbeatService(repos, dataSource);
    this.push = new PushService(repos);
    this.links = new LinkService(repos, this.push);
    this.states = new EmotionalStateService(repos);
    this.moderation = new ModerationService(repos, [new NoopClassifier()]);
    this.photos = new PhotoService(repos, storage, this.moderation);
    this.messages = new MessageService(repos, this.moderation, this.push);
    this.stats = new StatsService(repos);
  }
}

export let services: Services;
export let accessBlacklist: Cache;

export function initServices(repos: Repositories, dataSource: DataSource): Services {
  accessBlacklist = new MemoryCache();
  // Local en dev ; remplacer par S3Storage en prod. Plus d'URL publique (B6).
  const storage = new LocalFileStorage(
    path.resolve(process.cwd(), 'uploads'),
  );
  services = new Services(repos, dataSource, accessBlacklist, storage);
  return services;
}
