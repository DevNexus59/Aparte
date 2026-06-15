import { useState } from 'react';
import { View, Pressable, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { GlowField } from '@/components/GlowField';
import { useAuth } from '@/stores/auth';
import { useLinks } from '@/hooks/links';
import { useConversation, useConversationStarters, useSendMessage, flattenMessagePages, type Message } from '@/hooks/messages';
import { errorMessage } from '@/hooks/auth';
import { cn } from '@/lib/cn';
import { useAccentColors } from '@/stores/accent';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function Conversation() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const myUserId = useAuth((s) => s.userId);
  const links = useLinks();
  const conversation = useConversation(userId);
  const starters = useConversationStarters(userId);
  const send = useSendMessage(userId);
  const [content, setContent] = useState('');
  const accentColors = useAccentColors();

  const contactName = (links.data ?? []).find((l) => l.memberUserId === userId)?.contactName ?? '…';
  const messages: Message[] = flattenMessagePages(conversation.data?.pages);

  async function onSend() {
    const text = content.trim();
    if (!text) return;
    setContent('');
    try {
      await send.mutateAsync(text);
    } catch { /* erreur affichée sous le champ */ }
  }

  return (
    <View className="flex-1 bg-bg">
      <GlowField glowColors={[accentColors.accent]} intensity={0.08} />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-center gap-3 px-[22px] pt-4 pb-3 border-b border-border">
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Retour">
            <Text variant="body" tone="muted">←</Text>
          </Pressable>
          <Text variant="editorial-title">{contactName}</Text>
        </View>

        {conversation.isLoading && (
          <ActivityIndicator color={accentColors.accent} className="mt-12" />
        )}

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={90}
        >
          <FlatList
            data={messages}
            keyExtractor={(m) => m.id}
            inverted
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
            renderItem={({ item }) => (
              <Bubble message={item} mine={item.senderId === myUserId} />
            )}
            onEndReached={() => {
              if (conversation.hasNextPage && !conversation.isFetchingNextPage) {
                conversation.fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.4}
          />

          <View className="px-4 pb-3 pt-2 gap-2">
            {(starters.data ?? []).length > 0 && !content.trim() && (
              <View className="flex-row flex-wrap gap-2">
                {(starters.data ?? []).map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setContent(s)}
                    className="px-4 py-2 rounded-full border border-border bg-surface"
                    accessibilityRole="button"
                    accessibilityLabel={s}
                  >
                    <Text variant="caption" tone="muted">{s}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {send.isError && (
              <Text variant="caption" className="text-state-want-to-see">
                {errorMessage(send.error)}
              </Text>
            )}
            <View className="flex-row items-end gap-2">
              <Input
                placeholder="Écris un message…"
                value={content}
                onChangeText={setContent}
                multiline
                className="flex-1"
              />
              <Button
                label="Envoyer"
                size="md"
                onPress={onSend}
                loading={send.isPending}
                disabled={!content.trim()}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Bubble({ message, mine }: { message: Message; mine: boolean }) {
  return (
    <View className={cn('flex-row', mine ? 'justify-end' : 'justify-start')}>
      <View
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-3 gap-1',
          mine ? 'bg-accent' : 'bg-surface border border-border',
        )}
      >
        <Text variant="body" className={mine ? '!text-accent-text' : undefined}>
          {message.content}
        </Text>
        <Text
          variant="caption"
          className={mine ? '!text-accent-text opacity-60' : undefined}
          tone={mine ? undefined : 'faded'}
        >
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}
