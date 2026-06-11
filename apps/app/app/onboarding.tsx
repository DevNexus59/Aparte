import { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Eyebrow } from '@/components/Eyebrow';
import { Orb } from '@/components/Orb';
import { GlowField } from '@/components/GlowField';
import { storage } from '@/lib/storage';
import { colors } from '@/theme/tokens';
import { cn } from '@/lib/cn';

type Intent = 'maintain' | 'meet';

const ONBOARDING_KEY = 'cercle.onboarded';

export async function hasCompletedOnboarding(): Promise<boolean> {
  return (await storage.get(ONBOARDING_KEY)) === '1';
}

const OPTIONS: Array<{ value: Intent; title: string; desc: string }> = [
  {
    value: 'maintain',
    title: 'Entretenir mes liens proches',
    desc: 'J\'ai déjà des personnes qui comptent. Je veux les voir plus, mieux.',
  },
  {
    value: 'meet',
    title: 'Créer des liens profonds',
    desc: 'Je cherche à rencontrer quelques personnes qui pourraient compter (bientôt disponible).',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [intent, setIntent] = useState<Intent | null>(null);

  async function onContinue() {
    if (!intent) return;
    await storage.set(ONBOARDING_KEY, '1');
    router.replace('/(app)');
  }

  return (
    <View className="flex-1 bg-bg">
      <GlowField glowColors={[colors.accent]} intensity={0.18} />
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ paddingHorizontal: 26, paddingTop: 32, paddingBottom: 40 }}>
          {/* Orbe d'accueil, comme un astre qui s'allume */}
          <View className="items-center mt-8 mb-10">
            <Orb size={88} color={colors.accent} breathing ring />
          </View>

          <Eyebrow>Aparté</Eyebrow>
          <Text variant="editorial-display" className="mt-3">
            Bienvenue.
          </Text>
          <Text variant="body-l" tone="muted" className="mt-3">
            Avant de commencer — qu'est-ce qui t'amène ?
          </Text>

          <View className="gap-4 mt-10">
            {OPTIONS.map((opt) => {
              const on = intent === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setIntent(opt.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  className={cn(
                    'rounded-lg border p-6 gap-2',
                    on ? 'border-accent bg-elevated' : 'border-border bg-surface',
                  )}
                >
                  <Text variant="body-l" className={on ? 'text-text' : 'text-text'}>
                    {opt.title}
                  </Text>
                  <Text variant="body" tone="muted">
                    {opt.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="mt-10">
            <Button
              label="Continuer"
              onPress={onContinue}
              disabled={!intent}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
