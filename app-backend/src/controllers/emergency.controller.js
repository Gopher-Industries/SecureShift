import Emergency from "../models/Emergency.js";
import Notification from "../models/Notification.js";

// 🔴 Trigger SOS
export const triggerSOS = async (req, res) => {
  try {
    const guardId = req.user.id;
    const { latitude, longitude, message } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        message: "Latitude and longitude are required",
      });
    }

    // 🚫 Prevent spam (1 min cooldown)
    const lastSOS = await Emergency.findOne({ guardId }).sort({ createdAt: -1 });

    if (lastSOS && Date.now() - new Date(lastSOS.createdAt).getTime() < 60000) {
      return res.status(429).json({
        message: "SOS already triggered recently. Please wait.",
      });
    }

    const sos = await Emergency.create({
      guardId,
      latitude,
      longitude,
      message,
    });

    // 🔔 Notification (basic)
    await Notification.create({
      title: "🚨 SOS Alert",
      message: `Guard ${guardId} triggered SOS`,
      type: "SOS",
      priority: "HIGH",
    });

    res.status(201).json({
      message: "SOS triggered successfully",
      data: sos,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 📜 Get SOS history
export const getSOSHistory = async (req, res) => {
  try {
    const data = await Emergency.find()
      .populate("guardId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: data.length,
      data,
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Update SOS status
export const updateSOSStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "RESOLVED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const sos = await Emergency.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!sos) {
      return res.status(404).json({ message: "SOS not found" });
    }

    res.status(200).json({
      message: "Status updated",
      data: sos,
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};