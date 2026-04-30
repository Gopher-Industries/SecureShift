import ShiftRequest from '../models/ShiftRequest.js';
import Shift from '../models/Shift.js';
import User from '../models/User.js';

/**
 * Create a shift request (SWAP or LEAVE)
 * POST /api/v1/shifts/requests
 */
export const createShiftRequest = async (req, res) => {
  try {
    const { type, targetGuardId, originalShiftId, replacementShiftId, leaveStartDate, leaveEndDate, reason } = req.body;
    const requestingGuardId = req.user._id;

    // Validate guard role
    if (req.user.role !== 'guard') {
      return res.status(403).json({ message: 'Only guards can create shift requests' });
    }

    // Validate original shift exists and belongs to the guard
    const originalShift = await Shift.findById(originalShiftId);
    if (!originalShift) {
      return res.status(404).json({ message: 'Original shift not found' });
    }

    // Check if guard is assigned to this shift
    if (originalShift.acceptedBy?.toString() !== requestingGuardId.toString()) {
      return res.status(403).json({ message: 'You are not assigned to this shift' });
    }

    // Check if shift is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (originalShift.date < today) {
      return res.status(400).json({ message: 'Cannot request changes for past shifts' });
    }

    // Check for pending requests on this shift
    const existingRequest = await ShiftRequest.findOne({
      originalShiftId,
      status: 'PENDING',
      requestingGuardId,
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending request for this shift' });
    }

    // SWAP-specific validations
    if (type === 'SWAP') {
      if (!targetGuardId) {
        return res.status(400).json({ message: 'Target guard is required for swap requests' });
      }

      // Validate target guard exists and is a guard
      const targetGuard = await User.findById(targetGuardId);
      if (!targetGuard || targetGuard.role !== 'guard') {
        return res.status(404).json({ message: 'Target guard not found' });
      }

      if (targetGuardId.toString() === requestingGuardId.toString()) {
        return res.status(400).json({ message: 'Cannot swap shift with yourself' });
      }

      // If replacement shift provided, validate it
      if (replacementShiftId) {
        const replacementShift = await Shift.findById(replacementShiftId);
        if (!replacementShift) {
          return res.status(404).json({ message: 'Replacement shift not found' });
        }
        if (replacementShift.acceptedBy?.toString() !== targetGuardId.toString()) {
          return res.status(403).json({ message: 'Replacement shift must belong to the target guard' });
        }
        if (replacementShift.date < today) {
          return res.status(400).json({ message: 'Cannot swap with past shifts' });
        }
      }
    }

    // LEAVE-specific validations
    if (type === 'LEAVE') {
      if (!leaveStartDate || !leaveEndDate) {
        return res.status(400).json({ message: 'Leave start and end dates are required' });
      }
    }

    // Create request
    const shiftRequest = await ShiftRequest.create({
      type,
      requestingGuardId,
      targetGuardId: type === 'SWAP' ? targetGuardId : undefined,
      originalShiftId,
      replacementShiftId: type === 'SWAP' ? replacementShiftId : undefined,
      leaveStartDate: type === 'LEAVE' ? new Date(leaveStartDate) : undefined,
      leaveEndDate: type === 'LEAVE' ? new Date(leaveEndDate) : undefined,
      reason,
    });

    // Populate references for response
    const populatedRequest = await ShiftRequest.findById(shiftRequest._id)
      .populate('requestingGuardId', 'name email')
      .populate('targetGuardId', 'name email')
      .populate('originalShiftId', 'title date startTime endTime')
      .populate('replacementShiftId', 'title date startTime endTime');

    res.status(201).json({
      success: true,
      data: populatedRequest,
      message: `${type === 'SWAP' ? 'Swap' : 'Leave'} request created successfully`,
    });
  } catch (error) {
    console.error('Create shift request error:', error);
    res.status(500).json({ message: error.message || 'Failed to create shift request' });
  }
};

/**
 * Get shift requests (filtered by role)
 * GET /api/v1/shifts/requests
 */
export const getShiftRequests = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Role-based filtering
    if (req.user.role === 'guard') {
      filter.$or = [
        { requestingGuardId: req.user._id },
        { targetGuardId: req.user._id },
      ];
    } else if (req.user.role === 'employer') {
      // Employer sees requests for shifts they created
      const employerShifts = await Shift.find({ createdBy: req.user._id }).distinct('_id');
      filter.originalShiftId = { $in: employerShifts };
    }
    // Admin sees all - no filter

    // Add optional filters
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [requests, total] = await Promise.all([
      ShiftRequest.find(filter)
        .populate('requestingGuardId', 'name email phone')
        .populate('targetGuardId', 'name email')
        .populate('originalShiftId', 'title date startTime endTime location urgency')
        .populate('replacementShiftId', 'title date startTime endTime')
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ShiftRequest.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get shift requests error:', error);
    res.status(500).json({ message: 'Failed to fetch shift requests' });
  }
};

/**
 * Get single shift request by ID
 * GET /api/v1/shifts/requests/:id
 */
