import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { Card, CardHeader, CheckRow, Pill, T } from '../components/ui';
import { PROGRAM_DAYS, SHOPPING } from '../data/program';
import { programDay, weekOfDay } from '../lib/plan';
import { useApp, useNow } from '../lib/store';
import { MAX_FONT_SCALE, fonts, radius, spacing, type, useTheme } from '../theme';

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
        <MyList />
      </ScrollView>
    </SafeAreaView>
  );
}

/** 내 장보기 리스트: his own items for everyday shopping, kept across weeks and rounds. */
function MyList() {
  const { c } = useTheme();
  const app = useApp();
  const [text, setText] = useState('');
  const add = () => {
    if (!text.trim()) return;
    app.addMyShopping(text);
    setText('');
  };
  const doneCount = app.myShopping.filter((i) => i.done).length;
  return (
    <Card style={{ gap: spacing.sm }}>
      <CardHeader title="내 장보기 리스트" icon="note" right={<T size="small" tone="sub">{app.myShopping.length ? `${doneCount} / ${app.myShopping.length}` : ''}</T>} />
      {app.myShopping.length === 0 ? <T size="small" tone="sub">평소 장볼 것도 여기에 적어 두세요. 주차가 바뀌어도 그대로 남아요.</T> : null}
      {app.myShopping.map((i) => (
        <View key={i.id} style={s.myRow}>
          <View style={{ flex: 1 }}>
            <CheckRow label={i.label} checked={i.done} onToggle={() => app.toggleMyShopping(i.id)} />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`${i.label} 지우기`} onPress={() => app.removeMyShopping(i.id)} hitSlop={10} style={s.del}>
            <Icon name="close" size={18} color={c.faint} />
          </Pressable>
        </View>
      ))}
      <View style={s.addRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={add}
          submitBehavior="submit"
          returnKeyType="done"
          placeholder="리스트 추가"
          placeholderTextColor={c.faint}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          style={[s.input, { color: c.text, backgroundColor: c.inset, fontFamily: fonts.regular, fontSize: type.body }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="추가"
          onPress={add}
          disabled={!text.trim()}
          style={[s.addBtn, { backgroundColor: c.accent, opacity: text.trim() ? 1 : 0.4 }]}
        >
          <Icon name="plus" size={20} color={c.onAccent} />
        </Pressable>
      </View>
      {doneCount ? <Pill label={`체크한 ${doneCount}개 지우기`} onPress={app.clearMyShoppingDone} /> : null}
    </Card>
  );
}

const s = StyleSheet.create({
  myRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  del: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  input: { flex: 1, minWidth: 0, borderRadius: radius.inner, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
  addBtn: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  wrap: { padding: spacing.screen, gap: spacing.lg, paddingBottom: 48 },
  back: { width: 40, height: 40, justifyContent: 'center' },
  title: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.md },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
