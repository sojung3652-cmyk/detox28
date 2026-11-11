import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { ColorValue, View } from 'react-native';
import { useApp } from '../../lib/store';
import { Icon, IconName } from '../../components/Icon';
import { C } from '../../lib/theme';

const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ color }: { color: ColorValue }) => <Icon name={icon} color={String(color)} size={24} />,
});

export default function TabsLayout() {
  const { loaded, settings } = useApp();
  // Every tab assumes settings exist. Guard here so a deep link before storage loads,
  // or "전체 초기화" while a tab is mounted, can't render a tab with null settings.
  if (!loaded) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  if (!settings) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#C9798A',
        tabBarInactiveTintColor: C.sub,
        tabBarAllowFontScaling: false,
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
        tabBarStyle: { backgroundColor: C.white, borderTopColor: C.line, minHeight: 64, paddingTop: 6 },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen name="today" options={tab('오늘', 'home')} />
      <Tabs.Screen name="menu" options={tab('메뉴', 'bowl')} />
      <Tabs.Screen name="progress" options={tab('진행', 'calendar')} />
      <Tabs.Screen name="settings" options={tab('설정', 'gear')} />
    </Tabs>
  );
}
