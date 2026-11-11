import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { Button, Card, CardTitle, Notice, T } from '../../components/ui';
import { SAFETY_NOTICE } from '../../data/program';
import {
  hasExactAlarmPermission,
  hasNotificationPermission,
  requestExactAlarmPermission,
  requestNotificationPermission,
  scheduledCount,
  testAlarm,
} from '../../lib/notifications';
import { pickDate, pickTime, timeKo } from '../../lib/pickers';
import { MealTimes, formatDateKo, parseDateKey, programDay } from '../../lib/plan';
import { SHOW_DEBUG, useApp, useNow } from '../../lib/store';
import { C, F } from '../../lib/theme';

const MEALS: { key: keyof MealTimes; label: string }[] = [
  { key: 'breakfast', label: '아침' },
  { key: 'lunch', label: '점심' },
  { key: 'dinner', label: '저녁' },
];

export default function Settings() {
  const app = useApp();
  const st = app.settings!;
  const [notif, setNotif] = useState<boolean | null>(null);
  const [exact, setExact] = useState<boolean | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    hasNotificationPermission().then(setNotif).catch(() => setNotif(false));
    hasExactAlarmPermission().then(setExact).catch(() => setExact(false));
    scheduledCount().then(setCount).catch(() => setCount(null));
  }, []);
  useFocusEffect(refresh);

  const save = async (next: typeof st) => {
    setBusy(true);
    await app.saveSettings(next);
    setBusy(false);
    refresh();
  };

  const changeStart = () =>
    pickDate(st.startDate, (key) => {
      if (key === st.startDate) return;
      Alert.alert('시작 날짜를 바꿀까요?', `${formatDateKo(parseDateKey(key))}이 1일차가 되고, 알람을 전부 다시 예약해요.`, [
        { text: '취소', style: 'cancel' },
        { text: '바꾸기', onPress: () => save({ ...st, startDate: key }) },
      ]);
    });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={s.wrap}>
        <T size={F.h1} weight="800">설정</T>

        <Card>
          <CardTitle icon="calendar">시작 날짜</CardTitle>
          <Row label="1일차" value={formatDateKo(parseDateKey(st.startDate))} onPress={changeStart} />
        </Card>

        <Card>
          <CardTitle icon="clock">식사 시간</CardTitle>
          {MEALS.map((m) => (
            <Row
              key={m.key}
              label={m.label}
              value={timeKo(st.meals[m.key])}
              onPress={() => pickTime(st.meals[m.key], (v) => save({ ...st, meals: { ...st.meals, [m.key]: v } }))}
            />
          ))}
          <T size={F.tiny} color={C.sub}>
            {busy ? '알람을 다시 예약하는 중…' : `바꾸면 알람이 전부 다시 예약돼요.${count != null ? ` 예약된 알람 ${count}개` : ''}`}
          </T>
        </Card>

        <Card>
          <CardTitle icon="info">알람 권한</CardTitle>
          <PermLine
            label="알림"
            ok={notif}
            onFix={async () => {
              if (await requestNotificationPermission()) await save(st);
              refresh();
            }}
          />
          <PermLine
            label="정확한 시간 알람"
            ok={exact}
            onFix={async () => {
              await requestExactAlarmPermission();
              refresh();
            }}
          />
        </Card>

        <Notice text={SAFETY_NOTICE} />

        {SHOW_DEBUG ? <DebugCard /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.row} accessibilityRole="button">
      <T weight="600" style={{ flex: 1 }}>{label}</T>
      <T weight="700" color="#C9798A" style={{ flexShrink: 1, textAlign: 'right' }}>{value}</T>
      <Icon name="chevron" size={18} color={C.sub} />
    </Pressable>
  );
}

function PermLine({ label, ok, onFix }: { label: string; ok: boolean | null; onFix: () => void }) {
  return (
    <View style={s.row}>
      <T weight="600" style={{ flex: 1 }}>{label}</T>
      {ok ? (
        <T weight="600" color="#5E8A6E">허용됨</T>
      ) : ok === false ? (
        <Pressable onPress={onFix} style={s.fix}>
          <T size={F.small} weight="700" color={C.white}>허용하기</T>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Development only — hidden in release APKs via SHOW_DEBUG (= __DEV__). */
function DebugCard() {
  const app = useApp();
  const now = useNow();
  const day = programDay(app.settings!.startDate, now);
  const shift = (n: number) => app.setDebugOffset(app.debugOffsetDays + n);
  return (
    <Card tint={C.lavender}>
      <CardTitle icon="gear">디버그 · 날짜 바꿔보기</CardTitle>
      <T size={F.small}>
        화면 기준 날짜: {formatDateKo(now)} ({day}일차){app.debugOffsetDays ? ` · ${app.debugOffsetDays > 0 ? '+' : ''}${app.debugOffsetDays}일` : ''}
      </T>
      <View style={s.debugRow}>
        <Button kind="ghost" label="-7" onPress={() => shift(-7)} />
        <Button kind="ghost" label="-1" onPress={() => shift(-1)} />
        <Button kind="ghost" label="+1" onPress={() => shift(1)} />
        <Button kind="ghost" label="+7" onPress={() => shift(7)} />
      </View>
      <Button kind="soft" label="오늘로 돌아가기" onPress={() => app.setDebugOffset(0)} />
      <Button kind="soft" label="5초 뒤 테스트 알림" onPress={() => testAlarm()} />
      <Button
        kind="ghost"
        label="전체 초기화 (온보딩부터)"
        onPress={async () => {
          await app.resetAll();
          router.replace('/onboarding');
        }}
      />
      <T size={F.tiny} color={C.sub}>날짜 이동은 화면에만 적용돼요. 알람은 실제 시간 기준이에요.</T>
    </Card>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 18, gap: 14, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, flexWrap: 'wrap' },
  fix: { backgroundColor: C.pink, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  debugRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
