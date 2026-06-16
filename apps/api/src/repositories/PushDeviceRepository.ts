import { DataSource } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { PushDevice, PushPlatform } from '../entities/PushDevice';

interface RegisterInput {
  userId: string;
  token: string;
  platform: PushPlatform;
  deviceInfo?: string;
}

export class PushDeviceRepository extends BaseRepository<PushDevice> {
  constructor(dataSource: DataSource) {
    super(dataSource, PushDevice);
  }

  // Upsert : si le token existe déjà, on rattache au user courant
  // (cas du même device qui se reconnecte après logout).
  async registerOrUpdate(input: RegisterInput): Promise<PushDevice> {
    const existing = await this.repo.findOne({ where: { token: input.token } });
    if (existing) {
      existing.userId = input.userId;
      existing.platform = input.platform;
      existing.deviceInfo = input.deviceInfo ?? null;
      return this.repo.save(existing);
    }
    const device = this.repo.create({
      ...input,
      deviceInfo: input.deviceInfo ?? null,
    });
    return this.repo.save(device);
  }

  listForUser(userId: string): Promise<PushDevice[]> {
    return this.repo.find({ where: { userId } });
  }

  listForUsers(userIds: string[]): Promise<PushDevice[]> {
    if (userIds.length === 0) return Promise.resolve([]);
    return this.repo
      .createQueryBuilder('d')
      .where('d.user_id IN (:...ids)', { ids: userIds })
      .getMany();
  }

  async dropToken(token: string): Promise<void> {
    await this.repo.delete({ token });
  }

  async dropTokens(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.repo
      .createQueryBuilder()
      .delete()
      .where('token IN (:...tokens)', { tokens })
      .execute();
  }

  // Désenregistrement par l'utilisateur lui-même : on restreint la
  // suppression à ses propres devices pour éviter qu'un user déconnecte
  // ceux d'un autre en devinant/réutilisant un token.
  async dropTokenForUser(userId: string, token: string): Promise<void> {
    await this.repo.delete({ userId, token });
  }

  // Nettoyage : tokens d'un user spécifique (logout-all, suppression compte).
  async dropForUser(userId: string): Promise<void> {
    await this.repo.delete({ userId });
  }
}
