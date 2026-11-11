// Builds the full list of local alarms for the program (pure, no native calls).
import { ALARM_TEXTS, DINNER_LABEL, FINISH_ALARM, PROGRAM_DAYS, WATER_ALARM_TIMES } from '../data/program';
import { SPECIAL_MESSAGES } from '../data/messages';
import {
  MealTimes,
  activeFasts,
  atTime,
  dateOfDay,
  dinnerTypeOf,
  fastAt,
  weekPlan,
} from './plan';

export type AlarmSpec = { id: string; date: Date; title: string; body: string };

type TextSet = { title: string[]; body: string[] };

function pick<T>(arr: T[], rand: () => number) {
  return arr[Math.floor(rand() * arr.length)];
}

function fill(s: string, vars: Record<string, string | number>) {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

export function buildAlarms(
  startKey: string,
  meals: MealTimes,
  stoppedFasts: string[],
  now: Date,
  rand: () => number = Math.random,
): AlarmSpec[] {
  const fasts = activeFasts(startKey, meals, stoppedFasts);
  const out: AlarmSpec[] = [];
  const add = (id: string, date: Date, set: TextSet, vars: Record<string, string | number> = {}) => {
    out.push({ id, date, title: fill(pick(set.title, rand), vars), body: fill(pick(set.body, rand), vars) });
  };
  // Meal alarms are skipped while fasting (spec: "단식 중에는 식사 알람 보내지 않기").
  const fasting = (d: Date) => !!fastAt(fasts, d);

  for (let day = 1; day <= PROGRAM_DAYS; day++) {
    const date = dateOfDay(startKey, day);
    const plan = weekPlan(day);
    const dinner = DINNER_LABEL[dinnerTypeOf(startKey, day)];
    const breakfastAt = atTime(date, meals.breakfast);

    // Special message / new week: always sent in the morning, even on a fasting morning.
    const msg = SPECIAL_MESSAGES[day];
    if (msg) {
      out.push({ id: `msg-${day}`, date: breakfastAt, title: msg.title, body: '오늘 화면에서 메시지를 확인해 보세요.' });
    }
    if (day > 1 && (day - 1) % 7 === 0) {
      add(`week-${day}`, new Date(breakfastAt.getTime() + 60000), ALARM_TEXTS.newWeek, {
        week: plan.week,
        theme: plan.theme,
      });
    }

    if (!fasting(breakfastAt)) add(`breakfast-${day}`, breakfastAt, ALARM_TEXTS.breakfast);
    const lunchAt = atTime(date, meals.lunch);
    if (!fasting(lunchAt)) add(`lunch-${day}`, lunchAt, ALARM_TEXTS.lunch);
    const dinnerAt = atTime(date, meals.dinner);
    if (!fasting(dinnerAt)) {
      const fastTonight = fasts.some((f) => f.day === day);
      add(`dinner-${day}`, dinnerAt, fastTonight ? ALARM_TEXTS.dinnerBeforeFast : ALARM_TEXTS.dinner, { dinner });
    }

    WATER_ALARM_TIMES.forEach((t, i) => {
      const at = atTime(date, t);
      add(`water-${day}-${i}`, at, fasting(at) ? ALARM_TEXTS.waterFasting : ALARM_TEXTS.water);
    });
  }

  for (const f of fasts) {
    add(`fast-start-${f.id}`, f.start, ALARM_TEXTS.fastStart);
    add(`fast-half-${f.id}`, new Date(f.start.getTime() + 12 * 3600000), ALARM_TEXTS.fastHalf);
    add(`fast-almost-${f.id}`, new Date(f.end.getTime() - 2 * 3600000), ALARM_TEXTS.fastAlmost);
    add(`fast-end-${f.id}`, f.end, ALARM_TEXTS.fastEnd);
  }

  // Last alarm: evening of day 28, after dinner. Nothing is scheduled past the program.
  const lastDay = dateOfDay(startKey, PROGRAM_DAYS);
  const finishAt = new Date(atTime(lastDay, meals.dinner).getTime() + 2 * 3600000);
  out.push({ id: 'finish', date: finishAt, title: FINISH_ALARM.title, body: FINISH_ALARM.body });

  return out.filter((a) => a.date > now).sort((a, b) => a.date.getTime() - b.date.getTime());
}
