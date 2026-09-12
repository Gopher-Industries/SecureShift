/**
 * utils/uploadPath.js
 *
 * Resolves a stored upload reference to a real path on disk.
 *
 * Values recorded against uploads are not consistent. Guard licences store
 * "/uploads/<filename>" in imageUrl, while incident attachments store a bare
 * filename. Both end up in the same directory, so retrieval has to cope with
 * either form.
 *
 * These values come out of the database, but they originate from user supplied
 * filenames, so they are treated as untrusted. A value containing "../" must
 * never be able to reach a file outside the uploads directory.
 */

import fs from "fs";
import path from "path";
import { uploadsDir } from "../config/uploadsDir.js";

/**
 * Turn a stored reference into an absolute path inside the uploads directory.
 * Returns null when the value is unusable or points outside that directory.
 *
 * @param {string} stored e.g. "/uploads/1712-licence.png" or "1712-licence.png"
 * @returns {string|null}
 */
export const resolveUploadPath = (stored) => {
  if (typeof stored !== "string" || stored.trim() === "") return null;

  // Keep only the final path segment. This alone defeats "../" traversal,
  // because path.basename("../../etc/passwd") is "passwd".
  const filename = path.basename(stored.trim());

  // basename can still return something unusable for these inputs.
  if (!filename || filename === "." || filename === "..") return null;

  const resolved = path.resolve(uploadsDir, filename);

  // Second check in case basename is ever removed or changed above. The
  // resolved path must sit directly inside the uploads directory.
  if (path.dirname(resolved) !== path.resolve(uploadsDir)) return null;

  return resolved;
};

/**
 * True when the stored reference resolves to a file that exists on disk.
 * A record can outlive its file, so callers need to tell those cases apart.
 *
 * @param {string} stored
 * @returns {boolean}
 */
export const uploadExists = (stored) => {
  const resolved = resolveUploadPath(stored);
  return resolved !== null && fs.existsSync(resolved);
};
