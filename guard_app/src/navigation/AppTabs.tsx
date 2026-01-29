import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screen/HomeScreen';
import ShiftsScreen from '../screen/ShiftsScreen';
import AvailabilityScreen from '../screen/AvailabilityScreen';
import ProfileScreen from '../screen/ProfileScreen';

export type AppTabParamList = {
  Home: undefined;
  Shifts: undefined;
  Availability: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarStyle: { backgroundColor: 'red' },
        tabBarIcon: ({ color, size }) => {
          const name =
            route.name === 'Home'
              ? ('home-outline' as const)
              : route.name === 'Shifts'
                ? ('briefcase-outline' as const)
                : route.name === 'Availability'
                  ? ('calendar-outline' as const)
                  : ('person-outline' as const);

          return <Ionicons name={name} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1E3A8A',
        tabBarInactiveTintColor: '#888',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Shifts" component={ShiftsScreen} />
      <Tab.Screen name="Availability" component={AvailabilityScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
