import { useState } from 'react';
import { View, Pressable, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { Card } from './Card';
import { Button } from './Button';
import { Eyebrow } from './Eyebrow';
import { Orb } from './Orb';
import { useMyState, useSetState, useClearState } from '@/hooks/states';
import { STATES, EmotionalState, colors } from '@/theme/tokens';

const STATE_ORDER: EmotionalState[] = ['available', 'want_to_see', 'need_to_talk', 'socially_tired'];
import { timeAgo } from '@/lib/time';
import { errorMessage } from '@/hooks/auth';

export function MyStatePicker() {
  const me = useMyState();
  const setSt = useSetState();
  const clearSt = useClearState();
  const [open, setOpen] = useState(false);

  const current = me.data;

  async function choose(state: EmotionalState) {
    try {
      await setSt.mutateAsync({ state, durationHours: 24 });
      setOpen(false);
    } catch { /* erreur affichée dans le modal */ }
  }

  // Pas d'état posé : invitation discrète, toute la Card cliquable.
  if (!current) {
    return (
      <>
        <Pressable onPress={() => setOpen(true)} accessibilityRole="button">
          <Card className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Orb size={26} color={colors.faded} />
              <Text variant="body" tone="muted">Pose ta lueur</Text>
            </View>
            <Text variant="caption" tone="faded">Régler</Text>
          </Card>
        </Pressable>
        <LueurModal
          open={open}
          current={null}
          onClose={() => setOpen(false)}
          onChoose={choose}
          onClear={() => setOpen(false)}
          loading={setSt.isPending}
          error={setSt.isError ? errorMessage(setSt.error) : undefined}
        />
      </>
    );
  }

  // État posé : on ne wrappe PAS la Card dans un Pressable (pour ne pas capturer
  // les clics sur "Changer" / "Éteindre"). À la place, l'orbe + le label sont
  // dans un Pressable séparé.
  const s = STATES[current.state];
  return (
    <>
      <Card>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-4">
            <Orb size={36} color={s.color} breathing ring />
            <View>
              <Text variant="editorial-title">{s.label}</Text>
              <Text variant="caption" tone="faded" className="mt-1">
                Posée {timeAgo(current.setAt)}
              </Text>
            </View>
          </View>
        </View>
        <View className="flex-row gap-6 mt-5">
          <Pressable onPress={() => setOpen(true)} hitSlop={10} accessibilityRole="button">
            <Text variant="caption" tone="muted">Changer</Text>
          </Pressable>
          <Pressable
            onPress={() => clearSt.mutate()}
            disabled={clearSt.isPending}
            hitSlop={10}
            accessibilityRole="button"
          >
            <Text variant="caption" tone="faded">
              {clearSt.isPending ? '…' : 'Éteindre'}
            </Text>
          </Pressable>
        </View>
      </Card>
      <LueurModal
        open={open}
        current={current.state}
        onClose={() => setOpen(false)}
        onChoose={choose}
        onClear={() => {
          clearSt.mutate();
          setOpen(false);
        }}
        loading={setSt.isPending}
        error={setSt.isError ? errorMessage(setSt.error) : undefined}
      />
    </>
  );
}

// Modal "Ritual" — fondu doux entre les couleurs des états, orbe central qui respire.
// C'est le moment signature du produit. Volontairement immersif.
interface ModalProps {
  open: boolean;
  current: EmotionalState | null;
  onClose: () => void;
  onChoose: (s: EmotionalState) => void;
  onClear: () => void;
  loading: boolean;
  error?: string;
}

function LueurModal({ open, current, onClose, onChoose, onClear, loading, error }: ModalProps) {
  const [sel, setSel] = useState<EmotionalState | null>(current);
  const insets = useSafeAreaInsets();

  // Synchronise la sélection si on rouvre avec un état différent.
  // (volontairement sans useEffect : `current` ne change que d'extérieur,
  // donc on accepte un état local qui peut diverger pendant l'édition.)

  const selColor = sel ? STATES[sel].color : colors.faded;

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-bg-deep">
        {/* Couches d'ambiance — un halo radial par état possible, fondu doux. */}
        {STATE_ORDER.map((k) => (
          <View
            key={k}
            pointerEvents="none"
            style={{
              position: 'absolute', inset: 0,
              opacity: sel === k ? 1 : 0,
              backgroundColor: 'transparent',
            }}
          />
        ))}

        {/* Bouton fermer */}
        <View style={{ paddingTop: 60, paddingHorizontal: 22, flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            style={{
              width: 38, height: 38, borderRadius: 19,
              borderWidth: 1, borderColor: colors.border,
              backgroundColor: colors.surface + 'aa',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text variant="body" tone="muted">×</Text>
          </Pressable>
        </View>

        {/* Cœur du rituel */}
        <View className="flex-1 px-7 items-center justify-center">
          <Eyebrow>Poser ta lueur</Eyebrow>

          <View className="mt-6 mb-7" style={{ height: 180, alignItems: 'center', justifyContent: 'center' }}>
            <Orb size={150} color={selColor} breathing ring dim={sel ? 1 : 0.4} />
          </View>

          <Text variant="editorial-display" italic={false} className="text-center" style={{ minHeight: 42 }}>
            {sel ? STATES[sel].label : 'Comment tu te sens ?'}
          </Text>

          <Text variant="caption" tone="faded" className="text-center mt-2" style={{ maxWidth: 260 }}>
            Visible par ton cercle réciproque seulement. Elle s'efface d'elle-même dans 24 h.
          </Text>

          {/* Sélecteurs : 4 mini orbes alignés */}
          <View className="flex-row gap-3 mt-9">
            {STATE_ORDER.map((k) => {
              const s = STATES[k];
              const on = sel === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => setSel(k)}
                  hitSlop={8}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={s.label}
                  style={{ width: 62, alignItems: 'center', gap: 10,
                    transform: [{ scale: on ? 1.12 : 1 }] }}
                >
                  <Orb size={44} color={s.color} ring={on} dim={on ? 1 : 0.62} />
                  <Text
                    variant="caption"
                    className={on ? 'text-text' : 'text-text-faded'}
                    style={{ textAlign: 'center', fontSize: 11 }}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {error && (
            <Text variant="caption" className="text-state-want-to-see mt-4">{error}</Text>
          )}
        </View>

        {/* Actions */}
        <View style={{ paddingHorizontal: 26, paddingBottom: 40 + insets.bottom, gap: 6 }}>
          <Button
            label={loading ? 'Pose…' : 'Poser ma lueur'}
            disabled={!sel || loading}
            loading={loading}
            onPress={() => sel && onChoose(sel)}
          />
          <Button
            label={current ? 'Éteindre' : 'Plus tard'}
            variant="ghost"
            onPress={current ? onClear : onClose}
          />
        </View>
      </View>
    </Modal>
  );
}
