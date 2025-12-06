"use client";

import React, { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
import { useUser, useAuth, useFirestore } from '@/firebase/provider';
import type { User } from 'firebase/auth';
import { initiateEmailSignIn, initiateEmailSignUp, initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { signOut } from 'firebase/auth';
import { useToast } from './use-toast';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase';


type AuthContextType = {
  user: User | null;
  isUserLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => void;
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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      user.getIdTokenResult().then(idTokenResult => {
        setIsAdmin(!!idTokenResult.claims.admin);
      });
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const createUserProfile = useCallback(async (user: User) => {
    if (!firestore || !user) return;
    const userRef = doc(firestore, "users", user.uid);
    const userProfile = {
      displayName: user.displayName || user.email?.split('@')[0],
      email: user.email,
      photoURL: user.photoURL,
      role: 'user',
      createdAt: serverTimestamp(),
    };
    // Use non-blocking write
    setDocumentNonBlocking(userRef, userProfile, { merge: true });
  }, [firestore]);


  const login = useCallback((email: string, password: string) => {
    initiateEmailSignIn(auth, email, password);
    toast({
      title: "Login Successful",
      description: "Welcome back to CineVault!",
    });
  }, [auth, toast]);

  const signup = useCallback(async (email: string, password: string) => {
    try {
        const userCredential = await initiateEmailSignUp(auth, email, password);
        if (userCredential && userCredential.user) {
            await createUserProfile(userCredential.user);
        }
        toast({
            title: "Account Created!",
            description: "Welcome to CineVault!",
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
        description: "Welcome to CineVault!",
      });
    } catch (error: any) {
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
