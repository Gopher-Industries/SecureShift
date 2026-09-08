import mongoose from "mongoose";
import Branch from "../models/Branch.js";
import Shift from "../models/Shift.js";
import { timeToMinutes, normalizeEnd } from "../utils/timeUtils.js";
import { ACTIONS } from "../middleware/logger.js";

/**
 * @desc    Create a new site (employer only)
 * @route   POST /api/v1/branch/site
 * @access  Employer only
 */
export const createSite = async (req, res) => {
  try {
    const { name, code, location } = req.body;
    const existing = await Branch.findOne({
      code,
      employerId: req.user.id,
      isActive: true,
    });

    if (existing) {
      return res.status(400).json({ message: "Site code already exists" });
    }

    const site = new Branch({
      name,
      code,
      location: {
        line1: location?.line1 || "",
        line2: location?.line2 || "",
        city: location?.city || "",
        state: location?.state || "",
        postcode: location?.postcode || "",
        country: location?.country || "",
      },
      createdBy: req.user.id,
      employerId: req.user.id,
    });

    await site.save();
    await req.audit?.log(req.user.id, ACTIONS.SITE_CREATED, {
      siteId: site._id,
    });

    res.status(201).json(site);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create site", error: err.message });
  }
};

/**
 * @desc    Get all sites for logged-in employer
 * @route   GET /api/v1/branch/site
 * @access  Employer only
 */
export const getAllSites = async (req, res) => {
  try {
    const sites = await Branch.find({
      employerId: req.user.id,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ count: sites.length, sites });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch sites", error: err.message });
  }
};

/**
 * @desc    Get site utilisation report for logged-in employer
 * @route   GET /api/v1/branch/site/utilisation
 * @access  Employer only
 */
export const getSiteUtilisation = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        message: "Both from and to dates are required",
      });
    }

    const fromDate = new Date(`${from}T00:00:00.000Z`);
    const toDate = new Date(`${to}T23:59:59.999Z`);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return res.status(400).json({
        message: "Invalid date range",
      });
    }

    if (fromDate > toDate) {
      return res.status(400).json({
        message: "From date must be before or equal to to date",
      });
    }

    const sites = await Branch.find({
      employerId: req.user.id,
    })
      .select("_id name code isActive")
      .lean();

    const siteIds = sites.map((site) => site._id);

    const shifts = await Shift.find({
      createdBy: req.user.id,
      date: {
        $gte: fromDate,
        $lte: toDate,
      },
      $or: [
        { siteId: { $in: siteIds } },
        { siteId: null },
        { siteId: { $exists: false } },
      ],
    })
      .select(
        "siteId status acceptedBy startTime endTime breakTime spansMidnight",
      )
      .lean();

    const siteMap = new Map(
      sites.map((site) => [
        site._id.toString(),
        {
          siteId: site._id,
          name: site.name,
          code: site.code,
          isActive: site.isActive,
          shiftCounts: {
            draft: 0,
            open: 0,
            applied: 0,
            assigned: 0,
            completed: 0,
          },
          assignedShiftCount: 0,
          unassignedShiftCount: 0,
          scheduledHours: 0,
        },
      ]),
    );

    const unassignedSite = {
      shiftCounts: {
        draft: 0,
        open: 0,
        applied: 0,
        assigned: 0,
        completed: 0,
      },
      assignedShiftCount: 0,
      unassignedShiftCount: 0,
      scheduledHours: 0,
    };

    for (const shift of shifts) {
      const report = shift.siteId ? siteMap.get(shift.siteId.toString()) : null;

      const target = report || unassignedSite;

      if (target.shiftCounts[shift.status] !== undefined) {
        target.shiftCounts[shift.status] += 1;
      }

      if (shift.acceptedBy) {
        target.assignedShiftCount += 1;
      } else {
        target.unassignedShiftCount += 1;
      }

      if (shift.startTime && shift.endTime) {
        const start = timeToMinutes(shift.startTime);
        const end = normalizeEnd(shift.startTime, shift.endTime);
        const breakTime = Number(shift.breakTime || 0);

        const durationMinutes = Math.max(0, end - start - breakTime);

        target.scheduledHours += durationMinutes / 60;
      }
    }

    const reportSites = Array.from(siteMap.values()).map((site) => ({
      ...site,
      scheduledHours: Number(site.scheduledHours.toFixed(2)),
    }));

    unassignedSite.scheduledHours = Number(
      unassignedSite.scheduledHours.toFixed(2),
    );

    res.status(200).json({
      from,
      to,
      sites: reportSites,
      withoutSite: unassignedSite,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to generate site utilisation report",
      error: err.message,
    });
  }
};

/**
 * @desc    Update a site by ID (employer only)
 * @route   PUT /api/v1/branch/site/:id
 * @access  Employer only
 */
export const updateSite = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid site ID" });
    }
    const site = await Branch.findOne({
      _id: id,
      employerId: req.user.id,
      isActive: true,
    });

    if (!site) {
      return res.status(404).json({ message: "Site not found" });
    }

    const { name, code, location } = req.body;
    if (name) site.name = name;
    if (code) site.code = code;
    if (location) {
      site.location = {
        line1: location.line1 || site.location.line1,
        line2: location.line2 || site.location.line2,
        city: location.city || site.location.city,
        state: location.state || site.location.state,
        postcode: location.postcode || site.location.postcode,
        country: location.country || site.location.country,
      };
    }

    await site.save();
    await req.audit?.log(req.user.id, ACTIONS.SITE_UPDATED, {
      siteId: id,
      updatedFields: Object.keys(req.body),
    });

    res.status(200).json(site);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update site", error: err.message });
  }
};

/**
 * @desc    Soft-delete a site by ID (employer only)
 * @route   DELETE /api/v1/branch/site/:id
 * @access  Employer only
 */
export const deleteSite = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid site ID" });
    }
    const site = await Branch.findOne({
      _id: id,
      employerId: req.user.id,
      isActive: true,
    });

    if (!site) {
      return res.status(404).json({ message: "Site not found" });
    }

    site.isActive = false;
    await site.save();
    await req.audit?.log(req.user.id, ACTIONS.SITE_DELETED, {
      siteId: id,
    });

    res.status(200).json({ message: "Site deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete site", error: err.message });
  }
};
