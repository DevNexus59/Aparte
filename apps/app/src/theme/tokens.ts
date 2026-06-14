// Tokens du design Aparté. Doit rester aligné avec tailwind.config.js
// (les couleurs sont accessibles via classes Tailwind dans le markup,
// ces constantes servent aux composants qui passent par du style RN).

export const colors = {
  bg:         '#0E1217',
  bgDeep:     '#0A0D11',
  surface:    '#171C23',
  elevated:   '#1F2530',
  border:     '#252B36',
  borderSoft: 'rgba(232,236,241,0.08)',

  text:       '#E8ECF1',
  muted:      '#9BA4B0',
  faded:      '#8893A2', // ≈4.9:1 sur `elevated`, ≈5.5:1 sur `surface` — WCAG AA

  accent:     '#F3BC8C',
  accentHi:   '#FAD9B8',
  accentText: '#2B1B0E', // texte sur fond pêche
} as const;

// États émotionnels — pastels, label éditorial + un verbe pour l'affichage dans le cercle.
export type EmotionalState = 'available' | 'want_to_see' | 'need_to_talk' | 'socially_tired';

export interface StateMeta {
  key: EmotionalState;
  label: string;
  color: string;
  verb: string;        // "X est disponible" → utilisé dans les cards du cercle
  description: string; // affiché quand l'état est sélectionné
}

export const STATES: Record<EmotionalState, StateMeta> = {
  available: {
    key: 'available',
    label: 'Disponible',
    color: '#B7DDA0',
    verb: 'est disponible',
    description: 'Ouverte aux nouvelles, sans rien forcer.',
  },
  want_to_see: {
    key: 'want_to_see',
    label: 'Envie de voir',
    color: '#F2958F',
    verb: 'a envie de te voir',
    description: 'Une présence te manque un peu.',
  },
  need_to_talk: {
    key: 'need_to_talk',
    label: 'Besoin de parler',
    color: '#9FE3D2',
    verb: 'a besoin de parler',
    description: 'Quelque chose pèse, et tu veux le dire.',
  },
  socially_tired: {
    key: 'socially_tired',
    label: 'Fatigué·e socialement',
    color: '#A6C8F0',
    verb: 'souffle un peu',
    description: 'Tu te retires, et c\'est très bien.',
  },
};

export const STATE_ORDER: EmotionalState[] = [
  'available', 'want_to_see', 'need_to_talk', 'socially_tired',
];

// hex (#rrggbb) + alpha (0..1) -> 'rgba(r,g,b,a)'
export function hexA(hex: string, alpha: number): string {
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Compat ancien code qui importait stateLabels :
export const stateLabels: Record<EmotionalState, string> = Object.fromEntries(
  STATE_ORDER.map((k) => [k, STATES[k].label]),
) as Record<EmotionalState, string>;
