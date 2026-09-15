import { jest } from "@jest/globals";

jest.unstable_mockModule("../src/models/User.js", () => ({
  default: {
    findById: jest.fn(),
  },
}));

jest.unstable_mockModule("../src/models/Message.js", () => ({
  default: Object.assign(
    jest.fn().mockImplementation(function Message(data) {
      Object.assign(this, {
        _id: "507f1f77bcf86cd799439013",
        timestamp: new Date("2026-04-27T00:00:00.000Z"),
        isRead: false,
        ...data,
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue(undefined),
      });
    }),
    {
      findById: jest.fn(),
      getConversation: jest.fn(),
      markAsRead: jest.fn(),
    },
  ),
}));

jest.unstable_mockModule("express-validator", () => ({
  validationResult: jest.fn(),
}));

const { default: User } = await import("../src/models/User.js");
const { default: Message } = await import("../src/models/Message.js");
const { validationResult } = await import("express-validator");

const { sendMessage, getConversation, markMessageAsRead } = await import(
  "../src/controllers/message.controller.js"
);

const VALID_RECEIVER_ID = "507f1f77bcf86cd799439011";
const VALID_OTHER_USER_ID = "507f1f77bcf86cd799439012";
const VALID_MESSAGE_ID = "507f1f77bcf86cd799439013";

const createReq = ({
  senderId = "507f1f77bcf86cd799439014",
  senderRole = "guard",
  receiverId = VALID_RECEIVER_ID,
  content = " Hello from SecureShift ",
} = {}) => ({
  body: {
    receiverId,
    content,
  },
  params: {},
  user: {
    id: senderId,
    role: senderRole,
  },
  audit: {
    log: jest.fn().mockResolvedValue(undefined),
  },
});

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();

  validationResult.mockReturnValue({
    isEmpty: () => true,
    array: () => [],
  });
});

// --------------------------------------------------
// BE-061 MESSAGE CONTENT VALIDATION
// --------------------------------------------------

test("sendMessage rejects missing message content", async () => {
  User.findById.mockResolvedValue({
    _id: VALID_RECEIVER_ID,
    role: "guard",
    email: "guard2@example.com",
    name: "Guard Two",
  });

  const req = createReq();
  delete req.body.content;

  const res = createRes();
  const next = jest.fn();

  await sendMessage(req, res, next);

  expect(Message).not.toHaveBeenCalled();
  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({
      status: 400,
    }),
  );
});

test("sendMessage rejects non-string message content", async () => {
  const req = createReq({
    content: 12345,
  });

  const res = createRes();
  const next = jest.fn();

  await sendMessage(req, res, next);

  expect(Message).not.toHaveBeenCalled();
  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({
      status: 400,
    }),
  );
});

test("sendMessage rejects blank message content", async () => {
  const req = createReq({
    content: "     ",
  });

  const res = createRes();
  const next = jest.fn();

  await sendMessage(req, res, next);

  expect(Message).not.toHaveBeenCalled();
  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({
      status: 400,
    }),
  );
});

test("sendMessage rejects message content over 1000 characters", async () => {
  const req = createReq({
    content: "a".repeat(1001),
  });

  const res = createRes();
  const next = jest.fn();

  await sendMessage(req, res, next);

  expect(Message).not.toHaveBeenCalled();
  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({
      status: 400,
    }),
  );
});

test("sendMessage trims valid message content before saving", async () => {
  User.findById.mockResolvedValue({
    _id: VALID_RECEIVER_ID,
    role: "guard",
    email: "guard2@example.com",
    name: "Guard Two",
  });

  const req = createReq({
    content: "   Valid message   ",
  });

  const res = createRes();
  const next = jest.fn();

  await sendMessage(req, res, next);

  expect(Message).toHaveBeenCalledWith(
    expect.objectContaining({
      sender: "507f1f77bcf86cd799439014",
      receiver: VALID_RECEIVER_ID,
      content: "Valid message",
    }),
  );

  expect(Message.mock.instances[0].save).toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(201);
  expect(next).not.toHaveBeenCalled();
});

// --------------------------------------------------
// BE-062 MALFORMED ID VALIDATION
// --------------------------------------------------

test("sendMessage rejects malformed receiver ID", async () => {
  const req = createReq({
    receiverId: "not-a-valid-object-id",
  });

  const res = createRes();
  const next = jest.fn();

  await sendMessage(req, res, next);

  expect(User.findById).not.toHaveBeenCalled();
  expect(Message).not.toHaveBeenCalled();

  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({
      status: 400,
      message: "Invalid receiver ID",
    }),
  );
});

test("getConversation rejects malformed user ID", async () => {
  const req = createReq();

  req.params = {
    userId: "not-a-valid-object-id",
  };

  const res = createRes();
  const next = jest.fn();

  await getConversation(req, res, next);

  expect(User.findById).not.toHaveBeenCalled();
  expect(Message.getConversation).not.toHaveBeenCalled();

  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({
      status: 400,
      message: "Invalid user ID",
    }),
  );
});

test("markMessageAsRead rejects malformed message ID", async () => {
  const req = createReq();

  req.params = {
    messageId: "not-a-valid-object-id",
  };

  const res = createRes();
  const next = jest.fn();

  await markMessageAsRead(req, res, next);

  expect(Message.findById).not.toHaveBeenCalled();

  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({
      status: 400,
      message: "Invalid message ID",
    }),
  );
});

// --------------------------------------------------
// BE-062 VALID NONEXISTENT IDs KEEP 404 BEHAVIOUR
// --------------------------------------------------

