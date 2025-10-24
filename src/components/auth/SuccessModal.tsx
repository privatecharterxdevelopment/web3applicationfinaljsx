import React from 'react';
import { Check } from 'lucide-react';
import Portal from '../Portal';

interface SuccessModalProps {
  show: boolean;
  title: string;
  message: string;
  autoClose?: boolean;
  countdown?: string;
  onClose?: () => void;
}

export default function SuccessModal({
  show,
  title,
  message,
  autoClose = true,
  countdown,
  onClose
}: SuccessModalProps) {
  if (!show) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center animate-fadeIn">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-gray-600 mb-4">{message}</p>
          {countdown && (
            <div className="text-sm text-gray-500">
              {countdown}
            </div>
          )}
          {!autoClose && onClose && (
            <button
              onClick={onClose}
              className="mt-4 w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </Portal>
  );
}