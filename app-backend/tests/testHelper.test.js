// tests/testHelper.test.js
import {
  describe,
  expect,
  test,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import mongoose from "mongoose";
import {
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
  createTestUser,
} from "./testHelper.js";

// Mock mongoose module
jest.mock("mongoose", () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  connection: {
    collections: {
      users: { deleteMany: jest.fn() },
      shifts: { deleteMany: jest.fn() },
    },
  },
  model: jest.fn(),
}));

// Mock console to silence output
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

describe("testHelper.js", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.MONGO_TEST_URI = "mongodb://localhost:27017/test_db";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("connectTestDB", () => {
    test("should throw error when MONGO_TEST_URI is not set", async () => {
      delete process.env.MONGO_TEST_URI;

      await expect(connectTestDB()).rejects.toThrow(
        "MONGO_TEST_URI is required",
      );
      expect(mongoose.connect).not.toHaveBeenCalled();
    });

    test("should call mongoose.connect when MONGO_TEST_URI is set", async () => {
      mongoose.connect.mockResolvedValueOnce(undefined);

      await connectTestDB();

      expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_TEST_URI);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Test database connected:"),
      );
    });

    test("should propagate connection errors", async () => {
      const error = new Error("Connection refused");
      mongoose.connect.mockRejectedValueOnce(error);

      await expect(connectTestDB()).rejects.toThrow("Connection refused");
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Test database connection failed:"),
        "Connection refused",
      );
    });
  });

  describe("disconnectTestDB", () => {
    test("should call mongoose.disconnect", async () => {
      mongoose.disconnect.mockResolvedValueOnce(undefined);

      await disconnectTestDB();

      expect(mongoose.disconnect).toHaveBeenCalled();
      // 使用包含匹配，不依赖 emoji
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Test database disconnected"),
      );
    });
  });

  describe("clearTestDB", () => {
    test("should call deleteMany on each collection", async () => {
      const collections = mongoose.connection.collections;
      const deleteManySpies = Object.values(collections).map(
        (col) => col.deleteMany,
      );

      await clearTestDB();

      deleteManySpies.forEach((spy) => {
        expect(spy).toHaveBeenCalled();
      });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Test database cleared"),
      );
    });

    test("should handle empty collections gracefully", async () => {
      const originalCollections = mongoose.connection.collections;
      mongoose.connection.collections = {};

      await clearTestDB();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Test database cleared"),
      );

      mongoose.connection.collections = originalCollections;
    });
  });

  describe("createTestUser", () => {
    test("should call User.create with defaults and overrides", async () => {
      const mockUser = { _id: "123", name: "Test User" };
      const mockUserModel = {
        create: jest.fn().mockResolvedValue(mockUser),
      };

      const overrides = { name: "Custom Name" };
      const result = await createTestUser(mockUserModel, overrides);

      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Custom Name",
          password: "TestPassword123!",
          role: "guard",
        }),
      );
      expect(result).toBe(mockUser);
    });

    test("should use default values when no overrides provided", async () => {
      const mockUser = { _id: "456", name: "Test User" };
      const mockUserModel = {
        create: jest.fn().mockResolvedValue(mockUser),
      };

      const result = await createTestUser(mockUserModel);

      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test User",
          password: "TestPassword123!",
          role: "guard",
          email: expect.stringMatching(/^test-\d+@example\.com$/),
        }),
      );
      expect(result).toBe(mockUser);
    });
  });
});
