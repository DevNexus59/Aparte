import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Prompt { id: number; text: string; category: string }

export function useWeeklyPrompt() {
  return useQuery({
    queryKey: ['weekly-prompt'],
    queryFn: () => api<{ prompt: Prompt | null }>('/heartbeat/prompt').then((d) => d.prompt),
  });
}

interface JournalInput {
  content: string;
  type: 'gratitude' | 'memory' | 'reflection';
  linkId?: string;
  promptId?: number;
}

export interface JournalEntry {
  id: string;
  content: string;
  type: JournalInput['type'];
  linkId: string | null;
  createdAt: string;
}

interface JournalPage {
  items: JournalEntry[];
  nextCursor: string | null;
}

export function useAddJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: JournalInput) =>
      api<{ entry: JournalEntry; nudge: unknown }>('/heartbeat/journal', { method: 'POST', body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal'] });
      qc.invalidateQueries({ queryKey: ['nudges'] });
    },
  });
}

export function useJournalEntries() {
  return useInfiniteQuery({
    queryKey: ['journal'],
    queryFn: ({ pageParam }) =>
      api<JournalPage>(`/heartbeat/journal?limit=20${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ''}`),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
