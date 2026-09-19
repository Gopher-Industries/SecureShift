import './DataTable.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import Button from './Button';
import Modal from './Modal';
import Pagination from './Pagination';
import { useTheme } from '../theme/ThemeProvider';

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
  fileName = 'Data',
  controlledSortConfig = null,
  onSortChange = null,
  controlledPage = null,
  onPageChange = null,
  // --- Bulk actions / multi-select (opt-in) ---
  selectable = false,
  getRowId = (row, index) => row._id ?? row.id ?? index,
  bulkActions = [],
  onSelectionChange = null,
}) {
  const { colors } = useTheme();
  const [internalSortConfig, setInternalSortConfig] = useState({
    key: null,
    direction: 'asc',
  });
  const [internalPage, setInternalPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const isExternalPagination = pagination?.type === 'external';
  const isSortControlled = controlledSortConfig !== null;
  const isPageControlled = controlledPage !== null;

  const sortConfig = isSortControlled ? controlledSortConfig : internalSortConfig;

  const [openExport, setOpenExport] = useState(false);
  const [wholeOrPage, setWholeOrPage] = useState('current');
  const [exportPDF, setExportPDF] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
    const next =
      sortConfig.key === key
        ? {
            key,
            direction: sortConfig.direction === 'asc' ? 'desc' : 'asc',
          }
        : {
            key,
            direction: 'asc',
          };

    if (isSortControlled) {
      onSortChange?.(next);
    } else {
      setInternalSortConfig(next);
    }
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
    currentPage = isPageControlled ? controlledPage : internalPage;
    totalItems = sortedRows.length;
    totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    displayedRows = sortedRows.slice(startIndex, startIndex + pageSize);

    handlePageChange = isPageControlled ? (nextPage) => onPageChange?.(nextPage) : setInternalPage;
  }

  useEffect(() => {
    if (isExternalPagination || currentPage <= totalPages) return;

    if (isPageControlled) {
      onPageChange?.(totalPages);
    } else {
      setInternalPage(totalPages);
    }
  }, [currentPage, totalPages, isExternalPagination, isPageControlled, onPageChange]);

  useEffect(() => {
    if (!isExternalPagination && !isPageControlled) {
      setInternalPage(1);
    }
  }, [pageResetTrigger, isExternalPagination, isPageControlled]);

  useEffect(() => {
    if (isExternalPagination) {
      setWholeOrPage('current');
    }
  }, [isExternalPagination]);

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

  // For CSV/PDF
  const getText = (value) => {
    if (value == null) return '';

    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }

    if (Array.isArray(value)) {
      return value.map(getText).join(', ');
    }

    if (value?.props?.children !== undefined) {
      return getText(value.props.children);
    }

    return '';
  };

  // Export CSV
  const handleCSV = ({ columns, rows, fileName }) => {
    const escapeCSV = (value) => {
      return `"${String(value ?? '').replace(/"/g, '""')}"`;
    };

    const header = columns.map((c) => escapeCSV(getText(c.header)));

    const csvRows = rows.map((r) =>
      columns.map((c) => {
        const value = c.render ? getText(c.render(r)) : r[c.key];
        return escapeCSV(value);
      })
    );

    const refinedData = [header, ...csvRows];

    const csvContent = refinedData.map((row) => row.join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${fileName || 'Data'}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export PDF
  const handlePDF = ({ columns, rows, fileName }) => {
    const header = columns.map((c) => getText(c.header));

    const pdfRows = rows.map((r) =>
      columns.map((c) => (c.render ? getText(c.render(r)) : getText(r[c.key])))
    );

    const doc = new jsPDF();

    autoTable(doc, { head: [header], body: pdfRows });

    doc.save(`${fileName || 'Data'}.pdf`);
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const exportRows = wholeOrPage === 'current' ? displayedRows : sortedRows;

      handleCSV({ columns, rows: exportRows, fileName });

      if (exportPDF) {
        handlePDF({ columns, rows: exportRows, fileName });
      }

      closeExportModal();
    } finally {
      setIsExporting(false);
    }
  };

  const closeExportModal = () => {
    setOpenExport(false);
    setExportPDF(false);

    if (isExternalPagination) {
      setWholeOrPage('current');
    }
  };

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
                      style={{
                        padding: '10px 12px',
                        borderBottom: `1px solid ${colors.border}`,
                      }}
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
                      style={{
                        padding: '10px 12px',
                        borderBottom: `1px solid ${colors.border}`,
                      }}
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

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Button onClick={() => setOpenExport(true)} style={{ marginTop: 8 }}>
          Export
        </Button>

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={handlePageChange}
        />
      </div>

      <Modal open={openExport} title="Export table" onClose={closeExportModal}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div>
            <p
              style={{
                marginTop: 0,
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              Rows to export
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 8,
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: colors.text,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="exportScope"
                  value="current"
                  disabled={isExporting}
                  checked={wholeOrPage === 'current'}
                  onChange={() => setWholeOrPage('current')}
                />
                Current Page
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: isExternalPagination || totalPages <= 1 ? colors.muted : colors.text,
                  cursor: isExternalPagination || totalPages <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="exportScope"
                  value="whole"
                  checked={wholeOrPage === 'whole'}
                  disabled={isExporting || isExternalPagination || totalPages <= 1}
                  onChange={() => setWholeOrPage('whole')}
                />
                Whole Table
              </label>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}
            >
              Also export as a PDF?
              <input
                type="checkbox"
                disabled={isExporting}
                checked={exportPDF}
                onChange={(e) => setExportPDF(e.target.checked)}
              />
            </label>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
              }}
            >
              <Button onClick={closeExportModal} disabled={isExporting}>
                Cancel
              </Button>

              <Button onClick={handleExport} disabled={isExporting}>
                Export
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
