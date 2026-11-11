// Derived numbers shared by the record tab, the 28-day summary and the widget.
import { DAILY_ROUTINE, PROGRAM_DAYS } from '../data/program';
import type { Persisted } from './persist';
import { activeFasts, allFasts, dateKey, dateOfDay, programDay } from './plan';

export const STREAK_THRESHOLD = 0.8;
export const STREAK_MILESTONES = [7, 14, 21];
export const LB_PER_KG = 2.20462;

export function ratioOn(s: Persisted, dk: string) {
  return (s.checks[dk]?.length ?? 0) / DAILY_ROUTINE.length;
}

function fastInputs(s: Persisted) {
  const st = s.settings!;
  return { startDate: st.startDate, fastStart: st.fastStart, overrides: s.fastOverrides, stopped: s.stoppedFasts };
}

export function dayKeys(s: Persisted) {
  return Array.from({ length: PROGRAM_DAYS }, (_, i) => dateKey(dateOfDay(s.settings!.startDate, i + 1)));
}

/** Current streak of ≥80% days ending today (today counts only once it reaches 80%), and the longest one. */
export function streaks(s: Persisted, now: Date) {
  const keys = dayKeys(s);
  const today = Math.min(PROGRAM_DAYS, programDay(s.settings!.startDate, now));
  const good = keys.map((k) => ratioOn(s, k) >= STREAK_THRESHOLD);
  let longest = 0;
  let run = 0;
  for (let i = 0; i < Math.max(0, today); i++) {
    run = good[i] ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  let current = 0;
  let i = today - 1;
  if (i >= 0 && !good[i]) i--; // today still in progress
  for (; i >= 0 && good[i]; i--) current++;
  return { current, longest };
}

export function fastStats(s: Persisted, now: Date) {
  const planned = allFasts(fastInputs(s));
  const done = activeFasts(fastInputs(s)).filter((f) => f.end <= now);
  return { total: planned.length, done: done.length, doneDays: new Set(done.map((f) => f.day)) };
}

export function weightSeries(s: Persisted) {
  return dayKeys(s)
    .map((k, i) => ({ day: i + 1, lb: s.body[k]?.weightLb }))
    .filter((p): p is { day: number; lb: number } => typeof p.lb === 'number' && p.lb > 0);
}

export function toUnit(lb: number, unit: 'lb' | 'kg') {
  return unit === 'lb' ? lb : lb / LB_PER_KG;
}

export function fromUnit(v: number, unit: 'lb' | 'kg') {
  return unit === 'lb' ? v : v * LB_PER_KG;
}

export function fmtWeight(lb: number, unit: 'lb' | 'kg') {
  return `${toUnit(lb, unit).toFixed(1)} ${unit}`;
}
