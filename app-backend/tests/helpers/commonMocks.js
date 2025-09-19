/**
 * Shared test helpers for mocks used across suites.
 *
 * Import examples:
 * import { makeUserConstructorMock, mockFindOneSelect, createSendOTPMock, createAuditMock, makeFindChain } from './helpers/commonMocks.js';
 *
 * Note: call `jest.mock()` in your test file and pass the mock function returned by these helpers
 * when you need to replace a module (e.g. sendEmail). This keeps mocks centralized while allowing
 * tests to control when the module is mocked (jest.mock must run before the module using it is imported).
 */

import * as userMockHelper from './userMockHelper.js';

// Re-export user mock helpers for convenience
export const makeUserConstructorMock = userMockHelper.makeUserConstructorMock;
export const mockFindOneSelect = userMockHelper.mockFindOneSelect;

/**
 * Create a sendOTP mock for use with jest.mock.
 * Example in test file (top-level):
 * const sendOTP = createSendOTPMock();
 * jest.mock('../src/utils/sendEmail.js', () => ({ sendOTP }));
 */
export function createSendOTPMock() {
  return jest.fn().mockResolvedValue(undefined);
}

/**
 * Create an audit.log mock for controllers that call req.audit.log(...)
 * Use in tests by injecting into the req object:
 * const auditLog = createAuditMock();
 * const req = { ..., audit: { log: auditLog } };
 */
export function createAuditMock() {
  return jest.fn().mockResolvedValue(undefined);
}

/**
 * Helpers to mock common Mongoose query chains used in controllers.
 *
 * makeFindChain(result) -> returns a function you can assign to Model.find / Model.findOne etc
 * Usage:
 * Model.find.mockImplementation(makeFindChain([item1, item2]));
 *
 * It provides chainable methods: sort(), skip(), limit(), lean(), select()
 * lean() and select() resolve to the provided result.
 */
export function makeFindChain(result) {
  // chainable mock that supports populate(...).populate(...).sort(...) and can be awaited
  const resolvedValue = () => (typeof result === 'function' ? result() : result);

  const chain = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockImplementation(() => Promise.resolve(resolvedValue())),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(resolvedValue()),
    select: jest.fn().mockResolvedValue(resolvedValue()),
    // support then for cases where test code awaits the chain directly without calling sort()
    then: function (onFulfilled) {
      return Promise.resolve(resolvedValue()).then(onFulfilled);
    },
  };
  return () => chain;
}

/**
 * Helper to mock Model.findOne().select(...) specifically when tests need a single document or null.
 * Example:
 * User.findOne.mockImplementation(makeFindOneSelect(user));
 */
export function makeFindOneSelect(value) {
  return () => ({
    select: jest.fn().mockResolvedValue(typeof value === 'function' ? value() : value),
  });
}

export function makeFindById(value) {
  return jest.fn().mockResolvedValue(typeof value === 'function' ? value() : value);
}
