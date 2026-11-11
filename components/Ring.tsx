import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme';

const ACircle = Animated.createAnimatedComponent(Circle);

/** Progress ring. Fills from 0 to `progress` on mount, then eases to new values as they arrive. */
export function Ring({ progress, size = 220, stroke = 14, children }: { progress: number; size?: number; stroke?: number; children?: React.ReactNode }) {
  const { c } = useTheme();
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  const p = useSharedValue(0);
  const first = React.useRef(true);

  useEffect(() => {
    const target = Math.max(0, Math.min(1, progress));
    p.value = withTiming(target, { duration: first.current ? 1200 : 600, easing: Easing.out(Easing.cubic) });
    first.current = false;
  }, [progress, p]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: len * (1 - p.value) }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.ringTrack} strokeWidth={stroke} fill="none" />
        <ACircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={c.accent}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${len} ${len}`}
          animatedProps={animatedProps}
        />
      </Svg>
      {children}
    </View>
  );
}
