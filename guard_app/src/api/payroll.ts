import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import http, { API_BASE_URL, API_PATH } from '../lib/http';
import { LocalStorage } from '../lib/localStorage';

export type PayrollPeriodType = 'daily' | 'weekly' | 'monthly';

export type PayrollSummaryParams = {
  startDate: string;
  endDate: string;
  periodType: PayrollPeriodType;
};

export type PayrollSummary = {
  totalCompletedShifts: number;
  totalAttendanceRecords: number;
  totalGuards: number;
  totalHours: number;
  totalOvertimeHours: number;
  totalPendingApproval: number;
};

export type PayrollResponse = {
  message: string;
  summary: PayrollSummary;
  guards: {
    guardId: string | null;
    guardName: string | null;
    totalShifts: number;
    totalHours: number;
    overtimeHours: number;
    underworkedShifts: number;
    pendingApproval: number;
  }[];
  periods: {
    periodLabel: string;
    totalShifts: number;
    totalHours: number;
    overtimeHours: number;
    underworkedShifts: number;
    pendingApproval: number;
  }[];
};

export async function getPayrollSummary(params: PayrollSummaryParams) {
  const { data } = await http.get<PayrollResponse>('/payroll', { params });
  return data;
}

export async function exportPayrollCsv(params: PayrollSummaryParams) {
  const token = await LocalStorage.getToken();

  const searchParams = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
    periodType: params.periodType,
  }).toString();

  const url = `${API_BASE_URL}${API_PATH}/payroll/export?${searchParams}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  if (!response.ok) {
    throw new Error('Failed to export payroll CSV');
  }

  if (Platform.OS === 'web') {
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = `payroll-export-${params.startDate}-to-${params.endDate}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(downloadUrl);
    return;
  }

  const csvContent = await response.text();
  const fileUri = `${FileSystem.Paths.cache.uri}payroll-export-${params.startDate}-to-${params.endDate}.csv`;

  const file = new FileSystem.File(fileUri);
  await file.write(csvContent);

  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Payroll CSV',
    UTI: 'public.comma-separated-values-text',
  });
}

export async function exportPayrollPdf(html: string) {
  const { uri } = await Print.printToFileAsync({ html });

  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Export Payroll PDF',
    UTI: 'com.adobe.pdf',
  });
}
