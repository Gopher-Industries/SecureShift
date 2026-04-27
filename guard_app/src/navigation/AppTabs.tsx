import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: t('tabs.home'), headerTitle: t('tabs.home') }}
      />
      <Tab.Screen
        name="Shifts"
        component={ShiftsScreen}
        options={{ tabBarLabel: t('tabs.shifts'), headerTitle: t('tabs.shifts') }}
      />
      <Tab.Screen
        name="Availability"
        component={AvailabilityScreen}
        options={{ tabBarLabel: t('tabs.availability'), headerTitle: t('tabs.availability') }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{ tabBarLabel: t('tabs.documents'), headerTitle: t('tabs.documents') }}
      />
      <Tab.Screen
        name="Timesheets"
        component={TimesheetsScreen}
        options={{ tabBarLabel: t('tabs.timesheets'), headerTitle: t('tabs.timesheets') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: t('tabs.profile'), headerTitle: t('tabs.profile') }}
      />
    </Tab.Navigator>
  );
}
