import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { MealTimes, dateKey } from './plan';
import { cancelAll, rescheduleAll, scheduledCount } from './notifications';

/** Debug tools ("날짜 바꿔보기", 테스트 알림). __DEV__ is false in EAS APK builds, so they disappear there. */
export const SHOW_DEBUG = __DEV__;

const KEY = '@detox28/state/v1';

export type Settings = { startDate: string; meals: MealTimes };

type Persisted = {
  settings: Settings | null;
  checks: Record<string, string[]>;
  water: Record<string, number>;
  stoppedFasts: string[];
  debugOffsetDays: number;
  lastScheduledOn: string | null;
};

const EMPTY: Persisted = {
  settings: null,
  checks: {},
  water: {},
  stoppedFasts: [],
  debugOffsetDays: 0,
  lastScheduledOn: null,
};

type Ctx = Persisted & {
  loaded: boolean;
  offsetMs: number;
  saveSettings: (s: Settings) => Promise<void>;
  toggleCheck: (day: string, id: string) => void;
  setWater: (day: string, n: number) => void;
  stopFast: (id: string) => Promise<void>;
  setDebugOffset: (days: number) => void;
  resetAll: () => Promise<void>;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const update = useCallback((fn: (s: Persisted) => Persisted) => {
    setState((prev) => {
      const next = fn(prev);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const reschedule = useCallback(
    async (settings: Settings, stopped: string[]) => {
      try {
        await rescheduleAll(settings.startDate, settings.meals, stopped);
        update((s) => ({ ...s, lastScheduledOn: dateKey(new Date()) }));
      } catch (e) {
        console.warn('reschedule failed', e);
      }
    },
    [update],
  );

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          setState({ ...EMPTY, ...JSON.parse(raw) });
        } catch {
          // corrupt storage: start fresh rather than crash
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  // Refresh alarms once a day when the app is opened, so the random texts rotate
  // and anything the OS dropped gets put back.
  useEffect(() => {
    if (!loaded) return;
    const check = async () => {
      const s = stateRef.current;
      if (!s.settings) return;
      const stale = s.lastScheduledOn !== dateKey(new Date());
      if (stale || (await scheduledCount().catch(() => 0)) === 0) {
        reschedule(s.settings, s.stoppedFasts);
      }
    };
    check();
    const sub = AppState.addEventListener('change', (st) => st === 'active' && check());
    return () => sub.remove();
  }, [loaded, reschedule]);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      loaded,
      offsetMs: SHOW_DEBUG ? state.debugOffsetDays * 86400000 : 0,
      saveSettings: async (settings) => {
        const startChanged = stateRef.current.settings?.startDate !== settings.startDate;
        // A new start date means a new program: old stopped-fast ids no longer apply.
        const stopped = startChanged ? [] : stateRef.current.stoppedFasts;
        update((s) => ({ ...s, settings, stoppedFasts: stopped }));
        await reschedule(settings, stopped);
      },
      toggleCheck: (day, id) =>
        update((s) => {
          const cur = s.checks[day] ?? [];
          const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
          return { ...s, checks: { ...s.checks, [day]: next } };
        }),
      setWater: (day, n) => update((s) => ({ ...s, water: { ...s.water, [day]: Math.max(0, n) } })),
      stopFast: async (id) => {
        const stopped = [...stateRef.current.stoppedFasts, id];
        update((s) => ({ ...s, stoppedFasts: stopped }));
        if (stateRef.current.settings) await reschedule(stateRef.current.settings, stopped);
      },
      setDebugOffset: (days) => update((s) => ({ ...s, debugOffsetDays: days })),
      resetAll: async () => {
        await cancelAll().catch(() => {});
        await AsyncStorage.removeItem(KEY);
        setState(EMPTY);
      },
    }),
    [state, loaded, update, reschedule],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp outside AppProvider');
  return ctx;
}

/** Current time (shifted by the debug offset in dev), re-rendering every `everyMs`. */
export function useNow(everyMs = 60000) {
  const { offsetMs } = useApp();
  const [t, setT] = useState(() => Date.now());
  useEffect(() => {
    setT(Date.now());
    const id = setInterval(() => setT(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return new Date(t + offsetMs);
}
