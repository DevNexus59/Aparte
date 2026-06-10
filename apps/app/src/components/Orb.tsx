import { useEffect } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { colors, hexA } from '@/theme/tokens';

interface Props {
  size?: number;
  color?: string;
  /** Animation de respiration (halo qui se dilate et opacité qui pulse). */
  breathing?: boolean;
  /** Anneau fin autour du corps. */
  ring?: boolean;
  /** 0..1 — intensité globale (0.5 = orbe étouffé, 1 = pleine lumière). */
  dim?: number;
  style?: StyleProp<ViewStyle>;
}

// Un orbe = un astre. Halo radial (dilate), corps avec dégradé,
// anneau fin optionnel. La métaphore centrale du design Cercle.
// Le cycle de respiration : 5.6s (2.8s aller, 2.8s retour) — assez lent
// pour ne jamais distraire, juste rappeler que l'astre est vivant.
export function Orb({
  size = 64,
  color = colors.accent,
  breathing = false,
  ring = false,
  dim = 1,
  style,
}: Props) {
  const haloScale = useSharedValue(1);
  const haloOpacity = useSharedValue(0.82);
  const coreOpacity = useSharedValue(0.9);

  useEffect(() => {
    if (!breathing) {
      haloScale.value = 1;
      haloOpacity.value = 0.82;
      coreOpacity.value = 1;
      return;
    }
    haloScale.value = withRepeat(
      withTiming(1.14, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      -1, true,
    );
    haloOpacity.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      -1, true,
    );
    coreOpacity.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      -1, true,
    );
  }, [breathing, haloScale, haloOpacity, coreOpacity]);

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: haloScale.value }],
    opacity: haloOpacity.value,
  }));
  const coreStyle = useAnimatedStyle(() => ({
    opacity: coreOpacity.value,
  }));

  const haloSize = size * 2.1;          // halo s'étend bien au-delà du corps
  const haloOffset = -(haloSize - size) / 2;

  return (
    <View
      style={[
        { width: size, height: size, position: 'relative',
          alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      {/* Halo : SVG avec radial gradient. Centré sur l'orbe, déborde grandement. */}
      <Animated.View
        style={[
          { position: 'absolute', width: haloSize, height: haloSize, left: haloOffset, top: haloOffset },
          haloStyle,
        ]}
        pointerEvents="none"
      >
        <Svg width={haloSize} height={haloSize}>
          <Defs>
            <RadialGradient id={`halo-${color.slice(1)}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0%"  stopColor={color} stopOpacity={0.42 * dim} />
              <Stop offset="68%" stopColor={color} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={haloSize / 2} cy={haloSize / 2} r={haloSize / 2} fill={`url(#halo-${color.slice(1)})`} />
        </Svg>
      </Animated.View>

      {/* Corps : dégradé radial offset, donne l'illusion d'un astre éclairé. */}
      <Animated.View style={[{ width: size, height: size }, coreStyle]} pointerEvents="none">
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id={`core-${color.slice(1)}`} cx="38%" cy="32%" r="62%">
              <Stop offset="0%"   stopColor={color} stopOpacity={0.95} />
              <Stop offset="46%"  stopColor={color} stopOpacity={0.55} />
              <Stop offset="100%" stopColor={color} stopOpacity={0.16} />
            </RadialGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#core-${color.slice(1)})`} />
          {ring && (
            <Circle
              cx={size / 2} cy={size / 2} r={size / 2 - 0.5}
              fill="none"
              stroke={hexA(color, 0.5)}
              strokeWidth={1}
            />
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}
