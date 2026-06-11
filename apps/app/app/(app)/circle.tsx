import { useState } from 'react';
import { View, Pressable, ActivityIndicator, Share, Modal } from 'react-native';
import { Text } from '@/components/Text';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Eyebrow } from '@/components/Eyebrow';
import { Orb } from '@/components/Orb';
import { ReportSheet } from '@/components/ReportSheet';
import { useLinks, useCreateLink, useRemoveLink, Link } from '@/hooks/links';
import { useMyState, useCircleStates } from '@/hooks/states';
import { errorMessage } from '@/hooks/auth';
import { inviteMessage } from '@/lib/share';
import { STATES, colors, EmotionalState } from '@/theme/tokens';

const MAX_LINKS = 3;

// Constellation : moi au centre, mes liens autour, positions précalculées.
const POSITIONS: Record<number, Array<{ x: number; y: number }>> = {
  1: [{ x: 0, y: -100 }],                                        // au-dessus
  2: [{ x: -90, y: -60 }, { x: 90, y: -60 }],                     // diagonale haute
  3: [{ x: 0, y: -110 }, { x: -95, y: 60 }, { x: 95, y: 60 }],    // triangle inversé
};

export default function CircleScreen() {
  const links = useLinks();
  const myState = useMyState();
  const circleStates = useCircleStates();
  const [adding, setAdding] = useState(false);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);

  const activeLinks = (links.data ?? []).filter((l) => l.status === 'active');
  const remaining = MAX_LINKS - activeLinks.length;
  const myColor = myState.data ? STATES[myState.data.state].color : colors.accent;

  // Map state par lien (via le hook circleStates → liste d'états visibles).
  const stateByMember: Record<string, EmotionalState> = {};
  (circleStates.data ?? []).forEach((s) => {
    if (s.userId) stateByMember[s.userId] = s.state;
  });

  return (
    <Screen glowColors={[myColor]} glowIntensity={0.14}>
      <Eyebrow>Ton cercle</Eyebrow>
      <Text variant="editorial-display" className="mt-3">
        Jusqu'à trois.{'\n'}Pas plus.
      </Text>
      <Text variant="body" tone="faded" className="mt-2">
        {activeLinks.length === 0 ? 'Personne encore.'
          : `${activeLinks.length} ${activeLinks.length > 1 ? 'présences' : 'présence'} · ${remaining} ${remaining > 1 ? 'restantes' : 'restante'}.`}
      </Text>

      {/* Zone constellation : carré centré, 320px de haut */}
      <View style={{ height: 280, marginTop: 32, alignItems: 'center', justifyContent: 'center' }}>
        {/* Moi, au centre */}
        <View style={{ position: 'absolute' }}>
          <Orb size={70} color={myColor} breathing ring />
        </View>

        {/* Liens autour */}
        {activeLinks.map((link, i) => {
          const pos = POSITIONS[activeLinks.length]?.[i];
          if (!pos) return null;
          const state = link.memberUserId ? stateByMember[link.memberUserId] : undefined;
          const linkColor = state ? STATES[state].color : colors.faded;
          return (
            <Pressable
              key={link.id}
              onPress={() => setSelectedLink(link)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={state ? `${link.contactName}, ${STATES[state].label}` : link.contactName}
              style={{ position: 'absolute', transform: [{ translateX: pos.x }, { translateY: pos.y }] }}
            >
              <View style={{ alignItems: 'center', gap: 6 }}>
                <Orb size={52} color={linkColor} breathing={!!state} ring={!!state} dim={state ? 1 : 0.55} />
                <Text variant="caption" className="text-center" style={{ maxWidth: 90 }}>
                  {link.contactName}
                </Text>
              </View>
            </Pressable>
          );
        })}

        {/* Place vide cliquable : aperçu fantôme à la dernière position dispo */}
        {remaining > 0 && !adding && activeLinks.length > 0 && (() => {
          const ghostPos = POSITIONS[activeLinks.length + 1]?.[activeLinks.length];
          if (!ghostPos) return null;
          return (
            <Pressable
              onPress={() => setAdding(true)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Ajouter une présence"
              style={{
                position: 'absolute',
                transform: [{ translateX: ghostPos.x }, { translateY: ghostPos.y }],
              }}
            >
              <View style={{
                width: 52, height: 52, borderRadius: 26,
                borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text variant="caption" tone="faded">+</Text>
              </View>
            </Pressable>
          );
        })()}
      </View>

      {/* État vide / formulaire d'ajout / actions */}
      {links.isLoading && (
        <ActivityIndicator color={colors.accent} className="mt-4" />
      )}

      {!adding && activeLinks.length === 0 && !links.isLoading && (
        <View className="mt-6 items-center">
          <Button label="Ajouter une présence" onPress={() => setAdding(true)} />
        </View>
      )}

      {!adding && activeLinks.length > 0 && remaining > 0 && (
        <View className="mt-6">
          <Button label="Ajouter une présence" variant="soft" onPress={() => setAdding(true)} />
        </View>
      )}

      {adding && <AddLinkForm onDone={() => setAdding(false)} />}

      {/* Sheet de fiche de lien */}
      {selectedLink && (
        <LinkDetailSheet
          link={selectedLink}
          onClose={() => setSelectedLink(null)}
        />
      )}
    </Screen>
  );
}

function AddLinkForm({ onDone }: { onDone: () => void }) {
  const create = useCreateLink();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  async function submit() {
    if (!name.trim()) return;
    try {
      await create.mutateAsync({
        contactName: name.trim(),
        contactPhone: phone.trim() || undefined,
      });
      onDone();
    } catch { /* erreur affichée */ }
  }

  return (
    <Card className="mt-6 gap-4">
      <View>
        <Eyebrow>Ajouter une présence</Eyebrow>
        <Text variant="caption" tone="faded" className="mt-2">
          Tu peux la rajouter avant qu'elle utilise Cercle. Tu changeras d'avis quand tu voudras.
        </Text>
      </View>

      <Input label="Prénom ou surnom" value={name} onChangeText={setName} placeholder="ex. Léa" />
      <Input label="Téléphone (optionnel)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      {create.isError && (
        <Text variant="caption" className="text-state-want-to-see">{errorMessage(create.error)}</Text>
      )}

      <View className="flex-row gap-3">
        <Button label="Plus tard" variant="ghost" size="md" className="flex-1" onPress={onDone} />
        <Button
          label={create.isPending ? '…' : 'Ajouter'}
          size="md" className="flex-1"
          onPress={submit}
          loading={create.isPending}
          disabled={!name.trim()}
        />
      </View>

      <Pressable
        onPress={() => Share.share({ message: inviteMessage(name.trim() || undefined) })}
        hitSlop={10}
        accessibilityRole="button"
        className="items-center mt-1"
      >
        <Text variant="caption" tone="faded">Lui partager Cercle →</Text>
      </Pressable>
    </Card>
  );
}

function LinkDetailSheet({ link, onClose }: { link: Link; onClose: () => void }) {
  const remove = useRemoveLink();
  const [reporting, setReporting] = useState(false);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bgDeep + 'e6',
          justifyContent: 'flex-end',
        }}
      >
        <Pressable
          style={{ position: 'absolute', inset: 0 }}
          onPress={onClose}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        <View style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: 22, borderTopRightRadius: 22,
          borderTopWidth: 1, borderColor: colors.border,
          padding: 26, gap: 18, paddingBottom: 40,
        }}>
          <Text variant="editorial-title">{link.contactName}</Text>
          {link.contactPhone && (
            <Text variant="body" tone="muted">{link.contactPhone}</Text>
          )}

          <View className="gap-3 mt-2">
            <Pressable onPress={() => remove.mutate(link.id)} disabled={remove.isPending} hitSlop={10} accessibilityRole="button">
              <Text variant="body" tone="muted">
                {remove.isPending ? 'Retrait…' : 'Retirer du cercle'}
              </Text>
            </Pressable>

            {link.memberUserId && (
              <Pressable onPress={() => setReporting(true)} hitSlop={10} accessibilityRole="button">
                <Text variant="body" tone="faded">Signaler</Text>
              </Pressable>
            )}

            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button">
              <Text variant="body" tone="faded">Fermer</Text>
            </Pressable>
          </View>

          {link.memberUserId && (
            <ReportSheet
              open={reporting}
              onClose={() => setReporting(false)}
              target={{ reportedUserId: link.memberUserId, contentType: 'profile', contentId: link.memberUserId }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
