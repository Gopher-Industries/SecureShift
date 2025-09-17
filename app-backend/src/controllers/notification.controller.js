import { sendNotification } from '../services/notification.service.js';

export async function send(req, res) {
  try {
    const result = await sendNotification(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
