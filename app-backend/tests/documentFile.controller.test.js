import mongoose from "mongoose";
import fs from "fs";

import { downloadDocumentFile } from "../src/controllers/document.controller.js";
import User from "../src/models/User.js";
import { resolveUploadPath, uploadExists } from "../src/utils/uploadPath.js";
import { uploadsDir } from "../src/config/uploadsDir.js";

// Replace the model's DB call and the filesystem check so the tests never touch
// Mongo or the real uploads folder.
jest.mock("../src/models/User.js", () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
}));

jest.mock("fs", () => ({
  __esModule: true,
  default: { existsSync: jest.fn() },
  existsSync: jest.fn(),
}));

const OWNER_ID = new mongoose.Types.ObjectId().toString();
const OTHER_ID = new mongoose.Types.ObjectId().toString();
const ADMIN_ID = new mongoose.Types.ObjectId().toString();
const EMPLOYER_ID = new mongoose.Types.ObjectId().toString();
const DOC_ID = new mongoose.Types.ObjectId().toString();

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn();
  res.download = jest.fn();
  return res;
};

const mockReq = (overrides = {}) => ({
  user: { id: OWNER_ID, _id: OWNER_ID, role: "guard" },
  params: { id: DOC_ID },
  ...overrides,
});

// A user document holding one embedded document record, shaped the way
// Mongoose returns it (documents.id(...) looks up a subdocument by id).
const mockOwner = (imageUrl = "/uploads/licence.png", ownerId = OWNER_ID) => ({
  _id: ownerId,
  documents: {
    id: jest.fn().mockReturnValue(imageUrl ? { _id: DOC_ID, imageUrl } : null),
  },
});

describe("Upload path resolution", () => {
  test("resolves a bare filename inside the uploads directory", () => {
    const resolved = resolveUploadPath("licence.png");
    expect(resolved).toBe(`${uploadsDir}/licence.png`);
  });

  test("resolves a stored /uploads/ reference to the same place", () => {
    expect(resolveUploadPath("/uploads/licence.png")).toBe(
      `${uploadsDir}/licence.png`,
    );
  });

  test("refuses a path traversal attempt", () => {
    // basename strips the traversal, so this must not escape the folder.
    const resolved = resolveUploadPath("../../../../etc/passwd");
    expect(resolved).toBe(`${uploadsDir}/passwd`);
    expect(resolved).not.toContain("etc/passwd");
  });

  test("returns null for values that cannot be a filename", () => {
    expect(resolveUploadPath("")).toBeNull();
    expect(resolveUploadPath("   ")).toBeNull();
    expect(resolveUploadPath(null)).toBeNull();
    expect(resolveUploadPath(undefined)).toBeNull();
    expect(resolveUploadPath(123)).toBeNull();
    expect(resolveUploadPath("..")).toBeNull();
  });

  test("uploadExists is false when the file is not on disk", () => {
    fs.existsSync.mockReturnValue(false);
    expect(uploadExists("/uploads/licence.png")).toBe(false);
  });
});

describe("downloadDocumentFile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(true);
  });

  test("401 when there is no authenticated user", async () => {
    const req = mockReq({ user: undefined });
    const res = mockRes();

    await downloadDocumentFile(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.download).not.toHaveBeenCalled();
  });

  test("404 when the document id is not a valid ObjectId", async () => {
    const req = mockReq({ params: { id: "not-an-id" } });
    const res = mockRes();

    await downloadDocumentFile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(User.findOne).not.toHaveBeenCalled();
  });

  test("404 when no document matches the id", async () => {
    User.findOne.mockResolvedValue(null);
    const res = mockRes();

    await downloadDocumentFile(mockReq(), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.download).not.toHaveBeenCalled();
  });

  test("looks the document up by ObjectId, not by string", async () => {
    // documents is declared on the Guard discriminator rather than the base
    // User schema, so Mongoose cannot cast the string itself and the query
    // would match nothing.
    User.findOne.mockResolvedValue(mockOwner());

    await downloadDocumentFile(mockReq(), mockRes());

    const query = User.findOne.mock.calls[0][0];
    expect(query["documents._id"]).toBeInstanceOf(mongoose.Types.ObjectId);
  });

  test("403 when the document belongs to another user", async () => {
    User.findOne.mockResolvedValue(mockOwner("/uploads/licence.png", OTHER_ID));
    const res = mockRes();

    await downloadDocumentFile(mockReq(), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.download).not.toHaveBeenCalled();
  });

  test("200 and sends the file to the owner", async () => {
    User.findOne.mockResolvedValue(mockOwner());
    const res = mockRes();

    await downloadDocumentFile(mockReq(), res);

    expect(res.download).toHaveBeenCalledWith(
      `${uploadsDir}/licence.png`,
      "licence.png",
    );
    expect(res.status).not.toHaveBeenCalledWith(403);
  });

  test("200 and sends the file to an admin for someone else's document", async () => {
    User.findOne.mockResolvedValue(mockOwner("/uploads/licence.png", OTHER_ID));
    const req = mockReq({
      user: { id: ADMIN_ID, _id: ADMIN_ID, role: "admin" },
    });
    const res = mockRes();

    await downloadDocumentFile(req, res);

    expect(res.download).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalledWith(403);
  });

  test("403 for an employer, licence access is out of scope for BE 028", async () => {
    User.findOne.mockResolvedValue(mockOwner("/uploads/licence.png", OTHER_ID));
    const req = mockReq({
      user: { id: EMPLOYER_ID, _id: EMPLOYER_ID, role: "employer" },
    });
    const res = mockRes();

    await downloadDocumentFile(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.download).not.toHaveBeenCalled();
  });

  test("404 when the record exists but its file is missing from disk", async () => {
    User.findOne.mockResolvedValue(mockOwner());
    fs.existsSync.mockReturnValue(false);
    const res = mockRes();

    await downloadDocumentFile(mockReq(), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.download).not.toHaveBeenCalled();
  });

  test("404 when the document record has no file reference at all", async () => {
    User.findOne.mockResolvedValue(mockOwner(null));
    const res = mockRes();

    await downloadDocumentFile(mockReq(), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.download).not.toHaveBeenCalled();
  });

  test("a traversal value in the database cannot reach outside the uploads folder", async () => {
    User.findOne.mockResolvedValue(mockOwner("../../../../etc/passwd"));
    const res = mockRes();

    await downloadDocumentFile(mockReq(), res);

    // It resolves to <uploads>/passwd, which does not exist, so it 404s
    // rather than serving a file from elsewhere on the server.
    const sent = res.download.mock.calls[0]?.[0];
    if (sent) expect(sent.startsWith(uploadsDir)).toBe(true);
    expect(sent).not.toBe("/etc/passwd");
  });
});
