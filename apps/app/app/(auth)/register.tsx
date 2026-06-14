import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { PasswordInput } from '@/components/PasswordInput';
import { DateField } from '@/components/DateField';
import { Eyebrow } from '@/components/Eyebrow';
import { Orb } from '@/components/Orb';
import { GlowField } from '@/components/GlowField';
import { useRegister, errorMessage } from '@/hooks/auth';
import { useAccentColors } from '@/stores/accent';

export default function Register() {
  const accentColors = useAccentColors();
  const router = useRouter();
  const register = useRegister();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [phone, setPhone] = useState('');

  const passwordsMatch = password === confirmPassword;
  const canSubmit = email && password.length >= 12 && passwordsMatch && displayName && birthdate;

  async function submit() {
    if (!canSubmit) return;
    try {
      await register.mutateAsync({
        email, password, confirmPassword, displayName, birthdate,
        phone: phone.trim() || undefined,
      });
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
            <View className="items-center mt-2 mb-8">
              <Orb size={62} color={accentColors.accent} breathing ring />
            </View>

            <Eyebrow>Aparté</Eyebrow>
            <Text variant="editorial-display" className="mt-3">
              Allumer ton astre.
            </Text>
            <Text variant="body" tone="muted" className="mt-2">
              Quelques infos. Rien ne sera public.
            </Text>

            <View className="gap-4 mt-8">
              <Input
                label="Prénom ou surnom"
                value={displayName} onChangeText={setDisplayName}
              />
              <Input
                label="Email"
                value={email} onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <PasswordInput
                label="Mot de passe (12 caractères minimum)"
                value={password} onChangeText={setPassword}
              />
              <PasswordInput
                label="Confirmer le mot de passe"
                value={confirmPassword} onChangeText={setConfirmPassword}
                error={confirmPassword && !passwordsMatch ? 'Les mots de passe ne correspondent pas' : undefined}
              />
              <DateField
                label="Date de naissance"
                value={birthdate}
                onChangeIso={setBirthdate}
              />
              <Input
                label="Téléphone (optionnel)"
                value={phone} onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <Text variant="caption" tone="faded">
                Permet à tes proches de te retrouver plus facilement dans Aparté.
              </Text>
            </View>

            {register.isError && (
              <Text variant="caption" className="text-state-want-to-see mt-4">
                {errorMessage(register.error)}
              </Text>
            )}

            <View className="gap-3 mt-8">
              <Button
                label={register.isPending ? '…' : 'S\'inscrire'}
                onPress={submit}
                loading={register.isPending}
                disabled={!canSubmit}
              />
              <Button
                label="Déjà un compte ? Se connecter"
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
