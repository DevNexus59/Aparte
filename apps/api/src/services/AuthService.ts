import crypto from 'node:crypto';
import { Repositories } from '../repositories';
import { Cache } from '../lib/cache';
import type { FileStorage } from '../lib/storage';
import { hashPassword, verifyPassword } from '../lib/password';
import {
  signAccess, signRefresh, verifyRefresh, hashToken,
  TokenPayload, REFRESH_TTL_MS, ACCESS_TTL_MS,
} from '../lib/jwt';
import { isPasswordPwned } from '../lib/hibp';
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/email';
import { decryptText } from '../lib/encryption';
import { AppError } from '../middlewares/errorHandler';
import { User } from '../entities/User';

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1h

// B1 : hash de référence calculé une fois — verifyPassword prend le même temps
// même quand l'utilisateur n'existe pas. Évite l'énumération par timing.
const DUMMY_HASH_PROMISE = hashPassword('___never-a-real-password___');

interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  birthdate: string;
  phone?: string;
  acceptTerms: boolean;
}

interface AuthContext {
  ip?: string;
  userAgent?: string;
}

interface AuthResult {
  user: { id: string; email: string; displayName: string };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  constructor(
    private readonly repos: Repositories,
    private readonly blacklist: Cache, // B4 : blacklist d'access tokens (jti)
    private readonly storage?: FileStorage, // suppression de la photo lors de l'effacement de compte
  ) {}

  async register(input: RegisterInput, ctx: AuthContext = {}): Promise<AuthResult> {
    // Age-gate via la règle domain de User.
    const tempUser = new User();
    tempUser.birthdate = input.birthdate;
    if (!tempUser.isAdult()) {
      throw new AppError(403, 'Inscription réservée aux 18 ans et plus');
    }

    // I5 : on refuse les mots de passe connus comme compromis.
    if (await isPasswordPwned(input.password)) {
      throw new AppError(400, 'Ce mot de passe est connu comme compromis. Choisis-en un autre.');
    }

    if (await this.repos.users.findActiveByEmail(input.email)) {
      throw new AppError(409, 'Email déjà utilisé');
    }

    // RGPD : l'acceptation des CGU vaut consentement éclairé au traitement
    // des données décrit dans la politique de confidentialité.
    if (!input.acceptTerms) {
      throw new AppError(400, "L'acceptation des CGU est requise pour créer un compte");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.repos.users.create({
      email: input.email,
      passwordHash,
      displayName: input.displayName,
      birthdate: input.birthdate,
      phone: input.phone,
      termsAcceptedAt: new Date(),
    });

    await this.repos.audit.record({
      userId: user.id, action: 'user.register', entity: 'user', entityId: user.id, ip: ctx.ip,
    });

    // Rattache ce nouveau compte aux liens créés avant son inscription
    // (cercle d'un autre membre qui l'a ajouté par téléphone/email).
    await this.repos.links.backfillMemberUserId(user);

    // Système de validation de compte : email de confirmation, compte
    // supprimé par le cron de purge si non confirmé après 24h.
    await this.sendVerificationEmail(user);

    return this.issueAuthResult(user, ctx);
  }

  // I : demande de réinitialisation de mot de passe. Réponse identique que
  // l'email existe ou non, pour éviter l'énumération de comptes.
  async requestPasswordReset(email: string, _ctx: AuthContext = {}): Promise<void> {
    const user = await this.repos.users.findActiveByEmail(email);
    if (!user) return;

    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.repos.passwordResets.create(
      user.id, hashToken(code), new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    );
    await sendPasswordResetEmail(user.email, code);
  }

  async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    if (await isPasswordPwned(newPassword)) {
      throw new AppError(400, 'Ce mot de passe est connu comme compromis. Choisis-en un autre.');
    }

    const entry = await this.repos.passwordResets.findUsableByHash(hashToken(code));
    if (!entry) throw new AppError(400, 'Code invalide ou expiré');

    const passwordHash = await hashPassword(newPassword);
    await this.repos.users.updatePassword(entry.userId, passwordHash);
    await this.repos.passwordResets.markUsed(entry.id);
    await this.repos.refreshTokens.revokeAllForUser(entry.userId);

    await this.repos.audit.record({
      userId: entry.userId, action: 'user.password.reset', entity: 'user', entityId: entry.userId,
    });
  }

