import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { ComponentRef, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { Icon } from '../components/Icon';
import { Button, T } from '../components/ui';
import { dateOfDay, formatDateKo } from '../lib/plan';
import { upcomingRoundStart } from '../lib/round';
import { RepeatPicker } from '../components/RepeatPicker';
import { dayKeys, fastStats, fmtWeight, ratioOn, streaks, toUnit, weightSeries } from '../lib/stats';
import { useApp, useNow } from '../lib/store';
import { radius, spacing, useTheme } from '../theme';

export default function Complete() {
  const { c } = useTheme();
  const app = useApp();
  const now = useNow();
  const shot = useRef<ComponentRef<typeof View>>(null);
  const [saving, setSaving] = useState(false);
  if (!app.settings) return null;

  const keys = dayKeys(app);
  const fasts = fastStats(app, now);
  const { longest } = streaks(app, now);
  const avg = Math.round((keys.reduce((a, k) => a + ratioOn(app, k), 0) / keys.length) * 100);
  const fullDays = keys.filter((k) => ratioOn(app, k) >= 1).length;
  const w = weightSeries(app);
  const unit = app.weightUnit;
  const next = upcomingRoundStart(app, now);
  const diff = w.length >= 2 ? toUnit(w[w.length - 1].lb, unit) - toUnit(w[0].lb, unit) : null;

  const save = async () => {
    setSaving(true);
    try {
      const uri = await captureRef(shot, { format: 'png', quality: 1, result: 'tmpfile' });
      const perm = await requestPermissionsAsync(true);
      if (perm.granted) {
        await Asset.create(uri);
        Alert.alert('저장했어요', '사진 앱에서 볼 수 있어요.');
      } else if (await Sharing.isAvailableAsync()) {
        // No gallery permission: fall back to the share sheet so the image can still be kept.
        await Sharing.shareAsync(uri, { mimeType: 'image/png' });
      }
    } catch (e: any) {
      Alert.alert('저장하지 못했어요', String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={s.wrap}>
        <Pressable accessibilityRole="button" accessibilityLabel="뒤로" onPress={() => router.back()} style={s.back} hitSlop={12}>
          <Icon name="left" />
        </Pressable>

        {/* This view is what gets saved as an image. */}
        <View ref={shot} collapsable={false} style={[s.summary, { backgroundColor: c.goalBg }]}>
          <T size="caption" medium color={c.goalLabel}>28일 루틴 완주</T>
          <T size="h1" medium color={c.goalText}>4주 동안{'\n'}정말 수고했어요</T>
          <T size="small" color={c.goalLabel}>
            {formatDateKo(dateOfDay(app.settings.startDate, 1))} – {formatDateKo(dateOfDay(app.settings.startDate, 28))}
          </T>
          <View style={[s.grid, { borderTopColor: c.goalLabel }]}>
            <Stat label="완료한 단식" value={`${fasts.done}회`} />
            <Stat label="최장 연속 기록" value={`${longest}일`} />
            <Stat label="루틴 평균" value={`${avg}%`} />
            <Stat label="루틴 100% 날" value={`${fullDays}일`} />
            <Stat
              label="체중 변화"
              value={diff == null ? '기록 없음' : `${diff > 0 ? '+' : ''}${diff.toFixed(1)} ${unit}`}
              sub={w.length >= 2 ? `${fmtWeight(w[0].lb, unit)} → ${fmtWeight(w[w.length - 1].lb, unit)}` : undefined}
            />
          </View>
        </View>

        <View style={[s.repeat, { backgroundColor: c.card }]}>
          <T medium>다음 디톡스도 정해진 주기마다 반복할까요?</T>
          <RepeatPicker value={app.repeatAsked ? app.repeatMonths : null} onSelect={(m) => app.chooseRepeat(m)} />
          {app.repeatAsked ? (
            <T size="small" tone="sub">
              {next ? `다음 디톡스는 ${formatDateKo(next)}에 시작해요. 3일 전에 알려 드릴게요.` : '반복하지 않아요. 설정에서 언제든 바꿀 수 있어요.'}
            </T>
          ) : null}
        </View>

        {Platform.OS !== 'web' ? <Button icon="image" label={saving ? '저장하는 중…' : '이미지로 저장'} disabled={saving} onPress={save} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  const { c } = useTheme();
  return (
    <View style={s.stat}>
      <T size="caption" color={c.goalLabel}>{label}</T>
      <T size="title" medium color={c.goalText}>{value}</T>
      {sub ? <T size="caption" color={c.goalLabel}>{sub}</T> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { padding: spacing.screen, gap: spacing.xl, paddingBottom: 48 },
  back: { width: 40, height: 40, justifyContent: 'center' },
  summary: { borderRadius: radius.card, padding: spacing.xl, gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.lg, rowGap: spacing.lg, marginTop: spacing.sm },
  repeat: { borderRadius: radius.card, padding: spacing.xl, gap: spacing.md },
  stat: { flexBasis: '50%', flexGrow: 1, gap: 2, paddingRight: spacing.md },
});
