// Envelope letter popup.
//
// Geometry: every layer (back, back-side flap, paper, front, flap, seal) is an SVG with the SAME
// size and the SAME 220×140 viewBox, so shared points line up exactly:
//   - flap tip and the front "V" tip are both (110, 78); the seal is centered on (110, 78)
//   - every layer is clipped by the same rounded rect (rx 8), so corners match (the flap never pokes out)
// One viewBox unit is a whole number of device pixels (see envelopeUnit), so integer coordinates land
// on integer pixels at any screen density.
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef } from 'react';
import { PixelRatio, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';
import { LABELS } from '../data/notifications';
import type { InboxEntry } from '../lib/letters';
import { envelope as E, fonts, MAX_FONT_SCALE, type } from '../theme';

export const VB_W = 220;
export const VB_H = 140;
export const TIP_Y = 78; // flap tip = front V tip = seal center
export const TIP_X = VB_W / 2;
const RX = 8;
const SEAL_R = 14;
const PAPER = { x: 12, y: 10, w: 196, h: 124, lift: 86 }; // paper slides up `lift` units

/** dp per viewBox unit, chosen so one unit is a whole number of device pixels. */
export function envelopeUnit(screenW: number) {
  const ratio = PixelRatio.get();
  const avail = Math.min(screenW - 64, 320);
  const unitPx = Math.max(1, Math.floor((avail * ratio) / VB_W));
  return unitPx / ratio;
}

let clipSeq = 0;

/** One envelope layer: full 220×140 viewBox at the shared size, clipped by the shared rounded rect. */
function Layer({ u, children }: { u: number; children: React.ReactNode }) {
  const id = useMemo(() => `envclip${++clipSeq}`, []);
  return (
    <Svg width={VB_W * u} height={VB_H * u} viewBox={`0 0 ${VB_W} ${VB_H}`} style={StyleSheet.absoluteFill}>
      <Defs>
        <ClipPath id={id}>
          <Rect x={0} y={0} width={VB_W} height={VB_H} rx={RX} ry={RX} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${id})`}>{children}</G>
    </Svg>
  );
}

// The flap gets a 1-unit stroke in its own color: flap and front share the V edge exactly, and two
// anti-aliased edges on the same line let the paper underneath show through as a hairline. The stroke
// covers that seam without moving any coordinate (the seal covers the tip).
const FLAP_D = `M0 0 L${VB_W} 0 L${TIP_X} ${TIP_Y} Z`;
// Whole pocket (rect minus the top notch) in one color, then the lower triangle on top: no seam between them.
const FRONT_D = `M0 0 L${TIP_X} ${TIP_Y} L${VB_W} 0 L${VB_W} ${VB_H} L0 ${VB_H} Z`;
const FRONT_LOW_D = `M0 ${VB_H} L${TIP_X} ${TIP_Y} L${VB_W} ${VB_H} Z`;

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function letterHeader(e: InboxEntry, now = new Date()) {
  const d = new Date(e.at);
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const sameDay = d.toDateString() === now.toDateString();
  return `${LABELS[e.kind]} · ${sameDay ? '' : `${d.getMonth() + 1}월 ${d.getDate()}일 `}${time}`;
}

type Props = {
  entry: InboxEntry;
  onOpened: () => void;
  onClosed: () => void;
};

export function LetterPopup({ entry, onOpened, onClosed }: Props) {
  const { width: sw, height: sh } = useWindowDimensions();
  const u = envelopeUnit(sw);
  const W = VB_W * u;
  const H = VB_H * u;
  // Envelope sits a bit below center so the opened flap and rising paper stay on screen.
  const shift = PixelRatio.roundToNearestPixel(H * 0.35);
  const left = PixelRatio.roundToNearestPixel((sw - W) / 2);
  const top = PixelRatio.roundToNearestPixel(sh / 2 + shift - H / 2);

  const cardW = Math.min(340, sw - 40);
  const cardH = useSharedValue(300);
  // Paper center (after lifting) relative to the screen center → where the big letter starts from.
  const paperCenterFromEnvTop = (PAPER.y + PAPER.h / 2 - PAPER.lift) * u;
  const dy0 = top + paperCenterFromEnvTop - sh / 2;

  const enter = useSharedValue(0);
  const opened = useSharedValue(0);
  const seal = useSharedValue(1);
  const flap = useSharedValue(0); // degrees 0 → 180
  const lift = useSharedValue(0);
  const drop = useSharedValue(0);
  const card = useSharedValue(0);
  const text = useSharedValue(0);
  const closing = useSharedValue(0);
  const busy = useRef(false);

  useEffect(() => {
    enter.value = withSpring(1, { damping: 12, stiffness: 140, mass: 0.9 });
  }, [enter]);

  const open = () => {
    if (busy.current) return;
    busy.current = true;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onOpened();
    opened.value = withTiming(1, { duration: 150 });
    seal.value = withTiming(0, { duration: 160 });
    flap.value = withDelay(120, withTiming(180, { duration: 500, easing: Easing.inOut(Easing.cubic) }));
    lift.value = withDelay(560, withTiming(1, { duration: 520, easing: Easing.out(Easing.back(1.5)) }));
    drop.value = withDelay(1150, withTiming(1, { duration: 420, easing: Easing.in(Easing.cubic) }));
    card.value = withDelay(1150, withTiming(1, { duration: 460, easing: Easing.out(Easing.cubic) }));
    text.value = withDelay(1500, withTiming(1, { duration: 320 }));
  };

  const close = () => {
    closing.value = withTiming(1, { duration: 220 }, (done) => {
      if (done) runOnJS(onClosed)();
    });
  };

  const envStyle = useAnimatedStyle(() => ({
    opacity: enter.value * (1 - drop.value),
    transform: [{ translateY: (1 - enter.value) * 90 + drop.value * H * 1.4 }],
  }));
  const hintStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, enter.value) * (1 - opened.value) }));
  // Two copies of the flap with identical rotation: in front of the paper until 90°, behind it after.
  const flapFrontStyle = useAnimatedStyle(() => ({
    opacity: flap.value <= 90 ? 1 : 0,
    transform: [{ perspective: 900 }, { rotateX: `${flap.value}deg` }],
  }));
  const flapBackStyle = useAnimatedStyle(() => ({
    opacity: flap.value > 90 ? 1 : 0,
    transform: [{ perspective: 900 }, { rotateX: `${flap.value}deg` }],
  }));
  const paperStyle = useAnimatedStyle(() => ({
    opacity: interpolate(card.value, [0, 0.25], [1, 0], 'clamp'),
    transform: [{ translateY: -lift.value * PAPER.lift * u }],
  }));
  const sealStyle = useAnimatedStyle(() => ({ opacity: seal.value, transform: [{ scale: 0.6 + 0.4 * seal.value }] }));
  const cardStyle = useAnimatedStyle(() => {
    const p = card.value;
    return {
      opacity: interpolate(p, [0, 0.12], [0, 1], 'clamp') * (1 - closing.value),
      transform: [
        { translateY: interpolate(p, [0, 1], [dy0, 0]) + closing.value * 24 },
        { scaleX: interpolate(p, [0, 1], [(PAPER.w * u) / cardW, 1]) },
        { scaleY: interpolate(p, [0, 1], [(PAPER.h * u) / Math.max(1, cardH.value), 1]) },
      ],
    };
  });
  const textStyle = useAnimatedStyle(() => ({ opacity: text.value }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.hint, { top: top - 76 }, hintStyle]} pointerEvents="none">
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.hintText}>
          편지가 도착했어요 · 눌러서 열어보기
        </Text>
      </Animated.View>

      <Animated.View style={[{ position: 'absolute', left, top, width: W, height: H }, envStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="편지봉투 열기"
          onPress={open}
          style={{ width: W, height: H }}
        >
          <Layer u={u}>
            <Rect x={0} y={0} width={VB_W} height={VB_H} fill={E.back} />
          </Layer>
          <Animated.View style={[StyleSheet.absoluteFill, styles.flapOrigin, flapBackStyle]} pointerEvents="none">
            <Layer u={u}>
              <Path d={FLAP_D} fill={E.flap} stroke={E.flap} strokeWidth={1} strokeLinejoin="round" />
            </Layer>
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.paper,
              { left: PAPER.x * u, top: PAPER.y * u, width: PAPER.w * u, height: PAPER.h * u, borderRadius: 6 * u, padding: 14 * u, gap: 7 * u },
              paperStyle,
            ]}
          >
            {[0.55, 0.85, 0.7, 0.8].map((w, i) => (
              <View key={i} style={{ height: Math.max(1, Math.round(2 * u)), width: `${w * 100}%`, backgroundColor: E.paperBorder, borderRadius: u }} />
            ))}
          </Animated.View>
          <Layer u={u}>
            <Path d={FRONT_D} fill={E.front} />
            <Path d={FRONT_LOW_D} fill={E.frontLow} />
          </Layer>
          <Animated.View style={[StyleSheet.absoluteFill, styles.flapOrigin, flapFrontStyle]} pointerEvents="none">
            <Layer u={u}>
              <Path d={FLAP_D} fill={E.flap} stroke={E.flap} strokeWidth={1} strokeLinejoin="round" />
            </Layer>
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[{ position: 'absolute', left: (TIP_X - SEAL_R) * u, top: (TIP_Y - SEAL_R) * u, width: SEAL_R * 2 * u, height: SEAL_R * 2 * u }, sealStyle]}
          >
            <Svg width={SEAL_R * 2 * u} height={SEAL_R * 2 * u} viewBox={`0 0 ${SEAL_R * 2} ${SEAL_R * 2}`}>
              <Circle cx={SEAL_R} cy={SEAL_R} r={SEAL_R} fill={E.seal} />
              <Circle cx={SEAL_R} cy={SEAL_R} r={SEAL_R - 4} fill="none" stroke={E.back} strokeOpacity={0.25} strokeWidth={1} />
            </Svg>
          </Animated.View>
        </Pressable>
      </Animated.View>

      <View style={styles.cardWrap} pointerEvents="box-none">
        <Animated.View
          onLayout={(e) => (cardH.value = e.nativeEvent.layout.height)}
          style={[styles.card, { width: cardW }, cardStyle]}
          pointerEvents="auto"
        >
          <Animated.View style={[{ gap: 14 }, textStyle]}>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.cardSub}>{letterHeader(entry)}</Text>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.cardText}>{entry.text}</Text>
            <Pressable accessibilityRole="button" onPress={close} style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.8 : 1 }]}>
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.closeText}>닫기</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 24 },
  hintText: { color: E.hint, fontFamily: fonts.medium, fontSize: type.small, textAlign: 'center' },
  flapOrigin: { transformOrigin: 'top' },
  paper: { position: 'absolute', backgroundColor: E.paper, borderWidth: 1, borderColor: E.paperBorder },
  cardWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: E.paper, borderColor: E.paperBorder, borderWidth: 1, borderRadius: 16, padding: 24 },
  cardSub: { color: E.paperSub, fontFamily: fonts.regular, fontSize: type.caption },
  cardText: { color: E.paperText, fontFamily: fonts.regular, fontSize: type.title, lineHeight: Math.round(type.title * 1.6) },
  closeBtn: { marginTop: 6, alignSelf: 'stretch', minHeight: 48, borderRadius: 999, backgroundColor: E.back, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: E.hint, fontFamily: fonts.medium, fontSize: type.body },
});
