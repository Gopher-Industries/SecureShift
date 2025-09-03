// src/navigation/AppTabs.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screen/HomeScreen';
import ProfileScreen from '../screen/ProfileScreen';
import ShiftScreen from '../screen/ShiftScreen';

export type AppTabParamList = {
  Home: undefined;
  Shifts: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ color, size }) => {
          const name =
            route.name === 'Home'
              ? ('home-outline' as const)
              : route.name === 'Shifts'
              ? ('briefcase-outline' as const)
              : ('person-outline' as const);
          return <Ionicons name={name} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1E3A8A',
        tabBarInactiveTintColor: '#888',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Shifts" component={ShiftScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
 