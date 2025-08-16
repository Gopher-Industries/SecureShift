import Shift from '../models/Shift.js';

export async function createShift(user, shiftData) {
  try {
    const shift = new Shift({
      ...shiftData,
      createdBy: user._id,
    });
    const savedShift = await shift.save();
    return { success: true, data: savedShift };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function applyForShift(user, shiftId) {
  try {
    const shift = await Shift.findById(shiftId);
    if (!shift) return { success: false, error: 'Shift not found' };
    if (!['open', 'applied'].includes(shift.status))
      return { success: false, error: 'Shift is not open for applications' };
    if (shift.applicants.some((id) => id.equals(user._id)))
      return { success: false, error: 'You have already applied' };

    shift.applicants.push(user._id);
    if (shift.status === 'open') shift.status = 'applied';
    await shift.save();
    return { success: true, data: shift };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function approveShift(user, shiftId, guardId) {
  try {
    const shift = await Shift.findById(shiftId);
    if (!shift) return { success: false, error: 'Shift not found' };
    if (!shift.createdBy.equals(user._id) && user.role !== 'admin')
      return { success: false, error: 'Not authorized to approve shift' };
    if (!shift.applicants.some((id) => id.equals(guardId)))
      return { success: false, error: 'Guard did not apply for this shift' };

    shift.assignedGuard = guardId;
    shift.status = 'assigned';
    shift.applicants = [guardId];
    await shift.save();
    return { success: true, data: shift };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function completeShift(user, shiftId) {
  try {
    const shift = await Shift.findById(shiftId);
    if (!shift) return { success: false, error: 'Shift not found' };
    if (!shift.createdBy.equals(user._id) && user.role !== 'admin')
      return { success: false, error: 'Not authorized to complete shift' };

    shift.status = 'completed';
    await shift.save();
    return { success: true, data: shift };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getMyShifts(user, statusFilter) {
  try {
    let filter = {};

    if (user.role === 'employer') {
      filter.createdBy = user._id;
    } else if (user.role === 'guard') {
      filter.$or = [{ applicants: user._id }, { assignedGuard: user._id }];
    }
    // Admin sees all shifts: filter = {}

    if (statusFilter === 'past') {
      filter.status = 'completed';
    }

    const shifts = await Shift.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignedGuard', 'name email')
      .populate('applicants', 'name email');

    return { success: true, data: shifts };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function rateShift(user, shiftId, { guardRating, employerRating }) {
  try {
    const shift = await Shift.findById(shiftId);
    if (!shift) return { success: false, error: 'Shift not found' };
    if (shift.status !== 'completed')
      return { success: false, error: 'Only completed shifts can be rated' };

    if (user.role === 'guard') {
      if (shift.ratedByGuard)
        return { success: false, error: 'You have already rated this shift' };
      if (typeof guardRating !== 'number')
        return { success: false, error: 'Guard rating is required' };

      shift.guardRating = guardRating;
      shift.ratedByGuard = true;
    } else if (user.role === 'employer') {
      if (shift.ratedByEmployer)
        return { success: false, error: 'You have already rated this shift' };
      if (typeof employerRating !== 'number')
        return { success: false, error: 'Employer rating is required' };

      shift.employerRating = employerRating;
      shift.ratedByEmployer = true;
    } else {
      return { success: false, error: 'Only guards or employers can rate' };
    }

    await shift.save();
    return { success: true, data: shift };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
