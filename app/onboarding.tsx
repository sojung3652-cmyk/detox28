import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { Button, Card, Notice, T } from '../components/ui';
import { DEFAULT_MEAL_TIMES, SAFETY_NOTICE } from '../data/program';
import { pickDate, pickTime, timeKo } from '../lib/pickers';
import { MealTimes, formatDateKo, parseDateKey } from '../lib/plan';
import { requestExactAlarmPermission, requestNotificationPermission } from '../lib/notifications';
import { useApp } from '../lib/store';
import { C, F, R } from '../lib/theme';

const MEALS: { key: keyof MealTimes; label: string }[] = [
  { key: 'breakfast', label: '아침' },
  { key: 'lunch', label: '점심' },
  { key: 'dinner', label: '저녁' },
];

export default function Onboarding() {
  const { saveSettings } = useApp();
  const [step, setStep] = useState(0);
  const [start, setStart] = useState<string | null>(null);
  const [meals, setMeals] = useState<MealTimes>({ ...DEFAULT_MEAL_TIMES });
  const [notif, setNotif] = useState<boolean | null>(null);
  const [exact, setExact] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    if (!start) return;
    setSaving(true);
    await saveSettings({ startDate: start, meals });
    router.replace('/today');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={s.wrap}>
        <View style={s.dots}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[s.dot, i <= step && { backgroundColor: C.pink }]} />
          ))}
        </View>

        {step === 0 && (
          <>
            <View style={s.hero}>
              <Icon name="heart" size={44} color={C.pink} />
              <T size={F.h1 + 2} weight="800" style={{ textAlign: 'center' }}>
                28일 루틴
              </T>
              <T color={C.sub} style={{ textAlign: 'center' }}>
                4주 동안 매일의 식사, 물, 단식을{'\n'}알람으로 같이 챙길게요.
              </T>
            </View>
            <Notice text={SAFETY_NOTICE} />
            <Button label="시작하기" onPress={() => setStep(1)} />
          </>
        )}

        {step === 1 && (
          <>
            <T size={F.h1} weight="800">언제 시작할까요?</T>
            <T color={C.sub}>선택한 날이 1일차가 돼요.</T>
            <Pressable onPress={() => pickDate(start, setStart)} style={s.field}>
              <Icon name="calendar" color={C.pink} />
              <T size={F.h2} weight="600" color={start ? C.text : C.sub} style={{ flex: 1 }}>
                {start ? formatDateKo(parseDateKey(start)) : '날짜 선택'}
              </T>
              <Icon name="chevron" color={C.sub} />
            </Pressable>
            <Button label="다음" disabled={!start} onPress={() => setStep(2)} />
            <Button label="이전" kind="ghost" onPress={() => setStep(0)} />
          </>
        )}

        {step === 2 && (
          <>
            <T size={F.h1} weight="800">식사 시간을 알려 주세요</T>
            <T color={C.sub}>이 시간에 식사 알람이 와요. 설정에서 언제든 바꿀 수 있어요.</T>
            <Card>
              {MEALS.map((m, i) => (
                <Pressable
                  key={m.key}
                  onPress={() => pickTime(meals[m.key], (v) => setMeals((p) => ({ ...p, [m.key]: v })))}
                  style={[s.timeRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.line }]}
                >
                  <T weight="600" style={{ flex: 1 }}>{m.label}</T>
                  <T size={F.h2} weight="700" color="#C9798A">{timeKo(meals[m.key])}</T>
                  <Icon name="chevron" color={C.sub} size={18} />
                </Pressable>
              ))}
            </Card>
            <Button label="다음" onPress={() => setStep(3)} />
            <Button label="이전" kind="ghost" onPress={() => setStep(1)} />
          </>
        )}

        {step === 3 && (
          <>
            <T size={F.h1} weight="800">알람을 허용해 주세요</T>
            <T color={C.sub}>알람은 휴대폰 안에서만 예약돼요. 인터넷이 없어도 울려요.</T>
            <Card>
              <PermRow
                title="알림 허용"
                desc="식사, 물, 단식 알람을 받으려면 필요해요."
                state={notif}
                onPress={async () => setNotif(await requestNotificationPermission())}
              />
              <View style={{ height: 1, backgroundColor: C.line }} />
              <PermRow
                title="정확한 시간에 알람"
                desc="'알람 및 리마인더' 화면에서 허용하면 알람이 제시간에 울려요."
                state={exact}
                onPress={async () => setExact(await requestExactAlarmPermission())}
              />
            </Card>
            <Notice text={SAFETY_NOTICE} />
            <Button label={saving ? '준비하는 중…' : '루틴 시작하기'} disabled={saving} onPress={finish} />
            <Button label="이전" kind="ghost" onPress={() => setStep(2)} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PermRow({ title, desc, state, onPress }: { title: string; desc: string; state: boolean | null; onPress: () => void }) {
  return (
    <View style={{ gap: 8 }}>
      <T weight="700">{title}</T>
      <T size={F.small} color={C.sub}>{desc}</T>
      {state ? (
        <View style={s.ok}>
          <Icon name="check" size={18} color="#5E8A6E" />
          <T size={F.small} weight="600" color="#5E8A6E">허용됨</T>
        </View>
      ) : (
        <Button kind="soft" label={state === false ? '다시 시도' : '허용하기'} onPress={onPress} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 22, gap: 18, paddingBottom: 48 },
  dots: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginVertical: 8 },
  dot: { width: 28, height: 6, borderRadius: 3, backgroundColor: C.pinkSoft },
  hero: { alignItems: 'center', gap: 12, paddingVertical: 28 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.white,
    borderRadius: R.card,
    padding: 20,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 },
  ok: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.sageSoft, alignSelf: 'flex-start', borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 6 },
});
