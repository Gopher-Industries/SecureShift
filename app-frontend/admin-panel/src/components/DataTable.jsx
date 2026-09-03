import { useEffect, useState } from 'react';
import colors from '../theme/colors';
import Pagination from './Pagination';

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
 *
 * Usage:
 * <DataTable
 *   columns={columns}
 *   rows={users}
 *   pageSize: 20
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
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [internalPage, setInternalPage] = useState(1);
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

  if (!rows.length) return <p style={{ color: colors.muted }}>{empty}</p>;

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
