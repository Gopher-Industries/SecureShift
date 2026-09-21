import { screen, fireEvent, waitFor } from '@testing-library/react';
import GeneralSettings from './GeneralSettings';
import { getMockSettings, updateMockSettings } from '../service/mockSettingsAPI';
import { renderWithTheme } from '../theme/renderWithTheme';

jest.mock('../service/mockSettingsAPI');

describe('GeneralSettings accessibility', () => {
  beforeEach(() => {
    getMockSettings.mockResolvedValue({
      platformName: 'SecureShift',
      supportEmail: 'support@secureshift.com',
      timezone: 'Australia/Melbourne',
      maintenanceMode: false,
    });

    updateMockSettings.mockResolvedValue({});
  });

  test('all settings controls have accessible labels', async () => {
    renderWithTheme(<GeneralSettings />);

    await waitFor(() => {
      expect(screen.getByLabelText('Platform Name')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Support Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Timezone')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Maintenance Mode' })).toBeInTheDocument();
  });

  test('Maintenance Mode can be operated using keyboard', async () => {
    renderWithTheme(<GeneralSettings />);

    const checkbox = await waitFor(() =>
      screen.getByRole('checkbox', { name: 'Maintenance Mode' })
    );

    checkbox.focus();

    expect(checkbox).toHaveFocus();
    expect(checkbox).not.toBeChecked();

    fireEvent.keyDown(checkbox, {
      key: ' ',
      code: 'Space',
      charCode: 32,
    });

    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
  });
});
