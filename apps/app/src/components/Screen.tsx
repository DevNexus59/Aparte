import { ReactNode } from 'react';
import { View, ScrollView, ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlowField } from './GlowField';

interface Props extends ScrollViewProps {
  /** Couleurs des halos en arrière-plan. */
  glowColors?: string[];
  /** Densité des halos (0..1). */
  glowIntensity?: number;
  children: ReactNode;
}

// Décor d'écran : glow en background + scroll au-dessus.
// Volontairement sans grain en RN pour l'instant (effet visuel marginal,
// coûte en performance, à ajouter plus tard via un PNG si besoin).
export function Screen({
  glowColors,
  glowIntensity = 0.16,
  children,
  contentContainerStyle,
  ...scrollProps
}: Props) {
  return (
    <View className="flex-1 bg-bg">
      <GlowField glowColors={glowColors} intensity={glowIntensity} />
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          {...scrollProps}
          contentContainerStyle={[
            { paddingHorizontal: 22, paddingTop: 32, paddingBottom: 48 },
            contentContainerStyle,
          ]}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
