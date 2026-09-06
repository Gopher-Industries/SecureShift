import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import {
  getAuditLogs,
  getMessages,
  getPendingGuards,
  getShifts,
  getUsers,
} from '../service/adminAPI';

jest.mock('../service/adminAPI');

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>
  );

const mockSuccessfulDashboard = () => {
  getUsers.mockResolvedValue({ total: 24, users: [] });
  getPendingGuards.mockResolvedValue({ count: 3, guards: [] });
  getShifts.mockResolvedValue({ shifts: [{ _id: 'shift-1' }, { _id: 'shift-2' }] });
  getMessages.mockResolvedValue({ messages: [], pagination: { total: 18 } });
  getAuditLogs.mockResolvedValue({
    logs: [
      {
        _id: 'log-1',
        action: 'LOGIN_SUCCESS',
        timestamp: '2026-08-31T01:00:00.000Z',
        user: { name: 'Local Admin', role: 'admin' },
      },
    ],
  });
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads real endpoint totals and recent activity', async () => {
    mockSuccessfulDashboard();

    renderDashboard();

    expect(screen.getByText('Loading dashboard data…')).toBeInTheDocument();

    expect(await screen.findByText('24')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('Login Success')).toBeInTheDocument();
    expect(screen.getByText(/Local Admin · admin/i)).toBeInTheDocument();

    expect(getUsers).toHaveBeenCalledWith({ page: 1, limit: 1 });
    expect(getPendingGuards).toHaveBeenCalledWith({ status: 'pending' });
    expect(getShifts).toHaveBeenCalledWith();
    expect(getMessages).toHaveBeenCalledWith({ page: 1, limit: 1 });
    expect(getAuditLogs).toHaveBeenCalledWith({ page: 1, limit: 8 });
  });

  it('keeps successful sections visible when one endpoint fails', async () => {
    mockSuccessfulDashboard();
    getPendingGuards.mockRejectedValue(new Error('Guard endpoint unavailable'));

    renderDashboard();

    expect(await screen.findByRole('alert')).toHaveTextContent('Some data is unavailable');
    expect(screen.getByRole('alert')).toHaveTextContent('Pending guard reviews');
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Login Success')).toBeInTheDocument();
  });

  it('shows an empty activity state when no audit events exist', async () => {
    mockSuccessfulDashboard();
    getAuditLogs.mockResolvedValue({ logs: [] });

    renderDashboard();

    expect(await screen.findByText('No recent activity has been recorded.')).toBeInTheDocument();
  });

  it('retries failed dashboard requests', async () => {
    getUsers.mockRejectedValueOnce(new Error('Unavailable'));
    getPendingGuards.mockRejectedValueOnce(new Error('Unavailable'));
    getShifts.mockRejectedValueOnce(new Error('Unavailable'));
    getMessages.mockRejectedValueOnce(new Error('Unavailable'));
    getAuditLogs.mockRejectedValueOnce(new Error('Unavailable'));

    mockSuccessfulDashboard();

    renderDashboard();

    expect(await screen.findByText('Dashboard data is unavailable.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(getUsers).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('24')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard data is unavailable.')).not.toBeInTheDocument();
  });
});
