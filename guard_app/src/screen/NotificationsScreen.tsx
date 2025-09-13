// guard_app/src/screen/NotificationsScreen.tsx
import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import LegacyNotifications from './notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export default function NotificationsScreen(props: Props) {
  return <LegacyNotifications {...props} />;
}
