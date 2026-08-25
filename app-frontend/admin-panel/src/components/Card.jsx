import colors from '../theme/colors';

// Reusable card container — consistent white surface, border, and radius
// for grouping content (forms, panels, summary blocks) across the admin panel.

export default function Card({ children, style, ...rest }) {
  return (
    <div
      style={{
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        padding: 20,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
