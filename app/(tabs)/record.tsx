import { AlertBell } from '../../components/AlertBell';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { Icon } from '../../components/Icon';
import { InboxCard } from '../../components/InboxCard';
import { Card, CardHeader, Divider, Pill, T, tapFeedback } from '../../components/ui';
import { PROGRAM_DAYS } from '../../data/program';
import { dateKey, dateOfDay, formatDateKo, parseDateKey, programDay, routineProgress, weekOfDay } from '../../lib/plan';
import { roundSummary } from '../../lib/round';
import { STREAK_MILESTONES, dayKeys, fastStats, fmtWeight, fromUnit, ratioOn, streaks, toUnit, weightSeries } from '../../lib/stats';
import { useApp, useNow } from '../../lib/store';
import { MAX_FONT_SCALE, fonts, radius, spacing, textScale, type, useTheme } from '../../theme';

const MEAL_LABEL = { breakfast: '아침', lunch: '점심', dinner: '저녁' } as const;
const CONDITIONS = ['힘들어요', '조금 힘들어요', '보통이에요', '좋아요', '아주 좋아요'];

export default function Record() {
  const { c } = useTheme();
  const app = useApp();
  const now = useNow();
  const st = app.settings!;
  const today = programDay(st.startDate, now);
  const [sel, setSel] = useState(Math.min(PROGRAM_DAYS, Math.max(1, today)));
  const keys = useMemo(() => dayKeys(app), [app]);
  const { current, longest } = streaks(app, now);
  const fasts = fastStats(app, now);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        <View style={s.titleRow}>
          <T size="h1" medium style={{ flex: 1 }}>기록</T>
          <Pressable accessibilityRole="button" onPress={() => router.push('/shopping')} style={[s.chip, { borderColor: c.lineSoft, backgroundColor: c.card }]}>
            <Icon name="cart" size={16} />
            <T size="small" medium>장보기</T>
          </Pressable>
          <AlertBell />
        </View>

        <View style={s.stats}>
          <StreakCard current={current} longest={longest} />
          <Card style={[s.stat, { flexBasis: 140 * textScale() }]}>
            <T size="small" tone="sub">완료한 단식</T>
            <T size="h1" medium>{fasts.done}<T tone="sub"> / {fasts.total}회</T></T>
          </Card>
        </View>

        <Card>
          <CardHeader title="28일" icon="record" />
          <View style={{ gap: spacing.sm }}>
            {[0, 1, 2, 3].map((w) => (
              <View key={w} style={s.week}>
                {keys.slice(w * 7, w * 7 + 7).map((k, i) => {
                  const d = w * 7 + i + 1;
                  return (
                    <DayCell
                      key={k}
                      day={d}
                      ratio={ratioOn(app, k)}
                      future={d > today}
                      selected={d === sel}
                      fasted={fasts.doneDays.has(d)}
                      memo={!!app.notes[k]?.trim() || !!app.incidents[k]?.trim()}
                      onPress={() => d <= today && setSel(d)}
                    />
                  );
                })}
              </View>
            ))}
          </View>
          <View style={s.legend}>
            <Legend label="루틴 체크 비율만큼 채워져요" swatch={<View style={[s.sw, { backgroundColor: c.accent }]} />} />
            <Legend label="단식" swatch={<View style={[s.fastMark, { backgroundColor: c.accent, position: 'relative', top: 0, right: 0 }]} />} />
            <Legend label="메모·특이사항" swatch={<View style={[s.dot, { backgroundColor: c.sub, position: 'relative', bottom: 0 }]} />} />
          </View>
        </Card>

        <InboxCard />

        <DayDetail dk={keys[sel - 1]} day={sel} />

        <WeightCard />

        <MemoList incident />

        <MemoList />

        <HistoryCard />
      </ScrollView>
    </SafeAreaView>
  );
}

function Legend({ label, swatch }: { label: string; swatch: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {swatch}
      <T size="caption" tone="sub">{label}</T>
    </View>
  );
}