  // Changement de mot de passe par un utilisateur connecté — exige l'ancien
  // mot de passe.
  async changePassword(userId: string, oldPassword: string, newPassword: string, ctx: AuthContext = {}): Promise<void> {
    const user = await this.repos.users.findById(userId);
    if (!user) throw new AppError(404, 'Utilisateur introuvable');

    const passwordOk = await verifyPassword(user.passwordHash, oldPassword);
    if (!passwordOk) throw new AppError(401, 'Mot de passe actuel incorrect');

    if (await isPasswordPwned(newPassword)) {
      throw new AppError(400, 'Ce mot de passe est connu comme compromis. Choisis-en un autre.');
    }

    const passwordHash = await hashPassword(newPassword);
    await this.repos.users.updatePassword(userId, passwordHash);

    await this.repos.audit.record({
      userId, action: 'user.password.change', entity: 'user', entityId: userId, ip: ctx.ip,
    });
  }

  // Système de validation de compte : envoie un email avec un lien de confirmation.
  async sendVerificationEmail(user: User): Promise<void> {
    const token = crypto.randomBytes(32).toString('hex');
    await this.repos.emailVerifications.create(
      user.id, hashToken(token), new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    );
    await sendVerificationEmail(user.email, token);
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.repos.users.findById(userId);
    if (!user) throw new AppError(404, 'Utilisateur introuvable');
    if (user.emailVerifiedAt) throw new AppError(409, 'Compte déjà confirmé');
    await this.sendVerificationEmail(user);
  }

  async verifyEmail(token: string): Promise<void> {
    const entry = await this.repos.emailVerifications.findUsableByHash(hashToken(token));
    if (!entry) throw new AppError(400, 'Lien de confirmation invalide ou expiré');

    await this.repos.users.markEmailVerified(entry.userId);
    await this.repos.emailVerifications.markUsed(entry.id);

    await this.repos.audit.record({
      userId: entry.userId, action: 'user.email.verified', entity: 'user', entityId: entry.userId,
    });
  }

  async login(email: string, password: string, ctx: AuthContext = {}): Promise<AuthResult> {
    const user = await this.repos.users.findActiveByEmail(email);

    // B1 : on hash toujours quelque chose, même si l'user n'existe pas.
    const hashToCheck = user?.passwordHash ?? (await DUMMY_HASH_PROMISE);
    const passwordOk = await verifyPassword(hashToCheck, password);

    // I2 : verrou progressif avant de vérifier le mot de passe ?
    // Non : on vérifie le MDP d'abord (constant-time), puis on traite l'échec.
    if (!user || !passwordOk) {
      if (user) {
        // I6 : trace de l'échec, et incrément du compteur.
        await this.repos.users.registerFailedLogin(user.id);
        await this.repos.audit.record({
          userId: user.id, action: 'auth.login.failed', ip: ctx.ip,
        });
      } else {
        await this.repos.audit.record({
          userId: null, action: 'auth.login.failed.unknown_email', ip: ctx.ip,
        });
      }
      // Message identique dans les deux cas.
      throw new AppError(401, 'Identifiants invalides');
    }

    if (!user.canLogin()) {
      // status suspendu/banni OU verrouillé temporairement
      const msg = user.isLocked()
        ? 'Compte temporairement verrouillé suite à trop de tentatives'
        : 'Compte suspendu ou banni';
      throw new AppError(403, msg);
    }

    // Succès : on reset le compteur d'échecs.
    await this.repos.users.resetFailedLogins(user.id);
    await this.repos.audit.record({
      userId: user.id, action: 'auth.login.success', ip: ctx.ip,
    });

    const result = await this.issueAuthResult(user, ctx);
    // TEMP-DEBUG : log de l'accessToken pour test manuel des push notifications.
    // À RETIRER après usage (cf. PR).
    console.log(`[TEMP-DEBUG] login ${user.email} accessToken=${result.accessToken}`);
    return result;
  }

  async refresh(oldRefreshToken: string, ctx: AuthContext = {}): Promise<AuthResult> {
    let payload: TokenPayload;
    try {
      payload = verifyRefresh(oldRefreshToken);
    } catch {
      throw new AppError(401, 'Refresh token invalide ou expiré');
    }

    const tokenHash = hashToken(oldRefreshToken);
    const stored = await this.repos.refreshTokens.findUsableByHash(tokenHash);
    if (!stored) throw new AppError(401, 'Session expirée');

    // Rotation : on révoque l'ancien.
    await this.repos.refreshTokens.revokeByHash(tokenHash);

    // L'user pourrait avoir été suspendu entre temps.
    const user = await this.repos.users.findById(payload.sub);
    if (!user || !user.canLogin()) throw new AppError(401, 'Session expirée');

    return this.issueAuthResult(user, ctx);
  }

  // B4 : on blackliste le jti de l'access courant jusqu'à son expiration.
  async logout(refreshToken: string, accessToken?: string): Promise<void> {
    await this.repos.refreshTokens.revokeByHash(hashToken(refreshToken));
    if (accessToken) await this.blacklistAccessToken(accessToken);
  }

