import { AlertBell } from '../../components/AlertBell';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { Button, Card, CardHeader, Divider, Notice, Pill, T } from '../../components/ui';
import { PROGRAM_DAYS, SAFETY_NOTICE } from '../../data/program';
import { exportBackup, importBackup } from '../../lib/backup';
import {
  hasExactAlarmPermission,
  hasNotificationPermission,
  requestExactAlarmPermission,
  requestNotificationPermission,
  listScheduled,
  ScheduledRow,
  scheduledCount,
} from '../../lib/notifications';
import { pickDate, pickTime, timeKo } from '../../lib/pickers';
import { formatDateKo, parseDateKey, programDay } from '../../lib/plan';
import { isPaused, repeatLabel, upcomingRoundStart } from '../../lib/round';
import { RepeatPicker } from '../../components/RepeatPicker';
import { SHOW_DEBUG, Settings, useApp, useNow } from '../../lib/store';
import { CheckResult, applyNow, checkAndFetch, versionInfo } from '../../lib/updates';
import { ThemePref, spacing, useTheme } from '../../theme';

const MEALS = [
  { key: 'breakfast', label: '아침' },
  { key: 'lunch', label: '점심' },
  { key: 'dinner', label: '저녁' },
] as const;

const THEMES: { key: ThemePref; label: string }[] = [
  { key: 'light', label: '라이트' },
  { key: 'dark', label: '다크' },
  { key: 'system', label: '시스템 설정' },
];

export default function SettingsScreen() {
  const { c } = useTheme();
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

  const save = async (next: Settings) => {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={s.wrap}>
        <View style={s.titleRow}>
          <T size="h1" medium style={{ flex: 1 }}>설정</T>
          <AlertBell />
        </View>

        <Card style={s.list}>
          <Row label="시작 날짜 (1일차)" value={formatDateKo(parseDateKey(st.startDate))} onPress={changeStart} />
        </Card>

        <DetoxCard />

        <View style={{ gap: spacing.sm }}>
          <T size="small" tone="sub" style={s.section}>시간</T>
          <Card style={s.list}>
            {MEALS.map((m) => (
              <View key={m.key}>
                <Row
                  label={m.label}
                  value={timeKo(st.meals[m.key])}
                  onPress={() => pickTime(st.meals[m.key], (v) => save({ ...st, meals: { ...st.meals, [m.key]: v } }))}
                />
                <Divider />
              </View>
            ))}
            <Row label="기본 단식 시작 시간" value={timeKo(st.fastStart)} onPress={() => pickTime(st.fastStart, (v) => save({ ...st, fastStart: v }))} />
          </Card>
          <T size="caption" tone="faint" style={s.section}>
            {busy ? '알람을 다시 예약하는 중…' : `바꾸면 알람이 전부 다시 예약돼요.${count != null ? ` 예약된 알람 ${count}개` : ''}`}
          </T>
        </View>

        <View style={{ gap: spacing.sm }}>
          <T size="small" tone="sub" style={s.section}>화면</T>
          <Card>
            <CardHeader title="테마" icon="theme" />
            <View style={s.pills}>
              {THEMES.map((t) => (
                <Pill key={t.key} label={t.label} selected={app.theme === t.key} onPress={() => app.setTheme(t.key)} />
              ))}
            </View>
          </Card>
        </View>

        <View style={{ gap: spacing.sm }}>
          <T size="small" tone="sub" style={s.section}>알람 권한</T>
          <Card style={s.list}>
            <PermLine label="알림" ok={notif} onFix={async () => { if (await requestNotificationPermission()) await save(st); refresh(); }} />
            <Divider />
            <PermLine label="정확한 시간 알람" ok={exact} onFix={async () => { await requestExactAlarmPermission(); refresh(); }} />
          </Card>
        </View>

        <View style={{ gap: spacing.sm }}>
          <T size="small" tone="sub" style={s.section}>데이터</T>
          <Card style={s.list}>
            <Row label="기록 내보내기 (JSON)" icon="download" onPress={() => exportBackup().catch((e) => Alert.alert('내보내지 못했어요', String(e?.message ?? e)))} />
            <Divider />
            <Row
              label="기록 불러오기"
              icon="upload"
              onPress={() =>
                importBackup()
                  .then(async (raw) => {
                    if (!raw) return;
                    Alert.alert('기록을 불러올까요?', '지금 기록은 불러온 파일 내용으로 바뀌어요.', [
                      { text: '취소', style: 'cancel' },
                      { text: '불러오기', onPress: () => app.importState(raw).then(refresh) },
                    ]);
                  })
                  .catch((e) => Alert.alert('불러오지 못했어요', String(e?.message ?? e)))
              }
            />
          </Card>
        </View>

        <Notice text={SAFETY_NOTICE} />

        {SHOW_DEBUG ? <DebugCard /> : null}

        <VersionCard />
      </ScrollView>
    </SafeAreaView>
  );
}

