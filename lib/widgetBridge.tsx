import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { RoutineWidget } from '../widget/RoutineWidget';
import { widgetSnapshot } from '../widget/snapshot';
import { loadState } from './persist';

export const WIDGET_NAME = 'Routine';

/** Redraws the home-screen widget from saved state. Safe to call anywhere; no-op off Android. */
export async function refreshWidget() {
  if (Platform.OS !== 'android') return;
  try {
    const s = await loadState();
    await requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: () => <RoutineWidget snap={widgetSnapshot(s, new Date())} />,
    });
  } catch {
    // Widget not added, or module unavailable (e.g. Expo Go) — nothing to update.
  }
}
