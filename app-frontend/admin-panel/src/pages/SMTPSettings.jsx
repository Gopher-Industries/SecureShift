import { useEffect, useState } from 'react';
import { getSmtpSettings, updateSmtpSettings, testSmtpSettings } from '../service/adminAPI';
import LoadingComponent from '../components/LoadingComponent';
import FormField from '../components/FormField';
import { useToast } from '../components/Toast';
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
//
// AP-019: field markup now uses the shared FormField component, and
// save/test-email results surface via the shared Toast (useToast) instead
// of a page-local success banner — demonstrating the reusable component
// library on a real, already-working page.
export default function SMTPSettings() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);

  // silent = true skips the loading flag so we don't blow away the form
  // after a save.
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
  };

  const validate = () => {
    if (!settings.SMTP_HOST.trim()) return 'Host is required';
    if (!settings.SMTP_PORT || Number.isNaN(Number(settings.SMTP_PORT)))
      return 'Port must be a number';
    if (!settings.SMTP_USER.trim()) return 'Username is required';
    if (!settings.SMTP_PASS.trim()) return 'Password is required';
    if (!settings.SMTP_FROM_EMAIL.trim()) return 'From Email is required';
    return '';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setSaveError(validationError);
      return;
    }

    try {
      setSaving(true);
      setSaveError('');

      await updateSmtpSettings(settings);
      await loadSettings(true);
      showToast('Settings saved.', 'success');
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
      showToast('Enter an email address to send the test to.', 'error');
      return;
    }

    try {
      setTesting(true);
      await testSmtpSettings({ testEmail: testEmail.trim() });
      showToast(`Test email sent to ${testEmail.trim()}.`, 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to send test email', 'error');
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
              <FormField
                id="smtp-host"
                label="Host"
                value={settings.SMTP_HOST}
                onChange={handleChange('SMTP_HOST')}
              />

              <FormField
                id="smtp-port"
                label="Port"
                value={settings.SMTP_PORT}
                onChange={handleChange('SMTP_PORT')}
              />

              <FormField
                id="smtp-secure"
                label="Secure (TLS)"
                as="select"
                value={settings.SMTP_SECURE}
                onChange={handleChange('SMTP_SECURE')}
              >
                <option value="false">false</option>
                <option value="true">true</option>
              </FormField>

              <FormField
                id="smtp-user"
                label="Username"
                value={settings.SMTP_USER}
                onChange={handleChange('SMTP_USER')}
              />

              <FormField
                id="smtp-pass"
                label="Password"
                type="password"
                value={settings.SMTP_PASS}
                onChange={handleChange('SMTP_PASS')}
                placeholder="Enter SMTP password"
              />

              <FormField
                id="smtp-from"
                label="From Email"
                value={settings.SMTP_FROM_EMAIL}
                onChange={handleChange('SMTP_FROM_EMAIL')}
              />

              <button
                type="submit"
                disabled={saving}
                style={{ ...styles.button, ...(saving ? styles.buttonDisabled : {}) }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>

              {saveError && <div style={styles.message(false)}>{saveError}</div>}
            </form>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Send Test Email</h2>
            <p style={styles.cardSubtitle}>
              Sends a test message using the currently saved SMTP settings — save your changes above
              first if you just edited them.
            </p>
            <form onSubmit={handleTestEmail}>
              <FormField
                id="smtp-test-email"
                label="Send to"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="you@example.com"
              />

              <button
                type="submit"
                disabled={testing}
                style={{ ...styles.button, ...(testing ? styles.buttonDisabled : {}) }}
              >
                {testing ? 'Sending…' : 'Send Test Email'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
