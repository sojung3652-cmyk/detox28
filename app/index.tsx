import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useApp } from '../lib/store';
import { useTheme } from '../theme';

export default function Gate() {
  const { loaded, settings, history, repeatAsked } = useApp();
  const { c } = useTheme();
  if (!loaded) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  return <Redirect href={settings ? '/today' : history.length && !repeatAsked ? '/repeat' : '/onboarding'} />;
}
