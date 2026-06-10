export interface JournalEntry {
  id: string;
  content: string;
  type: 'gratitude' | 'memory' | 'reflection';
  linkId: string | null;
  createdAt: string;
}

export interface JournalPage {
  items: JournalEntry[];
  nextCursor: string | null;
}

export function journalUrl(limit: number, cursor: string | null): string {
  return `/heartbeat/journal?limit=${limit}${cursor ? `&before=${encodeURIComponent(cursor)}` : ''}`;
}

export function flattenJournalPages(pages: JournalPage[] | undefined): JournalEntry[] {
  return (pages ?? []).flatMap((p) => p.items);
}
