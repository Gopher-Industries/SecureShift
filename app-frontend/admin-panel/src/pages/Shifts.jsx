import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getShifts, updateShift, approveShiftGuard, deleteShift } from '../service/adminAPI';
import DataTable from '../components/DataTable';
import LoadingComponent from '../components/LoadingComponent';
import SearchFilter from '../components/SearchFilter';
import Modal from '../components/Modal';
import Button from '../components/Button';
import FormField from '../components/FormField';
import { useTheme } from '../theme/ThemeProvider';

const STATUS_OPTIONS = ['draft', 'open', 'applied', 'assigned', 'completed'];
const PAGE_SIZE = 20;

// Columns that can be sorted by DataTable
const SHIFT_SORT_KEYS = ['title', 'date', 'times', 'status', 'employer', 'guard'];

// Format the shift date
function formatDate(d) {
  if (!d) return '\u2014';

  const parsed = new Date(d);

  return Number.isNaN(parsed.getTime()) ? '\u2014' : parsed.toLocaleDateString();
}

function formatTimes(r) {
  if (!r.startTime && !r.endTime) return '\u2014';

  return `${r.startTime || '\u2014'} \u2013 ${r.endTime || '\u2014'}`;
}

function personLabel(person) {
  if (!person) return '\u2014';

  return person.name || person.email || '\u2014';
}

