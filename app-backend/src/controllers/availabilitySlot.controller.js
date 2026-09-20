/**
 * controllers/availabilitySlot.controller.js
 *
 * Thin HTTP layer for calendar-based availability slots (Ticket #20).
 * All business logic lives in services/availabilitySlot.service.js. The guard
 * identity is always taken from the authenticated user (req.user), never from
 * the request body, so guards can only ever act on their own slots.
 *
 * Response shapes match the Guard App contract (confirmed with Krisha Patel):
 * - create : { message, availability: <slot> }
 * - list   : { availability: [<slot>, ...] }
 * - delete : { message }
 * - clear  : { message, deletedCount }
 */

import { ACTIONS } from "../middleware/logger.js";
import * as slotService from "../services/availabilitySlot.service.js";

/**
 * Resolve the authenticated guard id, or send 401 and return null.
 */
const requireGuardId = (req, res) => {
  const guardId = req.user?.id || req.user?._id;
  if (!guardId) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
  return guardId;
};

/**
 * Map a thrown service error to its HTTP response. Errors raised by the service
 * carry a `.status`; anything else is an unexpected 500.
 */
const handleError = (res, err, context) => {
  if (err?.status) {
    return res.status(err.status).json({ message: err.message });
  }
  console.error(`${context}:`, err);
  return res.status(500).json({ message: "Server error", error: err.message });
};

/**
 * POST /api/v1/availability/slots
 */
export const createSlot = async (req, res) => {
  const guardId = requireGuardId(req, res);
  if (!guardId) return;

  try {
    const slot = await slotService.createSlot(guardId, req.body);

    if (req.audit?.log) {
      await req.audit.log(guardId, ACTIONS.AVAILABILITY_SLOT_CREATED, {
        slotId: slot._id,
        date: slot.date,
      });
    }

    return res.status(201).json({
      message: "Availability slot created successfully.",
      availability: slot,
    });
  } catch (err) {
    return handleError(res, err, "AvailabilitySlot CREATE error");
  }
};

/**
 * GET /api/v1/availability/slots/my-slots
 */
export const getMySlots = async (req, res) => {
  const guardId = requireGuardId(req, res);
  if (!guardId) return;

  try {
    const slots = await slotService.listMySlots(guardId, req.query);
    return res.status(200).json({ availability: slots });
  } catch (err) {
    return handleError(res, err, "AvailabilitySlot LIST error");
  }
};

/**
 * DELETE /api/v1/availability/slots/:id
 */
export const deleteSlot = async (req, res) => {
  const guardId = requireGuardId(req, res);
  if (!guardId) return;

  try {
    const slot = await slotService.deleteSlot(guardId, req.params.id);

    if (req.audit?.log) {
      await req.audit.log(guardId, ACTIONS.AVAILABILITY_SLOT_DELETED, {
        slotId: slot._id,
      });
    }

    return res
      .status(200)
      .json({ message: "Availability slot deleted successfully." });
  } catch (err) {
    return handleError(res, err, "AvailabilitySlot DELETE error");
  }
};

/**
 * DELETE /api/v1/availability/slots/clear-all
 */
export const clearAllSlots = async (req, res) => {
  const guardId = requireGuardId(req, res);
  if (!guardId) return;

  try {
    const deletedCount = await slotService.clearAllSlots(guardId);

    if (req.audit?.log) {
      await req.audit.log(guardId, ACTIONS.AVAILABILITY_SLOTS_CLEARED, {
        deletedCount,
      });
    }

    return res.status(200).json({
      message: "All availability slots cleared successfully.",
      deletedCount,
    });
  } catch (err) {
    return handleError(res, err, "AvailabilitySlot CLEAR error");
  }
};
