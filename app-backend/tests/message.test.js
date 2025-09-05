import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Message from '../src/models/Message.js';
// Use a self-contained mock for auth middleware so jest.mock factory doesn't close over test-scope variables
jest.mock('../src/middleware/auth.js', () => ({
  __esModule: true,
  default: (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];

    // Recognize a few deterministic tokens used in tests
    if (token === 'guard-token') {
      req.user = { id: 'guard1', role: 'guard' };
    } else if (token === 'employer-token') {
      req.user = { id: 'employer1', role: 'employer' };
    } else if (token === 'valid-token') {
      req.user = { id: 'user123', role: 'guard' };
    } else {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    next();
  },
}));

describe('Message API', () => {
  let guardUser, employerUser, guardToken, employerToken;
  let consoleErrorSpy;

  beforeAll(() => {
    // Set up mock users and tokens for testing
  guardUser = { id: 'guard1', role: 'guard', name: 'Guard One' };
  employerUser = { id: 'employer1', role: 'employer', name: 'Employer One' };

  // Use deterministic test tokens recognized by the mock above
  guardToken = 'guard-token';
  employerToken = 'employer-token';
  });

  // Clear all mocks after each test
  afterEach(() => {
  // Do not restore all mocks here because we use a console.error spy
  // that should remain active for the entire suite. Clearing mocks is
  // sufficient to reset call counts on mocks created within tests.
  jest.clearAllMocks();
  });

  // Suppress noisy error logs produced by negative-case tests so output is readable
  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    if (consoleErrorSpy) consoleErrorSpy.mockRestore();
  });

  describe('POST /api/v1/messages', () => {
    it('should allow a guard to send a message to an employer and return 201', async () => {
      // Mock the receiver lookup
      jest.spyOn(User, 'findById').mockResolvedValue({ _id: employerUser.id, role: 'employer' });
      
      // Mock the message save and populate so controller sees populated sender/receiver
      const populated = {
        sender: { email: 'guard@test.com', name: 'Guard One', role: 'guard' },
        receiver: { email: 'employer@test.com', name: 'Employer One', role: 'employer' },
        content: 'Hello, this is a test message.',
        _id: 'msg1',
        timestamp: new Date(),
        isRead: false,
      };

      jest.spyOn(Message.prototype, 'save').mockImplementation(function () {
        // simulate Mongoose behavior by assigning values to this and resolving
        this._id = populated._id;
        this.content = populated.content;
        this.timestamp = populated.timestamp;
        this.isRead = populated.isRead;
        return Promise.resolve(this);
      });

      jest.spyOn(Message.prototype, 'populate').mockImplementation(function () {
        // attach populated sender/receiver to this and return this
        this.sender = populated.sender;
        this.receiver = populated.receiver;
        return Promise.resolve(this);
      });

      const res = await request(app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          receiverId: employerUser.id,
          content: 'Hello, this is a test message.',
        });

  expect(res.status).toBe(201);
  expect(res.body.success).toBe(true);
  expect(res.body.data).toHaveProperty('messageId');
  // The controller populates sender/receiver; validate content and message id
  expect(res.body.data.content).toBe('Hello, this is a test message.');
  expect(res.body.data.messageId).toBeDefined();
    });

    it('should return 401 Unauthorized if no token is provided', async () => {
      const res = await request(app)
        .post('/api/v1/messages')
        .send({
          receiverId: employerUser.id,
          content: 'This should not be sent.',
        });
      
      // This test relies on the actual auth middleware's behavior when req.user is not set.
      // The controller throws an error when accessing req.user.id, which is caught and passed to the error handler.
      // The default error handler might not return 401 unless specified. Let's check the actual behavior.
      // Based on the controller, it will throw a TypeError, resulting in a 500.
      // A more robust auth middleware would return 401 directly.
      // For now, we test the current reality, which should be a 401.
      expect(res.status).toBe(401);
    });

    it('should return 403 Forbidden if a guard tries to send a message to another guard', async () => {
      const anotherGuard = { _id: 'guard2', role: 'guard' };
      jest.spyOn(User, 'findById').mockResolvedValue(anotherGuard);

      const res = await request(app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          receiverId: 'guard2',
          content: 'This is a guard-to-guard message.',
        });

  expect(res.status).toBe(403);
  // Controller errors are returned via errorHandler which returns { error: { message } }
  expect(res.body.error.message).toBe('Messages can only be sent between guards and employers');
    });

    it('should return 400 Bad Request if a user tries to send a message to themselves', async () => {
      const res = await request(app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          receiverId: guardUser.id, // Sending to self
          content: 'A message to myself.',
        });

  expect(res.status).toBe(400);
  expect(res.body.error.message).toBe('Cannot send message to yourself');
    });

    it('should return 404 Not Found if the receiver does not exist', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          receiverId: 'nonexistentuser',
          content: 'This message has no destination.',
        });

  expect(res.status).toBe(404);
  expect(res.body.error.message).toContain('Receiver not found');
    });
  });

  describe('GET /api/v1/messages/inbox', () => {
    it('should retrieve all messages in the user\'s inbox and return 200', async () => {
      const mockMessages = [
        { _id: 'msg1', content: 'Message 1' },
        { _id: 'msg2', content: 'Message 2' },
      ];
      // Mock the find, populate, and sort chain
      jest.spyOn(Message, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockMessages),
      });
      // Mock the unread count
      jest.spyOn(Message, 'getUnreadCount').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/messages/inbox')
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.messages.length).toBe(2);
      expect(res.body.data.unreadCount).toBe(1);
    });

    it('should return an empty array if the inbox is empty', async () => {
      jest.spyOn(Message, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      });
      jest.spyOn(Message, 'getUnreadCount').mockResolvedValue(0);

      const res = await request(app)
        .get('/api/v1/messages/inbox')
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.messages.length).toBe(0);
      expect(res.body.data.totalMessages).toBe(0);
      expect(res.body.data.unreadCount).toBe(0);
    });
  });

  describe('GET /api/v1/messages/sent', () => {
    it('should retrieve all messages sent by the user and return 200', async () => {
      const mockSentMessages = [
        { _id: 'msg3', content: 'Sent Message 1' },
      ];
      jest.spyOn(Message, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockSentMessages),
      });

      const res = await request(app)
        .get('/api/v1/messages/sent')
        .set('Authorization', `Bearer ${guardToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.messages.length).toBe(1);
      expect(res.body.data.messages[0].content).toBe('Sent Message 1');
    });
  });

  describe('GET /api/v1/messages/conversation/:userId', () => {
    it('should retrieve the conversation between two users and return 200', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue({ _id: employerUser.id, name: 'Employer One' });
      jest.spyOn(Message, 'getConversation').mockResolvedValue([{ content: 'Hi there' }]);
      jest.spyOn(Message, 'markAsRead').mockResolvedValue({});

      const res = await request(app)
        .get(`/api/v1/messages/conversation/${employerUser.id}`)
        .set('Authorization', `Bearer ${guardToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.conversation.messages[0].content).toBe('Hi there');
      expect(Message.markAsRead).toHaveBeenCalledWith(guardUser.id, employerUser.id);
    });

    it('should return 404 if the other user is not found', async () => {
        jest.spyOn(User, 'findById').mockResolvedValue(null);
  
        const res = await request(app)
          .get(`/api/v1/messages/conversation/nonexistentuser`)
          .set('Authorization', `Bearer ${guardToken}`);
  
  expect(res.status).toBe(404);
  expect(res.body.error.message).toBe('User not found');
    });
  });

  describe('PATCH /api/v1/messages/:messageId/read', () => {
    it('should allow the receiver to mark a message as read and return 200', async () => {
      const messageToRead = {
        _id: 'msg4',
        receiver: employerUser.id,
        isRead: false,
        save: jest.fn().mockResolvedValue({ _id: 'msg4', isRead: true }),
      };
      jest.spyOn(Message, 'findById').mockResolvedValue(messageToRead);

      const res = await request(app)
        .patch('/api/v1/messages/msg4/read')
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isRead).toBe(true);
      expect(messageToRead.save).toHaveBeenCalled();
    });

    it('should return 403 if a user tries to mark a message not sent to them', async () => {
      const message = { _id: 'msg5', receiver: 'anotheruser' };
      jest.spyOn(Message, 'findById').mockResolvedValue(message);

      const res = await request(app)
        .patch('/api/v1/messages/msg5/read')
        .set('Authorization', `Bearer ${employerToken}`);

  expect(res.status).toBe(403);
  expect(res.body.error.message).toBe('Unauthorized to mark this message as read');
    });
  });

  describe('GET /api/v1/messages/stats', () => {
    it('should retrieve correct message statistics for the user', async () => {
      // Mock the countDocuments for different scenarios
      jest.spyOn(Message, 'countDocuments')
        .mockResolvedValueOnce(5) // unread
        .mockResolvedValueOnce(10) // sent
        .mockResolvedValueOnce(15); // received

      const res = await request(app)
        .get('/api/v1/messages/stats')
        .set('Authorization', `Bearer ${guardToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        unreadMessages: 5,
        sentMessages: 10,
        receivedMessages: 15,
        totalMessages: 25,
      });
    });
  });
});
