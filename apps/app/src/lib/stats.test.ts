import { describe, it, expect } from 'vitest';
import { membershipLabel } from '@/lib/stats';

describe('membershipLabel', () => {
  it('formate en mois + année, en français', () => {
    expect(membershipLabel('2024-04-15T12:00:00Z')).toBe('Membre depuis avril 2024');
  });

  it('ne contient jamais de jours/semaines (pas de comparaison d\'ancienneté)', () => {
    expect(membershipLabel('2023-11-01T12:00:00Z')).toBe('Membre depuis novembre 2023');
  });
});
