import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import LoadingComponent from '../components/LoadingComponent';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import {
  PERMISSION_GROUPS,
  WILDCARD,
  getRoles,
  labelFor,
  updateRolePermissions,
} from '../service/rolesAPI';
import colors from '../theme/colors';

const ui = {
  header: {
    marginBottom: 20,
  },
  intro: {
    margin: '6px 0 0',
    color: colors.muted,
  },
  notice: {
    display: 'flex',
    gap: 10,
    padding: '12px 14px',
    margin: '0 0 20px',
    borderRadius: 8,
    background: '#fff8e7',
    border: '1px solid #f1c66d',
    color: colors.warning,
    fontSize: 13,
    lineHeight: 1.5,
  },
  tag: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    background: colors.tableHead,
    color: colors.muted,
    border: `1px solid ${colors.border}`,
  },
  full: {
    color: colors.primary,
    fontWeight: 600,
  },
  group: {
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: '12px 14px',
    marginBottom: 12,
  },
  groupTitle: {
    margin: '0 0 10px',
    fontSize: 13,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: colors.muted,
  },
  permGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 8,
  },
  permRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
  },
  permLabel: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.3,
    color: colors.text,
    cursor: 'pointer',
  },
  permName: {
    fontSize: 14,
    color: colors.text,
  },
  permCode: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: 'monospace',
  },
  dialogNotice: {
    padding: 12,
    marginBottom: 14,
    borderRadius: 6,
    background: colors.tableHead,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    gap: 8,
    marginTop: 20,
  },
};

// super_admin -> "Super Admin"
const formatRoleName = (name) =>
  name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const isWildcardRole = (role) => role.permissions.includes(WILDCARD);

export default function Roles() {
  const { showToast } = useToast();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(null); // the role being edited
  const [draft, setDraft] = useState([]); // permissions selected in the dialog
  const [saving, setSaving] = useState(false);

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getRoles();
      setRoles(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const openEditor = (role) => {
    setEditing(role);
    setDraft(role.permissions);
  };

  const closeEditor = () => {
    setEditing(null);
    setDraft([]);
  };

  const editingIsWildcard = editing ? isWildcardRole(editing) : false;

  const togglePermission = (permission) => {
    setDraft((current) =>
      current.includes(permission)
        ? current.filter((perm) => perm !== permission)
        : [...current, permission]
    );
  };

  const handleSave = async () => {
    if (!editing) return;

    try {
      setSaving(true);
      const updated = await updateRolePermissions(editing.name, draft);
      setRoles((current) => current.map((role) => (role.name === updated.name ? updated : role)));
      showToast(`Permissions updated for ${formatRoleName(editing.name)}.`, 'success');
      closeEditor();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update permissions.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Role',
        render: (r) => <strong>{formatRoleName(r.name)}</strong>,
      },
      {
        key: 'description',
        header: 'Description',
        render: (r) => r.description || '—',
      },
      {
        key: 'permissions',
        header: 'Permissions',
        render: (r) =>
          isWildcardRole(r) ? (
            <span style={ui.full}>Full access (all permissions)</span>
          ) : (
            `${r.permissions.length} permission${r.permissions.length === 1 ? '' : 's'}`
          ),
      },
      {
        key: 'isSystem',
        header: 'Type',
        render: (r) => <span style={ui.tag}>{r.isSystem ? 'System' : 'Custom'}</span>,
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (r) => (
          <Button variant="secondary" onClick={() => openEditor(r)}>
            Edit permissions
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div>
      <div style={ui.header}>
        <h1>Roles &amp; Permissions</h1>
        <p style={ui.intro}>Review each role and the permissions it grants across the platform.</p>
      </div>

      <div style={ui.notice} role="note">
        <span>
          <strong>Reference data.</strong> Roles and permissions mirror the system&apos;s seeded
          RBAC. Edits are saved in this session for demonstration; they persist to the live
          roles/permissions API once BE-05 (<code>GET/PUT /admin/roles</code>) is available.
        </span>
      </div>

      {loading ? (
        <LoadingComponent />
      ) : error ? (
        <p style={{ color: colors.danger }}>{error}</p>
      ) : (
        <DataTable columns={columns} rows={roles} empty="No roles found" />
      )}

      <Modal
        open={Boolean(editing)}
        title={editing ? `Edit ${formatRoleName(editing.name)} permissions` : 'Edit permissions'}
        onClose={closeEditor}
      >
        {editingIsWildcard ? (
          <div style={ui.dialogNotice}>
            <strong>{editing && formatRoleName(editing.name)}</strong> holds full access (wildcard{' '}
            <code>*</code>) and cannot be edited — this mirrors how the backend protects the super
            administrator role.
          </div>
        ) : (
          <div style={ui.dialogNotice}>
            Toggle the permissions this role should have, then save.
          </div>
        )}

        {PERMISSION_GROUPS.map((group) => (
          <fieldset key={group.resource} style={ui.group}>
            <legend style={ui.groupTitle}>{group.resource}</legend>
            <div style={ui.permGrid}>
              {group.permissions.map((permission) => (
                <div key={permission} style={ui.permRow}>
                  <input
                    id={`perm-${permission.replace(':', '-')}`}
                    type="checkbox"
                    checked={editingIsWildcard || draft.includes(permission)}
                    disabled={editingIsWildcard || saving}
                    onChange={() => togglePermission(permission)}
                  />
                  <label htmlFor={`perm-${permission.replace(':', '-')}`} style={ui.permLabel}>
                    <span style={ui.permName}>{labelFor(permission)}</span>
                    <code style={ui.permCode}>{permission}</code>
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
        ))}

        <div style={ui.actions}>
          <Button onClick={handleSave} disabled={saving || editingIsWildcard}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          <Button variant="secondary" onClick={closeEditor} disabled={saving}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
