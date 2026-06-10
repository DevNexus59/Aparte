import { describe, it, expect } from 'vitest';
import { MemoryCache } from '../src/lib/cache';

describe('MemoryCache (B4)', () => {
  it('reconnaît une clé non expirée', async () => {
    const c = new MemoryCache();
    await c.set('jti-1', 60_000);
    expect(await c.has('jti-1')).toBe(true);
  });

  it('expire après le TTL', async () => {
    const c = new MemoryCache();
    await c.set('jti-2', 5);
    await new Promise((r) => setTimeout(r, 20));
    expect(await c.has('jti-2')).toBe(false);
  });

  it('renvoie false pour une clé jamais posée', async () => {
    const c = new MemoryCache();
    expect(await c.has('inconnu')).toBe(false);
  });
});
