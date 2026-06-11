import { View, Pressable } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { IconBattement, IconCercle, IconJournal, IconMessages, IconToi } from '@/components/TabIcons';
import { colors, hexA } from '@/theme/tokens';
import { usePushRegistration } from '@/hooks/push';
import { useMessageSocket } from '@/hooks/messages';

// TabBar custom : gradient discret en haut vers bg-deep, icônes SVG du design.
// On garde Tabs d'Expo Router (préserve les transitions et le state) mais on
// override l'apparence via la prop `tabBar`.

const TABS = {
  index:    { label: 'Battement', Icon: IconBattement },
  circle:   { label: 'Cercle',    Icon: IconCercle },
  journal:  { label: 'Journal',   Icon: IconJournal },
  messages: { label: 'Messages',  Icon: IconMessages },
  profile:  { label: 'Toi',       Icon: IconToi },
} as const;

type TabKey = keyof typeof TABS;

interface BottomTabBarProps {
  state: { index: number; routes: { name: string; key: string }[] };
  navigation: {
    navigate: (name: string) => void;
    emit: (e: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
  };
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.bgDeep,
        borderTopWidth: 1,
        borderTopColor: hexA(colors.text, 0.05),
        paddingTop: 10,
        paddingBottom: Math.max(insets.bottom, 16),
        paddingHorizontal: 14,
      }}
    >
      {state.routes.map((route, i) => {
        const meta = TABS[route.name as TabKey];
        if (!meta) return null;
        const active = state.index === i;
        const tint = active ? colors.accent : colors.faded;

        return (
          <Pressable
            key={route.key}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!active && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            accessibilityRole="tab"
            accessibilityLabel={meta.label}
            accessibilityState={{ selected: active }}
            style={{ flex: 1, alignItems: 'center', gap: 5, paddingVertical: 8 }}
          >
            <View style={{ opacity: active ? 1 : 0.6 }}>
              <meta.Icon color={tint} />
            </View>
            <Text
              variant="caption"
              style={{
                fontSize: 10.5,
                color: tint,
                fontFamily: 'HankenGrotesk_600SemiBold',
                letterSpacing: 0.2,
              }}
            >
              {meta.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function AppLayout() {
  usePushRegistration();
  useMessageSocket();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...(props as unknown as BottomTabBarProps)} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"    />
      <Tabs.Screen name="circle"   />
      <Tabs.Screen name="journal"  />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="profile"  />
    </Tabs>
  );
}
