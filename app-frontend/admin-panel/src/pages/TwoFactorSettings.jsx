import { useEffect, useState } from 'react';
import {
  getMfaStatus,
  startMfaEnrollment,
  confirmMfaEnrollment,
  disableMfa,
} from '../service/mockMfaAPI';
import LoadingComponent from '../components/LoadingComponent';
import FormField from '../components/FormField';
import { useToast } from '../components/Toast';
import colors from '../theme/colors';

const styles = {
  page: { maxWidth: 640 },
  header: { marginBottom: 24 },
  title: { color: colors.primary, fontSize: 28, fontWeight: 700, margin: 0 },
  subtitle: { color: colors.muted, marginTop: 4 },
  card: {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: 24,
  },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: 600, margin: '0 0 4px' },
  cardSubtitle: { color: colors.muted, fontSize: 13, margin: '0 0 20px' },
  button: {
    background: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: 6,
    padding: '9px 18px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  buttonSecondary: {
    background: colors.white,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    padding: '9px 18px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  buttonDanger: {
    background: colors.danger,
    color: colors.white,
    border: 'none',
    borderRadius: 6,
    padding: '9px 18px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  buttonDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  message: (ok) => ({
    marginTop: 16,
    marginBottom: 0,
    padding: '8px 12px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    color: ok ? colors.success : colors.danger,
    background: ok ? '#dcfce7' : '#fde2e2',
    display: 'inline-block',
  }),
  qrBox: {
    display: 'flex',
    justifyContent: 'center',
    padding: 16,
    background: colors.white,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    marginBottom: 16,
  },
  secretBox: {
    fontFamily: 'monospace',
    fontSize: 14,
    letterSpacing: 1,
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    padding: '10px 12px',
    wordBreak: 'break-all',
    marginBottom: 16,
  },
  recoveryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    fontFamily: 'monospace',
    fontSize: 14,
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
  },
  warningBox: {
    background: '#fff7ed',
    border: '1px solid #fdba74',
    color: '#854f0b',
    borderRadius: 6,
    padding: '10px 12px',
    fontSize: 13,
    marginBottom: 16,
  },
  divider: { border: 'none', borderTop: `1px solid ${colors.border}`, margin: '20px 0' },
  errorText: { color: colors.danger, fontSize: 13, margin: '4px 0 16px' },
  actionsRow: { display: 'flex', gap: 12, marginTop: 4 },
};

