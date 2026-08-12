"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missingConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingConfig.length) {
  console.warn(
    `[CampusDesk] Missing Firebase configuration: ${missingConfig.join(", ")}. ` +
      "Copy .env.example to .env.local and add the Firebase Web App values."
  );
}

// Fallback values let `next build` finish before deployment variables are added.
// Firebase requests will still fail with a clear configuration error at runtime.
const app =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        apiKey: firebaseConfig.apiKey || "missing-firebase-api-key",
        authDomain: firebaseConfig.authDomain || "missing.firebaseapp.com",
        projectId: firebaseConfig.projectId || "missing-firebase-project-id",
        storageBucket: firebaseConfig.storageBucket || "missing.firebasestorage.app",
        messagingSenderId: firebaseConfig.messagingSenderId || "000000000000",
        appId: firebaseConfig.appId || "1:000000000000:web:missing",
      });

export const firebaseAuth = getAuth(app);
