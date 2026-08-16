import { useEffect, useMemo, useRef, useState } from 'react';
import { getMessages, deleteMessage, getUsers } from '../service/adminAPI';
import DataTable from '../components/DataTable';
import LoadingComponent from '../components/LoadingComponent';
import Modal from '../components/Modal';

const PAGE_SIZE = 20;
const CONTENT_PREVIEW_LENGTH = 80;

function formatTimestamp(ts) {
  if (!ts) return '\u2014';
  const parsed = new Date(ts);
  return Number.isNaN(parsed.getTime()) ? '\u2014' : parsed.toLocaleString();
}

// Return the user's name if available, otherwise their email
function personLabel(person) {
  if (!person) return '\u2014';
  return person.name || person.email || '\u2014';
}

// Shorten long message so they fit neatly in the table
function previewContent(content) {
  if (!content) return '\u2014';
  return content.length > CONTENT_PREVIEW_LENGTH
    ? `${content.slice(0, CONTENT_PREVIEW_LENGTH)}\u2026`
    : content;
}

// Search for a user by name or email and allow them to be selected
function UserTypeahead({
  label,
  users,
  query,
  onQueryChange,
  selectedId,
  onSelect,
  onClear,
  inputRef,
}) {
  const [focused, setFocused] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || selectedId) return [];

    return users
      .filter(
        (u) =>
          (u.name || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, users, selectedId]);

  return (
    <div style={{ position: 'relative', width: 200 }}>
      <label
        style={{
          display: 'flex',
          flexDirection: 'column',
          fontSize: 12,
          color: '#555',
        }}
      >
        {label}
        <div style={{ display: 'flex', gap: 4 }}>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder={'Type a name or email\u2026'}
            style={{
              flex: 1,
              padding: '6px 8px',
              border: '1px solid #ccc',
              borderRadius: 4,
              background: selectedId ? '#eef6ff' : '#fff',
            }}
          />

          {selectedId && (
            <button type="button" onClick={onClear} title="Clear">
              {'\u2715'}
            </button>
          )}
        </div>
      </label>

      {focused && matches.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            zIndex: 10,
            top: '100%',
            left: 0,
            right: 0,
            margin: 0,
            padding: 4,
            listStyle: 'none',
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: 4,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          }}
        >
          {matches.map((u) => (
            <li key={u._id}>
              <button
                type="button"
                onClick={() => onSelect(u)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 8px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                {personLabel(u)}{' '}
                <span style={{ color: '#999' }}>({u.role})</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Default values used when no filters have been applied
const EMPTY_FILTERS = {
  senderId: '',
  senderQuery: '',
  receiverId: '',
  receiverQuery: '',
  conversationId: '',
  from: '',
  to: '',
  includeDeleted: false,
};

// Keyboard shortcuts helper
function useKeyboardShortcuts({
  searchInputRef,
  onClearFilters,
  onApplyFilters,
  onCloseModal,
  isModalOpen,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Do not trigger shortcuts while typing in form fields.
      const target = e.target;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT';

      if (isInput) return;

      // Ctrl+Shift+F or Cmd+Shift+F focuses the sender search field.
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Escape closes the delete confirmation modal.
      if (e.key === 'Escape' && isModalOpen) {
        e.preventDefault();
        onCloseModal();
        return;
      }

      // Ctrl+Enter or Cmd+Enter applies the filters.
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        onApplyFilters();
        return;
      }

      // Ctrl+Backspace or Cmd+Backspace clears the filters.
      if ((e.ctrlKey || e.metaKey) && e.key === 'Backspace') {
        e.preventDefault();
        onClearFilters();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    searchInputRef,
    onClearFilters,
    onApplyFilters,
    onCloseModal,
    isModalOpen,
  ]);
}

// Keyboard shortcuts indicator component
function KeyboardShortcuts() {
  return (
    <div
      style={{
        fontSize: 11,
        color: '#999',
        marginTop: 8,
        padding: '4px 8px',
        background: '#f5f5f5',
        borderRadius: '4px',
        display: 'inline-block',
        marginBottom: 8,
      }}
    >
      <span>⌨️ </span>
      <span style={{ marginRight: 12 }}>
        Ctrl+Shift+F: Focus search
      </span>
      <span style={{ marginRight: 12 }}>
        Ctrl+Enter: Apply filters
      </span>
      <span>Ctrl+Backspace: Clear filters</span>
    </div>
  );
}

// Admin page for viewing, filtering and moderating messages
export default function Messages() {
  // Stores the filters currently applied to the message list
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  // Stores filter values before they are applied
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);

  const [page, setPage] = useState(1);

  // Stores all users for the sender and receiver search fields
  const [users, setUsers] = useState([]);

  const [messages, setMessages] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    hasNext: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Stores the message selected for deletion
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Ref for the sender search input used by Ctrl+Shift+F.
  const searchInputRef = useRef(null);

  // Load the list of users when the page is opened
  useEffect(() => {
    getUsers()
      .then((data) => setUsers(data.users || []))
      .catch(() => setUsers([]));
  }, []);

  // Retrieve messages using the current page and applied filters
  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit: PAGE_SIZE,
        ...(appliedFilters.senderId
          ? { sender: appliedFilters.senderId }
          : {}),
        ...(appliedFilters.receiverId
          ? { receiver: appliedFilters.receiverId }
          : {}),
        ...(appliedFilters.conversationId
          ? { conversationId: appliedFilters.conversationId }
          : {}),
        ...(appliedFilters.from ? { from: appliedFilters.from } : {}),
        ...(appliedFilters.to ? { to: appliedFilters.to } : {}),
        ...(appliedFilters.includeDeleted
          ? { includeDeleted: 'true' }
          : {}),
      };

      const data = await getMessages(params);

      setMessages(data.messages || []);

      setPagination(
        data.pagination || {
          page,
          limit: PAGE_SIZE,
          total: 0,
          hasNext: false,
        }
      );
    } catch (err) {
      setError(
        err?.response?.data?.message || 'Failed to load messages'
      );
    } finally {
      setLoading(false);
    }
  };

  // Reload messages whenever the page or filters change
  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, appliedFilters]);

  // Apply the selected filters and reset to the first page
  const handleApplyFilters = (e) => {
    if (e) {
      e.preventDefault();
    }

    setPage(1);
    setAppliedFilters(draftFilters);
  };

  // Clear all filters and show every message again
  const handleClearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  };

  // Open the confirmation dialog before deleting a message
  const openDeleteConfirm = (message) => {
    setConfirmTarget(message);
    setDeleteReason('');
    setDeleteError('');
  };

  // Close the confirmation dialog unless a delete is in progress
  const closeDeleteConfirm = () => {
    if (deleting) return;

    setConfirmTarget(null);
    setDeleteReason('');
    setDeleteError('');
  };

  // Delete the selected message and refresh the table
  const confirmDelete = async () => {
    if (!confirmTarget) return;

    try {
      setDeleting(true);
      setDeleteError('');

      await deleteMessage(
        confirmTarget._id,
        deleteReason ? { reason: deleteReason } : undefined
      );

      setConfirmTarget(null);
      setDeleteReason('');

      // Return to the previous page if the current one becomes empty
      if (messages.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchMessages();
      }
    } catch (err) {
      setDeleteError(
        err?.response?.data?.message || 'Failed to delete message'
      );
    } finally {
      setDeleting(false);
    }
  };

  // Define the columns displayed in the messages table
  const columns = [
    {
      key: 'sender',
      header: 'Sender',
      render: (r) => personLabel(r.sender),
    },
    {
      key: 'receiver',
      header: 'Receiver',
      render: (r) => personLabel(r.receiver),
    },
    {
      key: 'content',
      header: 'Message',
      render: (r) => previewContent(r.content),
    },
    {
      key: 'timestamp',
      header: 'Sent',
      render: (r) => formatTimestamp(r.timestamp),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (r.isDeleted ? 'Deleted' : 'Active'),
    },
    {
      key: 'actions',
      header: '',
      render: (r) =>
        r.isDeleted ? (
          <span style={{ color: '#999' }}>{'\u2014'}</span>
        ) : (
          <button
            type="button"
            onClick={() => openDeleteConfirm(r)}
          >
            Delete
          </button>
        ),
    },
  ];

  const totalPages = Math.max(
    1,
    Math.ceil((pagination.total || 0) / PAGE_SIZE)
  );

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    searchInputRef,
    onClearFilters: handleClearFilters,
    onApplyFilters: handleApplyFilters,
    onCloseModal: closeDeleteConfirm,
    isModalOpen: !!confirmTarget,
  });

  return (
    <div>
      <h1>Messages</h1>

      <p style={{ color: '#777', marginTop: -8 }}>
        View and moderate platform messages. Deleting a message hides it
        (soft delete).
      </p>

      <KeyboardShortcuts />

      <form
        onSubmit={handleApplyFilters}
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          marginBottom: 16,
          marginTop: 8,
        }}
      >
        <UserTypeahead
          label="Sender"
          users={users}
          query={draftFilters.senderQuery}
          onQueryChange={(v) =>
            setDraftFilters((f) => ({
              ...f,
              senderQuery: v,
              senderId: '',
            }))
          }
          selectedId={draftFilters.senderId}
          onSelect={(u) =>
            setDraftFilters((f) => ({
              ...f,
              senderId: u._id,
              senderQuery: personLabel(u),
            }))
          }
          onClear={() =>
            setDraftFilters((f) => ({
              ...f,
              senderId: '',
              senderQuery: '',
            }))
          }
          inputRef={searchInputRef}
        />

        <UserTypeahead
          label="Receiver"
          users={users}
          query={draftFilters.receiverQuery}
          onQueryChange={(v) =>
            setDraftFilters((f) => ({
              ...f,
              receiverQuery: v,
              receiverId: '',
            }))
          }
          selectedId={draftFilters.receiverId}
          onSelect={(u) =>
            setDraftFilters((f) => ({
              ...f,
              receiverId: u._id,
              receiverQuery: personLabel(u),
            }))
          }
          onClear={() =>
            setDraftFilters((f) => ({
              ...f,
              receiverId: '',
              receiverQuery: '',
            }))
          }
        />

        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 12,
            color: '#555',
          }}
        >
          Conversation ID
          <input
            value={draftFilters.conversationId}
            onChange={(e) =>
              setDraftFilters((f) => ({
                ...f,
                conversationId: e.target.value,
              }))
            }
            placeholder="conversation id"
            style={{
              padding: '6px 8px',
              border: '1px solid #ccc',
              borderRadius: 4,
            }}
          />
        </label>

        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 12,
            color: '#555',
          }}
        >
          From
          <input
            type="date"
            value={draftFilters.from}
            onChange={(e) =>
              setDraftFilters((f) => ({
                ...f,
                from: e.target.value,
              }))
            }
            style={{
              padding: '6px 8px',
              border: '1px solid #ccc',
              borderRadius: 4,
            }}
          />
        </label>

        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 12,
            color: '#555',
          }}
        >
          To
          <input
            type="date"
            value={draftFilters.to}
            onChange={(e) =>
              setDraftFilters((f) => ({
                ...f,
                to: e.target.value,
              }))
            }
            style={{
              padding: '6px 8px',
              border: '1px solid #ccc',
              borderRadius: 4,
            }}
          />
        </label>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            paddingBottom: 6,
          }}
        >
          <input
            type="checkbox"
            checked={draftFilters.includeDeleted}
            onChange={(e) =>
              setDraftFilters((f) => ({
                ...f,
                includeDeleted: e.target.checked,
              }))
            }
          />
          Include deleted
        </label>

        <button type="submit">Apply filters</button>

        <button type="button" onClick={handleClearFilters}>
          Clear
        </button>
      </form>

      {loading ? (
        <LoadingComponent label={'Loading messages\u2026'} />
      ) : error ? (
        <p style={{ color: '#c00' }}>{error}</p>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={messages}
            empty="No messages found"
          />

          {pagination.total > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 12,
                color: '#555',
                fontSize: 14,
              }}
            >
              <span>
                Page {pagination.page} of {totalPages} ({pagination.total}{' '}
                total)
              </span>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() =>
                    setPage((p) => Math.max(1, p - 1))
                  }
                  disabled={page <= 1}
                >
                  Prev
                </button>

                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        open={!!confirmTarget}
        title="Delete this message?"
        onClose={closeDeleteConfirm}
      >
        {confirmTarget && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <p style={{ margin: 0, color: '#555' }}>
              From{' '}
              <strong>{personLabel(confirmTarget.sender)}</strong>{' '}
              to{' '}
              <strong>{personLabel(confirmTarget.receiver)}</strong>
              {': '}
              <em>{previewContent(confirmTarget.content)}</em>
            </p>

            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: '#777',
              }}
            >
              This hides the message from users but keeps it in the
              database (soft delete).
            </p>

            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                fontSize: 12,
                color: '#555',
              }}
            >
              Reason (optional)

              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={2}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                }}
              />
            </label>

            {deleteError && (
              <p style={{ color: '#c00', margin: 0 }}>
                {deleteError}
              </p>
            )}

            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={closeDeleteConfirm}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting\u2026' : 'Delete message'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
