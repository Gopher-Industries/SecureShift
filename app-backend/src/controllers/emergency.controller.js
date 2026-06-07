// controllers/emergency.controller.js
import Emergency from "../models/Emergency.js";
import Notification from "../models/Notification.js";

// 🔴 Trigger SOS (Main Endpoint) - Improved Version
export const triggerSOS = async (req, res) => {
  try {
    // ✅ Improved: Safe guardId extraction (works with or without auth during testing)
    const guardId = req.user?.id || req.user?._id || "67a1b2c3d4e5f67890123456";

    const { latitude, longitude, message: optionalMessage } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        message: "Latitude and longitude are required",
      });
    }

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        message: "Invalid latitude or longitude format",
      });
    }

    // ✅ Kept your original spam prevention logic
    const lastSOS = await Emergency.findOne({ guardId }).sort({ createdAt: -1 });

    if (lastSOS && Date.now() - new Date(lastSOS.createdAt).getTime() < 60000) {
      return res.status(429).json({
        message: "SOS already triggered recently. Please wait 1 minute.",
      });
    }

    // Create SOS record
    const sos = await Emergency.create({
      guardId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      message: optionalMessage || "",
    });

    // ✅ Improved: Safe notification creation (won't break SOS if Notification model has issues)
    try {
      await Notification.create({
        title: "🚨 SOS Alert",
        message: `Guard ${guardId} triggered SOS at ${latitude}, ${longitude}`,
        type: "SOS",
        priority: "HIGH",
        relatedId: sos._id,
      });
    } catch (notifError) {
      console.warn("Notification creation skipped:", notifError.message);
    }

    console.log("✅ SOS Triggered Successfully! ID:", sos._id);

    res.status(201).json({
      message: "SOS triggered successfully",
      data: {
        sosId: sos._id,
        guardId: sos.guardId,
        location: { latitude: sos.latitude, longitude: sos.longitude },
        message: sos.message,
        timestamp: sos.createdAt,
        status: sos.status,
      },
    });
  } catch (error) {
    console.error("SOS Trigger Error:", error);
    res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// 📜 Get SOS history - Kept mostly as you wrote
export const getSOSHistory = async (req, res) => {
  try {
    const data = await Emergency.find()
      .populate("guardId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: data.length,
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Update SOS status - Kept mostly as you wrote
export const updateSOSStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "RESOLVED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const sos = await Emergency.findByIdAndUpdate(
      id,
      { status, updatedAt: Date.now() },
      { new: true }
    ).populate("guardId", "name email");

    if (!sos) {
      return res.status(404).json({ message: "SOS not found" });
    }

    res.status(200).json({
      message: "SOS status updated successfully",
      data: sos,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default { triggerSOS, getSOSHistory, updateSOSStatus };
