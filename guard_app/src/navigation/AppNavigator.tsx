// src/navigation/AppNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import AppTabs from './AppTabs';
import LoginScreen from '../screen/loginscreen';
import SettingsScreen from '../screen/SettingsScreen';
import SignupScreen from '../screen/signupscreen';
import SplashScreen from '../screen/SplashScreen';
import MessagesScreen from '../screen/MessagesScreen';
import NotificationsScreen from '../screen/NotificationsScreen';

export type RootStackParamList = {
  AppTabs: undefined;
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  Settings: undefined;
  Messages: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AppTabs" component={AppTabs} />
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: true, title: 'Settings' }}
      />
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ headerShown: true, title: 'Messages' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: true, title: 'Notifications' }}
      />
    </Stack.Navigator>
  );
}
