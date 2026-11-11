import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { applyNow, checkAndFetch, updatesEnabled } from '../lib/updates';
import { radius, spacing, useTheme } from '../theme';
import { Icon } from './Icon';
import { T } from './ui';

/** Release builds only: checks on every open/resume and shows a small card once an update is downloaded. */
export function UpdateBanner() {
  return updatesEnabled ? <Banner /> : null;
}

function Banner() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  // isUpdatePending turns true when an update has been downloaded (by our check or the native launch check).
  const { isUpdatePending } = Updates.useUpdates();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    checkAndFetch();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && checkAndFetch());
    return () => sub.remove();
  }, []);

  if (!isUpdatePending || hidden) return null;
  return (
    <Animated.View
      entering={FadeInDown.duration(250)}
      exiting={FadeOutDown.duration(200)}
      style={[styles.wrap, { bottom: insets.bottom + 74 }]}
      pointerEvents="box-none"
    >
      <View style={[styles.card, { backgroundColor: c.goalBg }]}>
        <Icon name="download" size={18} color={c.goalLabel} />
        <T size="small" medium color={c.goalText} style={{ flex: 1 }}>새로운 버전이 준비됐어요</T>
        <Pressable accessibilityRole="button" onPress={applyNow} style={[styles.btn, { backgroundColor: c.goalText }]}>
          <T size="small" medium color={c.goalBg}>지금 적용하기</T>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="나중에" hitSlop={10} onPress={() => setHidden(true)}>
          <Icon name="close" size={18} color={c.goalLabel} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.lg, right: spacing.lg },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.card, paddingVertical: spacing.md, paddingLeft: spacing.lg, paddingRight: spacing.md, flexWrap: 'wrap' },
  btn: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2 },
});
