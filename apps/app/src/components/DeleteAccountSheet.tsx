import { useState } from 'react';
import { View, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { Button } from './Button';
import { Input } from './Input';
import { useDeleteAccount, errorMessage } from '@/hooks/auth';
import { unregisterCurrentDevice } from '@/hooks/push';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function DeleteAccountSheet({ open, onClose }: Props) {
  const deleteAccount = useDeleteAccount();
  const [password, setPassword] = useState('');
  const insets = useSafeAreaInsets();

  async function confirm() {
    if (!password) return;
    try {
      await unregisterCurrentDevice();
      await deleteAccount.mutateAsync(password);
    } catch { /* erreur affichée ci-dessous */ }
  }

  function close() {
    setPassword('');
    onClose();
  }

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={close}>
      <View className="flex-1 bg-bg/90 justify-end">
        <View className="bg-surface p-6 rounded-t-lg gap-6 border-t border-border" style={{ paddingBottom: 24 + insets.bottom }}>
          <View className="gap-2">
            <Text variant="title">Supprimer ton compte</Text>
            <Text variant="body" tone="muted">
              Cette action est définitive : ton profil, tes messages, ton journal
              et tes données seront effacés. Confirme avec ton mot de passe.
            </Text>
          </View>

          <Input
            label="Mot de passe"
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {deleteAccount.isError && (
            <Text variant="caption" className="text-state-want-to-see">
              {errorMessage(deleteAccount.error)}
            </Text>
          )}

          <View className="flex-row gap-3">
            <Button label="Annuler" variant="ghost" size="md" className="flex-1" onPress={close} />
            <Button
              label={deleteAccount.isPending ? 'Suppression…' : 'Supprimer définitivement'}
              variant="outline"
              size="md"
              className="flex-1"
              onPress={confirm}
              loading={deleteAccount.isPending}
              disabled={!password}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
