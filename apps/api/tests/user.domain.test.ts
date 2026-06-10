import { describe, it, expect } from 'vitest';
import { User } from '../src/entities/User';

function makeUser(birthdate: string): User {
  const u = new User();
  u.birthdate = birthdate;
  return u;
}

describe('User domain', () => {
  describe('getAge', () => {
    it('renvoie 25 pour quelqu\'un né il y a 25 ans', () => {
      const now = new Date('2026-05-30');
      const u = makeUser('2001-05-30');
      expect(u.getAge(now)).toBe(25);
    });

    it('renvoie 24 si l\'anniversaire est demain', () => {
      const now = new Date('2026-05-30');
      const u = makeUser('2001-05-31');
      expect(u.getAge(now)).toBe(24);
    });

    it('M1 : gère le 29 février', () => {
      // Né le 29/02/2008 (année bissextile). Le 28/02/2026 -> pas encore son anniv.
      const u = makeUser('2008-02-29');
      expect(u.getAge(new Date('2026-02-28'))).toBe(17);
      expect(u.getAge(new Date('2026-03-01'))).toBe(18);
    });
  });

  describe('isAdult / canLogin / isLocked', () => {
    it('refuse les < 18 ans', () => {
      const u = makeUser('2015-01-01');
      expect(u.isAdult()).toBe(false);
    });

    it('autorise un user actif non verrouillé', () => {
      const u = makeUser('1990-01-01');
      u.status = 'active';
      u.lockedUntil = null;
      expect(u.canLogin()).toBe(true);
    });

    it('refuse un user verrouillé temporairement', () => {
      const u = makeUser('1990-01-01');
      u.status = 'active';
      u.lockedUntil = new Date(Date.now() + 60_000);
      expect(u.isLocked()).toBe(true);
      expect(u.canLogin()).toBe(false);
    });

    it('autorise à nouveau quand le verrou est passé', () => {
      const u = makeUser('1990-01-01');
      u.status = 'active';
      u.lockedUntil = new Date(Date.now() - 60_000);
      expect(u.isLocked()).toBe(false);
      expect(u.canLogin()).toBe(true);
    });

    it('refuse un user banni', () => {
      const u = makeUser('1990-01-01');
      u.status = 'banned';
      expect(u.canLogin()).toBe(false);
    });
  });
});
