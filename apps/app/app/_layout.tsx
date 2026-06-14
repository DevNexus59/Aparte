import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Nunito_300Light,
  Nunito_400Regular,
  Nunito_400Regular_Italic,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { GeistMono_400Regular } from '@expo-google-fonts/geist-mono';
import { vars } from 'nativewind';

import { useAuth } from '@/stores/auth';
import { useAccentTheme, useAccentColors } from '@/stores/accent';
import { accentThemeVars } from '@/theme/accentThemes';
import '../global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        // Pas de retry sur 4xx (M6). Réseau : 2 retries.
        const status = (error as { status?: number })?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { accessToken, hydrated, hydrate } = useAuth();

  useEffect(() => { if (!hydrated) hydrate(); }, [hydrated, hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    const inAuth = segments[0] === '(auth)';
    if (!accessToken && !inAuth) {
      router.replace('/(auth)/login');
    } else if (accessToken && inAuth) {
      router.replace('/(app)');
    }
  }, [hydrated, accessToken, segments, router]);

  if (!hydrated) return <View className="flex-1 bg-bg" />;
  return <>{children}</>;
}

export default function RootLayout() {
  const { hydrated: accentHydrated, hydrate: hydrateAccent } = useAccentTheme();
  const accentColors = useAccentColors();

  useEffect(() => { if (!accentHydrated) hydrateAccent(); }, [accentHydrated, hydrateAccent]);

  const [fontsLoaded] = useFonts({
    Nunito_300Light,
    Nunito_400Regular,
    Nunito_400Regular_Italic,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    GeistMono_400Regular,
  });

  if (!fontsLoaded) return <View className="flex-1 bg-bg" />;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthGate>
          <StatusBar style="light" />
          {/* Déclare la langue de l'app pour VoiceOver/TalkBack (WCAG 3.1.1) */}
          <View accessibilityLanguage="fr-FR" style={[{ flex: 1 }, vars(accentThemeVars(accentColors))]}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0E1217' } }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(app)" />
            </Stack>
          </View>
        </AuthGate>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
