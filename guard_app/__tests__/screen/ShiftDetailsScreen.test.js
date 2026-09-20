/* eslint-env jest */

import { render } from '@testing-library/react-native';
import React from 'react';

import ShiftDetailsScreen from '../../src/screen/ShiftDetailsScreen';
import { ThemeProvider } from '../../src/theme/ThemeProvider';

const mockShift = {
  _id: 's1',
  title: 'Night Patrol',
  status: 'assigned',
  date: '2026-10-01',
  startTime: '18:00',
  endTime: '02:00',
  payRate: 45,
  location: { street: '1 King St', suburb: 'Adelaide', state: 'SA', postcode: '5000' },
  createdBy: { _id: 'e1', company: 'Acme Security' },
};

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { shift: mockShift } }),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('../../src/api/attendance', () => ({
  checkIn: jest.fn(),
  checkOut: jest.fn(),
  getUserAttendance: jest.fn().mockResolvedValue([]),
}));
jest.mock('../../src/lib/attendancestore', () => ({
  getAttendanceForShift: jest.fn().mockResolvedValue(null),
  setAttendanceForShift: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../src/lib/handoverNotesStore', () => ({
  getHandoverNotesForSite: jest.fn().mockResolvedValue([]),
  saveHandoverNote: jest.fn(),
}));
jest.mock('../../src/lib/localStorage', () => ({
  LocalStorage: { getToken: jest.fn().mockResolvedValue(null) },
}));
jest.mock('../../src/lib/networkStatus', () => ({
  getIsConnected: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../src/lib/attendanceQueue', () => ({ enqueueAttendance: jest.fn() }));

describe('ShiftDetailsScreen (smoke)', () => {
  it('renders shift details and attendance actions for an assigned shift', async () => {
    const { findByText, getByText } = render(
      <ThemeProvider>
        <ShiftDetailsScreen />
      </ThemeProvider>,
    );

    expect(await findByText('Night Patrol')).toBeTruthy();
    expect(getByText('Acme Security')).toBeTruthy();
    expect(getByText('Message Employer')).toBeTruthy();
    // assigned + not checked in -> Check In shown
    expect(getByText('Check In')).toBeTruthy();
  });
});
