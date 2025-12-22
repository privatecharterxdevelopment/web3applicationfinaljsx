import React, { memo, useEffect } from 'react';
import { X, AlertCircle, ShoppingCart } from 'lucide-react';

// Toast notification component - minimalistic monochromatic design
const Toast = memo(({ message, type = 'info', onClose }) => {
  useEffect(() => {
    // Cart notifications disappear faster (2s), others stay longer (4s)
    const duration = type === 'cart' ? 2000 : 4000;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, type]);

  // Minimalistic cart toast
  if (type === 'cart') {
    return (
      <div className="fixed top-4 right-4 z-[9999] animate-slide-in">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg shadow-lg">
          <ShoppingCart size={16} />
          <p className="text-sm">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-in">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
        type === 'warning'
          ? 'bg-gray-100 border-gray-300 text-gray-900'
          : type === 'error'
          ? 'bg-gray-100 border-gray-300 text-gray-900'
          : type === 'success'
          ? 'bg-gray-900 text-white border-gray-700'
          : 'bg-gray-50 border-gray-200 text-gray-900'
      }`}>
        <AlertCircle size={20} className={
          type === 'warning' ? 'text-gray-600' : type === 'error' ? 'text-gray-600' : 'text-gray-400'
        } />
        <p className="text-sm font-medium">{message}</p>
        <button onClick={onClose} className="ml-2 hover:opacity-70">
          <X size={16} />
        </button>
      </div>
    </div>
  );
});

Toast.displayName = 'Toast';

export default Toast;
