export default function DataTable({ columns = [], rows = [], empty = 'No records found' }) {
  if (!rows.length) return <p style={{ color: '#777' }}>{empty}</p>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th
              key={c.key}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                borderBottom: '2px solid #e5e7eb',
                background: '#f3f4f6',
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
              <td key={c.key} style={{ padding: '10px 12px', borderBottom: '1px solid #eef0f3' }}>
                {c.render ? c.render(r) : r[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
