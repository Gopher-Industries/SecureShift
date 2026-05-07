import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js";

import User from "../models/User.js";

describe("User Controller API Tests", () => {
  let admin;
  let employer;
  let guard;
  let adminToken;
  let employerToken;
  let guardToken;
  let createdGuardId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    admin = await User.create({
      name: "Admin",
      email: "admin@test.com",
      role: "admin",
      password: "hashed",
    });

    employer = await User.create({
      name: "Employer",
      email: "employer@test.com",
      role: "employer",
      password: "hashed",
      favourites: [],
    });

    guard = await User.create({
      name: "Guard",
      email: "guard@test.com",
      role: "guard",
      password: "hashed",
    });

    createdGuardId = guard._id;

    adminToken = "Bearer admin-token";
    employerToken = "Bearer employer-token";
    guardToken = "Bearer guard-token";
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  /* ---------------- GET MY PROFILE ---------------- */
  test("Get logged-in user profile", async () => {
    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", employerToken);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("email");
  });

  /* ---------------- LIST USERS (ADMIN) ---------------- */
  test("Admin can list all users", async () => {
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", adminToken);

    expect(res.statusCode).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(0);
  });

  test("Non-admin cannot list users", async () => {
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", guardToken);

    expect(res.statusCode).toBe(500); // or 403 depending middleware
  });

  /* ---------------- UPDATE PROFILE ---------------- */
  test("User can update own profile", async () => {
    const res = await request(app)
      .put("/api/v1/users/me")
      .set("Authorization", employerToken)
      .send({ name: "Updated Employer" });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Updated Employer");
  });

  /* ---------------- ADMIN GET USER ---------------- */
  test("Admin can get any user profile", async () => {
    const res = await request(app)
      .get(`/api/v1/users/${guard._id}`)
      .set("Authorization", adminToken);

    expect(res.statusCode).toBe(200);
    expect(res.body.role).toBe("guard");
  });

  /* ---------------- ADMIN UPDATE USER ---------------- */
  test("Admin updates user profile", async () => {
    const res = await request(app)
      .put(`/api/v1/users/${guard._id}`)
      .set("Authorization", adminToken)
      .send({ name: "Guard Updated" });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Guard Updated");
  });

  /* ---------------- GUARDS LIST ---------------- */
  test("Get all guards", async () => {
    const res = await request(app)
      .get("/api/v1/users/guards")
      .set("Authorization", employerToken);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  /* ---------------- DELETE USER ---------------- */
  test("Admin deletes user", async () => {
    const tempUser = await User.create({
      name: "Temp",
      email: "temp@test.com",
      role: "guard",
      password: "hashed",
    });

    const res = await request(app)
      .delete(`/api/v1/users/${tempUser._id}`)
      .set("Authorization", adminToken);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("User deleted successfully");
  });

  /* ---------------- EMPLOYER PROFILE ---------------- */
  test("Employer gets profile", async () => {
    const res = await request(app)
      .get("/api/v1/users/profile")
      .set("Authorization", employerToken);

    expect(res.statusCode).toBe(200);
  });

  /* ---------------- PUSH TOKEN ---------------- */
  test("Register push token", async () => {
    const res = await request(app)
      .post("/api/v1/users/push-token")
      .set("Authorization", employerToken)
      .send({
        token: "abc123",
        platform: "ios",
        deviceId: "device1",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Push token registered.");
  });

  /* ---------------- FAVOURITES ---------------- */
  test("Add favourite guard", async () => {
    const res = await request(app)
      .post(`/api/v1/users/favourites/${createdGuardId}`)
      .set("Authorization", employerToken);

    expect(res.statusCode).toBe(200);
    expect(res.body.favourites.length).toBeGreaterThan(0);
  });

  test("Get favourite guards", async () => {
    const res = await request(app)
      .get("/api/v1/users/favourites")
      .set("Authorization", employerToken);

    expect(res.statusCode).toBe(200);
  });

  test("Remove favourite guard", async () => {
    const res = await request(app)
      .delete(`/api/v1/users/favourites/${createdGuardId}`)
      .set("Authorization", employerToken);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.favourites)).toBe(true);
  });

  /* ---------------- RBAC NEGATIVE TEST ---------------- */
  test("Guard cannot access employer-only favourites", async () => {
    const res = await request(app)
      .get("/api/v1/users/favourites")
      .set("Authorization", guardToken);

    expect(res.statusCode).toBe(403);
  });
});