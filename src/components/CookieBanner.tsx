import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has already accepted cookies
    const accepted = localStorage.getItem('cookie_consent');
    if (!accepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setIsVisible(false);
  };

  const handlePrivacyPolicy = () => {
    navigate('/privacy');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4">
      {/* Light Grey Blurred Container */}
      <div className="max-w-2xl mx-auto bg-gray-100/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg border border-gray-200/50">
        <div className="p-4 sm:p-5">
          {/* Content - Stacked on mobile, row on desktop */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Text */}
            <p className="text-sm text-gray-600 leading-relaxed flex-1">
              We use cookies to enhance your experience. By continuing, you agree to our{' '}
              <button
                onClick={handlePrivacyPolicy}
                className="text-gray-900 underline underline-offset-2 hover:text-gray-700 transition-colors font-medium"
              >
                Privacy Policy
              </button>.
            </p>

            {/* Buttons - Full width on mobile */}
            <div className="flex gap-2 sm:gap-3 sm:flex-shrink-0">
              <button
                onClick={handlePrivacyPolicy}
                className="flex-1 sm:flex-none px-4 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Learn More
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 sm:flex-none px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
