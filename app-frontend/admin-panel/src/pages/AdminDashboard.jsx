import { useEffect, useState } from 'react';
import { getDashboardMetrics } from '../service/adminAPI';
import TrendChart from '../components/TrendChart';
import LoadingComponent from '../components/LoadingComponent';
import colors from '../theme/colors';

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 16,
  marginTop: 20,
};

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getDashboardMetrics();
        if (mounted) setMetrics(data);
      } catch {
        if (mounted) setError('Unable to load dashboard trends right now.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>
        Welcome to the SecureShift Admin Panel. Use the sidebar to manage users, guard verification,
        shifts, audit logs, messages and SMTP settings.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 24, marginBottom: 4 }}>Trends</h2>
      <p style={{ color: colors.muted, marginTop: 0, fontSize: 14 }}>
        Weekly aggregated activity across the platform (mock data — will switch to live metrics once
        the backend endpoint is available).
      </p>

      {loading && <LoadingComponent label="Loading trends…" />}
      {error && (
        <p role="alert" style={{ color: colors.danger }}>
          {error}
        </p>
      )}

      {metrics && (
        <div style={gridStyle}>
          <TrendChart title="Sign-ups" data={metrics.signups} color={colors.primary} />
          <TrendChart title="Shifts Filled" data={metrics.shiftsFilled} color={colors.success} />
          <TrendChart
            title="Verification Backlog"
            data={metrics.verificationBacklog}
            color={colors.warning}
          />
        </div>
      )}
    </div>
  );
}
