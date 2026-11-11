// Builds the full list of local alarms for the program (pure, no native calls).
import { MESSAGES, MessageKind, SPECIAL, SPECIAL_NOTICE, TITLES } from '../data/notifications';
import { PROGRAM_DAYS, WATER_ALARM_TIMES } from '../data/program';
import { FastInputs, MealTimes, activeFasts, addDays, atTime, dateKey, dateOfDay, dinnerTypeOf, fastAt, programDay, routineProgress } from './plan';

export const NO_CHECK_TIME = '21:00';
export const FAST_EVE_TIME = '21:00';
export const STREAK_MILESTONES = [7, 14, 21] as const;
const STREAK_THRESHOLD = 0.8;
/** Letters arrive one minute after the breakfast alarm so they show as a separate notification. */
const LETTER_DELAY_MS = 60000;

export type AlarmCategory = 'meal' | 'water';

export type AlarmSpec = {
  id: string;
  date: Date;
  kind: MessageKind;
  /** `${kind}.${index}` — which text was used (stored in notification data and the inbox). */
  key: string;
  text: string;
  special: boolean;
  title: string;
  body: string;
  category?: AlarmCategory;
  meal?: 'breakfast' | 'lunch' | 'dinner';
  day: string; // dateKey of the alarm
};

export type ScheduleInputs = FastInputs & {
  meals: MealTimes;
  checks: Record<string, string[]>;
  /** Last message key sent per kind (from the inbox), so the first new pick avoids repeating it. */
  lastKeys?: Partial<Record<MessageKind, string>>;
};

type Draft = Omit<AlarmSpec, 'key' | 'text' | 'title' | 'body' | 'special'> & { vars?: Record<string, string> };

