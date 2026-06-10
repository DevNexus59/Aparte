import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Link {
  id: string;
  contactName: string;
  contactPhone: string | null;
  memberUserId: string | null;
  member?: { id: string; displayName: string; photoUrl: string | null } | null;
  status: 'active' | 'pending' | 'removed';
  createdAt: string;
}

const linksKey = ['links'] as const;

export function useLinks() {
  return useQuery({
    queryKey: linksKey,
    queryFn: () => api<{ links: Link[] }>('/links').then((d) => d.links),
  });
}

interface CreateLinkInput {
  contactName: string;
  contactPhone?: string;
  memberEmail?: string;
}

export function useCreateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLinkInput) =>
      api<{ link: Link }>('/links', { method: 'POST', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: linksKey }),
  });
}

export function useRemoveLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/links/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: linksKey }),
  });
}
