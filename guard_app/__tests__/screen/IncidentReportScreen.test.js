/* eslint-env jest */

import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';

import IncidentReportScreen from '../../src/screen/IncidentReportScreen';
import { ThemeProvider } from '../../src/theme/ThemeProvider';

jest.mock('@react-navigation/native', () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  useFocusEffect: (cb) => require('react').useEffect(() => cb(), []),
}));

jest.mock('../../src/lib/http', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: [] })),
    post: jest.fn(() => Promise.resolve({ data: { data: { _id: 'i1' } } })),
  },
}));

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));

import http from '../../src/lib/http';

function renderScreen() {
  return render(
    <ThemeProvider>
      <IncidentReportScreen />
    </ThemeProvider>,
  );
}

describe('IncidentReportScreen (smoke)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches incidents + shifts on mount and renders the form', async () => {
    const { findByText, getByText } = renderScreen();
    expect(await findByText('incidentReport.title')).toBeTruthy();
    expect(getByText('incidentReport.newReport')).toBeTruthy();
    expect(getByText('incidentReport.submit')).toBeTruthy();
    expect(http.get).toHaveBeenCalledWith('/incidents');
    expect(http.get).toHaveBeenCalledWith('/shifts/myshifts');
  });

  it('blocks submit and shows an error when required fields are missing', async () => {
    const { findByText, getByText } = renderScreen();
    await findByText('incidentReport.title');

    fireEvent.press(getByText('incidentReport.submit'));

    expect(await findByText('Missing required fields')).toBeTruthy();
    expect(http.post).not.toHaveBeenCalled();
  });
});
