/**
 * config/uploadsDir.js
 *
 * One definition of where uploaded files live, so writing and reading cannot
 * drift apart.
 *
 * This deliberately avoids import.meta.url. Jest in this project cannot parse
 * it, so any module importing a file that uses it fails to load in tests. The
 * path is resolved from the working directory instead, which is the backend
 * root both locally (npm start from app-backend) and in Docker (WORKDIR /app).
 *
 * Set UPLOADS_DIR to override, for example when running from another directory.
 */

import path from "path";

export const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(process.cwd(), "uploads");
