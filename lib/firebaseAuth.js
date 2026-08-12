"use client";

import {
  EmailAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  reauthenticateWithCredential,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import { firebaseAuth } from "./firebaseClient";

export function firebaseErrorMessage(error) {
  const messages = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/missing-password": "Password is required.",
    "auth/network-request-failed": "Could not reach Firebase. Check your connection and try again.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/weak-password": "Choose a stronger password.",
    "auth/wrong-password": "Your current password is incorrect.",
  };

  return messages[error?.code] || error?.message || "Authentication failed. Please try again.";
}

/**
 * Supabase's Firebase integration expects an `authenticated` role claim.
 * This calls a server-only route that verifies the Firebase ID token, adds
 * that fixed claim to the same user, and then refreshes the browser token.
 */
export async function ensureSupabaseClaim(user) {
  const idToken = await user.getIdToken();
  const response = await fetch("/api/auth/supabase-claims", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Could not authorize this Firebase account with Supabase.");
  }

  // Custom claims appear only in a newly issued ID token.
  await user.getIdToken(true);
  return user;
}

export async function signInWithFirebase(email, password, remember = true) {
  await setPersistence(firebaseAuth, remember ? browserLocalPersistence : browserSessionPersistence);
  const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  try {
    return await ensureSupabaseClaim(credential.user);
  } catch (error) {
    await signOut(firebaseAuth).catch(() => {});
    throw error;
  }
}

export async function registerWithFirebase(email, password) {
  await setPersistence(firebaseAuth, browserLocalPersistence);
  const credential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
  try {
    return await ensureSupabaseClaim(credential.user);
  } catch (error) {
    // Do not leave an unusable Firebase account when the data authorization
    // bridge is not configured yet.
    await deleteUser(credential.user).catch(() => {});
    throw error;
  }
}

export async function removeNewFirebaseUser(user) {
  await deleteUser(user);
}

export async function signOutFromFirebase() {
  await signOut(firebaseAuth);
}

export async function changeFirebasePassword(currentPassword, newPassword) {
  const user = firebaseAuth.currentUser;
  if (!user?.email) throw new Error("No signed-in email account was found.");

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}
