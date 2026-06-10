import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Eyebrow } from '@/components/Eyebrow';
import { ProfilePhotoUploader } from '@/components/ProfilePhotoUploader';
import { DeleteAccountSheet } from '@/components/DeleteAccountSheet';
import { useAuth } from '@/stores/auth';
import { unregisterCurrentDevice } from '@/hooks/push';
import { colors } from '@/theme/tokens';

export default function Profile() {
  const router = useRouter();
  const userId = useAuth((s) => s.userId);
  const clear = useAuth((s) => s.clear);
  const [deleteOpen, setDeleteOpen] = useState(false);

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

      <Pressable onPress={() => router.push('/profile/stats')} hitSlop={10}>
        <Card className="flex-row items-center justify-between mt-6">
          <View className="gap-1">
            <Text variant="title">Tes traces</Text>
            <Text variant="body" tone="muted">Gratitude, souvenirs, présence.</Text>
          </View>
          <Text variant="body" tone="faded">→</Text>
        </Card>
      </Pressable>

      <View className="mt-12 items-center gap-6">
        <Pressable onPress={logout} hitSlop={10}>
          <Text variant="body" tone="faded">Se déconnecter</Text>
        </Pressable>
        <Pressable onPress={() => setDeleteOpen(true)} hitSlop={10}>
          <Text variant="body" className="text-state-want-to-see">Supprimer mon compte</Text>
        </Pressable>
      </View>

      <DeleteAccountSheet open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </Screen>
  );
}
