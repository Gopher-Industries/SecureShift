// src/screen/TimesheetsScreen.tsx
import { useFocusEffect } from '@react-navigation/native';
import { AxiosError } from 'axios';
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Pressable,
} from 'react-native';

import { getMyAttendance, type Attendance } from '../api/attendance';
import {
  exportPayrollCsv,
  getPayrollSummary,
  type PayrollPeriodType,
  type PayrollResponse,
} from '../api/payroll';
import { useAppTheme } from '../theme';
import { AppColors } from '../theme/colors';

function toDateInputValue(date: Date) {
  return date.toISOString().split('T')[0];
}

function getDefaultStartDate() {
  const date = new Date();
  date.setDate(1);
  return toDateInputValue(date);
}

function getDefaultEndDate() {
  return toDateInputValue(new Date());
}

function safeDate(d?: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function fmtDateTime(d?: string | null) {
  const dt = safeDate(d);
  if (!dt) return '—';
  return dt.toLocaleString();
}

function fmtHours(value?: number) {
  return Number(value ?? 0).toFixed(2);
}

function fmtShiftLabel(att: Attendance) {
  const s = att.shiftId;

  if (s && typeof s === 'object') {
    const title = s.title ?? 'Shift';
    const date = s.date ? new Date(s.date).toDateString() : '';
    const time = s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : '';
    return [title, date, time].filter(Boolean).join(' • ');
  }

  return `Shift ID: ${String(att.shiftId)}`;
}

export default function TimesheetsScreen() {
  const { colors } = useAppTheme();
  const s = getStyles(colors);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Attendance[]>([]);

  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [periodType, setPeriodType] = useState<PayrollPeriodType>('weekly');
  const [payroll, setPayroll] = useState<PayrollResponse | null>(null);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const payrollParams = {
    startDate,
    endDate,
    periodType,
  };

  const loadPayroll = async () => {
    try {
      setPayrollLoading(true);
      const data = await getPayrollSummary(payrollParams);
      setPayroll(data);
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to load payroll summary';
        Alert.alert('Error', msg);
      } else {
        Alert.alert('Error', 'Failed to load payroll summary');
      }
    } finally {
      setPayrollLoading(false);
    }
  };

  const load = async () => {
    try {
      const rows = await getMyAttendance();
      setItems(rows);
      await loadPayroll();
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to load timesheets';
        Alert.alert('Error', msg);
      } else {
        Alert.alert('Error', 'Failed to load timesheets');
      }
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

  const onApplyPayrollFilter = async () => {
    await loadPayroll();
  };

  const onExportPayroll = async () => {
    try {
      setExporting(true);
      await exportPayrollCsv(payrollParams);
      Alert.alert('Success', 'Payroll CSV export requested successfully.');
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to export payroll CSV';
        Alert.alert('Error', msg);
      } else {
        Alert.alert('Error', e instanceof Error ? e.message : 'Failed to export payroll CSV');
      }
    } finally {
      setExporting(false);
    }
  };

  const renderHeader = () => (
    <View>
      <View style={s.payrollCard}>
        <Text style={s.sectionTitle}>Payroll Summary</Text>

        <View style={s.inputRow}>
          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>Start Date</Text>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              style={s.input}
            />
          </View>

          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>End Date</Text>
            <TextInput
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              style={s.input}
            />
          </View>
        </View>

        <View style={s.periodRow}>
          {(['daily', 'weekly', 'monthly'] as PayrollPeriodType[]).map((type) => (
            <Pressable
              key={type}
              onPress={() => setPeriodType(type)}
              style={[s.periodButton, periodType === type && s.periodButtonActive]}
            >
              <Text style={[s.periodText, periodType === type && s.periodTextActive]}>{type}</Text>
            </Pressable>
          ))}
        </View>

        <View style={s.actionRow}>
          <Pressable style={s.primaryButton} onPress={onApplyPayrollFilter}>
            <Text style={s.primaryButtonText}>
              {payrollLoading ? 'Loading...' : 'Generate Payroll'}
            </Text>
          </Pressable>

          <Pressable style={s.secondaryButton} onPress={onExportPayroll}>
            <Text style={s.secondaryButtonText}>{exporting ? 'Exporting...' : 'Export CSV'}</Text>
          </Pressable>
        </View>

        {payroll ? (
          <View style={s.summaryGrid}>
            <View style={s.summaryBox}>
              <Text style={s.summaryNumber}>{payroll.summary.totalCompletedShifts}</Text>
              <Text style={s.summaryLabel}>Completed Shifts</Text>
            </View>

            <View style={s.summaryBox}>
              <Text style={s.summaryNumber}>{fmtHours(payroll.summary.totalHours)}</Text>
              <Text style={s.summaryLabel}>Total Hours</Text>
            </View>

            <View style={s.summaryBox}>
              <Text style={s.summaryNumber}>{fmtHours(payroll.summary.totalOvertimeHours)}</Text>
              <Text style={s.summaryLabel}>Overtime Hours</Text>
            </View>

            <View style={s.summaryBox}>
              <Text style={s.summaryNumber}>{payroll.summary.totalPendingApproval}</Text>
              <Text style={s.summaryLabel}>Pending Approval</Text>
            </View>
          </View>
        ) : (
          <Text style={s.emptySmall}>No payroll summary loaded yet.</Text>
        )}
      </View>

      <Text style={s.sectionTitle}>Timesheets</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Attendance }) => {
    const checkedIn = !!item.checkInTime;
    const checkedOut = !!item.checkOutTime;

    return (
      <View style={s.card}>
        <Text style={s.title}>{fmtShiftLabel(item)}</Text>

        <View style={s.row}>
          <Text style={s.label}>Check In:</Text>
          <Text style={s.value}>{fmtDateTime(item.checkInTime)}</Text>
        </View>

        <View style={s.row}>
          <Text style={s.label}>Check Out:</Text>
          <Text style={s.value}>{fmtDateTime(item.checkOutTime)}</Text>
        </View>

        <View style={s.rowBetween}>
          <Text style={s.meta}>
            Status:{' '}
            <Text style={checkedIn ? s.ok : s.muted}>
              {checkedOut ? 'Completed' : checkedIn ? 'In progress' : 'Not started'}
            </Text>
          </Text>

          <View style={[s.badge, item.locationVerified ? s.badgeOk : s.badgeWarn]}>
            <Text style={[s.badgeText, item.locationVerified ? s.badgeTextOk : s.badgeTextWarn]}>
              {item.locationVerified ? 'Verified' : 'Not verified'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.loadingText}>Loading timesheets...</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={s.empty}>No timesheet records yet.</Text>}
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
    },

    loadingText: {
      marginTop: 10,
      color: colors.muted,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 12,
    },

    payrollCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },

    inputRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
    },

    inputGroup: {
      flex: 1,
    },

    inputLabel: {
      color: colors.text,
      fontWeight: '800',
      marginBottom: 6,
    },

    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 9,
      color: colors.text,
      backgroundColor: colors.bg,
    },

    periodRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },

    periodButton: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },

    periodButtonActive: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },

    periodText: {
      color: colors.muted,
      fontWeight: '800',
      textTransform: 'capitalize',
    },

    periodTextActive: {
      color: colors.primary,
    },

    actionRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },

    primaryButton: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },

    primaryButtonText: {
      color: '#FFFFFF',
      fontWeight: '900',
    },

    secondaryButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },

    secondaryButtonText: {
      color: colors.primary,
      fontWeight: '900',
    },

    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },

    summaryBox: {
      width: '48%',
      backgroundColor: colors.bg,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },

    summaryNumber: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.text,
    },

    summaryLabel: {
      marginTop: 4,
      color: colors.muted,
      fontWeight: '700',
    },

    empty: {
      textAlign: 'center',
      marginTop: 30,
      color: colors.muted,
    },

    emptySmall: {
      color: colors.muted,
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
      width: 85,
      fontWeight: '700',
      color: colors.text,
    },

    value: {
      flex: 1,
      color: colors.muted,
    },

    rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    meta: {
      marginTop: 8,
      color: colors.text,
      fontWeight: '700',
    },

    ok: {
      color: colors.status.confirmed,
      fontWeight: '800',
    },

    muted: {
      color: colors.muted,
      fontWeight: '800',
    },

    badge: {
      marginTop: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },

    badgeOk: {
      backgroundColor: colors.greenSoft,
    },

    badgeWarn: {
      backgroundColor: colors.primarySoft,
    },

    badgeText: {
      fontWeight: '800',
      fontSize: 12,
    },

    badgeTextOk: {
      color: colors.status.confirmed,
    },

    badgeTextWarn: {
      color: colors.link,
    },
  });
