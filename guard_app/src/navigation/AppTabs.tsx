import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import AvailabilityScreen from '../screen/AvailabilityScreen';
import DocumentsScreen from '../screen/DocumentsScreen';
import HomeScreen from '../screen/HomeScreen';
import ProfileScreen from '../screen/ProfileScreen';
import ShiftsScreen from '../screen/ShiftsScreen';
import TimesheetsScreen from '../screen/TimeSheetsScreen';
import { useAppTheme } from '../theme';

export type AppTabParamList = {
  Home: undefined;
  Shifts: undefined;
  Availability: undefined;
  Documents: undefined;
  Timesheets: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppTabs() {
  const { colors } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTitleStyle: {
          color: colors.text,
        },
        headerTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size }) => {
          const name =
            route.name === 'Home'
              ? ('home-outline' as const)
              : route.name === 'Shifts'
                ? ('briefcase-outline' as const)
                : route.name === 'Availability'
                  ? ('calendar-outline' as const)
                  : route.name === 'Documents'
                    ? ('folder-outline' as const)
                    : route.name === 'Timesheets'
                      ? ('clipboard-outline' as const)
                      : ('person-outline' as const);

          return <Ionicons name={name} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Shifts" component={ShiftsScreen} />
      <Tab.Screen name="Availability" component={AvailabilityScreen} />
      <Tab.Screen name="Documents" component={DocumentsScreen} />
      <Tab.Screen name="Timesheets" component={TimesheetsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
