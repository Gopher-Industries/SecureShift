/**
 * Small helpers for mocking User model behaviors in tests.
 *
 * Usage:
 * const { makeUserConstructorMock, mockFindOneSelect } = require('./helpers/userMockHelper');
 *
 * In ESM/Jest modules import with:
 * import { makeUserConstructorMock, mockFindOneSelect } from './helpers/userMockHelper.js';
 */

export function makeUserConstructorMock() {
  const UserMock = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
    this.matchPassword = jest.fn();
    this.toObject = function () { return { ...this }; };
  });

  // static helpers (will be set by tests as needed)
  UserMock.findOne = jest.fn();
  UserMock.create = jest.fn();
  UserMock.findById = jest.fn();

  return UserMock;
}

export function mockFindOneSelect(UserMock, valueOrFactory) {
  // valueOrFactory can be a direct value or a function returning a value
  UserMock.findOne.mockImplementation(() => ({
    select: jest.fn().mockResolvedValue(typeof valueOrFactory === 'function' ? valueOrFactory() : valueOrFactory),
  }));
}
