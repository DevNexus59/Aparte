import { View, ViewStyle, StyleProp } from 'react-native';
import { Text } from './Text';
import { Orb } from './Orb';
import { STATES, EmotionalState, colors, hexA } from '@/theme/tokens';

interface Props {
  state: EmotionalState;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

// Pastille d'état : un point lumineux + le libellé. Sobre, lisible.
// Pour le rendu plein (avec orbe qui respire), utiliser Orb directement.
export function StateBadge({ state, size = 'md', style }: Props) {
  const s = STATES[state];
  const dot = size === 'sm' ? 6 : 7;
  return (
    <View
      style={[{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 7,
        paddingHorizontal: 14,
        paddingLeft: 11,
        borderRadius: 999,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignSelf: 'flex-start',
      }, style]}
    >
      <View style={{
        width: dot, height: dot, borderRadius: dot / 2,
        backgroundColor: s.color,
        shadowColor: s.color, shadowOpacity: 0.9, shadowRadius: 6,
      }} />
      <Text variant="caption" tone="muted">{s.label}</Text>
    </View>
  );
}
