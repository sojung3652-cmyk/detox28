import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useApp } from '../lib/store';
import { fonts, radius, useTheme } from '../theme';
import { Icon } from './Icon';
import { T } from './ui';

/** Letters + simple alarms that arrived after the 알림함 was last opened. */
export function useNewAlertCount() {
  const app = useApp();
  const seen = app.alertsSeenAt;
  return app.inbox.filter((e) => e.at > seen).length + app.alarmLog.filter((e) => e.at > seen).length;
}

/** Bell at the top right of every tab: opens the 알림함, with a count of what is new. */
export function AlertBell() {
  const { c } = useTheme();
  const n = useNewAlertCount();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={n ? `알림함, 새 알림 ${n}개` : '알림함'}
      onPress={() => router.push('/alerts')}
      hitSlop={8}
      style={[s.btn, { borderColor: c.lineSoft, backgroundColor: c.card }]}
    >
      <Icon name="bell" size={18} />
      {n ? (
        <View style={[s.badge, { backgroundColor: c.accent, borderColor: c.bg }]}>
          <T size="caption" color={c.onAccent} style={s.num}>
            {n > 99 ? '99+' : n}
          </T>
        </View>
      ) : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { width: 38, height: 38, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -5, right: -6, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: 10, lineHeight: 13, fontFamily: fonts.medium },
});
