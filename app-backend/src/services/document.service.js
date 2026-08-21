import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import User from "../models/User.js";
import { resolveUploadPath } from "../utils/uploadPath.js";
// CREATE DOCUMENT
export const createDocument = async (data, user) => {
  const { userId, type, expiryDate, imageUrl } = data;

  if (!userId || !type) {
    throw new Error("userId and type are required");
  }

  const targetUser = await User.findById(userId);

  if (!targetUser) {
    throw new Error("User not found");
  }

  // RBAC: only admin or employer
  if (user.role !== "admin" && user.role !== "employer") {
    throw new Error("Not authorized to create document");
  }

  const newDoc = {
    type,
    expiryDate: expiryDate ? new Date(expiryDate) : null,
    imageUrl,
    verificationStatus: "pending",
    expiryStatus: calculateExpiryStatus(expiryDate),
  };

  targetUser.documents.push(newDoc);

  await targetUser.save();

  return {
    message: "Document created successfully",
    document: newDoc,
  };
};
// Calculate expiry status
export const calculateExpiryStatus = (expiryDate) => {
  if (!expiryDate) return "valid";

  const now = new Date();
  const expiry = new Date(expiryDate);

  const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "expiring";
  return "valid";
};

//  Get all documents with filters
export const getAllDocuments = async (query) => {
  const { status, type } = query;

  const users = await User.find({ "documents.0": { $exists: true } });

  let results = [];

  users.forEach((user) => {
    user.documents.forEach((doc) => {
      const expiryStatus = calculateExpiryStatus(doc.expiryDate);

      // filter
      if (status && expiryStatus !== status) return;
      if (type && doc.type !== type) return;

      results.push({
        userId: user._id,
        name: user.name,
        documentId: doc._id,
        type: doc.type,
        expiryDate: doc.expiryDate,
        expiryStatus,
        verificationStatus: doc.verificationStatus,
        imageUrl: doc.imageUrl,
      });
    });
  });

  return results;
};

//  Get single document
export const getDocumentById = async (docId) => {
  // Cast explicitly, see the note in getDocumentFileForUser. Without this the
  // query never matches and every lookup returns "Document not found".
  if (!mongoose.Types.ObjectId.isValid(docId)) {
    throw new Error("Document not found");
  }

  const user = await User.findOne({
    "documents._id": new mongoose.Types.ObjectId(docId),
  });

  if (!user) throw new Error("Document not found");

  const doc = user.documents.id(docId);

  return {
    userId: user._id,
    name: user.name,
    documentId: doc._id,
    type: doc.type,
    expiryDate: doc.expiryDate,
    expiryStatus: calculateExpiryStatus(doc.expiryDate),
    verificationStatus: doc.verificationStatus,
    imageUrl: doc.imageUrl,
  };
};

//  Update expiry date
export const updateDocumentExpiry = async (docId, expiryDate, user) => {
  if (!expiryDate) throw new Error("expiryDate is required");

  const newDate = new Date(expiryDate);
  if (isNaN(newDate.getTime())) {
    throw new Error("Invalid expiry date");
  }

  // Same casting issue as getDocumentById.
  if (!mongoose.Types.ObjectId.isValid(docId)) {
    throw new Error("Document not found");
  }

  const targetUser = await User.findOne({
    "documents._id": new mongoose.Types.ObjectId(docId),
  });

  if (!targetUser) throw new Error("Document not found");

  const doc = targetUser.documents.id(docId);

  //  RBAC: only admin OR owner
  if (user.role !== "admin" && String(targetUser._id) !== String(user._id)) {
    throw new Error("Not authorized to update this document");
  }

  doc.expiryDate = newDate;
  doc.expiryStatus = calculateExpiryStatus(newDate);

  await targetUser.save();

  return { message: "Document expiry updated successfully" };
};

/**
 * Locate the file behind a document and confirm the caller may have it.
 *
 * Access follows the least privilege rules agreed for BE 028:
 *   - a guard may retrieve their own documents
 *   - an admin may retrieve anyone's
 *   - employers are not granted licence access, because there is no reliable
 *     guard to employer link in the current model. Shift offers applicants,
 *     acceptedBy and guardIds, which mean three different things, so choosing
 *     one would be a product decision rather than an implementation detail.
 *
 * Errors carry a status for the controller to surface:
 *   403 the caller is authenticated but not allowed this document
 *   404 no such document, or the record exists but its file is gone
 *
 * @param {string} docId
 * @param {{ id: string, role: string }} requester from req.user
 * @returns {Promise<{ path: string, filename: string }>}
 */
export const getDocumentFileForUser = async (docId, requester) => {
  const httpError = (status, message) => {
    const err = new Error(message);
    err.status = status;
    return err;
  };

  if (!mongoose.Types.ObjectId.isValid(docId)) {
    throw httpError(404, "Document not found");
  }

  // Cast explicitly. "documents" is declared on the Guard discriminator rather
  // than the base User schema, so Mongoose cannot resolve the path to cast the
  // string itself and the query would silently match nothing.
  const owner = await User.findOne({
    "documents._id": new mongoose.Types.ObjectId(docId),
  });
  if (!owner) throw httpError(404, "Document not found");

  const requesterId = String(requester?.id || requester?._id || "");
  const isOwner = String(owner._id) === requesterId;
  const isAdmin = requester?.role === "admin";

  // Lou's spec for this ticket: authenticated but not permitted is a 403, not
  // a 404. That is deliberate here even though the availability endpoints hide
  // existence behind a 404.
  if (!isOwner && !isAdmin) {
    throw httpError(403, "Not authorized to retrieve this document");
  }

  const doc = owner.documents.id(docId);
  if (!doc) throw httpError(404, "Document not found");

  const resolved = resolveUploadPath(doc.imageUrl);
  if (!resolved || !fs.existsSync(resolved)) {
    throw httpError(404, "Document file not found");
  }

  return { path: resolved, filename: path.basename(resolved) };
};
