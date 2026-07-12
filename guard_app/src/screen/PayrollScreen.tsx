import { AxiosError } from 'axios';
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
  exportPayrollPdf,
  getPayrollSummary,
  PayrollPeriodType,
  PayrollResponse,
} from '../api/payroll';
import { useAppTheme } from '../theme';
import { AppColors } from '../theme/colors';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function fmtHours(value?: number) {
  return Number(value ?? 0).toFixed(2);
}

function getDefaultStartDate() {
  const date = new Date();
  date.setDate(1);
  return date.toISOString().split('T')[0];
}

function getDefaultEndDate() {
  return new Date().toISOString().split('T')[0];
}

export default function PayrollScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [periodType, setPeriodType] = useState<PayrollPeriodType>('weekly');
  const [payroll, setPayroll] = useState<PayrollResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const params = { startDate, endDate, periodType };

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

  const onExportCsv = async () => {
    if (!validateFilters()) return;

    try {
      setExportingCsv(true);
      await exportPayrollCsv(params);
      Alert.alert('Export ready', 'Payroll CSV export has been generated.');
    } catch (error) {
      handleError(error, 'Failed to export payroll CSV.');
    } finally {
      setExportingCsv(false);
    }
  };

  const onExportPdf = async () => {
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
              ${(payroll.periods ?? [])
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
          </body>
        </html>
      `;

      await exportPayrollPdf(html);
      Alert.alert('Export ready', 'Payroll PDF export has been generated.');
    } catch (error) {
      handleError(error, 'Failed to export payroll PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Payroll</Text>
      <Text style={styles.subText}>Generate payroll summaries and export payroll reports.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Filters</Text>

        <Text style={styles.label}>Start Date</Text>
        <TextInput
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        <Text style={styles.label}>End Date</Text>
        <TextInput
          value={endDate}
          onChangeText={setEndDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        <Text style={styles.label}>Period Type</Text>
        <View style={styles.periodRow}>
          {(['daily', 'weekly', 'monthly'] as PayrollPeriodType[]).map((type) => (
            <Pressable
              key={type}
              onPress={() => setPeriodType(type)}
              style={[styles.periodButton, periodType === type && styles.periodButtonActive]}
            >
              <Text style={[styles.periodText, periodType === type && styles.periodTextActive]}>
                {type}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.primaryButton} onPress={onGeneratePayroll} disabled={loading}>
          <Text style={styles.primaryButtonText}>{loading ? 'Generating...' : 'Generate'}</Text>
        </Pressable>

        <View style={styles.exportRow}>
          <Pressable style={styles.secondaryButton} onPress={onExportCsv} disabled={exportingCsv}>
            <Text style={styles.secondaryButtonText}>
              {exportingCsv ? 'Exporting...' : 'Export CSV'}
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={onExportPdf} disabled={exportingPdf}>
            <Text style={styles.secondaryButtonText}>
              {exportingPdf ? 'Exporting...' : 'Export PDF'}
            </Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.subText}>Loading payroll summary...</Text>
        </View>
      ) : null}

      {payroll ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Summary</Text>

          <Text style={styles.summaryText}>
            Completed Shifts: {payroll.summary.totalCompletedShifts}
          </Text>
          <Text style={styles.summaryText}>
            Total Hours: {fmtHours(payroll.summary.totalHours)}
          </Text>
          <Text style={styles.summaryText}>
            Overtime Hours: {fmtHours(payroll.summary.totalOvertimeHours)}
          </Text>
          <Text style={styles.summaryText}>
            Pending Approval: {payroll.summary.totalPendingApproval}
          </Text>
        </View>
      ) : (
        <Text style={styles.empty}>No payroll summary generated yet.</Text>
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
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontWeight: '900',
    },
    exportRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 10,
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
    loadingBox: {
      alignItems: 'center',
      marginVertical: 16,
    },
    summaryText: {
      color: colors.text,
      fontWeight: '700',
      marginBottom: 8,
    },
    empty: {
      color: colors.muted,
      fontWeight: '700',
      textAlign: 'center',
      marginTop: 12,
    },
  });