/** Pause / resume / stop the current round, and the repeat cycle. */
function DetoxCard() {
  const app = useApp();
  const now = useNow();
  const st = app.settings!;
  const day = programDay(st.startDate, now);
  const paused = isPaused(app);
  const running = day >= 1 && day <= PROGRAM_DAYS;
  const next = upcomingRoundStart(app, now);

  const pause = () =>
    Alert.alert('디톡스를 일시정지할까요?', `알람이 모두 멈추고 일차도 ${day}일차에서 멈춰요. 다시 시작하면 ${day}일차부터 이어서 해요.`, [
      { text: '취소', style: 'cancel' },
      { text: '일시정지', onPress: () => app.pause() },
    ]);
  const stop = () =>
    Alert.alert('디톡스를 중단할까요?', '알람이 모두 꺼져요. 지금까지의 기록은 기록 탭의 "지난 디톡스"에 남아요.', [
      { text: '취소', style: 'cancel' },
      { text: '중단하기', style: 'destructive', onPress: () => app.stopRound().then(() => router.replace('/repeat')) },
    ]);

  return (
    <View style={{ gap: spacing.sm }}>
      <T size="small" tone="sub" style={s.section}>디톡스</T>
      <Card style={{ gap: spacing.md }}>
        {running || paused ? (
          <>
            <T size="small" tone="sub">{paused ? `일시정지 중 · ${day}일차에서 멈춰 있어요` : `지금 ${day}일차 진행 중`}</T>
            <View style={s.pills}>
              {paused ? (
                <Button icon="play" label="다시 시작" onPress={() => app.resume()} />
              ) : (
                <Button kind="outline" icon="pause" label="일시정지" onPress={pause} />
              )}
              <Button kind="outline" icon="stop" label="중단하기" onPress={stop} />
            </View>
            <Divider />
          </>
        ) : null}
        <CardHeader title="반복 주기" icon="repeat" right={<T size="small" tone="sub">{repeatLabel(app.repeatMonths)}</T>} />
        <RepeatPicker value={app.repeatMonths} onSelect={(m) => app.chooseRepeat(m)} />
        <T size="caption" tone="faint">
          {next ? `다음 디톡스는 ${formatDateKo(next)}에 시작해요. 3일 전에 알려 드려요.` : '반복을 고르면 4주가 끝난 뒤 다음 디톡스가 자동으로 잡혀요.'}
        </T>
      </Card>
    </View>
  );
}

function Row({ label, value, icon, onPress }: { label: string; value?: string; icon?: 'download' | 'upload'; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} style={s.row} accessibilityRole="button">
      {icon ? <Icon name={icon} size={18} color={c.sub} /> : null}
      <T style={{ flex: 1 }}>{label}</T>
      {value ? <T medium style={{ flexShrink: 1, textAlign: 'right' }}>{value}</T> : null}
      <Icon name="right" size={18} color={c.faint} />
    </Pressable>
  );
}

