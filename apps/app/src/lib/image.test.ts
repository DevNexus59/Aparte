import { describe, it, expect } from 'vitest';
import { arrayBufferToDataUri } from './image';

describe('arrayBufferToDataUri', () => {
  it('encode les octets en base64 et préfixe avec le content-type', () => {
    const bytes = new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]); // "hello"
    const uri = arrayBufferToDataUri(bytes.buffer, 'image/jpeg');

    expect(uri).toBe('data:image/jpeg;base64,aGVsbG8=');
  });

  it('gère un buffer vide', () => {
    expect(arrayBufferToDataUri(new ArrayBuffer(0), 'image/png')).toBe('data:image/png;base64,');
  });
});
