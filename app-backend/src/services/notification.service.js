// src/services/notification.service.js
import Guard from '../models/Guard.js';
import Notification from '../models/Notification.js';

export async function sendNotification({ guardIds = [], tokens = [], title, body, data, type }) {
  let targetTokens = [...tokens];

  if (guardIds.length) {
    const guards = await Guard.find({ _id: { $in: guardIds } });
    guards.forEach(g => targetTokens.push(...g.deviceTokens));
  }

  if (!targetTokens.length) {
    return { success: false, message: 'No tokens found' };
  }

  // Mock or Firebase push
  if (process.env.USE_MOCK_NOTIFICATIONS === 'true') {
    console.log('📩 Mock Notification:', { title, body, data, targetTokens });
  } else {
    // TODO: integrate Firebase FCM here
  }

  // Save audit log
  await Notification.create({ guardId: guardIds[0], title, body, data, type });

  return { success: true, count: targetTokens.length };
}
