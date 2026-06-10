import { DataSource, EntityTarget, Repository, ObjectLiteral } from 'typeorm';

// Classe abstraite : encapsule l'accès à TypeORM. Les repositories concrets
// héritent de celle-ci et ajoutent leur logique métier.
export abstract class BaseRepository<T extends ObjectLiteral> {
  protected readonly repo: Repository<T>;

  constructor(
    protected readonly dataSource: DataSource,
    entity: EntityTarget<T>,
  ) {
    this.repo = dataSource.getRepository(entity);
  }

  findById(id: string): Promise<T | null> {
    return this.repo.findOne({ where: { id } as never });
  }

  save(entity: T): Promise<T> {
    return this.repo.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
