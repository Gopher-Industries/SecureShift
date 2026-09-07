import { useEffect, useState } from 'react';
import Card from './Card';
import Button from './Button';
import FormField from './FormField';
import colors from '../theme/colors';

const STORAGE_KEY = 'auditLogRetentionPolicy';
const SHORT_RETENTION_THRESHOLD = 7; // days — warn if below this

// AP-041: Retention-policy UI. Mock-persisted to localStorage for now —
// no backend scheduler yet. Wiring to a real backend scheduler is a follow-up.
export default function RetentionPolicy() {
  const [days, setDays] = useState('90');
  const [autoPurgeEnabled, setAutoPurgeEnabled] = useState(false);
  const [savedPolicy, setSavedPolicy] = useState(null);
  const [showShortRetentionWarning, setShowShortRetentionWarning] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedPolicy(JSON.parse(stored));
      } catch {
        // ignore malformed stored value
      }
    }
  }, []);

  const persistPolicy = () => {
    const policy = {
      days: Number(days),
      autoPurgeEnabled,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(policy));
    setSavedPolicy(policy);
    setSaveMessage('Retention policy saved.');
    setShowShortRetentionWarning(false);
  };

  const handleSave = () => {
    const numDays = Number(days);
    if (!numDays || numDays < 1) {
      setSaveMessage('Please enter a valid number of days.');
      return;
    }
    if (numDays < SHORT_RETENTION_THRESHOLD) {
      // guard against accidental short retention — require explicit confirm
      setShowShortRetentionWarning(true);
      return;
    }
    persistPolicy();
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <h3 style={{ marginTop: 0 }}>Audit Log Retention Policy</h3>
      <p style={{ color: colors.muted, fontSize: 13 }}>
        Set how long audit logs are kept before being eligible for automatic deletion.{' '}
        <strong>Note:</strong> scheduled enforcement is not yet wired up — this currently only saves
        the policy setting; deletion still requires a manual purge below.
      </p>

      {savedPolicy && (
        <div
          style={{
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: 6,
            padding: '10px 12px',
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          <strong>Current policy:</strong> Keep logs for {savedPolicy.days} day
          {savedPolicy.days === 1 ? '' : 's'} — auto-purge{' '}
          {savedPolicy.autoPurgeEnabled ? 'enabled' : 'disabled'}
          {savedPolicy.updatedAt && (
            <span style={{ color: colors.muted }}>
              {' '}
              (last updated {new Date(savedPolicy.updatedAt).toLocaleString()})
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 200 }}>
          <FormField
            id="retention-days"
            label="Keep logs for (days)"
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            hint="Logs older than this become eligible for deletion."
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <input
            type="checkbox"
            checked={autoPurgeEnabled}
            onChange={(e) => setAutoPurgeEnabled(e.target.checked)}
          />
          Enable auto-purge (once backend scheduler is wired up)
        </label>

        <div style={{ marginBottom: 16 }}>
          <Button onClick={handleSave}>Save Policy</Button>
        </div>
      </div>

      {saveMessage && <p style={{ fontSize: 13, color: colors.muted }}>{saveMessage}</p>}

      {showShortRetentionWarning && (
        <div
          style={{
            background: '#fff5f5',
            border: `1px solid #e0a0a0`,
            borderRadius: 6,
            padding: '10px 12px',
            marginTop: 8,
          }}
        >
          <p style={{ margin: '0 0 8px', fontSize: 13 }}>
            ⚠️ {days} day{days === '1' ? '' : 's'} is a very short retention period — logs will be
            eligible for deletion almost immediately once enforcement is wired up. Are you sure?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="danger" onClick={persistPolicy}>
              Yes, use {days} day{days === '1' ? '' : 's'}
            </Button>
            <Button variant="secondary" onClick={() => setShowShortRetentionWarning(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
