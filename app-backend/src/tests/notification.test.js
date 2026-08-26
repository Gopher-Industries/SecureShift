/* eslint-env jest */
/* global describe, it, expect, beforeAll, afterAll, beforeEach, afterEach */

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Notification from "../models/Notification.js";
import {
  createNotification,
  deleteNotification,
} from "../controllers/notification.controller.js";

let mongoServer;

// Connect to in-memory MongoDB before tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Disconnect after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clean up before each test
beforeEach(async () => {
  await Notification.deleteMany({});
});

// Clean up after each test
afterEach(async () => {
  await Notification.deleteMany({});
});

// Helper functions
const createTestUser = () => ({
  _id: new mongoose.Types.ObjectId(),
  role: "admin",
  email: "test@example.com",
});

// Custom mockResponse without jest.fn()
const mockResponse = () => {
  const res = {};

  // Initialize call tracking arrays
  res.statusCalls = [];
  res.jsonCalls = [];

  // Status method that tracks calls
  res.status = function (...args) {
    res.statusCalls.push(args);
    return res;
  };

  // JSON method that tracks calls
  res.json = function (...args) {
    res.jsonCalls.push(args);
    return res;
  };

  // Helper methods for assertions
  res.getStatusCalls = function () {
    return res.statusCalls;
  };

  res.getJsonCalls = function () {
    return res.jsonCalls;
  };

  res.getLastStatusCall = function () {
    return res.statusCalls[res.statusCalls.length - 1];
  };

  res.getLastJsonCall = function () {
    return res.jsonCalls[res.jsonCalls.length - 1];
  };

  return res;
};

