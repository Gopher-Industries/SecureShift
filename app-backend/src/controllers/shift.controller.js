import mongoose from 'mongoose';
import Shift from '../models/Shift.js';
import Availability from '../models/Availability.js'; // Import added for filtering
import { ACTIONS } from "../middleware/logger.js";

// Helpers
const HHMM = /^([0-1]\d|2[0-3]):([0-5]\d)$/;
const isValidHHMM = (s) => typeof s === 'string' && HHMM.test(s);

// Helper: Convert HH:MM string to minutes for comparison
const toMinutes = (str) => {
  if (!str) return 0;
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
};

// Returns true if now is at/after the shift start datetime
const isInPastOrStarted = (shift) => {
  try {
    const [sh, sm] = String(shift.startTime).split(':').map(Number);
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
    const { title, date, startTime, endTime, location, urgency, field, payRate } = req.body;

    if (!title || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'title, date, startTime, endTime are required' });
    }

    if (payRate !== undefined && (isNaN(payRate) || Number(payRate) < 0)) {
      return res.status(400).json({ message: 'payRate must be a non-negative number' });
    }

    const creatorId = req.user?._id || req.user?.id;
    if (!creatorId) {
      return res.status(401).json({ message: 'Authenticated user id missing from context' });
    }

    const d = new Date(date);
    if (Number.isNaN(d.getTime())) {
      return res.status(400).json({ message: 'date must be a valid date (YYYY-MM-DD)' });
    }

    if (!isValidHHMM(startTime) || !isValidHHMM(endTime)) {
      return res.status(400).json({ message: 'startTime/endTime must be HH:MM (24h)' });
    }

    let loc;
    if (location && typeof location === 'object') {
      const { street, suburb, state, postcode } = location;
      loc = {
        street: typeof street === 'string' ? street.trim() : undefined,
        suburb: typeof suburb === 'string' ? suburb.trim() : undefined,
        state: typeof state === 'string' ? state.trim() : undefined,
        postcode,
      };
    }

    const shift = await Shift.create({
      title,
      date: d,
      startTime,
      endTime,
      createdBy: creatorId,
      location: loc,
      urgency,
      field,
      payRate,
    });

    if(req.audit) {
        await req.audit.log(req.user._id, ACTIONS.SHIFT_CREATED, {
        shiftId: shift._id,
        title: shift.title,
        date: shift.date,
        payRate: shift.payRate
        });
    }
    
    return res.status(201).json(shift);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

/**
 * GET /api/v1/shifts
 * UPDATED: Filters by Guard Availability
 */
