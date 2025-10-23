import React from 'react';
import { X } from 'lucide-react';
import Portal from '../Portal';

interface AuthModalProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}

export default function AuthModal({
  title,
  subtitle,
  children,
  onClose,
  className = ''
}: AuthModalProps) {
  return (
    <Portal>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 relative ${className}`}>
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
          >
            <X size={16} className="text-gray-500" />
          </button>

          {/* Header */}
          <div className="p-6 pb-5">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-thin text-black">{title}</h1>
              {subtitle && (
                <p className="text-xs font-light text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            {children}
          </div>

          {/* Branding footer */}
          <div className="px-6 pb-6 pt-2">
            <div className="text-center">
              <p className="text-xs font-light text-gray-400">
                Secure authentication powered by PrivateCharterX
              </p>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}