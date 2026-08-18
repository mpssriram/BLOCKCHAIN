import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

import { createEmployeePortalHandoff, exchangeFirebaseToken, login, requestPasswordReset as requestBackendPasswordReset } from './api';
import { firebaseAuth } from './firebase';

function requireFirebaseAuth() {
  if (!firebaseAuth) {
    throw new Error('Firebase sign-in is not configured. Set the VITE_FIREBASE_* values in frontpage/.env.');
  }
  return firebaseAuth;
}

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

export async function loginWithGoogle(roleHint: string) {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  let firebaseCredential;
  try {
    firebaseCredential = await signInWithPopup(requireFirebaseAuth(), provider);
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

function getTokenRole(token: string): string | null {
  try {
    const payload = token.split(".")[1] || "";
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(base64));
    return typeof decoded?.role === "string" ? decoded.role : null;
  } catch {
    return null;
  }
}

export async function loginWithPassword(email: string, password: string, roleHint: string) {
  const backendSession = await login(email, password, roleHint);
  const role = getTokenRole(backendSession.access_token);
  const hasRequiredRole = roleHint === "employer" ? role === "employer" || role === "admin" : role === roleHint;

  if (!hasRequiredRole) {
    throw new Error("This account does not have access to this portal.");
  }

  localStorage.setItem("token", backendSession.access_token);
  localStorage.setItem("firebaseEmail", email);
  return { backendSession };
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = email.trim();
  if (!normalizedEmail) {
    throw new Error("Enter your email address first.");
  }

  await requestBackendPasswordReset(normalizedEmail);
}

const DEFAULT_EMPLOYEE_PORTAL_URL = 'http://localhost:5174/employee/';

export function getEmployeePortalUrl(): string {
  const configured = (import.meta as any).env?.VITE_EMPLOYEE_PORTAL_URL;
  return configured || DEFAULT_EMPLOYEE_PORTAL_URL;
}

/** Redirect with a one-time handoff code; bearer tokens never enter the URL. */
export async function redirectToEmployeePortal() {
  if (!localStorage.getItem('token')) {
    window.location.assign('/employee-login');
    return;
  }

  const handoff = await createEmployeePortalHandoff();
  const url = new URL(getEmployeePortalUrl());
  url.searchParams.set('handoff', handoff.code);
  window.location.href = url.toString();
}

export async function logoutEverywhere() {
  localStorage.removeItem('token');
  localStorage.removeItem('firebaseToken');
  localStorage.removeItem('firebaseUid');
  localStorage.removeItem('firebaseEmail');

  try {
    if (firebaseAuth) {
      await signOut(firebaseAuth);
    }
  } catch {
    // Local logout should still complete if Firebase is already signed out.
  }
}
