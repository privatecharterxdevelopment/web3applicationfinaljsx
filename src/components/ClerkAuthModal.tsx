import React from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import Portal from './Portal';
import { X } from 'lucide-react';

interface ClerkAuthModalProps {
  onClose: () => void;
  mode: 'signin' | 'signup';
}

export default function ClerkAuthModal({ onClose, mode }: ClerkAuthModalProps) {
  return (
    <Portal>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 font-['DM_Sans']">

        {/* Modal Container */}
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>

          {/* Clerk Component */}
          <div className="p-4">
            {mode === 'signup' ? (
              <SignUp
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none",
                  }
                }}
                routing="hash"
                afterSignUpUrl="/glas"
              />
            ) : (
              <SignIn
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none",
                  }
                }}
                routing="hash"
                afterSignInUrl="/glas"
              />
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
