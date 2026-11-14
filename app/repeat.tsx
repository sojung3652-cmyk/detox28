// Asked right after stopping a round: repeat the detox on a cycle?
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RepeatPicker } from '../components/RepeatPicker';
import { Button, Card, T } from '../components/ui';
import { formatDateKo, parseDateKey } from '../lib/plan';
import { nextRoundStart } from '../lib/round';
import { useApp } from '../lib/store';
import { spacing, useTheme } from '../theme';

export default function RepeatScreen() {
  const { c } = useTheme();
  const app = useApp();
  const [months, setMonths] = useState<number | null>(null);
  const last = app.history[app.history.length - 1];
  const preview = months && last ? nextRoundStart(last.startDate, months, parseDateKey(last.endDate), new Date()) : null;

  const done = async () => {
    if (months == null) return;
    await app.chooseRepeat(months);
    router.replace('/today');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={s.wrap}>
        <T size="h1" medium>수고했어요</T>
        <T tone="sub">이번 기록은 기록 탭의 &quot;지난 디톡스&quot;에 남겨 뒀어요.</T>
        <Card style={{ gap: spacing.md }}>
          <T medium>다음 디톡스도 정해진 주기마다 반복할까요?</T>
          <RepeatPicker value={months} onSelect={setMonths} />
          {preview ? (
            <T size="small" tone="sub">다음 디톡스는 {formatDateKo(preview)}에 시작해요. 3일 전에 알려 드릴게요.</T>
          ) : months === 0 ? (
            <T size="small" tone="sub">오늘 탭의 '디톡스 시작하기'로 언제든 새로 시작할 수 있어요.</T>
          ) : null}
        </Card>
        <Button label="확인" onPress={done} disabled={months == null} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: spacing.screen, gap: spacing.lg, paddingTop: spacing.xl * 2 },
});
