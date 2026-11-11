import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Notice, T } from '../../components/ui';
import {
  LOW_CARB_DINNERS,
  Menu,
  NORMAL_DINNERS,
  POST_FAST_MEALS,
  POST_FAST_NOTE,
  PROGRAM_DAYS,
  WEEKS,
} from '../../data/program';
import { programDay, weekOfDay } from '../../lib/plan';
import { useApp, useNow } from '../../lib/store';
import { C, F, R } from '../../lib/theme';

const TABS = [
  { key: 'lowcarb', label: '탄수화물 X' },
  { key: 'normal', label: '일반식' },
  { key: 'snack', label: '간식' },
  { key: 'postfast', label: '단식 후' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

export default function MenuScreen() {
  const app = useApp();
  const now = useNow();
  const day = programDay(app.settings!.startDate, now);
  const currentWeek = weekOfDay(Math.min(PROGRAM_DAYS, Math.max(1, day)));
  const [tab, setTab] = useState<TabKey>('lowcarb');
  const [week, setWeek] = useState(currentWeek);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={s.wrap} stickyHeaderIndices={[1]}>
        <T size={F.h1} weight="800">메뉴 추천</T>
        <View style={{ backgroundColor: C.bg, paddingVertical: 6 }}>
          <Pills items={TABS.map((t) => ({ key: t.key, label: t.label }))} value={tab} onChange={(k) => setTab(k as TabKey)} />
        </View>

        {tab === 'lowcarb' && LOW_CARB_DINNERS.map((m) => <MenuCard key={m.name} menu={m} />)}
        {tab === 'normal' && NORMAL_DINNERS.map((m) => <MenuCard key={m.name} menu={m} />)}
        {tab === 'postfast' && (
          <>
            <Notice text={POST_FAST_NOTE} />
            {POST_FAST_MEALS.map((m) => <MenuCard key={m.name} menu={m} />)}
          </>
        )}
        {tab === 'snack' && (
          <>
            <Pills
              items={WEEKS.map((w) => ({ key: String(w.week), label: `${w.week}주차${w.week === currentWeek ? ' (이번 주)' : ''}` }))}
              value={String(week)}
              onChange={(k) => setWeek(Number(k))}
              small
            />
            <Card>
              {WEEKS[week - 1].snacks.map((sn, i) => (
                <View key={sn.name} style={[s.snackRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.line }]}>
                  <T weight="600">{sn.name}</T>
                  <T size={F.small} color={C.sub}>{sn.store}</T>
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Pills({
  items,
  value,
  onChange,
  small,
}: {
  items: { key: string; label: string }[];
  value: string;
  onChange: (k: string) => void;
  small?: boolean;
}) {
  return (
    <View style={s.pills}>
      {items.map((it) => {
        const on = it.key === value;
        return (
          <Pressable
            key={it.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(it.key)}
            style={[s.pill, on && { backgroundColor: C.pink, borderColor: C.pink }]}
          >
            <T size={small ? F.tiny + 1 : F.small} weight="700" color={on ? C.white : C.text}>{it.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

function MenuCard({ menu }: { menu: Menu }) {
  return (
    <Card>
      <T size={F.h2 - 2} weight="700">{menu.name}</T>
      <T size={F.small} color={C.sub}>{menu.ingredients}</T>
      <View style={{ gap: 6 }}>
        {menu.steps.map((st, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
            <View style={s.num}>
              <T size={F.tiny} weight="700" color="#C9798A">{i + 1}</T>
            </View>
            <T size={F.small} style={{ flex: 1 }}>{st}</T>
          </View>
        ))}
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 18, gap: 14, paddingBottom: 40 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderRadius: R.pill, borderWidth: 1, borderColor: C.pinkSoft, backgroundColor: C.white, paddingHorizontal: 16, paddingVertical: 8 },
  snackRow: { paddingVertical: 10, gap: 2 },
  num: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.pinkFaint, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
});
