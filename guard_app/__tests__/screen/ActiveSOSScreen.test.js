/* eslint-env jest */

import { render } from '@testing-library/react-native';
import React from 'react';

import ActiveSOSScreen from '../../src/screen/ActiveSOSScreen';
import { ThemeProvider } from '../../src/theme/ThemeProvider';

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: {} }),
  useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn() }),
}));

jest.mock('expo-location', () => ({
  Accuracy: { High: 4 },
  hasServicesEnabledAsync: jest.fn().mockResolvedValue(true),
  getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  enableNetworkProviderAsync: jest.fn().mockResolvedValue(undefined),
  getCurrentPositionAsync: jest
    .fn()
    .mockResolvedValue({ coords: { latitude: 1, longitude: 2 }, timestamp: 0 }),
  getLastKnownPositionAsync: jest.fn().mockResolvedValue(null),
  watchPositionAsync: jest.fn().mockResolvedValue({ remove: jest.fn() }),
}));

jest.mock('../../src/api/profile', () => ({
  getUserProfile: jest.fn().mockResolvedValue({ _id: 'g1', name: 'Mia' }),
}));

jest.mock('../../src/api/sos', () => ({
  triggerSOS: jest.fn().mockResolvedValue({
    _id: 'sos1',
    status: 'notified',
    triggeredAt: new Date().toISOString(),
    location: { latitude: 1, longitude: 2 },
    emergencyContact: { name: 'Supervisor', phone: '000' },
  }),
  getSOSStatus: jest
    .fn()
    .mockResolvedValue({ _id: 'sos1', status: 'notified', triggeredAt: new Date().toISOString() }),
  cancelSOS: jest.fn(),
  addSOSNote: jest.fn(),
  updateSOSLocation: jest.fn().mockResolvedValue(undefined),
}));

import { triggerSOS } from '../../src/api/sos';

describe('ActiveSOSScreen (smoke)', () => {
  it('renders the emergency banner and triggers a new SOS on mount', async () => {
    const { findByText, getByText } = render(
      <ThemeProvider>
        <ActiveSOSScreen />
      </ThemeProvider>,
    );

    expect(await findByText('EMERGENCY ACTIVE')).toBeTruthy();
    expect(getByText('SOS Sent')).toBeTruthy();
    expect(triggerSOS).toHaveBeenCalled();
  });
});
