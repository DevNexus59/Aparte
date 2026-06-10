import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageService } from '../src/services/MessageService';
import { encryptText } from '../src/lib/encryption';
import { AppError } from '../src/middlewares/errorHandler';
import { Message, conversationKey } from '../src/entities/Message';

function makeMessage(overrides: Partial<Message> & { content?: string } = {}): Message {
  const { content, ...rest } = overrides;
  const enc = encryptText(content ?? 'hello');
  return Object.assign(new Message(), {
    id: 'm1',
    senderId: 'u1',
    recipientId: 'u2',
    conversationKey: conversationKey('u1', 'u2'),
    ciphertext: enc.ciphertext,
    iv: enc.iv,
    authTag: enc.authTag,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    deletedAt: null,
    ...rest,
  });
}

function makeRepos(opts: {
  reciprocal?: boolean;
  links?: { memberUserId: string; status: string }[];
} = {}) {
  const repos = {
    links: {
      areReciprocallyLinked: vi.fn(async () => opts.reciprocal ?? true),
      listForOwner: vi.fn(async () => opts.links ?? []),
    },
    messages: {
      create: vi.fn(async (input: { senderId: string; recipientId: string }) => makeMessage({
        senderId: input.senderId, recipientId: input.recipientId,
      })),
      listConversation: vi.fn(async () => ({ items: [makeMessage({ content: 'salut' })], nextCursor: null })),
      lastMessageFor: vi.fn(async () => new Map()),
      softDeleteOwn: vi.fn(async () => undefined),
    },
  } as never;
  return repos;
}

describe('MessageService.send', () => {
  beforeEach(() => vi.clearAllMocks());

  it('refuse si les utilisateurs ne sont pas réciproquement liés', async () => {
    const repos = makeRepos({ reciprocal: false });
    const moderation = { screenText: vi.fn(async () => true) } as never;
    const svc = new MessageService(repos, moderation);

    await expect(svc.send('u1', 'u2', 'salut')).rejects.toThrow(AppError);
  });

  it('refuse si la modération bloque le contenu', async () => {
    const repos = makeRepos({ reciprocal: true });
    const moderation = { screenText: vi.fn(async () => false) } as never;
    const svc = new MessageService(repos, moderation);

    await expect(svc.send('u1', 'u2', 'contenu interdit')).rejects.toThrow(AppError);
  });

  it('chiffre au repos puis renvoie le message en clair (round-trip)', async () => {
    const repos = makeRepos({ reciprocal: true });
    const moderation = { screenText: vi.fn(async () => true) } as never;
    const svc = new MessageService(repos, moderation);

    const result = await svc.send('u1', 'u2', 'Coucou !');

    expect(result.content).toBe('Coucou !');
    expect(repos.messages.create).toHaveBeenCalledWith(expect.objectContaining({
      senderId: 'u1', recipientId: 'u2',
    }));
    // Le contenu stocké n'est pas en clair.
    const stored = await repos.messages.create.mock.results[0].value;
    expect(stored.ciphertext).not.toContain('Coucou');
  });
});

describe('MessageService.listConversation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('refuse si les utilisateurs ne sont pas réciproquement liés', async () => {
    const repos = makeRepos({ reciprocal: false });
    const moderation = { screenText: vi.fn() } as never;
    const svc = new MessageService(repos, moderation);

    await expect(svc.listConversation('u1', 'u2')).rejects.toThrow(AppError);
  });

  it('déchiffre les messages de la conversation', async () => {
    const repos = makeRepos({ reciprocal: true });
    const moderation = { screenText: vi.fn() } as never;
    const svc = new MessageService(repos, moderation);

    const page = await svc.listConversation('u1', 'u2');

    expect(page.items).toHaveLength(1);
    expect(page.items[0].content).toBe('salut');
  });
});
