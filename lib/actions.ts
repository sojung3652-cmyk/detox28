// "먹었어요" / "마셨어요" buttons on alarms.
//
// When the app is NOT in the foreground, expo-notifications runs the TaskManager task registered via
// Notifications.registerTaskAsync for custom action buttons (see ExpoHandlingDelegate.handleNotificationResponse),
// so the record is written headlessly without opening the app. In the foreground, the response listener in
// app/_layout.tsx applies the same change through the store instead (so in-memory state stays in sync).
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { ACTION_LABELS } from '../data/notifications';
import { mutateState } from './persist';
import { refreshWidget } from './widgetBridge';

export const ACTION_TASK = 'detox28-notification-action';
export { ACTION_ATE, ACTION_DRANK, parseAction, applyAction } from './actionLogic';
export type { ParsedAction } from './actionLogic';
import { ACTION_ATE, ACTION_DRANK, applyAction, parseAction } from './actionLogic';

export async function setupCategories() {
  if (Platform.OS === 'web') return;
  await Notifications.setNotificationCategoryAsync('meal', [
    { identifier: ACTION_ATE, buttonTitle: ACTION_LABELS.ate, options: { opensAppToForeground: false } },
  ]);
  await Notifications.setNotificationCategoryAsync('water', [
    { identifier: ACTION_DRANK, buttonTitle: ACTION_LABELS.drank, options: { opensAppToForeground: false } },
  ]);
}

// Must run at bundle load (index.js imports this module before expo-router), so the headless JS
// started for a button press finds the task.
if (Platform.OS !== 'web') {
  TaskManager.defineTask(ACTION_TASK, async ({ data, error }) => {
    if (error) return;
    const parsed = parseAction(data);
    if (!parsed) return;
    await mutateState((s) => applyAction(s, parsed));
    if (parsed.notificationId) await Notifications.dismissNotificationAsync(parsed.notificationId).catch(() => {});
    await refreshWidget().catch(() => {});
  });
}

export async function registerActionTask() {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.registerTaskAsync(ACTION_TASK);
  } catch (e) {
    console.warn('registerTaskAsync failed', e);
  }
}
