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

export type PayrollStatus = 'PENDING' | 'APPROVED' | 'PROCESSED';

export type PayrollSummary = {
  count: number;
  totalScheduledHours: number;
  totalActualHours: number;
  totalPayableHours: number;
  totalOrdinaryHours: number;
  totalOvertimeHours: number;
  totalOrdinaryAmount: number;
  totalOvertimeAmount: number;
  totalAmount: number;
};

export type PayrollEntry = {
  shiftId: string;
  shiftDate: string;
  department: string | null;
  hourlyRate: number;
  scheduledHours: number;
  actualHours: number;
  payableHours: number;
  ordinaryHours: number;
  overtimeHours: number;
  ordinaryAmount: number;
  overtimeAmount: number;
  totalAmount: number;
  attendanceBased: boolean;
};

export type PayrollRecord = {
  id: string;
  guard: { id: string; name: string | null } | null;
  employer: { id: string; name: string | null } | null;
  periodType: PayrollPeriodType;
  periodStart: string;
  periodEnd: string;
  totalScheduledHours: number;
  totalActualHours: number;
  totalPayableHours: number;
  totalOrdinaryHours: number;
  totalOvertimeHours: number;
  totalOrdinaryAmount: number;
  totalOvertimeAmount: number;
  totalAmount: number;
  status: PayrollStatus;
  approvedAt: string | null;
  processedAt: string | null;
  entries: PayrollEntry[];
};

export type PayrollResponse = {
  filters: {
    startDate: string;
    endDate: string;
    periodType: PayrollPeriodType;
    guardId: string | null;
    department: string | null;
  };
  summary: PayrollSummary;
  payroll: PayrollRecord[];
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
