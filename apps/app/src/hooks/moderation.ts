import { useMutation } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { api, refreshOnce } from '@/lib/api';
import { ApiError, NetworkError } from '@/lib/errors';
import { uploadWithAuthRetry } from '@/lib/upload';
import { useAuth } from '@/stores/auth';

const API_URL =
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  'http://localhost:4000';

export type ReportReason = 'sexual' | 'discriminatory' | 'harassment' | 'other';

interface ReportInput {
  reportedUserId?: string;
  reason: ReportReason;
  contentType: string;
  contentId?: string;
  description?: string;
}

export function useFileReport() {
  return useMutation({
    mutationFn: (input: ReportInput) =>
      api<{ report: { id: string } }>('/moderation/reports', { method: 'POST', body: input }),
  });
}

function uploadProfilePhotoXHR(file: { uri: string; mime: string; name: string }, token: string | null) {
  return new Promise<{ key: string }>((resolve, reject) => {
    const form = new FormData();
    form.append('photo', { uri: file.uri, type: file.mime, name: file.name } as unknown as Blob);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/photos/me`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.onload = () => {
      let data: Record<string, unknown> = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* corps vide */ }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data as { key: string });
      } else {
        reject(new ApiError(xhr.status, (data.error as string) ?? 'Échec de l\'upload'));
      }
    };
    xhr.onerror = () => reject(new NetworkError());
    xhr.send(form);
  });
}

// Upload de photo via XMLHttpRequest.
// fetch + FormData + headers custom = pas de Content-Type multipart injecté
// par la couche native en RN new architecture → multer ne voit pas le fichier.
// XHR contourne ce bug : il sérialise FormData côté natif indépendamment des
// headers JS, garantissant le bon boundary multipart.
export function useUploadProfilePhoto() {
  return useMutation({
    mutationFn: (file: { uri: string; mime: string; name: string }) =>
      uploadWithAuthRetry(
        (token) => uploadProfilePhotoXHR(file, token),
        () => useAuth.getState().accessToken,
        refreshOnce,
      ),
  });
}
