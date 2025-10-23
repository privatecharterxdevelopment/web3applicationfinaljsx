import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Portal from '../Portal';

interface AuthModalProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
  heroImage?: string;
}

export default function AuthModal({
  title,
  subtitle,
  children,
  onClose,
  className = '',
  heroImage = '/images/auth-hero.jpg'
}: AuthModalProps) {
  return (
    <Portal>
      {/* Gray background with padding (flying component effect) */}
      <div className="fixed inset-0 bg-gray-100 z-[9999] flex items-center justify-center p-6">

        {/* Main Split-Screen Container */}
        <div className={`w-full h-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden flex ${className}`}>

          {/* LEFT SIDEBAR: Form Content (40%) */}
          <div className="w-2/5 bg-white p-8 flex flex-col relative">

            {/* Back Button */}
            <button
              onClick={onClose}
              className="absolute left-6 top-6 p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2 text-gray-600 hover:text-black"
            >
              <ArrowLeft size={20} />
            </button>

            {/* Progress Dots (optional, top right) */}
            <div className="absolute right-6 top-6 flex items-center gap-2">
              <div className="w-2 h-2 bg-black rounded-full" />
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="mt-16 mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-600">{subtitle}</p>
              )}
            </div>

            {/* Form Content (scrollable) */}
            <div className="flex-1 overflow-y-auto pr-2">
              {children}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
              <button
                onClick={() => window.open('/support', '_blank')}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Contact support
              </button>
              <p className="text-xs text-gray-400">
                © PrivateCharterX 2025
              </p>
            </div>
          </div>

          {/* RIGHT SIDE: Hero Image (60%) */}
          <div className="w-3/5 bg-gradient-to-br from-rose-300 to-rose-200 relative overflow-hidden">
            {/* Hero Image */}
            <img
              src={heroImage}
              alt="Authentication"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to gradient if image fails to load
                e.currentTarget.style.display = 'none';
              }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />

            {/* Success Badge (shown after successful action) */}
            <div className="absolute top-8 right-8 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg opacity-0 pointer-events-none" id="success-badge">
              <span className="font-semibold text-gray-900">Done!</span>
            </div>

            {/* Welcome Message (bottom right) */}
            <div className="absolute bottom-8 right-8 text-white text-right opacity-0 pointer-events-none" id="welcome-message">
              <div className="text-5xl font-bold mb-2">100%</div>
              <div className="text-lg">Welcome!</div>
            </div>
          </div>

        </div>
      </div>
    </Portal>
  );
}