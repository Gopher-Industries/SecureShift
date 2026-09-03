import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import {
  getAuditLogs,
  getMessages,
  getPendingGuards,
  getShifts,
  getUsers,
  getDashboardMetrics,
} from '../service/adminAPI';
import TrendChart from '../components/TrendChart';
import colors from '../theme/colors';
import './AdminDashboard.css';

const EMPTY_STATS = {
  users: null,
  pendingGuards: null,
  shifts: null,
  messages: null,
};

const STAT_CARDS = [
  {
    key: 'users',
    label: 'Total users',
    description: 'Non-deleted accounts currently in SecureShift',
    href: '/users',
    tone: 'blue',
  },
  {
    key: 'pendingGuards',
    label: 'Pending guard reviews',
    description: 'Guards with documents awaiting verification',
    href: '/guard-verification',
    tone: 'amber',
  },
  {
    key: 'shifts',
    label: 'Total shifts',
    description: 'Shifts currently recorded on the platform',
    href: '/shifts',
    tone: 'green',
  },
  {
    key: 'messages',
    label: 'Messages',
    description: 'Active messages visible to administrators',
    href: '/messages',
    tone: 'purple',
  },
];

const trendGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 16,
  marginTop: 20,
};

const requestSucceeded = (result) => result.status === 'fulfilled';

const getUserTotal = (data) => {
  if (Number.isFinite(data?.total)) return data.total;
  if (Number.isFinite(data?.pagination?.total)) return data.pagination.total;
  if (Array.isArray(data?.users)) return data.users.length;
  return Array.isArray(data) ? data.length : 0;
};

const getPendingGuardTotal = (data) => {
  if (Number.isFinite(data?.count)) return data.count;
  return Array.isArray(data?.guards) ? data.guards.length : 0;
};

const getShiftTotal = (data) => {
  if (Number.isFinite(data?.total)) return data.total;
  if (Array.isArray(data?.shifts)) return data.shifts.length;
  return Array.isArray(data) ? data.length : 0;
};

const getMessageTotal = (data) => {
  if (Number.isFinite(data?.pagination?.total)) return data.pagination.total;
  if (Number.isFinite(data?.total)) return data.total;
  if (Array.isArray(data?.messages)) return data.messages.length;
  return Array.isArray(data) ? data.length : 0;
};

const getActivityLogs = (data) => {
  if (Array.isArray(data?.logs)) return data.logs;
  return Array.isArray(data) ? data : [];
};

const formatAction = (action) => {
  if (!action) return 'Platform activity';

  return String(action)
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? 'Time unavailable' : date.toLocaleString();
};

