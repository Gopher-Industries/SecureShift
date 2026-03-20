import Incident from "../models/Incident.js";
import Shift from "../models/Shift.js";
import { ErrorResponse } from "../utils/errorResponse.js";
import { ACTIONS } from "../middleware/logger.js";

// CREATE INCIDENT
export const createIncident = async (req, res, next) => {
  try {
    const { shiftId, severity, description } = req.body;

    if (!shiftId || !severity || !description) {
      return next(new ErrorResponse("All fields are required", 400));
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
    });

    await req.audit.log(req.user._id, ACTIONS.INCIDENT_CREATED, {
      incidentId: incident._id,
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

    // Guards can only update their own
    if (
      req.user.role === "guard" &&
      String(incident.guardId) !== String(req.user._id)
    ) {
      return next(new ErrorResponse("Not authorized", 403));
    }

    Object.assign(incident, req.body);

    await incident.save();

    await req.audit.log(req.user._id, ACTIONS.INCIDENT_UPDATED, {
      incidentId: incident._id,
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

    // Guard access
    if (
      req.user.role === "guard" &&
      String(incident.guardId._id) !== String(req.user._id)
    ) {
      return next(new ErrorResponse("Not authorized", 403));
    }

    // Employer access
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

// LIST INCIDENTS (WITH FILTERS)
export const getIncidents = async (req, res, next) => {
  try {
    const { shiftId, guardId, severity, status, startDate, endDate } =
      req.query;

    let query = { isDeleted: false };

    if (shiftId) query.shiftId = shiftId;
    if (guardId) query.guardId = guardId;
    if (severity) query.severity = severity;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // RBAC filtering
    if (req.user.role === "guard") {
      query.guardId = req.user._id;
    }

    if (req.user.role === "employer") {
      const shifts = await Shift.find({ createdBy: req.user._id }).select(
        "_id"
      );
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

    if (!req.file) {
      return next(new ErrorResponse("No file uploaded", 400));
    }

    incident.attachments.push({
      fileName: req.file.filename,
      fileUrl: `/uploads/${req.file.filename}`,
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

    const attachment = incident.attachments.id(req.params.attachmentId);

    if (!attachment) {
      return next(new ErrorResponse("Attachment not found", 404));
    }

    res.download(`.${attachment.fileUrl}`);
  } catch (err) {
    next(err);
  }
};