import admin from 'firebase-admin';
import { createRequire } from 'module';

let firebaseApp;

if (!admin.apps.length) {
  let credential;

  // Prefer env variable (for production on Render/Vercel)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      credential = admin.credential.cert(serviceAccount);
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', e.message);
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT environment variable');
    }
  } else {
    // Fallback: local JSON file (development only)
    try {
      const require = createRequire(import.meta.url);
      const serviceAccount = require('./firebase-service-account.json');
      credential = admin.credential.cert(serviceAccount);
    } catch (e) {
      console.error('firebase-service-account.json not found and FIREBASE_SERVICE_ACCOUNT env var not set.');
      throw new Error('Firebase credentials not configured');
    }
  }

  firebaseApp = admin.initializeApp({
    credential,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'gym-management-2c5da.firebasestorage.app',
  });
} else {
  firebaseApp = admin.apps[0];
}

const bucket = admin.storage().bucket();

export { bucket };
export default admin;
