/* eslint-env jest */

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import mockReact from 'react';
import { Alert, Pressable as mockPressable, Text as mockText } from 'react-native';

import { checkIn } from '../../src/api/attendance';
import { setAttendanceForShift } from '../../src/lib/attendancestore';
import { getIsConnected } from '../../src/lib/networkStatus';
import ScanResultScreen from '../../src/screen/ScanResultScreen';

const mockUseRoute = jest.fn();
const mockUseNavigation = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useRoute: () => mockUseRoute(),
  useNavigation: () => mockUseNavigation(),
}));
jest.mock('../../src/theme', () => ({
  useAppTheme: () => ({
    colors: {
      bg: '#ffffff',
      text: '#000000',
      card: '#ffffff',
      border: '#cccccc',
      primary: '#000000',
      muted: '#999999',
      status: {
        rejected: '#ff0000',
      },
    },
  }),
}));
jest.mock('../../src/api/attendance', () => ({
  checkIn: jest.fn(),
}));

jest.mock('../../src/lib/networkStatus', () => ({
  getIsConnected: jest.fn(),
}));

jest.mock('../../src/lib/attendancestore', () => ({
  setAttendanceForShift: jest.fn(),
}));

jest.mock('../../src/lib/attendanceQueue', () => ({
  enqueueAttendance: jest.fn(),
}));

jest.mock('../../src/components/modal/LocationVerificationModal', () => {
  return function MockLocationVerificationModal({ visible, onVerified }) {
    if (!visible) return null;

    return mockReact.createElement(
      mockPressable,
      {
        onPress: () =>
          onVerified({
            latitude: -37.8136,
            longitude: 144.9631,
            timestamp: 1760000000000,
          }),
      },
      mockReact.createElement(mockText, null, 'Verify Test Location'),
    );
  };
});

function renderScreen(data) {
  mockUseRoute.mockReturnValue({
    params: { data },
  });

  mockUseNavigation.mockReturnValue({
    navigate: jest.fn(),
    goBack: jest.fn(),
  });

  return render(<ScanResultScreen />);
}

describe('ScanResultScreen QR check-in', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    getIsConnected.mockResolvedValue(true);
    setAttendanceForShift.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects an expired QR code', () => {
    const expiredPayload = JSON.stringify({
      shiftId: 'shift-123',
      expiresAt: '2020-01-01T00:00:00.000Z',
    });

    const screen = renderScreen(expiredPayload);

    fireEvent.press(screen.getByText('Trigger Action'));

    expect(Alert.alert).toHaveBeenCalledWith('Expired QR Code', expect.any(String));

    expect(checkIn).not.toHaveBeenCalled();
  });

  it('checks in with a valid QR code after location verification', async () => {
    const validPayload = JSON.stringify({
      shiftId: 'shift-123',
      expiresAt: '2099-01-01T00:00:00.000Z',
    });

    checkIn.mockResolvedValue({
      attendance: {
        checkInTime: '2026-09-19T10:00:00.000Z',
      },
    });

    const screen = renderScreen(validPayload);

    fireEvent.press(screen.getByText('Trigger Action'));
    fireEvent.press(await screen.findByText('Verify Test Location'));

    await waitFor(() => {
      expect(checkIn).toHaveBeenCalledWith(
        'shift-123',
        expect.objectContaining({
          latitude: -37.8136,
          longitude: 144.9631,
        }),
      );
    });

    await waitFor(() => {
      expect(setAttendanceForShift).toHaveBeenCalledWith(
        'shift-123',
        expect.objectContaining({
          checkInTime: '2026-09-19T10:00:00.000Z',
        }),
      );
    });
  });
});
