import { describe, it, expect } from 'vitest';
import { encryptText, decryptText } from '../src/lib/encryption';

describe('encryptText / decryptText', () => {
  it('round-trip : déchiffre exactement le texte chiffré', () => {
    const plain = 'Coucou, comment tu vas ? 🙂';
    const enc = encryptText(plain);
    expect(decryptText(enc)).toBe(plain);
  });

  it('produit un IV différent à chaque appel', () => {
    const a = encryptText('même message');
    const b = encryptText('même message');
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it('rejette un authTag falsifié', () => {
    const enc = encryptText('secret');
    expect(() => decryptText({ ...enc, authTag: enc.authTag.slice(0, -2) + 'AA' })).toThrow();
  });

  it('rejette un ciphertext falsifié', () => {
    const enc = encryptText('secret');
    const tampered = Buffer.from(enc.ciphertext, 'base64');
    tampered[0] = tampered[0] ^ 0xff;
    expect(() => decryptText({ ...enc, ciphertext: tampered.toString('base64') })).toThrow();
  });
});
