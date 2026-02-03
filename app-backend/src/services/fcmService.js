import admin from 'firebase-admin';
import FcmToken from '../models/FcmToken.js';
import Shift from '../models/Shift.js'; // adjust as per your shift model

export const sendReminderNotifications = async () => {
  const upcoming = await Shift.find({
    date: { $gte: new Date(), $lte: new Date(Date.now() + 3600000) } // next 1 hr
  }).populate('assignedGuards');

  for (const shift of upcoming) {
    for (const guard of shift.assignedGuards) {
      const tokenRecord = await FcmToken.findOne({ userId: guard._id });
      if (!tokenRecord) continue;

      await admin.messaging().send({
        token: tokenRecord.token,
        notification: {
          title: 'Upcoming Shift Reminder',
          body: `Your shift "${shift.title}" starts soon at ${shift.startTime}`
        }
      });
    }
  }
};

export const sendExpiryAlerts = async () => {
  const soonExpiring = await User.find({
    'documents.expiryDate': {
      $gte: new Date(),
      $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // next 7 days
    }
  });

  for (const user of soonExpiring) {
    const tokenRecord = await FcmToken.findOne({ userId: user._id });
    if (!tokenRecord) continue;

    await admin.messaging().send({
      token: tokenRecord.token,
      notification: {
        title: 'Document Expiry Alert',
        body: `One or more of your documents are expiring soon.`
      }
    });
  }
};
