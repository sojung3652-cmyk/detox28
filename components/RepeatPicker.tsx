import { StyleSheet, View } from 'react-native';
import { REPEAT_OPTIONS } from '../lib/round';
import { spacing } from '../theme';
import { Pill } from './ui';

/** Repeat-cycle choice (반복 안 함 / 3·4·6개월마다 / 매년 / 2년마다). */
export function RepeatPicker({ value, onSelect }: { value: number | null; onSelect: (months: number) => void }) {
  return (
    <View style={s.pills}>
      {REPEAT_OPTIONS.map((o) => (
        <Pill key={o.months} label={o.label} selected={value === o.months} onPress={() => onSelect(o.months)} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
