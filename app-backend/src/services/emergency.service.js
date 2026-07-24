import mongoose from "mongoose";

import Emergency from "../models/Emergency.js";
import Shift from "../models/Shift.js";

export const TERMINAL_STATUSES = ["RESOLVED", "CANCELLED"];
export const ACTIVE_STATUSES = ["ACTIVE", "ESCALATED"];
export const SOS_STATUSES = ["ACTIVE", "ESCALATED", "RESOLVED", "CANCELLED"];

const MAX_MESSAGE_LENGTH = 500;
const MAX_NOTE_LENGTH = 2000;
const COOLDOWN_MS = 60_000;
const ALLOWED_TRANSITIONS = {
  ACTIVE: ["ESCALATED", "RESOLVED", "CANCELLED"],
  ESCALATED: ["RESOLVED", "CANCELLED"],
  RESOLVED: [],
  CANCELLED: [],
};
const STATUS_TO_GUARD_STATUS = {
  ACTIVE: "pending",
  ESCALATED: "connected",
  RESOLVED: "resolved",
  CANCELLED: "cancelled",
};

export class EmergencyServiceError extends Error {
  constructor(statusCode, message, details = {}) {
    super(message);
    this.name = "EmergencyServiceError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

const getUserId = (user) => user?._id || user?.id;

const isValidObjectId = (value) => mongoose.isValidObjectId(value);

const parseCoordinate = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseOptionalTimestamp = (value) => {
  if (value === undefined || value === null || value === "") return new Date();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new EmergencyServiceError(400, "timestamp must be a valid date/time value");
  }
  return date;
};

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");

const validateTextLength = (value, fieldName, maxLength) => {
  if (value.length > maxLength) {
    throw new EmergencyServiceError(400, `${fieldName} must be ${maxLength} characters or fewer`);
  }
};

const isValidLatitude = (value) => value !== null && value >= -90 && value <= 90;
const isValidLongitude = (value) => value !== null && value >= -180 && value <= 180;

export const normalizeStatus = (status) => {
  if (typeof status !== "string") return null;
  return status.toUpperCase();
};

const mapHistoryStatus = (status) => STATUS_TO_GUARD_STATUS[status] || "pending";

const toISOStringOrNow = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const getStatusMessage = (status) => {
  switch (status) {
    case "ESCALATED":
      return "SOS escalated";
    case "RESOLVED":
      return "SOS resolved";
    case "CANCELLED":
      return "SOS cancelled";
    case "ACTIVE":
    default:
      return "SOS active";
  }
};

export const serializeSOS = (sos) => {
  const plain = typeof sos.toObject === "function" ? sos.toObject() : sos;
  const latestLocationAt = plain.locationUpdates?.at(-1)?.timestamp || plain.updatedAt || plain.createdAt;

  return {
    _id: String(plain._id),
    guardId: String(plain.guardId?._id || plain.guardId),
    shiftId: plain.shiftId ? String(plain.shiftId?._id || plain.shiftId) : null,
    triggeredAt: toISOStringOrNow(plain.createdAt),
    status: mapHistoryStatus(plain.status),
    statusMessage: getStatusMessage(plain.status),
    location: {
      latitude: plain.latitude,
      longitude: plain.longitude,
      timestamp: latestLocationAt ? new Date(latestLocationAt).getTime() : undefined,
    },
    history: (plain.statusHistory || []).map((entry) => ({
      status: mapHistoryStatus(entry.status),
      message: entry.message,
      at: toISOStringOrNow(entry.at),
    })),
    note: plain.note || plain.message || "",
    emergencyContact: {
      name: "Emergency Services",
      phone: "000",
    },
    cancelledAt: plain.cancelledAt ? new Date(plain.cancelledAt).toISOString() : null,
    resolvedAt: plain.resolvedAt ? new Date(plain.resolvedAt).toISOString() : null,
  };
};

const canTransition = (from, to) => {
  if (from === to) return false;
  return ALLOWED_TRANSITIONS[from]?.includes(to) || false;
};

export const buildScopedEmergencyQuery = async (user, baseQuery = {}) => {
  if (user?.role === "admin") return baseQuery;

  const userId = getUserId(user);
  if (user?.role === "guard") {
    return { ...baseQuery, guardId: userId };
  }

  if (user?.role === "employer") {
    const shifts = await Shift.find({ createdBy: userId }).select("_id").lean();
    return { ...baseQuery, shiftId: { $in: shifts.map((shift) => shift._id) } };
  }

  return { ...baseQuery, _id: null };
};

const findScopedSOSById = async (user, id) => {
  if (!isValidObjectId(id)) {
    throw new EmergencyServiceError(404, "SOS not found");
  }
  const query = await buildScopedEmergencyQuery(user, { _id: id });
  const sos = await Emergency.findOne(query);
  if (!sos) {
    throw new EmergencyServiceError(404, "SOS not found");
  }
  return sos;
};

const validateCoordinates = (body) => {
  const latitude = parseCoordinate(body.latitude);
  const longitude = parseCoordinate(body.longitude);

  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    throw new EmergencyServiceError(
      400,
      "Latitude must be between -90 and 90 and longitude must be between -180 and 180",
    );
  }