export const getShiftRequestById = async (req, res) => {
  try {
    const request = await ShiftRequest.findById(req.params.id)
      .populate('requestingGuardId', 'name email phone')
      .populate('targetGuardId', 'name email')
      .populate('originalShiftId', 'title date startTime endTime location urgency status')
      .populate('replacementShiftId', 'title date startTime endTime')
      .populate('approvedBy', 'name email');

    if (!request) {
      return res.status(404).json({ message: 'Shift request not found' });
    }

    // Authorization: check if user has permission to view
    const isGuard = req.user.role === 'guard' &&
      (request.requestingGuardId._id.toString() === req.user._id.toString() ||
        request.targetGuardId?._id.toString() === req.user._id.toString());

    const isEmployer = req.user.role === 'employer';
    const isAdmin = req.user.role === 'admin';

    if (!isGuard && !isEmployer && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Get shift request error:', error);
    res.status(500).json({ message: 'Failed to fetch shift request' });
  }
};

/**
 * Update shift request status (APPROVE/REJECT)
 * PATCH /api/v1/shifts/requests/:id
 */
export const updateShiftRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, targetResponse } = req.body;

    const request = await ShiftRequest.findById(id)
      .populate('requestingGuardId', 'name email')
      .populate('targetGuardId', 'name email')
      .populate('originalShiftId', 'title date startTime endTime acceptedBy')
      .populate('replacementShiftId', 'title date startTime endTime acceptedBy');

    if (!request) {
      return res.status(404).json({ message: 'Shift request not found' });
    }

    // Authorization and workflow logic
    const isAdmin = req.user.role === 'admin';
    const isEmployer = req.user.role === 'employer';
    const isTargetGuard = request.type === 'SWAP' &&
      request.targetGuardId?._id.toString() === req.user._id.toString();

    // Handle target guard response for SWAP requests
    if (targetResponse && request.type === 'SWAP' && isTargetGuard && request.status === 'PENDING') {
      request.targetResponse = targetResponse;
      request.targetRespondedAt = new Date();

      if (targetResponse === 'DECLINED') {
        request.status = 'REJECTED';
        request.rejectionReason = 'Target guard declined the swap request';
        request.approvedBy = req.user._id;
        request.approvedAt = new Date();
      }

      await request.save();

      return res.json({
        success: true,
        data: request,
        message: `Swap request ${targetResponse === 'ACCEPTED' ? 'accepted' : 'declined'}`,
      });
    }

    // Handle approval/rejection by employer/admin
    if (status && (isAdmin || isEmployer) && request.status === 'PENDING') {
      // Check if this is a SWAP request that needs target acceptance
      if (request.type === 'SWAP' && request.targetResponse !== 'ACCEPTED') {
        return res.status(400).json({
          message: 'Cannot approve swap until target guard accepts the swap'
        });
      }

      if (status === 'APPROVED') {
        // Execute the shift change
        const originalShift = request.originalShiftId;

        if (request.type === 'SWAP') {
          // Swap shifts between two guards
          const targetGuard = request.targetGuardId;

          // Swap assignments
          const originalGuardId = originalShift.acceptedBy;
          originalShift.acceptedBy = targetGuard._id;
          await originalShift.save();

          // If replacement shift exists, swap that too
          if (request.replacementShiftId) {
            const replacementShift = request.replacementShiftId;
            replacementShift.acceptedBy = originalGuardId;
            await replacementShift.save();
          }
        } else if (request.type === 'LEAVE') {
          // Mark shift as open for reassignment
          originalShift.status = 'open';
          originalShift.acceptedBy = null;
          originalShift.applicants = [];
          await originalShift.save();
        }

        request.status = 'APPROVED';
        request.approvedBy = req.user._id;
        request.approvedAt = new Date();
      } else if (status === 'REJECTED') {
        request.status = 'REJECTED';
        request.rejectionReason = rejectionReason || 'No reason provided';
        request.approvedBy = req.user._id;
        request.approvedAt = new Date();
      }

      await request.save();
    } else if (status && !isAdmin && !isEmployer) {
      return res.status(403).json({ message: 'Only employers or admins can approve/reject requests' });
    }

    const updatedRequest = await ShiftRequest.findById(id)
      .populate('requestingGuardId', 'name email')
      .populate('targetGuardId', 'name email')
      .populate('originalShiftId', 'title date startTime endTime')
      .populate('approvedBy', 'name email');

    res.json({
      success: true,
      data: updatedRequest,
      message: `Request ${request.status.toLowerCase()}`,
    });
  } catch (error) {
    console.error('Update shift request error:', error);
    res.status(500).json({ message: error.message || 'Failed to update shift request' });
  }
};

/**
 * Cancel a pending request (guard only)
 * DELETE /api/v1/shifts/requests/:id
 */
export const cancelShiftRequest = async (req, res) => {
  try {
    const request = await ShiftRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Shift request not found' });
    }

    // Only the requesting guard can cancel
    if (request.requestingGuardId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the requesting guard can cancel this request' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: 'Cannot cancel a request that is already approved or rejected' });
    }

    await request.deleteOne();

    res.json({
      success: true,
      message: 'Shift request cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel shift request error:', error);
    res.status(500).json({ message: 'Failed to cancel shift request' });
  }
};