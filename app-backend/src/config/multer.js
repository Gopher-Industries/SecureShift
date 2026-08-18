// config/multer.js
import multer from "multer";
import fs from "fs";
import { uploadsDir } from "./uploadsDir.js";

// ensure uploads dir exists. The path lives in its own module so retrieval
// resolves files against the same directory uploads are written to.
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// where & how to store files
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeOriginal = file.originalname.replace(/[^\w.-]/g, "_");
    const ts = Date.now();
    cb(null, `${ts}-${safeOriginal}`);
  },
});

// supported files: images, PDFs, videos, and audio
const allowedMimeTypes = [
  // images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",

  // pdf
  "application/pdf",

  // videos
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/webm",

  // audio
  "audio/mpeg",
  "audio/wav",
  "audio/webm",
  "audio/mp4",
];

// Rejections carry a 400 so handleUploadError can tell a bad request apart
// from a genuine server fault.
export const rejectUpload = (message) => {
  const err = new Error(message);
  err.status = 400;
  return err;
};

const fileFilter = (_req, file, cb) => {
  const ok = allowedMimeTypes.includes(file.mimetype);

  cb(
    ok
      ? null
      : rejectUpload("Only images, videos, audio, and PDF files are allowed"),
    ok,
  );
};

// Single source of truth for the upload size cap. Exported so every upload
// route enforces the same limit instead of each one setting its own.
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

/**
 * Turn upload rejections into 400s.
 *
 * Multer surfaces an oversized file as a MulterError, and a rejected file type
 * as whatever the fileFilter passed back. Without this they reach the global
 * error handler and are reported as 500, which reads as a server fault when the
 * request was the problem. Mount it immediately after the multer middleware on
 * any route that accepts uploads.
 */
export const handleUploadError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? `File is too large. Maximum upload size is ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.`
        : err.message;
    return res.status(400).json({ error: message });
  }

  if (err?.status === 400) {
    return res.status(400).json({ error: err.message });
  }

  return next(err);
};
