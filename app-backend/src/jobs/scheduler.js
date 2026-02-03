import cron from 'node-cron';
import { sendReminderNotifications, sendExpiryAlerts } from '../services/fcmService.js';

export const startScheduledJobs = () => {
  cron.schedule('*/30 * * * *', async () => {
    console.log('[CRON] Running shift reminder notification job');
    await sendReminderNotifications();
  });

  cron.schedule('0 10 * * *', async () => {
    console.log('[CRON] Running expiry alert job');
    await sendExpiryAlerts();
  });
};
