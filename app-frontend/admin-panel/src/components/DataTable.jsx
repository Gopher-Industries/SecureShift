import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import Button from './Button';
import Modal from './Modal';
import Pagination from './Pagination';
import colors from '../theme/colors';

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
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [internalPage, setInternalPage] = useState(1);
  const isExternalPagination = pagination?.type === 'external';

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

  useEffect(() => {
    if (isExternalPagination) {
      setWholeOrPage('current');
    }
  }, [isExternalPagination]);

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
      <table style={{ width: '100%', borderCollapse: 'collapse', background: colors.card }}>
        <thead>
          <tr>
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
          {displayedRows.map((r, i) => (
            <tr key={r._id || i}>
              {columns.map((c) => (
                <td
                  key={c.key}
                  style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.border}` }}
                >
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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
