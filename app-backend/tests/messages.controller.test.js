import {
  sendMessage,
  getInboxMessages,
  getSentMessages,
  getConversation,
  markMessageAsRead,
  getMessageStats
} from "../controllers/message.controller.js";

import User from "../models/User.js";
import Message from "../models/Message.js";

// mock models
jest.mock("../models/User.js");
jest.mock("../models/Message.js");

describe("Message Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { id: "user1", role: "guard" },
      body: {},
      params: {},
      audit: { log: jest.fn() }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
  });

  // ---------------- SEND MESSAGE ----------------
  describe("sendMessage", () => {
    it("should send a message successfully", async () => {
      req.body = { receiverId: "user2", content: "Hello" };

      User.findById.mockResolvedValue({ _id: "user2", role: "employer" });

      const saveMock = jest.fn();
      const populateMock = jest.fn().mockResolvedValue({
        _id: "msg1",
        sender: { id: "user1" },
        receiver: { id: "user2" },
        content: "Hello",
        timestamp: new Date(),
        isRead: false
      });

      Message.mockImplementation(() => ({
        save: saveMock,
        populate: populateMock
      }));

      await sendMessage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it("should not allow self message", async () => {
      req.body = { receiverId: "user1", content: "Hello" };

      await sendMessage(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // ---------------- INBOX ----------------
  describe("getInboxMessages", () => {
    it("should return inbox messages", async () => {
      Message.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([{ _id: "msg1" }])
      });

      Message.getUnreadCount = jest.fn().mockResolvedValue(2);

      await getInboxMessages(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });

  // ---------------- SENT ----------------
  describe("getSentMessages", () => {
    it("should return sent messages", async () => {
      Message.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([{ _id: "msg1" }])
      });

      await getSentMessages(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ---------------- CONVERSATION ----------------
  describe("getConversation", () => {
    it("should return conversation", async () => {
      req.params.userId = "user2";

      User.findById.mockResolvedValue({ _id: "user2", name: "John" });

      Message.getConversation = jest.fn().mockResolvedValue([
        { content: "hi" },
        { content: "hello" }
      ]);

      Message.markAsRead = jest.fn();

      await getConversation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ---------------- MARK AS READ ----------------
  describe("markMessageAsRead", () => {
    it("should mark message as read", async () => {
      req.params.messageId = "msg1";

      Message.findById.mockResolvedValue({
        _id: "msg1",
        receiver: { toString: () => "user1" },
        sender: "user2",
        save: jest.fn()
      });

      await markMessageAsRead(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ---------------- STATS ----------------
  describe("getMessageStats", () => {
    it("should return message stats", async () => {
      Message.countDocuments
        .mockResolvedValueOnce(5) // unread
        .mockResolvedValueOnce(10) // sent
        .mockResolvedValueOnce(15); // received

      await getMessageStats(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });
});