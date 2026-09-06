import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "@jest/globals";

const dotenv = await import("dotenv");
const path = await import("path");

dotenv.config({
  path: path.join(process.cwd(), ".env.test"),
  override: true,
});

const request = (await import("supertest")).default;
const jwt = (await import("jsonwebtoken")).default;
const app = (await import("../src/app.js")).default;
const User = (await import("../src/models/User.js")).default;
const Shift = (await import("../src/models/Shift.js")).default;

const { startTestDatabase, clearDatabase, closeTestDatabase } = await import(
  "./db-helper.js"
);

beforeAll(async () => {
  await startTestDatabase();
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeTestDatabase();
});

const createToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
  );

describe("Shift Fatigue Dashboard", () => {
  test("Employer fetches fatigue dashboard", async () => {
    const employer = await User.create({
      name: "Employer",
      email: "employer@test.com",
      password: "Password123!",
      role: "employer",
      ABN: "98765432101",
    });

    const employerToken = createToken(employer);

    const res = await request(app)
      .get("/api/v1/shifts/fatigue")
      .set("Authorization", `Bearer ${employerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("dashboard");
    expect(res.body.dashboard).toHaveProperty("summary");
    expect(Array.isArray(res.body.dashboard.guards)).toBe(true);
  });

  test("Guard fetches fatigue dashboard", async () => {
    const guard = await User.create({
      name: "Guard",
      email: "guard@test.com",
      password: "Password123!",
      role: "guard",
    });

    const guardToken = createToken(guard);

    const res = await request(app)
      .get("/api/v1/shifts/fatigue")
      .set("Authorization", `Bearer ${guardToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Forbidden: insufficient permissions");
  });

  test("Employer with no assigned shifts gets empty fatigue dashboard", async () => {
    const emptyEmployer = await User.create({
      name: "Empty Employer",
      email: "empty-employer@test.com",
      password: "Password123!",
      role: "employer",
      ABN: "98765432109",
    });

    const emptyEmployerToken = createToken(emptyEmployer);

    const res = await request(app)
      .get("/api/v1/shifts/fatigue")
      .set("Authorization", `Bearer ${emptyEmployerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.dashboard.summary.guardsMonitored).toBe(0);
    expect(res.body.dashboard.summary.fatiguedGuards).toBe(0);
    expect(res.body.dashboard.summary.averageFatigueScore).toBe(0);
    expect(res.body.dashboard.guards).toEqual([]);
  });

  test("Employer with one normal guard gets a result from the fatigue dashboard", async () => {
    const today = new Date();

    const normalEmployer = await User.create({
      name: "Normal Employer",
      email: "normal-employer@test.com",
      password: "Password123!",
      role: "employer",
      ABN: "98765432110",
    });

    const normalEmployerToken = createToken(normalEmployer);

    const normalGuard = await User.create({
      name: "Normal Guard",
      email: "normal-guard@test.com",
      password: "Password123!",
      role: "guard",
    });

    await Shift.create({
      title: "Normal Fatigue Test",
      date: today,
      startTime: "09:00",
      endTime: "17:00",
      createdBy: normalEmployer._id,
      acceptedBy: normalGuard._id,
      status: "assigned",
    });

    const res = await request(app)
      .get("/api/v1/shifts/fatigue")
      .set("Authorization", `Bearer ${normalEmployerToken}`);

    expect(res.statusCode).toBe(200);

    const result = res.body.dashboard.guards.find(
      (item) => item.guardId === normalGuard._id.toString(),
    );

    expect(result).toBeDefined();
    expect(res.body.dashboard.summary.guardsMonitored).toBe(1);
    expect(res.body.dashboard.summary.fatiguedGuards).toBe(0);
    expect(result.guardId).toBe(normalGuard._id.toString());
    expect(result.isFatigued).toBe(false);
    expect(result.warnings).toEqual([]);
    expect(result.metrics.shiftsThisWeek).toBe(1);
    expect(result.metrics.hoursThisDay).toBe(8);
    expect(result.metrics.hoursThisWeek).toBe(8);
  });

  test("Employer with one fatigued guard gets a result from the fatigue dashboard", async () => {
    const today = new Date();

    const fatigueEmployer = await User.create({
      name: "Fatigue Employer",
      email: "fatigue-employer@test.com",
      password: "Password123!",
      role: "employer",
      ABN: "98765432111",
    });

    const fatigueEmployerToken = createToken(fatigueEmployer);

    const fatigueGuard = await User.create({
      name: "Fatigue Guard",
      email: "fatigue-guard@test.com",
      password: "Password123!",
      role: "guard",
    });

    await Shift.create({
      title: "Fatigued Guard Test",
      date: today,
      startTime: "08:00",
      endTime: "20:00",
      createdBy: fatigueEmployer._id,
      acceptedBy: fatigueGuard._id,
      status: "assigned",
    });

    const res = await request(app)
      .get("/api/v1/shifts/fatigue")
      .set("Authorization", `Bearer ${fatigueEmployerToken}`);

    expect(res.statusCode).toBe(200);

    const result = res.body.dashboard.guards.find(
      (item) => item.guardId === fatigueGuard._id.toString(),
    );

    expect(result).toBeDefined();
    expect(res.body.dashboard.summary.guardsMonitored).toBe(1);
    expect(res.body.dashboard.summary.fatiguedGuards).toBe(1);
    expect(result.guardId).toBe(fatigueGuard._id.toString());
    expect(result.isFatigued).toBe(true);
    expect(result.warnings).toContain(
      "Guard exceeds recommended daily hour limit of 10 hours",
    );
    expect(result.metrics.shiftsThisWeek).toBe(1);
    expect(result.metrics.hoursThisDay).toBe(12);
    expect(result.metrics.hoursThisWeek).toBe(12);
  });

  test("Employer only sees guards assigned to their own shifts", async () => {
    const today = new Date();

    const employerA = await User.create({
      name: "Employer A",
      email: "employer-A@test.com",
      password: "Password123!",
      role: "employer",
      ABN: "98765432112",
    });

    const employerAToken = createToken(employerA);

    const guardA = await User.create({
      name: "guard A",
      email: "guard-A@test.com",
      password: "Password123!",
      role: "guard",
    });

    await Shift.create({
      title: "Guard A normal shift",
      date: today,
      startTime: "09:00",
      endTime: "17:00",
      createdBy: employerA._id,
      acceptedBy: guardA._id,
      status: "assigned",
    });

    const employerB = await User.create({
      name: "Employer B",
      email: "employer-B@test.com",
      password: "Password123!",
      role: "employer",
      ABN: "98765432113",
    });

    const guardB = await User.create({
      name: "guard B",
      email: "guard-B@test.com",
      password: "Password123!",
      role: "guard",
    });

    await Shift.create({
      title: "Guard B fatigue shift",
      date: today,
      startTime: "08:00",
      endTime: "20:00",
      createdBy: employerB._id,
      acceptedBy: guardB._id,
      status: "assigned",
    });

    const res = await request(app)
      .get("/api/v1/shifts/fatigue")
      .set("Authorization", `Bearer ${employerAToken}`);

    expect(res.statusCode).toBe(200);

    const guardAresult = res.body.dashboard.guards.find(
      (item) => item.guardId === guardA._id.toString(),
    );

    const guardBresult = res.body.dashboard.guards.find(
      (item) => item.guardId === guardB._id.toString(),
    );

    expect(guardAresult).toBeDefined();
    expect(guardBresult).toBeUndefined();
    expect(res.body.dashboard.summary.guardsMonitored).toBe(1);
  });
});
