import { DataSource } from 'typeorm';
import path from 'node:path';
import { Repositories } from '../repositories';
import { Cache, MemoryCache } from '../lib/cache';
import { MemoryTTLCache } from '../lib/ttlCache';
import { NoopClassifier } from '../lib/moderation';
import { AIProvider, NoopAIProvider, GeminiProvider } from '../lib/ai';
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
import { AIService } from './AIService';

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
  readonly ai: AIService;

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

    // Suggestions IA (Gemini) — désactivées silencieusement sans GEMINI_API_KEY.
    const aiProvider: AIProvider = process.env.GEMINI_API_KEY
      ? new GeminiProvider(process.env.GEMINI_API_KEY, process.env.GEMINI_MODEL)
      : new NoopAIProvider();
    this.ai = new AIService(repos, dataSource, aiProvider, new MemoryTTLCache(), this.heartbeat, this.states);
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
