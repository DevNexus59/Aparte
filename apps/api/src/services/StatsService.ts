import { Repositories } from '../repositories';
import { AppError } from '../middlewares/errorHandler';

export interface MyStats {
  memberSince: string;
  journal: { gratitude: number; memory: number; reflection: number };
  actedNudges: number;
  messagesExchanged: number;
  links: Array<{ id: string; contactName: string; entries: number }>;
}

// Stats non-anxiogènes (spec §10) : uniquement des compteurs positifs et
// auto-référentiels (gratitude, mémoires, gestes accomplis...). Jamais de
// comparaison, de ratio, de classement ou de "retard" affiché.
export class StatsService {
  constructor(private readonly repos: Repositories) {}

  async getMyStats(userId: string): Promise<MyStats> {
    const [user, { counts, perLink }, actedNudges, messagesExchanged, links] = await Promise.all([
      this.repos.users.findById(userId),
      this.repos.journal.statsForUser(userId),
      this.repos.nudges.countActedForUser(userId),
      this.repos.messages.countForUser(userId),
      this.repos.links.listForOwner(userId),
    ]);
    if (!user) throw new AppError(404, 'Utilisateur introuvable');

    return {
      memberSince: user.createdAt.toISOString(),
      journal: counts,
      actedNudges,
      messagesExchanged,
      // Ordre = ordre d'ajout au cercle (listForOwner), jamais trié par
      // nombre d'entrées : pas de classement entre proches.
      links: links
        .filter((l) => l.status === 'active')
        .map((l) => ({ id: l.id, contactName: l.contactName, entries: perLink.get(l.id) ?? 0 })),
    };
  }
}
