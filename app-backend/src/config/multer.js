// config/multer.js
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ensure uploads dir exists
const uploadsDir = path.join(__dirname, "..", "uploads");
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

const fileFilter = (_req, file, cb) => {
  const ok = allowedMimeTypes.includes(file.mimetype);

  cb(
    ok ? null : new Error("Only images, videos, audio, and PDF files are allowed"),
    ok
  );
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});