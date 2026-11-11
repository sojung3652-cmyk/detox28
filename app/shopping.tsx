import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { Card, CheckRow, Pill, T } from '../components/ui';
import { PROGRAM_DAYS, SHOPPING } from '../data/program';
import { programDay, weekOfDay } from '../lib/plan';
import { useApp, useNow } from '../lib/store';
import { spacing, useTheme } from '../theme';

export default function Shopping() {
  const { c } = useTheme();
  const app = useApp();
  const now = useNow();
  const day = app.settings ? programDay(app.settings.startDate, now) : 1;
  const [week, setWeek] = useState<1 | 2 | 3 | 4>(weekOfDay(Math.min(PROGRAM_DAYS, Math.max(1, day))) as 1 | 2 | 3 | 4);
  const items = SHOPPING[week];
  const checked = app.shopping[week] ?? [];
  const sections = [...new Set(items.map((i) => i.section))];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={s.wrap}>
        <Pressable accessibilityRole="button" accessibilityLabel="뒤로" onPress={() => router.back()} style={s.back} hitSlop={12}>
          <Icon name="left" />
        </Pressable>
        <View style={s.title}>
          <T size="h1" medium style={{ flex: 1 }}>장보기</T>
          <T tone="sub">{checked.filter((id) => items.some((i) => i.id === id)).length} / {items.length}</T>
        </View>
        <View style={s.pills}>
          {([1, 2, 3, 4] as const).map((w) => (
            <Pill key={w} label={`${w}주차`} selected={week === w} onPress={() => setWeek(w)} />
          ))}
        </View>
        {sections.map((sec) => (
          <Card key={sec} style={{ gap: spacing.xs }}>
            <T size="small" tone="sub">{sec}</T>
            {items
              .filter((i) => i.section === sec)
              .map((i) => (
                <CheckRow key={i.id} label={i.ko} detail={i.en} checked={checked.includes(i.id)} onToggle={() => app.toggleShopping(week, i.id)} />
              ))}
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: spacing.screen, gap: spacing.lg, paddingBottom: 48 },
  back: { width: 40, height: 40, justifyContent: 'center' },
  title: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.md },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
