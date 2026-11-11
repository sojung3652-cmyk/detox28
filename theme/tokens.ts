import { PixelRatio } from 'react-native';

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, screen: 20 };

export const radius = { card: 16, inner: 12, pill: 999 };

/** Pretendard, two weights only. Family names match the keys passed to useFonts. */
export const fonts = { regular: 'Pretendard-Regular', medium: 'Pretendard-Medium' };

// Dev preview only: EXPO_PUBLIC_FONT_SCALE_PREVIEW=1.4 renders text at the max system font scale in a web
// preview, where Android's font-size setting can't be emulated. Unset in real builds, so this is 1.
const PREVIEW = Number(process.env.EXPO_PUBLIC_FONT_SCALE_PREVIEW ?? 1) || 1;
const sz = (n: number) => Math.round(n * PREVIEW);

export const type = {
  caption: sz(13),
  small: sz(15),
  body: sz(17),
  title: sz(20),
  h1: sz(30),
  display: sz(40),
};

/** Cap for system font scaling so very large settings grow text without breaking layouts. */
export const MAX_FONT_SCALE = 1.4;

/** Effective text scale (system setting, capped) — use to widen min sizes so side-by-side cards stack at large text. */
export function textScale() {
  return Math.min(PixelRatio.getFontScale(), MAX_FONT_SCALE) * PREVIEW;
}
