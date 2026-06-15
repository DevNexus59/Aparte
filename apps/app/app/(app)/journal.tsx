import { useState } from 'react';
import { View, ActivityIndicator, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Eyebrow } from '@/components/Eyebrow';
import { GlowField } from '@/components/GlowField';
import { Orb } from '@/components/Orb';
import {
  useJournalEntries, useJournalSuggestions, useAddJournalEntry,
  flattenJournalPages,
} from '@/hooks/heartbeat';
import type { JournalEntry, JournalSuggestion } from '@/hooks/heartbeat';
import { useLinks } from '@/hooks/links';
import { errorMessage } from '@/hooks/auth';
import { useAccentColors } from '@/stores/accent';
import { colors } from '@/theme/tokens';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

const CATEGORY_LABELS: Record<JournalSuggestion['category'], string> = {
  gratitude: 'Gratitude',
  reconnect: 'Renouer',
  memory: 'Souvenir',
  reflection: 'Réflexion',
  general: 'Idée',
};

// Le journal n'accepte que ces trois types — les catégories IA proches
// (reconnect, general) sont ramenées à "reflection".
function suggestionToJournalType(category: JournalSuggestion['category']): 'gratitude' | 'memory' | 'reflection' {
  if (category === 'gratitude' || category === 'memory') return category;
  return 'reflection';
}

export default function Journal() {
  const accentColors = useAccentColors();
  const entries = useJournalEntries();
  const suggestions = useJournalSuggestions();
  const links = useLinks();
  const addEntry = useAddJournalEntry();

  const [composing, setComposing] = useState<{ content: string; type: 'gratitude' | 'memory' | 'reflection' } | null>(null);

  const linkName = (linkId: string | null) => {
    if (!linkId) return null;
    return (links.data ?? []).find((l) => l.id === linkId)?.contactName ?? null;
  };

  const allEntries: JournalEntry[] = flattenJournalPages(entries.data?.pages);

  async function onSave() {
    if (!composing || !composing.content.trim()) return;
    try {
      await addEntry.mutateAsync({ content: composing.content, type: composing.type });
      setComposing(null);
    } catch { /* erreur affichée dans le formulaire */ }
  }

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
          ListHeaderComponent={
            <JournalSuggestions
              suggestions={suggestions.data ?? []}
              composing={composing}
              onPick={(s) => setComposing({ content: s.text, type: suggestionToJournalType(s.category) })}
              onCancel={() => setComposing(null)}
              onChangeContent={(content) => setComposing((c) => (c ? { ...c, content } : c))}
              onSave={onSave}
              saving={addEntry.isPending}
              error={addEntry.isError ? errorMessage(addEntry.error) : null}
            />
          }
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

function JournalSuggestions({
  suggestions, composing, onPick, onCancel, onChangeContent, onSave, saving, error,
}: {
  suggestions: JournalSuggestion[];
  composing: { content: string; type: 'gratitude' | 'memory' | 'reflection' } | null;
  onPick: (s: JournalSuggestion) => void;
  onCancel: () => void;
  onChangeContent: (content: string) => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
}) {
  if (composing) {
    return (
      <View className="px-[22px] pb-4">
        <Card pad={20} className="gap-4">
          <Eyebrow>Nouvelle entrée</Eyebrow>
          <Input
            placeholder="Écris ce qui te vient…"
            value={composing.content}
            onChangeText={onChangeContent}
            multiline
            numberOfLines={5}
          />
          {error && (
            <Text variant="caption" className="text-state-want-to-see">{error}</Text>
          )}
          <View className="flex-row gap-3">
            <Button label="Annuler" variant="ghost" size="md" className="flex-1" onPress={onCancel} />
            <Button
              label={saving ? 'Enregistrement…' : 'Garder'}
              size="md" className="flex-1"
              onPress={onSave}
              loading={saving}
              disabled={!composing.content.trim()}
            />
          </View>
        </Card>
      </View>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <View className="px-[22px] pb-4 gap-3">
      <Eyebrow>Idées pour aujourd'hui</Eyebrow>
      {suggestions.map((s) => (
        <Pressable
          key={s.text}
          onPress={() => onPick(s)}
          accessibilityRole="button"
          accessibilityLabel={s.text}
        >
          <Card pad={16} className="gap-2">
            <Text variant="caption" tone="muted">{CATEGORY_LABELS[s.category]}</Text>
            <Text variant="body" italic>{s.text}</Text>
          </Card>
        </Pressable>
      ))}
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
