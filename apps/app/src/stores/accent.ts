import { create } from 'zustand';
import { storage } from '@/lib/storage';
import {
  ACCENT_THEMES, AccentTheme, AccentThemeId, DEFAULT_ACCENT_THEME, isAccentThemeId,
} from '@/theme/accentThemes';

const STORAGE_KEY = 'cercle.accentTheme';

interface AccentState {
  themeId: AccentThemeId;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setTheme: (id: AccentThemeId) => Promise<void>;
}

export const useAccentTheme = create<AccentState>((set) => ({
  themeId: DEFAULT_ACCENT_THEME,
  hydrated: false,

  async hydrate() {
    const saved = await storage.get(STORAGE_KEY);
    set({ themeId: saved && isAccentThemeId(saved) ? saved : DEFAULT_ACCENT_THEME, hydrated: true });
  },

  async setTheme(id) {
    await storage.set(STORAGE_KEY, id);
    set({ themeId: id });
  },
}));

// Couleurs hex de la palette d'accent active — pour les usages `style={}`
// (Orb, GlowField, ActivityIndicator...) qui ne peuvent pas lire les classes Tailwind.
export function useAccentColors(): AccentTheme {
  return useAccentTheme((s) => ACCENT_THEMES[s.themeId]);
}
