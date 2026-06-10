import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storage } from '@/lib/storage';
import { useAuth } from '@/stores/auth';
import { api } from '@/lib/api';

const REGISTERED_TOKEN_KEY = 'cercle.pushToken';

// Depuis Expo SDK 53, expo-notifications (push remote) ne marche plus dans Expo Go.
// On détecte Expo Go et on no-op pour permettre le dev confortable.
// En production / development build, les notifs s'activent normalement.
const isExpoGo = Constants.executionEnvironment === 'storeClient';

function currentPlatform(): 'ios' | 'android' | 'web' {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

async function getPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  // IMPORTS DYNAMIQUES : on ne charge expo-notifications que si on en a
  // vraiment besoin. Le simple import en haut de fichier crasherait Expo Go.
  const Notifications = await import('expo-notifications');
  const Device = await import('expo-device');

  if (!Device.isDevice) return null;

  // Politique silence numérique aux notifs aussi : pas de son, pas de badge.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return null;

  const projectId =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId
    ?? Constants.easConfig?.projectId;
  const token = await Notifications.getExpoPushTokenAsync({ projectId }).catch(() => null);
  return token?.data ?? null;
}

export function usePushRegistration() {
  const accessToken = useAuth((s) => s.accessToken);

  useEffect(() => {
    if (isExpoGo) {
      console.info('[push] Expo Go détecté — notifications désactivées en dev. Pour les activer, utilise un development build.');
      return;
    }
    if (!accessToken) return;
    let cancelled = false;

    (async () => {
      const previousToken = await storage.get(REGISTERED_TOKEN_KEY);
      const pushToken = await getPushToken();
      if (cancelled || !pushToken) return;
      if (previousToken === pushToken) return;

      try {
        await api<void>('/push/devices', {
          method: 'POST',
          body: {
            token: pushToken,
            platform: currentPlatform(),
            deviceInfo: undefined, // chargé dynamiquement si besoin
          },
        });
        await storage.set(REGISTERED_TOKEN_KEY, pushToken);
      } catch (e) {
        console.warn('[push] enregistrement échoué', e);
      }
    })();

    return () => { cancelled = true; };
  }, [accessToken]);
}

export async function unregisterCurrentDevice(): Promise<void> {
  if (isExpoGo) return;
  const token = await storage.get(REGISTERED_TOKEN_KEY);
  if (!token) return;
  try {
    await api<void>('/push/devices', { method: 'DELETE', body: { token } });
  } catch { /* best-effort */ }
  await storage.remove(REGISTERED_TOKEN_KEY);
}
