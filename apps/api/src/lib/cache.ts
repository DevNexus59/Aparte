// Abstraction Cache. Implémentation mémoire par défaut.
// En prod multi-instance : remplacer par RedisCache (même interface).

export interface Cache {
  has(key: string): Promise<boolean>;
  set(key: string, ttlMs: number): Promise<void>;
}

interface Entry { expiresAt: number; }

export class MemoryCache implements Cache {
  private readonly store = new Map<string, Entry>();

  constructor(private readonly cleanupIntervalMs = 60_000) {
    setInterval(() => this.cleanup(), this.cleanupIntervalMs).unref();
  }

  async has(key: string): Promise<boolean> {
    const e = this.store.get(key);
    if (!e) return false;
    if (e.expiresAt <= Date.now()) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async set(key: string, ttlMs: number): Promise<void> {
    this.store.set(key, { expiresAt: Date.now() + ttlMs });
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) this.store.delete(key);
    }
  }
}