describe("notification.controller - createNotification", () => {
  describe("createdBy field", () => {
    it("should automatically set createdBy to authenticated user", async () => {
      // Arrange
      const user = createTestUser();
      const someUserId = new mongoose.Types.ObjectId();

      const req = {
        user: { _id: user._id, role: "admin" },
        body: {
          userId: someUserId,
          type: "SHIFT_APPROVED",
          title: "Shift Approved",
          message: "Test notification",
        },
      };

      const res = mockResponse();

      // Act
      await createNotification(req, res);

      // Assert
      const notification = await Notification.findOne({
        message: "Test notification",
      });

      expect(notification).toBeTruthy();
      expect(notification.createdBy.toString()).toBe(user._id.toString());
      expect(notification.createdBy.toString()).not.toBe(someUserId.toString());
    });

    it("should not allow spoofing createdBy from request body", async () => {
      // Arrange
      const user = createTestUser();
      const someUserId = new mongoose.Types.ObjectId();
      const maliciousUserId = new mongoose.Types.ObjectId();

      const req = {
        user: { _id: user._id, role: "admin" },
        body: {
          userId: someUserId,
          type: "SHIFT_APPROVED",
          title: "Shift Approved",
          message: "Test notification with spoof attempt",
          createdBy: maliciousUserId,
        },
      };

      const res = mockResponse();

      // Act
      await createNotification(req, res);

      // Assert
      const notification = await Notification.findOne({
        message: "Test notification with spoof attempt",
      });

      expect(notification).toBeTruthy();
      expect(notification.createdBy.toString()).toBe(user._id.toString());
      expect(notification.createdBy.toString()).not.toBe(
        maliciousUserId.toString(),
      );
    });

    it("should require createdBy in schema", async () => {
      // Arrange
      const someUserId = new mongoose.Types.ObjectId();

      const notification = new Notification({
        userId: someUserId,
        type: "SHIFT_APPROVED",
        title: "Test",
        message: "Test message",
      });

      // Act & Assert
      let error = null;
      try {
        await notification.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeTruthy();
      expect(error.name).toBe("ValidationError");
      expect(error.errors.createdBy).toBeTruthy();
    });

    it("should return notification with createdBy field populated when queried", async () => {
      // Arrange
      const user = createTestUser();
      const someUserId = new mongoose.Types.ObjectId();

      const notification = await Notification.create({
        userId: someUserId,
        createdBy: user._id,
        type: "SHIFT_APPLIED",
        title: "Test",
        message: "Query test",
      });

      // Act
      const found = await Notification.findById(notification._id);

      // Assert
      expect(found).toBeTruthy();
      expect(found.createdBy).toBeTruthy();
      expect(found.createdBy.toString()).toBe(user._id.toString());
    });
  });

  describe("authorization and validation", () => {
    it("should return 403 when user role is not authorized", async () => {
      // Arrange
      const unauthorizedUser = {
        _id: new mongoose.Types.ObjectId(),
        role: "guard",
      };
      const someUserId = new mongoose.Types.ObjectId();

      const req = {
        user: unauthorizedUser,
        body: {
          userId: someUserId,
          type: "SHIFT_APPROVED",
          title: "Shift Approved",
          message: "Test notification",
        },
      };

      const res = mockResponse();

      // Act
      await createNotification(req, res);

      // Assert - Using custom mock assertions
      expect(res.statusCalls).toHaveLength(1);
      expect(res.statusCalls[0][0]).toBe(403);
      expect(res.jsonCalls).toHaveLength(1);
      expect(res.jsonCalls[0][0]).toEqual({
        message: "You are not allowed to create notifications",
      });
    });

    it("should return 400 when required fields are missing", async () => {
      // Arrange
      const user = createTestUser();

      const req = {
        user: { _id: user._id, role: "admin" },
        body: {
          title: "Test",
        },
      };

      const res = mockResponse();

      // Act
      await createNotification(req, res);

      // Assert - Using custom mock assertions
      expect(res.statusCalls).toHaveLength(1);
      expect(res.jsonCalls[0][0]).toEqual({
        message: "userId, type, and message are required",
      });
    });
  });

  describe("notification.controller - deleteNotification", () => {
    it("should successfully delete user's own notification", async () => {
      // Arrange
      const user = createTestUser();
      const notification = await Notification.create({
        userId: user._id,
        type: "SHIFT_APPROVED",
        title: "New Shift",
        message: "You have been assigned a shift",
        createdBy: user._id,
      });

      const req = {
        user: { _id: user._id },
        params: { id: notification._id.toString() },
      };
      const res = mockResponse();

      // Act
      await deleteNotification(req, res);

      // Assert
      expect(res.jsonCalls).toHaveLength(1);
      expect(res.jsonCalls[0][0]).toEqual({
        message: "Notification deleted successfully",
      });

      const deleted = await Notification.findById(notification._id);
      expect(deleted).toBeNull();
    });

    it("should return 404 and not delete if notification belongs to another user", async () => {
      // Arrange
      const ownerUser = createTestUser();
      const otherUser = createTestUser();
      const notification = await Notification.create({
        userId: ownerUser._id,
        type: "DOCUMENT_EXPIRING",
        title: "Alert",
        message: "Security notification",
        createdBy: ownerUser._id,
      });

      const req = {
        user: { _id: otherUser._id },
        params: { id: notification._id.toString() },
      };
      const res = mockResponse();

      // Act
      await deleteNotification(req, res);

      // Assert
      expect(res.statusCalls).toHaveLength(1);
      expect(res.statusCalls[0][0]).toBe(404);
      expect(res.jsonCalls).toHaveLength(1);
      expect(res.jsonCalls[0][0]).toEqual({
        message: "Notification not found",
      });

      // Verify the notification was NOT deleted
      const stillExists = await Notification.findById(notification._id);
      expect(stillExists).not.toBeNull();
      expect(stillExists._id.toString()).toBe(notification._id.toString());
    });

    it("should return 404 when notification does not exist", async () => {
      // Arrange
      const user = createTestUser();
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const req = {
        user: { _id: user._id },
        params: { id: nonExistentId },
      };
      const res = mockResponse();

      // Act
      await deleteNotification(req, res);

      // Assert
      expect(res.statusCalls).toHaveLength(1);
      expect(res.statusCalls[0][0]).toBe(404);
      expect(res.jsonCalls).toHaveLength(1);
      expect(res.jsonCalls[0][0]).toEqual({
        message: "Notification not found",
      });
    });

    it("should return 400 when invalid notification ID format is provided", async () => {
      // Arrange
      const user = createTestUser();

      const req = {
        user: { _id: user._id },
        params: { id: "invalid-id-123" },
      };
      const res = mockResponse();

      // Act
      await deleteNotification(req, res);

      // Assert
      expect(res.statusCalls).toHaveLength(1);
      expect(res.statusCalls[0][0]).toBe(400);
      expect(res.jsonCalls).toHaveLength(1);
      expect(res.jsonCalls[0][0]).toEqual({
        message: "Invalid notification ID",
      });
    });
  });
});
