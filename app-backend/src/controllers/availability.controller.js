import mongoose from 'mongoose';
import Availability from '../models/Availability.js';
import { ACTIONS } from "../middleware/logger.js";

/**
 * controllers/availability.controller.js
 * * Implements CRUD for Guard Availability.
 */

// Helper: validate time slot format
const timeSlotRegex = /^\d{2}:\d{2}-\d{2}:\d{2}$/;

/**
 * POST /api/availability
 * Create or Update (Upsert) Availability
 */
export const createOrUpdateAvailability = async (req, res) => {
  try {
    const requester = req.user; 
    if (!requester || !requester.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const bodyUserId = req.body.user; 
    let targetUserId = requester.id;

    // Admin override check
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

    // Validations
    if (!Array.isArray(days) || days.length === 0) {
      return res.status(400).json({ message: 'Please select at least one day.' });
    }

    if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res
        .status(400)
        .json({ message: 'Please provide at least one time slot in format HH:MM-HH:MM.' });
    }

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

    // Upsert Logic
    const filter = { user: targetUserId };
    const update = {
      user: targetUserId,
      days,
      timeSlots,
      updatedAt: Date.now(),
    };

    const options = { new: true, upsert: true, setDefaultsOnInsert: true };

    const availability = await Availability.findOneAndUpdate(filter, update, options).populate(
      'user',
      'name email role'
    );
    
    // Audit Log
    if(req.audit) {
        await req.audit.log(req.user.id, ACTIONS.AVAILABILITY_UPDATED, {
        availabilityId: availability._id,
        targetUserId: targetUserId,
        days,
        timeSlots
        });
    }
    
    return res.status(200).json({
      message: 'Availability saved.',
      availability,
    });
  } catch (err) {
    console.error('Availability POST error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * GET /api/availability/:userId
 * Read Availability
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

/**
 * DELETE /api/availability/:userId
 * Delete Availability
 */
export const deleteAvailability = async (req, res) => {
  try {
    const requester = req.user;
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user id.' });
    }

    // Only Admin or the user themselves can delete
    if (requester.role !== 'admin' && requester.id !== userId) {
      return res.status(403).json({ message: 'Forbidden: cannot delete other user availability.' });
    }

    const deleted = await Availability.findOneAndDelete({ user: userId });

    if (!deleted) {
      return res.status(404).json({ message: 'No availability found to delete.' });
    }

    if(req.audit) {
        await req.audit.log(requester.id, 'AVAILABILITY_DELETED', {
        targetUserId: userId
        });
    }

    return res.status(200).json({ message: 'Availability deleted successfully.' });
  } catch (err) {
    console.error('Availability DELETE error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};