import { useMutation } from '@tanstack/react-query';
import { api, ApiError, NetworkError } from '@/lib/api';
import { useAuth } from '@/stores/auth';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; displayName: string };
}

interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  birthdate: string;
}

export function useRegister() {
  const setTokens = useAuth((s) => s.setTokens);
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      api<AuthResponse>('/auth/register', { method: 'POST', body: input, auth: false }),
    onSuccess: async (data) => {
      await setTokens(data.accessToken, data.refreshToken);
    },
  });
}

export function useLogin() {
  const setTokens = useAuth((s) => s.setTokens);
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      api<AuthResponse>('/auth/login', { method: 'POST', body: input, auth: false }),
    onSuccess: async (data) => {
      await setTokens(data.accessToken, data.refreshToken);
    },
  });
}

// RGPD : droit à l'effacement — re-confirmation du mot de passe côté API.
export function useDeleteAccount() {
  const clear = useAuth((s) => s.clear);
  return useMutation({
    mutationFn: (password: string) =>
      api<void>('/auth/me', { method: 'DELETE', body: { password } }),
    onSuccess: async () => {
      await clear();
    },
  });
}

// Message d'erreur lisible : si l'API renvoie des détails Zod (champs invalides),
// on les liste — beaucoup plus utile que "Données invalides".
export function errorMessage(e: unknown): string {
  if (e instanceof NetworkError) return 'Pas de connexion. Réessaie dans un instant.';
  if (e instanceof ApiError) {
    if (e.details && e.details.length > 0) {
      const detail = e.details
        .map((d) => `${d.path}: ${d.message}`)
        .join(', ');
      return `${e.message} — ${detail}`;
    }
    return e.message;
  }
  return 'Une erreur est survenue.';
}
