import { useEffect, useState } from 'react';
import { AccessibilityInfo, View, TextInput, TextInputProps } from 'react-native';
import { Text } from './Text';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

interface Props extends Omit<TextInputProps, 'className'> {
  label?: string;
  error?: string;
  className?: string;
}

export function Input({
  label, error, className, onFocus, onBlur,
  accessibilityLabel, ...rest
}: Props) {
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (error) AccessibilityInfo.announceForAccessibility(error);
  }, [error]);

  return (
    <View className={cn('gap-2', className)}>
      {label && <Text variant="caption" tone="muted">{label}</Text>}
      <TextInput
        {...rest}
        accessibilityLabel={accessibilityLabel ?? label}
        placeholderTextColor={colors.faded}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        className={cn(
          'h-12 px-4 rounded-sm text-body font-sans text-text bg-surface',
          'border',
          focused ? 'border-accent' : 'border-border',
        )}
      />
      {error && (
        <Text variant="caption" className="text-state-want-to-see" accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
}
