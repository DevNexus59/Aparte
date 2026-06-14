import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { PasswordInput } from '@/components/PasswordInput';
import { Eyebrow } from '@/components/Eyebrow';
import { Orb } from '@/components/Orb';
import { GlowField } from '@/components/GlowField';
import { useResetPassword, errorMessage } from '@/hooks/auth';
import { colors } from '@/theme/tokens';

export default function ResetPassword() {
  const router = useRouter();
  const resetPassword = useResetPassword();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [done, setDone] = useState(false);

  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit = code.length === 6 && newPassword.length >= 12 && passwordsMatch;

  async function submit() {
    if (!canSubmit) return;
    try {
      await resetPassword.mutateAsync({ code, newPassword });
      setDone(true);
    } catch { /* erreur affichée */ }
  }

  return (
    <View className="flex-1 bg-bg">
      <GlowField glowColors={[colors.accent]} intensity={0.16} />
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={{ paddingHorizontal: 26, paddingTop: 40, paddingBottom: 40 }}>
            <View className="items-center mt-6 mb-10">
              <Orb size={70} color={colors.accent} breathing ring />
            </View>

            <Eyebrow>Aparté</Eyebrow>
            <Text variant="editorial-display" className="mt-3">
              Nouveau mot de passe.
            </Text>

            {done ? (
              <View className="gap-3 mt-8">
                <Text variant="body">
                  Ton mot de passe a été mis à jour. Tu peux te reconnecter.
                </Text>
                <Button
                  label="Se connecter"
                  onPress={() => router.replace('/(auth)/login')}
                />
              </View>
            ) : (
              <>
                <Text variant="body" tone="muted" className="mt-2">
                  Saisis le code à 6 chiffres reçu par email, puis ton nouveau
                  mot de passe.
                </Text>

                <View className="gap-4 mt-8">
                  <Input
                    label="Code reçu par email"
                    value={code} onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  <PasswordInput
                    label="Nouveau mot de passe (12 caractères minimum)"
                    value={newPassword} onChangeText={setNewPassword}
                  />
                  <PasswordInput
                    label="Confirmer le mot de passe"
                    value={confirmPassword} onChangeText={setConfirmPassword}
                    error={confirmPassword && !passwordsMatch ? 'Les mots de passe ne correspondent pas' : undefined}
                  />
                </View>

                {resetPassword.isError && (
                  <Text variant="caption" className="text-state-want-to-see mt-4">
                    {errorMessage(resetPassword.error)}
                  </Text>
                )}

                <View className="gap-3 mt-8">
                  <Button
                    label={resetPassword.isPending ? '…' : 'Changer le mot de passe'}
                    onPress={submit}
                    loading={resetPassword.isPending}
                    disabled={!canSubmit}
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