export const listAvailableShifts = async (req, res) => {
  try {
    const role = req.user?.role;
    const uid  = req.user?._id || req.user?.id;
    if (!role || !uid) return res.status(401).json({ message: 'Unauthorized' });

    const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip  = (page - 1) * limit;

    const { q, urgency } = req.query;
    const withApplicantsOnly = String(req.query.withApplicantsOnly) === 'true';

    let query = {};
    let availability = null;

    if (role === 'guard') {
      // 1. Fetch Guard Availability first
      availability = await Availability.findOne({ user: uid });
      
      // Strict filtering: If guard has NO availability set, return empty list immediately
      if (!availability) {
         return res.json({ page, limit, total: 0, items: [] });
      }

      const today = new Date(); 
      today.setHours(0,0,0,0);
      
      query = {
        status: { $in: ['open', 'applied'] },
        createdBy: { $ne: uid },
        date: { $gte: today },
      };
    } else if (role === 'employer') {
      query = { createdBy: uid };
      if (withApplicantsOnly) query['applicants.0'] = { $exists: true };
    } else if (role === 'admin') {
      query = {};
      if (withApplicantsOnly) query['applicants.0'] = { $exists: true };
    } else {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { field: { $regex: q, $options: 'i' } },
      ];
    }
    if (urgency && ['normal','priority','last-minute'].includes(urgency)) {
      query.urgency = urgency;
    }

    // Fetch candidates
    const findQ = Shift.find(query)
      .sort({ date: role === 'guard' ? 1 : -1, startTime: role === 'guard' ? 1 : -1, createdAt: -1 })
      .populate('createdBy', 'name');

    if (role === 'employer' || role === 'admin') {
      findQ.populate('applicants', 'name email');
    }

    let docs = await findQ.lean();

    // --- LOGIC CHANGE: Apply Availability Filter (Guard Only) ---
    if (role === 'guard' && availability) {
        docs = docs.filter(shift => {
            // 1. Check Day of Week (e.g. "Monday")
            const shiftDate = new Date(shift.date);
            const shiftDayName = shiftDate.toLocaleDateString('en-US', { weekday: 'long' });
            
            if (!availability.days.includes(shiftDayName)) {
                return false; // Guard doesn't work this day
            }

            // 2. Check Time Slot (Shift must be fully within a slot)
            const shiftStart = toMinutes(shift.startTime);
            const shiftEnd = toMinutes(shift.endTime);

            const hasValidSlot = availability.timeSlots.some(slot => {
                const [slotStartStr, slotEndStr] = slot.split('-');
                const slotStart = toMinutes(slotStartStr);
                const slotEnd = toMinutes(slotEndStr);
                
                // Shift starts after slot starts AND Shift ends before slot ends
                return shiftStart >= slotStart && shiftEnd <= slotEnd;
            });

            return hasValidSlot;
        });
    }

    // Pagination (manual slice since we filtered in memory)
    const total = docs.length;
    const paginatedItems = docs.slice(skip, skip + limit);

    const items = (role === 'employer' || role === 'admin')
      ? paginatedItems.map(d => ({
          ...d,
          applicantCount: Array.isArray(d.applicants) ? d.applicants.length : 0,
          hasApplicants: Array.isArray(d.applicants) && d.applicants.length > 0,
        }))
      : paginatedItems;

    res.json({ page, limit, total, items });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/**
 * PUT /api/v1/shifts/:id/apply
 */
export const applyForShift = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const userId = req.user?._id || req.user?.id;
    if (!userId || !mongoose.isValidObjectId(String(userId))) {
      return res.status(401).json({ message: 'Authenticated user id missing from context' });
    }

    const shift = await Shift.findById(id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    if (['assigned', 'completed'].includes(shift.status)) {
      return res.status(400).json({ message: `Cannot apply; shift is ${shift.status}` });
    }
    if (isInPastOrStarted(shift)) {
      return res.status(400).json({ message: 'Cannot apply; shift already started or in the past' });
    }
    if (String(shift.createdBy) === String(userId)) {
      return res.status(400).json({ message: 'Employer cannot apply to own shift' });
    }

    shift.applicants = (shift.applicants || []).filter(Boolean);
    if (shift.applicants.some(a => String(a) === String(userId))) {
      return res.status(400).json({ message: 'Already applied' });
    }

    shift.applicants.push(userId);
    if (shift.status === 'open') shift.status = 'applied';

    await shift.save();
    
    if(req.audit) {
        await req.audit.log(req.user._id, ACTIONS.SHIFT_APPLIED, {
        shiftId: shift._id
        });
    }
    return res.json({ message: 'Application submitted', shift });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

/**
 * PUT /api/v1/shifts/:id/approve
 */
export const approveShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { guardId, keepOthers = false } = req.body;
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(guardId))
      return res.status(400).json({ message: 'Invalid id(s)' });

    const shift = await Shift.findById(id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    const isOwner = String(shift.createdBy) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not allowed' });

    if (['assigned', 'completed'].includes(shift.status)) {
      return res.status(400).json({ message: `Already ${shift.status}` });
    }
    if (isInPastOrStarted(shift)) {
      return res.status(400).json({ message: 'Cannot approve; shift already started or in the past' });
    }
    if (!shift.applicants.some(a => String(a) === String(guardId))) {
      return res.status(400).json({ message: 'Guard did not apply for this shift' });
    }

    shift.assignedGuard = guardId; 
    shift.status = 'assigned';
    if (!keepOthers) shift.applicants = [guardId];

    await shift.save();
    
    if(req.audit) {
        await req.audit.log(req.user._id, ACTIONS.SHIFT_APPROVED, {
        shiftId: shift._id,
        approvedGuardId: guardId,
        keepOthers
        });
    }

    return res.json({ message: 'Guard approved', shift });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

/**
 * PATCH /api/v1/shifts/:id/assign  (branch/admin/super)
 */
export const assignGuard = async (req, res) => {
  try {
    const { id } = req.params;
    const { guardId } = req.body;

    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(guardId)) {
      return res.status(400).json({ message: 'Invalid id(s)' });
    }

    const shift = await Shift.findById(id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    if (shift.status === 'completed') {
      return res.status(400).json({ message: 'Cannot assign; shift already completed' });
    }
    if (isInPastOrStarted(shift)) {
      return res.status(400).json({ message: 'Cannot assign; shift already started or in the past' });
    }

    shift.assignedGuard = guardId;
    shift.status = 'assigned';
    shift.applicants = [guardId];

    await shift.save();
    await req.audit.log(req.user._id, ACTIONS.SHIFT_ASSIGNED, {
      shiftId: shift._id,
      assignedGuardId: guardId
    });

    return res.json({ message: 'Guard successfully assigned to shift', shift });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

/**
 * PUT /api/v1/shifts/:id/complete
 */
export const completeShift = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const shift = await Shift.findById(id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    const isOwner = String(shift.createdBy) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not allowed' });

    if (!shift.assignedGuard) return res.status(400).json({ message: 'No guard assigned' });
    if (shift.status === 'completed') return res.status(400).json({ message: 'Already completed' });

    shift.status = 'completed';
    await shift.save();
    
    if(req.audit) {
        await req.audit.log(req.user._id, ACTIONS.SHIFT_COMPLETED, {
        shiftId: shift._id 
        });
    }

    return res.json({ message: 'Shift completed', shift });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

/**
 * GET /api/v1/shifts/myshifts
 */
export const getMyShifts = async (req, res) => {
  try {
    const role = req.user.role;
    const uid  = req.user._id;
    const pastOnly = req.query.status === 'past';

    let query = {};
    if (role === 'guard') {
      query = { $or: [{ applicants: uid }, { acceptedBy: uid }] };
    } else if (role === 'employer') {
      query = { createdBy: uid };
    } 

    if (pastOnly) query = { ...query, status: 'completed' };

    const shifts = await Shift.find(query)
      .sort({ date: -1, createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('acceptedBy', 'name email')
      .populate('applicants', 'name email');

    return res.json(shifts);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

/**
 * PATCH /api/v1/shifts/:id/rate
 */
export const rateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const r = Math.round(Number(rating));
    if (!(r >= 1 && r <= 5)) {
      return res.status(400).json({ message: 'rating must be 1–5' });
    }

    const shift = await Shift.findById(id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });
    if (shift.status !== 'completed') {
      return res.status(400).json({ message: 'Ratings allowed only after completion' });
    }

    if (req.user.role === 'guard') {
      const isAssigned = String(shift.assignedGuard) === String(req.user._id);
      if (!isAssigned) {
        return res.status(403).json({ message: 'Only the assigned guard can rate this shift' });
      }
      if (shift.ratedByGuard) {
        return res.status(400).json({ message: 'Guard has already submitted a rating' });
      }
      shift.guardRating = r;
      shift.ratedByGuard = true;

    } else if (req.user.role === 'employer') {
      const isOwner = String(shift.createdBy) === String(req.user._id);
      if (!isOwner) return res.status(403).json({ message: 'Not allowed' });
      if (shift.ratedByEmployer) return res.status(400).json({ message: 'Already rated by employer' });
      shift.employerRating = r;
      shift.ratedByEmployer = true;

    } else {
      return res.status(403).json({ message: 'Only guard/employer can rate' });
    }

    await shift.save();
    
    if(req.audit) {
        await req.audit.log(req.user._id, ACTIONS.RATINGS_SUBMITTED, {
        shiftId: shift._id,
        rating: r,
        role: req.user.role
        });
    }

    return res.json({ message: 'Rating saved', shift });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

/**
 * GET /api/v1/shifts/history
 */
export const getShiftHistory = async (req, res) => {
  try {
    const role = req.user.role;
    const uid  = req.user._id;

    let query = {};
    if (role === 'guard') {
      query = { assignedGuard: uid, status: 'completed' };
    } else if (role === 'employer') {
      query = { createdBy: uid, status: 'completed' };
    } else {
      return res.status(403).json({ message: 'Forbidden: only guards and employers can view history' });
    }

    const shifts = await Shift.find(query)
      .sort({ date: -1, createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('assignedGuard', 'name email');

    return res.json({ total: shifts.length, items: shifts });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

/**
 * GET /api/v1/shifts/available  (guard only)
 * Optional query params:
 *   - date=YYYY-MM-DD (returns shifts on that calendar day)
 *   - location=string  (matches street/suburb/state/postcode, case-insensitive)
 * Always:
 *   - status: 'open'
 *   - exclude shifts created by the guard
 *   - future or today when no date is supplied
 *   - sort by date ASC, then startTime ASC
 */
export const listOpenShiftsForGuard = async (req, res) => {
  try {
    const uid  = req.user?._id || req.user?.id;
    const role = req.user?.role;
    if (!uid || role !== 'guard') {
      return res.status(403).json({ message: 'Forbidden: guard role required' });
    }

    // Pagination
    const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip  = (page - 1) * limit;

    const { date, location } = req.query;

    // Base query
    const query = {
      status: 'open',
      createdBy: { $ne: uid },
    };

    // Date filter
    if (date) {
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ message: 'date must be YYYY-MM-DD' });
      }
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else {
      // If no specific day requested, only show today or future
      const today = new Date(); today.setHours(0, 0, 0, 0);
      query.date = { $gte: today };
    }

    // Location filter (matches any location sub-field)
    if (location && typeof location === 'string' && location.trim()) {
      const rx = new RegExp(location.trim(), 'i');
      query.$or = [
        { 'location.street':   { $regex: rx } },
        { 'location.suburb':   { $regex: rx } },
        { 'location.state':    { $regex: rx } },
        { 'location.postcode': { $regex: rx } },
        // If you also store a flat text field, include it:
        { locationText:        { $regex: rx } },
      ];
    }

    const [items, total] = await Promise.all([
      Shift.find(query)
        .sort({ date: 1, startTime: 1 }) // ascending
        .skip(skip).limit(limit)
        .populate('createdBy', 'name')
        .lean(),
      Shift.countDocuments(query),
    ]);

    return res.json({ page, limit, total, items });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};
