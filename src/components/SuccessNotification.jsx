import React, { useEffect } from 'react';
import { Check } from 'lucide-react';

/**
 * Reusable success notification component for RWS service requests
 * @param {boolean} show - Whether to show the notification
 * @param {function} onClose - Callback when notification closes
 * @param {string} title - Notification title (default: "Request Submitted!")
 * @param {string} message - Notification message
 * @param {number} duration - Auto-close duration in ms (default: 5000)
 */
const SuccessNotification = ({
  show,
  onClose,
  title = "Request Submitted!",
  message = "We'll get back to you shortly.",
  duration = 5000
}) => {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slideIn">
      <Check className="w-6 h-6 flex-shrink-0" />
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm opacity-90">{message}</p>
      </div>
    </div>
  );
};

export default SuccessNotification;
