import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyBGFS_wtNjkesm4WxwJAcY-t0jaKyI7JiQ',
  authDomain: 'blockchain-5bb51.firebaseapp.com',
  projectId: 'blockchain-5bb51',
  // use the standard appspot.com storage bucket host
  storageBucket: 'blockchain-5bb51.appspot.com',
  messagingSenderId: '451205563693',
  appId: '1:451205563693:web:9611f19f47763b96c3bfa4',
  measurementId: 'G-JEXNEQ75BD',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

export const firebaseApp = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;

// Analytics is optional (may not be available in non-browser environments)
export const firebaseAnalyticsPromise = firebaseApp
  ? isSupported()
    .then((supported) => (supported ? getAnalytics(firebaseApp) : null))
    .catch(() => null)
  : Promise.resolve(null);
