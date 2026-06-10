import { create } from 'zustand';
import { storage, StorageKeys } from '@/lib/storage';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setTokens: (a: string, r: string, userId?: string) => Promise<void>;
  clear: () => Promise<void>;
}

// Décodage base64url côté RN. atob existe en environnement Hermes récent (RN 0.81+).
function decodeBase64Url(input: string): string {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return atob(base64);
}

function decodeSub(jwt: string): string | null {
  try {
    const part = jwt.split('.')[1];
    if (!part) return null;
    const json = decodeBase64Url(part);
    const payload = JSON.parse(json) as { sub?: string };
    return payload.sub ?? null;
  } catch { return null; }
}

export const useAuth = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  userId: null,
  hydrated: false,

  async hydrate() {
    const [a, r] = await Promise.all([
      storage.get(StorageKeys.accessToken),
      storage.get(StorageKeys.refreshToken),
    ]);
    set({
      accessToken: a, refreshToken: r,
      userId: a ? decodeSub(a) : null,
      hydrated: true,
    });
  },

  async setTokens(accessToken, refreshToken) {
    await Promise.all([
      storage.set(StorageKeys.accessToken, accessToken),
      storage.set(StorageKeys.refreshToken, refreshToken),
    ]);
    set({ accessToken, refreshToken, userId: decodeSub(accessToken) });
  },

  async clear() {
    await Promise.all([
      storage.remove(StorageKeys.accessToken),
      storage.remove(StorageKeys.refreshToken),
    ]);
    set({ accessToken: null, refreshToken: null, userId: null });
  },
}));
