import { describe, it, expect } from 'vitest';
import { MemoryTTLCache } from '../src/lib/ttlCache';

describe('MemoryTTLCache', () => {
  it('renvoie la valeur posée avant expiration', () => {
    const c = new MemoryTTLCache<string[]>();
    c.set('k', ['a', 'b'], 60_000);
    expect(c.get('k')).toEqual(['a', 'b']);
  });

  it('expire après le TTL', async () => {
    const c = new MemoryTTLCache<string>();
    c.set('k', 'v', 5);
    await new Promise((r) => setTimeout(r, 20));
    expect(c.get('k')).toBeUndefined();
  });

  it('renvoie undefined pour une clé jamais posée', () => {
    const c = new MemoryTTLCache<string>();
    expect(c.get('inconnu')).toBeUndefined();
  });
});
