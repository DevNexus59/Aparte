import { useState } from 'react';
import { View, Modal, Pressable } from 'react-native';
import { Text } from './Text';
import { Button } from './Button';
import { Input } from './Input';
import { useFileReport, ReportReason } from '@/hooks/moderation';
import { errorMessage } from '@/hooks/auth';
import { cn } from '@/lib/cn';

interface Props {
  open: boolean;
  onClose: () => void;
  target: { reportedUserId?: string; contentType: string; contentId?: string };
}

const REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: 'sexual',         label: 'Contenu sexuel' },
  { value: 'discriminatory', label: 'Propos discriminants' },
  { value: 'harassment',     label: 'Harcèlement' },
  { value: 'other',          label: 'Autre' },
];

export function ReportSheet({ open, onClose, target }: Props) {
  const file = useFileReport();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [done, setDone] = useState(false);

  async function submit() {
    if (!reason) return;
    try {
      await file.mutateAsync({ ...target, reason, description: description || undefined });
      setDone(true);
      setTimeout(() => { onClose(); setDone(false); setReason(null); setDescription(''); }, 1500);
    } catch { /* erreur ci-dessous */ }
  }

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-bg/90 justify-end">
        <View className="bg-surface p-6 rounded-t-lg gap-6 border-t border-border">
          {done ? (
            <View className="gap-3">
              <Text variant="title">Signalement envoyé.</Text>
              <Text variant="body" tone="muted">
                Notre équipe examinera ce contenu rapidement. Merci.
              </Text>
            </View>
          ) : (
            <>
              <View className="gap-2">
                <Text variant="title">Signaler</Text>
                <Text variant="caption" tone="muted">
                  Anonyme. Examiné par l'équipe de modération.
                </Text>
              </View>

              <View className="gap-2">
                {REASONS.map((r) => (
                  <Pressable
                    key={r.value}
                    onPress={() => setReason(r.value)}
                    className={cn(
                      'p-4 rounded-md border',
                      reason === r.value ? 'border-accent bg-elevated' : 'border-border bg-surface',
                    )}
                  >
                    <Text variant="body">{r.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Input
                placeholder="Précise si tu veux (optionnel)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              {file.isError && (
                <Text variant="caption" className="text-state-want-to-see">
                  {errorMessage(file.error)}
                </Text>
              )}

              <View className="flex-row gap-3">
                <Button label="Annuler" variant="ghost" size="md" className="flex-1" onPress={onClose} />
                <Button
                  label={file.isPending ? 'Envoi…' : 'Signaler'}
                  size="md" className="flex-1"
                  onPress={submit}
                  loading={file.isPending}
                  disabled={!reason}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
