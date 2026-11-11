import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { parseAction, registerActionTask, setupCategories } from '../lib/actions';
import { LetterHost } from '../components/LetterHost';
import { AppProvider, useApp } from '../lib/store';
import { ThemeProvider, fonts, useTheme } from '../theme';
import '../lib/notifications'; // registers the foreground notification handler

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    [fonts.regular]: require('../assets/fonts/Pretendard-Regular.ttf'),
    [fonts.medium]: require('../assets/fonts/Pretendard-Medium.ttf'),
  });
  return (
    <SafeAreaProvider>
      <AppProvider>
        <ActionBridge />
        <Themed>{fontsLoaded ? <LetterHost><Nav /></LetterHost> : null}</Themed>
      </AppProvider>
    </SafeAreaProvider>
  );
}

/** Notification buttons pressed while the app is open go through the store (background presses use the task). */
function ActionBridge() {
  const { recordAction } = useApp();
  const record = useRef(recordAction);
  record.current = recordAction;
  useEffect(() => {
    if (Platform.OS === 'web') return;
    setupCategories().catch(() => {});
    registerActionTask();
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const parsed = parseAction(res);
      if (!parsed) return;
      record.current(parsed);
      if (parsed.notificationId) Notifications.dismissNotificationAsync(parsed.notificationId).catch(() => {});
    });
    return () => sub.remove();
  }, []);
  return null;
}

function Themed({ children }: { children: React.ReactNode }) {
  const { theme } = useApp();
  return <ThemeProvider pref={theme}>{children}</ThemeProvider>;
}

function Nav() {
  const { c, scheme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: c.bg } }} />
    </View>
  );
}
