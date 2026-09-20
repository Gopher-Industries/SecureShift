/* eslint-env jest */

import { render } from '@testing-library/react-native';
import React from 'react';

import HomeScreen from '../../src/screen/HomeScreen';
import { ThemeProvider } from '../../src/theme/ThemeProvider';

// Lightweight navigation mock so we can render the screen in isolation.
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ setOptions: jest.fn(), navigate: jest.fn() }),
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  useFocusEffect: (cb) => require('react').useEffect(() => cb(), []),
}));

jest.mock('../../src/lib/http', () => ({
  __esModule: true,
  default: {
    get: jest.fn((url) => {
      if (url === '/users/me') return Promise.resolve({ data: { name: 'Mia', rating: 4.2 } });
      if (url === '/shifts/myshifts') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: {} });
    }),
  },
}));

jest.mock('../../src/api/profile', () => ({
  getUserProfile: jest.fn().mockResolvedValue({ _id: 'guard-1' }),
}));

jest.mock('../../src/api/guardScore', () => ({
  fetchGuardScore: jest.fn().mockResolvedValue({ guardId: 'guard-1', score: 82 }),
}));

function renderHome() {
  return render(
    <ThemeProvider>
      <HomeScreen />
    </ThemeProvider>,
  );
}

describe('HomeScreen (smoke)', () => {
  it('renders the dashboard with stat cards after loading', async () => {
    const { findByText, getByText } = renderHome();

    // i18n is not initialised in tests, so keys render verbatim.
    expect(await findByText('home.dashboard')).toBeTruthy();
    expect(getByText('home.confirmedShifts')).toBeTruthy();
    expect(getByText('home.pendingApps')).toBeTruthy();
    expect(getByText('home.todayEarning')).toBeTruthy();
  });
});
