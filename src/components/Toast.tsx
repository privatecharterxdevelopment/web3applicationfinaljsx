import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
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
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[99999] transform transition-all duration-300 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="bg-white text-gray-900 rounded-xl shadow-2xl px-5 py-4 flex items-center gap-3 min-w-[300px] max-w-md border border-gray-200">
        {/* Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          type === 'success' ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {type === 'success' ? (
            <Check size={18} className="text-green-600" />
          ) : (
            <X size={18} className="text-red-500" />
          )}
        </div>

        {/* Message */}
        <p className="flex-1 text-sm font-medium text-gray-900">
          {message}
        </p>

        {/* Close Button */}
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={16} className="text-gray-500" />
        </button>
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
