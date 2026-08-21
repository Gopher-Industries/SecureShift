import mongoose from "mongoose";
import Shift from "../models/Shift.js";
import Branch from "../models/Branch.js";
import {
  getEndOfWeek,
  getStartOfWeek,
  assessCurrentGuardFatigue,
} from "../services/fatigue.service.js";
import { ACTIONS } from "../middleware/logger.js";

import {
  applyForShiftService,
  approveShiftService,
} from "../services/shiftApplication.service.js";

// Returns true if now is at/after the shift start datetime
const isInPastOrStarted = (shift) => {
  try {
    const [sh, sm] = String(shift.startTime).split(":").map(Number);
    const start = new Date(shift.date);
    start.setHours(sh, sm, 0, 0);
    return new Date() >= start;
  } catch {
    return false;
  }
};

/**
 * POST /api/v1/shifts  (employer only)
 */
export const createShift = async (req, res) => {
  try {
    const {
      title,
      date,
      startTime,
      endTime,
      location,
      urgency,
      field,
      payRate,
      description,
      requirements,
      shiftType,
      breakTime,
      detailedInstructions,
      guardIds = [],
      siteId,
      status,
    } = req.body;

    const isDraft = status === "draft";

    // For drafts: all fields optional
    // For published: require all fields
    if (!isDraft) {
      if (
        !title ||
        !date ||
        !startTime ||
        !endTime ||
        !location ||
        payRate == null
      ) {
        return res.status(400).json({
          message:
            "title, date, startTime, endTime, location, and payRate are required",
        });
      }
    }

    const creatorId = req.user?._id || req.user?.id;
    if (!creatorId) {
      return res
        .status(401)
        .json({ message: "Authenticated user id missing from context" });
    }

    // For drafts
    const finalTitle = title || "";
    const finalDate = date ? new Date(date) : new Date();
    const finalStartTime = startTime || "09:00";
    const finalEndTime = endTime || "17:00";
    const finalPayRate = payRate !== undefined ? Number(payRate) : 0;
    const finalShiftType = shiftType || "Day";
    const finalDescription = description || "";
    const finalRequirements = requirements || "";
    const finalBreakTime = breakTime !== undefined ? Number(breakTime) : 0;
    const finalDetailedInstructions = detailedInstructions || "";

    // Validate siteId only for published shifts
    if (!isDraft) {
      if (!siteId || !mongoose.isValidObjectId(siteId)) {
        return res
          .status(400)
          .json({ message: "siteId must be a valid branch ID" });
      }

      const site = await Branch.findOne({
        _id: siteId,
        employerId: creatorId,
        isActive: true,
      }).lean();

      if (!site) {
        return res.status(400).json({
          message: "siteId does not exist or does not belong to you",
        });
      }
    } else {
      // For drafts: if siteId is provided, validate; else ignore
      if (siteId) {
        if (!mongoose.isValidObjectId(siteId)) {
          return res
            .status(400)
            .json({ message: "siteId must be a valid branch ID" });
        }

        const site = await Branch.findOne({
          _id: siteId,
          employerId: creatorId,
          isActive: true,
        }).lean();

        if (!site) {
          return res.status(400).json({
            message: "siteId does not exist or does not belong to you",
          });
        }
      }
    }

    // Location parsing – allow empty for drafts
    let loc = {};

    if (location && typeof location === "object") {
      const { street, suburb, state, postcode, latitude, longitude } = location;

      loc = {
        street: typeof street === "string" ? street.trim() : "",
        suburb: typeof suburb === "string" ? suburb.trim() : "",
        state: typeof state === "string" ? state.trim() : "",
        postcode: postcode ? String(postcode) : "",
        latitude: latitude !== undefined ? Number(latitude) : undefined,
        longitude: longitude !== undefined ? Number(longitude) : undefined,
      };
    }

    if (!isDraft) {
      if (!loc?.street || !loc?.suburb || !loc?.state || !loc?.postcode) {
        return res.status(400).json({
          message: "location must include street, suburb, state, and postcode",
        });
      }

      if (!/^\d{4}$/.test(String(loc.postcode))) {
        return res.status(400).json({
          message: "location.postcode must be a 4-digit string",
        });
      }
    }

    // Guard validation only for published shifts
    const normalizedGuardIds = [...new Set(guardIds)].map((id) => String(id));

    // Status validation
    const allowedStatus = ["draft", "open"];
    let finalStatus = isDraft ? "draft" : "open";

    if (status !== undefined && allowedStatus.includes(status)) {
      finalStatus = status;
    } else if (status && !allowedStatus.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Allowed: draft, open",
      });
    }

    // Create shift
    const shift = await Shift.create({
      title: finalTitle,
      date: finalDate,
      startTime: finalStartTime,
      endTime: finalEndTime,
      createdBy: creatorId,
      location: loc,
      urgency: urgency || "normal",
      field: field || "",
      payRate: finalPayRate,
      description: finalDescription,
      requirements: finalRequirements,
      shiftType: finalShiftType,
      breakTime: finalBreakTime,
      detailedInstructions: finalDetailedInstructions,
      guardIds: normalizedGuardIds,
      siteId: siteId || undefined,
      status: finalStatus,
    });

    await req.audit.log(req.user._id, ACTIONS.SHIFT_CREATED, {
      shiftId: shift._id,
      title: shift.title,
      date: shift.date,
      payRate: shift.payRate,
      status: shift.status,
    });

    return res.status(201).json(shift);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

