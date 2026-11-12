import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { BodyLog, EMPTY, Persisted, Settings, loadState, normalize, saveState } from './persist';
import { dateKey, parseDateKey, programDay, setPauses } from './plan';
import { endRound, pauseRound, resumeRound, setRepeat, shouldRollover } from './round';
import { cancelAlarm, cancelAll, rescheduleAll, scheduleInputs, scheduledCount, sendAllKindsPreview, syncStreakAlarms } from './notifications';
import { InboxEntry, Letter, addMissing, letterRef, loadOutbox, moveDue, saveOutbox } from './letters';
import { dueSpecialLetters } from './schedule';
import { refreshWidget } from './widgetBridge';
import { ParsedAction, applyAction } from './actions';
import type { ThemePref } from '../theme';

export type { Settings, BodyLog, Persisted } from './persist';

/** Debug tools ("날짜 바꿔보기", 모든 알람 미리 보내기). __DEV__ is false in EAS APK builds, so they disappear there. */
export const SHOW_DEBUG = __DEV__;

type Ctx = Persisted & {
  loaded: boolean;
  offsetMs: number;
  saveSettings: (s: Settings) => Promise<void>;
  toggleCheck: (day: string, id: string) => void;
  setWater: (day: string, n: number) => void;
  setNote: (day: string, text: string) => void;
  setIncident: (day: string, text: string) => void;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  /** Ends the round early; records move to history. */
  stopRound: () => Promise<void>;
  chooseRepeat: (months: number) => Promise<void>;
  setBody: (day: string, log: BodyLog) => void;
  setFastStart: (fastId: string, startMs: number | null) => Promise<void>;
  stopFast: (id: string) => Promise<void>;
  toggleShopping: (week: number, id: string) => void;
  recordAction: (a: ParsedAction) => void;
  /** Moves letters whose time has passed from the outbox into the inbox. */
  syncInbox: () => Promise<void>;
  markLetters: (refs: string[], patch: Partial<Pick<InboxEntry, 'opened' | 'popped'>>) => void;
  previewAllKinds: () => Promise<void>;
  markCelebrated: (n: number) => void;
  dismissRoutineNotice: (week: number) => void;
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
    setPauses(next.pauses);
    stateRef.current = next;
    setState(next);
    saveState(next)
      .then(() => refreshWidget())
      .catch(() => {});
  }, []);

  const syncInbox = useCallback(async () => {
    const now = Date.now(); // real time, not the debug offset
    const ob = await loadOutbox();
    const r = moveDue(stateRef.current.inbox, ob, now);
    // Special-day letters whose time passed but never arrived (never scheduled, phone off, alarm dropped).
    const inp = scheduleInputs(stateRef.current);
    const missed = inp ? dueSpecialLetters(inp, new Date(now)).map((a) => ({ id: a.id, at: a.date.getTime(), kind: a.kind, key: a.key, text: a.text, special: a.special })) : [];
    const m = addMissing(r.inbox, missed);
    if (r.added || m.added) update((p) => ({ ...p, inbox: addMissing(moveDue(p.inbox, ob, now).inbox, missed).inbox }));
    if (r.outbox.length !== ob.length) await saveOutbox(r.outbox);
  }, [update]);

  const reschedule = useCallback(
    async (s: Persisted) => {
      if (!s.settings) return;
      try {
        await syncInbox(); // due letters must reach the inbox before the outbox is rewritten
        await rescheduleAll({ ...s, inbox: stateRef.current.inbox });
        update((p) => ({ ...p, lastScheduledOn: dateKey(new Date()) }));
      } catch (e) {
        console.warn('reschedule failed', e);
      }
    },
    [update, syncInbox],
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
      await syncInbox();
      if (!fresh.settings) return;
      // A finished round with a repeat cycle moves on to the next round (records go to history).
      if (shouldRollover(fresh, new Date())) {
        update((p) => endRound(p, 'completed', new Date()));
        await reschedule(stateRef.current);
        return;
      }
      const stale = fresh.lastScheduledOn !== dateKey(new Date());
      if (stale || (await scheduledCount().catch(() => 0)) === 0) reschedule(fresh);
    };
    onActive();
    const sub = AppState.addEventListener('change', (st) => st === 'active' && onActive());
    return () => sub.remove();
  }, [loaded, reschedule, syncInbox]);

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
      toggleCheck: (day, id) => {
        const before = stateRef.current.checks[day]?.length ?? 0;
        update((s) => {
          const cur = s.checks[day] ?? [];
          const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
          return { ...s, checks: { ...s.checks, [day]: next } };
        });
        const st = stateRef.current;
        if (!st.settings) return;
        // First check of the day cancels that day's 21:00 "did you forget?" alarm.
        if (before === 0 && (st.checks[day]?.length ?? 0) > 0) {
          cancelAlarm('nocheck-' + programDay(st.settings.startDate, parseDateKey(day))).catch(() => {});
        }
        // A reached (or lost) 7/14/21 streak schedules (or cancels) next morning's letter.
        syncStreakAlarms(st).catch(() => {});
      },
      setWater: (day, n) => update((s) => ({ ...s, water: { ...s.water, [day]: Math.max(0, n) } })),
      setNote: (day, text) => update((s) => ({ ...s, notes: { ...s.notes, [day]: text } })),
      setIncident: (day, text) => update((s) => ({ ...s, incidents: { ...s.incidents, [day]: text } })),
      pause: async () => {
        update((s) => pauseRound(s, new Date()));
        await reschedule(stateRef.current); // paused → every alarm is cancelled
      },
      resume: async () => {
        update((s) => resumeRound(s, new Date()));
        await reschedule(stateRef.current);
      },
      stopRound: async () => {
        update((s) => endRound({ ...s, repeatMonths: 0 }, 'stopped', new Date()));
        await cancelAll().catch(() => {});
        await saveOutbox([]);
      },
      chooseRepeat: async (months) => {
        const now = new Date();
        // No rollover here: on the completion screen the finished round must stay visible.
        // The next app open rolls it over; the next round's D-3 alarm is scheduled right now.
        update((s) => setRepeat(s, months, now));
        await reschedule(stateRef.current);
      },
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
      syncInbox,
      markLetters: (refs, patch) =>
        update((s) => ({ ...s, inbox: s.inbox.map((e) => (refs.includes(letterRef(e)) ? { ...e, ...patch } : e)) })),
      previewAllKinds: async () => {
        const letters: Letter[] = await sendAllKindsPreview(stateRef.current);
        // Web preview has no notifications: deliver straight to the inbox so the envelopes can be checked.
        if (Platform.OS === 'web') update((s) => ({ ...s, inbox: moveDue(s.inbox, letters.map((l) => ({ ...l, at: Date.now() })), Date.now()).inbox }));
      },
      dismissRoutineNotice: (week) => update((s) => ({ ...s, routineNoticeSeen: [...s.routineNoticeSeen, week] })),
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
    [state, loaded, update, reschedule, syncInbox],
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
