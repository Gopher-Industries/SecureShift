import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import ShiftRequests from './ShiftRequests';
import { getShiftRequests, approveShiftRequest, rejectShiftRequest } from '../api/shiftRequests';

jest.mock('../api/shiftRequests', () => ({
  getShiftRequests: jest.fn(),
  approveShiftRequest: jest.fn(),
  rejectShiftRequest: jest.fn(),
}));

const swapReq = {
  _id: 'r1',
  type: 'SWAP',
  status: 'PENDING',
  requestingGuardId: { name: 'Alice' },
  targetGuardId: { name: 'Bob' },
  originalShiftId: {
    title: 'Night Patrol',
    date: '2026-10-01',
    startTime: '18:00',
    endTime: '02:00',
  },
  reason: 'Family event',
  createdAt: '2026-09-19T10:00:00.000Z',
};

const leaveReq = {
  _id: 'r2',
  type: 'LEAVE',
  status: 'PENDING',
  requestingGuardId: { name: 'Carol' },
  originalShiftId: { title: 'Day Shift', date: '2026-10-05' },
  leaveStartDate: '2026-10-05',
  leaveEndDate: '2026-10-07',
  reason: 'Vacation',
  createdAt: '2026-09-19T11:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  getShiftRequests.mockResolvedValue({ items: [swapReq, leaveReq], total: 2, page: 1, pages: 1 });
  approveShiftRequest.mockResolvedValue({ message: 'Shift request approved' });
  rejectShiftRequest.mockResolvedValue({ message: 'Shift request rejected' });
});

test('lists pending swap and leave requests from the API', async () => {
  render(<ShiftRequests />);

  expect(await screen.findByText('Alice')).toBeInTheDocument();
  expect(screen.getByText(/Night Patrol/)).toBeInTheDocument();
  expect(screen.getByText('Carol')).toBeInTheDocument();
  expect(screen.getByText('Vacation')).toBeInTheDocument();

  // Defaults to the PENDING filter.
  expect(getShiftRequests).toHaveBeenCalledWith(expect.objectContaining({ status: 'PENDING' }));
});

test('approving a request calls the approve API with its id', async () => {
  render(<ShiftRequests />);
  await screen.findByText('Alice');

  const firstCard = screen.getByText('Alice').closest('.sr-card');
  fireEvent.click(within(firstCard).getByRole('button', { name: /approve/i }));

  await waitFor(() => expect(approveShiftRequest).toHaveBeenCalledWith('r1'));
});

test('rejecting requires a reason and sends it to the reject API', async () => {
  render(<ShiftRequests />);
  await screen.findByText('Alice');

  const firstCard = screen.getByText('Alice').closest('.sr-card');
  fireEvent.click(within(firstCard).getByRole('button', { name: /^reject$/i }));

  // Dialog appears; confirm is disabled until a reason is entered.
  const confirmBtn = screen.getByRole('button', { name: /confirm reject/i });
  expect(confirmBtn).toBeDisabled();

  fireEvent.change(screen.getByLabelText(/reason for rejection/i), {
    target: { value: 'Cannot cover this shift' },
  });
  expect(confirmBtn).not.toBeDisabled();

  fireEvent.click(confirmBtn);

  await waitFor(() =>
    expect(rejectShiftRequest).toHaveBeenCalledWith('r1', 'Cannot cover this shift')
  );
});
