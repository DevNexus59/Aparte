import { DataSource, IsNull } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { User } from '../entities/User';

interface CreateUserInput {
  email: string;
  passwordHash: string;
  displayName: string;
  birthdate: string;
}

export class UserRepository extends BaseRepository<User> {
  constructor(dataSource: DataSource) {
    super(dataSource, User);
  }

  findActiveByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({
      where: { email, deletedAt: IsNull() },
    });
  }

  create(input: CreateUserInput): Promise<User> {
    const user = this.repo.create({ ...input });
    return this.repo.save(user);
  }

  // I2 : incrémente le compteur et verrouille au seuil.
  // Verrou progressif : 5 échecs -> verrouillage 15 min ; reset au login réussi.
  async registerFailedLogin(userId: string, threshold = 5, lockMinutes = 15): Promise<void> {
    await this.dataSource.transaction(async (em) => {
      const repo = em.getRepository(User);
      const user = await repo.findOne({ where: { id: userId } });
      if (!user) return;
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= threshold) {
        user.lockedUntil = new Date(Date.now() + lockMinutes * 60_000);
        user.failedLoginAttempts = 0; // reset après verrouillage
      }
      await repo.save(user);
    });
  }

  async resetFailedLogins(userId: string): Promise<void> {
    await this.repo.update(userId, { failedLoginAttempts: 0, lockedUntil: null });
  }

  // RGPD : soft-delete via TypeORM, puis purge planifiée.
  // I14 : on supprime aussi les tokens push et les messages de l'utilisateur.
  async softDelete(userId: string): Promise<void> {
    await this.dataSource.transaction(async (em) => {
      await em.softDelete('users', userId);
      await em.delete('push_devices', { user_id: userId });
      await em.delete('messages', { sender_id: userId });
      await em.delete('messages', { recipient_id: userId });
    });
  }
}
