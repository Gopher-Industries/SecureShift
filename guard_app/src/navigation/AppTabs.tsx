import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import AvailabilityScreen from '../screen/AvailabilityScreen';
import HomeScreen from '../screen/HomeScreen';
import ProfileScreen from '../screen/ProfileScreen';
import ShiftsScreen from '../screen/ShiftsScreen';
import DocumentsScreen from '../screen/DocumentsScreen';

export type AppTabParamList = {
  Home: undefined;
  Shifts: undefined;
  Documents: undefined;
  Availability: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';

          if (route.name === 'Home') {
            iconName = 'home-outline';
          } else if (route.name === 'Shifts') {
            iconName = 'briefcase-outline';
          } else if (route.name === 'Documents') {
            iconName = 'document-text-outline';
          } else if (route.name === 'Availability') {
            iconName = 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1E3A8A',
        tabBarInactiveTintColor: '#888',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Shifts" component={ShiftsScreen} />
      <Tab.Screen name="Documents" component={DocumentsScreen} />
      <Tab.Screen name="Availability" component={AvailabilityScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
