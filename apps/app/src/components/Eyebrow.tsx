import { Text } from 'react-native';
import { colors } from '@/theme/tokens';

interface Props {
  children: string;
  color?: string;
}

// Petite étiquette calme, en majuscules lettrées. Utilisée au-dessus
// des titres éditoriaux pour les contextualiser doucement.
export function Eyebrow({ children, color = colors.faded }: Props) {
  return (
    <Text
      style={{
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 11.5,
        letterSpacing: 0.22 * 11.5, // 0.22em -> px
        textTransform: 'uppercase',
        color,
      }}
    >
      {children}
    </Text>
  );
}
