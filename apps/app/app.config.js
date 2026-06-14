// Étend app.json : permet de surcharger extra.apiUrl via la variable d'env
// EXPO_PUBLIC_API_URL (utilisée par les profils preview/production d'eas.json
// pour pointer vers l'API de prod), sans toucher à app.json — qui garde sa
// valeur locale de dev (cf. convention de diff local non committé).
//
// Surcharge aussi android.googleServicesFile via la variable d'env EAS de
// type "file" GOOGLE_SERVICES_JSON : ce fichier est gitignored donc absent de
// l'archive uploadée à EAS Build, qui l'injecte plutôt via cette variable.
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? config.extra?.apiUrl,
  },
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? config.android?.googleServicesFile,
  },
});
