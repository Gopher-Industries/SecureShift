import { screen, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../theme/renderWithTheme';
import userEvent from '@testing-library/user-event';
import TwoFactorSettings from './TwoFactorSettings';
import { ToastProvider } from '../components/Toast';
import {
  getMfaStatus,
  startMfaEnrollment,
  confirmMfaEnrollment,
  disableMfa,
} from '../service/mockMfaAPI';

jest.mock('../service/mockMfaAPI');

// URL.createObjectURL isn't implemented in jsdom.
beforeAll(() => {
  window.URL.createObjectURL = jest.fn(() => 'blob:mock');
  window.URL.revokeObjectURL = jest.fn();
  Object.assign(navigator, { clipboard: { writeText: jest.fn() } });
});

const renderPage = () =>
  renderWithTheme(
    <ToastProvider>
      <TwoFactorSettings />
    </ToastProvider>
  );

const NOT_ENABLED = {
  available: true,
  enabled: false,
  enabledAt: null,
  recoveryCodesRemaining: 0,
};
const ENABLED = {
  available: true,
  enabled: true,
  enabledAt: '2026-01-01T00:00:00.000Z',
  recoveryCodesRemaining: 8,
};

describe('TwoFactorSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the enable button when 2FA is off', async () => {
    getMfaStatus.mockResolvedValue(NOT_ENABLED);
    renderPage();
    expect(
      await screen.findByRole('button', { name: /enable two-factor authentication/i })
    ).toBeInTheDocument();
  });

  it('shows an unavailable message when the server has no MFA key configured', async () => {
    getMfaStatus.mockResolvedValue({ ...NOT_ENABLED, available: false });
    renderPage();
    expect(await screen.findByText(/not available on this server/i)).toBeInTheDocument();
  });

  it('shows a load error when the status request fails', async () => {
    getMfaStatus.mockRejectedValue({ response: { data: { message: 'Server error' } } });
    renderPage();
    expect(await screen.findByText('Server error')).toBeInTheDocument();
  });

  it('shows status and a disable button when 2FA is on', async () => {
    getMfaStatus.mockResolvedValue(ENABLED);
    renderPage();
    expect(
      await screen.findByRole('button', { name: /disable two-factor authentication/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/8 recovery codes remaining/i)).toBeInTheDocument();
  });

  describe('enrolment', () => {
    beforeEach(() => {
      getMfaStatus.mockResolvedValue(NOT_ENABLED);
      startMfaEnrollment.mockResolvedValue({
        secret: 'ABCDEFGH234567AB',
        otpauthUrl: 'otpauth://totp/x',
        qrDataUrl: 'data:image/png;base64,AAA',
        expiresInSeconds: 600,
      });
    });

    it('starts enrolment and shows the QR code and secret', async () => {
      renderPage();
      await userEvent.click(
        await screen.findByRole('button', { name: /enable two-factor authentication/i })
      );

      expect(startMfaEnrollment).toHaveBeenCalled();
      expect(await screen.findByAltText(/scan this qr code/i)).toBeInTheDocument();
      expect(screen.getByText('ABCDEFGH234567AB')).toBeInTheDocument();
    });

    it('confirming with a valid code shows the recovery codes exactly once', async () => {
      confirmMfaEnrollment.mockResolvedValue({
        enabled: true,
        recoveryCodes: ['AAAAA-BBBBB', 'CCCCC-DDDDD'],
      });
      renderPage();
      await userEvent.click(
        await screen.findByRole('button', { name: /enable two-factor authentication/i })
      );
      await screen.findByAltText(/scan this qr code/i);

      await userEvent.type(screen.getByLabelText(/authentication code/i), '123456');
      await userEvent.click(screen.getByRole('button', { name: /verify and enable/i }));

      expect(confirmMfaEnrollment).toHaveBeenCalledWith('123456');
      expect(await screen.findByText('AAAAA-BBBBB')).toBeInTheDocument();
      expect(screen.getByText('CCCCC-DDDDD')).toBeInTheDocument();
      // the QR/secret step is gone
      expect(screen.queryByAltText(/scan this qr code/i)).not.toBeInTheDocument();
    });

    it('shows an error and stays on the QR step for a wrong code', async () => {
      confirmMfaEnrollment.mockRejectedValue({
        response: { data: { message: 'Invalid authentication code' } },
      });
      renderPage();
      await userEvent.click(
        await screen.findByRole('button', { name: /enable two-factor authentication/i })
      );
      await screen.findByAltText(/scan this qr code/i);

      await userEvent.type(screen.getByLabelText(/authentication code/i), '000000');
      await userEvent.click(screen.getByRole('button', { name: /verify and enable/i }));

      expect(await screen.findByText('Invalid authentication code')).toBeInTheDocument();
      expect(screen.getByAltText(/scan this qr code/i)).toBeInTheDocument();
    });

    it('the Done button is disabled until the save-codes checkbox is ticked', async () => {
      confirmMfaEnrollment.mockResolvedValue({
        enabled: true,
        recoveryCodes: ['AAAAA-BBBBB'],
      });
      renderPage();
      await userEvent.click(
        await screen.findByRole('button', { name: /enable two-factor authentication/i })
      );
      await screen.findByAltText(/scan this qr code/i);
      await userEvent.type(screen.getByLabelText(/authentication code/i), '123456');
      await userEvent.click(screen.getByRole('button', { name: /verify and enable/i }));

      await screen.findByText('AAAAA-BBBBB');
      const doneButton = screen.getByRole('button', { name: /^done$/i });
      expect(doneButton).toBeDisabled();

      await userEvent.click(screen.getByRole('checkbox'));
      expect(doneButton).not.toBeDisabled();
    });

    it('returning from Done reloads the status as enabled', async () => {
      confirmMfaEnrollment.mockResolvedValue({
        enabled: true,
        recoveryCodes: ['AAAAA-BBBBB'],
      });
      renderPage();
      await userEvent.click(
        await screen.findByRole('button', { name: /enable two-factor authentication/i })
      );
      await screen.findByAltText(/scan this qr code/i);
      await userEvent.type(screen.getByLabelText(/authentication code/i), '123456');
      await userEvent.click(screen.getByRole('button', { name: /verify and enable/i }));
      await screen.findByText('AAAAA-BBBBB');

      getMfaStatus.mockResolvedValue(ENABLED);
      await userEvent.click(screen.getByRole('checkbox'));
      await userEvent.click(screen.getByRole('button', { name: /^done$/i }));

      expect(
        await screen.findByRole('button', { name: /disable two-factor authentication/i })
      ).toBeInTheDocument();
      expect(screen.queryByText('AAAAA-BBBBB')).not.toBeInTheDocument();
    });

    it('cancelling the wizard returns to the enable button without calling confirm', async () => {
      renderPage();
      await userEvent.click(
        await screen.findByRole('button', { name: /enable two-factor authentication/i })
      );
      await screen.findByAltText(/scan this qr code/i);
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(
        await screen.findByRole('button', { name: /enable two-factor authentication/i })
      ).toBeInTheDocument();
      expect(confirmMfaEnrollment).not.toHaveBeenCalled();
    });
  });

  describe('disable', () => {
    beforeEach(() => {
      getMfaStatus.mockResolvedValue(ENABLED);
    });

    it('opens the disable form and submits password + code', async () => {
      disableMfa.mockResolvedValue({ enabled: false });
      renderPage();
      await userEvent.click(
        await screen.findByRole('button', { name: /disable two-factor authentication/i })
      );

      await userEvent.type(screen.getByLabelText(/password/i), 'Secret1!');
      await userEvent.type(screen.getByLabelText(/authentication code/i), '123456');
      await userEvent.click(screen.getByRole('button', { name: /confirm disable/i }));

      await waitFor(() =>
        expect(disableMfa).toHaveBeenCalledWith({
          password: 'Secret1!',
          code: '123456',
          recoveryCode: undefined,
        })
      );
    });

    it('switches to a recovery code and submits that instead', async () => {
      disableMfa.mockResolvedValue({ enabled: false });
      renderPage();
      await userEvent.click(
        await screen.findByRole('button', { name: /disable two-factor authentication/i })
      );

      await userEvent.click(screen.getByRole('button', { name: /use a recovery code instead/i }));
      await userEvent.type(screen.getByLabelText(/password/i), 'Secret1!');
      await userEvent.type(screen.getByLabelText(/recovery code/i), 'AAAAA-BBBBB');
      await userEvent.click(screen.getByRole('button', { name: /confirm disable/i }));

      await waitFor(() =>
        expect(disableMfa).toHaveBeenCalledWith({
          password: 'Secret1!',
          code: undefined,
          recoveryCode: 'AAAAA-BBBBB',
        })
      );
    });

    it('shows a server error and keeps 2FA enabled on a wrong password', async () => {
      disableMfa.mockRejectedValue({ response: { data: { message: 'Invalid credentials' } } });
      renderPage();
      await userEvent.click(
        await screen.findByRole('button', { name: /disable two-factor authentication/i })
      );

      await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
      await userEvent.type(screen.getByLabelText(/authentication code/i), '123456');
      await userEvent.click(screen.getByRole('button', { name: /confirm disable/i }));

      expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm disable/i })).toBeInTheDocument();
    });

    it('blocks submit with no password or code', async () => {
      renderPage();
      await userEvent.click(
        await screen.findByRole('button', { name: /disable two-factor authentication/i })
      );
      await userEvent.click(screen.getByRole('button', { name: /confirm disable/i }));

      expect(
        await screen.findByText(/password and a code or recovery code are required/i)
      ).toBeInTheDocument();
      expect(disableMfa).not.toHaveBeenCalled();
    });

    it('cancel closes the disable form', async () => {
      renderPage();
      await userEvent.click(
        await screen.findByRole('button', { name: /disable two-factor authentication/i })
      );
      await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

      expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /disable two-factor authentication/i })
      ).toBeInTheDocument();
    });
  });
});
