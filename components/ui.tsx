import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { MAX_FONT_SCALE, Palette, fonts, radius, spacing, type, useTheme } from '../theme';
import { Icon, IconName } from './Icon';

type Size = keyof typeof type;
type Tone = keyof Palette;

type TProps = TextProps & {
  size?: Size;
  tone?: Tone;
  color?: string;
  medium?: boolean;
  style?: StyleProp<TextStyle>;
};

/** All text goes through here: Pretendard, token sizes/colors, capped font scaling. */
export function T({ size = 'body', tone = 'text', color, medium, style, ...rest }: TProps) {
  const { c } = useTheme();
  const fs = type[size];
  return (
    <Text
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      {...rest}
      style={[
        { fontSize: fs, lineHeight: Math.round(fs * 1.45), color: color ?? c[tone], fontFamily: medium ? fonts.medium : fonts.regular },
        style,
      ]}
    />
  );
}

export function Card({ children, style, bg }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; bg?: string }) {
  const { c } = useTheme();
  return <View style={[s.card, { backgroundColor: bg ?? c.card }, style]}>{children}</View>;
}

export function CardHeader({ title, icon, right }: { title: string; icon?: IconName; right?: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={s.header}>
      {icon ? <Icon name={icon} size={18} color={c.sub} /> : null}
      <T medium style={{ flex: 1 }}>{title}</T>
      {right}
    </View>
  );
}

export function Badge({ label }: { label: string }) {
  const { c } = useTheme();
  return (
    <View style={[s.badge, { backgroundColor: c.badgeBg }]}>
      <T size="caption" medium color={c.badgeText}>{label}</T>
    </View>
  );
}

/** Pill-shaped tab / chip. Selected = accent fill, otherwise card fill + soft border. */
export function Pill({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[s.pill, selected ? { backgroundColor: c.accent, borderColor: c.accent } : { backgroundColor: c.card, borderColor: c.lineSoft }]}
    >
      <T size="small" medium color={selected ? c.onAccent : c.text}>{label}</T>
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  icon,
  disabled,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'outline' | 'quiet';
  icon?: IconName;
  disabled?: boolean;
}) {
  const { c } = useTheme();
  const bg = kind === 'primary' ? c.accent : 'transparent';
  const fg = kind === 'primary' ? c.onAccent : c.text;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
        kind === 'outline' && { borderWidth: 1, borderColor: c.lineSoft },
      ]}
    >
      {icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <T medium color={fg} style={{ textAlign: 'center', flexShrink: 1 }}>{label}</T>
    </Pressable>
  );
}

export function Notice({ text }: { text: string }) {
  const { c } = useTheme();
  return (
    <View style={[s.notice, { backgroundColor: c.badgeBg }]}>
      <Icon name="info" size={18} color={c.badgeText} />
      <T size="small" color={c.badgeText} style={{ flex: 1 }}>{text}</T>
    </View>
  );
}

export function Divider() {
  const { c } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth * 2, backgroundColor: c.line }} />;
}

export function tapFeedback() {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
}

/** Round check that fades/scales its tick and fills with the accent color; light haptic on change. */
export function CheckRow({ label, detail, checked, onToggle }: { label: string; detail?: string; checked: boolean; onToggle: () => void }) {
  const { c } = useTheme();
  const v = useSharedValue(checked ? 1 : 0);
  useEffect(() => {
    v.value = withTiming(checked ? 1 : 0, { duration: 220 });
  }, [checked, v]);
  const boxStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(v.value, [0, 1], [c.card, c.accent]),
    borderColor: interpolateColor(v.value, [0, 1], [c.control, c.accent]),
  }));
  const tickStyle = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ scale: 0.6 + 0.4 * v.value }] }));
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => {
        tapFeedback();
        onToggle();
      }}
      style={s.checkRow}
    >
      <Animated.View style={[s.box, boxStyle]}>
        <Animated.View style={tickStyle}>
          <Icon name="check" size={16} color={c.onAccent} strokeWidth={2.4} />
        </Animated.View>
      </Animated.View>
      <View style={{ flex: 1 }}>
        <T tone={checked ? 'sub' : 'text'}>{label}</T>
        {detail ? <T size="caption" tone="faint">{detail}</T> : null}
      </View>
    </Pressable>
  );
}

export const s = StyleSheet.create({
  card: { borderRadius: radius.card, padding: spacing.xl, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  pill: { borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  button: {
    minHeight: 50,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  notice: { flexDirection: 'row', gap: spacing.md, borderRadius: radius.inner, padding: spacing.lg },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.sm },
  box: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
