import Button from '../components/Button';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUsers, deleteUser } from '../service/adminAPI';
import DataTable from '../components/DataTable';
import LoadingComponent from '../components/LoadingComponent';
import SearchFilter from '../components/SearchFilter';
import Modal from '../components/Modal';
import colors from '../theme/colors';

// First working admin data view — end-to-end integration with GET /admin/users.
const ui = {
  toolbar: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 16,
  },
  select: {
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    padding: '8px 12px',
    fontSize: 14,
    background: colors.white,
    color: colors.text,
    cursor: 'pointer',
    marginBottom: 16,
  },
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [del, setDel] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
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
  }, [refreshFlag]);

  const filtered = users.filter((u) => {
    const matchesQuery =
      !query || `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesQuery && matchesRole;
  });

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
    {
      key: 'deletebtn',
      header: '',
      render: (r) => (
        <Button variant="danger" onClick={() => setDel(r)}>
          Delete
        </Button>
      ),
    },
  ];

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteUser(del._id);
      setDel(null);
      setRefreshFlag((prev) => !prev);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
      setDel(null);
    }
  };

  return (
    <div>
      <h1>Users</h1>
      <div style={{ ...ui.toolbar }}>
        <SearchFilter value={query} onChange={setQuery} placeholder="Search by name or email…" />
        <select
          style={ui.select}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="employer">Employer</option>
          <option value="guard">Guard</option>
        </select>
      </div>
      {loading ? (
        <LoadingComponent />
      ) : error ? (
        <p style={{ color: colors.danger }}>{error}</p>
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          empty={query || roleFilter ? 'No users match your search or filter' : 'No users found'}
        />
      )}
      <Modal open={del} title="Confirm Delete" onClose={() => setDel(null)}>
        <p style={{ margin: '4px 0' }}>
          <strong>{del?.name}</strong> — {del?.email}
        </p>
        <p style={{ margin: '4px 0' }}>Role: {del?.role}</p>
        <p>Are you sure you want to delete this user?</p>
        <Button
          variant="danger"
          onClick={handleDelete}
          disabled={deleting}
          style={{ marginRight: 8 }}
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
        <Button variant="secondary" onClick={() => setDel(null)} disabled={deleting}>
          Cancel
        </Button>
      </Modal>
    </div>
  );
}
