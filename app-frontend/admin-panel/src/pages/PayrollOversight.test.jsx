import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PayrollOversight from './PayrollOversight';
import { ToastProvider } from '../components/Toast';
import * as adminAPI from '../service/adminAPI';
import { renderWithTheme } from '../theme/renderWithTheme';

jest.mock('../service/adminAPI');

const payrollResponse = {
  summary: { count: 2, totalPayableHours: 16, totalOvertimeHours: 2, totalAmount: 800 },
  payroll: [
    {
      id: 'p1',
      guard: { id: 'g1', name: 'Alice' },
      periodStart: '2026-09-01',
      periodEnd: '2026-09-07',
      totalPayableHours: 8,
      totalOvertimeHours: 1,
      totalAmount: 400,
      status: 'PENDING',
    },
    {
      id: 'p2',
      guard: { id: 'g2', name: 'Bob' },
      periodStart: '2026-09-01',
      periodEnd: '2026-09-07',
      totalPayableHours: 8,
      totalOvertimeHours: 1,
      totalAmount: 400,
      status: 'APPROVED',
    },
  ],
};

const renderPage = () =>
  renderWithTheme(
    <ToastProvider>
      <PayrollOversight />
    </ToastProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  adminAPI.getPayroll.mockResolvedValue(payrollResponse);
  adminAPI.getTimesheets.mockResolvedValue({ timesheets: [] });
  adminAPI.approvePayroll.mockResolvedValue({});
  adminAPI.processPayroll.mockResolvedValue({});
});

describe('PayrollOversight', () => {
  it('renders summary and payroll rows', async () => {
    renderPage();
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('$800.00')).toBeInTheDocument(); // summary total amount
  });

  it('approves only the selected pending record', async () => {
    renderPage();
    await screen.findByText('Alice');

    // Row 1 = Alice (PENDING). Select it and approve.
    await userEvent.click(screen.getByLabelText('Select row 1'));
    await userEvent.click(screen.getByRole('button', { name: 'Approve selected' }));

    await waitFor(() => expect(adminAPI.approvePayroll).toHaveBeenCalledWith(['p1']));
  });

  it('exports CSV via the API', async () => {
    adminAPI.exportPayroll.mockResolvedValue(new Blob(['x'], { type: 'text/csv' }));
    // jsdom lacks URL.createObjectURL
    window.URL.createObjectURL = jest.fn(() => 'blob:x');
    window.URL.revokeObjectURL = jest.fn();
    renderPage();
    await screen.findByText('Alice');

    await userEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    await waitFor(() =>
      expect(adminAPI.exportPayroll).toHaveBeenCalledWith(
        'csv',
        expect.objectContaining({ periodType: 'weekly' })
      )
    );
  });
});
