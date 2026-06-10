export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
}

export interface MessagePage {
  items: Message[];
  nextCursor: string | null;
}

export interface ConversationSummary {
  userId: string;
  lastMessage: Message | null;
}

export function messagesUrl(otherUserId: string, limit: number, cursor: string | null): string {
  return `/messages/${otherUserId}?limit=${limit}${cursor ? `&before=${encodeURIComponent(cursor)}` : ''}`;
}

export function flattenMessagePages(pages: MessagePage[] | undefined): Message[] {
  return (pages ?? []).flatMap((p) => p.items);
}