export default function AdminDashboard() {
  const mountedRef = useRef(true);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [activities, setActivities] = useState([]);
  const [failedSections, setFailedSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [trendMetrics, setTrendMetrics] = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [trendsError, setTrendsError] = useState('');

  const loadDashboard = useCallback(async (manualRefresh = false) => {
    if (manualRefresh) setRefreshing(true);
    else setLoading(true);

    const results = await Promise.allSettled([
      getUsers({ page: 1, limit: 1 }),
      getPendingGuards({ status: 'pending' }),
      getShifts(),
      getMessages({ page: 1, limit: 1 }),
      getAuditLogs({ page: 1, limit: 8 }),
    ]);

    if (!mountedRef.current) return;

    const [usersResult, guardsResult, shiftsResult, messagesResult, activityResult] = results;
    const failures = [];

    if (!requestSucceeded(usersResult)) failures.push('Total users');
    if (!requestSucceeded(guardsResult)) failures.push('Pending guard reviews');
    if (!requestSucceeded(shiftsResult)) failures.push('Total shifts');
    if (!requestSucceeded(messagesResult)) failures.push('Messages');
    if (!requestSucceeded(activityResult)) failures.push('Recent activity');

    setStats({
      users: requestSucceeded(usersResult) ? getUserTotal(usersResult.value) : null,
      pendingGuards: requestSucceeded(guardsResult)
        ? getPendingGuardTotal(guardsResult.value)
        : null,
      shifts: requestSucceeded(shiftsResult) ? getShiftTotal(shiftsResult.value) : null,
      messages: requestSucceeded(messagesResult) ? getMessageTotal(messagesResult.value) : null,
    });
    setActivities(requestSucceeded(activityResult) ? getActivityLogs(activityResult.value) : []);
    setFailedSections(failures);

    if (failures.length < results.length) setLastUpdated(new Date());

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadDashboard();

    return () => {
      mountedRef.current = false;
    };
  }, [loadDashboard]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getDashboardMetrics();
        if (mounted) setTrendMetrics(data);
      } catch {
        if (mounted) setTrendsError('Unable to load dashboard trends right now.');
      } finally {
        if (mounted) setTrendsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const allSourcesFailed = failedSections.length === 5;

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Platform overview</p>
          <h1>Admin Dashboard</h1>
          <p className="admin-dashboard__intro">
            Live operational counts and recent activity derived from the current Admin APIs.
          </p>
        </div>

        <div className="admin-dashboard__refresh">
          {lastUpdated && (
            <span className="admin-dashboard__updated">
              Last updated{' '}
              {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => loadDashboard(true)}
            disabled={loading || refreshing}
          >
            {refreshing ? 'Refreshing…' : 'Refresh dashboard'}
          </Button>
        </div>
      </header>

      {failedSections.length > 0 && !loading && (
        <div className="admin-dashboard__warning" role="alert">
          <div>
            <strong>
              {allSourcesFailed ? 'Dashboard data is unavailable.' : 'Some data is unavailable.'}
            </strong>
            <span>
              {allSourcesFailed
                ? ' The Admin APIs could not be reached.'
                : ` Could not load: ${failedSections.join(', ')}.`}
            </span>
          </div>
          <Button type="button" variant="secondary" onClick={() => loadDashboard(true)}>
            Retry
          </Button>
        </div>
      )}

      <section aria-labelledby="dashboard-statistics-heading">
        <div className="admin-dashboard__section-heading">
          <div>
            <h2 id="dashboard-statistics-heading">Platform statistics</h2>
            <p>Counts are calculated from live SecureShift records.</p>
          </div>
        </div>

        <div className="admin-dashboard__stats">
          {STAT_CARDS.map((card) => (
            <Link
              key={card.key}
              to={card.href}
              className={`admin-dashboard__stat-link admin-dashboard__stat-link--${card.tone}`}
              aria-label={`View ${card.label}`}
            >
              <Card style={{ height: '100%' }}>
                <span className="admin-dashboard__stat-label">{card.label}</span>
                <strong className="admin-dashboard__stat-value">
                  {loading ? '…' : (stats[card.key] ?? 'Unavailable')}
                </strong>
                <span className="admin-dashboard__stat-description">{card.description}</span>
                <span className="admin-dashboard__stat-action">View details →</span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="dashboard-activity-heading">
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div className="admin-dashboard__activity-header">
            <div>
              <h2 id="dashboard-activity-heading">Recent activity</h2>
              <p>Latest events recorded by the Admin audit log.</p>
            </div>
            <Link to="/audit-logs" className="admin-dashboard__activity-link">
              View all audit logs
            </Link>
          </div>

          {loading ? (
            <p className="admin-dashboard__state" role="status">
              Loading dashboard data…
            </p>
          ) : failedSections.includes('Recent activity') ? (
            <p className="admin-dashboard__state admin-dashboard__state--error">
              Recent activity could not be loaded. Use Retry to try again.
            </p>
          ) : activities.length === 0 ? (
            <p className="admin-dashboard__state">No recent activity has been recorded.</p>
          ) : (
            <ul className="admin-dashboard__activity-list">
              {activities.map((activity, index) => (
                <li key={activity._id || `${activity.timestamp}-${index}`}>
                  <span className="admin-dashboard__activity-marker" aria-hidden="true" />
                  <div className="admin-dashboard__activity-copy">
                    <strong>{formatAction(activity.action)}</strong>
                    <span>
                      {activity.user?.name || activity.user?.email || 'System'}
                      {activity.user?.role ? ` · ${activity.user.role}` : ''}
                    </span>
                  </div>
                  <time dateTime={activity.timestamp || undefined}>
                    {formatTimestamp(activity.timestamp)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section aria-labelledby="dashboard-trends-heading">
        <div className="admin-dashboard__section-heading">
          <div>
            <h2 id="dashboard-trends-heading">Trends</h2>
            <p style={{ color: colors.muted, fontSize: 14 }}>
              Weekly activity across the platform (mock data — will switch to live metrics once
              the backend endpoint is available).
            </p>
          </div>
        </div>

        {trendsLoading && <p role="status">Loading trends…</p>}
        {trendsError && (
          <p role="alert" style={{ color: colors.danger }}>
            {trendsError}
          </p>
        )}

        {trendMetrics && (
          <div style={trendGridStyle}>
            <TrendChart title="Sign-ups" data={trendMetrics.signups} color={colors.primary} />
            <TrendChart
              title="Shifts Filled"
              data={trendMetrics.shiftsFilled}
              color={colors.success}
            />
            <TrendChart
              title="Verification Backlog"
              data={trendMetrics.verificationBacklog}
              color={colors.warning}
            />
          </div>
        )}
      </section>
    </div>
  );
}
