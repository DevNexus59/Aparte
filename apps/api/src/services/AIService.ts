import { DataSource } from 'typeorm';
import { Repositories } from '../repositories';
import { AppError } from '../middlewares/errorHandler';
import { TTLCache } from '../lib/ttlCache';
import { AIProvider, ConversationStarterContext, GeneratedPrompt, JournalSuggestionContext } from '../lib/ai';
import { WeeklyPrompt } from '../entities/WeeklyPrompt';
import { HeartbeatService } from './HeartbeatService';
import { EmotionalStateService } from './EmotionalStateService';

const CONVERSATION_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h
const JOURNAL_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h
const NEGATIVE_CACHE_TTL_MS = 60 * 60 * 1000; // 1h — évite de marteler OpenAI en cas d'échec/clé absente

export class AIService {
  constructor(
    private readonly repos: Repositories,
    private readonly dataSource: DataSource,
    private readonly provider: AIProvider,
    private readonly cache: TTLCache<unknown>,
    private readonly heartbeat: HeartbeatService,
    private readonly states: EmotionalStateService,
  ) {}

  async getConversationStarters(userId: string, otherUserId: string): Promise<string[]> {
    const reciprocal = await this.repos.links.areReciprocallyLinked(userId, otherUserId);
    if (!reciprocal) throw new AppError(404, 'Lien introuvable');

    const cacheKey = `convo:${userId}:${otherUserId}`;
    const cached = this.cache.get(cacheKey) as string[] | undefined;
    if (cached) return cached;

    const ctx = await this.buildConversationContext(userId, otherUserId);
    const suggestions = await this.provider.conversationStarters(ctx);
    this.cache.set(cacheKey, suggestions, suggestions.length > 0 ? CONVERSATION_CACHE_TTL_MS : NEGATIVE_CACHE_TTL_MS);
    return suggestions;
  }

  async getJournalSuggestions(userId: string): Promise<GeneratedPrompt[]> {
    const cacheKey = `journal:${userId}`;
    const cached = this.cache.get(cacheKey) as GeneratedPrompt[] | undefined;
    if (cached) return cached;

    const ctx = await this.buildJournalContext(userId);
    const suggestions = await this.provider.journalSuggestions(ctx);
    this.cache.set(cacheKey, suggestions, suggestions.length > 0 ? JOURNAL_CACHE_TTL_MS : NEGATIVE_CACHE_TTL_MS);
    return suggestions;
  }

  // Appelé uniquement par le cron mensuel / un déclenchement admin — jamais
  // par une route accessible à un utilisateur final.
  async enrichWeeklyPrompts(count: number): Promise<WeeklyPrompt[]> {
    const repo = this.dataSource.getRepository(WeeklyPrompt);
    const existing = await repo.find({ select: ['text'] });
    const generated = await this.provider.weeklyPrompts({
      existingTexts: existing.map((p) => p.text),
      count,
    });
    if (generated.length === 0) return [];

    const entities = generated.map((g) => repo.create({
      text: g.text,
      category: g.category,
      active: true,
      source: 'ai',
    }));
    return repo.save(entities);
  }

  private async buildConversationContext(userId: string, otherUserId: string): Promise<ConversationStarterContext> {
    const lastMessages = await this.repos.messages.lastMessageFor(userId, [otherUserId]);
    const last = lastMessages.get(otherUserId);
    const daysSinceLastMessage = last
      ? Math.floor((Date.now() - last.createdAt.getTime()) / (24 * 60 * 60 * 1000))
      : null;

    const [myState, circleStates] = await Promise.all([
      this.states.getMyCurrent(userId),
      this.states.listCircle(userId),
    ]);
    const otherState = circleStates.find((s) => s.userId === otherUserId);

    return {
      daysSinceLastMessage,
      otherPersonState: otherState?.state ?? null,
      myState: myState?.state ?? null,
    };
  }

  private async buildJournalContext(userId: string): Promise<JournalSuggestionContext> {
    const [{ items: recentEntries }, currentPrompt] = await Promise.all([
      this.repos.journal.listForUser(userId, { limit: 5 }),
      this.heartbeat.getCurrentWeeklyPrompt(),
    ]);

    return {
      recentTypes: recentEntries.map((e) => e.type),
      currentWeekPromptCategory: currentPrompt?.category ?? null,
    };
  }
}
