import { jest } from "@jest/globals";

const User = {
  findOne: jest.fn(),
  create: jest.fn(),
  discriminator: jest.fn(),
};

const Employer = jest.fn();
Employer.create = jest.fn();

const Guard = {
  findOne: jest.fn(),
  create: jest.fn(),
};

const EOI = jest.fn();

const sendOTP = jest.fn();

jest.unstable_mockModule("../src/models/User.js", () => ({
  default: User,
}));

jest.unstable_mockModule("../src/models/Employer.js", () => ({
  default: Employer,
}));

jest.unstable_mockModule("../src/models/Guard.js", () => ({
  default: Guard,
}));

jest.unstable_mockModule("../src/models/eoi.js", () => ({
  default: EOI,
}));

jest.unstable_mockModule("../src/utils/sendEmail.js", () => ({
  sendOTP,
}));

const { submitEOI } = await import("../src/controllers/auth.controller.js");

describe("submitEOI", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("saves a pending EOI without creating a user or employer account", async () => {
    const eoiData = {
      companyName: "BE 042 Security Pty Ltd",
      abnAcn: "12345678901",
      contactPerson: "EOI Test Contact",
      contactEmail: "be042.eoi@example.test",
      phone: "+61400123456",
      description: "Regression test EOI submission.",
      documents: [
        {
          filename: "company-profile.pdf",
          id: "test-gridfs-file-id",
        },
      ],
    };

    const save = jest.fn().mockResolvedValue();
    const eoi = {
      _id: "pending-eoi-id",
      ...eoiData,
      status: "pending",
      save,
    };

    EOI.mockImplementation(() => eoi);

    const result = await submitEOI(eoiData);

    expect(EOI).toHaveBeenCalledWith(eoiData);
    expect(save).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ eoi });

    expect(User.findOne).not.toHaveBeenCalled();
    expect(User.create).not.toHaveBeenCalled();
    expect(Employer).not.toHaveBeenCalled();
    expect(Employer.create).not.toHaveBeenCalled();
  });
});
