import { Repositories } from '../repositories';
import { ModerationService } from './ModerationService';
import { PushService } from './PushService';
import { encryptText, decryptText } from '../lib/encryption';
import { CursorPage, CursorPageOptions } from '../lib/pagination';
import { AppError } from '../middlewares/errorHandler';
import { broadcastNewMessage } from '../realtime';

export interface DecryptedMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
}

export interface ConversationSummary {
  userId: string;
  lastMessage: DecryptedMessage | null;
}

export class MessageService {
  constructor(
    private readonly repos: Repositories,
    private readonly moderation: ModerationService,
    private readonly push: PushService,
  ) {}

  async send(senderId: string, recipientId: string, content: string): Promise<DecryptedMessage> {
    if (senderId === recipientId) {
      throw new AppError(400, "On ne peut pas s'envoyer un message à soi-même");
    }

    const reciprocal = await this.repos.links.areReciprocallyLinked(senderId, recipientId);
    if (!reciprocal) throw new AppError(404, 'Utilisateur introuvable');

    const ok = await this.moderation.screenText({
      userId: senderId,
      text: content,
      contentType: 'message',
    });
    if (!ok) throw new AppError(422, 'Message refusé par la modération automatique');

    const { ciphertext, iv, authTag } = encryptText(content);
    const saved = await this.repos.messages.create({ senderId, recipientId, ciphertext, iv, authTag });

    const message: DecryptedMessage = {
      id: saved.id,
      senderId: saved.senderId,
      recipientId: saved.recipientId,
      content,
      createdAt: saved.createdAt.toISOString(),
    };

    broadcastNewMessage(message);

    // Politique « silence numérique » : pas de contenu ni d'expéditeur dans
    // le push, juste un signal qu'un message attend dans l'app.
    this.push.send({
      userIds: [recipientId],
      body: 'Tu as reçu un nouveau message.',
      data: { type: 'new_message', senderId },
    }).catch((e) => console.error('[push] new message notify failed', e));

    return message;
  }

  async listConversation(
    userId: string,
    otherUserId: string,
    opts: CursorPageOptions = {},
  ): Promise<CursorPage<DecryptedMessage>> {
    const reciprocal = await this.repos.links.areReciprocallyLinked(userId, otherUserId);
    if (!reciprocal) throw new AppError(404, 'Utilisateur introuvable');

    const page = await this.repos.messages.listConversation(userId, otherUserId, opts);
    return {
      items: page.items.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        recipientId: m.recipientId,
        content: decryptText(m),
        createdAt: m.createdAt.toISOString(),
      })),
      nextCursor: page.nextCursor,
    };
  }

  async listConversations(userId: string): Promise<ConversationSummary[]> {
    const links = await this.repos.links.listForOwner(userId);
    const otherUserIds = links
      .filter((l) => l.status === 'active' && l.memberUserId)
      .map((l) => l.memberUserId as string);

    const reciprocalIds: string[] = [];
    for (const otherUserId of otherUserIds) {
      if (await this.repos.links.areReciprocallyLinked(userId, otherUserId)) {
        reciprocalIds.push(otherUserId);
      }
    }

    const lastMessages = await this.repos.messages.lastMessageFor(userId, reciprocalIds);

    return reciprocalIds.map((otherUserId) => {
      const last = lastMessages.get(otherUserId);
      return {
        userId: otherUserId,
        lastMessage: last
          ? {
            id: last.id,
            senderId: last.senderId,
            recipientId: last.recipientId,
            content: decryptText(last),
            createdAt: last.createdAt.toISOString(),
          }
          : null,
      };
    });
  }

  deleteMessage(userId: string, messageId: string): Promise<void> {
    return this.repos.messages.softDeleteOwn(messageId, userId);
  }
}
