/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { ToastContainer } from '../components/ui/Toast';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  showComingSoon: (featureName?: string) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string, duration: number = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: Toast = {
        id,
        type,
        title,
        message,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const showComingSoon = useCallback(
    (featureName?: string) => {
      const title = 'Coming Soon';
      const message = featureName
        ? `Coming Soon: ${featureName} is arriving in the next release!`
        : 'Coming Soon: This feature is arriving in the next release!';
      showToast(message, 'info', title, 3500);
    },
    [showToast]
  );

  const success = useCallback(
    (message: string, title?: string) => {
      showToast(message, 'success', title);
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string) => {
      showToast(message, 'error', title);
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string) => {
      showToast(message, 'info', title);
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string) => {
      showToast(message, 'warning', title);
    },
    [showToast]
  );

  const contextValue = useMemo<ToastContextType>(
    () => ({
      showToast,
      showComingSoon,
      removeToast,
      success,
      error,
      info,
      warning,
    }),
    [showToast, showComingSoon, removeToast, success, error, info, warning]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;
