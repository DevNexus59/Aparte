import { Repositories } from '../repositories';
import { PushPlatform } from '../entities/PushDevice';

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface ExpoPushMessage {
  to: string;
  title?: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'high';
}

const EXPO_API = process.env.EXPO_PUSH_URL ?? 'https://exp.host/--/api/v2/push/send';

interface SendInput {
  userIds: string[];
  title?: string;
  body: string;
  data?: Record<string, unknown>;
}

export class PushService {
  constructor(private readonly repos: Repositories) {}

  async registerDevice(input: {
    userId: string;
    token: string;
    platform: PushPlatform;
    deviceInfo?: string;
  }) {
    if (!input.token.startsWith('ExponentPushToken[') && !input.token.startsWith('ExpoPushToken[')) {
      // On valide la forme pour rejeter les pollutions ; pas de hard error
      // pour rester gentil avec les évolutions futures de Expo.
      console.warn('[push] token au format inattendu:', input.token.slice(0, 30));
    }
    return this.repos.pushDevices.registerOrUpdate(input);
  }

  async dropDeviceByToken(token: string): Promise<void> {
    await this.repos.pushDevices.dropToken(token);
  }

  // Cœur : envoie un message à tous les devices des users ciblés.
  // Politique « silence numérique » :
  //   - sound: null par défaut (pas de son)
  //   - badge: undefined (pas de pastille rouge)
  //   - priority: default (pas de high-priority qui réveille l'écran)
  async send(input: SendInput): Promise<void> {
    const devices = await this.repos.pushDevices.listForUsers(input.userIds);
    if (devices.length === 0) return;

    const messages: ExpoPushMessage[] = devices.map((d) => ({
      to: d.token,
      title: input.title,
      body: input.body,
      data: input.data,
      sound: null,           // pas de son
      priority: 'default',
    }));

    // Expo accepte des batches jusqu'à 100 messages.
    for (let i = 0; i < messages.length; i += 100) {
      const batch = messages.slice(i, i + 100);
      try {
        const res = await fetch(EXPO_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(batch),
        });
        if (!res.ok) {
          console.error('[push] expo http error', res.status);
          continue;
        }
        const json = (await res.json()) as { data: ExpoPushTicket[] };
        await this.handleTickets(batch, json.data);
      } catch (e) {
        console.error('[push] expo send failed', e);
      }
    }

    await this.repos.audit.record({
      userId: null,
      action: 'push.send',
      entity: 'batch',
      entityId: null as never,
    });
  }

  // Si Expo nous dit "DeviceNotRegistered", on supprime le token : il est mort.
  private async handleTickets(messages: ExpoPushMessage[], tickets: ExpoPushTicket[]): Promise<void> {
    for (let i = 0; i < tickets.length; i++) {
      const t = tickets[i];
      if (t.status === 'error' && t.details?.error === 'DeviceNotRegistered') {
        await this.repos.pushDevices.dropToken(messages[i].to).catch(() => undefined);
      }
    }
  }
}
