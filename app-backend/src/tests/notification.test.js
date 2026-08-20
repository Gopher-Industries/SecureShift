/* eslint-env jest */
/* global describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest */

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { jest } from '@jest/globals';
import Notification from "../models/Notification.js";
import { createNotification } from "../controllers/notification.controller.js";

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

// Use Jest spy functions (jest is available via eslint-env jest)
const mockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
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
        message: "Test notification"
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
        message: "Test notification with spoof attempt"
      });

      expect(notification).toBeTruthy();
      expect(notification.createdBy.toString()).toBe(user._id.toString());
      expect(notification.createdBy.toString()).not.toBe(maliciousUserId.toString());
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

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
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

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "userId, type, and message are required",
      });
    });
  });
});