import colors from '../theme/colors';

export default function DataTable({ columns = [], rows = [], empty = 'No records found' }) {
  if (!rows.length) return <p style={{ color: colors.muted }}>{empty}</p>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', background: colors.card }}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th
              key={c.key}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                borderBottom: `2px solid ${colors.border}`,
                background: colors.tableHead,
              }}
            >
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
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
