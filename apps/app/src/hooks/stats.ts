import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { type MyStats } from '@/lib/stats';

export { type MyStats };

export function useMyStats() {
  return useQuery({
    queryKey: ['stats', 'me'],
    queryFn: () => api<MyStats>('/stats/me'),
  });
}
