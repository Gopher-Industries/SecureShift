import mongoose from 'mongoose';
import Shift from '../models/Shift.js';
import ShiftAttendance from '../models/ShiftAttendance.js';
import Incident from '../models/Incident.js';
import { ErrorResponse } from '../utils/errorResponse.js';

const GRACE_PERIOD_MS = 5 * 60 * 1000;

function buildShiftStartDate(shiftDate, startTime) {
  const [hour, minute] = String(startTime).split(':').map(Number);
  const d = new Date(shiftDate);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

export async function computeGuardScore(guardId) {
  if (!mongoose.Types.ObjectId.isValid(guardId)) {
    throw new ErrorResponse('Invalid guard ID', 400);
  }

  const guardObjectId = new mongoose.Types.ObjectId(guardId);

  const [assignedShifts, attendanceRecords, incidentCounts] = await Promise.all([
    Shift.find({
      acceptedBy: guardObjectId,
      status: { $in: ['assigned', 'completed'] },
    }).lean(),

    ShiftAttendance.find({
      guardId: guardObjectId,
      checkInTime: { $ne: null },
    })
      .populate('shiftId', 'date startTime')
      .lean(),

    Incident.aggregate([
      { $match: { guardId: guardObjectId, isDeleted: { $ne: true } } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]),
  ]);

  const totalAssigned = assignedShifts.length;

  if (totalAssigned === 0) {
    return { score: null, reason: 'Insufficient shift data' };
  }

  // Component 1 — Punctuality (35 pts)
  const validAttendance = attendanceRecords.filter((r) => r.shiftId?.date && r.shiftId?.startTime);
  const totalCheckins = validAttendance.length;
  const onTimeCheckins = validAttendance.filter((r) => {
    const cutoff = buildShiftStartDate(r.shiftId.date, r.shiftId.startTime).getTime() + GRACE_PERIOD_MS;
    return new Date(r.checkInTime).getTime() <= cutoff;
  }).length;
  const punctualityScore = totalCheckins > 0 ? (onTimeCheckins / totalCheckins) * 35 : 0;

  // Component 2 — Shift Completion (35 pts)
  const completedShifts = assignedShifts.filter((s) => s.status === 'completed').length;
  const completionScore = (completedShifts / totalAssigned) * 35;

  // Component 3 — Incident Score (30 pts)
  const severityCounts = incidentCounts.reduce((acc, { _id, count }) => {
    acc[_id] = count;
    return acc;
  }, {});
  const highCount = severityCounts.high ?? 0;
  const mediumCount = severityCounts.medium ?? 0;
  const lowCount = severityCounts.low ?? 0;
  const deduction = ((5 * highCount + 2 * mediumCount + 1 * lowCount) / Math.max(totalAssigned, 1)) * 10;
  const incidentScore = Math.max(0, 30 - deduction);

  const score = Math.round(
    Math.max(0, punctualityScore) + Math.max(0, completionScore) + incidentScore
  );

  return {
    guardId,
    score,
    breakdown: {
      punctuality: {
        score: Math.round(Math.max(0, punctualityScore) * 100) / 100,
        maxPoints: 35,
        onTimeCheckins,
        totalCheckins,
      },
      shiftCompletion: {
        score: Math.round(Math.max(0, completionScore) * 100) / 100,
        maxPoints: 35,
        completedShifts,
        totalAssignedShifts: totalAssigned,
      },
      incidents: {
        score: Math.round(incidentScore * 100) / 100,
        maxPoints: 30,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
        deduction: Math.round(deduction * 100) / 100,
      },
    },
  };
}
