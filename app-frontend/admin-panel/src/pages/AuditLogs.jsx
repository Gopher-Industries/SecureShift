import RetentionPolicy from '../components/RetentionPolicy';
import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import http from '../lib/http';
import Modal from '../components/Modal';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  // Filter states
  const [userId, setUserId] = useState('');
  const [action, setAction] = useState('');
  const [role, setRole] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: null,
  });

  // Purge states
  const [purgeDays, setPurgeDays] = useState('30');
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgeMessage, setPurgeMessage] = useState(null);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = { page, limit };

      if (userId) params.userId = userId;
      if (action) params.action = action;
      if (role) params.role = role;
      if (from) params.from = from;
      if (to) params.to = to;

      const res = await http.get('/admin/audit-logs', { params });

      setLogs(res.data.logs || []);

      // Reset sorting when new data is loaded
      setSortConfig({
        key: null,
        direction: null,
      });
    } catch (err) {
      setError('Failed to load audit logs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    if (page === 1) {
      fetchLogs();
    } else {
      setPage(1);
    }
  };

  const handleClearFilters = () => {
    setUserId('');
    setAction('');
    setRole('');
    setFrom('');
    setTo('');

    setSortConfig({
      key: null,
      direction: null,
    });

    if (page === 1) {
      setTimeout(fetchLogs, 0);
    } else {
      setPage(1);
    }
  };

  const handleSort = (key) => {
    setSortConfig((current) => {
      // First double-click on a different column = ascending
      if (current.key !== key) {
        return {
          key,
          direction: 'asc',
        };
      }

      // Second double-click = descending
      if (current.direction === 'asc') {
        return {
          key,
          direction: 'desc',
        };
      }

      // Third double-click = normal/original order
      return {
        key: null,
        direction: null,
      };
    });
  };

  // Sort complete log objects so all columns stay together.
  const sortedLogs = !sortConfig.key
    ? logs
    : [...logs].sort((a, b) => {
        let valueA;
        let valueB;

        if (sortConfig.key === 'timestamp') {
          valueA = new Date(a.timestamp).getTime();
          valueB = new Date(b.timestamp).getTime();
        } else if (sortConfig.key === 'user') {
          valueA = (a.user?.name || a.user || '').toLowerCase();
          valueB = (b.user?.name || b.user || '').toLowerCase();
        } else if (sortConfig.key === 'action') {
          valueA = (a.action || '').toLowerCase();
          valueB = (b.action || '').toLowerCase();
        }

        if (valueA < valueB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }

        if (valueA > valueB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }

        return 0;
      });

  const handleExportExcel = () => {
    const data = logs.map((log) => ({
      Timestamp: new Date(log.timestamp).toLocaleString(),
      User: log.user?.name || log.user || '—',
      Action: log.action,
      Role: log.user?.role || '—',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Logs');

    XLSX.writeFile(workbook, 'audit-logs.xlsx');
  };

  const handlePurgeConfirmed = async () => {
    setPurging(true);
    setPurgeMessage(null);

    try {
      const res = await http.delete('/admin/audit-logs/purge', {
        params: { days: purgeDays },
      });

      setPurgeMessage(
        `Purged ${res.data.deletedCount} log(s) older than ${purgeDays} days.`,
      );

      setShowPurgeConfirm(false);
      setPage(1);

      fetchLogs();
    } catch (err) {
      setPurgeMessage('Failed to purge logs.');
      console.error(err);
    } finally {
      setPurging(false);
    }
  };

  const getSortArrow = (key) => {
    if (sortConfig.key !== key) {
      return null;
    }

    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div>
      <h1>Audit Logs</h1>
      <RetentionPolicy />
      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '16px',
        }}
      >
        <input
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />

        <input
          placeholder="Action (e.g. LOGIN_SUCCESS)"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        />

        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All Roles</option>
          <option value="guard">Guard</option>
          <option value="employer">Employer</option>
          <option value="admin">Admin</option>
        </select>

        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />

        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />

        <button
          onClick={handleApplyFilters}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Apply Filters
        </button>

        <button
          onClick={handleClearFilters}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>

        <button
          onClick={handleExportExcel}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Export
        </button>
      </div>

      {/* Purge section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
          padding: '10px',
          border: '1px solid #e0a0a0',
          borderRadius: '4px',
          backgroundColor: '#fff5f5',
        }}
      >
        <label>
          Purge logs older than{' '}
          <input
            type="number"
            min="1"
            value={purgeDays}
            onChange={(e) => setPurgeDays(e.target.value)}
            style={{ width: '60px' }}
          />{' '}
          days
        </label>

        <button
          onClick={() => setShowPurgeConfirm(true)}
          disabled={purging}
          style={{
            backgroundColor: '#d9534f',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Purge Logs
        </button>

        {purgeMessage && <span>{purgeMessage}</span>}
      </div>

      {/* Audit Logs table */}
      <table
        border="1"
        cellPadding="8"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          opacity: purging ? 0.5 : 1,
          pointerEvents: purging ? 'none' : 'auto',
        }}
      >
        <thead>
          <tr>
            <th
              onDoubleClick={() => handleSort('timestamp')}
              style={{
                cursor: 'pointer',
                userSelect: 'none',
              }}
              title="Double-click to sort"
            >
              Timestamp
              {getSortArrow('timestamp') && (
                <span
                  style={{
                    fontSize: '11px',
                    marginLeft: '4px',
                  }}
                >
                  {getSortArrow('timestamp')}
                </span>
              )}
            </th>

            <th
              onDoubleClick={() => handleSort('user')}
              style={{
                cursor: 'pointer',
                userSelect: 'none',
              }}
              title="Double-click to sort"
            >
              User
              {getSortArrow('user') && (
                <span
                  style={{
                    fontSize: '11px',
                    marginLeft: '4px',
                  }}
                >
                  {getSortArrow('user')}
                </span>
              )}
            </th>

            <th
              onDoubleClick={() => handleSort('action')}
              style={{
                cursor: 'pointer',
                userSelect: 'none',
              }}
              title="Double-click to sort"
            >
              Action
              {getSortArrow('action') && (
                <span
                  style={{
                    fontSize: '11px',
                    marginLeft: '4px',
                  }}
                >
                  {getSortArrow('action')}
                </span>
              )}
            </th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan="3"
                style={{
                  textAlign: 'center',
                  padding: '20px',
                }}
              >
                Loading audit logs…
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td
                colSpan="3"
                style={{
                  textAlign: 'center',
                  padding: '20px',
                  color: '#d9534f',
                }}
              >
                {error}{' '}
                <button onClick={fetchLogs} style={{ marginLeft: '8px' }}>
                  Retry
                </button>
              </td>
            </tr>
          ) : sortedLogs.length === 0 ? (
            <tr>
              <td
                colSpan="3"
                style={{
                  textAlign: 'center',
                  padding: '20px',
                  color: '#777',
                }}
              >
                No audit logs match the current filters.
              </td>
            </tr>
          ) : (
            sortedLogs.map((log) => (
              <tr
                key={log._id}
                onClick={() => setSelectedLog(log)}
                style={{
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#f0f0f0')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.user?.name || log.user || '—'}</td>
                <td>{log.action}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div style={{ marginTop: '12px' }}>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >
          Previous
        </button>

        <span style={{ margin: '0 10px' }}>Page {page}</span>

        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={logs.length < limit || loading}
        >
          Next
        </button>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <Modal
          open={true}
          title="Log Details"
          onClose={() => setSelectedLog(null)}
        >
          <p>
            <strong>Timestamp:</strong>{' '}
            {new Date(selectedLog.timestamp).toLocaleString()}
          </p>

          <p>
            <strong>Action:</strong> {selectedLog.action}
          </p>

          <p>
            <strong>User:</strong>{' '}
            {selectedLog.user?.name || '—'} (
            {selectedLog.user?.email || 'N/A'})
          </p>

          <p>
            <strong>Role:</strong> {selectedLog.user?.role || '—'}
          </p>

          <p>
            <strong>Metadata:</strong>
          </p>

          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: '10px',
              borderRadius: '4px',
              overflowX: 'auto',
            }}
          >
            {JSON.stringify(selectedLog.metadata, null, 2)}
          </pre>

          <button onClick={() => setSelectedLog(null)}>Close</button>
        </Modal>
      )}

      {/* Purge Confirmation Modal */}
      {showPurgeConfirm && (
        <Modal open={true}>
          <h2 style={{ color: '#d9534f' }}>⚠️ Confirm Purge</h2>

          <p>
            This will <strong>permanently delete</strong> all audit logs older
            than <strong>{purgeDays} days</strong>. This action{' '}
            <strong>cannot be undone</strong>.
          </p>

          <p>Are you sure you want to continue?</p>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginTop: '16px',
            }}
          >
            <button
              onClick={handlePurgeConfirmed}
              disabled={purging}
              style={{
                backgroundColor: '#d9534f',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {purging ? 'Purging...' : 'Yes, Purge'}
            </button>

            <button
              onClick={() => setShowPurgeConfirm(false)}
              disabled={purging}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}