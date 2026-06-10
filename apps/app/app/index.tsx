import { Redirect } from 'expo-router';

// Le AuthGate du root layout redirigera vers (auth)/login si pas connecté.
export default function Index() {
  return <Redirect href="/(app)" />;
}
