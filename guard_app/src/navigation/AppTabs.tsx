import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screen/HomeScreen';
import ProfileScreen from '../screen/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';

export type AppTabParamList = {
  Home: undefined;
  Shifts: undefined;   // placeholder for later
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

function ShiftsScreen() { return null; } // add later

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: 'home',
            Shifts: 'briefcase-outline',
            Profile: 'person-outline',
          };
          const name = icons[route.name] ?? 'ellipse';
          return <Ionicons name={name as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Shifts" component={ShiftsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
