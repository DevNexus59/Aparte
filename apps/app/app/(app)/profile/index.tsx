import { useState } from 'react';
import { View, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Eyebrow } from '@/components/Eyebrow';
import { ProfilePhotoUploader } from '@/components/ProfilePhotoUploader';
import { DeleteAccountSheet } from '@/components/DeleteAccountSheet';
import { ChangePasswordSheet } from '@/components/ChangePasswordSheet';
import { useAuth } from '@/stores/auth';
import { unregisterCurrentDevice } from '@/hooks/push';
import { API_URL } from '@/lib/api';
import { colors } from '@/theme/tokens';

export default function Profile() {
  const router = useRouter();
  const userId = useAuth((s) => s.userId);
  const clear = useAuth((s) => s.clear);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  async function logout() {
    await unregisterCurrentDevice();
    await clear();
  }

  return (
    <Screen glowColors={[colors.accent]} glowIntensity={0.1}>
      <Eyebrow>Toi</Eyebrow>
      <Text variant="editorial-display" className="mt-3">
        Ton espace.
      </Text>
      <Text variant="body" tone="muted" className="mt-2">
        Visible par ton cercle uniquement.
      </Text>

      <Card className="items-center py-9 mt-10">
        {userId && <ProfilePhotoUploader userId={userId} />}
      </Card>

      <Pressable onPress={() => router.push('/profile/stats')} hitSlop={10} accessibilityRole="button">
        <Card className="flex-row items-center justify-between mt-6">
          <View className="gap-1">
            <Text variant="title">Tes traces</Text>
            <Text variant="body" tone="muted">Gratitude, souvenirs, présence.</Text>
          </View>
          <Text variant="body" tone="faded">→</Text>
        </Card>
      </Pressable>

      <View className="gap-3 mt-10">
        <Pressable onPress={() => setChangePasswordOpen(true)} hitSlop={10} accessibilityRole="button">
          <Card className="flex-row items-center justify-between">
            <Text variant="body">Changer de mot de passe</Text>
            <Text variant="body" tone="faded">→</Text>
          </Card>
        </Pressable>

        <Pressable onPress={() => Linking.openURL(`${API_URL}/legal/confidentialite`)} hitSlop={10} accessibilityRole="button">
          <Card className="flex-row items-center justify-between">
            <Text variant="body">Politique de confidentialité</Text>
            <Text variant="body" tone="faded">→</Text>
          </Card>
        </Pressable>

        <Pressable onPress={() => Linking.openURL(`${API_URL}/legal/suppression-compte`)} hitSlop={10} accessibilityRole="button">
          <Card className="flex-row items-center justify-between">
            <Text variant="body">Mentions légales</Text>
            <Text variant="body" tone="faded">→</Text>
          </Card>
        </Pressable>
      </View>

      <View className="mt-12 items-center gap-6">
        <Button label="Se déconnecter" variant="soft" onPress={logout} />
        <Pressable onPress={() => setDeleteOpen(true)} hitSlop={10} accessibilityRole="button">
          <Text variant="body" className="text-state-want-to-see">Supprimer mon compte</Text>
        </Pressable>
      </View>

      <ChangePasswordSheet open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
      <DeleteAccountSheet open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </Screen>
  );
}
