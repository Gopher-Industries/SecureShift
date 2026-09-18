import { useViewAs } from '../context/ViewAsContext';
import colors from '../theme/colors';

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '10px 20px',
    background: colors.warning,
    color: colors.white,
    fontSize: 14,
    fontWeight: 600,
  },
  exitBtn: {
    border: `1px solid ${colors.white}`,
    background: 'transparent',
    color: colors.white,
    borderRadius: 80,
    padding: '6px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
};

export default function ViewAsBanner() {
  const { active, viewAsUser, exitViewAs } = useViewAs();

  if (!active) return null;

  return (
    <div style={styles.bar} role="status" aria-live="polite">
      <span>
        Viewing as <strong>{viewAsUser.name}</strong> ({viewAsUser.role}) — Read-only mode
      </span>
      <button style={styles.exitBtn} onClick={exitViewAs}>
        Exit View As
      </button>
    </div>
  );
}
