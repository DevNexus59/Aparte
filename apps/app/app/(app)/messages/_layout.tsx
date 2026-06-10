import { Stack } from 'expo-router';

// Stack imbriqué dans l'onglet "Messages" : liste des conversations puis
// détail d'une conversation (avec bouton retour natif).
export default function MessagesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[userId]" />
    </Stack>
  );
}
