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
import { useLogin, errorMessage } from '@/hooks/auth';
import { colors } from '@/theme/tokens';

export default function Login() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function submit() {
    if (!email || !password) return;
    try {
      await login.mutateAsync({ email, password });
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
              Bon retour.
            </Text>

            <View className="gap-4 mt-10">
              <Input
                label="Email"
                value={email} onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Input
                label="Mot de passe"
                value={password} onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {login.isError && (
              <Text variant="caption" className="text-state-want-to-see mt-4">
                {errorMessage(login.error)}
              </Text>
            )}

            <View className="gap-3 mt-8">
              <Button
                label={login.isPending ? '…' : 'Se connecter'}
                onPress={submit}
                loading={login.isPending}
                disabled={!email || !password}
              />
              <Button
                label="Pas encore de compte ? S'inscrire"
                variant="ghost"
                onPress={() => router.replace('/(auth)/register')}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
