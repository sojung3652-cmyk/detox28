import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { buildAlarms } from './schedule';
import type { Persisted } from './persist';

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

/**
 * Cancel everything and schedule all upcoming alarms again.
 * Called after onboarding, any settings change, stopping a fast, and once per app launch.
 * Delivery stays 'bestEffort' on purpose: with SCHEDULE_EXACT_ALARM granted, expo-notifications
 * already uses setExactAndAllowWhileIdle; 'alarmClock' would add a clock icon to the status bar.
 */
export async function rescheduleAll(st: Persisted) {
  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!st.settings || !(await hasNotificationPermission())) return 0;
  const alarms = buildAlarms(
    {
      startDate: st.settings.startDate,
      fastStart: st.settings.fastStart,
      meals: st.settings.meals,
      overrides: st.fastOverrides,
      stopped: st.stoppedFasts,
    },
    new Date(),
  );
  for (const a of alarms) {
    await Notifications.scheduleNotificationAsync({
      identifier: a.id,
      content: {
        title: a.title,
        body: a.body,
        categoryIdentifier: a.category,
        data: a.data ?? {},
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: a.date,
        channelId: CHANNEL_ID,
      },
    });
  }
  return alarms.length;
}

export async function cancelAll() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduledCount() {
  return (await Notifications.getAllScheduledNotificationsAsync()).length;
}

/** Debug only: fires a sample alarm in 5 seconds. */
export async function testAlarm() {
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    content: { title: '테스트 알림', body: '알림이 잘 와요.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: CHANNEL_ID },
  });
}
