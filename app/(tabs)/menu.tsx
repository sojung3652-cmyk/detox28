import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { Button, Pill, T } from '../../components/ui';
import { MenuCategory, MenuItem, POST_FAST_NOTE, menusFor } from '../../data/menus';
import { PROGRAM_DAYS, WEEKS } from '../../data/program';
import { activeFasts, addedRoutineItems, dinnerTypeOf, programDay, removedRoutineItems, sameDay, weekOfDay } from '../../lib/plan';
import { useApp, useNow } from '../../lib/store';
import { radius, spacing, useTheme } from '../../theme';

const TABS: { key: MenuCategory; label: string }[] = [
  { key: 'lowcarb', label: '탄수화물 X' },
  { key: 'normal', label: '일반식' },
  { key: 'snack', label: '간식' },
  { key: 'postfast', label: '단식 후 첫 끼' },
];

const GUIDE: Record<MenuCategory, string> = {
  lowcarb: '저녁은 탄수화물 없이 가볍게 먹어요.',
  normal: '단백질과 채소는 넉넉히, 곡물은 조금만 먹어요.',
  snack: '배고플 때 조금씩. 양은 작게 먹어요.',
  postfast: POST_FAST_NOTE,
};

export default function MenuScreen() {
  const { c } = useTheme();
  const app = useApp();
  const now = useNow();
  const st = app.settings!;
  const day = Math.min(PROGRAM_DAYS, Math.max(1, programDay(st.startDate, now)));
  const currentWeek = weekOfDay(day);

  // Tab that fits today (only used while viewing the current week):
  // fast ends today → post-fast; low-carb dinner tonight → low-carb; otherwise normal.
  const autoTab = (): MenuCategory => {
    const fasts = activeFasts({ startDate: st.startDate, fastStart: st.fastStart, overrides: app.fastOverrides, stopped: app.stoppedFasts });
    if (fasts.some((f) => sameDay(f.end, now))) return 'postfast';
    return dinnerTypeOf(st.startDate, day) === 'lowcarb' ? 'lowcarb' : 'normal';
  };

  const [week, setWeek] = useState(currentWeek);
  const [tab, setTab] = useState<MenuCategory>(autoTab);
  const [open, setOpen] = useState<string | null>(null);

  const selectWeek = (w: number) => {
    setWeek(w);
    setOpen(null);
    if (w === currentWeek) setTab(autoTab());
  };

  const plan = WEEKS[week - 1];
  const items = menusFor(tab, week);
  const noFastWeek = tab === 'postfast' && WEEKS[week - 1].fastDays.length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={s.wrap}>
        <View style={s.titleRow}>
          <T size="h1" medium style={{ flex: 1 }}>메뉴</T>
          <Pressable accessibilityRole="button" onPress={() => router.push('/shopping')} style={[s.chip, { borderColor: c.lineSoft, backgroundColor: c.card }]}>
            <Icon name="cart" size={16} />
            <T size="small" medium>장보기</T>
          </Pressable>
        </View>

        <View style={{ gap: spacing.md }}>
          <View style={s.weekRow}>
            {WEEKS.map((w) => (
              <WeekChip key={w.week} week={w.week} selected={week === w.week} current={w.week === currentWeek} onPress={() => selectWeek(w.week)} />
            ))}
          </View>
          <T size="small" tone="sub">{plan.week}주차 · {plan.title} — {plan.goal}</T>
          {week !== currentWeek ? (
            <View style={{ alignSelf: 'flex-start' }}>
              <Button kind="outline" icon="left" label="이번 주로 돌아가기" onPress={() => selectWeek(currentWeek)} />
            </View>
          ) : null}
          <RoutineCard week={week} />
        </View>

        <View style={s.row}>
          {TABS.map((t) => (
            <Pill key={t.key} label={t.label} selected={tab === t.key} onPress={() => { setTab(t.key); setOpen(null); }} />
          ))}
        </View>

        {noFastWeek ? (
          <View style={[s.empty, { backgroundColor: c.card }]}>
            <Icon name="info" color={c.sub} />
            <T tone="sub" style={{ flex: 1 }}>1주차는 단식이 없어요. 2주차부터 시작해요.</T>
          </View>
        ) : (
          <>
            <T tone="sub">{GUIDE[tab]}</T>
            {items.map((x) => (
              <MenuCard key={x.id} item={x} open={open === x.id} onPress={() => setOpen(open === x.id ? null : x.id)} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Week chip: four equal chips in one row; the current week gets a small "이번 주" line. */
function WeekChip({ week, selected, current, onPress }: { week: number; selected: boolean; current: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const fg = selected ? c.onAccent : c.text;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={`${week}주차${current ? ', 이번 주' : ''}`}
      onPress={onPress}
      style={[s.week, selected ? { backgroundColor: c.accent, borderColor: c.accent } : { backgroundColor: c.card, borderColor: c.lineSoft }]}
    >
      <T size="small" medium color={fg} numberOfLines={1}>{week}주차</T>
      {current ? (
        <T size="caption" color={selected ? c.goalLabel : c.badgeText} numberOfLines={1} style={{ fontSize: 11, lineHeight: 14 }} allowFontScaling={false}>
          이번 주
        </T>
      ) : null}
    </Pressable>
  );
}

/** This week's daily routine; items new vs. last week get a "새로" tag, dropped ones are listed below. */
function RoutineCard({ week }: { week: number }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const routine = WEEKS[week - 1].routine;
  const added = new Set(addedRoutineItems(week).map((r) => r.id));
  const removed = removedRoutineItems(week);
  return (
    <Animated.View layout={LinearTransition.duration(200)} style={[s.card, { backgroundColor: c.card }]}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={s.cardHead}>
        <T medium style={{ flex: 1 }}>{week}주차 루틴 · {routine.length}개</T>
        {added.size ? <T size="caption" tone="sub">새로 {added.size}개</T> : null}
        <Icon name={open ? 'down' : 'right'} size={18} color={c.faint} />
      </Pressable>
      {open ? (
        <Animated.View entering={FadeIn.duration(220)} style={[s.steps, { borderTopColor: c.line }]}>
          <T size="small" tone="sub" style={{ marginBottom: spacing.xs }}>{WEEKS[week - 1].routineWhy}</T>
          {routine.map((r) => (
            <View key={r.id} style={s.routineRow}>
              <T size="small" style={{ flex: 1 }}>
                {r.label}
                {r.detail ? <T size="small" tone="sub"> · {r.detail}</T> : null}
              </T>
              {added.has(r.id) ? (
                <View style={[s.tag, { backgroundColor: c.badgeBg }]}>
                  <T size="caption" medium color={c.badgeText}>새로</T>
                </View>
              ) : null}
            </View>
          ))}
          {removed.length ? (
            <T size="caption" tone="sub">{week - 1}주차에서 빠진 것: {removed.map((r) => r.label).join(', ')}</T>
          ) : null}
        </Animated.View>
      ) : null}
    </Animated.View>
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
          <Icon name="clock" size={14} color={c.sub} />
          <T size="caption" tone="sub">{item.minutes}분</T>
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
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  weekRow: { flexDirection: 'row', gap: spacing.sm },
  week: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.xs, paddingVertical: spacing.xs },
  empty: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', borderRadius: radius.card, padding: spacing.xl },
  card: { borderRadius: radius.card, padding: spacing.xl, gap: spacing.md },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  routineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 28 },
  tag: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  steps: { borderTopWidth: 1, paddingTop: spacing.md, gap: spacing.sm },
});
