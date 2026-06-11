import { describe, it, expect } from 'vitest';
import { inviteMessage } from './share';

describe('inviteMessage', () => {
  it('utilise une formule générique sans nom', () => {
    expect(inviteMessage()).toMatch(/^Salut !/);
  });

  it('personnalise la formule avec le nom du contact', () => {
    expect(inviteMessage('Léa')).toContain('Salut Léa !');
  });
});
