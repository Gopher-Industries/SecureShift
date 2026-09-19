import Button from '../components/Button';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getUsers, deleteUser, createEmployer } from '../service/adminAPI';
import UserFormModal from '../components/UserFormModal';
import { useToast } from '../components/Toast';
import DataTable from '../components/DataTable';
import LoadingComponent from '../components/LoadingComponent';
import SearchFilter from '../components/SearchFilter';
import ConfirmDialog from '../components/ConfirmDialog';
import { useTheme } from '../theme/ThemeProvider';

// First working admin data view — end-to-end integration with GET /admin/users.
const USER_SORT_KEYS = ['name', 'email', 'role', 'createdAt'];

function parsePage(value) {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function parseSort(searchParams) {
  const key = searchParams.get('sort');

  if (!USER_SORT_KEYS.includes(key)) {
    return { key: null, direction: 'asc' };
  }

  return {
    key,
    direction: searchParams.get('dir') === 'desc' ? 'desc' : 'asc',
  };
}

export default function Users() {
  const { colors } = useTheme();
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
      background: colors.card,
      color: colors.text,
      cursor: 'pointer',
      marginBottom: 16,
    },
  };

  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [creating, setCreating] = useState(false);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [roleFilter, setRoleFilter] = useState(() => searchParams.get('role') || '');
  const [sortConfig, setSortConfig] = useState(() => parseSort(searchParams));
  const [page, setPage] = useState(() => parsePage(searchParams.get('page')));

  const [del, setDel] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setRoleFilter(searchParams.get('role') || '');
    setSortConfig(parseSort(searchParams));
    setPage(parsePage(searchParams.get('page')));
  }, [searchParams]);

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

  const updateTableUrl = (updates) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);

        Object.entries(updates).forEach(([key, value]) => {
          if (value === '' || value === null || value === undefined) {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        });

        return next;
      },
      { replace: true }
    );
  };

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
    {
      key: 'email',
      header: 'Email',
    },
    {
      key: 'role',
      header: 'Role',
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <Button variant="secondary" onClick={() => setEditUser(r)}>
            Edit
          </Button>

          <Button variant="danger" onClick={() => setDel(r)}>
            Delete
          </Button>
        </div>
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

  const closeDeleteConfirm = () => {
    if (deleting) return;
    setDel(null);
  };

  // Export the selected users to a CSV file (client-side, non-destructive).
  const exportSelected = (selected) => {
    const header = ['Name', 'Email', 'Role', 'Joined'];
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    const lines = [
      header.join(','),
      ...selected.map((u) =>
        [u.name, u.email, u.role, u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '']
          .map(escape)
          .join(',')
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);

    showToast(`Exported ${selected.length} user(s).`, 'success');
  };

  // Delete every selected user, then refresh the list.
  const deleteSelected = async (selected) => {
    try {
      const results = await Promise.allSettled(selected.map((u) => deleteUser(u._id)));
      const failed = results.filter((r) => r.status === 'rejected').length;
      const ok = selected.length - failed;

      if (ok > 0) showToast(`Deleted ${ok} user(s).`, 'success');
      if (failed > 0) showToast(`${failed} user(s) could not be deleted.`, 'error');

      setRefreshFlag((prev) => !prev);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Bulk delete failed.', 'error');
    }
  };

  const bulkActions = [
    {
      key: 'export',
      label: 'Export selected',
      onClick: exportSelected,
      clearAfter: false,
    },
    {
      key: 'delete',
      label: 'Delete selected',
      variant: 'danger',
      confirm: 'Delete all selected users? This cannot be undone.',
      onClick: deleteSelected,
    },
  ];

  const handleCreate = async (form) => {
    try {
      setCreating(true);

      const addressEntries = Object.entries(form.address)
        .map(([key, value]) => [key, value.trim()])
        .filter(([, value]) => value);

      const address = Object.fromEntries(addressEntries);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        ABN: form.ABN.trim(),
      };

      if (form.phone.trim()) {
        payload.phone = form.phone.trim();
      }

      if (Object.keys(address).length) {
        payload.address = address;
      }

      await createEmployer(payload);

      showToast('Employer created successfully.', 'success');

      setAddOpen(false);
      setRefreshFlag((previous) => !previous);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to create user.', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <h1>Users</h1>

      <div style={{ ...ui.toolbar }}>
        <SearchFilter
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(1);

            updateTableUrl({
              q: value,
              page: null,
            });
          }}
          placeholder="Search by name or email…"
        />

        <select
          style={ui.select}
          value={roleFilter}
          onChange={(e) => {
            const value = e.target.value;

            setRoleFilter(value);
            setPage(1);

            updateTableUrl({
              role: value,
              page: null,
            });
          }}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="employer">Employer</option>
          <option value="guard">Guard</option>
        </select>

        <Button type="button" onClick={() => setAddOpen(true)} style={{ marginBottom: 16 }}>
          Add User
        </Button>
      </div>

      {loading ? (
        <LoadingComponent />
      ) : error ? (
        <p
          style={{
            color: colors.error,
          }}
        >
          {error}
        </p>
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          empty={query || roleFilter ? 'No users match your search or filter' : 'No users found'}
          selectable
          bulkActions={bulkActions}
          controlledSortConfig={sortConfig}
          onSortChange={(nextSort) => {
            setSortConfig(nextSort);
            setPage(1);

            updateTableUrl({
              sort: nextSort.key,
              dir: nextSort.direction,
              page: null,
            });
          }}
          controlledPage={page}
          onPageChange={(nextPage) => {
            setPage(nextPage);

            updateTableUrl({
              page: nextPage > 1 ? nextPage : null,
            });
          }}
        />
      )}

      <UserFormModal
        open={addOpen}
        mode="create"
        submitting={creating}
        onClose={() => setAddOpen(false)}
        onSubmit={handleCreate}
      />

      <UserFormModal
        open={Boolean(editUser)}
        mode="edit"
        initialUser={editUser}
        onClose={() => setEditUser(null)}
        onSubmit={() => {}}
      />

      <ConfirmDialog
        open={Boolean(del)}
        title="Delete this user?"
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        cancelLabel="Cancel"
        danger
        onConfirm={handleDelete}
        onCancel={closeDeleteConfirm}
        confirmDisabled={deleting}
        cancelDisabled={deleting}
      >
        <p style={{ margin: '4px 0' }}>
          <strong>{del?.name}</strong> — {del?.email}
        </p>
        <p style={{ margin: '4px 0' }}>Role: {del?.role}</p>
        <p style={{ margin: '4px 0 20px' }}>Are you sure you want to delete this user?</p>
      </ConfirmDialog>
    </div>
  );
}
