import { useState } from 'react';
import { View, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { Button } from './Button';
import { PasswordInput } from './PasswordInput';
import { useChangePassword, errorMessage } from '@/hooks/auth';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordSheet({ open, onClose }: Props) {
  const changePassword = useChangePassword();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [done, setDone] = useState(false);

  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit = !!oldPassword && newPassword.length >= 12 && passwordsMatch;

  async function confirm() {
    if (!canSubmit) return;
    try {
      await changePassword.mutateAsync({ oldPassword, newPassword });
      setDone(true);
    } catch { /* erreur affichée ci-dessous */ }
  }

  function close() {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setDone(false);
    changePassword.reset();
    onClose();
  }

  const insets = useSafeAreaInsets();

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={close}>
      <View className="flex-1 bg-bg/90 justify-end">
        <View className="bg-surface p-6 rounded-t-lg gap-6 border-t border-border" style={{ paddingBottom: 24 + insets.bottom }}>
          <View className="gap-2">
            <Text variant="title">Changer de mot de passe</Text>
            {!done && (
              <Text variant="body" tone="muted">
                Confirme ton mot de passe actuel, puis choisis un nouveau mot
                de passe (12 caractères minimum).
              </Text>
            )}
          </View>

          {done ? (
            <Text variant="body">Ton mot de passe a été mis à jour.</Text>
          ) : (
            <>
              <View className="gap-4">
                <PasswordInput
                  label="Mot de passe actuel"
                  value={oldPassword} onChangeText={setOldPassword}
                />
                <PasswordInput
                  label="Nouveau mot de passe"
                  value={newPassword} onChangeText={setNewPassword}
                />
                <PasswordInput
                  label="Confirmer le nouveau mot de passe"
                  value={confirmPassword} onChangeText={setConfirmPassword}
                  error={confirmPassword && !passwordsMatch ? 'Les mots de passe ne correspondent pas' : undefined}
                />
              </View>

              {changePassword.isError && (
                <Text variant="caption" className="text-state-want-to-see">
                  {errorMessage(changePassword.error)}
                </Text>
              )}
            </>
          )}

          <View className="flex-row gap-3">
            <Button label={done ? 'Fermer' : 'Annuler'} variant="ghost" size="md" className="flex-1" onPress={close} />
            {!done && (
              <Button
                label={changePassword.isPending ? 'Modification…' : 'Changer le mot de passe'}
                variant="outline"
                size="md"
                className="flex-1"
                onPress={confirm}
                loading={changePassword.isPending}
                disabled={!canSubmit}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
