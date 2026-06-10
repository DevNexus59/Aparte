import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/Text';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Eyebrow } from '@/components/Eyebrow';
import { Orb } from '@/components/Orb';
import { MyStatePicker } from '@/components/MyStatePicker';
import { CircleStates } from '@/components/CircleStates';
import { useWeeklyPrompt, useAddJournalEntry } from '@/hooks/heartbeat';
import { useLinks } from '@/hooks/links';
import { useMyState } from '@/hooks/states';
import { errorMessage } from '@/hooks/auth';
import { STATES, colors } from '@/theme/tokens';
import { cn } from '@/lib/cn';

export default function Home() {
  const prompt = useWeeklyPrompt();
  const links = useLinks();
  const myState = useMyState();
  const addEntry = useAddJournalEntry();

  const [answering, setAnswering] = useState(false);
  const [content, setContent] = useState('');
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  // Couleur de la lueur courante (ou ambre par défaut) — pilote le glow.
  const lueurColor = myState.data ? STATES[myState.data.state].color : colors.accent;

  async function onSave() {
    if (!content.trim()) return;
    try {
      await addEntry.mutateAsync({
        content,
        type: 'reflection',
        promptId: prompt.data?.id,
        linkId: selectedLinkId ?? undefined,
      });
      setContent('');
      setSelectedLinkId(null);
      setAnswering(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 4000);
    } catch { /* erreur affichée dans le formulaire */ }
  }

  return (
    <Screen glowColors={[lueurColor]} glowIntensity={0.18}>
      {/* En-tête : ma lueur + cercle. Pas de titre brutal, le décor parle. */}
      <MyStatePicker />

      <View className="h-8" />
      <CircleStates />

      {/* Le moment hebdo — traité comme un rituel, serif éditoriale */}
      <View className="mt-10">
        <Eyebrow>Cette semaine</Eyebrow>
      </View>

      <View className="mt-3" />

      <Card elevated className="gap-6">
        <View className="flex-row items-start gap-4">
          {/* petit orbe ambre, présence calme à côté de la question */}
          <View className="mt-1.5">
            <Orb size={28} color={colors.accent} breathing />
          </View>
          <View className="flex-1">
            <Text variant="editorial-title" italic={false}>
              {prompt.isLoading ? '…' : prompt.data?.text ?? 'Pas de question cette semaine.'}
            </Text>
          </View>
        </View>

        {!answering && !justSaved && (
          <>
            <Text variant="body" tone="muted">
              Prends le temps qu'il faut. Tu peux passer cette semaine.
            </Text>
            <Button label="Y répondre" onPress={() => setAnswering(true)} />
          </>
        )}

        {answering && (
          <View className="gap-4">
            <Input
              placeholder="Écris ce qui te vient…"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={5}
            />

            {(links.data ?? []).filter((l) => l.status === 'active').length > 0 && (
              <View className="gap-2">
                <Text variant="caption" tone="muted">
                  À propos de quelqu'un de ton cercle ? (optionnel)
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {(links.data ?? []).filter((l) => l.status === 'active').map((link) => (
                    <Pressable
                      key={link.id}
                      onPress={() => setSelectedLinkId(
                        selectedLinkId === link.id ? null : link.id,
                      )}
                      className={cn(
                        'px-4 py-2 rounded-full border',
                        selectedLinkId === link.id
                          ? 'border-accent bg-elevated'
                          : 'border-border bg-surface',
                      )}
                    >
                      <Text variant="caption" tone="muted">{link.contactName}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {addEntry.isError && (
              <Text variant="caption" className="text-state-want-to-see">
                {errorMessage(addEntry.error)}
              </Text>
            )}

            <View className="flex-row gap-3">
              <Button
                label="Plus tard" variant="ghost" size="md" className="flex-1"
                onPress={() => { setAnswering(false); setContent(''); }}
              />
              <Button
                label={addEntry.isPending ? 'Enregistrement…' : 'Garder'}
                size="md" className="flex-1"
                onPress={onSave}
                loading={addEntry.isPending}
                disabled={!content.trim()}
              />
            </View>
          </View>
        )}

        {justSaved && (
          <Text variant="body" tone="muted" italic>
            Gardé dans ton journal.
          </Text>
        )}
      </Card>
    </Screen>
  );
}
