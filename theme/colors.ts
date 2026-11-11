/** Light and dark palettes share the same keys, so screens only ever reference keys. */
export type Palette = {
  bg: string;
  card: string;
  text: string;
  sub: string;
  faint: string;
  line: string;
  lineSoft: string;
  accent: string; // progress ring, checks, active tab, selected button
  onAccent: string; // text/icons drawn on top of accent
  ringTrack: string;
  badgeBg: string;
  badgeText: string;
  goalBg: string; // "이번 주 목표" card
  goalText: string;
  goalLabel: string;
  inset: string; // subtle fill inside cards (water cups, inputs)
};

export const light: Palette = {
  bg: '#F7F3EB',
  card: '#FFFFFF',
  text: '#1F2A3A',
  sub: '#6E7A8C',
  faint: '#9AA3B0',
  line: '#E6DED0',
  lineSoft: '#D9D0C0',
  accent: '#1F2A3A',
  onAccent: '#F3EEE4',
  ringTrack: '#E6DED0',
  badgeBg: '#EFE8DB',
  badgeText: '#5A4E3A',
  goalBg: '#1F2A3A',
  goalText: '#F3EEE4',
  goalLabel: '#C9B68E',
  inset: '#F7F3EB',
};

export const dark: Palette = {
  bg: '#1F2A3A',
  card: '#283548',
  text: '#F3EEE4',
  sub: '#9FB0C6',
  faint: '#7D8CA3',
  line: '#34435A',
  lineSoft: '#34435A',
  accent: '#E8D5B0',
  onAccent: '#1F2A3A',
  ringTrack: '#2F3D52',
  badgeBg: '#2F3D52',
  badgeText: '#E8D5B0',
  // Spec gives no dark value for the goal card; navy-on-navy would vanish, so it uses the
  // lightest dark surface to stand apart by background alone (no shadows).
  goalBg: '#34435A',
  goalText: '#F3EEE4',
  goalLabel: '#E8D5B0',
  inset: '#2F3D52',
};
