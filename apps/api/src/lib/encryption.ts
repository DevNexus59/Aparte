import crypto from 'node:crypto';

// Chiffrement au repos pour le contenu des messages (RGPD : données
// personnelles sensibles). AES-256-GCM : authentifié, IV aléatoire par message.
const ALGO = 'aes-256-gcm';
const KEY_HEX = process.env.MESSAGE_ENCRYPTION_KEY ?? '0'.repeat(64);

if (process.env.NODE_ENV === 'production' && !/^[0-9a-f]{64}$/i.test(KEY_HEX)) {
  throw new Error('MESSAGE_ENCRYPTION_KEY doit être défini (hex 64 caractères / 32 octets) en production');
}

const KEY = Buffer.from(KEY_HEX, 'hex');

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export function encryptText(plain: string): EncryptedPayload {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  };
}

export function decryptText({ ciphertext, iv, authTag }: EncryptedPayload): string {
  const decipher = crypto.createDecipheriv(ALGO, KEY, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final(),
  ]);
  return plain.toString('utf8');
}
