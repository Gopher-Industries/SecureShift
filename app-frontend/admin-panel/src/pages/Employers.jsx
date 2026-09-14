import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUsers } from '../service/adminAPI';
import DataTable from '../components/DataTable';
import LoadingComponent from '../components/LoadingComponent';
import SearchFilter from '../components/SearchFilter';
import colors from '../theme/colors';

export default function Employers() {
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    async function loadEmployers() {
      try {
        setLoading(true);
        setError('');

        const data = await getUsers();

        const users = Array.isArray(data) ? data : data.users || data.data || [];

        const employerUsers = users.filter((user) => user.role === 'employer');

        setEmployers(employerUsers);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load employers');
      } finally {
        setLoading(false);
      }
    }

    loadEmployers();
  }, []);

  const filteredEmployers = employers.filter((employer) => {
    const searchText = `${employer.name} ${employer.email} ${employer.phone || ''}`.toLowerCase();

    const matchesSearch = searchText.includes(query.toLowerCase());

    // Status is currently mock data because the existing
    // employer records do not have a status field.
    const employerStatus = employer.status || 'active';

    const matchesStatus = !statusFilter || employerStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (employer) => (
        <Link to={`/employers/${employer._id}`} style={{ color: colors.primary }}>
          {employer.name}
        </Link>
      ),
    },
    {
      key: 'email',
      header: 'Email',
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (employer) => employer.phone || '—',
    },
    {
      key: 'ABN',
      header: 'ABN',
      render: (employer) => employer.ABN || '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (employer) => employer.status || 'Active',
    },
  ];

  return (
    <div>
      <h1>Employers</h1>

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        <SearchFilter
          value={query}
          onChange={setQuery}
          placeholder="Search by name, email or phone..."
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: 4,
            marginBottom: 16,
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <LoadingComponent />
      ) : error ? (
        <p style={{ color: colors.danger }}>{error}</p>
      ) : (
        <DataTable
          columns={columns}
          rows={filteredEmployers}
          empty={
            query || statusFilter
              ? 'No employers match your search or filter'
              : 'No employers found'
          }
        />
      )}
    </div>
  );
}
