// Palettes d'accent sélectionnables — personnalisation de l'app dans le profil.
// Chaque palette reste dans la même logique que l'accent pêche d'origine :
// une couleur de base douce, une version "haute lumière", hover/pressed
// pour les boutons, et une couleur de texte lisible sur fond accent.

export type AccentThemeId = 'peach' | 'coral' | 'green' | 'mint' | 'blue';

export interface AccentTheme {
  id: AccentThemeId;
  label: string;
  accent: string;
  accentHi: string;
  accentHover: string;
  accentPressed: string;
  accentText: string;
}

export const ACCENT_THEMES: Record<AccentThemeId, AccentTheme> = {
  peach: {
    id: 'peach', label: 'Pêche',
    accent: '#F3BC8C', accentHi: '#FAD9B8', accentHover: '#F6C99D', accentPressed: '#E8A973',
    accentText: '#2B1B0E',
  },
  coral: {
    id: 'coral', label: 'Corail',
    accent: '#F2958F', accentHi: '#F7BFBC', accentHover: '#F5A9A4', accentPressed: '#E87E77',
    accentText: '#2B1212',
  },
  green: {
    id: 'green', label: 'Vert',
    accent: '#B7DDA0', accentHi: '#D5EFC7', accentHover: '#C6E6B4', accentPressed: '#9FCB85',
    accentText: '#16240D',
  },
  mint: {
    id: 'mint', label: 'Menthe',
    accent: '#9FE3D2', accentHi: '#C9F3E9', accentHover: '#B5EBDD', accentPressed: '#7DCDBA',
    accentText: '#0E2622',
  },
  blue: {
    id: 'blue', label: 'Bleu',
    accent: '#A6C8F0', accentHi: '#CBE0F8', accentHover: '#B9D5F4', accentPressed: '#8AB3E3',
    accentText: '#101E33',
  },
};

export const ACCENT_THEME_ORDER: AccentThemeId[] = ['peach', 'coral', 'green', 'mint', 'blue'];

export const DEFAULT_ACCENT_THEME: AccentThemeId = 'peach';

export function isAccentThemeId(value: string): value is AccentThemeId {
  return value in ACCENT_THEMES;
}

// hex (#rrggbb) -> "r g b", format attendu par rgb(var(--x) / <alpha-value>)
function hexToRgbTriplet(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

// Variables CSS NativeWind alimentant les classes Tailwind `accent*`.
export function accentThemeVars(theme: AccentTheme): Record<string, string> {
  return {
    '--color-accent': hexToRgbTriplet(theme.accent),
    '--color-accent-hi': hexToRgbTriplet(theme.accentHi),
    '--color-accent-hover': hexToRgbTriplet(theme.accentHover),
    '--color-accent-pressed': hexToRgbTriplet(theme.accentPressed),
    '--color-accent-text': hexToRgbTriplet(theme.accentText),
  };
}
