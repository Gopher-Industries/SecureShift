import { AxiosError } from 'axios';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  exportPayrollCsv,
  getPayrollSummary,
  PayrollPeriodType,
  PayrollResponse,
} from '../api/payroll';
import { useAppTheme } from '../theme';
import { AppColors } from '../theme/colors';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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

function fmtHours(value?: number) {
  return Number(value ?? 0).toFixed(2);
}

export default function PayrollScreen() {
  const { colors } = useAppTheme();
  const s = getStyles(colors);

  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [periodType, setPeriodType] = useState<PayrollPeriodType>('weekly');
  const [payroll, setPayroll] = useState<PayrollResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const validateFilters = () => {
    if (!startDate || !endDate) {
      Alert.alert('Missing dates', 'Please enter both start date and end date.');
      return false;
    }

    if (!DATE_REGEX.test(startDate) || !DATE_REGEX.test(endDate)) {
      Alert.alert('Invalid date format', 'Dates must be in YYYY-MM-DD format.');
      return false;
    }

    if (new Date(startDate) > new Date(endDate)) {
      Alert.alert('Invalid date range', 'Start date cannot be after end date.');
      return false;
    }

    return true;
  };

  const params = { startDate, endDate, periodType };

  const handleError = (error: unknown, fallback: string) => {
    if (error instanceof AxiosError) {
      Alert.alert('Error', error.response?.data?.message ?? error.message ?? fallback);
      return;
    }

    Alert.alert('Error', error instanceof Error ? error.message : fallback);
  };

  const onGeneratePayroll = async () => {
    if (!validateFilters()) return;

    try {
      setLoading(true);
      const data = await getPayrollSummary(params);
      setPayroll(data);
    } catch (error) {
      handleError(error, 'Failed to load payroll summary.');
    } finally {
      setLoading(false);
    }
  };

  const onExportPayroll = async () => {
    if (!validateFilters()) return;

    try {
      setExporting(true);
      await exportPayrollCsv(params);
      Alert.alert('Export ready', 'Payroll CSV export has been generated.');
    } catch (error) {
      handleError(error, 'Failed to export payroll CSV.');
    } finally {
      setExporting(false);
    }
  };

  const onExportPayrollPdf = async () => {
    if (!payroll) {
      Alert.alert('No payroll data', 'Please generate payroll before exporting PDF.');
      return;
    }

    try {
      setExportingPdf(true);

      const html = `
      <html>
        <body style="font-family: Arial; padding: 24px;">
          <h1>Payroll Summary</h1>
          <p><strong>Date Range:</strong> ${startDate} to ${endDate}</p>
          <p><strong>Period Type:</strong> ${periodType}</p>

          <h2>Summary</h2>
          <ul>
            <li>Completed Shifts: ${payroll.summary.totalCompletedShifts}</li>
            <li>Total Hours: ${fmtHours(payroll.summary.totalHours)}</li>
            <li>Overtime Hours: ${fmtHours(payroll.summary.totalOvertimeHours)}</li>
            <li>Pending Approval: ${payroll.summary.totalPendingApproval}</li>
          </ul>

          <h2>Period Breakdown</h2>
          <table border="1" cellspacing="0" cellpadding="8" width="100%">
            <tr>
              <th>Period</th>
              <th>Shifts</th>
              <th>Total Hours</th>
              <th>Overtime</th>
              <th>Pending</th>
            </tr>
            ${payroll.periods
              .map(
                (period) => `
                  <tr>
                    <td>${period.periodLabel}</td>
                    <td>${period.totalShifts}</td>
                    <td>${fmtHours(period.totalHours)}</td>
                    <td>${fmtHours(period.overtimeHours)}</td>
                    <td>${period.pendingApproval}</td>
                  </tr>
                `,
              )
              .join('')}
          </table>

          <h2>Guard Breakdown</h2>
          <table border="1" cellspacing="0" cellpadding="8" width="100%">
            <tr>
              <th>Guard</th>
              <th>Shifts</th>
              <th>Total Hours</th>
              <th>Overtime</th>
              <th>Pending</th>
            </tr>
            ${payroll.guards
              .map(
                (guard) => `
                  <tr>
                    <td>${guard.guardName ?? 'Unnamed Guard'}</td>
                    <td>${guard.totalShifts}</td>
                    <td>${fmtHours(guard.totalHours)}</td>
                    <td>${fmtHours(guard.overtimeHours)}</td>
                    <td>${guard.pendingApproval}</td>
                  </tr>
                `,
              )
              .join('')}
          </table>
        </body>
      </html>
    `;

      const { uri } = await Print.printToFileAsync({ html });

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Export Payroll PDF',
        UTI: 'com.adobe.pdf',
      });

      Alert.alert('Export ready', 'Payroll PDF export has been generated.');
    } catch (error) {
      handleError(error, 'Failed to export payroll PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.heading}>Payroll</Text>
      <Text style={s.subText}>Generate payroll summaries and export payroll data as CSV.</Text>

      <View style={s.card}>
        <Text style={s.cardTitle}>Filters</Text>

        <Text style={s.label}>Start Date</Text>
        <TextInput
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.muted}
          style={s.input}
        />

        <Text style={s.label}>End Date</Text>
        <TextInput
          value={endDate}
          onChangeText={setEndDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.muted}
          style={s.input}
        />

        <Text style={s.label}>Period Type</Text>
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
          <Pressable
            style={[s.primaryButton, loading && s.buttonDisabled]}
            onPress={onGeneratePayroll}
            disabled={loading}
          >
            <Text style={s.primaryButtonText}>{loading ? 'Generating...' : 'Generate'}</Text>
          </Pressable>

          <Pressable
            style={[s.secondaryButton, exporting && s.buttonDisabled]}
            onPress={onExportPayroll}
            disabled={exporting}
          >
            <Text style={s.secondaryButtonText}>{exporting ? 'Exporting...' : 'Export CSV'}</Text>
          </Pressable>

          <Pressable
            style={[s.secondaryButton, exportingPdf && s.buttonDisabled]}
            onPress={onExportPayrollPdf}
            disabled={exportingPdf}
          >
            <Text style={s.secondaryButtonText}>
              {exportingPdf ? 'Exporting...' : 'Export PDF'}
            </Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.subText}>Loading payroll summary...</Text>
        </View>
      ) : null}

      {payroll ? (
        <>
          <View style={s.card}>
            <Text style={s.cardTitle}>Summary</Text>

            <View style={s.grid}>
              <View style={s.statBox}>
                <Text style={s.statValue}>{payroll.summary.totalCompletedShifts}</Text>
                <Text style={s.statLabel}>Completed Shifts</Text>
              </View>

              <View style={s.statBox}>
                <Text style={s.statValue}>{fmtHours(payroll.summary.totalHours)}</Text>
                <Text style={s.statLabel}>Total Hours</Text>
              </View>

              <View style={s.statBox}>
                <Text style={s.statValue}>{fmtHours(payroll.summary.totalOvertimeHours)}</Text>
                <Text style={s.statLabel}>Overtime Hours</Text>
              </View>

              <View style={s.statBox}>
                <Text style={s.statValue}>{payroll.summary.totalPendingApproval}</Text>
                <Text style={s.statLabel}>Pending Approval</Text>
              </View>
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Period Breakdown</Text>
            {payroll.periods.length ? (
              payroll.periods.map((period) => (
                <View key={period.periodLabel} style={s.listRow}>
                  <View>
                    <Text style={s.rowTitle}>{period.periodLabel}</Text>
                    <Text style={s.rowSub}>{period.totalShifts} shifts</Text>
                  </View>
                  <Text style={s.rowValue}>{fmtHours(period.totalHours)} hrs</Text>
                </View>
              ))
            ) : (
              <Text style={s.empty}>No period data available.</Text>
            )}
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Guard Breakdown</Text>
            {payroll.guards.length ? (
              payroll.guards.map((guard) => (
                <View key={String(guard.guardId ?? guard.guardName)} style={s.listRow}>
                  <View>
                    <Text style={s.rowTitle}>{guard.guardName ?? 'Unnamed Guard'}</Text>
                    <Text style={s.rowSub}>{guard.totalShifts} shifts</Text>
                  </View>
                  <Text style={s.rowValue}>{fmtHours(guard.totalHours)} hrs</Text>
                </View>
              ))
            ) : (
              <Text style={s.empty}>No guard payroll data available.</Text>
            )}
          </View>
        </>
      ) : (
        <Text style={s.empty}>No payroll summary generated yet.</Text>
      )}
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
      paddingBottom: 28,
    },
    heading: {
      fontSize: 26,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 6,
    },
    subText: {
      color: colors.muted,
      fontWeight: '600',
      marginBottom: 14,
    },
    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 16,
      padding: 16,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '900',
      marginBottom: 12,
    },
    label: {
      color: colors.text,
      fontWeight: '800',
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.bg,
      borderColor: colors.border,
      borderRadius: 10,
      borderWidth: 1,
      color: colors.text,
      marginBottom: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    periodRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
    },
    periodButton: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      flex: 1,
      paddingVertical: 10,
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
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      flex: 1,
      paddingVertical: 12,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontWeight: '900',
    },
    secondaryButton: {
      alignItems: 'center',
      borderColor: colors.primary,
      borderRadius: 12,
      borderWidth: 1,
      flex: 1,
      paddingVertical: 12,
    },
    secondaryButtonText: {
      color: colors.primary,
      fontWeight: '900',
    },
    buttonDisabled: {
      opacity: 0.65,
    },
    loadingBox: {
      alignItems: 'center',
      marginVertical: 16,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    statBox: {
      backgroundColor: colors.bg,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      padding: 12,
      width: '48%',
    },
    statValue: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '900',
    },
    statLabel: {
      color: colors.muted,
      fontWeight: '700',
      marginTop: 4,
    },
    listRow: {
      alignItems: 'center',
      borderTopColor: colors.border,
      borderTopWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    rowTitle: {
      color: colors.text,
      fontWeight: '900',
    },
    rowSub: {
      color: colors.muted,
      fontWeight: '700',
      marginTop: 2,
    },
    rowValue: {
      color: colors.primary,
      fontWeight: '900',
    },
    empty: {
      color: colors.muted,
      fontWeight: '700',
      textAlign: 'center',
      marginTop: 12,
    },
  });
