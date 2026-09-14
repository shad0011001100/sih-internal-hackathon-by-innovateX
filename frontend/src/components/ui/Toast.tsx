import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Sparkles, X } from 'lucide-react';
import type { Toast, ToastType } from '../../context/ToastContext';

export interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export function ToastItem({ toast, onClose }: ToastItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!toast.duration || toast.duration <= 0 || isHovered) return;

    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose, isHovered]);

  const isComingSoon =
    toast.title?.toLowerCase().includes('coming soon') ||
    toast.message.toLowerCase().includes('coming soon');

  // Type-specific styles and icons
  const typeConfig: Record<
    ToastType,
    {
      containerBorder: string;
      iconColor: string;
      badgeBg: string;
      progressBarColor: string;
      DefaultIcon: React.ComponentType<{ className?: string }>;
    }
  > = {
    success: {
      containerBorder: 'border-emerald-200 shadow-emerald-600/5',
      iconColor: 'text-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      progressBarColor: 'bg-emerald-500',
      DefaultIcon: CheckCircle2,
    },
    error: {
      containerBorder: 'border-red-200 shadow-red-600/5',
      iconColor: 'text-red-600',
      badgeBg: 'bg-red-50 text-red-700 border border-red-100',
      progressBarColor: 'bg-red-500',
      DefaultIcon: AlertCircle,
    },
    warning: {
      containerBorder: 'border-amber-200 shadow-amber-600/5',
      iconColor: 'text-amber-600',
      badgeBg: 'bg-amber-50 text-amber-700 border border-amber-100',
      progressBarColor: 'bg-amber-500',
      DefaultIcon: AlertTriangle,
    },
    info: {
      containerBorder: isComingSoon
        ? 'border-indigo-200 shadow-indigo-600/5'
        : 'border-slate-200 shadow-slate-600/5',
      iconColor: isComingSoon ? 'text-indigo-600' : 'text-primary',
      badgeBg: isComingSoon
        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
        : 'bg-emerald-50/70 text-primary border border-primary/20',
      progressBarColor: isComingSoon ? 'bg-indigo-500' : 'bg-primary',
      DefaultIcon: isComingSoon ? Sparkles : Info,
    },
  };

  const config = typeConfig[toast.type] || typeConfig.info;
  const IconComponent = isComingSoon ? Sparkles : config.DefaultIcon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.94, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border bg-white/95 dark:bg-slate-900/95 p-4 shadow-xl backdrop-blur-md transition-all ${config.containerBorder} w-full`}
    >
      <div className="flex items-start gap-3">
        {/* Leading Icon Badge */}
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${config.badgeBg}`}>
          <IconComponent className={`h-4 w-4 ${config.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          {toast.title && (
            <h4 className="text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
              {toast.title}
            </h4>
          )}
          <p
            className={`text-xs leading-relaxed text-slate-600 dark:text-slate-300 break-words ${
              toast.title ? 'mt-1' : ''
            }`}
          >
            {toast.message}
          </p>
        </div>

        {/* Manual Close Button */}
        <button
          type="button"
          onClick={() => onClose(toast.id)}
          className="shrink-0 -mr-1 -mt-1 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-90 cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Auto-Dismiss Progress Bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: isHovered ? undefined : '0%' }}
            transition={{
              duration: toast.duration / 1000,
              ease: 'linear',
            }}
            className={`h-full ${config.progressBarColor}`}
          />
        </div>
      )}
    </motion.div>
  );
}

export interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <aside
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full px-4 sm:px-0 pointer-events-none"
    >
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </aside>
  );
}

export default ToastContainer;
