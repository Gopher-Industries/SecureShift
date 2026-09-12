jest.unstable_mockModule("../src/utils/crypto.js", () => ({
  encryptLicence: jest.fn().mockReturnValue("encrypted"),
  decryptLicence: jest.fn().mockReturnValue("decrypted"),
}));

import { jest } from "@jest/globals";
globalThis.jest = jest;

const dotenv = await import("dotenv");
const path = await import("path");
dotenv.config({ path: path.join(process.cwd(), ".env.test"), override: true });

const request = (await import("supertest")).default;
const jwt = (await import("jsonwebtoken")).default;
const mongoose = (await import("mongoose")).default;
const app = (await import("../src/app.js")).default;
const { startTestDatabase, clearDatabase, closeTestDatabase } = await import(
  "./db-helper.js"
);
const Guard = (await import("../src/models/Guard.js")).default;
const Admin = (await import("../src/models/Admin.js")).default;

let adminToken;

beforeAll(async () => {
  await startTestDatabase();
  const admin = await Admin.create({
    name: "Admin",
    email: "admin@test.com",
    password: "Pass123!",
    role: "admin",
  });
  adminToken = jwt.sign(
    { id: admin._id, role: admin.role },
    process.env.JWT_SECRET,
  );
});

afterAll(async () => {
  await clearDatabase();
  await closeTestDatabase();
});

