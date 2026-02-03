import FcmToken from '../models/FcmToken.js';

export const saveFcmToken = async (req, res) => {
  const { token } = req.body;
  const userId = req.user._id;

  if (!token) {
    return res.status(400).json({ message: 'FCM token is required' });
  }

  try {
    await FcmToken.findOneAndUpdate(
      { userId },
      { token, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return res.status(200).json({ message: 'FCM token saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
