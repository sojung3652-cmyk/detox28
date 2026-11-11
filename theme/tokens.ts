export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, screen: 20 };

export const radius = { card: 16, inner: 12, pill: 999 };

/** Pretendard, two weights only. Family names match the keys passed to useFonts. */
export const fonts = { regular: 'Pretendard-Regular', medium: 'Pretendard-Medium' };

export const type = {
  caption: 13,
  small: 15,
  body: 17,
  title: 20,
  h1: 30,
  display: 40,
};

/** Cap for system font scaling so very large settings grow text without breaking layouts. */
export const MAX_FONT_SCALE = 1.4;
