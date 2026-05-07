import {
  getNotifications,
  createNotification,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} from "../src/controllers/notification.controller.js";

import Notification from "../src/models/Notification.js";

jest.mock("../src/models/Notification.js");

describe("Notification Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { _id: "user1", role: "admin" },
      query: {},
      body: {},
      params: {}
    };

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  // ---------------- GET NOTIFICATIONS ----------------
  describe("getNotifications", () => {
    it("should return paginated notifications", async () => {
      Notification.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ _id: "n1" }])
      });

      Notification.countDocuments.mockResolvedValue(1);

      req.query = { page: "1", limit: "10" };

      await getNotifications(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          notifications: expect.any(Array),
          total: 1
        })
      );
    });
  });

  // ---------------- CREATE NOTIFICATION ----------------
  describe("createNotification", () => {
    it("should create notification when role is allowed", async () => {
      req.user.role = "admin";

      req.body = {
        userId: "user2",
        type: "INFO",
        message: "Test message"
      };

      Notification.create.mockResolvedValue({
        _id: "n1",
        message: "Test message"
      });

      await createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it("should reject unauthorized role", async () => {
      req.user.role = "guard";

      req.body = {
        userId: "user2",
        type: "INFO",
        message: "Test"
      };

      await createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should validate required fields", async () => {
      req.user.role = "admin";
      req.body = { userId: "user2" }; // missing type + message

      await createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ---------------- GET BY ID ----------------
  describe("getNotificationById", () => {
    it("should return notification", async () => {
      req.params.id = "n1";

      Notification.findOne.mockResolvedValue({ _id: "n1" });

      await getNotificationById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ _id: "n1" })
      );
    });

    it("should return 404 if not found", async () => {
      req.params.id = "n1";

      Notification.findOne.mockResolvedValue(null);

      await getNotificationById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ---------------- MARK AS READ ----------------
  describe("markAsRead", () => {
    it("should mark notification as read", async () => {
      req.params.id = "n1";

      Notification.findOneAndUpdate.mockResolvedValue({
        _id: "n1",
        isRead: true
      });

      await markAsRead(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ isRead: true })
      );
    });
  });

  // ---------------- MARK ALL AS READ ----------------
  describe("markAllAsRead", () => {
    it("should update all notifications", async () => {
      Notification.updateMany.mockResolvedValue({ modifiedCount: 5 });

      await markAllAsRead(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  // ---------------- UNREAD COUNT ----------------
  describe("getUnreadCount", () => {
    it("should return unread count", async () => {
      Notification.countDocuments.mockResolvedValue(3);

      await getUnreadCount(req, res);

      expect(res.json).toHaveBeenCalledWith({
        unreadCount: 3
      });
    });
  });
});