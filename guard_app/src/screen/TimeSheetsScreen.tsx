// src/screen/TimesheetsScreen.tsx
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AxiosError } from 'axios';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';

import { getAllMyTimesheets, type Timesheet } from '../api/timesheets';
import { useAppTheme } from '../theme';
import {
  formatHours,
  formatShiftDate,
  formatTimesheetDateTime,
  sumHours,
} from '../utils/timesheet';

import type { RootStackParamList } from '../navigation/AppNavigator';
import type { AppColors } from '../theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TimesheetsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();
  const s = getStyles(colors);
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Timesheet[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const rows = await getAllMyTimesheets();
      setItems(rows);
    } catch (e: unknown) {
      let msg = t('timesheet.error');

      if (e instanceof AxiosError) {
        msg = e?.response?.data?.message ?? e?.message ?? msg;
      } else if (e instanceof Error) {
        msg = e.message;
      }

      setItems([]);
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  const onRetry = async () => {
    setLoading(true);
    await load();
  };

  const renderItem = ({ item }: { item: Timesheet }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => navigation.navigate('TimesheetDetails', { timesheetId: item.id })}
    >
      <Text style={s.title}>{formatShiftDate(item.shiftDate)}</Text>

      <View style={s.row}>
        <Text style={s.label}>{t('timesheet.checkIn')}</Text>
        <Text style={s.value}>{formatTimesheetDateTime(item.checkInTime)}</Text>
      </View>

      <View style={s.row}>
        <Text style={s.label}>{t('timesheet.checkOut')}</Text>
        <Text style={s.value}>{formatTimesheetDateTime(item.checkOutTime)}</Text>
      </View>

      <View style={s.row}>
        <Text style={s.label}>{t('timesheet.hours')}</Text>
        <Text style={s.value}>
          {formatHours(item.actualHours)} {t('timesheet.hrs')}
        </Text>
      </View>

      <View style={s.row}>
        <Text style={s.label}>{t('timesheet.payable')}</Text>
        <Text style={s.value}>
          {formatHours(item.payableHours)} {t('timesheet.hrs')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSummary = () => {
    if (items.length === 0) return null;

    return (
      <View style={s.summary}>
        <Text style={s.summaryTitle}>{t('timesheet.summary')}</Text>

        <View style={s.row}>
          <Text style={s.label}>{t('timesheet.totalShifts')}</Text>
          <Text style={s.value}>{items.length}</Text>
        </View>

        <View style={s.row}>
          <Text style={s.label}>{t('timesheet.actual')}</Text>
          <Text style={s.value}>
            {formatHours(sumHours(items.map((item) => item.actualHours)))} {t('timesheet.hrs')}
          </Text>
        </View>

        <View style={s.row}>
          <Text style={s.label}>{t('timesheet.payable')}</Text>
          <Text style={s.value}>
            {formatHours(sumHours(items.map((item) => item.payableHours)))} {t('timesheet.hrs')}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.loadingText}>{t('timesheet.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.center}>
        <Text style={s.errorTitle}>{t('timesheet.error')}</Text>
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={onRetry}>
          <Text style={s.retryText}>{t('timesheet.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={renderSummary()}
        ListEmptyComponent={<Text style={s.empty}>{t('timesheet.empty')}</Text>}
      />
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: colors.bg,
    },

    loadingText: {
      marginTop: 10,
      color: colors.muted,
    },

    empty: {
      textAlign: 'center',
      marginTop: 30,
      color: colors.muted,
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

    summary: {
      backgroundColor: colors.primarySoft,
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.primary,
    },

    summaryTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 10,
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
      width: 85,
      fontWeight: '700',
      color: colors.text,
    },

    value: {
      flex: 1,
      color: colors.muted,
    },

    listContainer: {
      padding: 16,
    },
  });
