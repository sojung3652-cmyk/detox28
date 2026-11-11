import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { loadState } from '../lib/persist';
import { RoutineWidget } from './RoutineWidget';
import { widgetSnapshot } from './snapshot';

/** Runs headlessly when Android asks the widget to draw (added, every 30 min, resized). */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetAction === 'WIDGET_DELETED') return;
  const s = await loadState();
  props.renderWidget(<RoutineWidget snap={widgetSnapshot(s, new Date())} />);
}
