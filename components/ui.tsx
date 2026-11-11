import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import { C, F, MAX_FONT_SCALE, R } from '../lib/theme';
import { Icon, IconName } from './Icon';

type TProps = TextProps & { size?: number; color?: string; weight?: TextStyle['fontWeight']; style?: StyleProp<TextStyle> };

/** Text with a capped font scale so large system font settings don't break layouts. */
export function T({ size = F.body, color = C.text, weight = '400', style, ...rest }: TProps) {
  return (
    <Text
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      {...rest}
      style={[{ fontSize: size, color, fontWeight: weight, lineHeight: Math.round(size * 1.45) }, style]}
    />
  );
}

export function Card({ children, style, tint }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; tint?: string }) {
  return <View style={[s.card, tint ? { backgroundColor: tint } : null, style]}>{children}</View>;
}

export function CardTitle({ icon, children, right }: { icon?: IconName; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={s.titleRow}>
      {icon ? <Icon name={icon} size={20} color={C.pink} /> : null}
      <T size={F.h2 - 2} weight="700" style={{ flex: 1 }}>
        {children}
      </T>
      {right}
    </View>
  );
}

export function Badge({ label, bg = C.pinkSoft, color = C.text }: { label: string; bg?: string; color?: string }) {
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <T size={F.small} weight="600" color={color}>
        {label}
      </T>
    </View>
  );
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'soft' | 'ghost';
  disabled?: boolean;
  icon?: IconName;
}) {
  const bg = kind === 'primary' ? C.pink : kind === 'soft' ? C.pinkFaint : 'transparent';
  const fg = kind === 'primary' ? C.white : C.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
        kind === 'ghost' && { borderWidth: 1, borderColor: C.line },
      ]}
    >
      {icon ? <Icon name={icon} size={20} color={fg} /> : null}
      <T weight="700" color={fg} style={{ textAlign: 'center', flexShrink: 1 }}>
        {label}
      </T>
    </Pressable>
  );
}

export function Notice({ text }: { text: string }) {
  return (
    <View style={s.notice}>
      <Icon name="info" size={20} color={C.sub} />
      <T size={F.small} color={C.sub} style={{ flex: 1 }}>
        {text}
      </T>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: R.card, padding: 20, gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { alignSelf: 'flex-start', borderRadius: R.pill, paddingHorizontal: 14, paddingVertical: 5 },
  btn: {
    minHeight: 54,
    borderRadius: R.pill,
    paddingHorizontal: 22,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  notice: { flexDirection: 'row', gap: 10, backgroundColor: C.butter, borderRadius: R.small, padding: 14 },
});
