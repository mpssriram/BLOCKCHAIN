import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';

import { exchangeFirebaseToken } from './api';
import { firebaseAuth } from './firebase';

export function isDemoLoginEnabled(): boolean {
  return (import.meta as any).env?.VITE_ENABLE_DEMO_LOGIN === 'true';
}

function formatFirebaseAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  if (code === 'auth/configuration-not-found') {
    return (
      'Firebase Authentication is not enabled for this project. ' +
      'Open Firebase Console → Authentication → Get started, then enable Email/Password and Google sign-in.'
    );
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Authentication failed';
}

async function persistSession(idToken: string, roleHint: string) {
  const backendSession = await exchangeFirebaseToken(idToken, roleHint);
  localStorage.setItem('token', backendSession.access_token);
  localStorage.setItem('firebaseToken', idToken);
  return backendSession;
}

export async function loginWithFirebase(email: string, password: string, roleHint: string) {
  let firebaseCredential;
  try {
    firebaseCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  } catch (err) {
    throw new Error(formatFirebaseAuthError(err));
  }
  const firebaseToken = await firebaseCredential.user.getIdToken(true);

  localStorage.setItem('firebaseUid', firebaseCredential.user.uid);
  localStorage.setItem('firebaseEmail', firebaseCredential.user.email || email);

  const backendSession = await persistSession(firebaseToken, roleHint);

  return {
    firebaseUser: firebaseCredential.user,
    backendSession,
  };
}

export async function loginWithGoogle(roleHint: string) {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  let firebaseCredential;
  try {
    firebaseCredential = await signInWithPopup(firebaseAuth, provider);
  } catch (err) {
    throw new Error(formatFirebaseAuthError(err));
  }
  const firebaseToken = await firebaseCredential.user.getIdToken(true);

  localStorage.setItem('firebaseUid', firebaseCredential.user.uid);
  localStorage.setItem('firebaseEmail', firebaseCredential.user.email || '');

  const backendSession = await persistSession(firebaseToken, roleHint);

  return {
    firebaseUser: firebaseCredential.user,
    backendSession,
  };
}

const DEFAULT_EMPLOYEE_PORTAL_URL = 'http://localhost:5174/employee/';

export function getEmployeePortalUrl(): string {
  const configured = (import.meta as any).env?.VITE_EMPLOYEE_PORTAL_URL;
  return configured || DEFAULT_EMPLOYEE_PORTAL_URL;
}

/** Redirect to the separate employee app and pass the backend JWT (localStorage is per-origin). */
export function redirectToEmployeePortal() {
  const url = new URL(getEmployeePortalUrl());
  const token = localStorage.getItem('token');
  if (token) {
    url.searchParams.set('token', token);
  }
  window.location.href = url.toString();
}

export async function logoutEverywhere() {
  localStorage.removeItem('token');
  localStorage.removeItem('firebaseToken');
  localStorage.removeItem('firebaseUid');
  localStorage.removeItem('firebaseEmail');

  try {
    await signOut(firebaseAuth);
  } catch {
    // Local logout should still complete if Firebase is already signed out.
  }
}
