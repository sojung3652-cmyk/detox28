import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useApp } from '../lib/store';
import { C } from '../lib/theme';

export default function Gate() {
  const { loaded, settings } = useApp();
  if (!loaded) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  return <Redirect href={settings ? '/today' : '/onboarding'} />;
}
