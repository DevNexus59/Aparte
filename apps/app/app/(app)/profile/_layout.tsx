import { Stack } from 'expo-router';

// Stack imbriqué dans l'onglet "Toi" : profil puis stats personnelles
// (avec bouton retour natif).
export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="stats" />
    </Stack>
  );
}
