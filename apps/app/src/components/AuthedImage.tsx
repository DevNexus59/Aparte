import { useEffect, useState } from 'react';
import { Image, View, type StyleProp, type ImageStyle } from 'react-native';
import Constants from 'expo-constants';
import { useAuth } from '@/stores/auth';
import { arrayBufferToDataUri } from '@/lib/image';

const API_URL =
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  'http://localhost:4000';

interface Props {
  userId: string;
  style?: StyleProp<ImageStyle>;
  fallback?: React.ReactNode;
}

// Charge la photo via /photos/:userId avec le Bearer token, base64 encode
// pour l'afficher (RN <Image> ne sait pas faire fetch authentifié).
// Si l'API renvoie 403/404, on affiche le fallback silencieusement.
export function AuthedImage({ userId, style, fallback }: Props) {
  const accessToken = useAuth((s) => s.accessToken);
  const [dataUri, setDataUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDataUri(null);
    if (!accessToken) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    (async () => {
      try {
        const res = await fetch(`${API_URL}/photos/${userId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        });
        if (!res.ok) return; // 403/404 -> fallback
        const buffer = await res.arrayBuffer();
        const contentType = res.headers.get('content-type') ?? 'image/jpeg';
        if (!cancelled) setDataUri(arrayBufferToDataUri(buffer, contentType));
      } catch { /* fallback silencieux (réseau, abort, timeout) */ }
      finally { clearTimeout(timeout); }
    })();

    return () => { cancelled = true; controller.abort(); clearTimeout(timeout); };
  }, [userId, accessToken]);

  if (!dataUri) return <View style={style}>{fallback}</View>;
  return <Image source={{ uri: dataUri }} style={style} accessibilityIgnoresInvertColors />;
}
