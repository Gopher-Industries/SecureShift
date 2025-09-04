// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screen/loginscreen';      // keep your current casing/paths
import SignupScreen from '../screen/signupscreen';
import AppTabs from './AppTabs';
import SettingsScreen from '../screen/SettingsScreen';
import HomeScreen from '../screen/HomeScreen';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  HomeScreen: undefined;
  AppTabs: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Sign Up' }} />
      <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AppTabs" component={AppTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}
