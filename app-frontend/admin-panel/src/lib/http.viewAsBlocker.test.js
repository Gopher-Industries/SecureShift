import http, { setViewAsState, attachViewAsWriteBlocker } from './http';
import viewAsAudit from '../utils/viewAsAudit';

// AP-046 — verifies the axios-level write-blocking and audit trail for View As.
// Accesses the registered interceptor's handler directly (via axios's internal
// `handlers` array) rather than making a real network call, since this project
// has no adapter mock configured for http.js.

describe('View As write blocker (attachViewAsWriteBlocker)', () => {
  let interceptor;

  beforeAll(() => {
    attachViewAsWriteBlocker(jest.fn());
    const handlers = http.interceptors.request.handlers;
    interceptor = handlers[handlers.length - 1].fulfilled;
  });

  beforeEach(() => {
    sessionStorage.clear();
    setViewAsState({ active: false, user: null });
  });

  it('passes GET requests through unchanged while View As is active', async () => {
    setViewAsState({ active: true, user: { id: 'u1', role: 'admin' } });
    const config = { method: 'get', url: '/admin/users' };
    const result = await interceptor(config);
    expect(result).toBe(config);
  });

  it('rejects a POST request while View As is active, flagged as blocked', async () => {
    setViewAsState({ active: true, user: { id: 'u1', role: 'admin' } });
    const config = { method: 'post', url: '/admin/users/123' };

    await expect(interceptor(config)).rejects.toMatchObject({
      isViewAsBlocked: true,
    });
  });

  it('allows POST requests through when View As is not active', async () => {
    setViewAsState({ active: false, user: null });
    const config = { method: 'post', url: '/admin/users/123' };
    const result = await interceptor(config);
    expect(result).toBe(config);
  });

  it('logs a blockedWrite audit entry when a write is rejected', async () => {
    setViewAsState({ active: true, user: { id: 'u1', role: 'admin' } });
    const config = { method: 'delete', url: '/admin/users/456' };

    await expect(interceptor(config)).rejects.toBeTruthy();

    const log = viewAsAudit.getAll();
    const entry = log.find((e) => e.action === 'VIEW_AS_BLOCKED_WRITE');
    expect(entry).toBeDefined();
    expect(entry.method).toBe('DELETE');
    expect(entry.url).toBe('/admin/users/456');
  });
});

describe('viewAsAudit', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('records a start and end event', () => {
    viewAsAudit.start({ adminId: 'a1', targetUserId: 'u1', targetRole: 'guard' });
    viewAsAudit.end({ adminId: 'a1', targetUserId: 'u1', targetRole: 'guard' });

    const log = viewAsAudit.getAll();
    expect(log.map((e) => e.action)).toEqual(['VIEW_AS_START', 'VIEW_AS_END']);
  });
});
