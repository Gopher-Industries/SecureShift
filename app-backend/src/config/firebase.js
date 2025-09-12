import admin from 'firebase-admin';
import serviceAccount from '../../firebase-service-account.json' assert { type: 'json' };

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
}

const messaging = admin.messaging();

export { messaging };
