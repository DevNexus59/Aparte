import { Pressable, PressableProps, ActivityIndicator } from 'react-native';
import { Text } from './Text';
import { cn } from '@/lib/cn';
import { useAccentColors } from '@/stores/accent';

type Variant = 'primary' | 'soft' | 'ghost' | 'outline';
type Size = 'md' | 'lg';

interface Props extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: string;
}

const VARIANTS: Record<Variant, { base: string; text: string }> = {
  primary: { base: 'bg-accent',                                  text: '!text-accent-text font-semibold' },
  soft:    { base: 'bg-elevated border border-border',           text: 'text-text font-semibold' },
  ghost:   { base: 'bg-transparent',                             text: 'text-text-muted font-semibold' },
  outline: { base: 'bg-transparent border border-border',        text: 'text-text font-semibold' },
};

const SIZES: Record<Size, string> = {
  md: 'h-12 px-5 rounded-md',
  lg: 'h-[52px] px-6 rounded-md',
};

export function Button({
  label, variant = 'primary', size = 'lg', loading, disabled, className,
  accessibilityRole, accessibilityLabel, accessibilityState, ...rest
}: Props) {
  const v = VARIANTS[variant];
  const accentColors = useAccentColors();
  return (
    <Pressable
      {...rest}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading, ...accessibilityState }}
      disabled={disabled || loading}
      className={cn(SIZES[size], 'items-center justify-center flex-row', v.base, className)}
      style={({ pressed }) => [{
        opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
      }]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? accentColors.accentText : '#E8ECF1'} />
      ) : (
        <Text variant="body" className={v.text}>{label}</Text>
      )}
    </Pressable>
  );
}