/** "오후 8시" / "오후 8시 30분" / "오전 12시" */
export function koHour(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h < 12 ? '오전' : '오후'} ${h12}시${m ? ` ${m}분` : ''}`;
}

function fill(s: string, vars: Record<string, string> = {}) {
  return s.replace(/\{([^}]+)\}/g, (all, k) => vars[k] ?? all);
}

// 80% of THAT day's week routine.
const good = (inp: { startDate: string; checks: Record<string, string[]> }, d: Date) =>
  routineProgress(inp.startDate, inp.checks, dateKey(d)).ratio >= STREAK_THRESHOLD;

/** Length of the run of ≥80% days ending on (and including) `end`, within the program. */
function runEndingOn(inp: ScheduleInputs, end: Date) {
  let n = 0;
  for (let d = end; programDay(inp.startDate, d) >= 1 && good(inp, d); d = addDays(d, -1)) n++;
  return n;
}

/**
 * Streak letters go out with the breakfast alarm the morning after the streak is reached:
 *  - today already ≥80% and the run through today hits 7/14/21 → tomorrow's breakfast
 *  - the run through yesterday hit 7/14/21 → today's breakfast (if still ahead)
 */
export function streakDrafts(inp: ScheduleInputs, now: Date): Draft[] {
  const out: Draft[] = [];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const consider = (achievedOn: Date) => {
    const run = runEndingOn(inp, achievedOn);
    if (!(STREAK_MILESTONES as readonly number[]).includes(run)) return;
    const sendDay = addDays(achievedOn, 1);
    const pd = programDay(inp.startDate, sendDay);
    if (pd < 1 || pd > PROGRAM_DAYS) return;
    const at = new Date(atTime(sendDay, inp.meals.breakfast).getTime() + LETTER_DELAY_MS);
    out.push({ id: `streak-${run}`, date: at, kind: `streak${run}` as MessageKind, day: dateKey(sendDay) });
  };
  if (good(inp, today)) consider(today);
  consider(addDays(today, -1));
  return out.filter((d) => d.date > now);
}

/** Assigns texts in send order: random, never the same text twice in a row for a kind. */
export function assignTexts(drafts: Draft[], lastKeys: Partial<Record<MessageKind, string>> = {}, rand: () => number = Math.random): AlarmSpec[] {
  const last = { ...lastKeys };
  return [...drafts]
    .sort((a, b) => a.date.getTime() - b.date.getTime() || a.id.localeCompare(b.id))
    .map((d) => {
      const list = MESSAGES[d.kind];
      const prev = last[d.kind] ? Number(last[d.kind]!.split('.')[1]) : -1;
      let i = Math.floor(rand() * list.length);
      if (list.length > 1 && i === prev) i = (i + 1 + Math.floor(rand() * (list.length - 1))) % list.length;
      const key = `${d.kind}.${i}`;
      last[d.kind] = key;
      const text = fill(list[i], d.vars);
      const special = SPECIAL.includes(d.kind);
      const { vars, ...rest } = d;
      return {
        ...rest,
        key,
        text,
        special,
        title: special ? SPECIAL_NOTICE.title : TITLES[d.kind],
        body: special ? SPECIAL_NOTICE.body : text,
      };
    });
}

export function buildAlarms(inp: ScheduleInputs, now: Date, rand: () => number = Math.random): AlarmSpec[] {
  const fasts = activeFasts(inp);
  const drafts: Draft[] = [];
  const fasting = (d: Date) => !!fastAt(fasts, d); // no meal alarms while fasting

  for (let day = 1; day <= PROGRAM_DAYS; day++) {
    const date = dateOfDay(inp.startDate, day);
    const dk = dateKey(date);
    const breakfastAt = atTime(date, inp.meals.breakfast);
    const letterAt = new Date(breakfastAt.getTime() + LETTER_DELAY_MS);

    // Special-day letters: sent even on a fasting morning.
    if (day === 1) drafts.push({ id: 'letter-day1', date: letterAt, kind: 'day1', day: dk });
    if (day === 8) drafts.push({ id: 'letter-week2', date: letterAt, kind: 'week2Start', day: dk });
    if (day === 15) drafts.push({ id: 'letter-week3', date: letterAt, kind: 'week3Start', day: dk });
    if (day === 22) drafts.push({ id: 'letter-week4', date: letterAt, kind: 'week4Start', day: dk });
    if (day === PROGRAM_DAYS) drafts.push({ id: 'letter-complete', date: letterAt, kind: 'complete', day: dk });

    if (!fasting(breakfastAt)) drafts.push({ id: `breakfast-${day}`, date: breakfastAt, kind: 'breakfast', category: 'meal', meal: 'breakfast', day: dk });
    const lunchAt = atTime(date, inp.meals.lunch);
    if (!fasting(lunchAt)) {
      // Week 1, day 4: rice at lunch starts today.
      drafts.push({ id: `lunch-${day}`, date: lunchAt, kind: day === 4 ? 'week1Day4Lunch' : 'lunch', category: 'meal', meal: 'lunch', day: dk });
    }
    const dinnerAt = atTime(date, inp.meals.dinner);
    if (!fasting(dinnerAt)) {
      const kind = dinnerTypeOf(inp.startDate, day) === 'lowcarb' ? 'dinnerNoCarb' : 'dinnerNormal';
      drafts.push({ id: `dinner-${day}`, date: dinnerAt, kind, category: 'meal', meal: 'dinner', day: dk });
    }
    WATER_ALARM_TIMES.forEach((t, i) => {
      drafts.push({ id: `water-${day}-${i}`, date: atTime(date, t), kind: 'water', category: 'water', day: dk });
    });
    // "Did you forget?" at 21:00 — only for days with no checks yet; checking cancels it (see store).
    if (!(inp.checks[dk]?.length)) drafts.push({ id: `nocheck-${day}`, date: atTime(date, NO_CHECK_TIME), kind: 'noCheckToday', day: dk });
  }

  for (const f of fasts) {
    const eve = addDays(f.start, -1);
    drafts.push({ id: `fast-eve-${f.id}`, date: atTime(eve, FAST_EVE_TIME), kind: 'fastTomorrow', day: dateKey(eve) });
    const vars = { 종료시간: koHour(f.end) };
    drafts.push({ id: `fast-start-${f.id}`, date: f.start, kind: 'fastStart', day: dateKey(f.start), vars });
    drafts.push({ id: `fast-end-${f.id}`, date: f.end, kind: 'fastEnd', day: dateKey(f.end) });
  }

  drafts.push(...streakDrafts(inp, now));

  return assignTexts(drafts.filter((d) => d.date > now), inp.lastKeys, rand);
}

/**
 * Special-day letters whose send time has already passed (day1, week starts, complete, streaks).
 * Used to deliver letters that were never scheduled (e.g. onboarding finished after breakfast on day 1)
 * or never fired (phone off, alarm dropped). The caller skips ones already in the inbox.
 */
export function dueSpecialLetters(inp: ScheduleInputs, now: Date): AlarmSpec[] {
  const drafts: Draft[] = [];
  const at = (day: number) => new Date(atTime(dateOfDay(inp.startDate, day), inp.meals.breakfast).getTime() + LETTER_DELAY_MS);
  const fixed: [number, MessageKind, string][] = [
    [1, 'day1', 'letter-day1'],
    [8, 'week2Start', 'letter-week2'],
    [15, 'week3Start', 'letter-week3'],
    [22, 'week4Start', 'letter-week4'],
    [PROGRAM_DAYS, 'complete', 'letter-complete'],
  ];
  for (const [day, kind, id] of fixed) drafts.push({ id, date: at(day), kind, day: dateKey(dateOfDay(inp.startDate, day)) });
  // Streak milestones reached on day D → letter on D+1.
  for (let day = 1; day < PROGRAM_DAYS; day++) {
    const run = runEndingOn(inp, dateOfDay(inp.startDate, day));
    if ((STREAK_MILESTONES as readonly number[]).includes(run)) {
      drafts.push({ id: `streak-${run}`, date: at(day + 1), kind: `streak${run}` as MessageKind, day: dateKey(dateOfDay(inp.startDate, day + 1)) });
    }
  }
  return assignTexts(drafts.filter((d) => d.date <= now));
}
