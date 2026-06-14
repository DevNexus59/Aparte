import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Eyebrow } from '@/components/Eyebrow';
import { Orb } from '@/components/Orb';
import { GlowField } from '@/components/GlowField';
import { useForgotPassword, errorMessage } from '@/hooks/auth';
import { useAccentColors } from '@/stores/accent';

export default function ForgotPassword() {
  const accentColors = useAccentColors();
  const router = useRouter();
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!email) return;
    try {
      await forgotPassword.mutateAsync(email);
      setSent(true);
    } catch { /* erreur affichée */ }
  }

  return (
    <View className="flex-1 bg-bg">
      <GlowField glowColors={[accentColors.accent]} intensity={0.16} />
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={{ paddingHorizontal: 26, paddingTop: 40, paddingBottom: 40 }}>
            <View className="items-center mt-6 mb-10">
              <Orb size={70} color={accentColors.accent} breathing ring />
            </View>

            <Eyebrow>Aparté</Eyebrow>
            <Text variant="editorial-display" className="mt-3">
              Mot de passe oublié.
            </Text>
            <Text variant="body" tone="muted" className="mt-2">
              Indique ton email : tu recevras un code pour choisir un nouveau
              mot de passe.
            </Text>

            {sent ? (
              <View className="gap-3 mt-8">
                <Text variant="body">
                  Si un compte existe pour cette adresse, un code de
                  réinitialisation valable 1h vient de t'être envoyé par email.
                </Text>
                <Button
                  label="J'ai mon code"
                  onPress={() => router.push('/(auth)/reset-password')}
                />
              </View>
            ) : (
              <>
                <View className="gap-4 mt-10">
                  <Input
                    label="Email"
                    value={email} onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {forgotPassword.isError && (
                  <Text variant="caption" className="text-state-want-to-see mt-4">
                    {errorMessage(forgotPassword.error)}
                  </Text>
                )}

                <View className="gap-3 mt-8">
                  <Button
                    label={forgotPassword.isPending ? '…' : 'Recevoir un code'}
                    onPress={submit}
                    loading={forgotPassword.isPending}
                    disabled={!email}
                  />
                </View>
              </>
            )}

            <View className="gap-3 mt-4">
              <Button
                label="Retour à la connexion"
                variant="ghost"
                onPress={() => router.replace('/(auth)/login')}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