test("sendMessage preserves 404 for a valid but nonexistent receiver ID", async () => {
  User.findById.mockResolvedValue(null);

  const req = createReq({
    receiverId: VALID_RECEIVER_ID,
  });

  const res = createRes();
  const next = jest.fn();

  await sendMessage(req, res, next);

  expect(User.findById).toHaveBeenCalledWith(VALID_RECEIVER_ID);
  expect(Message).not.toHaveBeenCalled();

  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({
      status: 404,
    }),
  );
});

test("getConversation preserves 404 for a valid but nonexistent user ID", async () => {
  User.findById.mockResolvedValue(null);

  const req = createReq();

  req.params = {
    userId: VALID_OTHER_USER_ID,
  };

  const res = createRes();
  const next = jest.fn();

  await getConversation(req, res, next);

  expect(User.findById).toHaveBeenCalledWith(VALID_OTHER_USER_ID);
  expect(Message.getConversation).not.toHaveBeenCalled();

  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({
      status: 404,
      message: "User not found",
    }),
  );
});

test("markMessageAsRead preserves 404 for a valid but nonexistent message ID", async () => {
  Message.findById.mockResolvedValue(null);

  const req = createReq();

  req.params = {
    messageId: VALID_MESSAGE_ID,
  };

  const res = createRes();
  const next = jest.fn();

  await markMessageAsRead(req, res, next);

  expect(Message.findById).toHaveBeenCalledWith(VALID_MESSAGE_ID);

  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({
      status: 404,
      message: "Message not found",
    }),
  );
});

// --------------------------------------------------
// BE-063 SOFT-DELETED RECIPIENTS
// --------------------------------------------------

test("sendMessage rejects messages to soft-deleted recipients", async () => {
  User.findById.mockResolvedValue({
    _id: VALID_RECEIVER_ID,
    role: "guard",
    email: "deleted@example.com",
    name: "Deleted Guard",
    isDeleted: true,
  });

  const req = createReq();
  const res = createRes();
  const next = jest.fn();

  await sendMessage(req, res, next);

  expect(User.findById).toHaveBeenCalledWith(VALID_RECEIVER_ID);
  expect(Message).not.toHaveBeenCalled();

  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({
      status: 404,
      message: "Receiver not found",
    }),
  );
});

test("sendMessage allows messages to active recipients", async () => {
  User.findById.mockResolvedValue({
    _id: VALID_RECEIVER_ID,
    role: "guard",
    email: "guard2@example.com",
    name: "Guard Two",
    isDeleted: false,
  });

  const req = createReq();
  const res = createRes();
  const next = jest.fn();

  await sendMessage(req, res, next);

  expect(Message).toHaveBeenCalledWith(
    expect.objectContaining({
      sender: "507f1f77bcf86cd799439014",
      receiver: VALID_RECEIVER_ID,
      content: "Hello from SecureShift",
    }),
  );

  expect(Message.mock.instances[0].save).toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(201);
  expect(next).not.toHaveBeenCalled();
});

test("sendMessage preserves messaging for legacy recipients without isDeleted", async () => {
  User.findById.mockResolvedValue({
    _id: VALID_RECEIVER_ID,
    role: "guard",
    email: "legacy@example.com",
    name: "Legacy Guard",
  });

  const req = createReq();
  const res = createRes();
  const next = jest.fn();

  await sendMessage(req, res, next);

  expect(Message).toHaveBeenCalledWith(
    expect.objectContaining({
      sender: "507f1f77bcf86cd799439014",
      receiver: VALID_RECEIVER_ID,
      content: "Hello from SecureShift",
    }),
  );

  expect(Message.mock.instances[0].save).toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(201);
  expect(next).not.toHaveBeenCalled();
});

// --------------------------------------------------
// EXISTING MESSAGE BEHAVIOUR
// --------------------------------------------------

test("sendMessage allows guard-to-guard messaging", async () => {
  User.findById.mockResolvedValue({
    _id: VALID_RECEIVER_ID,
    role: "guard",
    email: "guard2@example.com",
    name: "Guard Two",
  });

  const req = createReq();
  const res = createRes();
  const next = jest.fn();

  await sendMessage(req, res, next);

  expect(Message).toHaveBeenCalledWith({
    sender: "507f1f77bcf86cd799439014",
    receiver: VALID_RECEIVER_ID,
    content: "Hello from SecureShift",
  });

  expect(Message.mock.instances[0].save).toHaveBeenCalled();

  expect(res.status).toHaveBeenCalledWith(201);

  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        messageId: "507f1f77bcf86cd799439013",
        content: "Hello from SecureShift",
      }),
    }),
  );

  expect(next).not.toHaveBeenCalled();
});

test("sendMessage still blocks employer-to-employer messaging", async () => {
  User.findById.mockResolvedValue({
    _id: VALID_RECEIVER_ID,
    role: "employer",
    email: "employer2@example.com",
    name: "Employer Two",
  });

  const req = createReq({
    senderId: "507f1f77bcf86cd799439014",
    senderRole: "employer",
    receiverId: VALID_RECEIVER_ID,
  });

  const res = createRes();
  const next = jest.fn();

  await sendMessage(req, res, next);

  expect(Message).not.toHaveBeenCalled();

  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({
      status: 403,
      message:
        "Messages can only be sent between guards, or between guards and employers",
    }),
  );
});

test("sendMessage still blocks admin messaging", async () => {
  User.findById.mockResolvedValue({
    _id: VALID_RECEIVER_ID,
    role: "guard",
    email: "guard2@example.com",
    name: "Guard Two",
  });

  const req = createReq({
    senderId: "507f1f77bcf86cd799439014",
    senderRole: "admin",
    receiverId: VALID_RECEIVER_ID,
  });

  const res = createRes();
  const next = jest.fn();

  await sendMessage(req, res, next);

  expect(Message).not.toHaveBeenCalled();

  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({
      status: 403,
      message:
        "Messages can only be sent between guards, or between guards and employers",
    }),
  );
});
