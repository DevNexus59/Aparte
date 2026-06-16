import { DataSource, IsNull, Not, EntityManager } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { Link } from '../entities/Link';
import { Nudge } from '../entities/Nudge';
import { User } from '../entities/User';
import { AppError } from '../middlewares/errorHandler';

interface CreateLinkInput {
  ownerUserId: string;
  contactName: string;
  contactPhone?: string;
  memberEmail?: string;
}

const MAX_ACTIVE_LINKS = 3;

export class LinkRepository extends BaseRepository<Link> {
  constructor(dataSource: DataSource) {
    super(dataSource, Link);
  }

  listForOwner(ownerUserId: string): Promise<Link[]> {
    return this.repo.find({
      where: { ownerUserId, status: Not('removed' as never) },
      relations: { member: true },
      order: { createdAt: 'ASC' },
    });
  }

  // B2 : transaction SERIALIZABLE pour éviter la race « 4 liens actifs en parallèle ».
  // M2 : vérification d'unicité dans la transaction (même user-id ou même phone).
  async createSafely(input: CreateLinkInput): Promise<Link> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      const em = queryRunner.manager;

      // Résolution éventuelle du membre inscrit, via email ou téléphone.
      let memberUserId: string | null = null;
      if (input.memberEmail) {
        const member = await em.findOne(User, {
          where: { email: input.memberEmail, deletedAt: IsNull(), status: 'active' as never },
        });
        if (member) memberUserId = member.id;
        // Si l'email n'est pas inscrit, lien créé comme simple contact (intentionnel).
      }
      if (!memberUserId && input.contactPhone) {
        const member = await em.findOne(User, {
          where: { phone: input.contactPhone, deletedAt: IsNull(), status: 'active' as never },
        });
        if (member) memberUserId = member.id;
      }

      // B2 : décompte des liens actifs sous transaction.
      const activeCount = await em.count(Link, {
        where: { ownerUserId: input.ownerUserId, status: 'active' as never },
      });
      if (activeCount >= MAX_ACTIVE_LINKS) {
        throw new AppError(409, `Limite de ${MAX_ACTIVE_LINKS} liens actifs atteinte`);
      }

      // M2 : pas deux fois la même personne dans le cercle.
      await this.assertNoDuplicate(em, input.ownerUserId, memberUserId, input.contactPhone);

      const link = em.create(Link, {
        ownerUserId: input.ownerUserId,
        memberUserId,
        contactName: input.contactName,
        contactPhone: input.contactPhone ?? null,
        memberEmail: input.memberEmail ?? null,
        status: 'active',
      });
      const saved = await em.save(link);

      await queryRunner.commitTransaction();
      return saved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async assertNoDuplicate(
    em: EntityManager,
    ownerUserId: string,
    memberUserId: string | null,
    contactPhone: string | undefined,
  ): Promise<void> {
    if (memberUserId) {
      const dup = await em.findOne(Link, {
        where: { ownerUserId, memberUserId, status: 'active' as never },
      });
      if (dup) throw new AppError(409, 'Cette personne est déjà dans votre cercle');
    }
    if (contactPhone) {
      const dup = await em.findOne(Link, {
        where: { ownerUserId, contactPhone, status: 'active' as never },
      });
      if (dup) throw new AppError(409, 'Ce contact est déjà dans votre cercle');
    }
  }

  // I7 : au remove, on dismisse les nudges suggérés pour ce lien, dans la même
  // transaction. Évite que l'UI affiche des relances vers un lien supprimé.
  async softRemove(linkId: string, ownerUserId: string): Promise<void> {
    await this.dataSource.transaction(async (em) => {
      const link = await em.findOne(Link, { where: { id: linkId, ownerUserId } });
      if (!link || link.status === 'removed') {
        throw new AppError(404, 'Lien introuvable');
      }
      link.status = 'removed';
      await em.save(link);

      await em.update(
        Nudge,
        { linkId, status: 'suggested' as never },
        { status: 'dismissed' as never },
      );
    });
  }

  async updateContact(
    linkId: string,
    ownerUserId: string,
    updates: { contactName?: string; contactPhone?: string | null },
  ): Promise<void> {
    const result = await this.repo.update(
      { id: linkId, ownerUserId },
      updates,
    );
    if (result.affected === 0) throw new AppError(404, 'Lien introuvable');
  }

