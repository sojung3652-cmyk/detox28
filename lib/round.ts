// Pause / resume / stop / repeat — pure state transitions on Persisted.
import { PROGRAM_DAYS } from '../data/program';
import type { Persisted, Round } from './persist';
import { addDays, dateKey, dateOfDay, parseDateKey, programDay, setPauses, startOfDay } from './plan';

export const REPEAT_OPTIONS: { months: number; label: string }[] = [
  { months: 0, label: '반복 안 함' },
  { months: 3, label: '3개월마다' },
  { months: 4, label: '4개월마다' },
  { months: 6, label: '6개월마다' },
  { months: 12, label: '매년' },
  { months: 24, label: '2년마다' },
];

export const repeatLabel = (months: number) => REPEAT_OPTIONS.find((o) => o.months === months)?.label ?? `${months}개월마다`;

/** Same day-of-month N months later (clamped: Jan 31 + 1 month → Feb 28/29). */
export function addMonths(d: Date, n: number) {
  const y = d.getFullYear();
  const m = d.getMonth() + n;
  const last = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(d.getDate(), last));
}

/**
 * Next round's start: the round's start date + N months, stepping on by N months until it is
 * after both the end of this round and today (a stopped or late round never gets a start in the past).
 */
export function nextRoundStart(startKey: string, months: number, roundEnd: Date, now: Date) {
  const floor = Math.max(startOfDay(roundEnd).getTime(), startOfDay(now).getTime());
  let k = 1;
  let d = addMonths(parseDateKey(startKey), months);
  while (d.getTime() <= floor) d = addMonths(parseDateKey(startKey), months * ++k);
  return d;
}

export function isPaused(s: Persisted) {
  return s.pauses.some((p) => !p.to);
}

export function pauseRound(s: Persisted, now: Date): Persisted {
  if (!s.settings || isPaused(s)) return s;
  return { ...s, pauses: [...s.pauses, { from: dateKey(now) }] };
}

/** Closes the open pause. Resuming on the same day it was paused leaves no pause behind. */
export function resumeRound(s: Persisted, now: Date): Persisted {
  const to = dateKey(now);
  const pauses = s.pauses.map((p) => (p.to ? p : { ...p, to })).filter((p) => p.from !== p.to);
  return { ...s, pauses };
}

/** Fields that belong to one round and start empty in the next. */
const freshRound = {
  checks: {},
  water: {},
  meals: {},
  notes: {},
  incidents: {},
  pauses: [],
  fastOverrides: {},
  stoppedFasts: [],
  shopping: {},
  celebrated: [],
  routineNoticeSeen: [],
  repeatAsked: false,
} satisfies Partial<Persisted>;

function toRound(s: Persisted, reason: Round['reason'], endDate: string): Round {
  return {
    startDate: s.settings!.startDate,
    endDate,
    reason,
    pauses: s.pauses.map((p) => (p.to ? p : { ...p, to: dateKey(addDays(parseDateKey(endDate), 1)) })),
    checks: s.checks,
    notes: s.notes,
    incidents: s.incidents,
    body: s.body,
    water: s.water,
    meals: s.meals,
  };
}

/**
 * Ends the current round and keeps its records in history.
 * With a repeat cycle set, the next round is scheduled right away; otherwise settings are cleared
 * (meals/fast time are kept in `lastSettings` so a new start can reuse them).
 */
export function endRound(s: Persisted, reason: Round['reason'], now: Date): Persisted {
  if (!s.settings) return s;
  setPauses(s.pauses);
  const end = reason === 'completed' ? dateOfDay(s.settings.startDate, PROGRAM_DAYS) : startOfDay(now);
  const round = toRound(s, reason, dateKey(end));
  const next = s.repeatMonths > 0 ? nextRoundStart(s.settings.startDate, s.repeatMonths, end, now) : null;
  const out: Persisted = {
    ...s,
    ...freshRound,
    history: [...s.history, round],
    lastSettings: s.settings,
    settings: next ? { ...s.settings, startDate: dateKey(next) } : null,
  };
  setPauses(out.pauses);
  return out;
}

/** A finished round with a repeat cycle rolls over to the next one (checked on every app open). */
export function shouldRollover(s: Persisted, now: Date) {
  return !!s.settings && s.repeatMonths > 0 && !isPaused(s) && programDay(s.settings.startDate, now) > PROGRAM_DAYS;
}

/**
 * Picks the repeat cycle. After a stop (no settings, last round in history) a cycle > 0
 * schedules the next round from the last round's start date.
 */
export function setRepeat(s: Persisted, months: number, now: Date): Persisted {
  const out: Persisted = { ...s, repeatMonths: months, repeatAsked: true };
  const last = s.history[s.history.length - 1];
  if (!s.settings && months > 0 && last && s.lastSettings) {
    const next = nextRoundStart(last.startDate, months, parseDateKey(last.endDate), now);
    out.settings = { ...s.lastSettings, startDate: dateKey(next) };
  }
  return out;
}

/** Start date of the round after the current one (for the settings line and the D-3 alarm). */
export function upcomingRoundStart(s: Pick<Persisted, 'settings' | 'repeatMonths'>, now: Date) {
  if (!s.settings || s.repeatMonths <= 0) return null;
  const end = dateOfDay(s.settings.startDate, PROGRAM_DAYS);
  return nextRoundStart(s.settings.startDate, s.repeatMonths, end, now);
}

/** Days in a past round with at least one check, and its number of 특이사항 entries. */
export function roundSummary(r: Round) {
  const checkedDays = Object.values(r.checks).filter((v) => v.length > 0).length;
  const incidents = Object.values(r.incidents).filter((v) => v.trim()).length;
  return { checkedDays, incidents };
}
