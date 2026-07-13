import crypto from "node:crypto";
import mongoose from "mongoose";

const objectIdFor = (label) => {
  const hex = crypto
    .createHash("sha256")
    .update(`secureshift-local-seed:${label}`)
    .digest("hex")
    .slice(0, 24);

  return new mongoose.Types.ObjectId(hex);
};

const mapIds = (labels, prefix) =>
  Object.fromEntries(
    labels.map((label) => [label, objectIdFor(`${prefix}:${label}`)]),
  );

export const SEED_IDS = {
  roles: mapIds(
    ["superAdmin", "admin", "branchAdmin", "employer", "guard", "client"],
    "role",
  ),
  users: mapIds(
    [
      "admin",
      "employerOperations",
      "employerVenue",
      "guardApproved",
      "guardPending",
      "guardRejected",
      "guardExpired",
    ],
    "user",
  ),
  branches: mapIds(["operations", "venue"], "branch"),
  availability: mapIds(
    ["approved", "pending", "rejected", "expired"],
    "availability",
  ),
  shifts: mapIds(
    ["open", "applied", "assigned", "completed", "venueOpen"],
    "shift",
  ),
  attendance: mapIds(["completed"], "attendance"),
  payroll: mapIds(["completedWeekly"], "payroll"),
  messages: mapIds(["employerToGuard", "guardToEmployer"], "message"),
  notifications: mapIds(
    ["application", "approval", "documentExpiry"],
    "notification",
  ),
  documents: mapIds(
    [
      "approvedLicence",
      "approvedFirstAid",
      "pendingLicence",
      "rejectedLicence",
      "expiredLicence",
    ],
    "document",
  ),
};

export const idsFor = (group) => Object.values(SEED_IDS[group]);
