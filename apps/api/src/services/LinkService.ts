import { Repositories } from '../repositories';
import { Link } from '../entities/Link';
import { PushService } from './PushService';

interface CreateInput {
  ownerUserId: string;
  contactName: string;
  contactPhone?: string;
  memberEmail?: string;
}

export class LinkService {
  constructor(
    private readonly repos: Repositories,
    private readonly push: PushService,
  ) {}

  list(ownerUserId: string): Promise<Link[]> {
    return this.repos.links.listForOwner(ownerUserId);
  }

  // Toute la logique critique (transaction, unicité, cleanup nudges) vit
  // dans le repository ; le service n'est qu'une façade.
  async create(input: CreateInput): Promise<Link> {
    const link = await this.repos.links.createSafely(input);

    // Si la personne ajoutée est déjà inscrite, elle reçoit une invitation
    // à rejoindre ce cercle, visible et acceptable dans l'app.
    if (link.memberUserId && link.memberUserId !== input.ownerUserId) {
      this.push.send({
        userIds: [link.memberUserId],
        body: 'Quelqu\'un t\'a ajouté·e dans son cercle sur Aparté.',
        data: { type: 'circle_invitation', linkId: link.id },
      }).catch((e) => console.error('[push] circle invitation notify failed', e));
    }

    return link;
  }

  update(
    linkId: string,
    ownerUserId: string,
    updates: { contactName?: string; contactPhone?: string | null },
  ): Promise<void> {
    return this.repos.links.updateContact(linkId, ownerUserId, updates);
  }

  remove(linkId: string, ownerUserId: string): Promise<void> {
    return this.repos.links.softRemove(linkId, ownerUserId);
  }

  listInvitations(userId: string): Promise<Link[]> {
    return this.repos.links.listInvitations(userId);
  }

  acceptInvitation(linkId: string, userId: string): Promise<Link> {
    return this.repos.links.acceptInvitation(linkId, userId);
  }

  dismissInvitation(linkId: string, userId: string): Promise<void> {
    return this.repos.links.dismissInvitation(linkId, userId);
  }
}
