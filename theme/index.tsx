import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { Palette, dark, light } from './colors';

export * from './tokens';
export type { Palette } from './colors';
export { envelope } from './colors';

export type ThemePref = 'light' | 'dark' | 'system';

type ThemeCtx = { c: Palette; scheme: 'light' | 'dark' };
const Ctx = createContext<ThemeCtx>({ c: light, scheme: 'light' });

export function ThemeProvider({ pref, children }: { pref: ThemePref; children: React.ReactNode }) {
  const system = useColorScheme();
  const scheme = pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref;
  return <Ctx.Provider value={{ c: scheme === 'dark' ? dark : light, scheme }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}
