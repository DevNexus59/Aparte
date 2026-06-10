export interface MyStats {
  memberSince: string;
  journal: { gratitude: number; memory: number; reflection: number };
  actedNudges: number;
  messagesExchanged: number;
  links: Array<{ id: string; contactName: string; entries: number }>;
}

// "Membre depuis avril 2024" : mois + année seulement, jamais un nombre de
// jours/semaines — qui inviterait à comparer une "ancienneté" (stats §10).
export function membershipLabel(memberSince: string): string {
  const date = new Date(memberSince);
  const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
  return `Membre depuis ${formatter.format(date)}`;
}
