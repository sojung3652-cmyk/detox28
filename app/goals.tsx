import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { T } from '../components/ui';
import { PROGRAM_DAYS, WEEKS } from '../data/program';
import { programDay, weekOfDay } from '../lib/plan';
import { useApp, useNow } from '../lib/store';
import { radius, spacing, useTheme } from '../theme';

export default function Goals() {
  const { c } = useTheme();
  const app = useApp();
  const now = useNow();
  const day = app.settings ? programDay(app.settings.startDate, now) : 0;
  const current = day < 1 ? 0 : day > PROGRAM_DAYS ? 5 : weekOfDay(day);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={s.wrap}>
        <Pressable accessibilityRole="button" accessibilityLabel="뒤로" onPress={() => router.back()} style={s.back} hitSlop={12}>
          <Icon name="left" />
        </Pressable>
        <T size="h1" medium>4주 목표</T>
        {WEEKS.map((w) => {
          const isCur = w.week === current;
          const done = w.week < current;
          const bg = isCur ? c.goalBg : c.card;
          const fg = isCur ? c.goalText : c.text;
          return (
            <View key={w.week} style={[s.card, { backgroundColor: bg }]}>
              <View style={s.head}>
                <T size="caption" medium color={isCur ? c.goalLabel : c.sub} style={{ flex: 1 }}>
                  {w.week}주차{isCur ? ' · 이번 주' : ''}
                </T>
                {done ? (
                  <View style={[s.done, { backgroundColor: c.badgeBg }]}>
                    <Icon name="check" size={14} color={c.badgeText} />
                    <T size="caption" medium color={c.badgeText}>완료</T>
                  </View>
                ) : null}
              </View>
              <T size="title" medium color={fg}>{w.title}</T>
              <T color={isCur ? c.goalText : done ? c.sub : c.text}>{w.goal}</T>
              <T size="small" color={isCur ? c.goalLabel : c.faint}>{w.summary}</T>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: spacing.screen, gap: spacing.lg, paddingBottom: 48 },
  back: { width: 40, height: 40, justifyContent: 'center' },
  card: { borderRadius: radius.card, padding: spacing.xl, gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  done: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
});
