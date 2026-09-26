import { createContext, useCallback, useContext, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getToken } from '../utils/authentication';
import viewAsAudit from '../utils/viewAsAudit';
import { setViewAsState } from '../lib/http';

// AP-046 — "View As" (read-only impersonation), mock/session-driven.
//
// Scope note: no backend grant exists yet (per ticket). This context is the
// seam the backend follow-up plugs into later — start()/end() just need to
// become real API calls at that point, the rest of the app doesn't change.

const ViewAsContext = createContext(null);

function getAdminId() {
  try {
    return jwtDecode(getToken())?.id || null;
  } catch {
    return null;
  }
}

export function ViewAsProvider({ children }) {
  const [viewAsUser, setViewAsUser] = useState(null); // { id, name, role } | null

  const active = Boolean(viewAsUser);

  const startViewAs = useCallback((user) => {
    // user: { id, name, role } — the target being impersonated (read-only)
    setViewAsUser(user);
    setViewAsState({ active: true, user });
    viewAsAudit.start({
      adminId: getAdminId(),
      targetUserId: user.id,
      targetRole: user.role,
    });
  }, []);

  const exitViewAs = useCallback(() => {
    if (viewAsUser) {
      viewAsAudit.end({
        adminId: getAdminId(),
        targetUserId: viewAsUser.id,
        targetRole: viewAsUser.role,
      });
    }
    setViewAsUser(null);
    setViewAsState({ active: false, user: null });
  }, [viewAsUser]);

  return (
    <ViewAsContext.Provider value={{ active, viewAsUser, startViewAs, exitViewAs }}>
      {children}
    </ViewAsContext.Provider>
  );
}

export function useViewAs() {
  const ctx = useContext(ViewAsContext);
  if (!ctx) {
    throw new Error('useViewAs must be used within a ViewAsProvider');
  }
  return ctx;
}

export default ViewAsContext;
