import Equipment from '../models/Equipment.js';
import mongoose from 'mongoose';
import { ACTIONS } from '../middleware/logger.js';

/**
 * POST /api/v1/equipment
 * Create new equipment item
 */
export const createEquipment = async (req, res) => {
  try {
    const requester = req.user;

    if (!requester || !requester.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, assignedTo, status } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Equipment name is required.' });
    }

    if (assignedTo && !mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({ message: 'Invalid assignedTo user id.' });
    }

    if (status && !['ACTIVE', 'DAMAGED', 'LOST'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Use ACTIVE, DAMAGED, or LOST.',
      });
    }

    const equipment = await Equipment.create({
      name,
      assignedTo: assignedTo || null,
      status: status || 'ACTIVE',
    });

    await req.audit.log(req.user.id, ACTIONS.EQUIPMENT_CREATED, {
      equipmentId: equipment._id,
      name: equipment.name,
      assignedTo: equipment.assignedTo,
      status: equipment.status,
    });

    return res.status(201).json({
      message: 'Equipment created successfully.',
      equipment,
    });
  } catch (err) {
    console.error('Equipment CREATE error:', err);
    return res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
};

/**
 * PATCH /api/v1/equipment/:id/assign
 * Assign equipment to a guard/user
 */
export const assignEquipment = async (req, res) => {
  try {
    const requester = req.user;
    const { id } = req.params;
    const { assignedTo } = req.body;

    if (!requester || !requester.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid equipment id.' });
    }

    if (!assignedTo || !mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({ message: 'Valid assignedTo user id is required.' });
    }

    const equipment = await Equipment.findById(id);

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found.' });
    }

    equipment.assignedTo = assignedTo;
    equipment.status = 'ACTIVE';

    await equipment.save();

    await equipment.populate('assignedTo', 'name email role');

    await req.audit.log(req.user.id, ACTIONS.EQUIPMENT_ASSIGNED, {
      equipmentId: equipment._id,
      assignedTo,
    });

    return res.status(200).json({
      message: 'Equipment assigned successfully.',
      equipment,
    });
  } catch (err) {
    console.error('Equipment ASSIGN error:', err);
    return res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
};

/**
 * PATCH /api/v1/equipment/:id/report
 * Report equipment as ACTIVE, DAMAGED, or LOST
 */
export const reportEquipment = async (req, res) => {
  try {
    const requester = req.user;
    const { id } = req.params;
    const { status } = req.body;

    if (!requester || !requester.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid equipment id.' });
    }

    if (!status || !['ACTIVE', 'DAMAGED', 'LOST'].includes(status)) {
      return res.status(400).json({
        message: 'Valid status is required. Use ACTIVE, DAMAGED, or LOST.',
      });
    }

    const equipment = await Equipment.findById(id);

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found.' });
    }

    equipment.status = status;
    await equipment.save();

    await equipment.populate('assignedTo', 'name email role');

    await req.audit.log(req.user.id, ACTIONS.EQUIPMENT_REPORTED, {
      equipmentId: equipment._id,
      status,
    });

    return res.status(200).json({
      message: 'Equipment status updated successfully.',
      equipment,
    });
  } catch (err) {
    console.error('Equipment REPORT error:', err);
    return res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }

};
/**
 * GET /api/v1/equipment/guard/:guardId
 * Get all equipment assigned to a specific guard
 */
export const getEquipmentByGuard = async (req, res) => {
  try {
    const requester = req.user;
    const { guardId } = req.params;

    if (!requester || !requester.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!mongoose.Types.ObjectId.isValid(guardId)) {
      return res.status(400).json({
        message: 'Invalid guard id.',
      });
    }

    const equipment = await Equipment.find({
      assignedTo: guardId,
    }).populate('assignedTo', 'name email role');

    return res.status(200).json({
      count: equipment.length,
      equipment,
    });
  } catch (err) {
    console.error('Get Equipment By Guard error:', err);

    return res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
};