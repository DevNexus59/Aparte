import { View, ActivityIndicator, FlatList } from 'react-native';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Eyebrow } from '@/components/Eyebrow';
import { GlowField } from '@/components/GlowField';
import { Orb } from '@/components/Orb';
import { useJournalEntries, flattenJournalPages, JournalEntry } from '@/hooks/heartbeat';
import { useLinks } from '@/hooks/links';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccentColors } from '@/stores/accent';
import { colors } from '@/theme/tokens';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

export default function Journal() {
  const accentColors = useAccentColors();
  const entries = useJournalEntries();
  const links = useLinks();

  const linkName = (linkId: string | null) => {
    if (!linkId) return null;
    return (links.data ?? []).find((l) => l.id === linkId)?.contactName ?? null;
  };

  const allEntries: JournalEntry[] = flattenJournalPages(entries.data?.pages);

  return (
    <View className="flex-1 bg-bg">
      <GlowField glowColors={[accentColors.accent]} intensity={0.1} />
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-[22px] pt-8 pb-4">
          <Eyebrow>Ton journal</Eyebrow>
          <Text variant="editorial-display" className="mt-3">
            Ce que tu{'\n'}as gardé.
          </Text>
        </View>

        {entries.isLoading && (
          <ActivityIndicator color={accentColors.accent} className="mt-12" />
        )}

        {!entries.isLoading && allEntries.length === 0 && (
          <View className="px-[22px] mt-12 items-center">
            <Text variant="body" tone="faded" className="text-center">
              Rien encore. Réponds à la question hebdo,{'\n'}tu verras les traces ici.
            </Text>
          </View>
        )}

        <FlatList
          data={allEntries}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 48, gap: 14 }}
          renderItem={({ item }) => (
            <Entry entry={item} linkName={linkName(item.linkId)} />
          )}
          onEndReached={() => {
            if (entries.hasNextPage && !entries.isFetchingNextPage) entries.fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            entries.isFetchingNextPage
              ? <ActivityIndicator color={colors.faded} className="my-6" />
              : null
          }
        />
      </SafeAreaView>
    </View>
  );
}

function Entry({ entry, linkName }: { entry: JournalEntry; linkName: string | null }) {
  const accentColors = useAccentColors();
  return (
    <Card pad={20} className="gap-3">
      <View className="flex-row items-center gap-3">
        <Text variant="mono" tone="faded">{formatDate(entry.createdAt)}</Text>
        {linkName && (
          <>
            <Text variant="caption" tone="faded">·</Text>
            <View className="flex-row items-center gap-2">
              <Orb size={10} color={accentColors.accent} />
              <Text variant="caption" tone="muted">{linkName}</Text>
            </View>
          </>
        )}
      </View>
      <Text variant="body-l" italic style={{ lineHeight: 26 }}>
        {entry.content}
      </Text>
    </Card>
  );
}
