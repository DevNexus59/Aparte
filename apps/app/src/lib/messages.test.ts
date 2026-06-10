import { describe, it, expect } from 'vitest';
import { messagesUrl, flattenMessagePages, type Message, type MessagePage } from '@/lib/messages';

describe('messagesUrl', () => {
  it('sans cursor', () => {
    expect(messagesUrl('u2', 20, null)).toBe('/messages/u2?limit=20');
  });

  it('avec cursor, encodé', () => {
    expect(messagesUrl('u2', 20, '2024-01-01T00:00:00Z')).toBe(
      '/messages/u2?limit=20&before=2024-01-01T00%3A00%3A00Z',
    );
  });
});

describe('flattenMessagePages', () => {
  const msg = (id: string): Message => ({
    id, senderId: 'u1', recipientId: 'u2', content: '', createdAt: '2024-01-01',
  });

  it('vide si pas de pages', () => {
    expect(flattenMessagePages(undefined)).toEqual([]);
  });

  it('concatène les items de toutes les pages dans l\'ordre', () => {
    const pages: MessagePage[] = [
      { items: [msg('a'), msg('b')], nextCursor: 'c1' },
      { items: [msg('c')], nextCursor: null },
    ];
    expect(flattenMessagePages(pages).map((m) => m.id)).toEqual(['a', 'b', 'c']);
  });
});
