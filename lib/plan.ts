// Pure date/program logic shared by the UI and the notification scheduler,
// so what the screen shows and what the alarms say can never disagree.
import {
  DinnerType,
  FAST_HOURS,
  FAST_START_AFTER_DINNER_MIN,
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

/** 1-based program day for a date. Can be <1 (before start) or >28 (finished). */
export function programDay(startKey: string, date: Date) {
  const diff = startOfDay(date).getTime() - parseDateKey(startKey).getTime();
  // Math.round absorbs the ±1h of a DST transition.
  return Math.round(diff / DAY_MS) + 1;
}

export function dateOfDay(startKey: string, day: number) {
  return addDays(parseDateKey(startKey), day - 1);
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
  /** stable id = program day the fast starts (dinner day) */
  id: string;
  day: number;
  start: Date;
  end: Date;
};

/** All fasts in the 28-day program, in order. */
export function allFasts(startKey: string, meals: MealTimes): Fast[] {
  const out: Fast[] = [];
  // Stops at day 27: a fast starting on the last evening would run past day 28,
  // and the program (and all alarms) should end with day 28.
  for (let day = 1; day < PROGRAM_DAYS; day++) {
    const date = dateOfDay(startKey, day);
    if (!weekPlan(day).fastDays.includes(date.getDay() as Weekday)) continue;
    // Never back-to-back: at a week boundary (e.g. week 2 Wed → week 3 Thu when the program
    // starts on a Thursday) two fasts would chain into 48h. Skip the second one.
    if (out.length && out[out.length - 1].day === day - 1) continue;
    const start = new Date(atTime(date, meals.dinner).getTime() + FAST_START_AFTER_DINNER_MIN * 60000);
    const end = new Date(start.getTime() + FAST_HOURS * 3600000);
    out.push({ id: `d${day}`, day, start, end });
  }
  return out;
}

export function activeFasts(startKey: string, meals: MealTimes, stopped: string[]) {
  return allFasts(startKey, meals).filter((f) => !stopped.includes(f.id));
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
