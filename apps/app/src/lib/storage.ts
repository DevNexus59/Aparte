import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// expo-secure-store n'existe pas sur web -> fallback localStorage.
// Sur natif (iOS keychain / Android keystore) les tokens ne sont pas dans le JS.

export const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const StorageKeys = {
  accessToken: 'cercle.accessToken',
  refreshToken: 'cercle.refreshToken',
} as const;