  return { latitude, longitude };
};

export const createSOS = async (user, body) => {
  const guardId = getUserId(user);
  if (!guardId) {
    throw new EmergencyServiceError(401, "Authenticated user id missing from context");
  }

  const { latitude, longitude } = validateCoordinates(body);
  const message = normalizeText(body.message);
  const note = normalizeText(body.note) || message;
  const shiftId = body.shiftId || null;
  const timestamp = parseOptionalTimestamp(body.timestamp);

  validateTextLength(message, "message", MAX_MESSAGE_LENGTH);
  validateTextLength(note, "note", MAX_NOTE_LENGTH);

  if (shiftId && !isValidObjectId(shiftId)) {
    throw new EmergencyServiceError(400, "shiftId must be a valid ID");
  }

  const activeSOS = await Emergency.findOne({
    guardId,
    status: { $in: ACTIVE_STATUSES },
  }).sort({ createdAt: -1 });

  if (activeSOS) {
    throw new EmergencyServiceError(409, "An active SOS already exists for this guard", {
      sos: activeSOS,
    });
  }

  const lastSOS = await Emergency.findOne({ guardId }).sort({ createdAt: -1 });
  if (lastSOS && Date.now() - new Date(lastSOS.createdAt).getTime() < COOLDOWN_MS) {
    throw new EmergencyServiceError(429, "SOS already triggered recently. Please wait.");
  }

  const sos = await Emergency.create({
    guardId,
    shiftId,
    latitude,
    longitude,
    message,
    note,
    statusHistory: [{ status: "ACTIVE", message: "SOS triggered", by: guardId }],
    locationUpdates: [{ latitude, longitude, timestamp }],
  });

  return sos;
};

export const listSOS = async (user) => {
  const query = await buildScopedEmergencyQuery(user);
  return Emergency.find(query)
    .populate("guardId", "name email")
    .populate("shiftId", "title date createdBy")
    .sort({ createdAt: -1 });
};

export const getActiveSOSForUser = async (user) => {
  const query = await buildScopedEmergencyQuery(user, { status: { $in: ACTIVE_STATUSES } });
  const sos = await Emergency.findOne(query).sort({ createdAt: -1 });
  if (!sos) {
    throw new EmergencyServiceError(404, "No active SOS found");
  }
  return sos;
};

export const getSOSById = async (user, id) => findScopedSOSById(user, id);

export const transitionSOS = async (user, id, statusInput, messageInput = "") => {
  const status = normalizeStatus(statusInput);
  const message = normalizeText(messageInput);

  if (!SOS_STATUSES.includes(status)) {
    throw new EmergencyServiceError(400, "Invalid status");
  }
  validateTextLength(message, "message", MAX_MESSAGE_LENGTH);

  const sos = await findScopedSOSById(user, id);
  if (!canTransition(sos.status, status)) {
    throw new EmergencyServiceError(409, `Cannot transition SOS from ${sos.status} to ${status}`);
  }

  sos.status = status;
  if (status === "RESOLVED") sos.resolvedAt = new Date();
  if (status === "CANCELLED") sos.cancelledAt = new Date();
  if (status === "ESCALATED") sos.escalatedAt = new Date();
  sos.statusHistory.push({
    status,
    message: message || getStatusMessage(status),
    by: getUserId(user),
  });

  await sos.save();
  return sos;
};

export const updateSOSLocationForUser = async (user, id, body) => {
  const { latitude, longitude } = validateCoordinates(body);
  const timestamp = parseOptionalTimestamp(body.timestamp);
  const sos = await findScopedSOSById(user, id);

  if (TERMINAL_STATUSES.includes(sos.status)) {
    throw new EmergencyServiceError(409, "Cannot update location for an inactive SOS");
  }

  sos.latitude = latitude;
  sos.longitude = longitude;
  sos.locationUpdates.push({ latitude, longitude, timestamp });

  await sos.save();
  return sos;
};

export const updateSOSNoteForUser = async (user, id, noteInput) => {
  const note = normalizeText(noteInput);
  if (!note) {
    throw new EmergencyServiceError(400, "note is required");
  }
  validateTextLength(note, "note", MAX_NOTE_LENGTH);

  const sos = await findScopedSOSById(user, id);
  if (TERMINAL_STATUSES.includes(sos.status)) {
    throw new EmergencyServiceError(409, "Cannot add a note to an inactive SOS");
  }

  sos.note = note;
  sos.statusHistory.push({
    status: sos.status,
    message: "SOS note updated",
    by: getUserId(user),
  });

  await sos.save();
  return sos;
};

export const cancelSOSForUser = async (user, id) => transitionSOS(user, id, "CANCELLED", "SOS cancelled by guard");
