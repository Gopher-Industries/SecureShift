/* eslint-env jest */

import { NavigationContainer } from '@react-navigation/native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import { getMe } from '../../src/api/auth';
import { applyToShift, listShifts } from '../../src/api/shifts';
import ShiftsScreen from '../../src/screen/ShiftsScreen';
import { ThemeProvider } from '../../src/theme/ThemeProvider';

jest.mock('../../src/api/auth', () => ({
  getMe: jest.fn(),
}));

jest.mock('../../src/api/shifts', () => ({
  listShifts: jest.fn(),
  myShifts: jest.fn().mockResolvedValue([]),
  applyToShift: jest.fn(),
}));

jest.mock('../../src/api/attendance', () => ({
  getUserAttendance: jest.fn().mockResolvedValue([]),
}));

const openShift = {
  _id: 'shift-1',
  title: 'Night Patrol',
  date: '2026-01-10',
  startTime: '18:00',
  endTime: '02:00',
  status: 'open',
  payRate: 45,
  createdBy: { _id: 'c1', company: 'Acme Security' },
  location: { suburb: 'Docklands', state: 'VIC' },
  applicants: [],
};

function renderShiftsScreen() {
  return render(
    <ThemeProvider>
      <NavigationContainer>
        <ShiftsScreen navigation={{ navigate: jest.fn() }} />
      </NavigationContainer>
    </ThemeProvider>,
  );
}

async function acknowledgeAndApply(screen) {
  const acknowledgementCheckbox = await screen.findByText(
    'I have read and acknowledge the shift terms and site instructions.',
  );

  fireEvent.press(acknowledgementCheckbox);

  const acknowledgeButton = await screen.findByText('Acknowledge & Apply');

  await act(async () => {
    fireEvent.press(acknowledgeButton);
  });
}

describe('ShiftsScreen - All tab (API mocked)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    getMe.mockResolvedValue({ _id: 'guard-1' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lists shifts fetched from the (mocked) API with an Apply action for open shifts', async () => {
    listShifts.mockResolvedValue({ items: [openShift], page: 1, limit: 50, total: 1 });

    const { findByText } = renderShiftsScreen();

    expect(await findByText('Night Patrol')).toBeTruthy();
    expect(await findByText('Acme Security')).toBeTruthy();
    expect(await findByText('shifts.apply')).toBeTruthy();
  });

  it('applies to a shift after acknowledgement and shows a success alert', async () => {
    listShifts.mockResolvedValue({ items: [openShift], page: 1, limit: 50, total: 1 });
    applyToShift.mockResolvedValue({ message: 'ok' });

    const screen = renderShiftsScreen();

    fireEvent.press(await screen.findByText('shifts.apply'));

    expect(await screen.findByText('Shift Acknowledgement')).toBeTruthy();

    await acknowledgeAndApply(screen);

    await waitFor(() => {
      expect(applyToShift).toHaveBeenCalledWith('shift-1');
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Shift applied successfully');
    });
  });

  it('shows a friendly alert when the API reports the shift was already applied to', async () => {
    listShifts.mockResolvedValue({ items: [openShift], page: 1, limit: 50, total: 1 });
    applyToShift.mockRejectedValue({ response: { data: { message: 'Already applied' } } });

    const screen = renderShiftsScreen();

    fireEvent.press(await screen.findByText('shifts.apply'));

    expect(await screen.findByText('Shift Acknowledgement')).toBeTruthy();

    await acknowledgeAndApply(screen);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Already Applied',
        'You have already applied for this shift.',
      );
    });
  });

  it('shows an error state with a Retry action when the API fetch fails', async () => {
    listShifts.mockRejectedValue({ response: { data: { message: 'Server unavailable' } } });

    const { findByText } = renderShiftsScreen();

    expect(await findByText('Server unavailable')).toBeTruthy();

    listShifts.mockResolvedValue({ items: [openShift], page: 1, limit: 50, total: 1 });
    fireEvent.press(await findByText('Retry'));

    expect(await findByText('Night Patrol')).toBeTruthy();
  });
});
