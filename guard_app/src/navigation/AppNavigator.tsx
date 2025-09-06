// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screen/loginscreen';
import SignupScreen from '../screen/signupscreen';
import AppTabs from './AppTabs';
import SettingsScreen from '../screen/SettingsScreen';
import MessagesScreen from '../screen/MessagesScreen';
import NotificationsScreen from '../screen/NotificationsScreen';
import ShiftDetails from '../screen/ShiftDetails';

export type Shift = {
  id: string;
  title: string;
  date: string;         // e.g. "10-08-2025"
  time: string;         // e.g. "9:00 AM – 5:00 PM"
  pay: number;          // e.g. 200
  location?: string;
  notes?: string;
};

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  AppTabs: undefined;
  Settings: undefined;
  Messages: undefined;
  Notifications: undefined;
  ShiftDetails: { shift: Shift };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Sign Up' }} />
      <Stack.Screen name="AppTabs" component={AppTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />

      {/* New routes */}
      <Stack.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="ShiftDetails"
        component={ShiftDetails}
        options={{ title: 'Shift Details' }}
      />
    </Stack.Navigator>
  );
}
