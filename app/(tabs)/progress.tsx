import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, CardTitle, T } from '../../components/ui';
import { DAILY_ROUTINE, PROGRAM_DAYS } from '../../data/program';
import { activeFasts, allFasts, dateKey, dateOfDay, programDay } from '../../lib/plan';
import { useApp, useNow } from '../../lib/store';
import { C, F } from '../../lib/theme';

function fillColor(ratio: number) {
  if (ratio <= 0) return C.white;
  if (ratio < 0.5) return C.pinkFaint;
  if (ratio < 1) return C.pinkSoft;
  return C.pink;
}

export default function Progress() {
  const app = useApp();
  const now = useNow();
  const st = app.settings!;
  const today = programDay(st.startDate, now);

  const ratios = Array.from({ length: PROGRAM_DAYS }, (_, i) => {
    const key = dateKey(dateOfDay(st.startDate, i + 1));
    return (app.checks[key]?.length ?? 0) / DAILY_ROUTINE.length;
  });
  const fullDays = ratios.filter((r) => r >= 1).length;
  const totalFasts = allFasts(st.startDate, st.meals).length;
  const doneFasts = activeFasts(st.startDate, st.meals, app.stoppedFasts).filter((f) => f.end <= now).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={s.wrap}>
        <T size={F.h1} weight="800">진행 현황</T>

        <Card>
          <CardTitle icon="calendar">28일</CardTitle>
          {[0, 1, 2, 3].map((w) => (
            <View key={w} style={{ gap: 6 }}>
              <T size={F.tiny} color={C.sub} weight="600">{w + 1}주차</T>
              <View style={s.grid}>
                {ratios.slice(w * 7, w * 7 + 7).map((r, i) => {
                  const day = w * 7 + i + 1;
                  const future = day > today;
                  const isToday = day === today;
                  return (
                    <View
                      key={day}
                      accessibilityLabel={`${day}일차 루틴 ${Math.round(r * 100)}%`}
                      style={[
                        s.cell,
                        { backgroundColor: future ? 'transparent' : fillColor(r) },
                        future && { borderStyle: 'dashed' },
                        isToday && { borderColor: '#C9798A', borderWidth: 2 },
                      ]}
                    >
                      <T size={F.tiny} weight="700" allowFontScaling={false} color={r >= 1 ? C.white : future ? C.sub : C.text}>
                        {day}
                      </T>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
          <View style={s.legend}>
            {[
              { c: C.white, l: '0%' },
              { c: C.pinkFaint, l: '~50%' },
              { c: C.pinkSoft, l: '~99%' },
              { c: C.pink, l: '100%' },
            ].map((x) => (
              <View key={x.l} style={s.legendItem}>
                <View style={[s.swatch, { backgroundColor: x.c }]} />
                <T size={F.tiny} color={C.sub}>{x.l}</T>
              </View>
            ))}
          </View>
        </Card>

        <View style={s.stats}>
          <Card style={{ flex: 1, minWidth: 140 }}>
            <T size={F.small} color={C.sub}>완료한 단식</T>
            <T size={F.h1 + 4} weight="800">{doneFasts}<T color={C.sub}> / {totalFasts}회</T></T>
          </Card>
          <Card style={{ flex: 1, minWidth: 140 }}>
            <T size={F.small} color={C.sub}>루틴 100% 달성</T>
            <T size={F.h1 + 4} weight="800">{fullDays}<T color={C.sub}>일</T></T>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 18, gap: 14, paddingBottom: 40 },
  grid: { flexDirection: 'row', gap: 6 },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 14, height: 14, borderRadius: 4, borderWidth: 1, borderColor: C.line },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
});
