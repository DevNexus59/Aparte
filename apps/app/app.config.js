// Étend app.json : permet de surcharger extra.apiUrl via la variable d'env
// EXPO_PUBLIC_API_URL (utilisée par les profils preview/production d'eas.json
// pour pointer vers l'API de prod), sans toucher à app.json — qui garde sa
// valeur locale de dev (cf. convention de diff local non committé).
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? config.extra?.apiUrl,
  },
});
