import nodemailer from "nodemailer";
import {
  createTransporter,
  getSmtpTransportOptions,
  parseBoolean,
  sendOTP,
} from "../src/utils/sendEmail.js";

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(),
}));

describe("SMTP configuration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("configures authenticated SMTP when authentication is required", () => {
    expect(
      getSmtpTransportOptions({
        SMTP_HOST: "smtp.example.com",
        SMTP_PORT: "465",
        SMTP_SECURE: "true",
        SMTP_AUTH_REQUIRED: "true",
        SMTP_USER: "smtp-user",
        SMTP_PASS: "smtp-password",
      }),
    ).toEqual({
      host: "smtp.example.com",
      port: 465,
      secure: true,
      auth: {
        user: "smtp-user",
        pass: "smtp-password",
      },
    });
  });

  it("configures unauthenticated SMTP without an auth property", () => {
    const options = getSmtpTransportOptions({
      SMTP_HOST: "localhost",
      SMTP_PORT: "1025",
      SMTP_SECURE: "false",
      SMTP_AUTH_REQUIRED: "false",
      SMTP_USER: "",
      SMTP_PASS: "",
    });

    expect(options).toEqual({
      host: "localhost",
      port: 1025,
      secure: false,
    });
    expect(options).not.toHaveProperty("auth");
  });

  it.each([
    [{ SMTP_USER: "smtp-user" }, "missing password"],
    [{ SMTP_PASS: "smtp-password" }, "missing user"],
  ])("rejects partial authenticated credentials (%s)", (credentials) => {
    expect(() =>
      getSmtpTransportOptions({
        SMTP_AUTH_REQUIRED: "true",
        ...credentials,
      }),
    ).toThrow(
      "SMTP_USER and SMTP_PASS are both required when SMTP_AUTH_REQUIRED=true",
    );
  });

  it("parses boolean values case-insensitively and rejects other values", () => {
    expect(parseBoolean(" TRUE ")).toBe(true);
    expect(parseBoolean("False")).toBe(false);
    expect(() => parseBoolean("yes")).toThrow(
      "Boolean configuration values must be 'true' or 'false'",
    );
  });

  it("passes the validated options to Nodemailer", () => {
    nodemailer.createTransport.mockReturnValue({ sendMail: jest.fn() });

    createTransporter({
      SMTP_HOST: "mailpit",
      SMTP_PORT: "1025",
      SMTP_SECURE: "false",
      SMTP_AUTH_REQUIRED: "false",
    });

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: "mailpit",
      port: 1025,
      secure: false,
    });
  });
});

describe("EMAIL_ENABLED", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      EMAIL_ENABLED: "false",
      SMTP_AUTH_REQUIRED: "false",
      SMTP_FROM_EMAIL: "local@example.test",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("does not create a transport or expose the OTP when email is disabled", async () => {
    const otp = "482193";
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await expect(sendOTP("developer@example.test", otp)).rejects.toThrow(
      "Email delivery is disabled",
    );

    expect(nodemailer.createTransport).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(otp);
    expect(JSON.stringify(logSpy.mock.calls)).not.toContain(otp);

    errorSpy.mockRestore();
    logSpy.mockRestore();
  });
});
