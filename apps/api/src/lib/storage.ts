import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export interface StoredFile { key: string }
export interface ReadResult { buffer: Buffer; mime: string }

export interface FileStorage {
  put(buffer: Buffer, mime: string): Promise<StoredFile>;
  read(key: string): Promise<ReadResult>;
  delete(key: string): Promise<void>;
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
};

const MIME_BY_EXT: Record<string, string> = {
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  webp: 'image/webp',
};

export class LocalFileStorage implements FileStorage {
  constructor(private readonly dir: string) {}

  async put(buffer: Buffer, mime: string): Promise<StoredFile> {
    await fs.mkdir(this.dir, { recursive: true });
    const ext = EXT_BY_MIME[mime] ?? 'bin';
    const key = `${crypto.randomUUID()}.${ext}`;
    await fs.writeFile(path.join(this.dir, key), buffer);
    return { key };
  }

  async read(key: string): Promise<ReadResult> {
    if (key.includes('/') || key.includes('\\') || key.includes('..')) {
      throw new Error('clé invalide');
    }
    const buffer = await fs.readFile(path.join(this.dir, key));
    const ext = key.split('.').pop()?.toLowerCase() ?? '';
    const mime = MIME_BY_EXT[ext] ?? 'application/octet-stream';
    return { buffer, mime };
  }

  async delete(key: string): Promise<void> {
    if (key.includes('/') || key.includes('\\') || key.includes('..')) return;
    try { await fs.unlink(path.join(this.dir, key)); } catch { /* idempotent */ }
  }
}
