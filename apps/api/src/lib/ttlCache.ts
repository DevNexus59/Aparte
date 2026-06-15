// Cache TTL en mémoire, complément de lib/cache.ts (qui ne fait que de la
// présence, pas du stockage de valeur). Suffisant à l'échelle d'une seule
// instance — pas de Redis nécessaire pour ce side-project.

export interface TTLCache<V> {
  get(key: string): V | undefined;
  set(key: string, value: V, ttlMs: number): void;
}

interface Entry<V> {
  value: V;
  expiresAt: number;
}

export class MemoryTTLCache<V> implements TTLCache<V> {
  private readonly store = new Map<string, Entry<V>>();

  constructor(private readonly cleanupIntervalMs = 60_000) {
    setInterval(() => this.cleanup(), this.cleanupIntervalMs).unref();
  }

  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: V, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) this.store.delete(key);
    }
  }
}
