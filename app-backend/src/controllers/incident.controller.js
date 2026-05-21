import Incident from "../models/Incident.js";
import Shift from "../models/Shift.js";
import { ErrorResponse } from "../utils/errorResponse.js";
import { ACTIONS } from "../middleware/logger.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const validStatuses = ["SUBMITTED", "IN_REVIEW", "RESOLVED"];

const allowedTransitions = {
  SUBMITTED: ["IN_REVIEW"],
  IN_REVIEW: ["RESOLVED"],
  RESOLVED: [],
};

const getMediaType = (mimeType) => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  return "other";
};

// CREATE INCIDENT
export const createIncident = async (req, res, next) => {
  try {
    const { shiftId, severity, description, latitude, longitude } = req.body;

    if (!shiftId || !severity || !description) {
      return next(
        new ErrorResponse("shiftId, severity, and description are required", 400)
      );
    }

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return next(new ErrorResponse("Shift not found", 404));
    }

    if (String(shift.acceptedBy) !== String(req.user._id)) {
      return next(new ErrorResponse("Not assigned to this shift", 403));
    }

    const incident = await Incident.create({
      shiftId,
      guardId: req.user._id,
      severity,
      description,
      status: "SUBMITTED",
      recordedAt: new Date(),
      location: {
        latitude: latitude !== undefined ? Number(latitude) : undefined,
        longitude: longitude !== undefined ? Number(longitude) : undefined,
      },
    });

    await req.audit.log(req.user._id, ACTIONS.INCIDENT_CREATED, {
      incidentId: incident._id,
      recordedAt: incident.recordedAt,
      location: incident.location,
    });

    res.status(201).json({ success: true, data: incident });
  } catch (err) {
    next(err);
  }
};

// UPDATE INCIDENT
export const updateIncident = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident || incident.isDeleted) {
      return next(new ErrorResponse("Incident not found", 404));
    }

    let allowedFields = [];

    if (req.user.role === "guard") {
      if (String(incident.guardId) !== String(req.user._id)) {
        return next(new ErrorResponse("Not authorized", 403));
      }

      allowedFields = ["description"];
    } else if (req.user.role === "employer") {
      const shift = await Shift.findById(incident.shiftId);

      if (!shift || String(shift.createdBy) !== String(req.user._id)) {
        return next(new ErrorResponse("Not authorized", 403));
      }

      allowedFields = ["description", "status"];
    } else if (req.user.role === "admin") {
      allowedFields = ["severity", "description", "status"];
    } else {
      return next(new ErrorResponse("Not authorized", 403));
    }

    if (req.body.status) {
      if (!validStatuses.includes(req.body.status)) {
        return next(new ErrorResponse("Invalid status value", 400));
      }

      const currentStatus = incident.status;
      const nextStatus = req.body.status;

      if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
        return next(
          new ErrorResponse(
            `Invalid status transition from ${currentStatus} to ${nextStatus}`,
            400
          )
        );
      }
    }

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        incident[field] = req.body[field];
      }
    });

    await incident.save();

    await req.audit.log(req.user._id, ACTIONS.INCIDENT_UPDATED, {
      incidentId: incident._id,
      updatedFields: Object.keys(req.body).filter((field) =>
        allowedFields.includes(field)
      ),
    });

    res.json({ success: true, data: incident });
  } catch (err) {
    next(err);
  }
};

// GET SINGLE INCIDENT
export const getIncident = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate("shiftId")
      .populate("guardId");

    if (!incident || incident.isDeleted) {
      return next(new ErrorResponse("Incident not found", 404));
    }

    if (
      req.user.role === "guard" &&
      String(incident.guardId._id) !== String(req.user._id)
    ) {
      return next(new ErrorResponse("Not authorized", 403));
    }

    if (req.user.role === "employer") {
      const shift = await Shift.findById(incident.shiftId._id);
      if (String(shift.createdBy) !== String(req.user._id)) {
        return next(new ErrorResponse("Not authorized", 403));
      }
    }

    res.json({ success: true, data: incident });
  } catch (err) {
    next(err);
  }
};

// LIST INCIDENTS
export const getIncidents = async (req, res, next) => {
  try {
    const { shiftId, guardId, severity, status, startDate, endDate } =
      req.query;

    let query = { isDeleted: false };

    if (shiftId) query.shiftId = shiftId;
    if (guardId) query.guardId = guardId;
    if (severity) query.severity = severity;

    if (status) {
      if (!validStatuses.includes(status)) {
        return next(new ErrorResponse("Invalid status filter", 400));
      }
      query.status = status;
    }

    if (startDate || endDate) {
      query.recordedAt = {};
      if (startDate) query.recordedAt.$gte = new Date(startDate);
      if (endDate) query.recordedAt.$lte = new Date(endDate);
    }

    if (req.user.role === "guard") {
      query.guardId = req.user._id;
    }

    if (req.user.role === "employer") {
      const shifts = await Shift.find({ createdBy: req.user._id }).select("_id");
      query.shiftId = { $in: shifts.map((s) => s._id) };
    }

    const incidents = await Incident.find(query)
      .populate("shiftId")
      .populate("guardId");

    res.json({ success: true, count: incidents.length, data: incidents });
  } catch (err) {
    next(err);
  }
};

// SOFT DELETE
export const deleteIncident = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident || incident.isDeleted) {
      return next(new ErrorResponse("Incident not found", 404));
    }

    incident.isDeleted = true;
    incident.deletedAt = new Date();
    incident.deletedBy = req.user._id;

    await incident.save();

    await req.audit.log(req.user._id, ACTIONS.INCIDENT_DELETED, {
      incidentId: incident._id,
    });

    res.json({ success: true, message: "Incident deleted" });
  } catch (err) {
    next(err);
  }
};

// UPLOAD ATTACHMENT
export const uploadAttachment = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident || incident.isDeleted) {
      return next(new ErrorResponse("Incident not found", 404));
    }

    if (req.user.role === "guard") {
      if (String(incident.guardId) !== String(req.user._id)) {
        return next(new ErrorResponse("Not authorized", 403));
      }
    }

    if (req.user.role === "employer") {
      const shift = await Shift.findById(incident.shiftId);

      if (!shift || String(shift.createdBy) !== String(req.user._id)) {
        return next(new ErrorResponse("Not authorized", 403));
      }
    }

    if (!["guard", "employer", "admin"].includes(req.user.role)) {
      return next(new ErrorResponse("Not authorized", 403));
    }

    if (!req.file) {
      return next(new ErrorResponse("No file uploaded", 400));
    }

    incident.attachments.push({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      mediaType: getMediaType(req.file.mimetype),
    });

    await incident.save();

    res.json({ success: true, data: incident });
  } catch (err) {
    next(err);
  }
};

// GET ATTACHMENT
export const getAttachment = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident || incident.isDeleted) {
      return next(new ErrorResponse("Incident not found", 404));
    }

    if (
      req.user.role === "guard" &&
      String(incident.guardId) !== String(req.user._id)
    ) {
      return next(new ErrorResponse("Not authorized", 403));
    }

    if (req.user.role === "employer") {
      const shift = await Shift.findById(incident.shiftId);
      if (!shift || String(shift.createdBy) !== String(req.user._id)) {
        return next(new ErrorResponse("Not authorized", 403));
      }
    }

    const attachment = incident.attachments.id(req.params.attachmentId);

    if (!attachment) {
      return next(new ErrorResponse("Attachment not found", 404));
    }

    const filePath = path.join(__dirname, "..", "uploads", attachment.fileName);
    res.download(filePath);
  } catch (err) {
    next(err);
  }
};