import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { ColorValue, View } from 'react-native';
import { Icon, IconName } from '../../components/Icon';
import { useApp } from '../../lib/store';
import { fonts, useTheme } from '../../theme';

const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ color }: { color: ColorValue }) => <Icon name={icon} color={String(color)} size={22} />,
});

export default function TabsLayout() {
  const { loaded, settings } = useApp();
  const { c } = useTheme();
  // Every tab assumes settings exist. Guard here so a deep link before storage loads,
  // or a reset while a tab is mounted, can't render a tab with null settings.
  if (!loaded) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  if (!settings) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.faint,
        tabBarAllowFontScaling: false,
        tabBarLabelStyle: { fontSize: 12, fontFamily: fonts.medium },
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.line, borderTopWidth: 1, elevation: 0, minHeight: 62, paddingTop: 6 },
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen name="today" options={tab('오늘', 'home')} />
      <Tabs.Screen name="menu" options={tab('메뉴', 'menu')} />
      <Tabs.Screen name="record" options={tab('기록', 'record')} />
      <Tabs.Screen name="settings" options={tab('설정', 'settings')} />
    </Tabs>
  );
}
