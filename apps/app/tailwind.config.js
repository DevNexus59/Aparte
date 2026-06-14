/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Surfaces
        bg:         '#0E1217',
        'bg-deep':  '#0A0D11',
        surface:    '#171C23',
        elevated:   '#1F2530',
        border:     '#252B36',
        'border-soft': 'rgba(232,236,241,0.08)',

        // Textes
        // faded : #8893A2 (≈4.9:1 sur `elevated`, ≈5.5:1 sur `surface` — WCAG AA)
        text:       { DEFAULT: '#E8ECF1', muted: '#9BA4B0', faded: '#8893A2' },

        // Accent — pêche orangée, avec une version "haute lumière"
        accent:     { DEFAULT: '#F3BC8C', hi: '#FAD9B8', hover: '#F6C99D', pressed: '#E8A973' },

        // États émotionnels — pastels doux, jamais alertes
        state: {
          available:      '#B7DDA0',  // vert tendre
          'want-to-see':  '#F2958F',  // corail
          'need-to-talk': '#9FE3D2',  // menthe
          'socially-tired': '#A6C8F0', // bleu pastel
        },
      },

      // 3 piliers typographiques (tous en Nunito, sans-serif) :
      //  - editorial : Nunito léger/regular pour les moments importants (titres, libellés de lueur)
      //  - sans     : Nunito pour l'UI courante
      //  - mono     : Geist Mono pour métadonnées et placeholders techniques
      fontFamily: {
        // poids de Nunito (éditorial)
        'editorial-light':   ['Nunito_300Light'],
        editorial:           ['Nunito_400Regular'],
        'editorial-italic':  ['Nunito_400Regular_Italic'],
        'editorial-medium':  ['Nunito_500Medium'],
        // poids de Nunito (UI)
        sans:    ['Nunito_500Medium'],   // par défaut UI
        regular: ['Nunito_400Regular'],
        semibold:['Nunito_600SemiBold'],
        bold:    ['Nunito_700Bold'],
        // Geist Mono
        mono:    ['GeistMono_400Regular'],
      },

      fontSize: {
        // micro étiquette en majuscules lettrées
        eyebrow:  ['11.5px', { lineHeight: '14px', letterSpacing: '0.22em' }],
        caption:  ['13px',   { lineHeight: '18px' }],
        body:     ['16px',   { lineHeight: '24px' }],
        'body-l': ['18px',   { lineHeight: '29px' }],
        title:    ['27px',   { lineHeight: '32px', letterSpacing: '-0.01em' }],
        display:  ['32px',   { lineHeight: '40px', letterSpacing: '-0.01em' }],
        hero:     ['40px',   { lineHeight: '48px', letterSpacing: '-0.015em' }],
      },

      borderRadius: {
        sm:   '8px',
        md:   '15px',     // boutons
        lg:   '22px',     // cartes
        xl:   '30px',
      },

      spacing: {
        '18': '72px',
        '22': '88px',
        '26': '104px',
      },
    },
  },
  plugins: [],
};
