'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

/** Initiate email/password sign-up and return user credential. */
export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<UserCredential | undefined> {
  try {
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    return userCredential;
  } catch (error) {
    console.error("Error during Email sign-up:", error);
    throw error;
  }
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string) {
  return signInWithEmailAndPassword(authInstance, email, password);
}

/** Initiate Google sign-in and return user credential. */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<UserCredential | undefined> {
  const provider = new GoogleAuthProvider();
  try {
    const userCredential = await signInWithPopup(authInstance, provider);
    return userCredential;
  } catch (error: any) {
    // Gracefully handle the user closing the popup.
    if (error.code === 'auth/popup-closed-by-user') {
      return undefined;
    }
    // For all other errors, re-throw them to be handled by the caller.
    console.error("Error during Google sign-in:", error);
    throw error;
  }
}
