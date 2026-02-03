"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from "firebase/auth";
import { firebaseAuth } from "./firebase";

export function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(firebaseAuth, email, password);
}

export function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(firebaseAuth, email, password);
}

export function signOutUser() {
  return signOut(firebaseAuth);
}

export function subscribeToAuthChanges(
  callback: (user: User | null) => void,
) {
  return onAuthStateChanged(firebaseAuth, callback);
}

// --- Google sign-in helper ---
const googleProvider = new GoogleAuthProvider();
// Optional: force account chooser every time
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export function signInWithGoogle() {
  return signInWithPopup(firebaseAuth, googleProvider);
}
