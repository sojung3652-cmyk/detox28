import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { dateKey, formatTime, parseDateKey } from './plan';

// The app targets Android only. The web branch exists so screens can be previewed in a browser during development.
export function pickDate(current: string | null, onPick: (key: string) => void) {
  if (Platform.OS === 'web') {
    const v = window.prompt('시작 날짜 (YYYY-MM-DD)', current ?? dateKey(new Date()));
    if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) onPick(v);
    return;
  }
  DateTimePickerAndroid.open({
    value: current ? parseDateKey(current) : new Date(),
    mode: 'date',
    onChange: (e, d) => {
      if (e.type === 'set' && d) onPick(dateKey(d));
    },
  });
}

export function pickTime(current: string, onPick: (hhmm: string) => void) {
  if (Platform.OS === 'web') {
    const v = window.prompt('시간 (HH:MM)', current);
    if (v && /^\d{1,2}:\d{2}$/.test(v)) onPick(v.padStart(5, '0'));
    return;
  }
  const [h, m] = current.split(':').map(Number);
  const base = new Date();
  base.setHours(h, m, 0, 0);
  DateTimePickerAndroid.open({
    value: base,
    mode: 'time',
    is24Hour: false,
    onChange: (e, d) => {
      if (e.type === 'set' && d) onPick(formatTime(d));
    },
  });
}

/** "19:00" → "오후 7:00" */
export function timeKo(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${ap} ${h12}:${m < 10 ? '0' : ''}${m}`;
}
