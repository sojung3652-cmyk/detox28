// Storage that works outside React too (notification action handlers, the home-screen widget),
// so every writer goes through load → change → save on the same key.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_FAST_START, DEFAULT_MEAL_TIMES } from '../data/program';
import type { ThemePref } from '../theme';
import type { InboxEntry } from './letters';
import { type MealTimes, type Pause, setPauses } from './plan';

// Same key as v1 so existing records carry over; missing fields are filled from EMPTY.
export const KEY = '@detox28/state/v1';

export type Settings = { startDate: string; meals: MealTimes; fastStart: string };
export type BodyLog = { weightLb?: number; condition?: 1 | 2 | 3 | 4 | 5; note?: string };

/** One finished (completed or stopped) detox round, kept for the record tab. */
export type Round = {
  startDate: string;
  endDate: string; // last calendar day of the round (dateKey)
  reason: 'completed' | 'stopped';
  pauses: Pause[];
  checks: Record<string, string[]>;
  notes: Record<string, string>;
  incidents: Record<string, string>;
  body: Record<string, BodyLog>;
  water: Record<string, number>;
  meals: Record<string, string[]>;
};

export type Persisted = {
  settings: Settings | null;
  theme: ThemePref;
  weightUnit: 'lb' | 'kg';
  checks: Record<string, string[]>; // dateKey → routine ids
  water: Record<string, number>; // dateKey → cups
  meals: Record<string, string[]>; // dateKey → meals marked eaten ('breakfast' | 'lunch' | 'dinner')
  notes: Record<string, string>; // dateKey → memo
  incidents: Record<string, string>; // dateKey → 특이사항 (ate something off-plan, skipped a fast, ...)
  pauses: Pause[]; // paused date ranges of the current round
  repeatMonths: number; // repeat the detox every N months (0 = no repeat)
  repeatAsked: boolean; // the "repeat?" question was answered for the current round
  history: Round[]; // past rounds, oldest first
  lastSettings: Settings | null; // meals / fast time of the last round, reused when starting again
  body: Record<string, BodyLog>; // dateKey → body log (weight always stored in lb)
  fastOverrides: Record<string, number>; // fast id → start epoch ms (today-only change / start now)
  stoppedFasts: string[];
  shopping: Record<string, string[]>; // week → checked shopping item ids
  celebrated: number[]; // streak milestones already celebrated
  inbox: InboxEntry[]; // letters (alarm texts) received so far, oldest first
  routineNoticeSeen: number[]; // weeks whose "new routine items" notice was dismissed
  debugOffsetDays: number;
  lastScheduledOn: string | null;
};

export const EMPTY: Persisted = {
  settings: null,
  theme: 'light',
  weightUnit: 'lb',
  checks: {},
  water: {},
  meals: {},
  notes: {},
  incidents: {},
  pauses: [],
  repeatMonths: 0,
  repeatAsked: false,
  history: [],
  lastSettings: null,
  body: {},
  fastOverrides: {},
  stoppedFasts: [],
  shopping: {},
  celebrated: [],
  inbox: [],
  routineNoticeSeen: [],
  debugOffsetDays: 0,
  lastScheduledOn: null,
};

export function normalize(raw: unknown): Persisted {
  const p = { ...EMPTY, ...(raw && typeof raw === 'object' ? (raw as Partial<Persisted>) : {}) };
  if (!Array.isArray(p.inbox)) p.inbox = [];
  if (!Array.isArray(p.pauses)) p.pauses = [];
  if (!Array.isArray(p.history)) p.history = [];
  setPauses(p.pauses); // every load path (app, widget, notification buttons) sees the same pauses
  if (p.settings) {
    p.settings = {
      startDate: p.settings.startDate,
      meals: { ...DEFAULT_MEAL_TIMES, ...p.settings.meals },
      fastStart: p.settings.fastStart ?? DEFAULT_FAST_START,
    };
  }
  return p;
}

export async function loadState(): Promise<Persisted> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? normalize(JSON.parse(raw)) : EMPTY;
  } catch {
    return EMPTY; // corrupt storage: start fresh rather than crash
  }
}

export async function saveState(s: Persisted) {
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
}

/** Read-modify-write for code running without the React tree (background handlers). */
export async function mutateState(fn: (s: Persisted) => Persisted) {
  const next = fn(await loadState());
  await saveState(next);
  return next;
}
