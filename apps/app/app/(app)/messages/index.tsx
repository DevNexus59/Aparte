import { View, Pressable, ActivityIndicator, FlatList, Share } from 'react-native';
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
import { inviteMessage } from '@/lib/share';
import { useAccentColors } from '@/stores/accent';
import { colors } from '@/theme/tokens';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MessagesList() {
  const accentColors = useAccentColors();
  const links = useLinks();
  const conversations = useConversations();
  const router = useRouter();

  const allActiveLinks = (links.data ?? []).filter((l) => l.status === 'active');
  // Écrire suppose un lien réciproque : le membre doit aussi t'avoir ajouté·e.
  // `conversations` ne contient que les liens réciproques côté API — on s'en
  // sert pour distinguer "déjà inscrit·e mais pas encore réciproque" (en
  // attente) de "pas encore sur Aparté" (à inviter).
  const reciprocalIds = new Set((conversations.data ?? []).map((c) => c.userId));
  const writableLinks = allActiveLinks.filter((l) => l.memberUserId && reciprocalIds.has(l.memberUserId));
  const pendingLinks = allActiveLinks.filter((l) => !writableLinks.includes(l));
  const lastByUser = new Map((conversations.data ?? []).map((c) => [c.userId, c.lastMessage]));

  const isLoading = links.isLoading || conversations.isLoading;

  return (
    <View className="flex-1 bg-bg">
      <GlowField glowColors={[accentColors.accent]} intensity={0.1} />
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-[22px] pt-8 pb-4">
          <Eyebrow>Messages</Eyebrow>
          <Text variant="editorial-display" className="mt-3">
            Ton cercle,{'\n'}en direct.
          </Text>
        </View>

        {isLoading && <ActivityIndicator color={accentColors.accent} className="mt-12" />}

        {!isLoading && allActiveLinks.length === 0 && (
          <View className="px-[22px] mt-12 items-center">
            <Text variant="body" tone="faded" className="text-center">
              Ajoute quelqu'un à ton cercle pour pouvoir lui écrire.
            </Text>
          </View>
        )}

        {!isLoading && allActiveLinks.length > 0 && writableLinks.length === 0 && (
          <View className="px-[22px] mb-2">
            <Text variant="body" tone="faded" className="text-center">
              Vous pourrez vous écrire dès que les membres de ton cercle
              auront aussi rejoint Aparté et t'auront ajouté·e en retour.
            </Text>
          </View>
        )}

        <FlatList
          data={writableLinks}
          keyExtractor={(l) => l.id}
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 48, gap: 12 }}
          ListFooterComponent={pendingLinks.length === 0 ? null : (
            <View className="gap-3 mt-2">
              <Text variant="caption" tone="faded">En attente</Text>
              {pendingLinks.map((item) => (
                <Card key={item.id} className="flex-row items-center gap-4">
                  <Orb size={44} color={colors.faded} />
                  <View className="flex-1">
                    <Text variant="body" className="font-semibold">{item.contactName}</Text>
                    <Text variant="caption" tone="muted" className="mt-1">
                      {item.memberUserId
                        ? "Pas encore réciproque — iel doit aussi t'ajouter dans son cercle."
                        : "N'utilise pas encore Aparté."}
                    </Text>
                  </View>
                  {!item.memberUserId && (
                    <Pressable
                      onPress={() => Share.share({ message: inviteMessage(item.contactName) })}
                      hitSlop={10}
                      accessibilityRole="button"
                    >
                      <Text variant="caption" tone="faded">Inviter</Text>
                    </Pressable>
                  )}
                </Card>
              ))}
            </View>
          )}
          renderItem={({ item }) => {
            const last = lastByUser.get(item.memberUserId as string) ?? null;
            return (
              <Pressable onPress={() => router.push(`/messages/${item.memberUserId}`)} accessibilityRole="button">
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
