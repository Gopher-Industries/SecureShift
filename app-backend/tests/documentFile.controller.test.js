import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import multer from "multer";

import { downloadDocumentFile } from "../src/controllers/document.controller.js";
import { handleUploadError } from "../src/config/multer.js";
import User from "../src/models/User.js";
import { resolveUploadPath, uploadExists } from "../src/utils/uploadPath.js";
import { uploadsDir } from "../src/config/uploadsDir.js";

// Point the uploads directory at a temp folder for the duration of the run, so
// the tests use the real filesystem without touching the project's uploads.
// The factory is self contained because jest hoists it above the imports.
jest.mock("../src/config/uploadsDir.js", () => {
  const os = require("os");
  const nodePath = require("path");
  return {
    __esModule: true,
    uploadsDir: nodePath.join(os.tmpdir(), "secureshift-be028-tests"),
  };
});

// Only the model's DB call is mocked. Everything else runs for real.
jest.mock("../src/models/User.js", () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
}));

const OWNER_ID = new mongoose.Types.ObjectId().toString();
const OTHER_ID = new mongoose.Types.ObjectId().toString();
const ADMIN_ID = new mongoose.Types.ObjectId().toString();
const EMPLOYER_ID = new mongoose.Types.ObjectId().toString();
const DOC_ID = new mongoose.Types.ObjectId().toString();

const LICENCE = "licence.png";
const LICENCE_BYTES = "licence-file-contents";

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
// Mongoose returns it. documents.id(...) looks up a subdocument by id.
const mockOwner = (imageUrl = `/uploads/${LICENCE}`, ownerId = OWNER_ID) => ({
  _id: ownerId,
  documents: {
    id: jest.fn().mockReturnValue(imageUrl ? { _id: DOC_ID, imageUrl } : null),
  },
});

beforeAll(() => {
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.writeFileSync(path.join(uploadsDir, LICENCE), LICENCE_BYTES);
});

afterAll(() => {
  fs.rmSync(uploadsDir, { recursive: true, force: true });
});

describe("Upload path resolution", () => {
  test("resolves a bare filename inside the uploads directory", () => {
    expect(resolveUploadPath(LICENCE)).toBe(path.join(uploadsDir, LICENCE));
  });

  test("resolves a stored /uploads/ reference to the same place", () => {
    expect(resolveUploadPath(`/uploads/${LICENCE}`)).toBe(
      path.join(uploadsDir, LICENCE),
    );
  });

  test("refuses a path traversal attempt", () => {
    const resolved = resolveUploadPath("../../../../etc/passwd");
    expect(resolved).toBe(path.join(uploadsDir, "passwd"));
    expect(resolved).not.toContain(`${path.sep}etc${path.sep}passwd`);
  });

  test("returns null for values that cannot be a filename", () => {
    expect(resolveUploadPath("")).toBeNull();
    expect(resolveUploadPath("   ")).toBeNull();
    expect(resolveUploadPath(null)).toBeNull();
    expect(resolveUploadPath(undefined)).toBeNull();
    expect(resolveUploadPath(123)).toBeNull();
    expect(resolveUploadPath("..")).toBeNull();
  });

  test("uploadExists reflects whether the file is really on disk", () => {
    expect(uploadExists(`/uploads/${LICENCE}`)).toBe(true);
    expect(uploadExists("/uploads/not-here.png")).toBe(false);
  });
});

describe("downloadDocumentFile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("401 when there is no authenticated user", async () => {
    const res = mockRes();

    await downloadDocumentFile(mockReq({ user: undefined }), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.download).not.toHaveBeenCalled();
  });

  test("404 when the document id is not a valid ObjectId", async () => {
    const res = mockRes();

    await downloadDocumentFile(mockReq({ params: { id: "not-an-id" } }), res);

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
    User.findOne.mockResolvedValue(mockOwner(`/uploads/${LICENCE}`, OTHER_ID));
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
      path.join(uploadsDir, LICENCE),
      LICENCE,
    );
    expect(res.status).not.toHaveBeenCalledWith(403);
  });

  test("200 and sends the file to an admin for someone else's document", async () => {
    User.findOne.mockResolvedValue(mockOwner(`/uploads/${LICENCE}`, OTHER_ID));
    const res = mockRes();

    await downloadDocumentFile(
      mockReq({ user: { id: ADMIN_ID, _id: ADMIN_ID, role: "admin" } }),
      res,
    );

    expect(res.download).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalledWith(403);
  });

  test("403 for an employer, licence access is out of scope for BE 028", async () => {
    User.findOne.mockResolvedValue(mockOwner(`/uploads/${LICENCE}`, OTHER_ID));
    const res = mockRes();

    await downloadDocumentFile(
      mockReq({
        user: { id: EMPLOYER_ID, _id: EMPLOYER_ID, role: "employer" },
      }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.download).not.toHaveBeenCalled();
  });

  test("404 when the record exists but its file is missing from disk", async () => {
    User.findOne.mockResolvedValue(mockOwner("/uploads/deleted-file.png"));
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

    // It resolves to <uploads>/passwd, which does not exist, so it 404s rather
    // than serving a file from elsewhere on the server.
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.download).not.toHaveBeenCalled();
  });
});

describe("handleUploadError", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("an oversized file becomes a 400 that states the limit", () => {
    const res = mockRes();
    const next = jest.fn();

    handleUploadError(new multer.MulterError("LIMIT_FILE_SIZE"), {}, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.stringContaining("25MB"),
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("any other multer error becomes a 400 rather than a 500", () => {
    const res = mockRes();
    const next = jest.fn();

    handleUploadError(
      new multer.MulterError("LIMIT_FILE_COUNT"),
      {},
      res,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test("a rejected file type becomes a 400 carrying the reason", () => {
    const res = mockRes();
    const next = jest.fn();
    const rejected = new Error("Only PDF files are allowed");
    rejected.status = 400;

    handleUploadError(rejected, {}, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Only PDF files are allowed",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("an unrelated failure is passed on rather than reported as a bad request", () => {
    const res = mockRes();
    const next = jest.fn();
    const serverFault = new Error("disk unavailable");

    handleUploadError(serverFault, {}, res, next);

    expect(next).toHaveBeenCalledWith(serverFault);
    expect(res.status).not.toHaveBeenCalled();
  });
});
