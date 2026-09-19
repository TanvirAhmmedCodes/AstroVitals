/**
 * AstroVitals Neuro-Shield — Firebase Web Client SDK.
 *
 * Provides real-time synchronization with Cloud Firestore and
 * optional Firebase Analytics in production environments.
 * Operates strictly as a real-time enhancement layer alongside JWT auth.
 *
 * Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps Challenge 2026
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app = null;
let auth = null;
let db = null;
let analytics = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Initialize Analytics only in production if supported
    if (import.meta.env.PROD && typeof window !== "undefined") {
      isAnalyticsSupported().then((supported) => {
        if (supported) {
          analytics = getAnalytics(app);
        }
      }).catch((err) => {
        console.warn("[Firebase] Analytics initialization skipped:", err?.message || err);
      });
    }

    console.info("[Firebase] Real-time client initialized successfully (Project: " + firebaseConfig.projectId + ")");
  } else {
    console.warn("[Firebase] Missing VITE_FIREBASE_* credentials — operating in offline/REST mode");
  }
} catch (error) {
  console.warn("[Firebase] Client initialization failed (graceful fallback):", error?.message || error);
}

export { app, auth, db, analytics };
export default app;