/**
 * PATCH /api/v1/shifts/:id  (employer/admin)
 * Allows owners or admins to update editable shift fields.
 */
export const updateShift = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const shift = await Shift.findById(id);

    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    const uid = req.user?._id || req.user?.id;
    const isOwner = uid && String(shift.createdBy) === String(uid);
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Not allowed to edit this shift",
      });
    }

    if (shift.status === "completed") {
      return res.status(400).json({
        message: "Completed shifts cannot be edited",
      });
    }

    // Skip past/started check for drafts
    if (shift.status !== "draft" && isInPastOrStarted(shift)) {
      return res.status(400).json({
        message: "Cannot edit a shift that has started or is in the past",
      });
    }

    const updates = {};

    const {
      title,
      date,
      startTime,
      endTime,
      payRate,
      urgency,
      field,
      location,
      description,
      requirements,
      status,
    } = req.body;

    if (title !== undefined) updates.title = title.trim();
    if (date !== undefined) updates.date = new Date(date);
    if (startTime !== undefined) updates.startTime = startTime;
    if (endTime !== undefined) updates.endTime = endTime;
    if (payRate !== undefined) updates.payRate = Number(payRate);
    if (urgency !== undefined) updates.urgency = urgency;
    if (field !== undefined) updates.field = field.trim();
    if (description !== undefined) updates.description = description.trim();
    if (requirements !== undefined) updates.requirements = requirements.trim();

    if (location !== undefined) {
      const loc = { ...shift.location?.toObject?.() };
      const { street, suburb, state, postcode } = location;

      if (street !== undefined) loc.street = street.trim();
      if (suburb !== undefined) loc.suburb = suburb.trim();
      if (state !== undefined) loc.state = state.trim();
      if (postcode !== undefined) loc.postcode = postcode;

      updates.location = loc;
    }

    // Status transition
    if (status !== undefined) {
      const allowedStatuses = ["draft", "open"];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid status. Allowed: draft, open",
        });
      }

      const current = shift.status;

      if (status !== current) {
        const allowedTransitions = {
          draft: ["open"],
          open: ["draft"],
        };

        if (!allowedTransitions[current]?.includes(status)) {
          return res.status(400).json({
            message: `Invalid status transition: ${current} → ${status}`,
          });
        }

        updates.status = status;
      }
    }

    Object.assign(shift, updates);
    await shift.save();

    await req.audit.log(req.user?._id, ACTIONS.SHIFT_UPDATED, {
      shiftId: shift._id,
      updates: Object.keys(updates),
    });

    return res.json({
      message: "Shift updated",
      shift,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

/**
 * GET /api/v1/shifts  (dynamic by role)
 * Guard → available (open/applied) future/today not created by guard
 * Employer → own shifts waiting for approval (status: applied)
 * Admin → all shifts waiting for approval (status: applied)
 * Optional query params: ?q=&urgency=&limit=&page=
 */
export const listAvailableShifts = async (req, res) => {
  try {
    const role = req.user?.role;
    const uid = req.user?._id || req.user?.id;

    if (!role || !uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 20),
    );
    const skip = (page - 1) * limit;

    const { q, urgency } = req.query;
    const withApplicantsOnly = String(req.query.withApplicantsOnly) === "true";

    let query = {};

    if (role === "guard") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      query = {
        status: { $in: ["open", "applied"] },
        createdBy: { $ne: uid },
        date: { $gte: today },
      };
    } else if (role === "employer") {
      // Show ALL my shifts; optionally filter to only those with applicants
      query = { createdBy: uid };

      if (withApplicantsOnly) {
        query["applicants.0"] = { $exists: true };
      }
    } else if (role === "admin") {
      query = {};

      if (withApplicantsOnly) {
        query["applicants.0"] = { $exists: true };
      }
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { field: { $regex: q, $options: "i" } },
      ];
    }

    if (urgency && ["normal", "priority", "last-minute"].includes(urgency)) {
      query.urgency = urgency;
    }

    const findQ = Shift.find(query)
      .sort({
        date: role === "guard" ? 1 : -1,
        startTime: role === "guard" ? 1 : -1,
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email")
      .populate("guardIds", "name email")
      .populate("acceptedBy", "name email");

    if (role === "employer" || role === "admin") {
      findQ.populate("applicants", "name email");
    }

    const [docs, total] = await Promise.all([
      findQ.lean(),
      Shift.countDocuments(query),
    ]);

    const items = docs.map((shift) => {
      const preselectedGuards = Array.isArray(shift.guardIds)
        ? shift.guardIds
        : [];

      const approvedGuards = shift.acceptedBy
        ? Array.isArray(shift.acceptedBy)
          ? shift.acceptedBy
          : [shift.acceptedBy]
        : [];

      const assignedGuards = [...preselectedGuards, ...approvedGuards]
        .filter(Boolean)
        .filter((guard, index, array) => {
          const guardId = String(guard?._id || guard);

          return (
            guardId &&
            array.findIndex((item) => String(item?._id || item) === guardId) ===
              index
          );
        })
        .map((guard) => ({
          _id: guard._id,
          name: guard.name,
          email: guard.email,
        }));

      return {
        ...shift,
        assignedGuards,
        applicantCount: Array.isArray(shift.applicants)
          ? shift.applicants.length
          : 0,
        hasApplicants:
          Array.isArray(shift.applicants) && shift.applicants.length > 0,
      };
    });

    res.json({
      page,
      limit,
      total,
      items,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/**
 * PUT /api/v1/shifts/:id/apply  (guard only)
 */
export const applyForShift = async (req, res) => {
  try {
    const result = await applyForShiftService({
      shiftId: req.params.id,
      userId: req.user?._id || req.user?.id,
      audit: req.audit,
    });

    return res.json(result);
  } catch (e) {
    return res.status(e.statusCode || 500).json({
      message: e.message,
    });
  }
};

/**
 * PUT /api/v1/shifts/:id/approve  (employer/admin)
 * body: { guardId, keepOthers=false }
 */
export const approveShift = async (req, res) => {
  try {
    const result = await approveShiftService({
      shiftId: req.params.id,
      guardId: req.body.guardId,
      keepOthers: req.body.keepOthers ?? false,
      user: req.user,
      audit: req.audit,
    });

    return res.json(result);
  } catch (e) {
    return res.status(e.statusCode || 500).json({
      message: e.message,
    });
  }
};

/**
 * PUT /api/v1/shifts/:id/complete  (employer/admin)
 */
export const completeShift = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const shift = await Shift.findById(id).populate("attendance");

    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    const isOwner = String(shift.createdBy) === String(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (!shift.assignedGuard) {
      return res.status(400).json({ message: "No guard assigned" });
    }

    if (shift.status === "completed") {
      return res.status(400).json({ message: "Already completed" });
    }

    if (!shift.hasCheckedIn) {
      return res.status(400).json({
        message: "Guard has not checked in",
      });
    }

    if (!shift.hasCheckedOut) {
      return res.status(400).json({
        message: "Guard has not checked out",
      });
    }

    shift.status = "completed";
    await shift.save();

    await req.audit.log(req.user._id, ACTIONS.SHIFT_COMPLETED, {
      shiftId: shift._id,
    });

    return res.json({
      message: "Shift completed",
      shift,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

/**
 * GET /api/v1/shifts/myshifts  (?status=past)
 * guard: applied/assigned/past
 * employer: created
 * admin: all
 */
export const getMyShifts = async (req, res) => {
  try {
    const role = req.user.role;
    const uid = req.user._id;
    const pastOnly = req.query.status === "past";

    let query = {};

    if (role === "guard") {
      query = {
        $or: [{ applicants: uid }, { acceptedBy: uid }],
      };
    } else if (role === "employer") {
      query = { createdBy: uid };
    } // admin sees all

    if (pastOnly) {
      query = {
        ...query,
        status: "completed",
      };
    }

    const shifts = await Shift.find(query)
      .sort({ date: -1, createdAt: -1 })
      .populate("createdBy", "name email")
      .populate("acceptedBy", "name email")
      .populate("applicants", "name email");

    return res.json(shifts);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

/**
 * PATCH /api/v1/shifts/:id/rate  (guard/employer)
 * body: { rating: 1..5 }
 */
export const rateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const r = Math.round(Number(rating));

    if (!(r >= 1 && r <= 5)) {
      return res.status(400).json({
        message: "rating must be 1–5",
      });
    }

    const shift = await Shift.findById(id);

    if (!shift) {
      return res.status(404).json({
        message: "Shift not found",
      });
    }

    if (shift.status !== "completed") {
      return res.status(400).json({
        message: "Ratings allowed only after completion",
      });
    }

    if (req.user.role === "guard") {
      const isAssigned = String(shift.assignedGuard) === String(req.user._id);

      if (!isAssigned) {
        return res.status(403).json({
          message: "Only the assigned guard can rate this shift",
        });
      }

      if (shift.ratedByGuard) {
        return res.status(400).json({
          message: "Guard has already submitted a rating",
        });
      }

      shift.guardRating = r;
      shift.ratedByGuard = true;
    } else if (req.user.role === "employer") {
      const isOwner = String(shift.createdBy) === String(req.user._id);

      if (!isOwner) {
        return res.status(403).json({
          message: "Not allowed",
        });
      }

      if (shift.ratedByEmployer) {
        return res.status(400).json({
          message: "Already rated by employer",
        });
      }

      shift.employerRating = r;
      shift.ratedByEmployer = true;
    } else {
      return res.status(403).json({
        message: "Only guard/employer can rate",
      });
    }

    await shift.save();

    await req.audit.log(req.user._id, ACTIONS.RATINGS_SUBMITTED, {
      shiftId: shift._id,
      rating: r,
      role: req.user.role,
    });

    return res.json({
      message: "Rating saved",
      shift,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

/**
 * GET /api/v1/shifts/:id  (employer/admin)
 * Fetch a single shift by ID (for editing drafts)
 */
export const getShiftById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const shift = await Shift.findById(id)
      .populate("createdBy", "name email")
      .populate("applicants", "name email")
      .populate("acceptedBy", "name email")
      .populate("guardIds", "name email");

    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    const uid = req.user?._id || req.user?.id;
    const isOwner = uid && String(shift.createdBy._id) === String(uid);
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Not allowed to view this shift",
      });
    }

    return res.json(shift);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

/**
 * DELETE /api/v1/shifts/:id  (employer/admin)
 */
export const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const shift = await Shift.findById(id);

    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    const uid = req.user?._id || req.user?.id;
    const isOwner = uid && String(shift.createdBy) === String(uid);
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Not allowed to delete this shift",
      });
    }

    await shift.deleteOne();

    await req.audit?.log(req.user?._id, "SHIFT_DELETED", {
      shiftId: shift._id,
      title: shift.title,
    });

    return res.json({
      message: "Shift deleted successfully",
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

/**
 * GET /api/v1/shifts/history
 * Guard → completed shifts assigned to them
 * Employer → posted shifts with status = completed
 */
export const getShiftHistory = async (req, res) => {
  try {
    const role = req.user.role;
    const uid = req.user._id;

    let query = {};

    if (role === "guard") {
      query = {
        assignedGuard: uid,
        status: "completed",
      };
    } else if (role === "employer") {
      query = {
        createdBy: uid,
        status: "completed",
      };
    } else {
      return res.status(403).json({
        message: "Forbidden: only guards and employers can view history",
      });
    }

    const shifts = await Shift.find(query)
      .sort({ date: -1, createdAt: -1 })
      .populate("createdBy", "name email")
      .populate("assignedGuard", "name email");

    return res.json({
      total: shifts.length,
      items: shifts,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};
/**
 * GET /api/v1/shifts/
 */
export const getEmployerFatigueDashboard = async (req, res) => {
  try {
    // 1. Get logged-in employer ID
    const uid = req.user._id;
    // 2. Set the reference date to today
    const referenceDate = new Date();
    // 3. Find employer's assigned/completed shifts for the current week
    const weekStart = getStartOfWeek(referenceDate);
    const weekEnd = getEndOfWeek(referenceDate);
    // 4. Extract acceptedBy from each shift
    const shifts = await Shift.find({
      createdBy: uid,
      acceptedBy: { $ne: null },
      status: { $in: ["assigned", "completed"] },
      date: {
        $gte: weekStart,
        $lte: weekEnd,
      },
    });
    // 5. Remove duplicate guard IDs
    const guardIds = shifts.map((shift) => {
      return shift.acceptedBy.toString();
    });

    const uniqueGuardIds = [...new Set(guardIds)];
    // 6. Call assessCurrentGuardFatigue for each unique guard
    const assessmentPromises = uniqueGuardIds.map((guardId) => {
      return assessCurrentGuardFatigue(guardId, referenceDate);
    });

    const guardAssessments = await Promise.all(assessmentPromises);
    // 7. Build the dashboard response
    const guardResults = uniqueGuardIds.map((guardId, index) => {
      const assessment = guardAssessments[index];

      return {
        guardId: guardId,
        fatigueScore: assessment.fatigueScore,
        warnings: assessment.warnings,
        isFatigued: assessment.isFatigued,
        metrics: {
          shiftsThisWeek: assessment.metrics.shiftsThisWeek,
          hoursThisDay: assessment.metrics.hoursThisDay,
          hoursThisWeek: assessment.metrics.hoursThisWeek,
        },
      };
    });

    const guardsMonitored = uniqueGuardIds.length;

    const fatiguedGuards = guardResults.filter((guard) => {
      return guard.isFatigued === true;
    }).length;

    const totalFatigueScore = guardResults.reduce((total, guard) => {
      return total + guard.fatigueScore;
    }, 0);

    const averageFatigueScore =
      guardsMonitored === 0
        ? 0
        : Math.round(totalFatigueScore / guardsMonitored);

    const dashboardResponse = {
      referenceDate: referenceDate,
      summary: {
        guardsMonitored: guardsMonitored,
        fatiguedGuards: fatiguedGuards,
        averageFatigueScore: averageFatigueScore,
      },
      guards: guardResults,
    };
    // 8. Return 200
    return res.status(200).json({
      dashboard: dashboardResponse,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};
