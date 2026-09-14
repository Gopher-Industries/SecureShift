import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getUser, getShifts } from '../service/adminAPI';
import LoadingComponent from '../components/LoadingComponent';
import DataTable from '../components/DataTable';
import colors from '../theme/colors';

function formatAddress(address) {
  if (!address) return '—';

  if (typeof address === 'string') {
    return address;
  }

  const parts = [address.street, address.suburb, address.state, address.postcode].filter(Boolean);

  return parts.length ? parts.join(', ') : '—';
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

function formatTime(shift) {
  if (!shift.startTime && !shift.endTime) {
    return '—';
  }

  return `${shift.startTime || '—'} – ${shift.endTime || '—'}`;
}

const rowStyle = {
  display: 'flex',
  gap: 8,
  padding: '10px 0',
  borderBottom: `1px solid ${colors.border}`,
};

const labelStyle = {
  width: 140,
  color: colors.muted,
  fontWeight: 600,
};

export default function EmployerDetails() {
  const { id } = useParams();

  const [employer, setEmployer] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadEmployer() {
      try {
        setLoading(true);
        setError('');

        const userData = await getUser(id);
        const user = userData.user || userData;

        const shiftData = await getShifts();

        const allShifts = Array.isArray(shiftData)
          ? shiftData
          : shiftData.shifts || shiftData.data || [];

        const employerShifts = allShifts.filter((shift) => String(shift.createdBy) === String(id));

        setEmployer(user);
        setShifts(employerShifts);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load employer details');
      } finally {
        setLoading(false);
      }
    }

    loadEmployer();
  }, [id]);

  const shiftColumns = [
    {
      key: 'title',
      header: 'Title',
    },
    {
      key: 'date',
      header: 'Date',
      render: (shift) => formatDate(shift.date),
    },
    {
      key: 'time',
      header: 'Time',
      render: (shift) => formatTime(shift),
    },
    {
      key: 'status',
      header: 'Status',
    },
  ];

  return (
    <div>
      <h1>Employer Details</h1>

      <p style={{ marginTop: -8 }}>
        <Link to="/employers" style={{ color: colors.primary }}>
          &larr; Back to Employers
        </Link>
      </p>

      {loading ? (
        <LoadingComponent />
      ) : error ? (
        <p style={{ color: colors.danger }}>{error}</p>
      ) : employer ? (
        <>
          <div
            style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: 16,
              maxWidth: 600,
            }}
          >
            <div style={rowStyle}>
              <span style={labelStyle}>Name</span>
              <span>{employer.name || '—'}</span>
            </div>

            <div style={rowStyle}>
              <span style={labelStyle}>Email</span>
              <span>{employer.email || '—'}</span>
            </div>

            <div style={rowStyle}>
              <span style={labelStyle}>Role</span>
              <span>{employer.role || 'employer'}</span>
            </div>

            <div style={rowStyle}>
              <span style={labelStyle}>Phone</span>
              <span>{employer.phone || '—'}</span>
            </div>

            <div style={rowStyle}>
              <span style={labelStyle}>ABN</span>
              <span>{employer.ABN || '—'}</span>
            </div>

            <div style={rowStyle}>
              <span style={labelStyle}>Address</span>
              <span>{formatAddress(employer.address)}</span>
            </div>

            <div style={rowStyle}>
              <span style={labelStyle}>Status</span>
              <span>{employer.status || 'Active'}</span>
            </div>

            <div
              style={{
                ...rowStyle,
                borderBottom: 'none',
              }}
            >
              <span style={labelStyle}>Joined</span>
              <span>{formatDate(employer.createdAt)}</span>
            </div>
          </div>

          <h2 style={{ marginTop: 24 }}>Shifts</h2>

          <DataTable
            columns={shiftColumns}
            rows={shifts}
            empty="No shifts found for this employer"
          />
        </>
      ) : (
        <p>Employer not found.</p>
      )}
    </div>
  );
}