describe("GET /api/v1/admin/guards/pending", () => {
  beforeEach(async () => {
    await Guard.deleteMany({});
  });

  test("returns modern documents with verificationStatus mapped to status", async () => {
    await Guard.create({
      name: "Guard One",
      email: "g1@test.com",
      password: "Pass123!",
      documents: [
        {
          type: "license",
          verificationStatus: "verified",
          imageUrl: "/img/license.jpg",
        },
      ],
    });
    const res = await request(app)
      .get("/api/v1/admin/guards/pending")
      .set("Authorization", `Bearer ${adminToken}`);
    console.log(res.body);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    const doc = res.body.guards[0].documents[0];
    expect(doc.status).toBe("verified");
    expect(doc.imageUrl).toBe("/img/license.jpg");
  });

  test("deduplicates legacy license and modern license (modern wins)", async () => {
    await Guard.create({
      name: "Guard Two",
      email: "g2@test.com",
      password: "Pass123!",
      license: { status: "pending", imageUrl: "/legacy.jpg" },
      documents: [
        {
          type: "license",
          verificationStatus: "pending",
          imageUrl: "/modern.jpg",
        },
      ],
    });
    const res = await request(app)
      .get("/api/v1/admin/guards/pending")
      .set("Authorization", `Bearer ${adminToken}`);
    console.log(res.body);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    const docs = res.body.guards[0].documents;
    expect(docs.length).toBe(1);
    expect(docs[0].imageUrl).toBe("/modern.jpg");
  });

  test("counts documents correctly after dedup", async () => {
    await Guard.create({
      name: "Guard Three",
      email: "g3@test.com",
      password: "Pass123!",
      license: { status: "pending" },
      documents: [
        { type: "license", verificationStatus: "pending" },
        { type: "firstAid", verificationStatus: "verified" },
      ],
    });
    const res = await request(app)
      .get("/api/v1/admin/guards/pending")
      .set("Authorization", `Bearer ${adminToken}`);
    console.log(res.body);
    expect(res.status).toBe(200);
    const counts = res.body.guards[0].documentCounts;
    expect(counts.pending).toBe(1);
    expect(counts.verified).toBe(1);
  });

  test("returns required fields (id, imageUrl, rejectionReason, reviewedAt)", async () => {
    const reviewedAt = new Date();
    await Guard.create({
      name: "Guard Four",
      email: "g4@test.com",
      password: "Pass123!",
      documents: [
        {
          type: "license",
          verificationStatus: "rejected",
          imageUrl: "/img/rejected.jpg",
          rejectionReason: "Blurry",
          reviewedAt,
        },
      ],
    });
    const res = await request(app)
      .get("/api/v1/admin/guards/pending")
      .set("Authorization", `Bearer ${adminToken}`);
    console.log(res.body);
    expect(res.status).toBe(200);
    const doc = res.body.guards[0].documents[0];
    expect(doc).toHaveProperty("id");
    expect(doc.imageUrl).toBe("/img/rejected.jpg");
    expect(doc.rejectionReason).toBe("Blurry");
    expect(new Date(doc.reviewedAt)).toEqual(reviewedAt);
  });

  test("filters by status query parameter", async () => {
    await Guard.create({
      name: "Guard Five",
      email: "g5@test.com",
      password: "Pass123!",
      documents: [
        { type: "license", verificationStatus: "pending" },
        { type: "firstAid", verificationStatus: "verified" },
      ],
    });
    await Guard.create({
      name: "Guard Six",
      email: "g6@test.com",
      password: "Pass123!",
      documents: [{ type: "license", verificationStatus: "verified" }],
    });
    const res = await request(app)
      .get("/api/v1/admin/guards/pending?status=verified")
      .set("Authorization", `Bearer ${adminToken}`);
    console.log(res.body);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    const allDocs = res.body.guards.flatMap((g) => g.documents);
    expect(allDocs.every((d) => d.status === "verified")).toBe(true);
  });

  test("filters by type query parameter", async () => {
    await Guard.create({
      name: "Guard Seven",
      email: "g7@test.com",
      password: "Pass123!",
      documents: [
        { type: "license", verificationStatus: "pending" },
        { type: "firstAid", verificationStatus: "verified" },
      ],
    });
    const res = await request(app)
      .get("/api/v1/admin/guards/pending?type=firstAid")
      .set("Authorization", `Bearer ${adminToken}`);
    console.log(res.body);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    const docs = res.body.guards[0].documents;
    expect(docs.length).toBe(1);
    expect(docs[0].type).toBe("firstAid");
  });

  test("returns expired and expiringSoon flags correctly", async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    await Guard.create({
      name: "Guard Eight",
      email: "g8@test.com",
      password: "Pass123!",
      documents: [
        {
          type: "license",
          verificationStatus: "pending",
          expiryDate: pastDate,
        },
        {
          type: "firstAid",
          verificationStatus: "pending",
          expiryDate: futureDate,
        },
      ],
    });
    const res = await request(app)
      .get("/api/v1/admin/guards/pending")
      .set("Authorization", `Bearer ${adminToken}`);
    console.log(res.body);
    expect(res.status).toBe(200);
    const docs = res.body.guards[0].documents;
    const license = docs.find((d) => d.type === "license");
    expect(license.expired).toBe(true);
    expect(license.expiringSoon).toBe(false);
    const firstAid = docs.find((d) => d.type === "firstAid");
    expect(firstAid.expired).toBe(false);
    expect(firstAid.expiringSoon).toBe(true);
  });

  test("handles legacy license without modern documents", async () => {
    await Guard.create({
      name: "Guard Nine",
      email: "g9@test.com",
      password: "Pass123!",
      license: {
        status: "pending",
        imageUrl: "/legacy-only.jpg",
        expiryDate: new Date(),
      },
    });
    const res = await request(app)
      .get("/api/v1/admin/guards/pending")
      .set("Authorization", `Bearer ${adminToken}`);
    console.log(res.body);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    const doc = res.body.guards[0].documents[0];
    expect(doc.type).toBe("license");
    expect(doc.status).toBe("pending");
    expect(doc.imageUrl).toBe("/legacy-only.jpg");
    expect(doc.id).toBeNull();
  });

  test("returns document _id for modern documents", async () => {
    const docId = new mongoose.Types.ObjectId();
    await Guard.create({
      name: "Guard Ten",
      email: "g10@test.com",
      password: "Pass123!",
      documents: [
        { _id: docId, type: "license", verificationStatus: "pending" },
      ],
    });
    const res = await request(app)
      .get("/api/v1/admin/guards/pending")
      .set("Authorization", `Bearer ${adminToken}`);
    console.log(res.body);
    expect(res.status).toBe(200);
    const doc = res.body.guards[0].documents[0];
    expect(doc.id).toBe(docId.toString());
  });

  test("filters by both status and type", async () => {
    await Guard.create({
      name: "Guard Eleven",
      email: "g11@test.com",
      password: "Pass123!",
      documents: [
        { type: "license", verificationStatus: "pending" },
        { type: "firstAid", verificationStatus: "verified" },
      ],
    });
    const res = await request(app)
      .get("/api/v1/admin/guards/pending?type=license&status=pending")
      .set("Authorization", `Bearer ${adminToken}`);
    console.log(res.body);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    const docs = res.body.guards[0].documents;
    expect(docs.length).toBe(1);
    expect(docs[0].type).toBe("license");
    expect(docs[0].status).toBe("pending");
  });
});

describe("Admin license review malformed guard IDs", () => {
  test("verify rejects a malformed guard ID with 400", async () => {
    const res = await request(app)
      .patch("/api/v1/admin/guards/not-a-valid-object-id/license/verify")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Invalid id" });
  });

  test("reject rejects a malformed guard ID with 400", async () => {
    const res = await request(app)
      .patch("/api/v1/admin/guards/not-a-valid-object-id/license/reject")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Invalid licence document" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Invalid id" });
  });
});
