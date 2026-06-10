import Constants from 'expo-constants';
import { useAuth } from '@/stores/auth';
import { ApiError, NetworkError } from '@/lib/errors';

export { ApiError, NetworkError };

const API_URL =
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  'http://localhost:4000';

interface ApiErrorDetail { path: string; message: string }

// Déduplication des refresh concurrents.
let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const { refreshToken, setTokens, clear } = useAuth.getState();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (res.status === 401) {
      await clear();
      return null;
    }
    if (!res.ok) return null;
    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    await setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

export function refreshOnce(): Promise<string | null> {
  if (!refreshing) refreshing = doRefresh().finally(() => { refreshing = null; });
  return refreshing;
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  timeoutMs?: number;
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, timeoutMs = 15_000 } = opts;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = useAuth.getState().accessToken;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const doFetch = async (): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  };

  let res: Response;
  try {
    res = await doFetch();
  } catch {
    throw new NetworkError();
  }

  if (auth && res.status === 401) {
    const newToken = await refreshOnce();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      try {
        res = await doFetch();
      } catch {
        throw new NetworkError();
      }
    }
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const body = data as { error?: string; details?: ApiErrorDetail[] };
    throw new ApiError(res.status, body.error ?? 'Erreur', body.details);
  }
  return data as T;
}
