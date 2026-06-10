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
        text:       { DEFAULT: '#E8ECF1', muted: '#9BA4B0', faded: '#5C6573' },

        // Accent — Aube (ambre doux), avec une version "haute lumière"
        accent:     { DEFAULT: '#C9A584', hi: '#E4C9A8', hover: '#D4B295', pressed: '#B89473' },

        // États émotionnels — désaturés, jamais alertes
        state: {
          available:      '#9DB39A',  // sauge
          'want-to-see':  '#C9A0A5',  // rose poudré
          'need-to-talk': '#D6B988',  // ambre doré
          'socially-tired': '#8597A8', // bleu-gris
        },
      },

      // 3 piliers typographiques :
      //  - editorial : serif Newsreader pour les moments importants (titres, libellés de lueur)
      //  - sans     : Hanken Grotesk pour l'UI courante
      //  - mono     : Geist Mono pour métadonnées et placeholders techniques
      fontFamily: {
        // poids de Newsreader
        'editorial-light':   ['Newsreader_300Light'],
        editorial:           ['Newsreader_400Regular'],
        'editorial-italic':  ['Newsreader_400Regular_Italic'],
        'editorial-medium':  ['Newsreader_500Medium'],
        // poids de Hanken Grotesk
        sans:    ['HankenGrotesk_500Medium'],   // par défaut UI
        regular: ['HankenGrotesk_400Regular'],
        semibold:['HankenGrotesk_600SemiBold'],
        bold:    ['HankenGrotesk_700Bold'],
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
