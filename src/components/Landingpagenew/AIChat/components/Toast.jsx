// Toast Component
// Displays notification messages

import React, { memo, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, ShoppingCart } from 'lucide-react';
import { TOAST_TYPES } from '../utils/constants';

const Toast = memo(function Toast({
  message,
  type = 'info',
  duration = 4000,
  onClose
}) {
  // Auto-dismiss
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case TOAST_TYPES.SUCCESS:
        return <CheckCircle size={18} className="text-green-500" />;
      case TOAST_TYPES.ERROR:
        return <AlertCircle size={18} className="text-red-500" />;
      case TOAST_TYPES.WARNING:
        return <AlertTriangle size={18} className="text-yellow-500" />;
      case TOAST_TYPES.CART:
        return <ShoppingCart size={18} className="text-gray-600" />;
      default:
        return <Info size={18} className="text-blue-500" />;
    }
  };

  // Get background color based on type
  const getBgColor = () => {
    switch (type) {
      case TOAST_TYPES.SUCCESS:
        return 'bg-green-50 border-green-200';
      case TOAST_TYPES.ERROR:
        return 'bg-red-50 border-red-200';
      case TOAST_TYPES.WARNING:
        return 'bg-yellow-50 border-yellow-200';
      case TOAST_TYPES.CART:
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[10000] animate-fade-in">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${getBgColor()}`}>
        {getIcon()}
        <p className="text-sm text-gray-700">{message}</p>
        <button
          onClick={onClose}
          className="ml-2 p-1 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X size={14} className="text-gray-500" />
        </button>
      </div>
    </div>
  );
});

export default Toast;
