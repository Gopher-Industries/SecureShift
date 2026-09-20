import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../theme';

import AllTab from './shifts/AllTab';
import AppliedTab from './shifts/AppliedTab';
import CompletedTab from './shifts/CompletedTab';

// Re-exported for backward compatibility (and unit tests). The implementations
// now live in utils/shiftMappers.ts (GA-021 refactor).
export { mapMineShifts, mapCompleted, mapAllShifts } from '../utils/shiftMappers';

const Top = createMaterialTopTabNavigator();

export default function ShiftsScreen() {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Top.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.primarySoft,
          borderRadius: 12,
          marginHorizontal: 16,
          marginTop: 12,
          marginBottom: 8,
        },
        tabBarIndicatorStyle: {
          backgroundColor: colors.primary,
          height: '100%',
          borderRadius: 12,
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          textTransform: 'none',
          fontSize: 14,
        },
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Top.Screen name="All" component={AllTab} options={{ tabBarLabel: t('shifts.all') }} />
      <Top.Screen
        name="Applied"
        component={AppliedTab}
        options={{ tabBarLabel: t('shifts.applied') }}
      />
      <Top.Screen
        name="Completed"
        component={CompletedTab}
        options={{ tabBarLabel: t('shifts.completed') }}
      />
    </Top.Navigator>
  );
}
