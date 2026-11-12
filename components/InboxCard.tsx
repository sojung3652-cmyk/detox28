import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LABELS } from '../data/notifications';
import { letterRef } from '../lib/letters';
import { useApp } from '../lib/store';
import { envelope as E, spacing, useTheme } from '../theme';
import { Icon } from './Icon';
import { Card, CardHeader, Divider, Pill, T } from './ui';
import { useLetters } from './LetterHost';

const PAGE = 10;

function when(at: number) {
  const d = new Date(at);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * 받은 편지함: every alarm text received so far, newest first. Folded by default so the record tab stays short.
 * An unopened letter opens with the envelope motion; an already opened one just unfolds its text in place.
 */
export function InboxCard() {
  const { c } = useTheme();
  const app = useApp();
  const { openLetter } = useLetters();
  const [all, setAll] = useState(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const list = [...app.inbox].sort((a, b) => b.at - a.at);
  const unread = list.filter((e) => !e.opened).length;
  const shown = all ? list : list.slice(0, PAGE);

  return (
    <Card>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)}>
        <CardHeader
          title="받은 편지함"
          icon="note"
          right={
            <View style={styles.headRight}>
              <T size="small" tone="sub">{unread ? `안 읽음 ${unread}` : `${list.length}통`}</T>
              <Icon name={open ? 'down' : 'right'} size={18} color={c.faint} />
            </View>
          }
        />
      </Pressable>
      {!open ? null : list.length === 0 ? (
        <T size="small" tone="sub">알람이 오면 여기에 편지로 모여요.</T>
      ) : (
        <View>
          {shown.map((e, i) => (
            <View key={letterRef(e)}>
              {i > 0 ? <Divider /> : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${LABELS[e.kind]} 편지 ${e.opened ? '보기' : '열기'}`}
                onPress={() => (e.opened ? setExpanded(expanded === letterRef(e) ? null : letterRef(e)) : openLetter(e))}
                style={styles.row}
              >
                <View style={styles.icon}>
                  {e.special ? (
                    // Small seal mark for special-day letters.
                    <Svg width={20} height={20} viewBox="0 0 20 20">
                      <Circle cx={10} cy={10} r={9} fill={E.seal} />
                      <Circle cx={10} cy={10} r={6} fill="none" stroke={E.back} strokeOpacity={0.25} strokeWidth={1} />
                    </Svg>
                  ) : (
                    <Icon name="mail" size={18} color={c.sub} />
                  )}
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.head}>
                    <T size="small" medium style={{ flex: 1 }}>{LABELS[e.kind]}</T>
                    <T size="caption" tone="faint">{when(e.at)}</T>
                  </View>
                  <T size="small" tone={expanded === letterRef(e) ? 'text' : 'sub'} numberOfLines={expanded === letterRef(e) ? undefined : 1}>
                    {e.special && !e.opened ? '봉인된 편지 · 눌러서 열어보기' : e.text}
                  </T>
                </View>
                {!e.opened ? <View style={[styles.dot, { backgroundColor: c.accent }]} /> : null}
              </Pressable>
            </View>
          ))}
          {list.length > PAGE ? (
            <View style={{ paddingTop: spacing.sm }}>
              <Pill label={all ? '접기' : `전체 보기 (${list.length})`} onPress={() => setAll(!all)} />
            </View>
          ) : null}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  icon: { width: 24, alignItems: 'center' },
  head: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
