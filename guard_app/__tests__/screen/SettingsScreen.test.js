/* eslint-env jest */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { NOTIFICATION_PREFS_STORAGE_KEY } from '../../src/lib/notificationPreferences';
import SettingsScreen from '../../src/screen/SettingsScreen';
import { ThemeProvider } from '../../src/theme/ThemeProvider';
import { showLocalNotification } from '../../src/utils/notificationHelpers';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), reset: jest.fn() }),
}));

jest.mock('../../src/context/AppLockProvider', () => ({
  useAppLock: () => ({ supported: false, enabled: false, setEnabled: jest.fn() }),
}));

jest.mock('../../src/utils/notificationHelpers', () => ({
  showLocalNotification: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../src/api/notificationPreferences', () => ({
  syncNotificationPreferences: jest.fn(() => Promise.resolve()),
}));

function renderSettings() {
  return render(
    <ThemeProvider>
      <SettingsScreen />
    </ThemeProvider>,
  );
}

const storedPrefs = async () =>
  JSON.parse((await AsyncStorage.getItem(NOTIFICATION_PREFS_STORAGE_KEY)) ?? 'null');

describe('SettingsScreen notification preferences', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('renders a toggle per category, all on by default', async () => {
    const { findByText, getByText, getByTestId } = renderSettings();

    expect(await findByText('notifPrefs.title')).toBeTruthy();
    for (const category of ['shiftAssignments', 'shiftUpdates', 'messages', 'incidents']) {
      expect(getByText(`notifPrefs.categories.${category}.title`)).toBeTruthy();
      await waitFor(() => expect(getByTestId(`notif-pref-${category}`).props.value).toBe(true));
    }
  });

  it('persists a toggled category', async () => {
    const { findByTestId, getByTestId } = renderSettings();

    fireEvent(await findByTestId('notif-pref-messages'), 'valueChange', false);

    await waitFor(async () => expect((await storedPrefs())?.messages).toBe(false));
    expect(getByTestId('notif-pref-messages').props.value).toBe(false);
    expect((await storedPrefs()).incidents).toBe(true);
  });

  it('restores saved preferences on mount', async () => {
    await AsyncStorage.setItem(
      NOTIFICATION_PREFS_STORAGE_KEY,
      JSON.stringify({ incidents: false }),
    );

    const { findByTestId, getByTestId } = renderSettings();

    await findByTestId('notif-pref-incidents');
    await waitFor(() => expect(getByTestId('notif-pref-incidents').props.value).toBe(false));
    expect(getByTestId('notif-pref-shiftUpdates').props.value).toBe(true);
  });

  it('disables category toggles while the master switch is off', async () => {
    await AsyncStorage.setItem('@guard_notifications_enabled', 'false');

    const { getByTestId, findByText } = renderSettings();

    expect(await findByText('notifPrefs.masterOff')).toBeTruthy();
    expect(getByTestId('notif-pref-messages').props.disabled).toBe(true);
    expect(getByTestId('notif-pref-messages').props.value).toBe(false);
  });

  it('sends a typed test notification for each category', async () => {
    const { findByTestId } = renderSettings();

    fireEvent.press(await findByTestId('settings-test-notif-categories'));

    await waitFor(() => expect(showLocalNotification).toHaveBeenCalledTimes(4));
    const types = showLocalNotification.mock.calls.map(([, , data]) => data.type);
    expect(types).toEqual(['SHIFT_APPROVED', 'SHIFT_UPDATED', 'MESSAGE', 'INCIDENT_REPORTED']);
  });
});
