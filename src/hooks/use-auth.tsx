"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useUser, useAuth, useFirebase } from '@/firebase/provider';
import type { User, Auth } from 'firebase/auth';
import { initiateEmailSignIn, initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { signOut } from 'firebase/auth';
import { useToast } from './use-toast';


type AuthContextType = {
  user: User | null;
  isUserLoading: boolean;
  login: (email: string, password: string) => void;
  signup: (email: string, password: string) => void;
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

  const logout = useCallback(() => {
    signOut(auth);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  }, [auth, toast]);


  return (
    <AuthContext.Provider value={{ user, isUserLoading, login, signup, logout }}>
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
