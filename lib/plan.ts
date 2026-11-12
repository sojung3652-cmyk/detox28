// Pure date/program logic shared by the UI and the notification scheduler,
// so what the screen shows and what the alarms say can never disagree.
import {
  DinnerType,
  FAST_HOURS,
  PROGRAM_DAYS,
  SEASON_TIPS,
  WEEKS,
  WeekPlan,
  Weekday,
} from '../data/program';

export type MealTimes = { breakfast: string; lunch: string; dinner: string };

const DAY_MS = 24 * 60 * 60 * 1000;

export function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Local calendar date key, YYYY-MM-DD */
export function dateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDateKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes());
}

/** Date at HH:MM on the same calendar day (local time, DST-safe) */
export function atTime(day: Date, hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0);
}

export function formatTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** A pause covers calendar dates [from, to). `to` is missing while the pause is still going on. */
export type Pause = { from: string; to?: string };

// Pauses live in a module-level registry instead of being passed through every call:
// programDay/dateOfDay are used in ~40 places (UI, scheduler, widget, background handlers),
// and a pause must shift ALL of them the same way. The store sets this on every state change,
// and normalize() sets it on every load, so code outside React sees the same pauses.
let PAUSES: Pause[] = [];
export function setPauses(p: Pause[] | undefined) {
  PAUSES = (p ?? []).slice().sort((a, b) => a.from.localeCompare(b.from));
}
export function getPauses() {
  return PAUSES;
}

/** Calendar-day difference b - a (DST-safe). */
function daysBetween(a: Date, b: Date) {
  // Math.round absorbs the ±1h of a DST transition.
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
}

/** End (exclusive) of a pause; an ongoing pause covers through today. */
function pauseEnd(p: Pause) {
  return p.to ? parseDateKey(p.to) : addDays(startOfDay(new Date()), 1);
}

/** The open pause, if the program is paused right now. */
export function activePause() {
  return PAUSES.find((p) => !p.to);
}

/** True for calendar dates the program was (or is) paused on. */
export function isPausedDate(date: Date) {
  const t = startOfDay(date).getTime();
  return PAUSES.some((p) => t >= parseDateKey(p.from).getTime() && t < pauseEnd(p).getTime());
}

/**
 * 1-based program day for a date. Can be <1 (before start) or >28 (finished).
 * Paused dates don't count: a paused date reports the day that resumes after it.
 */
export function programDay(startKey: string, date: Date) {
  const start = parseDateKey(startKey);
  let skip = 0;
  for (const p of PAUSES) {
    const from = parseDateKey(p.from);
    const end = pauseEnd(p);
    if (startOfDay(date) >= end) skip += Math.max(0, daysBetween(from, end));
    else if (startOfDay(date) >= from) return daysBetween(start, from) + 1 - skip;
  }
  return daysBetween(start, date) + 1 - skip;
}

/** Calendar date of a program day, skipping paused dates. */
export function dateOfDay(startKey: string, day: number) {
  let d = addDays(parseDateKey(startKey), day - 1);
  for (const p of PAUSES) {
    const from = parseDateKey(p.from);
    if (d >= from) d = addDays(d, Math.max(0, daysBetween(from, pauseEnd(p))));
  }
  return d;
}

export function weekOfDay(day: number) {
  return Math.min(4, Math.max(1, Math.ceil(day / 7)));
}

export function weekPlan(day: number): WeekPlan {
  return WEEKS[weekOfDay(day) - 1];
}

export function dinnerTypeOf(startKey: string, day: number): DinnerType {
  const wd = dateOfDay(startKey, day).getDay() as Weekday;
  return weekPlan(day).lowCarbDinnerDays.includes(wd) ? 'lowcarb' : 'normal';
}

export type Fast = {
  /** stable id = program day the fast starts */
  id: string;
  day: number;
  start: Date;
  end: Date;
};

/** What fast scheduling needs from saved state. */
export type FastInputs = {
  startDate: string;
  fastStart: string; // default start time HH:MM
  overrides?: Record<string, number>; // fast id → start epoch ms (today-only change / start now)
  stopped?: string[];
};

/** All planned fasts in the 28-day program, in order (including stopped ones). */
export function allFasts({ startDate, fastStart, overrides = {} }: FastInputs): Fast[] {
  const out: Fast[] = [];
  // Stops at day 27: a fast starting on the last evening would run past day 28,
  // and the program (and all alarms) should end with day 28.
  for (let day = 1; day < PROGRAM_DAYS; day++) {
    const date = dateOfDay(startDate, day);
    if (!weekPlan(day).fastDays.includes(date.getDay() as Weekday)) continue;
    // Never back-to-back: at a week boundary (e.g. week 2 Wed → week 3 Thu when the program
    // starts on a Thursday) two fasts would chain into 48h. Skip the second one.
    if (out.length && out[out.length - 1].day === day - 1) continue;
    const id = 'd' + day;
    const start = overrides[id] != null ? new Date(overrides[id]) : atTime(date, fastStart);
    const end = new Date(start.getTime() + FAST_HOURS * 3600000);
    out.push({ id, day, start, end });
  }
  return out;
}

export function activeFasts(inp: FastInputs) {
  const stopped = inp.stopped ?? [];
  return allFasts(inp).filter((f) => !stopped.includes(f.id));
}

/** The fast planned for a program day (its start day), if any. */
export function fastOnDay(inp: FastInputs, day: number) {
  return activeFasts(inp).find((f) => f.day === day);
}

export function sameDay(a: Date, b: Date) {
  return dateKey(a) === dateKey(b);
}

export function fastAt(fasts: Fast[], t: Date) {
  return fasts.find((f) => t >= f.start && t < f.end);
}

export function nextFast(fasts: Fast[], t: Date) {
  return fasts.find((f) => f.start > t);
}

export function seasonTip(month1to12: number) {
  return SEASON_TIPS.find((s) => s.months.includes(month1to12))?.tip ?? '';
}

/** Deterministic pseudo-random from a string seed (stable per day, no storage needed). */
export function seededPick<T>(items: T[], seed: string, count: number): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

export function tipOfDay(day: number) {
  const tips = weekPlan(day).tips;
  return tips[(Math.max(1, day) - 1) % tips.length];
}

export function formatDateKo(d: Date) {
  const wd = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${wd})`;
}

/** The routine checklist for a program day (that day's week). */
export function routineOfDay(day: number) {
  return weekPlan(day).routine;
}

/** Checked items of a date counted against THAT date's week routine (ids from other weeks don't count). */
export function routineProgress(startKey: string, checks: Record<string, string[]>, dk: string) {
  const routine = routineOfDay(programDay(startKey, parseDateKey(dk)));
  const set = new Set(checks[dk] ?? []);
  const done = routine.filter((r) => set.has(r.id)).length;
  return { routine, done, total: routine.length, ratio: done / routine.length };
}

/** Items that are new this week compared with last week (for the week-change notice). */
export function addedRoutineItems(week: number) {
  if (week <= 1) return [];
  const prev = new Set(WEEKS[week - 2].routine.map((r) => r.id));
  return WEEKS[week - 1].routine.filter((r) => !prev.has(r.id));
}

/** Items in the previous week's routine that this week drops. */
export function removedRoutineItems(week: number) {
  if (week <= 1) return [];
  const cur = new Set(WEEKS[week - 1].routine.map((r) => r.id));
  return WEEKS[week - 2].routine.filter((r) => !cur.has(r.id));
}
