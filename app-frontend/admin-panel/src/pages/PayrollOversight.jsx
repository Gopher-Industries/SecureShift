import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import LoadingComponent from '../components/LoadingComponent';
import { useToast } from '../components/Toast';
import {
  approvePayroll,
  exportPayroll,
  getPayroll,
  getTimesheets,
  processPayroll,
} from '../service/adminAPI';
import { useTheme } from '../theme/ThemeProvider';
import {
  approvableIds,
  canApprove,
  canProcess,
  formatHours,
  formatMoney,
  formatPeriod,
  processableIds,
  statusMeta,
} from '../utils/payroll';

const iso = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
};

export default function PayrollOversight() {
  const { colors } = useTheme();
  const ui = {
    toolbar: {
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap',
      alignItems: 'flex-end',
      marginBottom: 16,
    },
    field: { display: 'flex', flexDirection: 'column', gap: 4 },
    label: { fontSize: 12, color: colors.muted, fontWeight: 600 },
    input: {
      border: `1px solid ${colors.border}`,
      borderRadius: 4,
      padding: '8px 10px',
      fontSize: 14,
      background: colors.white,
      color: colors.black,
    },
    cards: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 },
    card: {
      background: colors.card,
      border: `1px solid ${colors.border}`,
      borderRadius: 8,
      padding: '12px 16px',
      minWidth: 130,
    },
    cardValue: { fontSize: 20, fontWeight: 700, color: colors.text },
    cardLabel: { fontSize: 12, color: colors.muted, marginTop: 2 },
    tabs: { display: 'flex', gap: 8, marginBottom: 16 },
  };

  function StatusBadge({ status }) {
    const meta = statusMeta(status);
    return (
      <span
        style={{
          background: `${meta.color}22`,
          color: meta.color,
          borderRadius: 12,
          padding: '2px 10px',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {meta.label}
      </span>
    );
  }

  const { showToast } = useToast();

  const [startDate, setStartDate] = useState(daysAgo(30));
  const [endDate, setEndDate] = useState(daysAgo(0));
  const [periodType, setPeriodType] = useState('weekly');
  const [statusFilter, setStatusFilter] = useState('');

  const [tab, setTab] = useState('payroll');
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshFlag, setRefreshFlag] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { startDate, endDate, periodType };
      const [payroll, ts] = await Promise.all([
        getPayroll(params),
        getTimesheets({ startDate, endDate }).catch(() => ({ timesheets: [] })),
      ]);
      setSummary(payroll?.summary ?? null);
      setRows(Array.isArray(payroll?.payroll) ? payroll.payroll : []);
      const tsList = Array.isArray(ts) ? ts : (ts?.timesheets ?? ts?.items ?? []);
      setTimesheets(tsList);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, periodType]);

  useEffect(() => {
    load();
  }, [load, refreshFlag]);

  const visibleRows = useMemo(
    () => (statusFilter ? rows.filter((r) => r.status === statusFilter) : rows),
    [rows, statusFilter]
  );

  const pendingCount = useMemo(() => rows.filter(canApprove).length, [rows]);
  const approvedCount = useMemo(() => rows.filter(canProcess).length, [rows]);

  const runApprove = async (selected) => {
    const ids = approvableIds(selected);
    if (!ids.length) {
      showToast('Select at least one pending record to approve.', 'error');
      return;
    }
    try {
      await approvePayroll(ids);
      showToast(`Approved ${ids.length} payroll record(s).`, 'success');
      setRefreshFlag((f) => !f);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Approve failed.', 'error');
    }
  };

  const runProcess = async (selected) => {
    const ids = processableIds(selected);
    if (!ids.length) {
      showToast('Select at least one approved record to process.', 'error');
      return;
    }
    try {
      await processPayroll(ids);
      showToast(`Processed ${ids.length} payroll record(s).`, 'success');
      setRefreshFlag((f) => !f);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Process failed.', 'error');
    }
  };

  const handleExport = async (format) => {
    try {
      const blob = await exportPayroll(format, { startDate, endDate, periodType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-${startDate}_to_${endDate}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast('Export failed.', 'error');
    }
  };

  const payrollColumns = [
    { key: 'guard', header: 'Guard', render: (r) => r.guard?.name || '—' },
    {
      key: 'period',
      header: 'Period',
      render: (r) => formatPeriod(r.periodStart, r.periodEnd),
    },
    {
      key: 'totalPayableHours',
      header: 'Payable',
      render: (r) => formatHours(r.totalPayableHours),
    },
    {
      key: 'totalOvertimeHours',
      header: 'Overtime',
      render: (r) => formatHours(r.totalOvertimeHours),
    },
    { key: 'totalAmount', header: 'Amount', render: (r) => formatMoney(r.totalAmount) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  const timesheetColumns = [
    {
      key: 'shiftDate',
      header: 'Date',
      render: (r) => (r.shiftDate ? new Date(r.shiftDate).toLocaleDateString() : '—'),
    },
    {
      key: 'checkInTime',
      header: 'Check In',
      render: (r) =>
        r.checkInTime
          ? new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '—',
    },
    {
      key: 'checkOutTime',
      header: 'Check Out',
      render: (r) =>
        r.checkOutTime
          ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '—',
    },
    { key: 'scheduledHours', header: 'Scheduled', render: (r) => formatHours(r.scheduledHours) },
    { key: 'actualHours', header: 'Actual', render: (r) => formatHours(r.actualHours) },
    { key: 'payableHours', header: 'Payable', render: (r) => formatHours(r.payableHours) },
  ];

  const bulkActions = [
    { key: 'approve', label: 'Approve selected', onClick: runApprove },
    { key: 'process', label: 'Process selected', variant: 'danger', onClick: runProcess },
  ];

  return (
    <div>
      <h1>Payroll &amp; Timesheet Oversight</h1>

      <div style={ui.toolbar}>
        <div style={ui.field}>
          <span style={ui.label}>From</span>
          <input
            type="date"
            style={ui.input}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div style={ui.field}>
          <span style={ui.label}>To</span>
          <input
            type="date"
            style={ui.input}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div style={ui.field}>
          <span style={ui.label}>Period</span>
          <select
            style={ui.input}
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div style={ui.field}>
          <span style={ui.label}>Status</span>
          <select
            style={ui.input}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="PROCESSED">Processed</option>
          </select>
        </div>
        <Button type="button" onClick={() => handleExport('csv')}>
          Export CSV
        </Button>
        <Button type="button" variant="secondary" onClick={() => handleExport('pdf')}>
          Export PDF
        </Button>
      </div>

      {summary && (
        <div style={ui.cards}>
          <div style={ui.card}>
            <div style={ui.cardValue}>{summary.count ?? rows.length}</div>
            <div style={ui.cardLabel}>Records</div>
          </div>
          <div style={ui.card}>
            <div style={ui.cardValue}>{formatHours(summary.totalPayableHours)}</div>
            <div style={ui.cardLabel}>Payable hours</div>
          </div>
          <div style={ui.card}>
            <div style={ui.cardValue}>{formatHours(summary.totalOvertimeHours)}</div>
            <div style={ui.cardLabel}>Overtime hours</div>
          </div>
          <div style={ui.card}>
            <div style={ui.cardValue}>{formatMoney(summary.totalAmount)}</div>
            <div style={ui.cardLabel}>Total amount</div>
          </div>
          <div style={ui.card}>
            <div style={{ ...ui.cardValue, color: colors.warning }}>{pendingCount}</div>
            <div style={ui.cardLabel}>Pending approval</div>
          </div>
          <div style={ui.card}>
            <div style={{ ...ui.cardValue, color: colors.primary }}>{approvedCount}</div>
            <div style={ui.cardLabel}>Awaiting processing</div>
          </div>
        </div>
      )}

      <div style={ui.tabs}>
        <Button
          type="button"
          variant={tab === 'payroll' ? 'primary' : 'secondary'}
          onClick={() => setTab('payroll')}
        >
          Payroll
        </Button>
        <Button
          type="button"
          variant={tab === 'timesheets' ? 'primary' : 'secondary'}
          onClick={() => setTab('timesheets')}
        >
          Timesheets
        </Button>
      </div>

      {loading ? (
        <LoadingComponent />
      ) : error ? (
        <p style={{ color: colors.danger }}>{error}</p>
      ) : tab === 'payroll' ? (
        <DataTable
          columns={payrollColumns}
          rows={visibleRows}
          empty="No payroll records for this range"
          selectable
          bulkActions={bulkActions}
        />
      ) : (
        <DataTable
          columns={timesheetColumns}
          rows={timesheets}
          empty="No timesheets for this range"
        />
      )}
    </div>
  );
}
