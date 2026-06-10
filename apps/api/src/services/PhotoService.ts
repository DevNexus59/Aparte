import { FileStorage } from '../lib/storage';
import { Repositories } from '../repositories';
import { ModerationService } from './ModerationService';
import { AppError } from '../middlewares/errorHandler';

const MAX_BYTES = 5 * 1024 * 1024;

// Magic bytes (M10) : on ne fait pas confiance au Content-Type du client.
// On supporte JPEG, PNG, WebP — formats produits typiquement par expo-image-picker.
// HEIC n'est pas supporté (la plupart des libs Node ne le décodent pas).
interface Signature {
  ext: 'jpg' | 'png' | 'webp';
  mime: string;
  matches: (b: Buffer) => boolean;
}

const SIGNATURES: Signature[] = [
  {
    ext: 'jpg', mime: 'image/jpeg',
    matches: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: 'png', mime: 'image/png',
    matches: (b) => b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    ext: 'webp', mime: 'image/webp',
    matches: (b) =>
      b.length >= 12
      && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46  // "RIFF"
      && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50, // "WEBP"
  },
];

function detect(buffer: Buffer): Signature | null {
  return SIGNATURES.find((s) => s.matches(buffer)) ?? null;
}

interface UploadInput {
  userId: string;
  buffer: Buffer;
  mime: string;
}

export class PhotoService {
  constructor(
    private readonly repos: Repositories,
    private readonly storage: FileStorage,
    private readonly moderation: ModerationService,
  ) {}

  async uploadProfilePhoto(input: UploadInput): Promise<{ key: string }> {
    if (input.buffer.byteLength > MAX_BYTES) {
      throw new AppError(413, 'Image trop volumineuse (max 5 Mo)');
    }

    // M10 : on s'appuie sur les magic bytes, pas sur le Content-Type.
    const sig = detect(input.buffer);
    if (!sig) {
      throw new AppError(400, 'Format non supporté (JPEG, PNG ou WebP uniquement)');
    }

    const user = await this.repos.users.findById(input.userId);
    if (!user) throw new AppError(404, 'Utilisateur introuvable');

    // I10 + B5 : modération AVANT stockage, sur le buffer en mémoire.
    const ok = await this.moderation.screenImage({
      userId: input.userId,
      buffer: input.buffer,
      mime: sig.mime,
      contentType: 'profile_photo',
    });
    if (!ok) {
      throw new AppError(422, 'Image refusée par la modération automatique');
    }

    const { key } = await this.storage.put(input.buffer, sig.mime);
    const previousKey = user.photoUrl;
    user.photoUrl = key;
    await this.repos.users.save(user);

    if (previousKey) {
      await this.storage.delete(previousKey).catch(() => undefined);
    }

    await this.repos.audit.record({
      userId: input.userId, action: 'user.photo.upload',
      entity: 'user', entityId: input.userId,
    });

    return { key };
  }

  async readPhotoFor(viewerUserId: string, targetUserId: string) {
    if (viewerUserId !== targetUserId) {
      const reciprocal = await this.repos.links.areReciprocallyLinked(viewerUserId, targetUserId);
      if (!reciprocal) throw new AppError(403, 'Photo non accessible');
    }
    const user = await this.repos.users.findById(targetUserId);
    if (!user || !user.photoUrl) throw new AppError(404, 'Pas de photo');
    return this.storage.read(user.photoUrl);
  }
}
