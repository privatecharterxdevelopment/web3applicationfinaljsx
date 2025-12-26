import React, { memo, useEffect } from 'react';
import { X, AlertCircle, ShoppingCart, CheckCircle } from 'lucide-react';

// Toast notification component - centered glassmorphic design
const Toast = memo(({ message, type = 'info', onClose }) => {
  useEffect(() => {
    // Cart notifications disappear faster (2s), others stay longer (4s)
    const duration = type === 'cart' || type === 'success' ? 2000 : 4000;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, type]);

  // Centered glassmorphic toast for cart/success
  if (type === 'cart' || type === 'success') {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg pointer-events-auto animate-fade-in"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(0, 0, 0, 0.08)'
          }}
        >
          {type === 'cart' ? (
            <ShoppingCart size={14} className="text-gray-800" />
          ) : (
            <CheckCircle size={14} className="text-gray-800" />
          )}
          <p className="text-xs font-medium text-gray-900">{message}</p>
        </div>
      </div>
    );
  }

  // Standard toast for warnings/errors - also centered
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg pointer-events-auto animate-fade-in"
        style={{
          background: type === 'error' ? 'rgba(254, 242, 242, 0.9)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: type === 'error' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(0, 0, 0, 0.08)'
        }}
      >
        <AlertCircle size={14} className={type === 'error' ? 'text-red-600' : 'text-gray-600'} />
        <p className="text-xs font-medium text-gray-900">{message}</p>
        <button onClick={onClose} className="ml-1 hover:opacity-70 pointer-events-auto">
          <X size={12} className="text-gray-500" />
        </button>
      </div>
    </div>
  );
});

Toast.displayName = 'Toast';

export default Toast;
