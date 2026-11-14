// 알림함: every letter and simple alarm that went off, newest first, grouped by day.
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Icon, IconName } from '../components/Icon';
import { useLetters } from '../components/LetterHost';
import { Card, Divider, Pill, T } from '../components/ui';
import { LABELS, MessageKind, TITLES } from '../data/notifications';
import { InboxEntry, Letter, letterRef } from '../lib/letters';
import { formatDateKo } from '../lib/plan';
import { useApp } from '../lib/store';
import { envelope as E, spacing, useTheme } from '../theme';

const PAGE = 60;

type Item = { kind: 'letter'; e: InboxEntry } | { kind: 'simple'; e: Letter };

const hhmm = (at: number) => {
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const MEAL_KINDS: string[] = ['breakfast', 'lunch', 'dinnerNoCarb', 'dinnerNormal', 'week1Day4Lunch'];
const iconOf = (k: MessageKind): IconName =>
  k === 'water' ? 'water' : k.startsWith('fast') ? 'timer' : MEAL_KINDS.includes(k) ? 'menu' : k.startsWith('streak') ? 'trophy' : 'bell';

export default function AlertsScreen() {
  const { c } = useTheme();
  const app = useApp();
  const { openLetter } = useLetters();
  // What counted as new when the screen opened stays marked while it is open.
  const [seenAt] = useState(app.alertsSeenAt);
  const [limit, setLimit] = useState(PAGE);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { markAlertsSeen } = app;
  useEffect(() => {
    markAlertsSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = useMemo<Item[]>(
    () =>
      [...app.inbox.map((e): Item => ({ kind: 'letter', e })), ...app.alarmLog.map((e): Item => ({ kind: 'simple', e }))].sort(
        (a, b) => b.e.at - a.e.at,
      ),
    [app.inbox, app.alarmLog],
  );
  const groups: { day: string; list: Item[] }[] = [];
  for (const it of items.slice(0, limit)) {
    const day = formatDateKo(new Date(it.e.at));
    if (groups[groups.length - 1]?.day !== day) groups.push({ day, list: [] });
    groups[groups.length - 1].list.push(it);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={s.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/today'))}
          hitSlop={10}
        >
          <Icon name="left" size={24} />
        </Pressable>
        <T size="h1" medium style={{ flex: 1 }}>알림함</T>
        <T size="small" tone="sub">{items.length}개</T>
      </View>
      <ScrollView contentContainerStyle={s.wrap}>
        {items.length === 0 ? <T tone="sub">아직 도착한 편지나 알람이 없어요. 알람이 울리면 여기에 모여요.</T> : null}
        {groups.map((g) => (
          <View key={g.day} style={{ gap: spacing.sm }}>
            <T size="small" tone="sub" medium>{g.day}</T>
            <Card style={{ paddingVertical: 0 }}>
              {g.list.map((it, i) => {
                const ref = `${it.kind}:${letterRef(it.e)}`;
                const fresh = it.e.at > seenAt;
                const sealed = it.kind === 'letter' && !it.e.opened;
                const open = expanded === ref;
                return (
                  <View key={ref}>
                    {i > 0 ? <Divider /> : null}
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => (it.kind === 'letter' && sealed ? openLetter(it.e) : setExpanded(open ? null : ref))}
                      style={s.row}
                    >
                      <View style={s.icon}>
                        {it.kind === 'letter' ? (
                          <Svg width={20} height={20} viewBox="0 0 20 20">
                            <Circle cx={10} cy={10} r={9} fill={E.seal} />
                            <Circle cx={10} cy={10} r={6} fill="none" stroke={E.back} strokeOpacity={0.25} strokeWidth={1} />
                          </Svg>
                        ) : (
                          <Icon name={iconOf(it.e.kind)} size={18} color={c.sub} />
                        )}
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={s.head}>
                          <T size="small" medium style={{ flex: 1 }}>
                            {it.kind === 'letter' ? LABELS[it.e.kind] : TITLES[it.e.kind]}
                          </T>
                          <T size="caption" tone="faint">{hhmm(it.e.at)}</T>
                        </View>
                        <T size="small" tone={open ? 'text' : 'sub'} numberOfLines={open ? undefined : 1}>
                          {sealed ? '봉인된 편지 · 눌러서 열어보기' : it.e.text}
                        </T>
                      </View>
                      {fresh || sealed ? <View style={[s.dot, { backgroundColor: c.accent }]} /> : null}
                    </Pressable>
                  </View>
                );
              })}
            </Card>
          </View>
        ))}
        {items.length > limit ? <Pill label="더 보기" onPress={() => setLimit(limit + PAGE)} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.screen, paddingVertical: spacing.md },
  wrap: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxl, gap: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  icon: { width: 24, alignItems: 'center' },
  head: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
