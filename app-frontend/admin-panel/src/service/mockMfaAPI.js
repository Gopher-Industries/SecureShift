// Mock 2FA API for AP-062 UI scaffolding.
// Client-only: simulates the enrol / confirm / recovery / disable flow until the
// real backend endpoints land (coordinate with the backend lead). No real TOTP
// secret is ever stored client-side — the secret shown is a fixed demo value and
// only an "enabled" flag + remaining-recovery count are kept in localStorage.
const KEY = 'mockMfaEnabled';
const AT_KEY = 'mockMfaEnabledAt';
const RC_KEY = 'mockMfaRecoveryRemaining';
const DEMO_SECRET = 'JBSWY3DPEHPK3PXP'; // demo only, not tied to any account
const DEMO_QR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="168" height="168">' +
      '<rect width="168" height="168" fill="#ffffff"/>' +
      '<rect x="8" y="8" width="152" height="152" fill="none" stroke="#111827"/>' +
      '<text x="84" y="80" font-size="13" text-anchor="middle" fill="#111827">DEMO QR</text>' +
      '<text x="84" y="100" font-size="9" text-anchor="middle" fill="#6b7280">enter the secret manually</text>' +
      '</svg>'
  );
const delay = (value, ms = 300) => new Promise((res) => setTimeout(() => res(value), ms));
const genRecoveryCodes = () =>
  Array.from({ length: 8 }, () => {
    const p = () => Math.random().toString(36).slice(2, 7).toUpperCase();
    return `${p()}-${p()}`;
  });

export const getMfaStatus = () => {
  const enabled = localStorage.getItem(KEY) === 'true';
  return delay({
    available: true,
    enabled,
    enabledAt: enabled ? localStorage.getItem(AT_KEY) : null,
    recoveryCodesRemaining: enabled ? Number(localStorage.getItem(RC_KEY) || 8) : 0,
  });
};
export const startMfaEnrollment = () => delay({ secret: DEMO_SECRET, qrDataUrl: DEMO_QR });
export const confirmMfaEnrollment = (code) => {
  if (!/^\d{6}$/.test(String(code || '').trim())) {
    return Promise.reject({
      response: { data: { message: 'Enter the 6-digit code from your authenticator app.' } },
    });
  }
  const recoveryCodes = genRecoveryCodes();
  localStorage.setItem(KEY, 'true');
  localStorage.setItem(AT_KEY, new Date().toISOString());
  localStorage.setItem(RC_KEY, String(recoveryCodes.length));
  return delay({ recoveryCodes });
};
export const disableMfa = () => {
  localStorage.removeItem(KEY);
  localStorage.removeItem(AT_KEY);
  localStorage.removeItem(RC_KEY);
  return delay({});
};
