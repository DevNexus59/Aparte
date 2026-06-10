import { ApiError } from '@/lib/errors';

// Rejoue `request` avec un token rafraîchi si la première tentative échoue en 401.
export async function uploadWithAuthRetry<T>(
  request: (token: string | null) => Promise<T>,
  getToken: () => string | null,
  refresh: () => Promise<string | null>,
): Promise<T> {
  try {
    return await request(getToken());
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      const newToken = await refresh();
      return request(newToken);
    }
    throw e;
  }
}
