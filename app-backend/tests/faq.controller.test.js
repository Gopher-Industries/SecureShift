import request from "supertest";
import mongoose from "mongoose";
import express from "express";
import Faq from "../src/models/Faq.js";
import faqRoutes from "../src/routes/faq.routes.js";

const app = express();
app.use(express.json());
app.use("/api/v1/faqs", faqRoutes);

describe("FAQ API Integration Tests", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await Faq.deleteMany({});
    await mongoose.connection.close();
  });

  describe("GET /api/v1/faqs", () => {
    beforeEach(async () => {
      await Faq.deleteMany({});
    });

    test("should return 200 OK and an empty array when no FAQs exist", async () => {
      const response = await request(app).get("/api/v1/faqs");

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });

    test("should return 200 OK with populated FAQ data", async () => {
      await Faq.create([
        {
          question: "Question 1",
          answer: "Answer 1",
          category: "general",
          displayOrder: 2,
          isActive: true,
        },
        {
          question: "Question 2",
          answer: "Answer 2",
          category: "payroll",
          displayOrder: 1,
          isActive: true,
        },
        {
          question: "Inactive Question",
          answer: "This should not be returned",
          category: "general",
          displayOrder: 3,
          isActive: false,
        },
      ]);

      const response = await request(app).get("/api/v1/faqs");

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    test("should return FAQs sorted by displayOrder", async () => {
      await Faq.create([
        {
          question: "Third Question",
          answer: "Answer 3",
          category: "general",
          displayOrder: 3,
          isActive: true,
        },
        {
          question: "First Question",
          answer: "Answer 1",
          category: "general",
          displayOrder: 1,
          isActive: true,
        },
        {
          question: "Second Question",
          answer: "Answer 2",
          category: "general",
          displayOrder: 2,
          isActive: true,
        },
      ]);

      const response = await request(app).get("/api/v1/faqs");

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0].question).toBe("First Question");
      expect(response.body[1].question).toBe("Second Question");
      expect(response.body[2].question).toBe("Third Question");
    });

    test("should only return active FAQs", async () => {
      await Faq.create([
        {
          question: "Active FAQ 1",
          answer: "This should be returned",
          category: "general",
          displayOrder: 1,
          isActive: true,
        },
        {
          question: "Active FAQ 2",
          answer: "This should also be returned",
          category: "payroll",
          displayOrder: 2,
          isActive: true,
        },
        {
          question: "Inactive FAQ",
          answer: "This should NOT be returned",
          category: "general",
          displayOrder: 3,
          isActive: false,
        },
      ]);

      const response = await request(app).get("/api/v1/faqs");

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.every((faq) => faq.isActive === true)).toBe(true);
    });

    test("should return FAQ fields in the correct structure", async () => {
      await Faq.create({
        question: "Test Question",
        answer: "Test Answer",
        category: "general",
        displayOrder: 1,
        isActive: true,
      });

      const response = await request(app).get("/api/v1/faqs");

      expect(response.statusCode).toBe(200);
      expect(response.body[0]).toHaveProperty("_id");
      expect(response.body[0]).toHaveProperty("question");
      expect(response.body[0]).toHaveProperty("answer");
      expect(response.body[0]).toHaveProperty("category");
      expect(response.body[0]).toHaveProperty("displayOrder");
      expect(response.body[0]).toHaveProperty("isActive");
      expect(response.body[0]).toHaveProperty("createdAt");
      expect(response.body[0]).toHaveProperty("updatedAt");

      expect(response.body[0].question).toBe("Test Question");
      expect(response.body[0].answer).toBe("Test Answer");
      expect(response.body[0].category).toBe("general");
      expect(response.body[0].displayOrder).toBe(1);
      expect(response.body[0].isActive).toBe(true);
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
