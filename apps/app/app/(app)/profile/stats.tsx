import { View, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Eyebrow } from '@/components/Eyebrow';
import { GlowField } from '@/components/GlowField';
import { useMyStats } from '@/hooks/stats';
import { membershipLabel } from '@/lib/stats';
import { colors } from '@/theme/tokens';

// Stats non-anxiogènes (spec §10) : uniquement des compteurs personnels et
// positifs, jamais de comparaison, de score ou de classement entre proches.
export default function ProfileStats() {
  const router = useRouter();
  const stats = useMyStats();

  return (
    <View className="flex-1 bg-bg">
      <GlowField glowColors={[colors.accent]} intensity={0.1} />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-center gap-3 px-[22px] pt-4 pb-3 border-b border-border">
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Retour">
            <Text variant="body" tone="muted">←</Text>
          </Pressable>
          <Text variant="editorial-title">Tes traces</Text>
        </View>

        {stats.isLoading && (
          <ActivityIndicator color={colors.accent} className="mt-12" />
        )}

        {stats.data && (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 24, paddingBottom: 48, gap: 16 }}
          >
            <View className="gap-2">
              <Eyebrow>Avec un peu de recul</Eyebrow>
              <Text variant="editorial-display" className="mt-1">
                Ce que tu{'\n'}as semé.
              </Text>
              <Text variant="body" tone="muted" className="mt-2">
                {membershipLabel(stats.data.memberSince)}
              </Text>
            </View>

            <Card className="gap-4 mt-4">
              <Text variant="title">Ton journal</Text>
              <StatRow label="moments de gratitude notés" value={stats.data.journal.gratitude} />
              <StatRow label="souvenirs mis de côté" value={stats.data.journal.memory} />
              <StatRow label="pensées accueillies" value={stats.data.journal.reflection} />
            </Card>

            <Card className="gap-4">
              <Text variant="title">Présence</Text>
              <StatRow label="messages échangés avec ton cercle" value={stats.data.messagesExchanged} />
              <StatRow label="petites attentions envoyées" value={stats.data.actedNudges} />
            </Card>

            {stats.data.links.length > 0 && (
              <View className="gap-3 mt-2">
                <Eyebrow>Ton cercle</Eyebrow>
                {stats.data.links.map((link) => (
                  <Card key={link.id} className="flex-row items-center justify-between">
                    <Text variant="body">{link.contactName}</Text>
                    <Text variant="body" tone="muted">{link.entries} souvenirs partagés</Text>
                  </Card>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-row items-baseline gap-2">
      <Text variant="title" tone="accent">{value}</Text>
      <Text variant="body" tone="muted" className="flex-1">{label}</Text>
    </View>
  );
}