function PermLine({ label, ok, onFix }: { label: string; ok: boolean | null; onFix: () => void }) {
  const { c } = useTheme();
  return (
    <View style={s.row}>
      <T style={{ flex: 1 }}>{label}</T>
      {ok ? (
        <T medium tone="sub">허용됨</T>
      ) : ok === false ? (
        <Pressable onPress={onFix} style={[s.fix, { backgroundColor: c.accent }]}>
          <T size="small" medium color={c.onAccent}>허용하기</T>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Bottom of settings: current version + manual update check. */
function VersionCard() {
  const v = versionInfo();
  const [state, setState] = useState<'idle' | 'checking' | CheckResult>('idle');
  const msg: Record<string, string> = {
    checking: '확인하는 중…',
    latest: '최신 버전이에요.',
    downloaded: '새로운 버전이 준비됐어요.',
    error: '확인하지 못했어요. 인터넷 연결을 확인해 주세요. 지금 버전은 그대로 쓸 수 있어요.',
    disabled: '개발 모드에서는 업데이트를 확인할 수 없어요.',
  };
  return (
    <Card>
      <CardHeader title="버전 정보" icon="info" right={<T size="small" tone="sub">v{v.appVersion}</T>} />
      <View style={{ gap: 2 }}>
        <T size="small">{v.label}</T>
        <T size="caption" tone="faint">{v.detail}</T>
      </View>
      {state !== 'idle' ? <T size="small" tone="sub">{msg[state]}</T> : null}
      {state === 'downloaded' ? (
        <Button icon="download" label="지금 적용하기" onPress={applyNow} />
      ) : (
        <Button
          kind="outline"
          label="업데이트 확인"
          disabled={state === 'checking'}
          onPress={async () => {
            setState('checking');
            setState(await checkAndFetch());
          }}
        />
      )}
    </Card>
  );
}

/** Debug: the alarms the OS actually has scheduled (type, time, first part of the text). */
function ScheduledList() {
  const [data, setData] = useState<{ permission: boolean; exact: boolean; rows: ScheduledRow[] } | null>(null);
  const [all, setAll] = useState(false);
  const fmt = (at: number | null) => {
    if (at == null) return '-';
    const d = new Date(at);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const rows = data ? (all ? data.rows : data.rows.slice(0, 20)) : [];
  return (
    <View style={{ gap: spacing.sm }}>
      <Button kind="outline" icon="clock" label="예약된 알람 목록 보기" onPress={async () => setData(await listScheduled())} />
      {data ? (
        <View style={{ gap: 4 }}>
          <T size="caption" tone="sub">
            알림 권한 {data.permission ? '허용됨' : '꺼짐'} · 정확한 알람 {data.exact ? '허용됨' : '꺼짐'} · 예약 {data.rows.length}개
          </T>
          {data.rows.length === 0 ? <T size="caption" tone="faint">예약된 알람이 없어요. 알림 권한이 꺼져 있으면 예약되지 않아요.</T> : null}
          {rows.map((r) => (
            <T key={r.id} size="caption" numberOfLines={1}>
              {fmt(r.at)} · {r.type === 'letter' ? '편지' : r.type === 'simple' ? '단순' : '-'} · {r.kind} · {r.text.slice(0, 24)}
            </T>
          ))}
          {data.rows.length > 20 ? <Pill label={all ? '접기' : `전체 ${data.rows.length}개 보기`} onPress={() => setAll(!all)} /> : null}
        </View>
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
    <Card>
      <CardHeader title="디버그 · 날짜 바꿔보기" icon="settings" />
      <T size="small">
        화면 기준 날짜: {formatDateKo(now)} ({day}일차){app.debugOffsetDays ? ` · ${app.debugOffsetDays > 0 ? '+' : ''}${app.debugOffsetDays}일` : ''}
      </T>
      <View style={s.pills}>
        {[-7, -1, 1, 7].map((n) => (
          <Pill key={n} label={n > 0 ? `+${n}` : `${n}`} onPress={() => shift(n)} />
        ))}
        <Pill label="오늘로" onPress={() => app.setDebugOffset(0)} />
      </View>
      <ScheduledList />
      <Button kind="outline" icon="note" label="모든 종류 알람 미리 보내보기" onPress={() => app.previewAllKinds()} />
      <T size="caption" tone="faint">18종류를 5초 뒤부터 4초 간격으로 보내요. 각 문구와 편지봉투를 확인할 수 있어요.</T>
      <Button
        kind="quiet"
        label="전체 초기화 (온보딩부터)"
        onPress={async () => {
          await app.resetAll();
          router.replace('/onboarding');
        }}
      />
      <T size="caption" tone="faint">날짜 이동은 화면에만 적용돼요. 알람은 실제 시간 기준이에요.</T>
    </Card>
  );
}

const s = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  wrap: { padding: spacing.screen, gap: spacing.xl, paddingBottom: 48 },
  list: { gap: 0, paddingVertical: spacing.xs },
  section: { paddingHorizontal: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg, flexWrap: 'wrap' },
  fix: { borderRadius: 999, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs + 2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
