import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { Badge, Button, Card, CardTitle, T } from '../../components/ui';
import { SPECIAL_MESSAGES } from '../../data/messages';
import { DAILY_ROUTINE, DINNER_LABEL, FAST_HOURS, PROGRAM_DAYS, SAFETY_NOTICE, WATER_GOAL } from '../../data/program';
import {
  activeFasts,
  dateKey,
  dinnerTypeOf,
  fastAt,
  formatDateKo,
  formatTime,
  nextFast,
  pad,
  programDay,
  seasonTip,
  seededPick,
  tipOfDay,
  weekPlan,
} from '../../lib/plan';
import { useApp, useNow } from '../../lib/store';
import { C, F, R } from '../../lib/theme';

export default function Today() {
  const app = useApp();
  const now = useNow(1000);
  const settings = app.settings!;
  const day = programDay(settings.startDate, now);
  const key = dateKey(now);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={s.wrap}>
        <T size={F.small} color={C.sub}>{formatDateKo(now)}</T>
        {day < 1 ? (
          <BeforeStart daysLeft={1 - day} />
        ) : day > PROGRAM_DAYS ? (
          <Finished />
        ) : (
          <InProgram day={day} dayKey={key} now={now} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function BeforeStart({ daysLeft }: { daysLeft: number }) {
  return (
    <>
      <T size={F.h1} weight="800">시작까지 D-{daysLeft}</T>
      <Card>
        <T>시작하는 날 아침부터 알람이 울려요. 그 전에 장을 봐 두면 좋아요.</T>
        <T size={F.small} color={C.sub}>1주차 재료: {weekPlan(1).ingredients.join(', ')}</T>
      </Card>
    </>
  );
}

function Finished() {
  return (
    <>
      <T size={F.h1} weight="800">28일 완주</T>
      <Card tint={C.pinkFaint}>
        <Icon name="heart" size={32} color={C.pink} />
        <T>4주 동안 정말 수고 많았어요. 진행 탭에서 지난 기록을 볼 수 있어요.</T>
      </Card>
    </>
  );
}

function InProgram({ day, dayKey, now }: { day: number; dayKey: string; now: Date }) {
  const app = useApp();
  const settings = app.settings!;
  const plan = weekPlan(day);
  const dinner = dinnerTypeOf(settings.startDate, day);
  const msg = SPECIAL_MESSAGES[day];
  const checked = app.checks[dayKey] ?? [];
  const water = app.water[dayKey] ?? 0;
  const snacks = seededPick(plan.snacks, dayKey, 2);

  return (
    <>
      <View style={{ gap: 4 }}>
        <T size={F.h1} weight="800">{day}일차 · {plan.week}주차</T>
        <T color={C.sub}>{plan.theme}</T>
      </View>

      {msg ? (
        <Card tint={C.pinkSoft}>
          <CardTitle icon="heart">{msg.title}</CardTitle>
          <T>{msg.body}</T>
        </Card>
      ) : null}

      <Card>
        <CardTitle icon="moon">오늘 저녁</CardTitle>
        <View style={s.row}>
          <Badge label={DINNER_LABEL[dinner]} bg={dinner === 'lowcarb' ? C.pinkSoft : C.sageSoft} />
          <T size={F.small} color={C.sub} style={{ flex: 1 }}>
            {dinner === 'lowcarb' ? '밥·빵·면 없이 단백질과 채소로' : '평소처럼, 적당한 양으로'}
          </T>
        </View>
      </Card>

      <FastCard now={now} />

      <Card>
        <CardTitle icon="check" right={<T size={F.small} color={C.sub}>{checked.length}/{DAILY_ROUTINE.length}</T>}>
          기본 루틴
        </CardTitle>
        {DAILY_ROUTINE.map((item) => {
          const on = checked.includes(item.id);
          return (
            <Pressable
              key={item.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => app.toggleCheck(dayKey, item.id)}
              style={[s.check, on && { backgroundColor: C.pinkFaint }]}
            >
              <View style={[s.box, on && { backgroundColor: C.pink, borderColor: C.pink }]}>
                {on ? <Icon name="check" size={16} color={C.white} strokeWidth={2.6} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <T weight="600" color={on ? C.sub : C.text}>{item.label}</T>
                {item.detail ? <T size={F.tiny} color={C.sub}>{item.detail}</T> : null}
              </View>
            </Pressable>
          );
        })}
      </Card>

      <Card>
        <CardTitle icon="leaf">오늘의 간식</CardTitle>
        {snacks.map((sn) => (
          <View key={sn.name} style={s.snack}>
            <T weight="600">{sn.name}</T>
            <T size={F.tiny} color={C.sub}>{sn.store}</T>
          </View>
        ))}
      </Card>

      <Card>
        <CardTitle icon="drop" right={<T size={F.small} color={C.sub}>목표 {WATER_GOAL}잔</T>}>물 마시기</CardTitle>
        <View style={s.waterRow}>
          <Pressable
            accessibilityLabel="한 잔 빼기"
            onPress={() => app.setWater(dayKey, water - 1)}
            style={s.round}
          >
            <Icon name="minus" color={C.text} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <T size={F.h1 + 6} weight="800" color={water >= WATER_GOAL ? '#5E8A6E' : C.text}>{water}잔</T>
          </View>
          <Pressable
            accessibilityLabel="한 잔 더하기"
            onPress={() => app.setWater(dayKey, water + 1)}
            style={[s.round, { backgroundColor: C.pink }]}
          >
            <Icon name="plus" color={C.white} />
          </Pressable>
        </View>
        <View style={s.cups}>
          {Array.from({ length: WATER_GOAL }).map((_, i) => (
            <View key={i} style={[s.cup, i < water && { backgroundColor: '#BFD8E6' }]} />
          ))}
        </View>
      </Card>

      <Card tint={C.butter}>
        <CardTitle icon="spark">오늘의 팁</CardTitle>
        <T>{tipOfDay(day)}</T>
        <View style={{ height: 1, backgroundColor: '#EADCB4' }} />
        <View style={s.row}>
          <Icon name="sun" size={18} color={C.sub} />
          <T size={F.small} color={C.sub} style={{ flex: 1 }}>{seasonTip(now.getMonth() + 1)}</T>
        </View>
      </Card>
    </>
  );
}

function hms(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(t / 3600))}:${pad(Math.floor((t % 3600) / 60))}:${pad(t % 60)}`;
}

function FastCard({ now }: { now: Date }) {
  const app = useApp();
  const st = app.settings!;
  const fasts = activeFasts(st.startDate, st.meals, app.stoppedFasts);
  const cur = fastAt(fasts, now);

  if (cur) {
    const total = cur.end.getTime() - cur.start.getTime();
    const done = now.getTime() - cur.start.getTime();
    const stop = () =>
      Alert.alert('단식을 멈출까요?', SAFETY_NOTICE, [
        { text: '계속하기', style: 'cancel' },
        { text: '멈추고 식사하기', style: 'destructive', onPress: () => app.stopFast(cur.id) },
      ]);
    return (
      <Card tint={C.lavender}>
        <CardTitle icon="clock">단식 중</CardTitle>
        <T size={F.small} color={C.sub}>남은 시간</T>
        <T size={40} weight="800" style={{ fontVariant: ['tabular-nums'] }}>{hms(cur.end.getTime() - now.getTime())}</T>
        <View style={s.bar}>
          <View style={[s.barFill, { width: `${Math.min(100, (done / total) * 100)}%` }]} />
        </View>
        <T size={F.small} color={C.sub}>{formatDateKo(cur.end)} {formatTime(cur.end)}에 끝나요 · 물은 자주 마셔요</T>
        <Button kind="ghost" label="몸이 안 좋아요, 멈출게요" onPress={stop} />
      </Card>
    );
  }

  const next = nextFast(fasts, now);
  return (
    <Card>
      <CardTitle icon="clock">단식</CardTitle>
      {next ? (
        <T>
          다음 단식: {formatDateKo(next.start)} {formatTime(next.start)} 시작 · {FAST_HOURS}시간
        </T>
      ) : (
        <T color={C.sub}>남은 단식 일정이 없어요.</T>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 18, gap: 14, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  check: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, paddingHorizontal: 10, borderRadius: R.small },
  box: { width: 28, height: 28, borderRadius: 9, borderWidth: 2, borderColor: C.pinkSoft, alignItems: 'center', justifyContent: 'center' },
  snack: { backgroundColor: C.sageSoft, borderRadius: R.small, padding: 14 },
  waterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  round: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.pinkFaint, alignItems: 'center', justifyContent: 'center' },
  cups: { flexDirection: 'row', gap: 6 },
  cup: { flex: 1, height: 14, borderRadius: 7, backgroundColor: C.line },
  bar: { height: 12, borderRadius: 6, backgroundColor: C.white, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: C.pink, borderRadius: 6 },
});
