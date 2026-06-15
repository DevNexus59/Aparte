import { describe, it, expect, vi } from 'vitest';
import { AIService } from '../src/services/AIService';
import { AIProvider, NoopAIProvider, GeneratedPrompt } from '../src/lib/ai';
import { MemoryTTLCache } from '../src/lib/ttlCache';
import { AppError } from '../src/middlewares/errorHandler';

function fakeProvider(overrides: Partial<AIProvider> = {}): AIProvider {
  return {
    name: 'fake',
    conversationStarters: vi.fn(async () => ['Salut, comment vas-tu ?']),
    journalSuggestions: vi.fn(async (): Promise<GeneratedPrompt[]> => [{ text: 'Un souvenir récent', category: 'memory' }]),
    weeklyPrompts: vi.fn(async (): Promise<GeneratedPrompt[]> => [{ text: 'Une nouvelle question', category: 'reflection' }]),
    ...overrides,
  };
}

function fakeRepos(opts: { reciprocal?: boolean } = {}) {
  return {
    links: {
      areReciprocallyLinked: vi.fn(async () => opts.reciprocal ?? true),
    },
    messages: {
      lastMessageFor: vi.fn(async () => new Map()),
    },
    journal: {
      listForUser: vi.fn(async () => ({ items: [], nextCursor: null })),
    },
  } as never;
}

function fakeHeartbeat() {
  return { getCurrentWeeklyPrompt: vi.fn(async () => null) } as never;
}

function fakeStates() {
  return {
    getMyCurrent: vi.fn(async () => null),
    listCircle: vi.fn(async () => []),
  } as never;
}

function fakeDataSource(existingTexts: string[] = []) {
  const save = vi.fn(async (entities: unknown[]) => entities);
  const create = vi.fn((input: unknown) => input);
  const find = vi.fn(async () => existingTexts.map((text) => ({ text })));
  return {
    getRepository: vi.fn(() => ({ find, create, save })),
    _save: save,
    _create: create,
    _find: find,
  } as never;
}

describe('AIService', () => {
  it('NoopAIProvider retourne des tableaux vides', async () => {
    const noop = new NoopAIProvider();
    expect(await noop.conversationStarters({ daysSinceLastMessage: null, otherPersonState: null, myState: null })).toEqual([]);
    expect(await noop.journalSuggestions({ recentTypes: [], currentWeekPromptCategory: null })).toEqual([]);
    expect(await noop.weeklyPrompts({ existingTexts: [], count: 6 })).toEqual([]);
  });

  it('getConversationStarters: 404 si les users ne sont pas réciproquement liés', async () => {
    const repos = fakeRepos({ reciprocal: false });
    const svc = new AIService(repos, fakeDataSource(), fakeProvider(), new MemoryTTLCache(), fakeHeartbeat(), fakeStates());

    await expect(svc.getConversationStarters('u1', 'u2')).rejects.toThrow(AppError);
  });

  it('getConversationStarters: met en cache le résultat (provider appelé une seule fois)', async () => {
    const repos = fakeRepos();
    const provider = fakeProvider();
    const svc = new AIService(repos, fakeDataSource(), provider, new MemoryTTLCache(), fakeHeartbeat(), fakeStates());

    const first = await svc.getConversationStarters('u1', 'u2');
    const second = await svc.getConversationStarters('u1', 'u2');

    expect(first).toEqual(['Salut, comment vas-tu ?']);
    expect(second).toEqual(first);
    expect(provider.conversationStarters).toHaveBeenCalledTimes(1);
  });

  it('getConversationStarters: résultat vide aussi mis en cache (negative cache)', async () => {
    const repos = fakeRepos();
    const provider = fakeProvider({ conversationStarters: vi.fn(async () => []) });
    const svc = new AIService(repos, fakeDataSource(), provider, new MemoryTTLCache(), fakeHeartbeat(), fakeStates());

    await svc.getConversationStarters('u1', 'u2');
    await svc.getConversationStarters('u1', 'u2');

    expect(provider.conversationStarters).toHaveBeenCalledTimes(1);
  });

  it('getJournalSuggestions: met en cache le résultat', async () => {
    const repos = fakeRepos();
    const provider = fakeProvider();
    const svc = new AIService(repos, fakeDataSource(), provider, new MemoryTTLCache(), fakeHeartbeat(), fakeStates());

    const first = await svc.getJournalSuggestions('u1');
    const second = await svc.getJournalSuggestions('u1');

    expect(first).toEqual([{ text: 'Un souvenir récent', category: 'memory' }]);
    expect(second).toEqual(first);
    expect(provider.journalSuggestions).toHaveBeenCalledTimes(1);
  });

  it('enrichWeeklyPrompts: persiste les prompts générés avec source "ai"', async () => {
    const repos = fakeRepos();
    const provider = fakeProvider();
    const dataSource = fakeDataSource(['Une question existante']);
    const svc = new AIService(repos, dataSource, provider, new MemoryTTLCache(), fakeHeartbeat(), fakeStates());

    const result = await svc.enrichWeeklyPrompts(6);

    expect(provider.weeklyPrompts).toHaveBeenCalledWith({ existingTexts: ['Une question existante'], count: 6 });
    expect((dataSource as any)._create).toHaveBeenCalledWith({
      text: 'Une nouvelle question',
      category: 'reflection',
      active: true,
      source: 'ai',
    });
    expect((dataSource as any)._save).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
  });

  it('enrichWeeklyPrompts: aucune écriture si le provider ne retourne rien', async () => {
    const repos = fakeRepos();
    const provider = fakeProvider({ weeklyPrompts: vi.fn(async () => []) });
    const dataSource = fakeDataSource();
    const svc = new AIService(repos, dataSource, provider, new MemoryTTLCache(), fakeHeartbeat(), fakeStates());

    const result = await svc.enrichWeeklyPrompts(6);

    expect(result).toEqual([]);
    expect((dataSource as any)._save).not.toHaveBeenCalled();
  });
});
