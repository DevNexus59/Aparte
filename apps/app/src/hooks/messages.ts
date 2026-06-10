import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient, useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { useAuth } from '@/stores/auth';
import {
  messagesUrl, flattenMessagePages,
  type Message, type MessagePage, type ConversationSummary,
} from '@/lib/messages';

export { flattenMessagePages, type Message };

export function useConversations() {
  return useQuery({
    queryKey: ['messages', 'list'],
    queryFn: () => api<{ conversations: ConversationSummary[] }>('/messages').then((d) => d.conversations),
  });
}

export function useConversation(otherUserId: string) {
  return useInfiniteQuery({
    queryKey: ['messages', otherUserId],
    queryFn: ({ pageParam }) => api<MessagePage>(messagesUrl(otherUserId, 30, pageParam)),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!otherUserId,
  });
}

export function useSendMessage(otherUserId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      api<Message>(`/messages/${otherUserId}`, { method: 'POST', body: { content } }),
    onSuccess: (message) => {
      prependMessage(qc, otherUserId, message);
      // Filet de sécurité : si le fetch initial de la conversation était encore
      // en vol, son résultat (sans ce message) écraserait le cache — on
      // invalide pour forcer un refetch qui inclura le message persistant.
      qc.invalidateQueries({ queryKey: ['messages', otherUserId] });
      qc.invalidateQueries({ queryKey: ['messages', 'list'] });
    },
  });
}

function prependMessage(
  qc: ReturnType<typeof useQueryClient>,
  otherUserId: string,
  message: Message,
) {
  qc.setQueryData<InfiniteData<MessagePage>>(['messages', otherUserId], (data) => {
    // Pas encore de données en cache (fetch initial pas terminé) : on laisse
    // le fetch — suivi de l'invalidation ci-dessus — faire foi.
    if (!data) return data;
    const [first, ...rest] = data.pages;
    // Évite les doublons (écho du serveur après l'optimistic update local).
    if (first.items.some((m) => m.id === message.id)) return data;
    return {
      ...data,
      pages: [{ ...first, items: [message, ...first.items] }, ...rest],
    };
  });
}

// Connexion socket pour la durée de la session — pousse `message:new` dans
// le cache TanStack Query sans refetch complet (perf).
export function useMessageSocket() {
  const { accessToken, userId } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!accessToken) return;
    const socket = connectSocket(accessToken);

    const onNewMessage = (message: Message) => {
      const otherUserId = message.senderId === userId ? message.recipientId : message.senderId;
      prependMessage(qc, otherUserId, message);
      qc.invalidateQueries({ queryKey: ['messages', otherUserId] });
      qc.invalidateQueries({ queryKey: ['messages', 'list'] });
    };

    socket.on('message:new', onNewMessage);

    return () => {
      socket.off('message:new', onNewMessage);
      disconnectSocket();
    };
  }, [accessToken, userId, qc]);
}
