"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useUser, useAuth } from '@/firebase/provider';
import type { User } from 'firebase/auth';
import { initiateEmailSignIn, initiateEmailSignUp, initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { signOut } from 'firebase/auth';
import { useToast } from './use-toast';


type AuthContextType = {
  user: User | null;
  isUserLoading: boolean;
  login: (email: string, password: string) => void;
  signup: (email: string, password: string) => void;
  signupWithGoogle: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  const login = useCallback((email: string, password: string) => {
    initiateEmailSignIn(auth, email, password);
    toast({
      title: "Login Successful",
      description: "Welcome back to CineVault!",
    });
  }, [auth, toast]);

  const signup = useCallback((email: string, password: string) => {
    initiateEmailSignUp(auth, email, password);
    toast({
      title: "Account Created!",
      description: "Welcome to CineVault!",
    });
  }, [auth, toast]);

  const signupWithGoogle = useCallback(async () => {
    try {
      await initiateGoogleSignIn(auth);
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
  }, [auth, toast]);


  const logout = useCallback(() => {
    signOut(auth);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  }, [auth, toast]);


  return (
    <AuthContext.Provider value={{ user, isUserLoading, login, signup, logout, signupWithGoogle }}>
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
