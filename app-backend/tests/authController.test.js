// tests/auth/authController.test.js
import {
  register,
  login,
  verifyOTP,
} from "../src/controllers/auth.controller.js";

import User from "../src/models/User.js";
import Employer from "../src/models/Employer.js";
import jwt from "jsonwebtoken";
import { sendOTP } from "../src/utils/sendEmail.js";

jest.mock("../src/models/User.js");
jest.mock("../src/models/Employer.js", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../src/utils/sendEmail.js");
jest.mock("jsonwebtoken");

describe("Auth Controller Tests", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      audit: {
        log: jest.fn(),
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  // ---------------- REGISTER ----------------
  describe("register", () => {
    it("should register an employer successfully", async () => {
      req.body = {
        name: "Test User",
        email: "employer@example.test",
        password: "123456",
        role: "employer",
        ABN: "12345678901",
      };

      User.findOne.mockResolvedValue(null);

      const saveMock = jest.fn().mockResolvedValue(true);

      Employer.mockImplementation(() => ({
        save: saveMock,
      }));

      await register(req, res);


      expect(res.status).toHaveBeenCalledWith(201);
      expect(req.audit.log).toHaveBeenCalled();
    });


    it.each(["admin", "super_admin", "branch_admin", "unknown_role"])(
      "should reject public registration for role: %s",
      async (role) => {
        req.body = {
          name: "Test User",
          email: `${role}@example.test`,
          password: "123456",
          role,
        };

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: `Role '${role}' is not permitted for public registration.`,
        });
      },
    );

    it("should reject registration when role is missing", async () => {
      req.body = {
        name: "Test User",
        email: "missing-role@example.test",
        password: "123456",
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Role is required.",
      });
    });


    it("should return 400 if email exists", async () => {
      req.body = {
        email: "exists@test.com",
        role: "admin",
      };

      User.findOne.mockResolvedValue({ email: "exists@test.com" });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ---------------- LOGIN ----------------
  describe("login", () => {
    it("should login and send OTP", async () => {
      const mockUser = {
        _id: "1",
        email: "test@test.com",
        role: "user",
        matchPassword: jest.fn().mockResolvedValue(true),
        save: jest.fn(),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      sendOTP.mockResolvedValue(true);

      req.body = {
        email: "test@test.com",
        password: "123456",
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(sendOTP).toHaveBeenCalled();
      expect(req.audit.log).toHaveBeenCalledWith("1", "OTP_SENT");
      expect(res.json).toHaveBeenCalledWith({
        message: "OTP sent to your email",
      });
    });

    it("should return a safe response and audit failure when OTP delivery fails", async () => {
      const otp = "482193";
      const smtpError = `SMTP rejected message containing ${otp}`;
      const mockUser = {
        _id: "1",
        email: "test@test.com",
        name: "Test User",
        role: "user",
        matchPassword: jest.fn().mockResolvedValue(true),
        save: jest.fn(),
      };
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      sendOTP.mockRejectedValue(new Error(smtpError));
      req.body = {
        email: "test@test.com",
        password: "123456",
      };

      await login(req, res);

      expect(User.updateOne).toHaveBeenCalledWith(
        {
          _id: "1",
          otp: mockUser.otp,
          otpExpiresAt: mockUser.otpExpiresAt,
        },
        {
          $unset: {
            otp: "",
            otpExpiresAt: "",
          },
        },
      );
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(User.updateOne.mock.invocationCallOrder[0]).toBeLessThan(
        req.audit.log.mock.invocationCallOrder[0],
      );
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        message:
          "We could not send your verification code. Please try again later.",
      });
      expect(req.audit.log).toHaveBeenCalledWith("1", "OTP_DELIVERY_FAILED");

      const response = JSON.stringify(res.json.mock.calls);
      const logs = JSON.stringify([
        ...errorSpy.mock.calls,
        ...logSpy.mock.calls,
      ]);
      expect(response).not.toContain(otp);
      expect(response).not.toContain(smtpError);
      expect(logs).not.toContain(otp);
      expect(logs).not.toContain(smtpError);

      errorSpy.mockRestore();
      logSpy.mockRestore();
    });

    it("should not clear a newer OTP when an older delivery attempt fails", async () => {
      const mockUser = {
        _id: "1",
        email: "test@test.com",
        name: "Test User",
        role: "user",
        matchPassword: jest.fn().mockResolvedValue(true),
        save: jest.fn(),
      };
      const storedOtp = {
        otp: undefined,
        otpExpiresAt: undefined,
      };

      mockUser.save.mockImplementation(async () => {
        storedOtp.otp = mockUser.otp;
        storedOtp.otpExpiresAt = mockUser.otpExpiresAt;
      });
      sendOTP.mockImplementation(async () => {
        storedOtp.otp = "newer-otp";
        storedOtp.otpExpiresAt = new Date(
          mockUser.otpExpiresAt.getTime() + 60_000,
        );
        throw new Error("SMTP delivery failed");
      });
      User.updateOne.mockImplementation(async (filter, update) => {
        const matchesCurrentOtp =
          filter._id === mockUser._id &&
          filter.otp === storedOtp.otp &&
          filter.otpExpiresAt.getTime() === storedOtp.otpExpiresAt.getTime();

        if (matchesCurrentOtp && update.$unset) {
          storedOtp.otp = undefined;
          storedOtp.otpExpiresAt = undefined;
        }
      });
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      req.body = {
        email: "test@test.com",
        password: "123456",
      };

      await login(req, res);

      expect(User.updateOne).toHaveBeenCalledWith(
        {
          _id: "1",
          otp: mockUser.otp,
          otpExpiresAt: mockUser.otpExpiresAt,
        },
        {
          $unset: {
            otp: "",
            otpExpiresAt: "",
          },
        },
      );
      expect(storedOtp.otp).toBe("newer-otp");
      expect(storedOtp.otpExpiresAt).toEqual(
        new Date(mockUser.otpExpiresAt.getTime() + 60_000),
      );
      expect(res.status).toHaveBeenCalledWith(503);
      expect(req.audit.log).toHaveBeenCalledWith("1", "OTP_DELIVERY_FAILED");
    });

    it("should reject invalid password", async () => {
      const mockUser = {
        matchPassword: jest.fn().mockResolvedValue(false),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      req.body = {
        email: "test@test.com",
        password: "wrong",
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // ---------------- VERIFY OTP ----------------
  describe("verifyOTP", () => {
    it("should verify OTP and return token", async () => {
      const mockUser = {
        _id: "1",
        email: "test@test.com",
        otp: "123456",
        otpExpiresAt: new Date(Date.now() + 10000),
        save: jest.fn(),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      jwt.sign.mockReturnValue("fake-token");

      req.body = {
        email: "test@test.com",
        otp: "123456",
      };

      await verifyOTP(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: "fake-token",
        }),
      );
    });

    it("should fail with invalid OTP", async () => {
      const mockUser = {
        otp: "999999",
        otpExpiresAt: new Date(Date.now() + 10000),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      req.body = {
        email: "test@test.com",
        otp: "123456",
      };

      await verifyOTP(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
