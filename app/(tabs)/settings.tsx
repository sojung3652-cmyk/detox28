import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { Button, Card, CardHeader, Divider, Notice, Pill, T } from '../../components/ui';
import { SAFETY_NOTICE } from '../../data/program';
import { exportBackup, importBackup } from '../../lib/backup';
import {
  hasExactAlarmPermission,
  hasNotificationPermission,
  requestExactAlarmPermission,
  requestNotificationPermission,
  scheduledCount,
} from '../../lib/notifications';
import { pickDate, pickTime, timeKo } from '../../lib/pickers';
import { formatDateKo, parseDateKey, programDay } from '../../lib/plan';
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
        <T size="h1" medium>설정</T>

        <Card style={s.list}>
          <Row label="시작 날짜 (1일차)" value={formatDateKo(parseDateKey(st.startDate))} onPress={changeStart} />
        </Card>

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
  wrap: { padding: spacing.screen, gap: spacing.xl, paddingBottom: 48 },
  list: { gap: 0, paddingVertical: spacing.xs },
  section: { paddingHorizontal: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg, flexWrap: 'wrap' },
  fix: { borderRadius: 999, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs + 2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
