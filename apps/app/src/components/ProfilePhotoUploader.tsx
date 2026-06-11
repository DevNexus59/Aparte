import { useState } from 'react';
import { View, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Text } from './Text';
import { AuthedImage } from './AuthedImage';
import { useUploadProfilePhoto } from '@/hooks/moderation';
import { errorMessage } from '@/hooks/auth';

interface Props {
  userId: string;
  onUploaded?: () => void;
}

export function ProfilePhotoUploader({ userId, onUploaded }: Props) {
  const upload = useUploadProfilePhoto();
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  async function pick() {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Accès aux photos refusé');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      // SDK 54 : MediaTypeOptions est deprecated. Nouvelle API = array de strings.
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];

    // Le backend n'accepte que JPEG/PNG (magic bytes vérifiés).
    // ImagePicker peut renvoyer du WebP/HEIC sur certains Android/iPhone.
    // Quand mimeType n'est pas explicite, on force JPEG (extension la plus fiable
    // avec allowsEditing qui passe par le compresseur natif).
    let mime = asset.mimeType ?? 'image/jpeg';
    if (mime !== 'image/jpeg' && mime !== 'image/png') {
      console.warn(`[upload] format non supporté reçu: ${mime}, on force JPEG`);
      mime = 'image/jpeg';
    }

    try {
      await upload.mutateAsync({
        uri: asset.uri,
        mime,
        name: asset.fileName ?? 'photo.jpg',
      });
      setVersion((v) => v + 1);
      onUploaded?.();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <View className="items-center gap-3">
      <Pressable
        onPress={pick}
        disabled={upload.isPending}
        accessibilityRole="button"
        accessibilityLabel="Changer la photo de profil"
        accessibilityState={{ disabled: upload.isPending, busy: upload.isPending }}
      >
        <AuthedImage
          key={version}
          userId={userId}
          style={{ width: 96, height: 96, borderRadius: 48, opacity: upload.isPending ? 0.5 : 1 }}
          fallback={
            <View className="w-24 h-24 rounded-full bg-surface border border-border items-center justify-center">
              <Text variant="caption" tone="faded">Ajouter</Text>
            </View>
          }
        />
      </Pressable>
      <Text variant="caption" tone="muted">
        {upload.isPending ? 'Envoi…' : 'Photo de profil (privée, visible par ton cercle)'}
      </Text>
      {error && (
        <Text variant="caption" className="text-state-want-to-see">{error}</Text>
      )}
    </View>
  );
}
