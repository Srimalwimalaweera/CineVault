
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
  role: 'user' | 'admin';
  status: 'free' | 'pro';
}

type AuthContextType = {
  user: (User & UserProfile) | null;
  isUserLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => void;
  signupWithGoogle: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user: firebaseUser, isUserLoading: isAuthLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { showNotification } = useNotification();
  const { toast } = useToast();
  
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !firebaseUser) return null;
    return doc(firestore, "users", firebaseUser.uid);
  }, [firestore, firebaseUser]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const isUserLoading = isAuthLoading || (!!firebaseUser && isProfileLoading);

  const user = firebaseUser && userProfile ? { ...firebaseUser, ...userProfile } : null;
  const isAdmin = user?.role === 'admin';

  const createUserProfile = useCallback(async (user: User) => {
    if (!firestore || !user) return;
    const userRef = doc(firestore, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      setDocumentNonBlocking(userRef, {
        displayName: user.displayName || user.email?.split('@')[0],
        email: user.email,
        photoURL: user.photoURL,
        lastSeen: serverTimestamp(),
      }, { merge: true });
    } else {
      setDocumentNonBlocking(userRef, {
        displayName: user.displayName || user.email?.split('@')[0],
        email: user.email,
        photoURL: user.photoURL,
        role: 'user',
        status: 'free',
        createdAt: serverTimestamp(),
        rejectedPayments: [],
      }, { merge: true });
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
      console.error("Login Error:", error.code, error.message);
      if (error.code === 'auth/invalid-credential') {
        toast({
            title: "Login Failed",
            description: "Invalid email or password. Please try again.",
            variant: "destructive"
        });
      } else {
        toast({
            title: "Login Failed",
            description: "An unexpected error occurred. Please try again later.",
            variant: "destructive"
        });
      }
    }
  }, [auth, createUserProfile, showNotification, toast]);

  const signup = useCallback(async (email: string, password: string) => {
    try {
        const userCredential = await initiateEmailSignUp(auth, email, password);
        if (userCredential && userCredential.user) {
            await createUserProfile(userCredential.user);
            showNotification("Signup Successful");
        }
    } catch (error: any) {
        console.error("Signup Error:", error);
        toast({
            title: "Signup Failed",
            description: "Could not create account. The email might already be in use.",
            variant: "destructive"
        });
    }
  }, [auth, createUserProfile, showNotification, toast]);


  const signupWithGoogle = useCallback(async () => {
    try {
      const userCredential = await initiateGoogleSignIn(auth);
      if (userCredential && userCredential.user) {
        await createUserProfile(userCredential.user);
        showNotification("Logged In with Google");
      }
    } catch (error: any) {
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
