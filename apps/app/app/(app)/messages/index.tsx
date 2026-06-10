import { View, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Eyebrow } from '@/components/Eyebrow';
import { GlowField } from '@/components/GlowField';
import { AuthedImage } from '@/components/AuthedImage';
import { Orb } from '@/components/Orb';
import { useLinks } from '@/hooks/links';
import { useConversations } from '@/hooks/messages';
import { timeAgo } from '@/lib/time';
import { colors } from '@/theme/tokens';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MessagesList() {
  const links = useLinks();
  const conversations = useConversations();
  const router = useRouter();

  const activeLinks = (links.data ?? []).filter((l) => l.status === 'active' && l.memberUserId);
  const lastByUser = new Map((conversations.data ?? []).map((c) => [c.userId, c.lastMessage]));

  const isLoading = links.isLoading || conversations.isLoading;

  return (
    <View className="flex-1 bg-bg">
      <GlowField glowColors={[colors.accent]} intensity={0.1} />
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-[22px] pt-8 pb-4">
          <Eyebrow>Messages</Eyebrow>
          <Text variant="editorial-display" className="mt-3">
            Ton cercle,{'\n'}en direct.
          </Text>
        </View>

        {isLoading && <ActivityIndicator color={colors.accent} className="mt-12" />}

        {!isLoading && activeLinks.length === 0 && (
          <View className="px-[22px] mt-12 items-center">
            <Text variant="body" tone="faded" className="text-center">
              Ajoute quelqu'un à ton cercle pour pouvoir lui écrire.
            </Text>
          </View>
        )}

        <FlatList
          data={activeLinks}
          keyExtractor={(l) => l.id}
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 48, gap: 12 }}
          renderItem={({ item }) => {
            const last = lastByUser.get(item.memberUserId as string) ?? null;
            return (
              <Pressable onPress={() => router.push(`/messages/${item.memberUserId}`)}>
                <Card className="flex-row items-center gap-4">
                  <AuthedImage
                    userId={item.memberUserId as string}
                    style={{ width: 44, height: 44, borderRadius: 22 }}
                    fallback={<Orb size={44} color={colors.faded} />}
                  />
                  <View className="flex-1">
                    <Text variant="body" className="font-semibold">{item.contactName}</Text>
                    <Text variant="caption" tone="muted" numberOfLines={1} className="mt-1">
                      {last ? last.content : 'Dis bonjour 👋'}
                    </Text>
                  </View>
                  {last && (
                    <Text variant="caption" tone="faded">{timeAgo(last.createdAt)}</Text>
                  )}
                </Card>
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </View>
  );
}
