'use client';

import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let globalShowToast: ((toast: Omit<ToastItem, 'id'>) => void) | null = null;

export const toast = {
  success: (title: string, description?: string) => {
    globalShowToast?.({ type: 'success', title, description });
  },
  error: (title: string, description?: string) => {
    globalShowToast?.({ type: 'error', title, description });
  },
  info: (title: string, description?: string) => {
    globalShowToast?.({ type: 'info', title, description });
  },
};

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const ICON_COLORS = {
  success: 'text-success-600',
  error: 'text-danger-600',
  info: 'text-primary-700',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, description }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, description }]);
      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast],
  );

  useEffect(() => {
    globalShowToast = showToast;
    return () => {
      globalShowToast = null;
    };
  }, [showToast]);

  const value: ToastContextValue = {
    showToast,
    success: (title, description) => showToast({ type: 'success', title, description }),
    error: (title, description) => showToast({ type: 'error', title, description }),
    info: (title, description) => showToast({ type: 'info', title, description }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed right-0 bottom-0 z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:max-w-md"
      >
        <div className="flex flex-col-reverse gap-2.5">
          {toasts.map((item) => {
            const Icon = ICONS[item.type];
            return (
              <div
                key={item.id}
                role="status"
                className={cn(
                  'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 pointer-events-auto flex items-start gap-3.5 rounded-xl border border-neutral-300/80 bg-white/95 p-4 shadow-lg backdrop-blur-md transition-all duration-200',
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn('mt-0.5 size-5 shrink-0', ICON_COLORS[item.type])}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-primary-900 text-sm leading-tight font-semibold">
                    {item.title}
                  </p>
                  {item.description ? (
                    <p className="mt-1 text-xs leading-normal text-neutral-600">
                      {item.description}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(item.id)}
                  aria-label="Dismiss notification"
                  className="-mt-1 -mr-1 rounded-md p-1 text-neutral-400 transition-colors hover:text-neutral-700"
                >
                  <X className="size-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return toast;
  }
  return context;
}
