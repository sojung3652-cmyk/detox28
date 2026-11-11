import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { MESSAGES, MessageKind } from '../data/notifications';
import { Letter, lastKeysFrom, loadOutbox, saveOutbox } from './letters';
import type { Persisted } from './persist';
import { dateKey } from './plan';
import { AlarmSpec, ScheduleInputs, assignTexts, buildAlarms, koHour, streakDrafts } from './schedule';

export const CHANNEL_ID = 'routine';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  // Android 13+ only shows the permission prompt once a channel exists.
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: '루틴 알림',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 150, 200],
    lightColor: '#E8A3B0',
  });
}

export async function requestNotificationPermission() {
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const res = await Notifications.requestPermissionsAsync();
  return res.granted;
}

export async function hasNotificationPermission() {
  return (await Notifications.getPermissionsAsync()).granted;
}

/** Android 12+: exact alarms. Without it alarms still fire, just possibly a few minutes late. */
export async function hasExactAlarmPermission() {
  if (Platform.OS !== 'android') return true;
  try {
    return (await Notifications.getExactAlarmPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

export async function requestExactAlarmPermission() {
  if (Platform.OS !== 'android') return true;
  try {
    // Opens the system "Alarms & reminders" screen.
    return (await Notifications.requestExactAlarmPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/** Inputs for the scheduler from saved state. */
export function scheduleInputs(st: Persisted): ScheduleInputs | null {
  if (!st.settings) return null;
  return {
    startDate: st.settings.startDate,
    fastStart: st.settings.fastStart,
    meals: st.settings.meals,
    overrides: st.fastOverrides,
    stopped: st.stoppedFasts,
    checks: st.checks,
    lastKeys: lastKeysFrom(st.inbox),
  };
}

/** Water alarms stay plain notifications: they are not kept as letters (no envelope popup, no inbox). */
const isLetter = (a: AlarmSpec) => a.kind !== 'water';

const toLetter = (a: AlarmSpec): Letter => ({ id: a.id, at: a.date.getTime(), kind: a.kind, key: a.key, text: a.text, special: a.special });

async function scheduleOne(a: AlarmSpec) {
  await Notifications.scheduleNotificationAsync({
    identifier: a.id,
    content: {
      title: a.title,
      body: a.body,
      categoryIdentifier: a.category,
      // messageKey + text let the app show exactly the text this notification carried.
      data: { id: a.id, at: a.date.getTime(), messageKey: a.key, kind: a.kind, text: a.text, special: a.special, day: a.day, meal: a.meal },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: a.date, channelId: CHANNEL_ID },
  });
}

/**
 * Cancel everything and schedule all upcoming alarms again (and rewrite the outbox to match).
 * Called after onboarding, any settings change, fast changes, imports, and once a day on open.
 * Delivery stays 'bestEffort' on purpose: with SCHEDULE_EXACT_ALARM granted, expo-notifications
 * already uses setExactAndAllowWhileIdle; 'alarmClock' would add a clock icon to the status bar.
 */
export async function rescheduleAll(st: Persisted) {
  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  const inp = scheduleInputs(st);
  if (!inp || !(await hasNotificationPermission())) {
    await saveOutbox([]);
    return 0;
  }
  const alarms = buildAlarms(inp, new Date());
  for (const a of alarms) await scheduleOne(a);
  await saveOutbox(alarms.filter(isLetter).map(toLetter));
  return alarms.length;
}

/** Cancels one pending alarm and drops it from the outbox (e.g. the 21:00 "no check" alarm once something is checked). */
export async function cancelAlarm(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  const ob = await loadOutbox();
  if (ob.some((l) => l.id === id)) await saveOutbox(ob.filter((l) => l.id !== id));
}

/** Re-evaluates the streak letters after checks change: schedules a reached milestone, cancels a lost one. */
export async function syncStreakAlarms(st: Persisted) {
  const inp = scheduleInputs(st);
  if (!inp) return;
  const now = new Date();
  const want = assignTexts(streakDrafts(inp, now), inp.lastKeys);
  const ob = await loadOutbox();
  const existing = ob.filter((l) => l.id.startsWith('streak-'));
  for (const l of existing) if (!want.some((w) => w.id === l.id)) await Notifications.cancelScheduledNotificationAsync(l.id).catch(() => {});
  const keep = ob.filter((l) => !l.id.startsWith('streak-'));
  const added: Letter[] = [];
  for (const w of want) {
    const same = existing.find((l) => l.id === w.id && l.at === w.date.getTime());
    if (same) {
      added.push(same);
      continue;
    }
    if (await hasNotificationPermission()) await scheduleOne(w);
    added.push(toLetter(w));
  }
  await saveOutbox([...keep, ...added]);
}

export async function cancelAll() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await saveOutbox([]);
}

export async function scheduledCount() {
  return (await Notifications.getAllScheduledNotificationsAsync()).length;
}

/**
 * Debug only: one alarm of every kind, 4 seconds apart starting in 5 seconds. They go through the
 * same outbox → inbox path, so each text and the envelope motion can be checked on a phone.
 * Returns the letters (the web preview has no notifications, so it injects them directly).
 */
export async function sendAllKindsPreview(st: Persisted): Promise<Letter[]> {
  const now = Date.now();
  const end = new Date(now + 24 * 3600000);
  const drafts = (Object.keys(MESSAGES) as MessageKind[]).map((kind, i) => ({
    id: `debug-${kind}`,
    date: new Date(now + 5000 + i * 4000),
    kind,
    day: dateKey(new Date(now)),
    vars: { 종료시간: koHour(end) },
    category: (['breakfast', 'lunch', 'dinnerNoCarb', 'dinnerNormal', 'week1Day4Lunch'].includes(kind) ? 'meal' : kind === 'water' ? 'water' : undefined) as AlarmSpec['category'],
  }));
  const specs = assignTexts(drafts, lastKeysFrom(st.inbox));
  if (Platform.OS !== 'web') {
    await ensureChannel();
    for (const a of specs) await scheduleOne(a);
    await saveOutbox([...(await loadOutbox()), ...specs.filter(isLetter).map(toLetter)]);
  }
  return specs.filter(isLetter).map(toLetter);
}
