// src/api/payroll.ts
import http from '../lib/http';

export type PayrollPeriodType = 'daily' | 'weekly' | 'monthly';
export type PayrollStatus = 'PENDING' | 'APPROVED' | 'PROCESSED';
export type PayrollExportFormat = 'csv' | 'pdf';

export interface PayrollEntry {
  shift: string;
  attendance: string | null;
  shiftDate: string;
  scheduledHours: number;
  actualHours: number;
  regularHours: number;
  overtimeHours: number;
  payRate: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
  hasAttendanceRecord: boolean;
  attendanceStatus: 'present' | 'absent' | 'incomplete' | 'scheduled' | 'no_record';
}

export interface PayrollRecord {
  _id: string;
  guard: string;
  period: {
    type: PayrollPeriodType;
    startDate: string;
    endDate: string;
  };
  entries: PayrollEntry[];
  totalScheduledHours: number;
  totalWorkedHours: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  grossPay: number;
  status: PayrollStatus;
  approvedBy?: any;
  approvedAt?: string;
  processedBy?: any;
  processedAt?: string;
  guardName: string;
  guardEmail: string;
  guardRole: string;
  guardDepartment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollSummary {
  totalGuards: number;
  totalWorkedHours: number;
  totalOvertimeHours: number;
  totalGrossPay: number;
}

export interface PayrollResponse {
  period: {
    type: PayrollPeriodType;
    startDate: string;
    endDate: string;
  };
  summary: PayrollSummary;
  records: PayrollRecord[];
}

export interface ShiftAttendanceRecord {
  _id: string;
  shift: string;
  guard: any;
  clockIn: string | null;
  clockOut: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  hoursWorked: number;
  status: 'scheduled' | 'present' | 'incomplete' | 'absent';
  notes?: string;
  recordedBy?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftAttendanceListResponse {
  shiftId: string;
  count: number;
  records: ShiftAttendanceRecord[];
}

/**
 * Retrieve (and generate / refresh) payroll summaries.
 */
export async function getPayroll(params: {
  startDate: string;
  endDate: string;
  periodType: PayrollPeriodType;
  guardId?: string;
  department?: string;
}) {
  const { data } = await http.get<PayrollResponse>('/payroll', { params });
  return data;
}

/**
 * Export payroll data as CSV or PDF.
 * Note: For mobile, you might want to handle the blob or return the URL.
 */
export async function exportPayroll(params: {
  startDate: string;
  endDate: string;
  periodType: PayrollPeriodType;
  format?: PayrollExportFormat;
  guardId?: string;
  department?: string;
  status?: PayrollStatus;
}) {
  const { data } = await http.get('/payroll/export', {
    params,
    responseType: 'blob',
  });
  return data;
}

/**
 * Get attendance records for a specific shift.
 */
export async function getAttendanceForShift(shiftId: string) {
  const { data } = await http.get<ShiftAttendanceListResponse>(`/payroll/attendance/${shiftId}`);
  return data;
}
