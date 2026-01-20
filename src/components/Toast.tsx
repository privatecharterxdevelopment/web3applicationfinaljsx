import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'success', duration = 2000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto close after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[99999] transform transition-all duration-300 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div
        className="bg-black/40 backdrop-blur-xl text-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2 border border-white/10"
        style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
      >
        {/* Icon */}
        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
          type === 'success' ? 'bg-green-500/30' : 'bg-red-500/30'
        }`}>
          {type === 'success' ? (
            <Check size={12} className="text-green-300" />
          ) : (
            <X size={12} className="text-red-300" />
          )}
        </div>

        {/* Message */}
        <p className="text-xs font-medium text-white/90">
          {message}
        </p>
      </div>
    </div>
  );
}

// Toast Container Component
interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    type?: 'success' | 'error';
  }>;
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none flex flex-col items-center">
      <div className="pointer-events-auto flex flex-col items-center">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{ marginTop: index === 0 ? 0 : 12 }}
          >
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
