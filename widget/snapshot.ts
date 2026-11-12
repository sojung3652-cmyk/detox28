// What the home-screen widget shows, computed from saved state (pure, testable).
import { PROGRAM_DAYS, WEEKS } from '../data/program';
import type { Persisted } from '../lib/persist';
import { activeFasts, dateKey, fastAt, formatTime, nextFast, programDay, routineProgress, weekOfDay } from '../lib/plan';

export type WidgetSnapshot = {
  title: string; // "12일차 · 2주차"
  fastLine: string; // "9시간 40분 남음"
  fastSub: string; // "오후 8:00 종료"
  fasting: boolean;
  done: number;
  total: number;
};

function ampm(d: Date) {
  const h = d.getHours();
  return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function widgetSnapshot(s: Persisted, now: Date): WidgetSnapshot {
  let total = WEEKS[0].routine.length;
  if (!s.settings) return { title: 'Detox28', fastLine: '앱을 열어 시작해요', fastSub: '', fasting: false, done: 0, total };
  const st = s.settings;
  const day = programDay(st.startDate, now);
  const prog = routineProgress(st.startDate, s.checks, dateKey(now));
  total = prog.total;
  const done = prog.done;
  if (s.pauses?.some((p) => !p.to)) return { title: `일시정지 · ${day}일차`, fastLine: '쉬어가는 중이에요', fastSub: '앱에서 다시 시작해요', fasting: false, done, total };
  if (day < 1) return { title: `시작까지 D-${1 - day}`, fastLine: '곧 시작해요', fastSub: '', fasting: false, done: 0, total };
  if (day > PROGRAM_DAYS) return { title: '28일 완주', fastLine: '정말 수고했어요', fastSub: '', fasting: false, done, total };

  const fasts = activeFasts({ startDate: st.startDate, fastStart: st.fastStart, overrides: s.fastOverrides, stopped: s.stoppedFasts });
  const cur = fastAt(fasts, now);
  const title = `${day}일차 · ${weekOfDay(day)}주차`;
  if (cur) {
    const mins = Math.max(0, Math.ceil((cur.end.getTime() - now.getTime()) / 60000));
    return { title, fastLine: `${Math.floor(mins / 60)}시간 ${mins % 60}분 남음`, fastSub: `${ampm(cur.end)} 종료`, fasting: true, done, total };
  }
  const next = nextFast(fasts, now);
  if (next && dateKey(next.start) === dateKey(now)) {
    return { title, fastLine: `오늘 ${formatTime(next.start)} 단식 시작`, fastSub: '24시간', fasting: false, done, total };
  }
  return { title, fastLine: '오늘은 단식 없는 날', fastSub: next ? `다음 단식 ${next.start.getMonth() + 1}/${next.start.getDate()}` : '', fasting: false, done, total };
}