  async logoutAllOtherSessions(userId: string, currentRefreshHash: string): Promise<void> {
    await this.repos.refreshTokens.revokeAllForUser(userId, currentRefreshHash);
  }

  // RGPD : droit à l'effacement. Re-vérifie le mot de passe (action destructive),
  // révoque toutes les sessions, supprime la photo de profil, puis soft-delete
  // l'utilisateur (purge en cascade des messages/devices via UserRepository.softDelete).
  async deleteAccount(userId: string, password: string, ctx: AuthContext = {}, accessToken?: string): Promise<void> {
    const user = await this.repos.users.findById(userId);
    if (!user) throw new AppError(404, 'Utilisateur introuvable');

    const passwordOk = await verifyPassword(user.passwordHash, password);
    if (!passwordOk) throw new AppError(401, 'Mot de passe incorrect');

    await this.repos.refreshTokens.revokeAllForUser(userId);
    if (accessToken) await this.blacklistAccessToken(accessToken);

    if (user.photoUrl && this.storage) {
      await this.storage.delete(user.photoUrl).catch(() => undefined);
    }

    await this.repos.audit.record({
      userId, action: 'user.account.delete', entity: 'user', entityId: userId, ip: ctx.ip,
    });

    await this.repos.users.softDelete(userId);
  }

  // RGPD : droit à la portabilité — un export JSON de toutes les données
  // personnelles détenues sur l'utilisateur.
  async exportData(userId: string): Promise<unknown> {
    const user = await this.repos.users.findById(userId);
    if (!user) throw new AppError(404, 'Utilisateur introuvable');

    const [links, journalEntries, emotionalStates, messages, pushDevices] = await Promise.all([
      this.repos.links.listForOwner(userId),
      this.repos.journal.findAllForUser(userId),
      this.repos.states.findAllForUser(userId),
      this.repos.messages.findAllForUser(userId),
      this.repos.pushDevices.listForUser(userId),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      profile: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        phone: user.phone,
        birthdate: user.birthdate,
        onboardingIntent: user.onboardingIntent,
        createdAt: user.createdAt,
        emailVerifiedAt: user.emailVerifiedAt,
      },
      circle: links.map((l) => ({
        id: l.id,
        contactName: l.contactName,
        contactPhone: l.contactPhone,
        memberEmail: l.memberEmail,
        status: l.status,
        createdAt: l.createdAt,
      })),
      journalEntries: journalEntries.map((j) => ({
        id: j.id,
        type: j.type,
        content: j.content,
        linkId: j.linkId,
        createdAt: j.createdAt,
      })),
      emotionalStates: emotionalStates.map((s) => ({
        id: s.id,
        state: s.state,
        setAt: s.setAt,
        expiresAt: s.expiresAt,
      })),
      messages: messages.map((m) => ({
        id: m.id,
        direction: m.senderId === userId ? 'sent' : 'received',
        otherUserId: m.senderId === userId ? m.recipientId : m.senderId,
        content: decryptText({ ciphertext: m.ciphertext, iv: m.iv, authTag: m.authTag }),
        createdAt: m.createdAt,
      })),
      pushDevices: pushDevices.map((d) => ({
        platform: d.platform,
        deviceInfo: d.deviceInfo,
        createdAt: d.createdAt,
      })),
    };
  }

  // --- internal ---

  private async issueAuthResult(user: User, ctx: AuthContext): Promise<AuthResult> {
    const { token: accessToken } = signAccess({ sub: user.id, role: user.role });
    const refreshToken = signRefresh({ sub: user.id, role: user.role });

    await this.repos.refreshTokens.issue({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      deviceInfo: ctx.userAgent,
      ttlMs: REFRESH_TTL_MS,
    });

    return {
      user: { id: user.id, email: user.email, displayName: user.displayName },
      accessToken,
      refreshToken,
    };
  }

  private async blacklistAccessToken(accessToken: string): Promise<void> {
    try {
      const payload = JSON.parse(
        Buffer.from(accessToken.split('.')[1] ?? '', 'base64url').toString('utf-8'),
      ) as TokenPayload;
      if (!payload.jti) return;
      const remainingMs = payload.exp
        ? payload.exp * 1000 - Date.now()
        : ACCESS_TTL_MS;
      if (remainingMs > 0) await this.blacklist.set(payload.jti, remainingMs);
    } catch {
      // Token malformé : pas grave, il sera rejeté par verifyAccess de toute façon.
    }
  }

  // Pour le middleware requireAuth.
  isJtiBlacklisted(jti: string): Promise<boolean> {
    return this.blacklist.has(jti);
  }
}
