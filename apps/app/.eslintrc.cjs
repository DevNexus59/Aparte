// Lint d'accessibilité (EN 301 549 / WCAG 2.1 AA) — voir docs/01-spec-mvp.md §13.
// Ne couvre que les règles JSX/accessibilité RN ; pas de règles de style.
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: { jsx: true },
    sourceType: 'module',
  },
  plugins: ['react-native-a11y'],
  extends: ['plugin:react-native-a11y/all'],
  rules: {
    // "Hint" est un texte additionnel lu après le label : utile au cas par
    // cas, mais l'imposer partout produirait un VoiceOver/TalkBack verbeux.
    // Les labels posés en Phase 1/2 suffisent ; les hints restent un choix
    // ponctuel laissé aux auteurs.
    'react-native-a11y/has-accessibility-hint': 'off',
  },
  ignorePatterns: ['node_modules/', '.expo/', 'dist/'],
};
