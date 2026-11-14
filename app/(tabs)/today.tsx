import { AlertBell } from '../../components/AlertBell';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { Ring } from '../../components/Ring';
import { Badge, Button, Card, CardHeader, CheckRow, T, tapFeedback } from '../../components/ui';
import { POST_FAST_NOTE, menusFor } from '../../data/menus';
import { DINNER_LABEL, FAST_CHEERS, PROGRAM_DAYS, SAFETY_NOTICE, WATER_GOAL } from '../../data/program';
import { pickTime, timeKo } from '../../lib/pickers';
import {
  Fast,
  FastInputs,
  activeFasts,
  addDays,
  addedRoutineItems,
  routineProgress,
  atTime,
  dateKey,
  dinnerTypeOf,
  fastAt,
  formatDateKo,
  formatTime,
  nextFast,
  parseDateKey,
  programDay,
  sameDay,
  seasonTip,
  seededPick,
  weekPlan,
} from '../../lib/plan';
import { isPaused } from '../../lib/round';
import { useApp, useNow } from '../../lib/store';
import { MAX_FONT_SCALE, fonts, radius, spacing, textScale, type, useTheme } from '../../theme';

export default function Today() {
  const { c } = useTheme();
  const app = useApp();
  const now = useNow(60000); // ring + countdown refresh once a minute
  const day = programDay(app.settings!.startDate, now);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        {isPaused(app) ? (
          <Paused day={day} />
        ) : day < 1 ? (
          <BeforeStart daysLeft={1 - day} />
        ) : day > PROGRAM_DAYS ? (
          <Finished />
        ) : (
          <InProgram day={day} now={now} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Paused({ day }: { day: number }) {
  const app = useApp();
  const since = app.pauses.find((p) => !p.to)!.from;
  return (
    <>
      <View style={s.top}>
        <View style={{ flex: 1 }}>
          <T tone="sub">일시정지 중</T>
          <T size="display" medium>{day}일차</T>
        </View>
        <View style={s.bellTop}>
          <AlertBell />
        </View>
      </View>
      <Card style={{ gap: spacing.md }}>
        <T>{formatDateKo(parseDateKey(since))}부터 쉬고 있어요. 알람도 모두 멈춰 있어요.</T>
        <T size="small" tone="sub">다시 시작하면 {day}일차부터 이어서 해요.</T>
        <Button icon="play" label="다시 시작" onPress={() => app.resume()} />
      </Card>
    </>
  );
}

function BeforeStart({ daysLeft }: { daysLeft: number }) {
  return (
    <>
      <View style={s.top}>
        <View style={{ flex: 1 }}>
          <T tone="sub">시작까지</T>
          <T size="display" medium>D-{daysLeft}</T>
        </View>
        <View style={s.bellTop}>
          <AlertBell />
        </View>
      </View>
      <GoalCard week={1} />
      <Card>
        <T>시작하는 날 아침부터 알람이 울려요. 그 전에 장을 봐 두면 좋아요.</T>
        <Button kind="outline" icon="cart" label="1주차 장보기 리스트" onPress={() => router.push('/shopping')} />
      </Card>
    </>
  );
}

function Finished() {
  return (
    <>
      <View style={s.top}>
        <View style={{ flex: 1 }}>
          <T tone="sub">4주 완주</T>
          <T size="display" medium>28일</T>
        </View>
        <View style={s.bellTop}>
          <AlertBell />
        </View>
      </View>
      <Card>
        <T>4주 동안 정말 수고 많았어요.</T>
        <Button label="완주 기록 보기" icon="trophy" onPress={() => router.push('/complete')} />
      </Card>
    </>
  );
}

function InProgram({ day, now }: { day: number; now: Date }) {
  const { c } = useTheme();
  const app = useApp();
  const st = app.settings!;
  const plan = weekPlan(day);
  const dinner = dinnerTypeOf(st.startDate, day);
  const dk = dateKey(now);
  const checked = app.checks[dk] ?? [];
  const prog = routineProgress(st.startDate, app.checks, dk); // this week's routine only
  const added = addedRoutineItems(plan.week);
  const weekFirstDay = day === (plan.week - 1) * 7 + 1;
  const showAdded = weekFirstDay && added.length > 0 && !app.routineNoticeSeen.includes(plan.week);
  const inputs: FastInputs = { startDate: st.startDate, fastStart: st.fastStart, overrides: app.fastOverrides, stopped: app.stoppedFasts };

  return (
    <>
      <View style={s.top}>
        <View style={{ flex: 1 }}>
          <T size="small" tone="sub">{plan.week}주차</T>
          <T size="h1" medium>{day}일차</T>
        </View>
        <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
          <T size="caption" tone="faint">오늘 저녁</T>
          <Badge label={DINNER_LABEL[dinner]} />
        </View>
        <View style={s.bellTop}>
          <AlertBell />
        </View>
      </View>

      <GoalCard week={plan.week} />

      {showAdded ? (
        <Card style={s.notice}>
          <Icon name="spark" size={18} />
          <T size="small" style={{ flex: 1 }}>이번 주 새로 추가된 루틴: {added.map((r) => r.label).join(', ')}</T>
          <Pressable accessibilityRole="button" accessibilityLabel="안내 닫기" hitSlop={10} onPress={() => app.dismissRoutineNotice(plan.week)}>
            <Icon name="close" size={18} />
          </Pressable>
        </Card>
      ) : null}

      {day === PROGRAM_DAYS ? (
        <Card>
          <T>마지막 날이에요. 4주 동안의 기록을 모아봤어요.</T>
          <Button icon="trophy" label="완주 기록 보기" onPress={() => router.push('/complete')} />
        </Card>
      ) : null}

      <FastCard day={day} now={now} inputs={inputs} />

      <Card>
        <CardHeader
          title="기본 루틴"
          right={
            <View style={s.allRow}>
              <T size="small" tone="sub">{prog.done} / {prog.total}</T>
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  tapFeedback();
                  // All of this week's items done → clear them; otherwise check them all (other ids kept as is).
                  const ids = prog.routine.map((r) => r.id);
                  const allDone = prog.done === prog.total;
                  app.setChecks(dk, allDone ? checked.filter((x) => !ids.includes(x)) : [...new Set([...checked, ...ids])]);
                }}
                style={[s.allBtn, { borderColor: c.lineSoft }]}
              >
                <T size="caption" medium>{prog.done === prog.total ? '전체 해제' : '전체 체크'}</T>
              </Pressable>
            </View>
          }
        />
        <View>
          {prog.routine.map((item) => (
            <CheckRow key={item.id} label={item.label} detail={item.detail} checked={checked.includes(item.id)} onToggle={() => app.toggleCheck(dk, item.id)} />
          ))}
        </View>
      </Card>

      <View style={s.twoCol}>
        <WaterCard dk={dk} />
        <NextUpCard day={day} now={now} inputs={inputs} />
      </View>

      <MemoCard dk={dk} />
      <MemoCard dk={dk} incident />

      <View style={s.season}>
        <Icon name="leaf" size={16} />
        <T size="small" tone="sub" style={{ flex: 1 }}>{seasonTip(now.getMonth() + 1)}</T>
      </View>
    </>
  );
}

export function GoalCard({ week }: { week: number }) {
  const { c } = useTheme();
  const plan = weekPlan(week * 7);
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/goals')} style={[s.goal, { backgroundColor: c.goalBg }]}>
      <View style={s.goalHead}>
        <T size="caption" medium color={c.goalLabel} style={{ flex: 1 }}>이번 주 목표 · {plan.week}주차 {plan.title}</T>
        <Icon name="right" size={16} color={c.goalLabel} />
      </View>
      <T size="title" color={c.goalText}>{plan.goal}</T>
    </Pressable>
  );
}

