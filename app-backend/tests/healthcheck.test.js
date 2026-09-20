// Mock crypto module to avoid environment variable check
jest.mock("../src/utils/crypto.js", () => ({
  encryptLicence: jest.fn().mockReturnValue("encrypted"),
  decryptLicence: jest.fn().mockReturnValue("decrypted"),
}));

// Mock mongodb to prevent real connection
jest.mock("mongodb", () => {
  const actual = jest.requireActual("mongodb");
  return {
    ...actual,
    MongoClient: {
      connect: jest.fn().mockResolvedValue({
        db: jest.fn().mockReturnValue({}),
      }),
    },
    GridFSBucket: jest.fn().mockImplementation(() => ({
      openUploadStream: jest.fn().mockReturnValue({
        end: jest.fn(),
        on: jest.fn(),
      }),
    })),
  };
});

import request from "supertest";
import app from "../src/app.js";
test("GET /api/v1/health", async () => {
  const res = await request(app).get("/api/v1/health");
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ status: "ok" });
});