function parsePage(value) {
  const page = Number.parseInt(value, 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

function parseSort(searchParams) {
  const key = searchParams.get('sort');

  if (!SHIFT_SORT_KEYS.includes(key)) {
    return { key: null, direction: 'asc' };
  }

  return {
    key,
    direction: searchParams.get('dir') === 'desc' ? 'desc' : 'asc',
  };
}
export default function Shifts() {
  const { colors } = useTheme();

  const [searchParams, setSearchParams] = useSearchParams();

  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [status, setStatus] = useState(() => searchParams.get('status') || '');
  const [sortConfig, setSortConfig] = useState(() => parseSort(searchParams));
  const [page, setPage] = useState(() => parsePage(searchParams.get('page')));

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setStatus(searchParams.get('status') || '');
    setSortConfig(parseSort(searchParams));
    setPage(parsePage(searchParams.get('page')));
  }, [searchParams]);

  // Load all shifts when the page opens
  const loadShifts = async () => {
    try {
      setLoading(true);
      setError('');

      // Get shifts from the backend
      const data = await getShifts();
      const list = Array.isArray(data) ? data : data.shifts || data.data || [];

      setShifts(list);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, []);

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

  const [editShift, setEditShift] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const [assignShift, setAssignShift] = useState(null);
  const [selectedGuardId, setSelectedGuardId] = useState('');
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignError, setAssignError] = useState('');

  const [cancelShift, setCancelShift] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // Filter shifts by search text and status
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return shifts.filter((s) => {
      if (status && s.status !== status) return false;
      if (!q) return true;

      const haystack = [
        s.title,
        s.status,
        personLabel(s.createdBy),
        s.createdBy?.email,
        personLabel(s.acceptedBy),
        s.acceptedBy?.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [shifts, query, status]);

  const openEdit = (shift) => {
    setEditError('');
    setEditForm({
      title: shift.title || '',
      date: shift.date ? new Date(shift.date).toISOString().slice(0, 10) : '',
      startTime: shift.startTime || '',
      endTime: shift.endTime || '',
      payRate: shift.payRate ?? '',
    });
    setEditShift(shift);
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    setEditError('');
    try {
      await updateShift(editShift._id, editForm);
      setEditShift(null);
      await loadShifts();
    } catch (err) {
      setEditError(err?.response?.data?.message || 'Failed to update shift');
    } finally {
      setEditSaving(false);
    }
  };

  const openAssign = (shift) => {
    setAssignError('');
    setSelectedGuardId('');
    setAssignShift(shift);
  };

  const handleAssignConfirm = async () => {
    if (!selectedGuardId) {
      setAssignError('Select a guard to assign.');
      return;
    }
    setAssignSaving(true);
    setAssignError('');
    try {
      await approveShiftGuard(assignShift._id, selectedGuardId);
      setAssignShift(null);
      await loadShifts();
    } catch (err) {
      setAssignError(err?.response?.data?.message || 'Failed to assign guard');
    } finally {
      setAssignSaving(false);
    }
  };

  const handleCancelConfirmed = async () => {
    setCancelling(true);
    setCancelError('');
    try {
      await deleteShift(cancelShift._id);
      setCancelShift(null);
      await loadShifts();
    } catch (err) {
      setCancelError(err?.response?.data?.message || 'Failed to cancel shift');
    } finally {
      setCancelling(false);
    }
  };

  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
    { key: 'times', header: 'Time', render: (r) => formatTimes(r) },
    { key: 'status', header: 'Status' },
    { key: 'employer', header: 'Employer', render: (r) => personLabel(r.createdBy) },
    { key: 'guard', header: 'Guard', render: (r) => personLabel(r.acceptedBy) },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            onClick={() => openEdit(r)}
            disabled={r.status === 'completed'}
          >
            Edit
          </Button>
          <Button
            variant="secondary"
            onClick={() => openAssign(r)}
            disabled={!r.applicants?.length || r.status === 'completed'}
          >
            Assign
          </Button>
          <Button variant="danger" onClick={() => setCancelShift(r)}>
            Cancel
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1>Shifts</h1>
      <p style={{ color: colors.muted, marginTop: -8 }}>
        Admin oversight of all shifts — edit details, assign a guard from applicants, or cancel a
        shift. Creating new shifts remains employer-only.
      </p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
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
          placeholder={'Search title, employer, guard\u2026'}
        />

        <select
          value={status}
          onChange={(e) => {
            const value = e.target.value;

            setStatus(value);
            setPage(1);

            updateTableUrl({
              status: value,
              page: null,
            });
          }}
          style={{
            padding: '8px 12px',
            border: `1px solid ${colors.border}`,
            borderRadius: 4,
            marginBottom: 16,
            fontSize: 14,
            background: colors.card,
            color: colors.text,
            cursor: 'pointer',
          }}
        >
          <option value="">All statuses</option>

          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <p style={{ color: colors.muted, fontSize: '0.9rem', marginTop: 8 }}>
        Showing {filtered.length} {filtered.length === 1 ? 'shift' : 'shifts'}
      </p>

      {loading ? (
        <LoadingComponent label={'Loading shifts…'} />
      ) : error ? (
        <p style={{ color: colors.error }}>{error}</p>
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          empty="No shifts found"
          pageSize={PAGE_SIZE}
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

      <Modal open={!!editShift} title="Edit Shift" onClose={() => setEditShift(null)}>
        <FormField
          id="edit-title"
          label="Title"
          value={editForm.title || ''}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
        />
        <FormField
          id="edit-date"
          label="Date"
          type="date"
          value={editForm.date || ''}
          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
        />
        <FormField
          id="edit-start"
          label="Start Time"
          value={editForm.startTime || ''}
          onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
          placeholder="HH:MM"
        />
        <FormField
          id="edit-end"
          label="End Time"
          value={editForm.endTime || ''}
          onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
          placeholder="HH:MM"
        />
        <FormField
          id="edit-payrate"
          label="Pay Rate"
          type="number"
          value={editForm.payRate ?? ''}
          onChange={(e) => setEditForm({ ...editForm, payRate: e.target.value })}
        />
        {editError && <p style={{ color: colors.danger, fontSize: 13 }}>{editError}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <Button onClick={handleEditSave} disabled={editSaving}>
            {editSaving ? 'Saving…' : 'Save Changes'}
          </Button>
          <Button variant="secondary" onClick={() => setEditShift(null)} disabled={editSaving}>
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal open={!!assignShift} title="Assign Guard" onClose={() => setAssignShift(null)}>
        <p style={{ fontSize: 13, color: colors.muted }}>
          Select a guard from this shift&apos;s applicants to assign.
        </p>
        {assignShift?.applicants?.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {assignShift.applicants.map((a) => (
              <label
                key={a._id}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  name="guard"
                  value={a._id}
                  checked={selectedGuardId === a._id}
                  onChange={() => setSelectedGuardId(a._id)}
                />
                {personLabel(a)} {a.email ? `(${a.email})` : ''}
              </label>
            ))}
          </div>
        ) : (
          <p style={{ color: colors.muted, fontSize: 13 }}>No applicants for this shift.</p>
        )}
        {assignError && <p style={{ color: colors.danger, fontSize: 13 }}>{assignError}</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <Button onClick={handleAssignConfirm} disabled={assignSaving || !selectedGuardId}>
            {assignSaving ? 'Assigning…' : 'Assign Guard'}
          </Button>
          <Button variant="secondary" onClick={() => setAssignShift(null)} disabled={assignSaving}>
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal open={!!cancelShift} title="Cancel Shift" onClose={() => setCancelShift(null)}>
        <p style={{ fontSize: 14 }}>
          This will <strong>permanently delete</strong> the shift{' '}
          <strong>&quot;{cancelShift?.title}&quot;</strong>. This action cannot be undone.
        </p>
        {cancelError && <p style={{ color: colors.danger, fontSize: 13 }}>{cancelError}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <Button variant="danger" onClick={handleCancelConfirmed} disabled={cancelling}>
            {cancelling ? 'Cancelling…' : 'Yes, Cancel Shift'}
          </Button>
          <Button variant="secondary" onClick={() => setCancelShift(null)} disabled={cancelling}>
            Keep Shift
          </Button>
        </div>
      </Modal>
    </div>
  );
}
