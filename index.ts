// Custom entry: background handlers must be registered when the JS bundle loads, because Android can
// start the app headlessly (notification "먹었어요/마셨어요" buttons, home-screen widget) without any screen.
import { Platform } from 'react-native';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import './lib/actions'; // defines the notification-action TaskManager task
import { widgetTaskHandler } from './widget/handler';
import 'expo-router/entry';

if (Platform.OS === 'android') registerWidgetTaskHandler(widgetTaskHandler);
