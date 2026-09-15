import { jest } from "@jest/globals";

jest.unstable_mockModule("../src/models/User.js", () => ({
  default: {
    findById: jest.fn(),
  },
}));

jest.unstable_mockModule("../src/models/Message.js", () => ({
  default: jest.fn().mockImplementation(function Message(data) {
    Object.assign(this, {
      _id: "message-123",
      timestamp: new Date("2026-04-27T00:00:00.000Z"),
      isRead: false,
      ...data,
      save: jest.fn().mockResolvedValue(undefined),
      populate: jest.fn().mockResolvedValue(undefined),
    });
  }),
}));

jest.unstable_mockModule("express-validator", () => ({
  validationResult: jest.fn(),
}));

const { default: User } = await import("../src/models/User.js");
const { default: Message } = await import("../src/models/Message.js");
const { validationResult } = await import("express-validator");

const { sendMessage } =
  await import("../src/controllers/message.controller.js");

const createReq = ({
  senderId = "guard-1",
  senderRole = "guard",
  receiverId = "guard-2",
  content = " Hello from SecureShift ",
} = {}) => ({
  body: {
    receiverId,
    content,
  },
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
    _id: "guard-2",
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
    _id: "guard-2",
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
      sender: "guard-1",
      receiver: "guard-2",
      content: "Valid message",
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
    _id: "guard-2",
    role: "guard",
    email: "guard2@example.com",
    name: "Guard Two",
  });

  const req = createReq();
  const res = createRes();
  const next = jest.fn();

  await sendMessage(req, res, next);

  expect(Message).toHaveBeenCalledWith({
    sender: "guard-1",
    receiver: "guard-2",
    content: "Hello from SecureShift",
  });

  expect(Message.mock.instances[0].save).toHaveBeenCalled();

  expect(res.status).toHaveBeenCalledWith(201);

  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        messageId: "message-123",
        content: "Hello from SecureShift",
      }),
    }),
  );

  expect(next).not.toHaveBeenCalled();
});

test("sendMessage still blocks employer-to-employer messaging", async () => {
  User.findById.mockResolvedValue({
    _id: "employer-2",
    role: "employer",
    email: "employer2@example.com",
    name: "Employer Two",
  });

  const req = createReq({
    senderId: "employer-1",
    senderRole: "employer",
    receiverId: "employer-2",
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
    _id: "guard-2",
    role: "guard",
    email: "guard2@example.com",
    name: "Guard Two",
  });

  const req = createReq({
    senderId: "admin-1",
    senderRole: "admin",
    receiverId: "guard-2",
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