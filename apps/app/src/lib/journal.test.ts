import { describe, it, expect } from 'vitest';
import { journalUrl, flattenJournalPages, type JournalEntry } from '@/lib/journal';

describe('journalUrl', () => {
  it('sans cursor', () => {
    expect(journalUrl(20, null)).toBe('/heartbeat/journal?limit=20');
  });

  it('avec cursor, encodé', () => {
    expect(journalUrl(20, '2024-01-01T00:00:00Z')).toBe(
      '/heartbeat/journal?limit=20&before=2024-01-01T00%3A00%3A00Z',
    );
  });
});

describe('flattenJournalPages', () => {
  const entry = (id: string): JournalEntry => ({
    id, content: '', type: 'gratitude', linkId: null, createdAt: '2024-01-01',
  });

  it('vide si pas de pages', () => {
    expect(flattenJournalPages(undefined)).toEqual([]);
  });

  it('concatène les items de toutes les pages dans l\'ordre', () => {
    const pages = [
      { items: [entry('a'), entry('b')], nextCursor: 'c1' },
      { items: [entry('c')], nextCursor: null },
    ];
    expect(flattenJournalPages(pages).map((e) => e.id)).toEqual(['a', 'b', 'c']);
  });
});
