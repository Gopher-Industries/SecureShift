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

// Simulates the user pressing the "Apply" action in the OS confirmation Alert
// that ShiftsScreen raises before calling the (mocked) API.
async function confirmApplyAlert() {
  const call = Alert.alert.mock.calls.find(([title]) => title === 'Confirm Application');
  const applyButton = call[2].find((button) => button.text === 'Apply');
  await act(async () => {
    applyButton.onPress();
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

  it('applies to a shift after confirmation and shows a success alert', async () => {
    listShifts.mockResolvedValue({ items: [openShift], page: 1, limit: 50, total: 1 });
    applyToShift.mockResolvedValue({ message: 'ok' });

    const { findByText } = renderShiftsScreen();

    fireEvent.press(await findByText('shifts.apply'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Confirm Application',
        expect.any(String),
        expect.any(Array),
      );
    });

    await confirmApplyAlert();

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

    const { findByText } = renderShiftsScreen();

    fireEvent.press(await findByText('shifts.apply'));
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        'Confirm Application',
        expect.any(String),
        expect.any(Array),
      ),
    );
    await confirmApplyAlert();

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
