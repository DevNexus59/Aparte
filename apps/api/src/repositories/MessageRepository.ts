import { DataSource, LessThan, IsNull } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { Message, conversationKey } from '../entities/Message';
import { CursorPage, CursorPageOptions, normalizeLimit } from '../lib/pagination';
import { AppError } from '../middlewares/errorHandler';

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

  // Dernier message échangé avec chacun des `otherUserIds` (cercle réciproque,
  // borné à quelques contacts — une requête par conversation reste négligeable).
  async lastMessageFor(userId: string, otherUserIds: string[]): Promise<Map<string, Message>> {
    const result = new Map<string, Message>();
    for (const otherUserId of otherUserIds) {
      const last = await this.repo.findOne({
        where: { conversationKey: conversationKey(userId, otherUserId), deletedAt: IsNull() },
        order: { createdAt: 'DESC' },
      });
      if (last) result.set(otherUserId, last);
    }
    return result;
  }

  async softDeleteOwn(messageId: string, userId: string): Promise<void> {
    const result = await this.repo.softDelete({ id: messageId, senderId: userId } as never);
    if (result.affected === 0) throw new AppError(404, 'Message introuvable');
  }

  // RGPD : purge dure des messages d'un utilisateur supprimé (envoyés ou reçus).
  async purgeForUser(userId: string): Promise<void> {
    await this.repo.delete({ senderId: userId } as never);
    await this.repo.delete({ recipientId: userId } as never);
  }

  // Stats non-anxiogènes : volume d'échanges (envoyés + reçus), un indicateur
  // de présence du lien — pas un score de réactivité.
  async countForUser(userId: string): Promise<number> {
    return this.repo.count({
      where: [
        { senderId: userId, deletedAt: IsNull() },
        { recipientId: userId, deletedAt: IsNull() },
      ] as never,
    });
  }
}
