// AP-046 — mock/session audit trail for "View As".
// No backend yet (per ticket scope) — logs are kept in sessionStorage so they
// survive page navigation within the tab, plus mirrored to console for the
// demo/evidence recording. The shape here is deliberately the same shape a
// future `POST /admin/audit-logs` call would send, so the backend follow-up
// (checklist item "wire backend grant") is a drop-in, not a rewrite.

const STORAGE_KEY = 'viewAsAuditLog';

function readLog() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function writeLog(entries) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // sessionStorage unavailable (e.g. private mode) — audit is best-effort for the mock build.
  }
}

function record(entry) {
  const full = { ...entry, timestamp: new Date().toISOString() };
  const entries = [...readLog(), full];
  writeLog(entries);
  // eslint-disable-next-line no-console
  console.info('[view-as audit]', full);
  return full;
}

export const viewAsAudit = {
  start: ({ adminId, targetUserId, targetRole }) =>
    record({ action: 'VIEW_AS_START', adminId, targetUserId, targetRole }),

  end: ({ adminId, targetUserId, targetRole }) =>
    record({ action: 'VIEW_AS_END', adminId, targetUserId, targetRole }),

  blockedWrite: ({ adminId, targetUserId, targetRole, method, url }) =>
    record({ action: 'VIEW_AS_BLOCKED_WRITE', adminId, targetUserId, targetRole, method, url }),

  getAll: () => readLog(),
};

export default viewAsAudit;
