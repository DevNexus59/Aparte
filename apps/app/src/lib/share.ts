export function inviteMessage(contactName?: string): string {
  const greeting = contactName ? `Salut ${contactName} !` : 'Salut !';
  return `${greeting} Je t'ai ajouté·e dans mon Cercle, une appli toute simple pour garder le contact avec mes proches sans pression. Si un jour tu as envie de l'essayer, dis-moi 🙂`;
}