function downloadRecoveryCodes(codes) {
  const blob = new Blob(
    [
      'SecureShift admin recovery codes\n' +
        'Each code can be used once if you lose access to your authenticator app.\n\n' +
        codes.join('\n') +
        '\n',
    ],
    { type: 'text/plain' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'secureshift-recovery-codes.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Two-factor authentication settings for the signed-in admin (AP-062).
// Three states: status not yet loaded, MFA off (shows the enable/enroll
// flow), MFA on (shows status + the disable flow). Enrolment is a two-step
// wizard: start (secret + QR) -> confirm (code) -> recovery codes shown once.
export default function TwoFactorSettings() {
  const { showToast } = useToast();

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Enrolment wizard state
  const [enrolling, setEnrolling] = useState(false);
  const [enrollment, setEnrollment] = useState(null); // { secret, qrDataUrl }
  const [confirmCode, setConfirmCode] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState(null); // shown once, right after enabling
  const [savedCodesAck, setSavedCodesAck] = useState(false);

  // Disable form state
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableUseRecovery, setDisableUseRecovery] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disableRecoveryCode, setDisableRecoveryCode] = useState('');
  const [disableError, setDisableError] = useState('');
  const [disabling, setDisabling] = useState(false);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await getMfaStatus();
      setStatus(data);
    } catch (err) {
      setLoadError(
        err?.response?.data?.message || err.message || 'Failed to load two-factor status'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEnrol = async () => {
    setConfirmError('');
    setEnrolling(true);
    try {
      const data = await startMfaEnrollment();
      setEnrollment(data);
      setConfirmCode('');
    } catch (err) {
      showToast(
        err?.response?.data?.message || err.message || 'Failed to start enrolment',
        'error'
      );
      setEnrolling(false);
    }
  };

  const cancelEnrol = () => {
    setEnrolling(false);
    setEnrollment(null);
    setConfirmCode('');
    setConfirmError('');
  };

  const onConfirmEnrol = async (e) => {
    e.preventDefault();
    setConfirmError('');

    if (!confirmCode.trim()) {
      setConfirmError('Code is required');
      return;
    }

    setConfirming(true);
    try {
      const data = await confirmMfaEnrollment(confirmCode.trim());
      setRecoveryCodes(data.recoveryCodes);
      setEnrolling(false);
      setEnrollment(null);
    } catch (err) {
      setConfirmError(err?.response?.data?.message || err.message || 'Verification failed');
    } finally {
      setConfirming(false);
    }
  };

  // Called once the admin has acknowledged saving their recovery codes.
  const finishEnrolment = async () => {
    setRecoveryCodes(null);
    setSavedCodesAck(false);
    showToast('Two-factor authentication is now enabled.', 'success');
    await loadStatus();
  };

  const onDisable = async (e) => {
    e.preventDefault();
    setDisableError('');

    const secondFactor = disableUseRecovery ? disableRecoveryCode.trim() : disableCode.trim();
    if (!disablePassword || !secondFactor) {
      setDisableError('Password and a code or recovery code are required');
      return;
    }

    setDisabling(true);
    try {
      await disableMfa({
        password: disablePassword,
        code: disableUseRecovery ? undefined : secondFactor,
        recoveryCode: disableUseRecovery ? secondFactor : undefined,
      });
      setShowDisableForm(false);
      setDisablePassword('');
      setDisableCode('');
      setDisableRecoveryCode('');
      showToast('Two-factor authentication has been disabled.', 'success');
      await loadStatus();
    } catch (err) {
      setDisableError(
        err?.response?.data?.message || err.message || 'Failed to disable two-factor authentication'
      );
    } finally {
      setDisabling(false);
    }
  };

  if (loading) return <LoadingComponent />;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Two-Factor Authentication</h1>
        <p style={styles.subtitle}>
          Require an authenticator app code, in addition to your password, when you sign in.
        </p>
      </div>

      {loadError && <p style={styles.errorText}>{loadError}</p>}

      {!loadError && status && !status.available && (
        <div style={styles.card}>
          <p style={styles.cardSubtitle} role="status">
            Two-factor authentication is not available on this server right now. Contact the backend
            team.
          </p>
        </div>
      )}

      {!loadError && status && status.available && (
        <div style={styles.card}>
          {/* ---------- Recovery codes, shown once right after enabling ---------- */}
          {recoveryCodes ? (
            <>
              <h2 style={styles.cardTitle}>Save your recovery codes</h2>
              <p style={styles.cardSubtitle}>
                Each code works once, to sign in if you lose access to your authenticator app. They
                are shown only this one time.
              </p>

              <div style={styles.recoveryGrid}>
                {recoveryCodes.map((code) => (
                  <span key={code}>{code}</span>
                ))}
              </div>

              <div style={styles.actionsRow}>
                <button
                  type="button"
                  style={styles.buttonSecondary}
                  onClick={() => {
                    navigator.clipboard?.writeText(recoveryCodes.join('\n'));
                    showToast('Recovery codes copied to clipboard.', 'success');
                  }}
                >
                  Copy codes
                </button>
                <button
                  type="button"
                  style={styles.buttonSecondary}
                  onClick={() => downloadRecoveryCodes(recoveryCodes)}
                >
                  Download as text file
                </button>
              </div>

              <label
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  marginTop: 20,
                  fontSize: 13,
                }}
              >
                <input
                  type="checkbox"
                  checked={savedCodesAck}
                  onChange={(e) => setSavedCodesAck(e.target.checked)}
                />
                I&apos;ve saved these codes somewhere safe
              </label>

              <div style={styles.actionsRow}>
                <button
                  type="button"
                  style={{
                    ...styles.button,
                    ...(savedCodesAck ? {} : styles.buttonDisabled),
                  }}
                  disabled={!savedCodesAck}
                  onClick={finishEnrolment}
                >
                  Done
                </button>
              </div>
            </>
          ) : enrolling ? (
            /* ---------- Enrolment wizard: secret + QR, then confirm code ---------- */
            <>
              <h2 style={styles.cardTitle}>Set up your authenticator app</h2>
              <p style={styles.cardSubtitle}>
                Scan this code with an authenticator app (such as Google Authenticator or Authy),
                then enter the 6-digit code it shows.
              </p>

              {enrollment ? (
                <>
                  <div style={styles.qrBox}>
                    <img
                      src={enrollment.qrDataUrl}
                      alt="Scan this QR code with your authenticator app"
                      width={200}
                      height={200}
                    />
                  </div>

                  <p style={{ fontSize: 13, color: colors.muted, marginBottom: 4 }}>
                    Can&apos;t scan? Enter this code manually:
                  </p>
                  <div style={styles.secretBox}>{enrollment.secret}</div>

                  <form onSubmit={onConfirmEnrol} noValidate>
                    <FormField
                      id="mfa-confirm-code"
                      label="Authentication code"
                      value={confirmCode}
                      onChange={(e) =>
                        setConfirmCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      placeholder="123456"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      error={confirmError}
                      required
                    />

                    <div style={styles.actionsRow}>
                      <button
                        type="submit"
                        disabled={confirming}
                        style={{ ...styles.button, ...(confirming ? styles.buttonDisabled : {}) }}
                      >
                        {confirming ? 'Verifying…' : 'Verify and enable'}
                      </button>
                      <button
                        type="button"
                        style={styles.buttonSecondary}
                        onClick={cancelEnrol}
                        disabled={confirming}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <LoadingComponent />
              )}
            </>
          ) : status.enabled ? (
            /* ---------- Enabled: status + disable flow ---------- */
            <>
              <h2 style={styles.cardTitle}>Two-factor authentication is on</h2>
              <p style={styles.cardSubtitle}>
                {status.enabledAt
                  ? `Enabled on ${new Date(status.enabledAt).toLocaleDateString()}. `
                  : ''}
                {status.recoveryCodesRemaining} recovery code
                {status.recoveryCodesRemaining === 1 ? '' : 's'} remaining.
              </p>

              {!showDisableForm ? (
                <button
                  type="button"
                  style={styles.buttonDanger}
                  onClick={() => setShowDisableForm(true)}
                >
                  Disable two-factor authentication
                </button>
              ) : (
                <form onSubmit={onDisable} noValidate>
                  <FormField
                    id="mfa-disable-password"
                    label="Password"
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    required
                  />

                  {disableUseRecovery ? (
                    <FormField
                      id="mfa-disable-recovery"
                      label="Recovery code"
                      value={disableRecoveryCode}
                      onChange={(e) => setDisableRecoveryCode(e.target.value)}
                      placeholder="XXXXX-XXXXX"
                      required
                    />
                  ) : (
                    <FormField
                      id="mfa-disable-code"
                      label="Authentication code"
                      value={disableCode}
                      onChange={(e) =>
                        setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      placeholder="123456"
                      inputMode="numeric"
                      required
                    />
                  )}

                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: colors.primary,
                      fontSize: 13,
                      cursor: 'pointer',
                      padding: 0,
                      marginBottom: 16,
                    }}
                    onClick={() => setDisableUseRecovery((v) => !v)}
                  >
                    {disableUseRecovery
                      ? 'Use an authenticator code instead'
                      : 'Use a recovery code instead'}
                  </button>

                  {disableError && <p style={styles.errorText}>{disableError}</p>}

                  <div style={styles.actionsRow}>
                    <button
                      type="submit"
                      disabled={disabling}
                      style={{
                        ...styles.buttonDanger,
                        ...(disabling ? styles.buttonDisabled : {}),
                      }}
                    >
                      {disabling ? 'Disabling…' : 'Confirm disable'}
                    </button>
                    <button
                      type="button"
                      style={styles.buttonSecondary}
                      onClick={() => {
                        setShowDisableForm(false);
                        setDisableError('');
                        setDisablePassword('');
                        setDisableCode('');
                        setDisableRecoveryCode('');
                      }}
                      disabled={disabling}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            /* ---------- Not enabled: entry point ---------- */
            <>
              <h2 style={styles.cardTitle}>Two-factor authentication is off</h2>
              <p style={styles.cardSubtitle}>
                Turn this on to require a code from an authenticator app whenever you sign in.
              </p>
              <button type="button" style={styles.button} onClick={startEnrol}>
                Enable two-factor authentication
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
