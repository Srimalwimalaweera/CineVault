
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
      }
      toast({
        title: "Login Successful",
        description: "Welcome back to XVault!",
      });
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid email or password. Please try again.",
        });
      } else {
        console.error("Login Error:", error);
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "An unexpected error occurred. Please try again.",
        });
      }
    }
  }, [auth, toast, createUserProfile]);

  const signup = useCallback(async (email: string, password: string) => {
    try {
        const userCredential = await initiateEmailSignUp(auth, email, password);
        if (userCredential && userCredential.user) {
            await createUserProfile(userCredential.user);
        }
        toast({
            title: "Account Created!",
            description: "Welcome to XVault!",
        });
    } catch (error: any) {
        console.error("Signup Error:", error);
        toast({
            variant: "destructive",
            title: "Sign-up Failed",
            description: error.message || "An unknown error occurred. Please try again.",
        });
    }
  }, [auth, toast, createUserProfile]);


  const signupWithGoogle = useCallback(async () => {
    try {
      const userCredential = await initiateGoogleSignIn(auth);
      if (userCredential && userCredential.user) {
        await createUserProfile(userCredential.user);
      }
      toast({
        title: "Signed in with Google",
        description: "Welcome to XVault!",
      });
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
      console.error("Google Sign-In Error:", error);
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: error.message || "An unknown error occurred. Please try again.",
      });
    }
  }, [auth, toast, createUserProfile]);


  const logout = useCallback(() => {
    signOut(auth);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  }, [auth, toast]);


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
