import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { BodyLog, EMPTY, Persisted, Settings, loadState, normalize, saveState } from './persist';
import { dateKey } from './plan';
import { cancelAll, rescheduleAll, scheduledCount } from './notifications';
import { refreshWidget } from './widgetBridge';
import { ParsedAction, applyAction } from './actions';
import type { ThemePref } from '../theme';

export type { Settings, BodyLog, Persisted } from './persist';

/** Debug tools ("날짜 바꿔보기", 테스트 알림). __DEV__ is false in EAS APK builds, so they disappear there. */
export const SHOW_DEBUG = __DEV__;

type Ctx = Persisted & {
  loaded: boolean;
  offsetMs: number;
  saveSettings: (s: Settings) => Promise<void>;
  toggleCheck: (day: string, id: string) => void;
  setWater: (day: string, n: number) => void;
  setNote: (day: string, text: string) => void;
  setBody: (day: string, log: BodyLog) => void;
  setFastStart: (fastId: string, startMs: number | null) => Promise<void>;
  stopFast: (id: string) => Promise<void>;
  toggleShopping: (week: number, id: string) => void;
  recordAction: (a: ParsedAction) => void;
  markCelebrated: (n: number) => void;
  setTheme: (t: ThemePref) => void;
  setWeightUnit: (u: 'lb' | 'kg') => void;
  setDebugOffset: (days: number) => void;
  importState: (raw: unknown) => Promise<void>;
  resetAll: () => Promise<void>;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const update = useCallback((fn: (s: Persisted) => Persisted) => {
    const next = fn(stateRef.current);
    stateRef.current = next;
    setState(next);
    saveState(next)
      .then(() => refreshWidget())
      .catch(() => {});
  }, []);

  const reschedule = useCallback(
    async (s: Persisted) => {
      if (!s.settings) return;
      try {
        await rescheduleAll(s);
        update((p) => ({ ...p, lastScheduledOn: dateKey(new Date()) }));
      } catch (e) {
        console.warn('reschedule failed', e);
      }
    },
    [update],
  );

  useEffect(() => {
    loadState()
      .then(setState)
      .finally(() => setLoaded(true));
  }, []);

  // On every return to the foreground: pick up records written while the app was closed
  // (notification buttons, widget), and refresh alarms once a day so random texts rotate.
  useEffect(() => {
    if (!loaded) return;
    const onActive = async () => {
      const fresh = await loadState();
      stateRef.current = fresh;
      setState(fresh);
      if (!fresh.settings) return;
      const stale = fresh.lastScheduledOn !== dateKey(new Date());
      if (stale || (await scheduledCount().catch(() => 0)) === 0) reschedule(fresh);
    };
    onActive();
    const sub = AppState.addEventListener('change', (st) => st === 'active' && onActive());
    return () => sub.remove();
  }, [loaded, reschedule]);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      loaded,
      offsetMs: SHOW_DEBUG ? state.debugOffsetDays * 86400000 : 0,
      saveSettings: async (settings) => {
        const prev = stateRef.current;
        // A new start date is a new program: old per-fast changes no longer apply.
        const reset = prev.settings?.startDate !== settings.startDate;
        update((s) => ({
          ...s,
          settings,
          stoppedFasts: reset ? [] : s.stoppedFasts,
          fastOverrides: reset ? {} : s.fastOverrides,
        }));
        await reschedule(stateRef.current);
      },
      toggleCheck: (day, id) =>
        update((s) => {
          const cur = s.checks[day] ?? [];
          const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
          return { ...s, checks: { ...s.checks, [day]: next } };
        }),
      setWater: (day, n) => update((s) => ({ ...s, water: { ...s.water, [day]: Math.max(0, n) } })),
      setNote: (day, text) => update((s) => ({ ...s, notes: { ...s.notes, [day]: text } })),
      setBody: (day, log) => update((s) => ({ ...s, body: { ...s.body, [day]: { ...s.body[day], ...log } } })),
      setFastStart: async (fastId, startMs) => {
        update((s) => {
          const o = { ...s.fastOverrides };
          if (startMs == null) delete o[fastId];
          else o[fastId] = startMs;
          return { ...s, fastOverrides: o };
        });
        await reschedule(stateRef.current);
      },
      stopFast: async (id) => {
        update((s) => ({ ...s, stoppedFasts: [...s.stoppedFasts, id] }));
        await reschedule(stateRef.current);
      },
      toggleShopping: (week, id) =>
        update((s) => {
          const cur = s.shopping[week] ?? [];
          return { ...s, shopping: { ...s.shopping, [week]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] } };
        }),
      recordAction: (a) => update((s) => applyAction(s, a)),
      markCelebrated: (n) => update((s) => ({ ...s, celebrated: [...s.celebrated, n] })),
      setTheme: (theme) => update((s) => ({ ...s, theme })),
      setWeightUnit: (weightUnit) => update((s) => ({ ...s, weightUnit })),
      setDebugOffset: (days) => update((s) => ({ ...s, debugOffsetDays: days })),
      importState: async (raw) => {
        const next = normalize(raw);
        update(() => ({ ...next, lastScheduledOn: null }));
        await reschedule(stateRef.current);
      },
      resetAll: async () => {
        await cancelAll().catch(() => {});
        update(() => EMPTY);
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
