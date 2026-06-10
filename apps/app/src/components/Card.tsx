import { View, ViewProps } from 'react-native';
import { cn } from '@/lib/cn';

interface Props extends ViewProps {
  elevated?: boolean;
  /** Padding interne en px. Default 22 (Soft du design). */
  pad?: number;
  className?: string;
}

// "Soft" du design : surface arrondie, border discrète, padding généreux.
// elevated -> teinte un cran au-dessus (pour mettre en relief un état).
export function Card({ elevated, pad = 22, className, style, children, ...rest }: Props) {
  return (
    <View
      className={cn(
        'rounded-lg border border-border',
        elevated ? 'bg-elevated' : 'bg-surface',
        className,
      )}
      style={[{ padding: pad }, style]}
      {...rest}
    >
      {children}
    </View>
  );
}
