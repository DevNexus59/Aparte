import { View } from 'react-native';
import { Text } from './Text';
import { Eyebrow } from './Eyebrow';
import { Orb } from './Orb';
import { useCircleStates } from '@/hooks/states';
import { useLinks } from '@/hooks/links';
import { STATES, colors, EmotionalState } from '@/theme/tokens';
import { timeAgo } from '@/lib/time';

export function CircleStates() {
  const states = useCircleStates();
  const links = useLinks();

  const visible = (states.data ?? []).filter((s) => s.userId);
  if (visible.length === 0) return null;

  // Match userId -> contactName via les liens.
  const nameByUserId: Record<string, string> = {};
  (links.data ?? []).forEach((l) => {
    if (l.memberUserId) nameByUserId[l.memberUserId] = l.contactName;
  });

  return (
    <View className="gap-3 mt-4">
      <Eyebrow>Ton cercle</Eyebrow>
      <View className="gap-2">
        {visible.map((s) => {
          const meta = STATES[s.state as EmotionalState];
          const name = (s.userId && nameByUserId[s.userId]) ?? 'Une présence';
          return (
            <View key={s.userId ?? Math.random()} className="flex-row items-center gap-3">
              <Orb size={18} color={meta.color} breathing />
              <Text variant="body" tone="muted" className="flex-1">
                <Text variant="body">{name}</Text>{' '}{meta.verb}
              </Text>
              <Text variant="caption" tone="faded">{timeAgo(s.setAt)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
