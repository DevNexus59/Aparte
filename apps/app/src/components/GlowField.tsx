import { View, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { colors, hexA } from '@/theme/tokens';

interface Props {
  /** Une couleur par halo (max 3, on cycle). */
  glowColors?: string[];
  /** 0..1 — densité de la lueur. */
  intensity?: number;
}

const SPOTS = [
  { xPct: 0.78, yPct: 0.12, r: 0.52 },
  { xPct: 0.12, yPct: 0.64, r: 0.46 },
  { xPct: 0.60, yPct: 0.92, r: 0.40 },
];

// Trois halos radiaux qui flottent en background. Lecture : ambiance lumineuse,
// jamais lecture explicite. Toujours derrière le contenu, pointer-events off.
export function GlowField({
  glowColors = [colors.accent],
  intensity = 0.5,
}: Props) {
  const { width, height } = Dimensions.get('window');

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
    >
      {SPOTS.map((spot, i) => {
        const color = glowColors[i % glowColors.length];
        const r = Math.max(width, height) * spot.r;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: width * spot.xPct - r,
              top: height * spot.yPct - r,
              width: r * 2,
              height: r * 2,
            }}
          >
            <Svg width={r * 2} height={r * 2}>
              <Defs>
                <RadialGradient id={`glow-${i}-${color.slice(1)}`} cx="50%" cy="50%" r="50%">
                  <Stop offset="0%"  stopColor={color} stopOpacity={0.9 * intensity} />
                  <Stop offset="70%" stopColor={color} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={r} cy={r} r={r} fill={`url(#glow-${i}-${color.slice(1)})`} />
            </Svg>
          </View>
        );
      })}
    </View>
  );
}