function DayCell({ day, ratio, future, selected, fasted, memo, onPress }: { day: number; ratio: number; future: boolean; selected: boolean; fasted: boolean; memo: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const fill = future ? 0 : ratio;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${day}일차 루틴 ${Math.round(ratio * 100)}%${fasted ? ', 단식 완료' : ''}${memo ? ', 메모 있음' : ''}`}
      onPress={onPress}
      style={[s.cell, { borderColor: selected ? c.accent : c.line, borderWidth: selected ? 2 : 1, backgroundColor: c.card }]}
    >
      <View style={[s.fill, { height: `${fill * 100}%`, backgroundColor: c.accent }]} />
      <T size="caption" allowFontScaling={false} color={fill >= 0.55 ? c.onAccent : future ? c.faint : c.text}>{day}</T>
      {fasted ? <View style={[s.fastMark, { backgroundColor: fill >= 0.9 ? c.onAccent : c.accent }]} /> : null}
      {memo ? <View style={[s.dot, { backgroundColor: fill >= 0.2 ? c.onAccent : c.sub }]} /> : null}
    </Pressable>
  );
}

/** Streak with a one-time celebration at 7/14/21 days: navy ring pulse + number count-up. */
function StreakCard({ current, longest }: { current: number; longest: number }) {
  const { c } = useTheme();
  const app = useApp();
  const [shown, setShown] = useState(current);
  const pulse = useSharedValue(0);
  const milestone = STREAK_MILESTONES.includes(current) && !app.celebrated.includes(current) ? current : null;

  useEffect(() => {
    if (!milestone) {
      setShown(current);
      return;
    }
    tapFeedback();
    pulse.value = 0;
    pulse.value = withSequence(withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) }), withTiming(2, { duration: 450, easing: Easing.in(Easing.cubic) }));
    const startAt = Date.now();
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - startAt) / 900);
      setShown(Math.round(milestone * (1 - Math.pow(1 - t, 3))));
      if (t >= 1) {
        clearInterval(id);
        app.markCelebrated(milestone);
      }
    }, 30);
    return () => clearInterval(id);
  }, [milestone, current]); // eslint-disable-line react-hooks/exhaustive-deps

  const ringStyle = useAnimatedStyle(() => {
    const v = pulse.value;
    const scale = v <= 1 ? 1 + 0.15 * v : 1.15 - 0.15 * (v - 1);
    return { transform: [{ scale }], opacity: v === 0 ? 0 : v <= 1 ? 1 : 2 - v };
  });

  return (
    <Card style={[s.stat, { flexBasis: 140 * textScale() }]}>
      <T size="small" tone="sub">연속 기록</T>
      <View style={{ alignSelf: 'flex-start' }}>
        <Animated.View pointerEvents="none" style={[s.pulse, { borderColor: c.accent }, ringStyle]} />
        <T size="h1" medium>{shown}<T tone="sub">일</T></T>
      </View>
      <T size="caption" tone="faint">{milestone || STREAK_MILESTONES.includes(current) ? `${current}일 연속 달성!` : `최장 ${longest}일 · 루틴 80% 이상`}</T>
    </Card>
  );
}

function DayDetail({ dk, day }: { dk: string; day: number }) {
  const { c } = useTheme();
  const app = useApp();
  const checked = app.checks[dk] ?? [];
  const log = app.body[dk] ?? {};
  const unit = app.weightUnit;
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    setWeight(log.weightLb ? toUnit(log.weightLb, unit).toFixed(1) : '');
    setNote(log.note ?? '');
  }, [dk, unit]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveWeight = () => {
    const v = parseFloat(weight.replace(',', '.'));
    if (!weight.trim()) return app.setBody(dk, { weightLb: undefined });
    if (Number.isFinite(v) && v > 0) app.setBody(dk, { weightLb: Math.round(fromUnit(v, unit) * 10) / 10 });
  };

  const input = [s.input, { color: c.text, backgroundColor: c.inset, fontFamily: fonts.regular, fontSize: type.body }];
  const date = dateOfDay(app.settings!.startDate, day);
  const prog = routineProgress(app.settings!.startDate, app.checks, dk); // that day's week routine

  return (
    <Card>
      <CardHeader title={`${day}일차 · ${formatDateKo(date)}`} icon="note" />

      <View style={{ gap: spacing.sm }}>
        <T size="small" tone="sub">몸 상태</T>
        <View style={s.row}>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            onEndEditing={saveWeight}
            onBlur={saveWeight}
            keyboardType="decimal-pad"
            placeholder="체중"
            placeholderTextColor={c.faint}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            style={[input, { flex: 1, minWidth: 100 }]}
          />
          <View style={s.row}>
            {(['lb', 'kg'] as const).map((u) => (
              <Pill key={u} label={u} selected={unit === u} onPress={() => app.setWeightUnit(u)} />
            ))}
          </View>
        </View>
        <View style={s.conds}>
          {CONDITIONS.map((label, i) => {
            const v = (i + 1) as 1 | 2 | 3 | 4 | 5;
            const on = log.condition === v;
            return (
              <Pressable
                key={v}
                accessibilityRole="radio"
                accessibilityLabel={label}
                accessibilityState={{ selected: on }}
                onPress={() => { tapFeedback(); app.setBody(dk, { condition: on ? undefined : v }); }}
                style={[s.cond, on ? { backgroundColor: c.accent, borderColor: c.accent } : { borderColor: c.control }]}
              >
                <T size="small" medium color={on ? c.onAccent : c.text} allowFontScaling={false}>{v}</T>
              </Pressable>
            );
          })}
        </View>
        <T size="caption" tone="sub">컨디션: {log.condition ? CONDITIONS[log.condition - 1] : '선택 안 함'}</T>
        <TextInput
          value={note}
          onChangeText={setNote}
          onEndEditing={() => app.setBody(dk, { note })}
          onBlur={() => app.setBody(dk, { note })}
          placeholder="몸 상태 한 줄 메모"
          placeholderTextColor={c.faint}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          style={input}
        />
      </View>

      <Divider />

      <View style={{ gap: spacing.xs }}>
        <T size="small" tone="sub">루틴 {prog.done} / {prog.total} · {weekOfDay(day)}주차 기준</T>
        <View style={s.tags}>
          {prog.routine.map((r) => {
            const on = checked.includes(r.id);
            return (
              <View key={r.id} style={[s.tag, { backgroundColor: on ? c.badgeBg : 'transparent', borderColor: on ? c.badgeBg : c.line }]}>
                <T size="caption" color={on ? c.badgeText : c.faint}>{r.label}</T>
              </View>
            );
          })}
        </View>
        <T size="small" tone="sub" style={{ marginTop: spacing.sm }}>
          물 {app.water[dk] ?? 0}잔 · 식사{' '}
          {(['breakfast', 'lunch', 'dinner'] as const).filter((m) => app.meals[dk]?.includes(m)).map((m) => MEAL_LABEL[m]).join(', ') || '기록 없음'}
        </T>
      </View>

      {app.incidents[dk]?.trim() ? (
        <>
          <Divider />
          <View style={{ gap: spacing.xs }}>
            <T size="small" tone="sub">특이사항</T>
            <T>{app.incidents[dk]}</T>
          </View>
        </>
      ) : null}

      {app.notes[dk]?.trim() ? (
        <>
          <Divider />
          <View style={{ gap: spacing.xs }}>
            <T size="small" tone="sub">메모</T>
            <T>{app.notes[dk]}</T>
          </View>
        </>
      ) : null}
    </Card>
  );
}

function WeightCard() {
  const { c } = useTheme();
  const app = useApp();
  const [w, setW] = useState(0);
  const pts = weightSeries(app);
  const unit = app.weightUnit;
  const H = 140;
  const pad = 10;

  let body: React.ReactNode;
  if (pts.length < 2) {
    body = <T size="small" tone="sub">체중을 두 번 이상 기록하면 그래프가 보여요.</T>;
  } else if (w > 0) {
    const vals = pts.map((p) => toUnit(p.lb, unit));
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = Math.max(1, max - min);
    const x = (day: number) => pad + ((day - 1) / (PROGRAM_DAYS - 1)) * (w - 2 * pad);
    const y = (v: number) => pad + (1 - (v - min) / span) * (H - 2 * pad);
    const poly = pts.map((p, i) => `${x(p.day)},${y(vals[i])}`).join(' ');
    const diff = vals[vals.length - 1] - vals[0];
    body = (
      <>
        <Svg width={w} height={H}>
          {[0, 0.5, 1].map((f) => (
            <Line key={f} x1={pad} x2={w - pad} y1={pad + f * (H - 2 * pad)} y2={pad + f * (H - 2 * pad)} stroke={c.line} strokeWidth={1} />
          ))}
          <Polyline points={poly} fill="none" stroke={c.accent} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {pts.map((p, i) => (
            <Circle key={p.day} cx={x(p.day)} cy={y(vals[i])} r={3.5} fill={c.card} stroke={c.accent} strokeWidth={2} />
          ))}
        </Svg>
        <View style={s.row}>
          <T size="small" tone="sub" style={{ flex: 1 }}>{fmtWeight(pts[0].lb, unit)} → {fmtWeight(pts[pts.length - 1].lb, unit)}</T>
          <T size="small" medium>{diff > 0 ? '+' : ''}{diff.toFixed(1)} {unit}</T>
        </View>
      </>
    );
  }

  return (
    <Card>
      <CardHeader title="체중 변화" icon="chart" />
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>{body}</View>
    </Card>
  );
}

function MemoList({ incident }: { incident?: boolean }) {
  const app = useApp();
  const st = app.settings!;
  const items = Object.entries(incident ? app.incidents : app.notes)
    .filter(([, v]) => v.trim())
    .sort(([a], [b]) => (a < b ? 1 : -1));
  if (!items.length) return null;
  return (
    <Card>
      <CardHeader title={incident ? '특이사항 모아보기' : '메모 모아보기'} icon={incident ? 'pencil' : 'note'} />
      {items.map(([k, v], i) => {
        const [y, m, d] = k.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return (
          <View key={k} style={{ gap: spacing.xs }}>
            {i > 0 ? <Divider /> : null}
            <T size="caption" tone="sub">{programDay(st.startDate, date)}일차 · {formatDateKo(date)}</T>
            <T>{v}</T>
          </View>
        );
      })}
    </Card>
  );
}

/** Past rounds (completed or stopped), newest first. Their full records stay in storage and backups. */
function HistoryCard() {
  const app = useApp();
  if (!app.history.length) return null;
  const fmt = (k: string) => formatDateKo(parseDateKey(k));
  return (
    <Card>
      <CardHeader title="지난 디톡스" icon="repeat" />
      {[...app.history].reverse().map((r, i) => {
        const sum = roundSummary(r);
        return (
          <View key={r.startDate + i} style={{ gap: spacing.xs }}>
            {i > 0 ? <Divider /> : null}
            <T size="caption" tone="sub">{fmt(r.startDate)} ~ {fmt(r.endDate)}</T>
            <T>
              {r.reason === 'completed' ? '완주' : '중단'} · 체크한 날 {sum.checkedDays}일{sum.incidents ? ` · 특이사항 ${sum.incidents}건` : ''}
            </T>
          </View>
        );
      })}
    </Card>
  );
}

const s = StyleSheet.create({
  wrap: { padding: spacing.screen, gap: spacing.lg, paddingBottom: 48 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  stat: { flexGrow: 1, gap: spacing.xs, padding: spacing.lg },
  pulse: { position: 'absolute', left: -14, top: -10, width: 72, height: 72, borderRadius: 36, borderWidth: 2 },
  week: { flexDirection: 'row', gap: 6 },
  cell: { flex: 1, aspectRatio: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  fastMark: { position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: 1.5 },
  dot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2 },
  sw: { width: 12, height: 12, borderRadius: 3 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  input: { borderRadius: radius.inner, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
  conds: { flexDirection: 'row', gap: spacing.sm },
  cond: { flex: 1, height: 40, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.sm + 2, paddingVertical: 2 },
});
