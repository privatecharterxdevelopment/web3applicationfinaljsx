import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem('cookies-accepted');
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookies-accepted', 'true');
    setIsVisible(false);
  };

  const handleDeny = () => {
    localStorage.setItem('cookies-accepted', 'denied');
    setIsVisible(false);
  };

  const handleClose = () => {
    localStorage.setItem('cookies-accepted', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-4xl w-full px-4 animate-fade-in">
      <div className="bg-gray-100/60 backdrop-blur-xl border border-gray-200/50 rounded-full shadow-lg px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          <p className="text-sm text-gray-900 flex-1">
            We use cookies to enhance your browsing experience and analyze our traffic.{' '}
            <Link to="/privacy" className="text-sm text-gray-900 hover:text-gray-700 underline transition-colors">
              Learn more
            </Link>
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDeny}
              className="px-4 py-2 bg-white/30 backdrop-blur-md border border-white/50 text-gray-900 rounded-full text-xs font-medium hover:bg-white/40 transition-all whitespace-nowrap"
            >
              Deny
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 bg-gray-900 text-white rounded-full text-xs font-medium hover:bg-gray-800 transition-colors whitespace-nowrap"
            >
              Accept
            </button>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/30 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
