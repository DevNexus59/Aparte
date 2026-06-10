import Svg, { Path, Circle } from 'react-native-svg';

interface IconProps { color: string; size?: number }

export function IconBattement({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M2 12h4l2.5-6 4 13 2.5-7H22" stroke={color} strokeWidth={1.7}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconCercle({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={2.4} fill={color} />
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.5} opacity={0.85} />
      <Circle cx={12} cy={3} r={1.7} fill={color} />
    </Svg>
  );
}

export function IconJournal({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3h11a2 2 0 0 1 2 2v15l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2z"
            stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M9 8h7M9 12h5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function IconMessages({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4v-4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"
            stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

export function IconToi({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8.5} r={3.6} stroke={color} strokeWidth={1.6} />
      <Path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"
            stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}
