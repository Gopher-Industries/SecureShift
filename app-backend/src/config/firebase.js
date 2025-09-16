import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initializeFirebase() {
  if (admin.apps.length) {
    return admin.messaging();
  }

  try {
    let credential;
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Use environment variable if available
      credential = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Use ADC if available
      credential = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    } else {
      // Fallback to local file
      const serviceAccountPath = join(__dirname, '../../firebase-service-account.json');
      const serviceAccountJson = await readFile(serviceAccountPath, 'utf8');
      credential = JSON.parse(serviceAccountJson);
    }

    admin.initializeApp({
      credential: admin.credential.cert(credential)
    });

    console.log('Firebase Admin SDK initialized successfully');
    return admin.messaging();
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
}

let messagingInstance;

export async function getMessaging() {
  if (!messagingInstance) {
    messagingInstance = await initializeFirebase();
  }
  return messagingInstance;
}
