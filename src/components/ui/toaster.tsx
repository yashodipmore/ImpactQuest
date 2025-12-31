'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

interface Toast extends ToastProps {
  id: string;
}

let toastId = 0;
const listeners: ((toast: Toast) => void)[] = [];

export function toast({ message, type = 'info', duration = 3000 }: ToastProps) {
  const id = String(++toastId);
  const newToast: Toast = { id, message, type, duration };
  listeners.forEach((listener) => listener(newToast));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.duration);
    };

    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  const getToastStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-800 text-white';
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-lg animate-slide-up ${getToastStyles(
            t.type || 'info'
          )}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
