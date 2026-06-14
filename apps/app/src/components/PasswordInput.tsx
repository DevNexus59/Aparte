import { useState, useEffect } from 'react';
import { AccessibilityInfo, View, TextInput, TextInputProps, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from './Text';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

interface Props extends Omit<TextInputProps, 'className' | 'secureTextEntry'> {
  label?: string;
  error?: string;
  className?: string;
}

// Variante de Input avec un oeil pour basculer la visibilité du mot de passe.
export function PasswordInput({
  label, error, className, onFocus, onBlur,
  accessibilityLabel, ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (error) AccessibilityInfo.announceForAccessibility(error);
  }, [error]);

  return (
    <View className={cn('gap-2', className)}>
      {label && <Text variant="caption" tone="muted">{label}</Text>}
      <View className="relative">
        <TextInput
          {...rest}
          secureTextEntry={!visible}
          accessibilityLabel={accessibilityLabel ?? label}
          placeholderTextColor={colors.faded}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          className={cn(
            'h-12 px-4 pr-12 rounded-sm text-body font-sans text-text bg-surface',
            'border',
            focused ? 'border-accent' : 'border-border',
          )}
        />
        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          className="absolute right-3 top-0 h-12 items-center justify-center"
        >
          <Feather name={visible ? 'eye-off' : 'eye'} size={20} color={colors.faded} />
        </Pressable>
      </View>
      {error && (
        <Text variant="caption" className="text-state-want-to-see" accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
}
