import { AxiosError } from 'axios';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  exportPayrollCsv,
  exportPayrollPdf,
  getPayrollSummary,
  PayrollPeriodType,
  PayrollRecord,
  PayrollResponse,
} from '../api/payroll';
import PayrollTrendChart from '../components/chart/PayrollTrendChart';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import { useAppTheme } from '../theme';
import { AppColors } from '../theme/colors';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_CHART_PERIODS = 6;

type TrendPoint = {
  label: string;
  hours: number;
  overtime: number;
  earnings: number;
};

function toNumber(value?: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function fmtHours(value?: number) {
  return toNumber(value).toFixed(2);
}

function fmtMoney(value?: number) {
  return `$${toNumber(value).toFixed(2)}`;
}

// periodStart comes back as UTC, so read the date part instead of the local one
function periodLabel(record: PayrollRecord) {
  const isoDay = String(record.periodStart ?? '').slice(0, 10);
  const parts = isoDay.split('-');

  if (parts.length !== 3) return isoDay;

  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

  if (Number.isNaN(date.getTime())) return isoDay;

  return format(date, record.periodType === 'monthly' ? "MMM ''yy" : 'd MMM');
}

function buildTrend(records: PayrollRecord[]): TrendPoint[] {
  const byPeriod = new Map<string, TrendPoint>();

  for (const record of records) {
    const key = String(record.periodStart ?? '').slice(0, 10);
    const point = byPeriod.get(key) ?? {
      label: periodLabel(record),
      hours: 0,
      overtime: 0,
      earnings: 0,
    };

    point.hours += toNumber(record.totalPayableHours);
    point.overtime += toNumber(record.totalOvertimeHours);
    point.earnings += toNumber(record.totalAmount);
    byPeriod.set(key, point);
  }

  return Array.from(byPeriod.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, point]) => ({
      label: point.label,
      hours: round2(point.hours),
      overtime: round2(point.overtime),
      earnings: round2(point.earnings),
    }))
    .slice(-MAX_CHART_PERIODS);
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
  const records = payroll?.payroll ?? [];
  const trend = buildTrend(records);
  const completedShifts = records.reduce(
    (total, record) => total + (record.entries?.length ?? 0),
    0,
  );
  const pendingPeriods = records.filter((record) => record.status === 'PENDING').length;
  const chartLabels = trend.map((point) => point.label);

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
              <li>Completed Shifts: ${completedShifts}</li>
              <li>Total Hours: ${fmtHours(payroll.summary?.totalPayableHours)}</li>
              <li>Overtime Hours: ${fmtHours(payroll.summary?.totalOvertimeHours)}</li>
              <li>Total Earnings: ${fmtMoney(payroll.summary?.totalAmount)}</li>
              <li>Pending Approval: ${pendingPeriods}</li>
            </ul>

            <h2>Period Breakdown</h2>
            <table border="1" cellspacing="0" cellpadding="8" width="100%">
              <tr>
                <th>Period</th>
                <th>Shifts</th>
                <th>Total Hours</th>
                <th>Overtime</th>
                <th>Earnings</th>
                <th>Status</th>
              </tr>
              ${records
                .map(
                  (record) => `
                    <tr>
                      <td>${periodLabel(record)}</td>
                      <td>${record.entries?.length ?? 0}</td>
                      <td>${fmtHours(record.totalPayableHours)}</td>
                      <td>${fmtHours(record.totalOvertimeHours)}</td>
                      <td>${fmtMoney(record.totalAmount)}</td>
                      <td>${record.status}</td>
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

      {loading ? <LoadingState rows={2} /> : null}

      {payroll ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Summary</Text>

            <Text style={styles.summaryText}>Completed Shifts: {completedShifts}</Text>
            <Text style={styles.summaryText}>
              Total Hours: {fmtHours(payroll.summary?.totalPayableHours)}
            </Text>
            <Text style={styles.summaryText}>
              Overtime Hours: {fmtHours(payroll.summary?.totalOvertimeHours)}
            </Text>
            <Text style={styles.summaryText}>
              Total Earnings: {fmtMoney(payroll.summary?.totalAmount)}
            </Text>
            <Text style={styles.summaryText}>Pending Approval: {pendingPeriods}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Earnings insights</Text>

            {trend.length ? (
              <>
                <Text style={styles.trendNote}>
                  {trend.length === 1
                    ? 'Showing 1 payroll period.'
                    : `Showing the last ${trend.length} payroll periods.`}
                </Text>

                <PayrollTrendChart
                  title="Earnings"
                  labels={chartLabels}
                  values={trend.map((point) => point.earnings)}
                  kind="line"
                  yAxisLabel="$"
                  emptyMessage="No earnings recorded for these periods."
                />

                <PayrollTrendChart
                  title="Hours worked"
                  labels={chartLabels}
                  values={trend.map((point) => point.hours)}
                  kind="bar"
                  yAxisSuffix="h"
                  emptyMessage="No hours recorded for these periods."
                />

                <PayrollTrendChart
                  title="Overtime hours"
                  labels={chartLabels}
                  values={trend.map((point) => point.overtime)}
                  kind="bar"
                  yAxisSuffix="h"
                  emptyMessage="No overtime in these periods."
                />
              </>
            ) : (
              <Text style={styles.summaryText}>No payroll periods found for this date range.</Text>
            )}
          </View>
        </>
      ) : (
        <EmptyState title="No payroll summary generated yet." />
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
    summaryText: {
      color: colors.text,
      fontWeight: '700',
      marginBottom: 8,
    },
    trendNote: {
      color: colors.muted,
      fontWeight: '600',
      marginBottom: 14,
    },
  });
