import { View, Pressable } from 'react-native';
import { Text } from '@/components/Text';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Eyebrow } from '@/components/Eyebrow';
import { ProfilePhotoUploader } from '@/components/ProfilePhotoUploader';
import { useAuth } from '@/stores/auth';
import { unregisterCurrentDevice } from '@/hooks/push';
import { colors } from '@/theme/tokens';

export default function Profile() {
  const userId = useAuth((s) => s.userId);
  const clear = useAuth((s) => s.clear);

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

      <View className="mt-12 items-center gap-6">
        <Pressable onPress={logout} hitSlop={10}>
          <Text variant="body" tone="faded">Se déconnecter</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
