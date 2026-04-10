import './src/theme/unistyles';
import { registerBackgroundHandler } from './src/services/notification.background';
import 'expo-router/entry';

// Register Notifee background handler at top level
// (notification.background uses dynamic imports to avoid Unistyles init race)
registerBackgroundHandler();
