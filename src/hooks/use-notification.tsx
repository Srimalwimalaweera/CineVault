"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

type NotificationContextType = {
  notification: string | null;
  isVisible: boolean;
  showNotification: (message: string) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notification, setNotification] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000); // Hide after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <NotificationContext.Provider value={{ notification, isVisible, showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
