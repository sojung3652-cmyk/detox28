import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { Button, Card, Divider, Notice, T } from '../components/ui';
import { DEFAULT_FAST_START, DEFAULT_MEAL_TIMES, SAFETY_NOTICE } from '../data/program';
import { requestExactAlarmPermission, requestNotificationPermission } from '../lib/notifications';
import { pickDate, pickTime, timeKo } from '../lib/pickers';
import { formatDateKo, parseDateKey } from '../lib/plan';
import { useApp } from '../lib/store';
import { radius, spacing, useTheme } from '../theme';

type TimeKey = 'breakfast' | 'lunch' | 'dinner' | 'fast';
const ROWS: { key: TimeKey; label: string }[] = [
  { key: 'breakfast', label: '아침' },
  { key: 'lunch', label: '점심' },
  { key: 'dinner', label: '저녁' },
  { key: 'fast', label: '단식 시작' },
];

export default function Onboarding() {
  const { c } = useTheme();
  const { saveSettings, lastSettings } = useApp();
  const [step, setStep] = useState(0);
  const [start, setStart] = useState<string | null>(null);
  const [times, setTimes] = useState<Record<TimeKey, string>>(() =>
    // Starting again after a stop: reuse last round's times.
    lastSettings ? { ...lastSettings.meals, fast: lastSettings.fastStart } : { ...DEFAULT_MEAL_TIMES, fast: DEFAULT_FAST_START },
  );
  const [notif, setNotif] = useState<boolean | null>(null);
  const [exact, setExact] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    if (!start) return;
    setSaving(true);
    await saveSettings({
      startDate: start,
      meals: { breakfast: times.breakfast, lunch: times.lunch, dinner: times.dinner },
      fastStart: times.fast,
    });
    router.replace('/today');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={st.wrap}>
        <View style={st.dots}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[st.dot, { backgroundColor: i <= step ? c.accent : c.line }]} />
          ))}
        </View>

        {step === 0 && (
          <>
            <View style={st.hero}>
              <T size="h1" medium style={{ textAlign: 'center' }}>Detox28</T>
              <T tone="sub" style={{ textAlign: 'center' }}>4주 동안 식사, 물, 단식을{'\n'}알람으로 같이 챙길게요.</T>
            </View>
            <Notice text={SAFETY_NOTICE} />
            <Button label="시작하기" onPress={() => setStep(1)} />
          </>
        )}

        {step === 1 && (
          <>
            <T size="h1" medium>언제 시작할까요?</T>
            <T tone="sub">선택한 날이 1일차가 돼요.</T>
            <Pressable onPress={() => pickDate(start, setStart)} style={[st.field, { backgroundColor: c.card }]}>
              <Icon name="record" color={c.sub} />
              <T size="title" tone={start ? 'text' : 'faint'} style={{ flex: 1 }}>
                {start ? formatDateKo(parseDateKey(start)) : '날짜 선택'}
              </T>
              <Icon name="right" color={c.faint} />
            </Pressable>
            <Button label="다음" disabled={!start} onPress={() => setStep(2)} />
            <Button label="이전" kind="quiet" onPress={() => setStep(0)} />
          </>
        )}

        {step === 2 && (
          <>
            <T size="h1" medium>시간을 알려주세요</T>
            <T tone="sub">이 시간에 맞춰 알람이 와요. 설정에서 언제든 바꿀 수 있어요.</T>
            <Card style={{ gap: 0, paddingVertical: spacing.sm }}>
              {ROWS.map((r, i) => (
                <View key={r.key}>
                  {i > 0 ? <Divider /> : null}
                  <Pressable onPress={() => pickTime(times[r.key], (v) => setTimes((p) => ({ ...p, [r.key]: v })))} style={st.timeRow}>
                    <T style={{ flex: 1 }}>{r.label}</T>
                    <T medium>{timeKo(times[r.key])}</T>
                    <Icon name="right" size={18} color={c.faint} />
                  </Pressable>
                </View>
              ))}
            </Card>
            <T size="caption" tone="sub">단식은 단식하는 날 이 시간에 시작해 24시간 이어져요.</T>
            <Button label="다음" onPress={() => setStep(3)} />
            <Button label="이전" kind="quiet" onPress={() => setStep(1)} />
          </>
        )}

        {step === 3 && (
          <>
            <T size="h1" medium>알람을 허용해주세요</T>
            <T tone="sub">알람은 휴대폰 안에서만 예약돼요. 인터넷이 없어도 울려요.</T>
            <Card>
              <PermRow title="알림 허용" desc="식사, 물, 단식 알람을 받으려면 필요해요." state={notif} onPress={async () => setNotif(await requestNotificationPermission())} />
              <Divider />
              <PermRow
                title="정확한 시간에 알람"
                desc="'알람 및 리마인더'에서 허용하면 제시간에 울려요."
                state={exact}
                onPress={async () => setExact(await requestExactAlarmPermission())}
              />
            </Card>
            <Notice text={SAFETY_NOTICE} />
            <Button label={saving ? '준비하는 중…' : '루틴 시작하기'} disabled={saving} onPress={finish} />
            <Button label="이전" kind="quiet" onPress={() => setStep(2)} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PermRow({ title, desc, state, onPress }: { title: string; desc: string; state: boolean | null; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <T medium>{title}</T>
      <T size="small" tone="sub">{desc}</T>
      {state ? (
        <View style={[st.ok, { backgroundColor: c.badgeBg }]}>
          <Icon name="check" size={16} color={c.badgeText} />
          <T size="small" medium color={c.badgeText}>허용됨</T>
        </View>
      ) : (
        <Button kind="outline" label={state === false ? '다시 시도' : '허용하기'} onPress={onPress} />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { padding: spacing.screen, gap: spacing.xl, paddingBottom: 56 },
  dots: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginVertical: spacing.sm },
  dot: { width: 24, height: 4, borderRadius: 2 },
  hero: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  field: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.card, padding: spacing.xl },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  ok: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
});
