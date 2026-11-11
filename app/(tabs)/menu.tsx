import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { Badge, Pill, T } from '../../components/ui';
import { MenuCategory, MenuItem, POST_FAST_NOTE, menusOf, snacksForWeek } from '../../data/menus';
import { PROGRAM_DAYS } from '../../data/program';
import { activeFasts, dinnerTypeOf, programDay, sameDay, weekOfDay } from '../../lib/plan';
import { useApp, useNow } from '../../lib/store';
import { radius, spacing, useTheme } from '../../theme';

const TABS: { key: MenuCategory; label: string }[] = [
  { key: 'lowcarb', label: '탄수화물 X' },
  { key: 'normal', label: '일반식' },
  { key: 'snack', label: '간식' },
  { key: 'postfast', label: '단식 후 첫 끼' },
];

export default function MenuScreen() {
  const { c } = useTheme();
  const app = useApp();
  const now = useNow();
  const st = app.settings!;
  const rawDay = programDay(st.startDate, now);
  const day = Math.min(PROGRAM_DAYS, Math.max(1, rawDay));
  const week = weekOfDay(day);

  // Pick the tab that fits today: fast ends today → post-fast; low-carb dinner → low-carb; else normal.
  const [tab, setTab] = useState<MenuCategory>(() => {
    const fasts = activeFasts({ startDate: st.startDate, fastStart: st.fastStart, overrides: app.fastOverrides, stopped: app.stoppedFasts });
    if (fasts.some((f) => sameDay(f.end, now))) return 'postfast';
    return dinnerTypeOf(st.startDate, day) === 'lowcarb' ? 'lowcarb' : 'normal';
  });
  const [open, setOpen] = useState<string | null>(null);

  const guide: Record<MenuCategory, string> = {
    lowcarb: '오늘 저녁은 탄수화물 없이 가볍게 먹어요.',
    normal: '밥은 반 공기, 단백질과 채소는 넉넉히 먹어요.',
    snack: `${week}주차에 먹기 좋은 간식이에요. 양은 조금만요.`,
    postfast: POST_FAST_NOTE,
  };
  const items = tab === 'snack' ? snacksForWeek(week) : menusOf(tab);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={s.wrap}>
        <View style={s.titleRow}>
          <T size="h1" medium style={{ flex: 1 }}>메뉴</T>
          <Pressable accessibilityRole="button" onPress={() => router.push('/shopping')} style={[s.shop, { borderColor: c.lineSoft, backgroundColor: c.card }]}>
            <Icon name="cart" size={16} />
            <T size="small" medium>장보기</T>
          </Pressable>
        </View>

        <View style={s.pills}>
          {TABS.map((t) => (
            <Pill key={t.key} label={t.label} selected={tab === t.key} onPress={() => { setTab(t.key); setOpen(null); }} />
          ))}
        </View>

        <T tone="sub">{guide[tab]}</T>

        {items.map((m) => (
          <MenuCard key={m.id} item={m} open={open === m.id} onPress={() => setOpen(open === m.id ? null : m.id)} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuCard({ item, open, onPress }: { item: MenuItem; open: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Animated.View layout={LinearTransition.duration(200)} style={[s.card, { backgroundColor: c.card }]}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onPress} style={{ gap: spacing.sm }}>
        <View style={s.cardHead}>
          <T medium style={{ flex: 1 }}>{item.name}</T>
          <Icon name={open ? 'down' : 'right'} size={18} color={c.faint} />
        </View>
        <View style={s.meta}>
          <View style={s.metaItem}>
            <Icon name="clock" size={14} color={c.sub} />
            <T size="caption" tone="sub">{item.minutes}분</T>
          </View>
          {item.fromWeek > 1 && item.category !== 'postfast' ? <Badge label={`${item.fromWeek}주차~`} /> : null}
        </View>
        <T size="small" tone="sub">{item.ingredients.join(' · ')}</T>
      </Pressable>
      {open ? (
        <Animated.View entering={FadeIn.duration(220)} style={[s.steps, { borderTopColor: c.line }]}>
          {item.steps.map((stp, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: spacing.md }}>
              <T size="small" medium tone="faint">{i + 1}</T>
              <T size="small" style={{ flex: 1 }}>{stp}</T>
            </View>
          ))}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { padding: spacing.screen, gap: spacing.lg, paddingBottom: 48 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  shop: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: { borderRadius: radius.card, padding: spacing.xl, gap: spacing.md },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  steps: { borderTopWidth: 1, paddingTop: spacing.md, gap: spacing.sm },
});
