/* eslint-env jest */

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { myShifts } from '../../src/api/shifts';
import { getAllMyTimesheets } from '../../src/api/timesheets';
import TimesheetsScreen from '../../src/screen/TimeSheetsScreen';
import { ThemeProvider } from '../../src/theme/ThemeProvider';

jest.mock('../../src/api/shifts', () => ({
  myShifts: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../src/api/timesheets', () => ({
  getAllMyTimesheets: jest.fn(),
}));

const Stack = createNativeStackNavigator();

function TimesheetDetailsProbe({ route }) {
  return <Text>details-for:{route.params.timesheetId}</Text>;
}

function renderTimesheetsScreen() {
  return render(
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Timesheets" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Timesheets" component={TimesheetsScreen} />
          <Stack.Screen name="TimesheetDetails" component={TimesheetDetailsProbe} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>,
  );
}

const timesheet = {
  id: 'ts-1',
  shiftId: 'shift-1',
  guardId: 'guard-1',
  employerId: 'employer-1',
  attendanceId: 'att-1',
  shiftDate: '2026-01-10',
  checkInTime: '2026-01-10T18:00:00Z',
  checkOutTime: '2026-01-11T02:00:00Z',
  scheduledHours: 8,
  actualHours: 8,
  payableHours: 7.5,
  attendanceBased: true,
  generatedAt: '2026-01-11T02:05:00Z',
};

describe('TimesheetsScreen (API mocked)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    myShifts.mockResolvedValue([]);
  });

  it('renders the fetched timesheets with a summary of total/actual/payable hours', async () => {
    getAllMyTimesheets.mockResolvedValue([timesheet]);

    const { findByText } = renderTimesheetsScreen();

    expect(await findByText('timesheet.totalShifts')).toBeTruthy();
    expect(await findByText('1')).toBeTruthy();
    expect(await findByText('Shift ID: shift-1')).toBeTruthy();
  });

  it('shows the empty state when there are no timesheets', async () => {
    getAllMyTimesheets.mockResolvedValue([]);

    const { findByText } = renderTimesheetsScreen();

    expect(await findByText('timesheet.empty')).toBeTruthy();
  });

  it('shows an error state with Retry, and recovers once the API succeeds', async () => {
    getAllMyTimesheets.mockRejectedValueOnce(new Error('Network down'));

    const { findByText } = renderTimesheetsScreen();

    expect(await findByText('Network down')).toBeTruthy();

    getAllMyTimesheets.mockResolvedValue([timesheet]);
    fireEvent.press(await findByText('timesheet.retry'));

    expect(await findByText('Shift ID: shift-1')).toBeTruthy();
  });

  it('navigates to the timesheet details screen when a card is pressed', async () => {
    getAllMyTimesheets.mockResolvedValue([timesheet]);

    const { findByText } = renderTimesheetsScreen();

    fireEvent.press(await findByText('Shift ID: shift-1'));

    await waitFor(async () => {
      expect(await findByText('details-for:ts-1')).toBeTruthy();
    });
  });
});
