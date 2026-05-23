import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;

function getAdminApp(): App {
  if (adminApp) return adminApp;
  const existing = getApps().find(a => a.name === 'admin');
  if (existing) { adminApp = existing; return adminApp; }

  adminApp = initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  }, 'admin');

  return adminApp;
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
