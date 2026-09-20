import { useEffect, useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import FormField from '../components/FormField';
import colors from '../theme/colors';
import { getMockSettings, updateMockSettings } from '../service/mockSettingsAPI';

export default function GeneralSettings() {
  const [settings, setSettings] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await getMockSettings();
    setSettings(data);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value,
    });

    setMessage('');
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (settings.platformName.trim() === '') {
      setMessage('Platform name is required.');
      return;
    }

    if (settings.supportEmail.trim() === '') {
      setMessage('Support email is required.');
      return;
    }

    if (!settings.supportEmail.includes('@')) {
      setMessage('Please enter a valid support email.');
      return;
    }

    await updateMockSettings(settings);
    setMessage('Settings saved successfully.');
  };

  if (!settings) {
    return (
      <div style={styles.page}>
        <Card style={styles.loadingCard}>
          <p style={styles.loadingText}>Loading settings...</p>
        </Card>
      </div>
    );
  }

  const isSuccess = message === 'Settings saved successfully.';

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>General Settings</h1>
        <p style={styles.subtitle}>Manage your SecureShift platform settings.</p>
      </div>

      <Card style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Platform Settings</h2>
          <p style={styles.cardDescription}>
            Update the basic information used across the platform.
          </p>
        </div>

        <form onSubmit={handleSave}>
          <FormField
            id="platformName"
            label="Platform Name"
            value={settings.platformName}
            onChange={handleChange}
            placeholder="Enter platform name"
            hint="The name displayed across the SecureShift platform."
          />

          <FormField
            id="supportEmail"
            label="Support Email"
            type="email"
            value={settings.supportEmail}
            onChange={handleChange}
            placeholder="Enter support email"
            hint="Email address admins and users can use for support."
          />

          <FormField
            id="timezone"
            label="Timezone"
            as="select"
            value={settings.timezone}
            onChange={handleChange}
            hint="Select the default timezone for the platform."
          >
            <option value="Australia/Melbourne">Australia/Melbourne</option>
            <option value="Australia/Sydney">Australia/Sydney</option>
            <option value="UTC">UTC</option>
          </FormField>

          <div style={styles.maintenanceBox}>
            <div>
              <span id="maintenanceModeLabel" style={styles.maintenanceTitle}>
                Maintenance Mode
              </span>

              <p style={styles.helpText}>
                Turn this on when the platform is temporarily unavailable.
              </p>
            </div>

            <div style={styles.switch}>
              <input
                id="maintenanceMode"
                type="checkbox"
                name="maintenanceMode"
                checked={settings.maintenanceMode}
                onChange={handleChange}
                aria-labelledby="maintenanceModeLabel"
                style={styles.checkbox}
              />

              <span
                style={{
                  ...styles.slider,
                  backgroundColor: settings.maintenanceMode ? colors.primary : colors.border,
                }}
                aria-hidden="true"
              >
                <span
                  style={{
                    ...styles.sliderCircle,
                    transform: settings.maintenanceMode ? 'translateX(20px)' : 'translateX(0)',
                  }}
                />
              </span>
            </div>
          </div>

          {message && (
            <div
              role="status"
              style={{
                ...styles.message,
                backgroundColor: isSuccess ? colors.white : colors.white,
                color: isSuccess ? colors.success : colors.danger,
                border: `1px solid ${isSuccess ? colors.success : colors.danger}`,
              }}
            >
              {message}
            </div>
          )}

          <div style={styles.footer}>
            <Button type="submit">Save Settings</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

const styles = {
  page: {
    padding: 32,
    backgroundColor: colors.bg,
    minHeight: '100%',
  },

  header: {
    marginBottom: 24,
  },

  title: {
    margin: 0,
    fontSize: 28,
    color: colors.primaryDark,
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 0,
    color: colors.muted,
    fontSize: 15,
  },

  card: {
    maxWidth: 850,
  },

  loadingCard: {
    maxWidth: 850,
  },

  loadingText: {
    color: colors.muted,
  },

  cardHeader: {
    borderBottom: `1px solid ${colors.border}`,
    paddingBottom: 20,
    marginBottom: 24,
  },

  cardTitle: {
    margin: 0,
    fontSize: 20,
    color: colors.primaryDark,
  },

  cardDescription: {
    marginTop: 6,
    marginBottom: 0,
    color: colors.muted,
    fontSize: 14,
  },

  helpText: {
    marginTop: 6,
    marginBottom: 0,
    color: colors.muted,
    fontSize: 13,
  },

  maintenanceBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    padding: 18,
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
  },

  maintenanceTitle: {
    fontWeight: 600,
    color: colors.text,
    fontSize: 14,
  },

  switch: {
    position: 'relative',
    display: 'inline-block',
    width: 42,
    height: 22,
    flexShrink: 0,
  },

  checkbox: {
    position: 'absolute',
    width: 42,
    height: 22,
    margin: 0,
    opacity: 0,
    cursor: 'pointer',
    zIndex: 2,
  },

  slider: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 42,
    height: 22,
    borderRadius: 20,
    cursor: 'pointer',
    transition: '0.2s',
  },

  sliderCircle: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 18,
    height: 18,
    backgroundColor: colors.white,
    borderRadius: '50%',
    transition: '0.2s',
  },

  message: {
    padding: '12px 14px',
    borderRadius: 6,
    fontSize: 14,
    marginBottom: 20,
  },

  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    borderTop: `1px solid ${colors.border}`,
    paddingTop: 20,
  },
};
