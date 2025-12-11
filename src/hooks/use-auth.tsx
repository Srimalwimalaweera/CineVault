
"use client";

import React, { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
import { useUser, useAuth, useFirestore, useMemoFirebase } from '@/firebase';
import { useDoc } from '@/firebase';
import type { User } from 'firebase/auth';
import { initiateEmailSignIn, initiateEmailSignUp, initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { signOut } from 'firebase/auth';
import { useToast } from './use-toast';
import { doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore'; // Added getDoc
import { setDocumentNonBlocking } from '@/firebase';
import { useNotification } from './use-notification';

type UserProfile = {
  role: string;
}

type AuthContextType = {
  user: User | null;
  isUserLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => void;
  signupWithGoogle: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { showNotification } = useNotification();
  
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const isAdmin = userProfile?.role === 'admin';

  const createUserProfile = useCallback(async (user: User) => {
    if (!firestore || !user) return;
    const userRef = doc(firestore, "users", user.uid);

    // 1. Check if the user document already exists
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // If user exists, don't send the role (to preserve admin status)
      const userProfileData = {
        displayName: user.displayName || user.email?.split('@')[0],
        email: user.email,
        photoURL: user.photoURL,
        lastSeen: serverTimestamp(), // Good idea to track last login
      };
      setDocumentNonBlocking(userRef, userProfileData, { merge: true });
    } else {
      // For a new user, set the role to 'user'
      const userProfileData = {
        displayName: user.displayName || user.email?.split('@')[0],
        email: user.email,
        photoURL: user.photoURL,
        role: 'user', // Only for new users
        createdAt: serverTimestamp(),
      };
      setDocumentNonBlocking(userRef, userProfileData, { merge: true });
    }
  }, [firestore]);


  const login = useCallback(async (email: string, password: string) => {
    try {
      const userCredential = await initiateEmailSignIn(auth, email, password);
      if (userCredential && userCredential.user) {
        await createUserProfile(userCredential.user);
        showNotification("Logged In");
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      showNotification("Login Failed");
    }
  }, [auth, createUserProfile, showNotification]);

  const signup = useCallback(async (email: string, password: string) => {
    try {
        const userCredential = await initiateEmailSignUp(auth, email, password);
        if (userCredential && userCredential.user) {
            await createUserProfile(userCredential.user);
            showNotification("Signup Successful");
        }
    } catch (error: any) {
        console.error("Signup Error:", error);
        showNotification("Signup Failed");
    }
  }, [auth, createUserProfile, showNotification]);


  const signupWithGoogle = useCallback(async () => {
    try {
      const userCredential = await initiateGoogleSignIn(auth);
      if (userCredential && userCredential.user) {
        await createUserProfile(userCredential.user);
        showNotification("Logged In with Google");
      }
      // If userCredential is undefined (because the user closed the popup),
      // we simply do nothing.
    } catch (error: any) {
      // This will now only catch other errors, as popup-closed is handled in initiateGoogleSignIn
      console.error("Google Sign-In Error:", error);
      showNotification("Google Sign-In Failed");
    }
  }, [auth, createUserProfile, showNotification]);


  const logout = useCallback(() => {
    signOut(auth);
    showNotification("Logged Out");
  }, [auth, showNotification]);


  return (
    <AuthContext.Provider value={{ user, isUserLoading, isAdmin, login, signup, logout, signupWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
