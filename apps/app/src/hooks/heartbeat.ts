import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { journalUrl, flattenJournalPages, type JournalEntry, type JournalPage } from '@/lib/journal';

export { flattenJournalPages, type JournalEntry };

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
    queryFn: ({ pageParam }) => api<JournalPage>(journalUrl(20, pageParam)),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export interface JournalSuggestion {
  text: string;
  category: 'gratitude' | 'reconnect' | 'memory' | 'reflection' | 'general';
}

export function useJournalSuggestions() {
  return useQuery({
    queryKey: ['journal-suggestions'],
    queryFn: () => api<{ suggestions: JournalSuggestion[] }>('/heartbeat/journal/suggestions').then((d) => d.suggestions),
    staleTime: 30 * 60 * 1000,
  });
}
