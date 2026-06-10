import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type EmotionalState = 'need_to_talk' | 'socially_tired' | 'available' | 'want_to_see';

export interface MyState {
  id: string;
  state: EmotionalState;
  setAt: string;
  expiresAt: string;
}

export interface CircleState {
  userId: string;
  displayName: string;
  photoUrl: string | null;
  state: EmotionalState;
  setAt: string;
  expiresAt: string;
}

const myKey = ['states', 'me'] as const;
const circleKey = ['states', 'circle'] as const;

export function useMyState() {
  return useQuery({
    queryKey: myKey,
    queryFn: () => api<{ state: MyState | null }>('/states/me').then((d) => d.state),
  });
}

export function useCircleStates() {
  return useQuery({
    queryKey: circleKey,
    queryFn: () => api<{ states: CircleState[] }>('/states/circle').then((d) => d.states),
  });
}

export function useSetState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { state: EmotionalState; durationHours?: number }) =>
      api<{ state: MyState }>('/states/me', { method: 'PUT', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: myKey }),
  });
}

export function useClearState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>('/states/me', { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: myKey }),
  });
}
