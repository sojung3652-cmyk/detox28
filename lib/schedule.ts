// Builds the full list of local alarms for the program (pure, no native calls).
import { ALARMS, AlarmText } from '../data/notifications';
import { DINNER_LABEL, PROGRAM_DAYS, WATER_ALARM_TIMES } from '../data/program';
import { FastInputs, MealTimes, activeFasts, atTime, dateKey, dateOfDay, dinnerTypeOf, fastAt, weekPlan } from './plan';

export type AlarmCategory = 'meal' | 'water';

export type AlarmSpec = {
  id: string;
  date: Date;
  title: string;
  body: string;
  /** Enables the "먹었어요"/"마셨어요" buttons; data tells the handler what to record. */
  category?: AlarmCategory;
  data?: { kind: 'meal' | 'water'; day: string; meal?: 'breakfast' | 'lunch' | 'dinner' };
};

export type ScheduleInputs = FastInputs & { meals: MealTimes };

function fill(s: string, vars: Record<string, string | number>) {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

export function buildAlarms(inp: ScheduleInputs, now: Date, rand: () => number = Math.random): AlarmSpec[] {
  const fasts = activeFasts(inp);
  const out: AlarmSpec[] = [];
  const add = (id: string, date: Date, t: AlarmText, vars: Record<string, string | number> = {}, extra: Partial<AlarmSpec> = {}) => {
    const body = t.body[Math.floor(rand() * t.body.length)];
    out.push({ id, date, title: fill(t.title, vars), body: fill(body, vars), ...extra });
  };
  // Meal alarms are skipped while fasting.
  const fasting = (d: Date) => !!fastAt(fasts, d);

  for (let day = 1; day <= PROGRAM_DAYS; day++) {
    const date = dateOfDay(inp.startDate, day);
    const dk = dateKey(date);
    const plan = weekPlan(day);
    const dinner = DINNER_LABEL[dinnerTypeOf(inp.startDate, day)];
    const mealExtra = (meal: 'breakfast' | 'lunch' | 'dinner') => ({ category: 'meal' as const, data: { kind: 'meal' as const, day: dk, meal } });

    const breakfastAt = atTime(date, inp.meals.breakfast);
    // New week: sent in the morning even on a fasting morning.
    if (day > 1 && (day - 1) % 7 === 0) {
      add(`week-${day}`, new Date(breakfastAt.getTime() + 60000), ALARMS.newWeek, { week: plan.week, title: plan.title, goal: plan.goal });
    }
    if (!fasting(breakfastAt)) add(`breakfast-${day}`, breakfastAt, ALARMS.breakfast, {}, mealExtra('breakfast'));
    const lunchAt = atTime(date, inp.meals.lunch);
    if (!fasting(lunchAt)) add(`lunch-${day}`, lunchAt, ALARMS.lunch, {}, mealExtra('lunch'));
    const dinnerAt = atTime(date, inp.meals.dinner);
    if (!fasting(dinnerAt)) {
      const fastTonight = fasts.some((f) => f.day === day && f.start > dinnerAt);
      add(`dinner-${day}`, dinnerAt, fastTonight ? ALARMS.dinnerBeforeFast : ALARMS.dinner, { dinner }, mealExtra('dinner'));
    }

    WATER_ALARM_TIMES.forEach((t, i) => {
      const at = atTime(date, t);
      add(`water-${day}-${i}`, at, fasting(at) ? ALARMS.waterFasting : ALARMS.water, {}, {
        category: 'water',
        data: { kind: 'water', day: dk },
      });
    });
  }

  for (const f of fasts) {
    add(`fast-start-${f.id}`, f.start, ALARMS.fastStart);
    add(`fast-half-${f.id}`, new Date(f.start.getTime() + 12 * 3600000), ALARMS.fastHalf);
    add(`fast-almost-${f.id}`, new Date(f.end.getTime() - 2 * 3600000), ALARMS.fastAlmost);
    add(`fast-end-${f.id}`, f.end, ALARMS.fastEnd);
  }

  // Last alarm: evening of day 28. Nothing is scheduled past the program.
  const lastDay = dateOfDay(inp.startDate, PROGRAM_DAYS);
  add('finish', new Date(atTime(lastDay, inp.meals.dinner).getTime() + 2 * 3600000), ALARMS.finish);

  return out.filter((a) => a.date > now).sort((a, b) => a.date.getTime() - b.date.getTime());
}
