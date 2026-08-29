import { useState } from 'react';
import colors from '../theme/colors';

export default function DataTable({ columns = [], rows = [], empty = 'No records found' }) {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc',
  });

  if (!rows.length) return <p style={{ color: colors.muted }}>{empty}</p>;

  const handleSort = (key) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return {
        key,
        direction: 'asc',
      };
    });
  };

  const getSortValue = (row, column) => {
    let value = row[column.key];

    if (column.render) {
      const rendered = column.render(row);

      if (typeof rendered === 'string') {
        value = rendered;
      }
    }

    if (value == null) {
      return null;
    }

    return value;
  };

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

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', background: colors.card }}>
      <thead>
        <tr>
          {columns.map((c) => {
            const isSorted = sortConfig.key === c.key;

            return (
              <th
                key={c.key}
                aria-sort={
                  isSorted ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'
                }
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderBottom: `2px solid ${colors.border}`,
                  background: colors.tableHead,
                }}
              >
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
              </th>
            );
          })}
        </tr>
      </thead>

      <tbody>
        {sortedRows.map((r, i) => (
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
  );
}