  // Sert au HeartbeatService pour vérifier la propriété d'un lien.
  findActiveOwnedBy(linkId: string, ownerUserId: string): Promise<Link | null> {
    return this.repo.findOne({
      where: { id: linkId, ownerUserId, status: 'active' as never },
    });
  }

  // Rattachement rétroactif : quand un nouvel utilisateur s'inscrit, certains
  // liens actifs créés avant son inscription pointent vers lui via
  // contactPhone/memberEmail mais ont memberUserId = null (jamais résolu à la
  // création). Sans ce rattachement, areReciprocallyLinked ne peut jamais
  // devenir vraie pour ces liens — c'était la cause du bug "le chat ne
  // fonctionne pas entre deux membres pourtant inscrits".
  async backfillMemberUserId(user: User): Promise<void> {
    if (user.phone) {
      await this.repo.update(
        { contactPhone: user.phone, memberUserId: IsNull(), status: 'active' as never },
        { memberUserId: user.id },
      );
    }
    await this.repo.update(
      { memberEmail: user.email, memberUserId: IsNull(), status: 'active' as never },
      { memberUserId: user.id },
    );
  }

  // Invitations en attente : liens actifs où je suis le membre ajouté, pas encore
  // réciproqués (je n'ai pas encore cette personne dans mon propre cercle) et
  // pas déjà refusés.
  async listInvitations(userId: string): Promise<Link[]> {
    return this.repo
      .createQueryBuilder('l')
      .innerJoinAndSelect('l.owner', 'owner')
      .where('l.member_user_id = :userId', { userId })
      .andWhere('l.status = :status', { status: 'active' })
      .andWhere('l.dismissed_at IS NULL')
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM links lb
          WHERE lb.owner_user_id = :userId
            AND lb.member_user_id = l.owner_user_id
            AND lb.status = :status
        )`,
        { userId, status: 'active' },
      )
      .orderBy('l.created_at', 'DESC')
      .getMany();
  }

  // J'accepte l'invitation : je crée le lien réciproque dans mon cercle.
  // Réutilise createSafely pour la limite (3 liens actifs) et l'anti-doublon.
  async acceptInvitation(linkId: string, userId: string): Promise<Link> {
    const invitation = await this.repo.findOne({
      where: { id: linkId, memberUserId: userId, status: 'active' as never },
      relations: { owner: true },
    });
    if (!invitation || !invitation.owner) {
      throw new AppError(404, 'Invitation introuvable');
    }
    return this.createSafely({
      ownerUserId: userId,
      contactName: invitation.owner.displayName,
      memberEmail: invitation.owner.email,
    });
  }

  // Je refuse l'invitation : elle ne sera plus proposée (mais le cercle de
  // celui qui m'a ajouté reste inchangé).
  async dismissInvitation(linkId: string, userId: string): Promise<void> {
    const result = await this.repo.update(
      { id: linkId, memberUserId: userId, status: 'active' as never },
      { dismissedAt: new Date() },
    );
    if (result.affected === 0) throw new AppError(404, 'Invitation introuvable');
  }

  // B6 : deux users sont réciproquement liés si chacun a l'autre dans son cercle actif.
  async areReciprocallyLinked(a: string, b: string): Promise<boolean> {
    const count = await this.repo
      .createQueryBuilder('la')
      .innerJoin(Link, 'lb',
        'lb.owner_user_id = la.member_user_id AND lb.member_user_id = la.owner_user_id AND lb.status = \'active\'',
      )
      .where('la.owner_user_id = :a AND la.member_user_id = :b AND la.status = \'active\'', { a, b })
      .getCount();
    return count > 0;
  }

  // PERF-01: filtre en une seule requête parmi les `candidates` ceux qui sont
  // réciproquement liés à `userId` — évite le N+1 dans listConversations.
  async listReciprocalIds(userId: string, candidates: string[]): Promise<string[]> {
    if (candidates.length === 0) return [];
    const rows = await this.repo
      .createQueryBuilder('la')
      .innerJoin(Link, 'lb',
        'lb.owner_user_id = la.member_user_id AND lb.member_user_id = la.owner_user_id AND lb.status = \'active\'',
      )
      .select('la.member_user_id', 'memberId')
      .where('la.owner_user_id = :userId AND la.member_user_id IN (:...candidates) AND la.status = \'active\'',
        { userId, candidates },
      )
      .getRawMany<{ memberId: string }>();
    return rows.map((r) => r.memberId);
  }
}
