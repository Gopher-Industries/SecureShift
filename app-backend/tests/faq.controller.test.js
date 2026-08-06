import "dotenv/config";
import request from "supertest";
import mongoose from "mongoose";
import express from "express";
import Faq from "../src/models/Faq.js";
import faqRoutes from "../src/routes/faq.routes.js";
import "./setup.js";

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/faqs", faqRoutes);
  return app;
};

describe("FAQ API Integration Tests", () => {
  // To store created FAQ IDs for cleanup after tests
  let createdIds = [];
  let app;

  beforeAll(async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error(
        "FAIL: MONGO_URI is not defined in the environment variables. Please set it to a test database URI.",
      );
    }
    await mongoose.connect(uri);
    app = createTestApp();
  });

  afterAll(async () => {
    if (createdIds.length > 0) {
      await Faq.deleteMany({ _id: { $in: createdIds } });
    }
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    if (createdIds.length > 0) {
      await Faq.deleteMany({ _id: { $in: createdIds } });
      createdIds = [];
    }
  });

  afterEach(async () => {
    if (createdIds.length > 0) {
      await Faq.deleteMany({ _id: { $in: createdIds } });
      createdIds = [];
    }
  });

  describe("GET /api/v1/faqs", () => {
    beforeEach(async () => {
      if (createdIds.length > 0) {
        await Faq.deleteMany({ _id: { $in: createdIds } });
        createdIds = [];
      }
    });

    test("should return 200 OK and an empty array when no FAQs exist", async () => {
      const response = await request(app).get("/api/v1/faqs");

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });

    test("should return 200 OK with populated FAQ data", async () => {
      const doc1 = await Faq.create({
        question: "Question 1",
        answer: "Answer 1",
        category: "general",
        displayOrder: 2,
        isActive: true,
      });
      const doc2 = await Faq.create({
        question: "Question 2",
        answer: "Answer 2",
        category: "payroll",
        displayOrder: 1,
        isActive: true,
      });
      const doc3 = await Faq.create({
        question: "Inactive Question",
        answer: "This should not be returned",
        category: "general",
        displayOrder: 3,
        isActive: false,
      });

      createdIds = [doc1._id, doc2._id, doc3._id];

      const response = await request(app).get("/api/v1/faqs");

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    test("should return FAQs sorted by displayOrder", async () => {
      const doc1 = await Faq.create({
        question: "Third Question",
        answer: "Answer 3",
        category: "general",
        displayOrder: 3,
        isActive: true,
      });
      const doc2 = await Faq.create({
        question: "First Question",
        answer: "Answer 1",
        category: "general",
        displayOrder: 1,
        isActive: true,
      });
      const doc3 = await Faq.create({
        question: "Second Question",
        answer: "Answer 2",
        category: "general",
        displayOrder: 2,
        isActive: true,
      });
      createdIds = [doc1._id, doc2._id, doc3._id];

      const response = await request(app).get("/api/v1/faqs");

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0].question).toBe("First Question");
      expect(response.body[1].question).toBe("Second Question");
      expect(response.body[2].question).toBe("Third Question");
    });

    test("should only return active FAQs", async () => {
      const doc1 = await Faq.create({
        question: "Active FAQ 1",
        answer: "This should be returned",
        category: "general",
        displayOrder: 1,
        isActive: true,
      });
      const doc2 = await Faq.create({
        question: "Active FAQ 2",
        answer: "This should also be returned",
        category: "payroll",
        displayOrder: 2,
        isActive: true,
      });
      await Faq.create({
        question: "Inactive FAQ",
        answer: "This should NOT be returned",
        category: "general",
        displayOrder: 3,
        isActive: false,
      });
      createdIds = [doc1._id, doc2._id];

      const response = await request(app).get("/api/v1/faqs");

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.every((faq) => faq.isActive === undefined)).toBe(
        true,
      );
    });

    test("should return FAQ fields in the correct structure", async () => {
      const doc = await Faq.create({
        question: "Test Question",
        answer: "Test Answer",
        category: "general",
        displayOrder: 1,
        isActive: true,
      });
      createdIds = [doc._id];

      const response = await request(app).get("/api/v1/faqs");

      expect(response.statusCode).toBe(200);
      expect(response.body[0]).toHaveProperty("_id");
      expect(response.body[0]).toHaveProperty("question");
      expect(response.body[0]).toHaveProperty("answer");
      expect(response.body[0]).toHaveProperty("category");
      expect(response.body[0]).toHaveProperty("displayOrder");

      expect(response.body[0]).not.toHaveProperty("isActive");
      expect(response.body[0]).not.toHaveProperty("createdAt");
      expect(response.body[0]).not.toHaveProperty("updatedAt");
      expect(response.body[0]).not.toHaveProperty("__v");

      expect(response.body[0].question).toBe("Test Question");
      expect(response.body[0].answer).toBe("Test Answer");
      expect(response.body[0].category).toBe("general");
      expect(response.body[0].displayOrder).toBe(1);
    });

    // Add a test to ensure the endpoint is publicly accessible without authentication
    test("should be publicly accessible without authentication", async () => {
      const doc = await Faq.create({
        question: "Public FAQ",
        answer: "This should be accessible without token",
        category: "general",
        displayOrder: 1,
        isActive: true,
      });
      createdIds = [doc._id];

      const response = await request(app).get("/api/v1/faqs");

      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.statusCode).not.toBe(401);
      expect(response.statusCode).not.toBe(403);
    });

    test("should return 500 on server error", async () => {
      const originalFind = Faq.find;
      Faq.find = jest.fn().mockImplementation(() => {
        throw new Error("Database connection error");
      });

      const response = await request(app).get("/api/v1/faqs");

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toBe("Failed to retrieve FAQs");

      Faq.find = originalFind;
    });
  });
});
