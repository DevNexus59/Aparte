import { useState } from 'react';
import { View, Pressable, Linking, Share } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Text } from '@/components/Text';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Eyebrow } from '@/components/Eyebrow';
import { ProfilePhotoUploader } from '@/components/ProfilePhotoUploader';
import { DeleteAccountSheet } from '@/components/DeleteAccountSheet';
import { ChangePasswordSheet } from '@/components/ChangePasswordSheet';
import { useAuth } from '@/stores/auth';
import { unregisterCurrentDevice } from '@/hooks/push';
import { api, API_URL } from '@/lib/api';
import { errorMessage } from '@/hooks/auth';
import { useAccentTheme, useAccentColors } from '@/stores/accent';
import { ACCENT_THEMES, ACCENT_THEME_ORDER } from '@/theme/accentThemes';
import { colors } from '@/theme/tokens';

export default function Profile() {
  const accentColors = useAccentColors();
  const accentThemeId = useAccentTheme((s) => s.themeId);
  const setAccentTheme = useAccentTheme((s) => s.setTheme);
  const router = useRouter();
  const userId = useAuth((s) => s.userId);
  const clear = useAuth((s) => s.clear);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function logout() {
    await unregisterCurrentDevice();
    await clear();
  }

  async function exportData() {
    setExporting(true);
    setExportError(null);
    try {
      const data = await api<unknown>('/auth/export');
      await Share.share({
        title: 'Mes données Aparté',
        message: JSON.stringify(data, null, 2),
      });
    } catch (err) {
      setExportError(errorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  return (
    <Screen glowColors={[accentColors.accent]} glowIntensity={0.1}>
      <Eyebrow>Toi</Eyebrow>
      <Text variant="editorial-display" className="mt-3">
        Ton espace.
      </Text>
      <Text variant="body" tone="muted" className="mt-2">
        Visible par ton cercle uniquement.
      </Text>

      <Card className="items-center py-9 mt-10">
        {userId && <ProfilePhotoUploader userId={userId} />}
      </Card>

      <Pressable onPress={() => router.push('/profile/stats')} hitSlop={10} accessibilityRole="button">
        <Card className="flex-row items-center justify-between mt-6">
          <View className="gap-1">
            <Text variant="title">Tes traces</Text>
            <Text variant="body" tone="muted">Gratitude, souvenirs, présence.</Text>
          </View>
          <Text variant="body" tone="faded">→</Text>
        </Card>
      </Pressable>

      <Card className="mt-6 gap-3">
        <Text variant="title">Couleur d'accent</Text>
        <Text variant="body" tone="muted">Personnalise les accents de l'app.</Text>
        <View className="flex-row gap-3 mt-2">
          {ACCENT_THEME_ORDER.map((id) => {
            const theme = ACCENT_THEMES[id];
            const selected = id === accentThemeId;
            return (
              <Pressable
                key={id}
                onPress={() => setAccentTheme(id)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={theme.label}
                accessibilityState={{ selected }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.accent,
                  borderWidth: selected ? 3 : 0,
                  borderColor: colors.text,
                }}
              />
            );
          })}
        </View>
      </Card>

      <View className="gap-3 mt-10">
        <Pressable onPress={() => setChangePasswordOpen(true)} hitSlop={10} accessibilityRole="button">
          <Card className="flex-row items-center justify-between">
            <Text variant="body">Changer de mot de passe</Text>
            <Text variant="body" tone="faded">→</Text>
          </Card>
        </Pressable>

        <Pressable onPress={() => Linking.openURL(`${API_URL}/legal/confidentialite`)} hitSlop={10} accessibilityRole="button">
          <Card className="flex-row items-center justify-between">
            <Text variant="body">Politique de confidentialité</Text>
            <Text variant="body" tone="faded">→</Text>
          </Card>
        </Pressable>

        <Pressable onPress={() => Linking.openURL(`${API_URL}/legal/cgu`)} hitSlop={10} accessibilityRole="button">
          <Card className="flex-row items-center justify-between">
            <Text variant="body">Conditions générales d'utilisation</Text>
            <Text variant="body" tone="faded">→</Text>
          </Card>
        </Pressable>

        <Pressable onPress={() => Linking.openURL(`${API_URL}/legal/mentions-legales`)} hitSlop={10} accessibilityRole="button">
          <Card className="flex-row items-center justify-between">
            <Text variant="body">Mentions légales</Text>
            <Text variant="body" tone="faded">→</Text>
          </Card>
        </Pressable>

        <Pressable onPress={exportData} disabled={exporting} hitSlop={10} accessibilityRole="button">
          <Card className="flex-row items-center justify-between">
            <Text variant="body">{exporting ? 'Export en cours…' : 'Exporter mes données'}</Text>
            <Text variant="body" tone="faded">→</Text>
          </Card>
        </Pressable>
        {exportError && (
          <Text variant="caption" className="text-state-want-to-see">{exportError}</Text>
        )}
      </View>

      <View className="mt-12 items-center gap-6">
        <Button label="Se déconnecter" variant="soft" onPress={logout} />
        <Pressable onPress={() => setDeleteOpen(true)} hitSlop={10} accessibilityRole="button">
          <Text variant="body" className="text-state-want-to-see">Supprimer mon compte</Text>
        </Pressable>
      </View>

      <ChangePasswordSheet open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
      <DeleteAccountSheet open={deleteOpen} onClose={() => setDeleteOpen(false)} />

      <Text variant="caption" tone="faded" className="mt-8 text-center">
        v{Constants.expoConfig?.version}
      </Text>
    </Screen>
  );
}
