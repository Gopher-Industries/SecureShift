import mongoose from 'mongoose';
import Shift from '../models/Shift.js';

/**
 * POST /api/v1/shifts  (employer only)
 */
export const createShift = async (req, res) => {
  try {
    const { title, date, startTime, endTime, location, urgency, field } = req.body;
    if (!title || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'title, date, startTime, endTime are required' });
    }
    const shift = await Shift.create({
      title,
      date: new Date(date),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      createdBy: req.user._id,
      // optional info:
      location, urgency, field
    });
    res.status(201).json(shift);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/**
 * PUT /api/v1/shifts/:id/apply  (guard only)
 */
export const applyForShift = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const shift = await Shift.findById(id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });
    if (['assigned','completed'].includes(shift.status)) {
      return res.status(400).json({ message: `Cannot apply; shift is ${shift.status}` });
    }
    if (String(shift.createdBy) === String(req.user._id)) {
      return res.status(400).json({ message: 'Employer cannot apply to own shift' });
    }
    if (shift.applicants.some(a => String(a) === String(req.user._id))) {
      return res.status(400).json({ message: 'Already applied' });
    }

    shift.applicants.push(req.user._id);
    if (shift.status === 'open') shift.status = 'applied';
    await shift.save();
    res.json({ message: 'Application submitted', shift });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/**
 * PUT /api/v1/shifts/:id/approve  (employer/admin)
 * body: { guardId, keepOthers=false }
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

    if (['assigned','completed'].includes(shift.status)) {
      return res.status(400).json({ message: `Already ${shift.status}` });
    }

    if (!shift.applicants.some(a => String(a) === String(guardId))) {
      return res.status(400).json({ message: 'Guard did not apply for this shift' });
    }

    shift.assignedGuard = guardId;
    shift.status = 'assigned';
    if (!keepOthers) shift.applicants = [guardId];

    await shift.save();
    res.json({ message: 'Guard approved', shift });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/**
 * PUT /api/v1/shifts/:id/complete  (employer/admin)
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
    res.json({ message: 'Shift completed', shift });
  } catch (e) { res.status(500).json({ message: e.message }); }
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
    const uid  = req.user._id;
    const pastOnly = req.query.status === 'past';

    let query = {};
    if (role === 'guard') {
      query = { $or: [{ applicants: uid }, { assignedGuard: uid }] };
    } else if (role === 'employer') {
      query = { createdBy: uid };
    } // admin sees all

    if (pastOnly) query = { ...query, status: 'completed' };

    const shifts = await Shift.find(query)
      .sort({ date: -1, createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('assignedGuard', 'name email')
      .populate('applicants', 'name email');

    res.json(shifts);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/**
 * PATCH /api/v1/shifts/:id/rate  (guard/employer)
 * body: { rating: 1..5 }
 */
export const rateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
    if (!(Number(rating) >= 1 && Number(rating) <= 5))
      return res.status(400).json({ message: 'rating must be 1–5' });

    const shift = await Shift.findById(id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });
    if (shift.status !== 'completed')
      return res.status(400).json({ message: 'Ratings allowed only after completion' });

    if (req.user.role === 'guard') {
      const isGuard =
        String(shift.assignedGuard) === String(req.user._id) ||
        shift.applicants.some(a => String(a) === String(req.user._id));
      if (!isGuard) return res.status(403).json({ message: 'Not allowed' });
      if (shift.ratedByGuard) return res.status(400).json({ message: 'Already rated by guard' });
      shift.guardRating = rating;
      shift.ratedByGuard = true;
    } else if (req.user.role === 'employer') {
      const isOwner = String(shift.createdBy) === String(req.user._id);
      if (!isOwner) return res.status(403).json({ message: 'Not allowed' });
      if (shift.ratedByEmployer) return res.status(400).json({ message: 'Already rated by employer' });
      shift.employerRating = rating;
      shift.ratedByEmployer = true;
    } else {
      return res.status(403).json({ message: 'Only guard/employer can rate' });
    }

    await shift.save();
    res.json({ message: 'Rating saved', shift });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
