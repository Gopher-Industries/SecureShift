import Notification from '../models/Notification.js';
import User from '../models/User.js';

class NotificationService {
  /**
   * Send SOS Alert (CRITICAL priority)
   */
  static async sendSOSAlert(guardId, location, message, incidentData = {}) {
    // Notify all admins
    const admins = await User.find({ role: 'admin' }).select('_id');

    const notificationData = {
      type: 'SOS_ALERT',
      category: 'SOS',
      priority: 'CRITICAL',
      title: ' SOS ALERT! ',
      message: `URGENT: ${message || 'Guard requires immediate assistance'}`,
      metadata: {
        location,
        senderId: guardId,
        incidentId: incidentData.incidentId,
        actionRequired: true,
        actionUrl: `/admin/sos/${incidentData.incidentId || guardId}`,
        coordinates: location?.coordinates
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    const notifications = [];
    for (const admin of admins) {
      notifications.push({
        ...notificationData,
        userId: admin._id
      });
    }

    return await Notification.insertMany(notifications);
  }

  /**
   * Send Incident Report Notification
   */
  static async sendIncidentAlert(employerId, incidentData) {
    return await Notification.createNotification({
      userId: employerId,
      type: 'INCIDENT_REPORTED',
      category: 'INCIDENT',
      priority: 'HIGH',
      title: `Incident Report: ${incidentData.title}`,
      message: `A ${incidentData.severity} severity incident has been reported for shift ${incidentData.shiftTitle}`,
      metadata: {
        incidentId: incidentData._id,
        shiftId: incidentData.shiftId,
        severity: incidentData.severity,
        actionRequired: true,
        actionUrl: `/incidents/${incidentData._id}`
      }
    });
  }

  /**
   * Send Shift Swap Request Notification
   */
  static async sendShiftSwapRequest(targetGuardId, requesterName, shiftDetails) {
    return await Notification.createNotification({
      userId: targetGuardId,
      type: 'SHIFT_SWAP_REQUEST',
      category: 'SHIFT',
      priority: 'HIGH',
      title: 'Shift Swap Request',
      message: `${requesterName} wants to swap shift: ${shiftDetails.title} on ${shiftDetails.date}`,
      metadata: {
        shiftId: shiftDetails._id,
        actionRequired: true,
        actionUrl: `/shifts/requests`
      }
    });
  }

  /**
   * Send Shift Reminder (24 hours before)
   */
  static async sendShiftReminder(guardId, shiftDetails) {
    return await Notification.createNotification({
      userId: guardId,
      type: 'SHIFT_REMINDER',
      category: 'SHIFT',
      priority: 'MEDIUM',
      title: 'Upcoming Shift Reminder',
      message: `Reminder: ${shiftDetails.title} starts tomorrow at ${shiftDetails.startTime}`,
      metadata: {
        shiftId: shiftDetails._id,
        actionUrl: `/shifts/${shiftDetails._id}`
      },
      expiresAt: new Date(shiftDetails.date)
    });
  }

  /**
   * Send Document Expiring Warning
   */
  static async sendDocumentExpiryWarning(guardId, documentName, expiryDate) {
    const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    const priority = daysUntilExpiry <= 7 ? 'HIGH' : daysUntilExpiry <= 30 ? 'MEDIUM' : 'LOW';

    return await Notification.createNotification({
      userId: guardId,
      type: 'DOCUMENT_EXPIRING',
      category: 'DOCUMENT',
      priority,
      title: `Document Expiring Soon`,
      message: `${documentName} will expire in ${daysUntilExpiry} days. Please upload a new copy.`,
      metadata: {
        documentName,
        expiryDate,
        actionRequired: true,
        actionUrl: `/documents`
      }
    });
  }

  /**
   * Send System Alert (Broadcast)
   */
  static async sendSystemAlert(roles, title, message, actionUrl = null) {
    const users = await User.find({ role: { $in: roles } }).select('_id');

    return await Notification.broadcast({
      type: 'SYSTEM_ALERT',
      category: 'SYSTEM',
      priority: 'HIGH',
      title,
      message,
      metadata: { actionUrl, actionRequired: !!actionUrl }
    }, users.map(u => u._id));
  }
}

export default NotificationService;