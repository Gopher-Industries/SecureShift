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

        const firstResponse = await getUsers({
          role: 'employer',
          page: 1,
          limit: 20,
        });

        const firstUsers = Array.isArray(firstResponse)
          ? firstResponse
          : firstResponse.users || firstResponse.data || [];

        let allEmployers = [...firstUsers];

        const total =
          firstResponse?.total ??
          firstResponse?.pagination?.total ??
          firstResponse?.meta?.total ??
          firstUsers.length;

        const limit =
          firstResponse?.limit ??
          firstResponse?.pagination?.limit ??
          firstResponse?.meta?.limit ??
          20;

        const totalPages =
          firstResponse?.totalPages ??
          firstResponse?.pagination?.totalPages ??
          firstResponse?.meta?.totalPages ??
          Math.ceil(total / limit);

        if (totalPages > 1) {
          for (let page = 2; page <= totalPages; page += 1) {
            const response = await getUsers({
              role: 'employer',
              page,
              limit,
            });

            const users = Array.isArray(response)
              ? response
              : response.users || response.data || [];

            allEmployers = [...allEmployers, ...users];
          }
        }

        setEmployers(allEmployers);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load employers');
      } finally {
        setLoading(false);
      }
    }

    loadEmployers();
  }, []);

  const filteredEmployers = employers.filter((employer) => {
    const searchText = `${employer.name || ''} ${
      employer.email || ''
    } ${employer.phone || ''}`.toLowerCase();

    const matchesSearch = searchText.includes(query.toLowerCase());

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
            border: `1px solid ${colors.border}`,
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
