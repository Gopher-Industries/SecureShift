export default function SearchFilter({ value, onChange, placeholder = 'Search\u2026' }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        padding: '8px 12px',
        border: '1px solid #ccc',
        borderRadius: 4,
        marginBottom: 16,
        width: 280,
      }}
    />
  );
}