function hm(ms: number) {
  const mins = Math.max(0, Math.ceil(ms / 60000));
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`;
}

function when(d: Date, now: Date) {
  return sameDay(d, now) ? `오늘 ${formatTime(d)}` : sameDay(d, addDays(now, 1)) ? `내일 ${formatTime(d)}` : `${formatDateKo(d)} ${formatTime(d)}`;
}

function FastCard({ day, now, inputs }: { day: number; now: Date; inputs: FastInputs }) {
  const { c } = useTheme();
  const app = useApp();
  const { width } = useWindowDimensions();
  const ringSize = Math.min(232, width - 2 * spacing.screen - 2 * spacing.xl);
  const fasts = activeFasts(inputs);
  const cur = fastAt(fasts, now);
  const today = fasts.find((f) => f.day === day && f.start > now);

  // Today-only change: pick a new start time on the fast's own day. Alarms are rescheduled by the store.
  const changeTime = (f: Fast) =>
    pickTime(formatTime(f.start), (v) => {
      app.setFastStart(f.id, atTime(f.start, v).getTime());
    });

  if (cur) {
    const total = cur.end.getTime() - cur.start.getTime();
    const progress = (now.getTime() - cur.start.getTime()) / total;
    const cheer = FAST_CHEERS[Math.floor(now.getTime() / 3600000) % FAST_CHEERS.length];
    const stop = () =>
      Alert.alert('단식을 멈출까요?', SAFETY_NOTICE, [
        { text: '계속하기', style: 'cancel' },
        { text: '멈추고 식사하기', style: 'destructive', onPress: () => app.stopFast(cur.id) },
      ]);
    return (
      <Card style={{ alignItems: 'center', gap: spacing.xl }}>
        <CardHeader title="단식 중" icon="timer" />
        <Ring progress={progress} size={ringSize}>
          <T size="display" medium style={{ fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.2}>
            {hm(cur.end.getTime() - now.getTime())}
          </T>
          <T tone="sub">남았어요</T>
        </Ring>
        <View style={s.times}>
          <TimeCell label="시작" value={when(cur.start, now)} />
          <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: c.line }} />
          <TimeCell label="종료" value={when(cur.end, now)} />
        </View>
        <T tone="sub" style={{ textAlign: 'center' }}>{cheer}</T>
        <View style={{ alignSelf: 'stretch', gap: spacing.sm }}>
          <Button kind="outline" icon="clock" label="오늘만 시간 바꾸기" onPress={() => changeTime(cur)} />
          <Button kind="quiet" label="몸이 안 좋아요, 멈출게요" onPress={stop} />
        </View>
      </Card>
    );
  }

  if (today) {
    return (
      <Card style={{ alignItems: 'center', gap: spacing.xl }}>
        <CardHeader title="오늘은 단식하는 날" icon="timer" />
        <Ring progress={0} size={ringSize}>
          <T tone="sub">시작</T>
          <T size="display" medium maxFontSizeMultiplier={1.2}>{formatTime(today.start)}</T>
          <T size="small" tone="faint">24시간</T>
        </Ring>
        <T tone="sub" style={{ textAlign: 'center' }}>
          {when(today.end, now)}에 끝나요. 저녁은 든든하게 먹어요.
        </T>
        <View style={{ alignSelf: 'stretch', gap: spacing.sm }}>
          <Button icon="play" label="지금 시작" onPress={() => app.setFastStart(today.id, now.getTime())} />
          <Button kind="outline" icon="clock" label="오늘만 시간 바꾸기" onPress={() => changeTime(today)} />
        </View>
      </Card>
    );
  }

  const next = nextFast(fasts, now);
  const meal = nextMeal(now, app.settings!.meals);
  return (
    <Card style={{ gap: spacing.xl }}>
      <CardHeader title="오늘은 단식 없는 날" icon="timer" />
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <T size="small" tone="sub">다음 식사</T>
          <T size="h1" medium>{meal.label} {timeKo(formatTime(meal.at))}</T>
        </View>
        <View style={{ gap: spacing.xs }}>
          <T size="small" tone="sub">다음 단식</T>
          <T size="title">{next ? `${when(next.start, now)} 시작` : '남은 단식이 없어요'}</T>
        </View>
      </View>
    </Card>
  );
}

function TimeCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <T size="caption" tone="faint">{label}</T>
      <T size="small" medium style={{ textAlign: 'center' }}>{value}</T>
    </View>
  );
}

function nextMeal(now: Date, meals: { breakfast: string; lunch: string; dinner: string }) {
  const list = [
    { label: '아침', t: meals.breakfast },
    { label: '점심', t: meals.lunch },
    { label: '저녁', t: meals.dinner },
  ];
  for (const m of list) {
    const at = atTime(now, m.t);
    if (at > now) return { label: m.label, at };
  }
  return { label: '내일 아침', at: atTime(addDays(now, 1), meals.breakfast) };
}

function WaterCard({ dk }: { dk: string }) {
  const { c } = useTheme();
  const app = useApp();
  const water = app.water[dk] ?? 0;
  const tap = (i: number) => {
    tapFeedback();
    app.setWater(dk, water === i + 1 ? i : i + 1);
  };
  return (
    <Card style={[s.half, { flexBasis: 150 * textScale() }]}>
      <CardHeader title="물" icon="water" right={<T size="small" tone="sub">{water} / {WATER_GOAL}</T>} />
      <View style={s.cups}>
        {Array.from({ length: WATER_GOAL }).map((_, i) => {
          const full = i < water;
          return (
            <Pressable
              key={i}
              accessibilityLabel={`물 ${i + 1}잔`}
              accessibilityState={{ selected: full }}
              onPress={() => tap(i)}
              style={[s.cup, { borderColor: full ? c.accent : c.lineSoft, backgroundColor: full ? c.accent : 'transparent' }]}
            >
              <Icon name="water" size={16} color={full ? c.onAccent : c.faint} />
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

function NextUpCard({ day, now, inputs }: { day: number; now: Date; inputs: FastInputs }) {
  const fasts = activeFasts(inputs);
  // Post-fast meal if a fast ends within the next 3h or ended within the last 3h; otherwise a snack.
  const nearEnd = fasts.find((f) => Math.abs(f.end.getTime() - now.getTime()) < 3 * 3600000);
  const dk = dateKey(now);
  const week = weekPlan(day).week;
  const post = nearEnd ? seededPick(menusFor('postfast', Math.max(2, week)), dk, 1)[0] : undefined;
  // Snack recommendation: only from this week's snack list in data/program.ts (snackPicks).
  const snack = seededPick(weekPlan(day).snackPicks, dk, 1)[0];
  return (
    <Card style={[s.half, { flexBasis: 150 * textScale() }]}>
      <CardHeader title="다음 할 일" icon="spark" />
      <View style={{ gap: spacing.xs }}>
        <T size="caption" tone="faint">{nearEnd ? '단식 후 첫 끼' : '오늘의 간식'}</T>
        <T medium accessibilityLabel={'추천: ' + (post?.name ?? snack)}>{post?.name ?? snack}</T>
        <T size="caption" tone="sub" numberOfLines={2}>{post ? POST_FAST_NOTE : '이번 주 간식 중에서 골랐어요'}</T>
      </View>
    </Card>
  );
}

/** 오늘 메모, or (incident) 특이사항: off-plan food, a skipped fast, anything out of the routine. */
function MemoCard({ dk, incident }: { dk: string; incident?: boolean }) {
  const { c } = useTheme();
  const app = useApp();
  const store = incident ? app.incidents : app.notes;
  const save = incident ? app.setIncident : app.setNote;
  const [text, setText] = useState(store[dk] ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => setText(store[dk] ?? ''), [dk]); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = (v: string) => {
    setText(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => saveRef.current(dk, v), 500); // autosave
  };

  return (
    <Card style={{ gap: spacing.md }}>
      <CardHeader title={incident ? '특이사항' : '오늘 메모'} icon={incident ? 'pencil' : 'note'} />
      <TextInput
        value={text}
        onChangeText={onChange}
        onBlur={() => save(dk, text)}
        placeholder={incident ? '먹으면 안 되는 걸 먹었거나, 단식을 못 했거나, 루틴에서 벗어난 일을 적어요' : '오늘 몸 상태나 기억하고 싶은 걸 적어요'}
        placeholderTextColor={c.faint}
        multiline
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        style={[s.memo, { color: c.text, backgroundColor: c.inset, fontFamily: fonts.regular, fontSize: type.body }]}
      />
    </Card>
  );
}

const s = StyleSheet.create({
  wrap: { padding: spacing.screen, gap: spacing.lg, paddingBottom: 48 },
  top: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md, marginBottom: spacing.xs },
  bellTop: { alignSelf: 'flex-start' },
  goal: { borderRadius: radius.card, padding: spacing.xl, gap: spacing.sm },
  goalHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  times: { flexDirection: 'row', alignSelf: 'stretch', gap: spacing.md },
  twoCol: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  half: { flexGrow: 1, padding: spacing.lg, gap: spacing.md },
  cups: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  // 4 per row at any card width (two rows of 4 = goal of 8).
  cup: { flexBasis: '21%', flexGrow: 1, maxWidth: 64, height: 40, borderRadius: radius.inner - 2, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  allRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  allBtn: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  memo: { minHeight: 88, borderRadius: radius.inner, padding: spacing.md, textAlignVertical: 'top' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  season: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', paddingHorizontal: spacing.xs },
});
