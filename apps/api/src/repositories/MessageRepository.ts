import { DataSource, IsNull, LessThan } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { Message, conversationKey } from '../entities/Message';
import { AppError } from '../middlewares/errorHandler';
import type { CursorPage, CursorPageOptions } from '../lib/pagination';
import { normalizeLimit } from '../lib/pagination';

interface CreateInput {
  senderId: string;
  recipientId: string;
  ciphertext: string;
  iv: string;
  authTag: string;
}

export class MessageRepository extends BaseRepository<Message> {
  constructor(dataSource: DataSource) {
    super(dataSource, Message);
  }

  create(input: CreateInput): Promise<Message> {
    const message = this.repo.create({
      ...input,
      conversationKey: conversationKey(input.senderId, input.recipientId),
    });
    return this.repo.save(message);
  }

  // Pagination cursor — même schéma que JournalEntryRepository.listForUser.
  async listConversation(
    userA: string,
    userB: string,
    opts: CursorPageOptions = {},
  ): Promise<CursorPage<Message>> {
    const limit = normalizeLimit(opts.limit);

    const where: Record<string, unknown> = {
      conversationKey: conversationKey(userA, userB),
      deletedAt: IsNull(),
    };
    if (opts.before) where.createdAt = LessThan(new Date(opts.before));

    const items = await this.repo.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit + 1,
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? page[page.length - 1].createdAt.toISOString() : null;

    return { items: page, nextCursor };
  }

  // Dernier message échangé avec chacun des `otherUserIds` — requêtes
  // parallèles (circle ≤ 3 membres) pour éviter la latence séquentielle.
  async lastMessageFor(userId: string, otherUserIds: string[]): Promise<Map<string, Message>> {
    const result = new Map<string, Message>();
    await Promise.all(
      otherUserIds.map(async (otherUserId) => {
        const last = await this.repo.findOne({
          where: { conversationKey: conversationKey(userId, otherUserId), deletedAt: IsNull() },
          order: { createdAt: 'DESC' },
        });
        if (last) result.set(otherUserId, last);
      }),
    );
    return result;
  }

  async softDeleteOwn(messageId: string, userId: string): Promise<void> {
    const result = await this.dataSource
      .createQueryBuilder()
      .softDelete()
      .from(Message)
      .where('id = :id AND sender_id = :senderId', { id: messageId, senderId: userId })
      .execute();
    if ((result.affected ?? 0) === 0) throw new AppError(404, 'Message introuvable');
  }

  // RGPD : purge dure des messages d'un utilisateur supprimé (envoyés ou reçus).
  async purgeForUser(userId: string): Promise<void> {
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(Message)
      .where('sender_id = :userId OR recipient_id = :userId', { userId })
      .execute();
  }

  // RGPD : export — tous les messages envoyés ou reçus, déchiffrement à
  // la charge de l'appelant (champs ciphertext/iv/authTag exposés bruts).
  findAllForUser(userId: string): Promise<Message[]> {
    return this.repo
      .createQueryBuilder('m')
      .where('(m.sender_id = :userId OR m.recipient_id = :userId) AND m.deleted_at IS NULL', { userId })
      .orderBy('m.created_at', 'ASC')
      .getMany();
  }

  // Stats non-anxiogènes : volume d'échanges (envoyés + reçus), un indicateur
  // de présence du lien — pas un score de réactivité.
  countForUser(userId: string): Promise<number> {
    return this.repo
      .createQueryBuilder('m')
      .where('(m.sender_id = :userId OR m.recipient_id = :userId) AND m.deleted_at IS NULL', { userId })
      .getCount();
  }
}
