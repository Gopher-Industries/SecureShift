import './DataTable.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Pagination from './Pagination';
import colors from '../theme/colors';

// Header "select all" checkbox that shows an indeterminate state when only some
// of the current page's rows are selected.
function SelectAllCheckbox({ checked, indeterminate, onChange, label }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className="dt-checkbox"
      style={{ cursor: 'pointer' }}
    />
  );
}

/**
 * Internal pagination:
 * Pass all rows to the DataTable. The component handles splitting the rows
 * into pages using the pageSize value.
 *
 * Usage:
 * <DataTable
 *   columns={columns}
 *   rows={users}
 *   pageSize={10}
 * />
 *
 * External pagination:
 * Pass the rows returned for the current page and provide a pagination object.
 * The parent is responsible for fetching the correct page when onPageChange is called.
 * Sorting will only effect the page that is showing.
 *
 * Usage:
 * <DataTable
 *   columns={columns}
 *   rows={users}
 *   pageSize: {20}
 *   pagination={{
 *     type: 'external',
 *     page: page,
 *     totalItems: totalUsers,
 *     onPageChange: setPage,
 *   }}
 * />
 */

export default function DataTable({
  columns = [],
  rows = [],
  empty = 'No records found',
  pageSize = 10,
  pagination = null,
  pageResetTrigger = null,
  // --- Bulk actions / multi-select (opt-in) ---
  selectable = false,
  getRowId = (row, index) => row._id ?? row.id ?? index,
  bulkActions = [],
  onSelectionChange = null,
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [internalPage, setInternalPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const isExternalPagination = pagination?.type === 'external';

  // Gets the value that should be used when sorting a column
  const getSortValue = (row, column) => {
    let value = row[column.key];

    // If the column has a render function, use the rendered string for sorting
    if (column.render) {
      const rendered = column.render(row);
      if (typeof rendered === 'string') value = rendered;
    }

    if (value == null) return null;

    // Convert DD/MM/YYYY dates into YYYYMMDD numbers so they sort correctly by year, month and day
    if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [day, month, year] = value.split('/').map(Number);
      return year * 10000 + month * 100 + day;
    }

    return value;
  };

  // Changes the selected sort column or reverses the current sort direction
  const handleSort = (key) => {
    setSortConfig((current) => {
      if (current.key === key)
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      return { key, direction: 'asc' };
    });
  };

  // Create a copy of the rows and sort them based on sortConfig
  const sortedRows = [...rows].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const column = columns.find((c) => c.key === sortConfig.key);

    if (!column) return 0;

    const aVal = getSortValue(a, column);
    const bVal = getSortValue(b, column);

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    let comparison;

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal;
    } else {
      comparison = String(aVal).localeCompare(String(bVal), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  let currentPage, totalItems, totalPages, displayedRows, handlePageChange;

  // External pagination
  if (isExternalPagination) {
    currentPage = pagination.page;
    totalItems = pagination.totalItems;
    totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    displayedRows = sortedRows;
    handlePageChange = pagination.onPageChange;
  } else {
    // Internal pagination
    currentPage = internalPage;
    totalItems = sortedRows.length;
    totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    displayedRows = sortedRows.slice(startIndex, startIndex + pageSize);
    handlePageChange = setInternalPage;
  }

  useEffect(() => {
    if (!isExternalPagination && internalPage > totalPages) {
      setInternalPage(totalPages);
    }
  }, [internalPage, totalPages, isExternalPagination]);

  useEffect(() => {
    if (!isExternalPagination) {
      setInternalPage(1);
    }
  }, [pageResetTrigger, isExternalPagination]);

  // ---- Selection ----
  const rowIdOf = useCallback((row, index) => String(getRowId(row, index)), [getRowId]);

  const selectedRows = useMemo(
    () => rows.filter((r, i) => selectedIds.has(rowIdOf(r, i))),
    [rows, selectedIds, rowIdOf]
  );

  // Drop selected ids that are no longer present in the data.
  useEffect(() => {
    if (!selectable) return;
    setSelectedIds((prev) => {
      const present = new Set(rows.map((r, i) => rowIdOf(r, i)));
      let changed = false;
      const next = new Set();
      prev.forEach((id) => {
        if (present.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [rows, selectable, rowIdOf]);

  // Notify parent when the selection changes.
  useEffect(() => {
    if (selectable && onSelectionChange) onSelectionChange(selectedRows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds]);

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const pageIds = displayedRows.map((r, i) => rowIdOf(r, i));
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  const toggleAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const runBulkAction = (action) => {
    if (action.confirm && !window.confirm(action.confirm)) return;
    action.onClick(selectedRows);
    if (action.clearAfter !== false) clearSelection();
  };

  if (!rows.length) return <p style={{ color: colors.muted }}>{empty}</p>;

  return (
    <>
      {selectable && selectedRows.length > 0 && (
        <div
          role="toolbar"
          aria-label="Bulk actions"
          style={{
            alignItems: 'center',
            background: colors.tableHead,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            display: 'flex',
            gap: 12,
            marginBottom: 10,
            padding: '8px 12px',
          }}
        >
          <span style={{ color: colors.text, fontWeight: 600 }}>
            {selectedRows.length} selected
          </span>
          <button
            type="button"
            onClick={clearSelection}
            style={{
              background: 'none',
              border: 'none',
              color: colors.primary,
              cursor: 'pointer',
              font: 'inherit',
              padding: 0,
            }}
          >
            Clear
          </button>
          <span style={{ flex: 1 }} />
          {bulkActions.map((action) => (
            <button
              key={action.key ?? action.label}
              type="button"
              onClick={() => runBulkAction(action)}
              style={{
                background: action.variant === 'danger' ? colors.danger : colors.primary,
                border: 'none',
                borderRadius: 6,
                color: colors.white,
                cursor: 'pointer',
                fontWeight: 600,
                padding: '6px 12px',
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
      <div className="dt-scroll-wrapper">
        <table style={{ width: '100%', borderCollapse: 'collapse', background: colors.card }}>
          <thead>
            <tr>
              {selectable && (
                <th
                  style={{
                    padding: '10px 12px',
                    borderBottom: `2px solid ${colors.border}`,
                    background: colors.tableHead,
                    width: 40,
                  }}
                >
                  <SelectAllCheckbox
                    checked={allPageSelected}
                    indeterminate={!allPageSelected && somePageSelected}
                    onChange={toggleAllOnPage}
                    label="Select all rows on this page"
                  />
                </th>
              )}
              {columns.map((c) => {
                const isSorted = sortConfig.key === c.key;
                return (
                  <th
                    key={c.key}
                    aria-sort={
                      c.header
                        ? isSorted
                          ? sortConfig.direction === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                        : undefined
                    }
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderBottom: `2px solid ${colors.border}`,
                      background: colors.tableHead,
                    }}
                  >
                    {c.header && (
                      <button
                        type="button"
                        onClick={() => handleSort(c.key)}
                        className="dt-sort-btn"
                        style={{
                          border: 'none',
                          background: 'none',
                          padding: 0,
                          font: 'inherit',
                          fontWeight: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        {c.header}
                        {isSorted && (
                          <span aria-hidden="true" style={{ marginLeft: 6 }}>
                            {sortConfig.direction === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {displayedRows.map((r, i) => {
              const id = rowIdOf(r, i);
              const isSelected = selectedIds.has(id);
              return (
                <tr
                  key={r._id || i}
                  style={isSelected ? { background: colors.tableHead } : undefined}
                >
                  {selectable && (
                    <td
                      style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.border}` }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(id)}
                        aria-label={`Select row ${i + 1}`}
                        className="dt-checkbox"
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.border}` }}
                    >
                      {c.render ? c.render(r) : r[c.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        page={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={handlePageChange}
      />
    </>
  );
}
