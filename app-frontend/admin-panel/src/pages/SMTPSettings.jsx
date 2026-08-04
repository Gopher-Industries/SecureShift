import { useEffect, useState } from 'react';
import { getSmtpSettings, updateSmtpSettings, testSmtpSettings } from '../service/adminAPI';
import LoadingComponent from '../components/LoadingComponent';
import colors from '../theme/colors';

const styles = {
  page: { maxWidth: 960 },
  header: { marginBottom: 24 },
  title: { color: colors.primary, fontSize: 28, fontWeight: 700, margin: 0 },
  subtitle: { color: colors.muted, marginTop: 4 },
  row: { display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' },
  card: {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: 24,
    flex: '1 1 420px',
    minWidth: 320,
  },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: 600, margin: '0 0 4px' },
  cardSubtitle: { color: colors.muted, fontSize: 13, margin: '0 0 20px' },
  field: { marginBottom: 16 },
  label: {
    display: 'block',
    color: colors.text,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 10px',
    fontSize: 14,
    color: colors.text,
    background: colors.white,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
  },
  hint: { color: colors.muted, fontSize: 12, marginTop: 4 },
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
};

const EMPTY_SETTINGS = {
  SMTP_HOST: '',
  SMTP_PORT: '',
  SMTP_SECURE: 'false',
  SMTP_USER: '',
  SMTP_PASS: '',
  SMTP_FROM_EMAIL: '',
};

// SMTP / Email settings page — Sprint 2.
// Step 1: load existing settings via GET /admin/smtp-settings.
// Step 2: edit + save via PUT /admin/smtp-settings.
export default function SMTPSettings() {
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { ok: boolean, message: string }

  // silent = true skips the loading flag so we don't blow away the form
  // (and the save success message) after a save.
  const loadSettings = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const data = await getSmtpSettings();
      setSettings((prev) => ({ ...prev, ...data, SMTP_PASS: '' }));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load SMTP settings');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (field) => (e) => {
    setSettings((prev) => ({ ...prev, [field]: e.target.value }));
    setSaveSuccess('');
  };

  const validate = () => {
    if (!settings.SMTP_HOST.trim()) return 'Host is required';
    if (!settings.SMTP_PORT || Number.isNaN(Number(settings.SMTP_PORT)))
      return 'Port must be a number';
    if (!settings.SMTP_FROM_EMAIL.trim()) return 'From Email is required';
    return '';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setSaveError(validationError);
      setSaveSuccess('');
      return;
    }

    try {
      setSaving(true);
      setSaveError('');
      setSaveSuccess('');

      // Don't send an empty password — leaving it blank means "keep existing".
      const body = { ...settings };
      if (!body.SMTP_PASS) delete body.SMTP_PASS;

      await updateSmtpSettings(body);
      await loadSettings(true);
      setSaveSuccess('Settings saved.');
    } catch (err) {
      setSaveError(err?.response?.data?.message || 'Failed to save SMTP settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingComponent />;

  const handleTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmail.trim()) {
      setTestResult({ ok: false, message: 'Enter an email address to send the test to.' });
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);
      await testSmtpSettings({ testEmail: testEmail.trim() });
      setTestResult({ ok: true, message: `Test email sent to ${testEmail.trim()}.` });
    } catch (err) {
      setTestResult({
        ok: false,
        message: err?.response?.data?.message || 'Failed to send test email',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>SMTP Settings</h1>
        <p style={styles.subtitle}>Configure the outgoing email server used for system emails.</p>
      </div>

      {error ? (
        <p style={styles.message(false)}>{error}</p>
      ) : (
        <div style={styles.row}>
          <div style={styles.card}>
            <form onSubmit={handleSave}>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="smtp-host">
                  Host
                </label>
                <input
                  id="smtp-host"
                  style={styles.input}
                  value={settings.SMTP_HOST}
                  onChange={handleChange('SMTP_HOST')}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label} htmlFor="smtp-port">
                  Port
                </label>
                <input
                  id="smtp-port"
                  style={styles.input}
                  value={settings.SMTP_PORT}
                  onChange={handleChange('SMTP_PORT')}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label} htmlFor="smtp-secure">
                  Secure (TLS)
                </label>
                <select
                  id="smtp-secure"
                  style={styles.input}
                  value={settings.SMTP_SECURE}
                  onChange={handleChange('SMTP_SECURE')}
                >
                  <option value="false">false</option>
                  <option value="true">true</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label} htmlFor="smtp-user">
                  Username
                </label>
                <input
                  id="smtp-user"
                  style={styles.input}
                  value={settings.SMTP_USER}
                  onChange={handleChange('SMTP_USER')}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label} htmlFor="smtp-pass">
                  Password
                </label>
                <input
                  id="smtp-pass"
                  type="password"
                  style={styles.input}
                  value={settings.SMTP_PASS}
                  onChange={handleChange('SMTP_PASS')}
                  placeholder="Leave blank to keep existing password"
                />
                <p style={styles.hint}>Leave blank to keep the currently saved password.</p>
              </div>

              <div style={styles.field}>
                <label style={styles.label} htmlFor="smtp-from">
                  From Email
                </label>
                <input
                  id="smtp-from"
                  style={styles.input}
                  value={settings.SMTP_FROM_EMAIL}
                  onChange={handleChange('SMTP_FROM_EMAIL')}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{ ...styles.button, ...(saving ? styles.buttonDisabled : {}) }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>

              {saveError && <div style={styles.message(false)}>{saveError}</div>}
              {saveSuccess && <div style={styles.message(true)}>{saveSuccess}</div>}
            </form>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Send Test Email</h2>
            <p style={styles.cardSubtitle}>
              Sends a test message using the currently saved SMTP settings — save your changes above
              first if you just edited them.
            </p>
            <form onSubmit={handleTestEmail}>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="smtp-test-email">
                  Send to
                </label>
                <input
                  id="smtp-test-email"
                  type="email"
                  style={styles.input}
                  value={testEmail}
                  onChange={(e) => {
                    setTestEmail(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={testing}
                style={{ ...styles.button, ...(testing ? styles.buttonDisabled : {}) }}
              >
                {testing ? 'Sending…' : 'Send Test Email'}
              </button>

              {testResult && <div style={styles.message(testResult.ok)}>{testResult.message}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
