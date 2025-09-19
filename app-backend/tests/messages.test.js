import { jest } from '@jest/globals';

 // Mock Message model as a constructor returning an instance with save/populate
 jest.mock('../src/models/Message.js', () => {
   return {
     __esModule: true,
     default: jest.fn().mockImplementation(function MockMessage(data) {
       Object.assign(this, data);
       this._id = 'msg-1';
       this.timestamp = Date.now();
       this.isRead = false;
       this.save = jest.fn().mockResolvedValue(this);
       this.populate = jest.fn().mockResolvedValue(this);
     }),
   };
 });

// Mock express-validator validationResult
jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

import { sendMessage } from '../src/controllers/message.controller.js';
import Message from '../src/models/Message.js';
import User from '../src/models/User.js';
import { validationResult } from 'express-validator';
import { makeFindById } from './helpers/commonMocks.js';
import {
  getInboxMessages,
  getSentMessages,
  getConversation,
  markMessageAsRead,
  getMessageStats
} from '../src/controllers/message.controller.js';
import { makeFindChain } from './helpers/commonMocks.js';

describe('messages (unit)', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // reset mocks
    User.findById = makeFindById(null);
    validationResult.mockReset();
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('sends a message successfully between guard -> employer', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    User.findById.mockResolvedValue({ _id: 'r1', role: 'employer', name: 'Receiver', email: 'r@example.com' });

    req = {
      body: { receiverId: 'r1', content: 'Hello there' },
      user: { id: 's1', role: 'guard' },
      audit: { log: jest.fn().mockResolvedValue(undefined) },
    };

    await sendMessage(req, res, next);

    expect(User.findById).toHaveBeenCalledWith('r1');
    // Ensure an instance was created and saved
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        messageId: 'msg-1',
        content: 'Hello there',
      })
    }));
    // audit was called
    expect(req.audit.log).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects sending message to self', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });

    req = {
      body: { receiverId: 's1', content: 'Self message' },
      user: { id: 's1', role: 'guard' },
      audit: { log: jest.fn() },
    };

    await sendMessage(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(400);
  });

  it('rejects when receiver not found', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    User.findById.mockResolvedValue(null);

    req = {
      body: { receiverId: 'r2', content: 'Hello' },
      user: { id: 's1', role: 'guard' },
      audit: { log: jest.fn() },
    };

    await sendMessage(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(404);
  });

  it('rejects invalid role communication (guard -> guard)', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    User.findById.mockResolvedValue({ _id: 'r3', role: 'guard' });

    req = {
      body: { receiverId: 'r3', content: 'Hello' },
      user: { id: 's1', role: 'guard' },
      audit: { log: jest.fn() },
    };

    await sendMessage(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(403);
  });

  it('returns validation errors via next', async () => {
    validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'Bad' }] });

    req = {
      body: { receiverId: 'r4', content: '' },
      user: { id: 's1', role: 'guard' },
      audit: { log: jest.fn() },
    };

    await sendMessage(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(400);
    expect(err.details).toEqual([{ msg: 'Bad' }]);
  });

  it('returns validation error for too-long content', async () => {
    // simulate validator finding content too long
    const longContent = 'a'.repeat(5001); // over typical limits
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ msg: 'Content too long', param: 'content' }]
    });

    req = {
      body: { receiverId: 'r5', content: longContent },
      user: { id: 's1', role: 'guard' },
      audit: { log: jest.fn() },
    };

    await sendMessage(req, res, next);

    expect(next).toHaveBeenCalled();
    const err2 = next.mock.calls[0][0];
    expect(err2).toBeInstanceOf(Error);
    expect(err2.status).toBe(400);
    expect(err2.details).toEqual([{ msg: 'Content too long', param: 'content' }]);
  });

  it('rejects empty content via validation (explicit)', async () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ msg: 'Content is required', param: 'content' }]
    });

    req = {
      body: { receiverId: 'r6', content: '' },
      user: { id: 's1', role: 'guard' },
      audit: { log: jest.fn() },
    };

    await sendMessage(req, res, next);

    expect(next).toHaveBeenCalled();
    const err3 = next.mock.calls[0][0];
    expect(err3).toBeInstanceOf(Error);
    expect(err3.status).toBe(400);
    expect(err3.details).toEqual([{ msg: 'Content is required', param: 'content' }]);
  });

  // Additional coverage: inbox, sent, conversation, mark-as-read, stats

  it('returns inbox messages and unread count', async () => {
    const userId = 'u-inbox';
    const fakeMessages = [
      { _id: 'm1', content: 'hi', sender: { _id: 's1' }, receiver: userId, timestamp: Date.now() },
      { _id: 'm2', content: 'hello', sender: { _id: 's2' }, receiver: userId, timestamp: Date.now() },
    ];
    Message.find = jest.fn().mockImplementation(makeFindChain(fakeMessages));
    Message.getUnreadCount = jest.fn().mockResolvedValue(5);

    req = { user: { id: userId } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();

    await getInboxMessages(req, res, next);

    expect(Message.find).toHaveBeenCalledWith({ receiver: userId });
    expect(Message.getUnreadCount).toHaveBeenCalledWith(userId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        messages: expect.any(Array),
        unreadCount: 5
      })
    }));
  });

  it('returns sent messages', async () => {
    const userId = 'u-sent';
    const fakeMessages = [{ _id: 'm1', content: 'sent', sender: userId, receiver: 'r1' }];
    Message.find = jest.fn().mockImplementation(makeFindChain(fakeMessages));

    req = { user: { id: userId } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();

    await getSentMessages(req, res, next);

    expect(Message.find).toHaveBeenCalledWith({ sender: userId });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        messages: expect.any(Array),
        totalMessages: fakeMessages.length
      })
    }));
  });

  it('retrieves conversation and marks as read', async () => {
    const currentUser = 'u1';
    const otherUser = { _id: 'u2', name: 'Other', email: 'o@example.com' };
    const convo = [{ _id: 'c1', content: 'a' }, { _id: 'c2', content: 'b' }];

    User.findById = jest.fn().mockResolvedValue(otherUser);
    Message.getConversation = jest.fn().mockResolvedValue(convo);
    Message.markAsRead = jest.fn().mockResolvedValue({ modifiedCount: 2 });

    req = { user: { id: currentUser }, params: { userId: otherUser._id } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();

    await getConversation(req, res, next);

    expect(User.findById).toHaveBeenCalledWith(otherUser._id);
    expect(Message.getConversation).toHaveBeenCalledWith(currentUser, otherUser._id);
    expect(Message.markAsRead).toHaveBeenCalledWith(currentUser, otherUser._id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        conversation: expect.objectContaining({
          participant: expect.objectContaining({ id: otherUser._id })
        })
      })
    }));

    // Explicit conversation participant id equality assertion
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data.conversation.participant.id).toBe(otherUser._id);
  });

  it('mark message as read: success and unauthorized', async () => {
    const userId = 'reader1';
    const message = {
      _id: 'msg-read',
      receiver: userId,
      sender: 'sender1',
      isRead: false,
      save: jest.fn().mockResolvedValue(true)
    };
    // success path
    Message.findById = jest.fn().mockResolvedValue(message);
    req = { user: { id: userId }, params: { messageId: message._id }, audit: { log: jest.fn() } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();

    await markMessageAsRead(req, res, next);

    expect(Message.findById).toHaveBeenCalledWith(message._id);
    expect(message.save).toHaveBeenCalled();
    expect(req.audit.log).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ messageId: message._id, isRead: true })
    }));

    // unauthorized path
    const otherMessage = { _id: 'm2', receiver: 'someoneElse' };
    Message.findById = jest.fn().mockResolvedValue(otherMessage);
    req = { user: { id: userId }, params: { messageId: otherMessage._id }, audit: { log: jest.fn() } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();

    await markMessageAsRead(req, res, next);

    expect(next).toHaveBeenCalled();
    const err2 = next.mock.calls[0][0];
    expect(err2).toBeInstanceOf(Error);
    expect(err2.status).toBe(403);
  });

  it('returns message stats', async () => {
    const userId = 'statUser';
    Message.countDocuments = jest.fn()
      .mockResolvedValueOnce(4) // unreadCount
      .mockResolvedValueOnce(10) // sentCount
      .mockResolvedValueOnce(6); // receivedCount

    req = { user: { id: userId } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();

    await getMessageStats(req, res, next);

    expect(Message.countDocuments).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        unreadMessages: 4,
        sentMessages: 10,
        receivedMessages: 6,
        totalMessages: 16
      })
    }));
  });

  it('getMessageStats forwards error when counts fail', async () => {
    const userId = 'statUserFail';
    const dbErr = new Error('DB fail');
    // Make first call reject to simulate failure
    Message.countDocuments = jest.fn().mockRejectedValue(dbErr);

    req = { user: { id: userId } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();

    await getMessageStats(req, res, next);

    expect(Message.countDocuments).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBe(dbErr);
  });
});
