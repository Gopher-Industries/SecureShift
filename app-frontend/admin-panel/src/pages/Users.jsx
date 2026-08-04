import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUsers } from '../service/adminAPI';
import DataTable from '../components/DataTable';
import LoadingComponent from '../components/LoadingComponent';
import SearchFilter from '../components/SearchFilter';
import colors from '../theme/colors';

// First working admin data view — end-to-end integration with GET /admin/users.
export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getUsers();
        const list = Array.isArray(data) ? data : data.users || data.data || [];
        if (mounted) setUsers(list);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || 'Failed to load users');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = users.filter(
    (u) => !query || `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(query.toLowerCase())
  );

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (r) => (
        <Link to={`/users/${r._id}`} style={{ color: colors.primary }}>
          {r.name}
        </Link>
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '\u2014'),
    },
  ];

  return (
    <div>
      <h1>Users</h1>
      <SearchFilter value={query} onChange={setQuery} />
      {loading ? (
        <LoadingComponent />
      ) : error ? (
        <p style={{ color: '#c00' }}>{error}</p>
      ) : (
        <DataTable columns={columns} rows={filtered} empty="No users found" />
      )}
    </div>
  );
}
