import { useEffect, useState } from 'react';
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
        <div style={styles.loadingCard}>
          <p style={styles.loadingText}>Loading settings...</p>
        </div>
      </div>
    );
  }

  const isSuccess = message === 'Settings saved successfully.';

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>General Settings</h1>
          <p style={styles.subtitle}>Manage your SecureShift platform settings.</p>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Platform Settings</h2>
          <p style={styles.cardDescription}>
            Update the basic information used across the platform.
          </p>
        </div>

        <form onSubmit={handleSave}>
          <div style={styles.formGroup}>
            <label htmlFor="platformName" style={styles.label}>
              Platform Name
            </label>

            <input
              id="platformName"
              type="text"
              name="platformName"
              value={settings.platformName}
              onChange={handleChange}
              placeholder="Enter platform name"
              style={styles.input}
            />

            <p style={styles.helpText}>The name displayed across the SecureShift platform.</p>
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="supportEmail" style={styles.label}>
              Support Email
            </label>

            <input
              id="supportEmail"
              type="email"
              name="supportEmail"
              value={settings.supportEmail}
              onChange={handleChange}
              placeholder="Enter support email"
              style={styles.input}
            />

            <p style={styles.helpText}>Email address admins and users can use for support.</p>
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="timezone" style={styles.label}>
              Timezone
            </label>

            <select
              id="timezone"
              name="timezone"
              value={settings.timezone}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="Australia/Melbourne">Australia/Melbourne</option>
              <option value="Australia/Sydney">Australia/Sydney</option>
              <option value="UTC">UTC</option>
            </select>

            <p style={styles.helpText}>Select the default timezone for the platform.</p>
          </div>

          <div style={styles.maintenanceBox}>
            <div>
              <label htmlFor="maintenanceMode" style={styles.maintenanceTitle}>
                Maintenance Mode
              </label>

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
                style={styles.checkbox}
              />

              <span
                style={{
                  ...styles.slider,
                  backgroundColor: settings.maintenanceMode ? '#274b93' : '#ccc',
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
              style={{
                ...styles.message,
                backgroundColor: isSuccess ? '#eaf7ee' : '#fff0f0',
                color: isSuccess ? '#217a3a' : '#b42318',
              }}
            >
              {message}
            </div>
          )}

          <div style={styles.footer}>
            <button type="submit" style={styles.saveButton}>
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: '32px',
    backgroundColor: '#f6f8fc',
    minHeight: '100%',
  },

  header: {
    marginBottom: '24px',
  },

  title: {
    margin: 0,
    fontSize: '28px',
    color: '#18284f',
  },

  subtitle: {
    marginTop: '8px',
    marginBottom: 0,
    color: '#6b7280',
    fontSize: '15px',
  },

  card: {
    maxWidth: '850px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '28px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },

  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '30px',
    maxWidth: '850px',
  },

  loadingText: {
    color: '#6b7280',
  },

  cardHeader: {
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '20px',
    marginBottom: '24px',
  },

  cardTitle: {
    margin: 0,
    fontSize: '20px',
    color: '#18284f',
  },

  cardDescription: {
    marginTop: '6px',
    marginBottom: 0,
    color: '#6b7280',
    fontSize: '14px',
  },

  formGroup: {
    marginBottom: '24px',
  },

  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#374151',
    fontSize: '14px',
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
  },

  helpText: {
    marginTop: '6px',
    marginBottom: 0,
    color: '#6b7280',
    fontSize: '13px',
  },

  maintenanceBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    padding: '18px',
    marginTop: '8px',
    marginBottom: '24px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
  },

  maintenanceTitle: {
    fontWeight: '600',
    color: '#374151',
    fontSize: '14px',
  },

  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '42px',
    height: '22px',
    flexShrink: 0,
  },

  checkbox: {
    position: 'absolute',
    width: '42px',
    height: '22px',
    margin: 0,
    opacity: 0,
    cursor: 'pointer',
    zIndex: 2,
  },

  slider: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '42px',
    height: '22px',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: '0.2s',
  },

  sliderCircle: {
    position: 'absolute',
    top: '2px',
    left: '2px',
    width: '18px',
    height: '18px',
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    transition: '0.2s',
  },

  message: {
    padding: '12px 14px',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '20px',
  },

  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    borderTop: '1px solid #e5e7eb',
    paddingTop: '20px',
  },

  saveButton: {
    padding: '11px 22px',
    backgroundColor: '#274b93',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
