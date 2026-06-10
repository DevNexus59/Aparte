import { Repositories } from '../repositories';
import { Link } from '../entities/Link';

interface CreateInput {
  ownerUserId: string;
  contactName: string;
  contactPhone?: string;
  memberEmail?: string;
}

export class LinkService {
  constructor(private readonly repos: Repositories) {}

  list(ownerUserId: string): Promise<Link[]> {
    return this.repos.links.listForOwner(ownerUserId);
  }

  // Toute la logique critique (transaction, unicité, cleanup nudges) vit
  // dans le repository ; le service n'est qu'une façade.
  create(input: CreateInput): Promise<Link> {
    return this.repos.links.createSafely(input);
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
}
