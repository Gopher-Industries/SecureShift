// src/screen/TimesheetDetailsScreen.tsx
import { RouteProp, useRoute } from '@react-navigation/native';
import { AxiosError } from 'axios';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

import { getTimesheetById, type Timesheet } from '../api/timesheets';
import LoadingState from '../components/LoadingState';
import { useAppTheme } from '../theme';
import { formatHours, formatShiftDate, formatTimesheetDateTime } from '../utils/timesheet';

import type { RootStackParamList } from '../navigation/AppNavigator';
import type { AppColors } from '../theme/colors';

type ScreenRouteProp = RouteProp<RootStackParamList, 'TimesheetDetails'>;

export default function TimesheetDetailsScreen() {
  const route = useRoute<ScreenRouteProp>();
  const { colors } = useAppTheme();
  const s = getStyles(colors);
  const { t } = useTranslation();

  const { timesheetId } = route.params;

  const [loading, setLoading] = useState(true);
  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const data = await getTimesheetById(timesheetId);
      setTimesheet(data);
    } catch (e: unknown) {
      let msg = t('timesheet.detailError');

      if (e instanceof AxiosError) {
        msg = e?.response?.data?.message ?? e?.message ?? msg;
      } else if (e instanceof Error) {
        msg = e.message;
      }

      setTimesheet(null);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [timesheetId]);

  const onRetry = async () => {
    setLoading(true);
    await load();
  };

  if (loading) {
    return <LoadingState rows={2} />;
  }

  if (error || !timesheet) {
    return (
      <View style={s.center}>
        <Text style={s.errorTitle}>{t('timesheet.detailError')}</Text>
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={onRetry}>
          <Text style={s.retryText}>{t('timesheet.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.card}>
        <Text style={s.title}>{formatShiftDate(timesheet.shiftDate)}</Text>

        <View style={s.row}>
          <Text style={s.label}>{t('timesheet.checkIn')}</Text>
          <Text style={s.value}>{formatTimesheetDateTime(timesheet.checkInTime)}</Text>
        </View>

        <View style={s.row}>
          <Text style={s.label}>{t('timesheet.checkOut')}</Text>
          <Text style={s.value}>{formatTimesheetDateTime(timesheet.checkOutTime)}</Text>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.title}>{t('timesheet.hoursBreakdown')}</Text>

        <View style={s.row}>
          <Text style={s.label}>{t('timesheet.scheduled')}</Text>
          <Text style={s.value}>
            {formatHours(timesheet.scheduledHours)} {t('timesheet.hrs')}
          </Text>
        </View>

        <View style={s.row}>
          <Text style={s.label}>{t('timesheet.actual')}</Text>
          <Text style={s.value}>
            {formatHours(timesheet.actualHours)} {t('timesheet.hrs')}
          </Text>
        </View>

        <View style={s.row}>
          <Text style={s.label}>{t('timesheet.payable')}</Text>
          <Text style={s.value}>
            {formatHours(timesheet.payableHours)} {t('timesheet.hrs')}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    content: {
      padding: 16,
    },

    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: colors.bg,
    },

    errorTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },

    errorText: {
      color: colors.muted,
      textAlign: 'center',
      marginBottom: 16,
    },

    retryBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
    },

    retryText: {
      color: colors.white,
      fontWeight: '700',
    },

    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },

    title: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 10,
    },

    row: {
      flexDirection: 'row',
      marginBottom: 6,
    },

    label: {
      width: 95,
      fontWeight: '700',
      color: colors.text,
    },

    value: {
      flex: 1,
      color: colors.muted,
    },
  });
