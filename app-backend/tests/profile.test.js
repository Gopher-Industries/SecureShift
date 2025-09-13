import { jest } from '@jest/globals';

import {
  getMyProfile,
  updateMyProfile,
  adminGetUserProfile,
  adminUpdateUserProfile,
} from '../src/controllers/user.controller.js';

import User from '../src/models/User.js';

// ensure ACTIONS global exists (controller references ACTIONS)
global.ACTIONS = { PROFILE_UPDATED: 'profile_updated' };

describe('user.controller (unit)', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // reset mocks on model
    User.findById = jest.fn();
    User.findByIdAndUpdate = jest.fn();

    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('getMyProfile - returns current user without password', async () => {
    User.findById.mockImplementation(() => ({
      select: jest.fn().mockResolvedValue({ _id: 'u1', name: 'Alice', email: 'a@x.com' }),
    }));

    req = { user: { id: 'u1' } };

    await getMyProfile(req, res, next);

    expect(User.findById).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith({ _id: 'u1', name: 'Alice', email: 'a@x.com' });
  });

  it('updateMyProfile - filters out role and password and returns updated user', async () => {
    const returned = { _id: 'u1', name: 'New Name', email: 'a@x.com' };
    User.findByIdAndUpdate.mockImplementation(() => ({
      select: jest.fn().mockResolvedValue(returned),
    }));

    req = {
      user: { id: 'u1' },
      body: { name: 'New Name', role: 'admin', password: 'newpass' },
    };

    await updateMyProfile(req, res, next);

    // ensure role/password were removed from update payload
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'u1',
      { name: 'New Name' },
      { new: true, runValidators: true }
    );

    expect(res.json).toHaveBeenCalledWith(returned);
  });

  it('adminGetUserProfile - returns 404 when user not found', async () => {
    User.findById.mockImplementation(() => ({
      select: jest.fn().mockResolvedValue(null),
    }));

    req = { params: { id: 'missing' }, user: { id: 'admin1' } };

    await adminGetUserProfile(req, res, next);

    expect(User.findById).toHaveBeenCalledWith('missing');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  it('adminUpdateUserProfile - when update returns null should 404 and still log once', async () => {
    // findByIdAndUpdate resolves to null via select
    User.findByIdAndUpdate.mockImplementation(() => ({
      select: jest.fn().mockResolvedValue(null),
    }));

    const auditLog = jest.fn().mockResolvedValue(undefined);

    req = {
      params: { id: 'u2' },
      body: { name: 'X', password: 'secret' },
      user: { id: 'admin1' },
      audit: { log: auditLog },
    };

    await adminUpdateUserProfile(req, res, next);

    // audit logged once (controller logs before checking updatedUser)
    expect(auditLog).toHaveBeenCalledTimes(1);
    expect(auditLog.mock.calls[0][0]).toBe('admin1');
    expect(auditLog.mock.calls[0][1]).toBe(global.ACTIONS.PROFILE_UPDATED);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  it('adminUpdateUserProfile - successful update logs twice and returns updated user', async () => {
    const updated = { _id: 'u2', name: 'X' };
    User.findByIdAndUpdate.mockImplementation(() => ({
      select: jest.fn().mockResolvedValue(updated),
    }));

    const auditLog = jest.fn().mockResolvedValue(undefined);

    req = {
      params: { id: 'u2' },
      body: { name: 'X', password: 'secret' },
      user: { id: 'admin1' },
      audit: { log: auditLog },
    };

    await adminUpdateUserProfile(req, res, next);

    // first audit log before existence check, second after success
    expect(auditLog).toHaveBeenCalledTimes(2);
    expect(auditLog.mock.calls[0][0]).toBe('admin1');
    expect(auditLog.mock.calls[0][1]).toBe(global.ACTIONS.PROFILE_UPDATED);
    expect(auditLog.mock.calls[1][0]).toBe('admin1');
    expect(auditLog.mock.calls[1][1]).toBe(global.ACTIONS.PROFILE_UPDATED);

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'u2',
      { name: 'X' },
      { new: true, runValidators: true }
    );

    expect(res.json).toHaveBeenCalledWith(updated);
  });
});
