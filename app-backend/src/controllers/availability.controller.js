import { ACTIONS } from "../middleware/logger.js";

/**
 * controllers/availability.controller.js
 *
 * Exports:
 * - createOrUpdateAvailability(req, res)
 * - getAvailability(req, res)
 *
 * Notes:
 * - Users can only create/update/fetch their own availability unless req.user.role === 'Admin'
 * - POST does upsert (create or update) so each user always has at most one availability document
 */

import Availability from '../models/Availability.js';
import mongoose from 'mongoose';

/** Utility: validate time slot format */
const timeSlotRegex = /^\d{2}:\d{2}-\d{2}:\d{2}$/;

/** POST /api/availability
 * Body expected:
 * {
 *   user?: "<userId>" (optional - ignored unless admin),
 *   days: ["Monday", "Tuesday"],
 *   timeSlots: ["09:00-12:00", "14:00-18:00"]
 * }
 */
export const createOrUpdateAvailability = async (req, res) => {
  try {
    const requester = req.user; // set by auth middleware (id, role)
    if (!requester || !requester.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const bodyUserId = req.body.user; // optional
    let targetUserId = requester.id;

    // Admins may set availability for other users
    if (bodyUserId) {
      if (!mongoose.Types.ObjectId.isValid(bodyUserId)) {
        return res.status(400).json({ message: 'Invalid user id provided.' });
      }
      if (requester.role === 'admin') {
        targetUserId = bodyUserId;
      } else if (bodyUserId !== requester.id) {
        return res.status(403).json({
          message: 'Forbidden: you can only set your own availability.',
        });
      } else {
        targetUserId = bodyUserId;
      }
    }

    const { days, timeSlots } = req.body;

    // Basic validations
    if (!Array.isArray(days) || days.length === 0) {
      return res.status(400).json({ message: 'Please select at least one day.' });
    }

    if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res
        .status(400)
        .json({ message: 'Please provide at least one time slot in format HH:MM-HH:MM.' });
    }

    // Validate time slot format and logical order (start < end)
    for (const ts of timeSlots) {
      if (typeof ts !== 'string' || !timeSlotRegex.test(ts)) {
        return res.status(400).json({
          message: `Invalid time slot format: "${ts}". Use "HH:MM-HH:MM".`,
        });
      }
      const [start, end] = ts.split('-');
      const toMinutes = (hhmm) => {
        const [hh, mm] = hhmm.split(':').map(Number);
        return hh * 60 + mm;
      };
      if (toMinutes(start) >= toMinutes(end)) {
        return res.status(400).json({
          message: `Invalid time slot "${ts}": start time must be before end time.`,
        });
      }
    }

    // Perform upsert: if availability exists for this user -> update, otherwise create
    const filter = { user: targetUserId };
    const update = {
      user: targetUserId,
      days,
      timeSlots,
      updatedAt: Date.now(),
    };

    const options = {
      new: true, // return the updated document
      upsert: true, // create if not exists
      setDefaultsOnInsert: true,
    };

    const availability = await Availability.findOneAndUpdate(filter, update, options).populate(
      'user',
      'name email role' // optional fields if User has these
    );
    await req.audit.log(req.user.id, ACTIONS.AVAILABILITY_UPDATED, {
      availabilityId: availability._id,
      targetUserId: targetUserId,
      days,
      timeSlots
    });
    return res.status(200).json({
      message: 'Availability saved.',
      availability,
    });
  } catch (err) {
    console.error('Availability POST error:', err);
    // Handle duplicate key error specifically (shouldn't occur because of upsert, but just in case)
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: 'An availability entry for this user already exists.' });
    }
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/** GET /api/availability/:userId
 * - requester can fetch their own availability
 * - Admin can fetch any user's availability
 */
export const getAvailability = async (req, res) => {
  try {
    const requester = req.user;
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user id in params.' });
    }

    if (!requester || !requester.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (requester.role !== 'admin' && requester.id !== userId) {
      return res.status(403).json({ message: 'Forbidden: cannot access other user availability.' });
    }

    const availability = await Availability.findOne({ user: userId }).populate(
      'user',
      'name email role'
    );

    if (!availability) {
      return res.status(404).json({ message: "Availability not found for this user." });
    }

    return res.status(200).json({ availability });
  } catch (err) {
    console.error('Availability GET error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
