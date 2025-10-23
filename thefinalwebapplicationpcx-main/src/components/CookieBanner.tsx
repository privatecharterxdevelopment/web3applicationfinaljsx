import React, { useState, useEffect } from 'react';
import { Cookie, ArrowLeft } from 'lucide-react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

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
    setShowPolicy(false);
  };

  const handleLearnMore = () => {
    setShowPolicy(true);
  };

  const handleBackToBanner = () => {
    setShowPolicy(false);
  };

  if (showPolicy) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-neutral-800 to-gray-900 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-950 text-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={handleBackToBanner}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
                Back
              </button>
            </div>

            <div className="prose prose-invert max-w-none">
              <h1 className="text-2xl font-bold mb-6">Cookie Policy</h1>

              <h2 className="text-xl font-semibold mb-3">What are cookies?</h2>
              <p className="mb-4">
                Cookies are small text files that are placed on your computer or mobile device when you visit our website. 
                They are widely used to make websites work more efficiently and provide information to website owners.
              </p>

              <h2 className="text-xl font-semibold mb-3">How we use cookies</h2>
              <p className="mb-4">We use cookies for several purposes:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Essential cookies:</strong> Necessary for the website to function properly.</li>
                <li><strong>Analytics cookies:</strong> Help us understand how visitors interact with our website.</li>
                <li><strong>Preference cookies:</strong> Remember your settings and preferences.</li>
                <li><strong>Marketing cookies:</strong> Used to deliver relevant advertisements.</li>
              </ul>

              <h2 className="text-xl font-semibold mb-3">Cookie categories</h2>
              <div className="space-y-4 mb-6">
                <div className="border border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Strictly Necessary Cookies</h3>
                  <p className="text-sm">
                    These cookies are essential for the website to function and cannot be disabled. 
                    They are usually set in response to actions you take such as setting privacy preferences or logging in.
                  </p>
                </div>
                <div className="border border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Performance Cookies</h3>
                  <p className="text-sm">
                    These cookies help us understand how visitors interact with our website by collecting 
                    and reporting information anonymously.
                  </p>
                </div>
                <div className="border border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Functional Cookies</h3>
                  <p className="text-sm">
                    These cookies enable enhanced functionality and personalization, such as remembering 
                    your preferences and settings.
                  </p>
                </div>
              </div>

              <h2 className="text-xl font-semibold mb-3">Managing cookies</h2>
              <p className="mb-4">
                You can control and manage cookies in various ways. Most browsers allow you to refuse or delete cookies. 
                The methods for managing cookies vary from browser to browser.
              </p>

              <h2 className="text-xl font-semibold mb-3">Contact us</h2>
              <p className="mb-6">
                If you have any questions about our use of cookies, please contact us at <a href="mailto:info@privatecharterx.com" className="underline">info@privatecharterx.com</a>
              </p>

              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={handleAccept}
                  className="px-6 py-2.5 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Accept All Cookies
                </button>
                <button
                  onClick={handleBackToBanner}
                  className="px-6 py-2.5 border border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Back to Banner
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[300px] bg-gradient-to-br from-neutral-900 via-zinc-800 to-gray-900 text-white rounded-xl shadow-xl transform hover:-translate-y-1 transition-transform duration-300">
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <Cookie size={24} className="text-white flex-shrink-0 mt-0.5" />
          <p className="text-sm font-light text-white/90 font-sans">
            We use cookies to enhance your experience while prioritizing your privacy and data protection. 
            By continuing to visit this site you agree to our use of cookies.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAccept}
            className="flex-1 py-2 bg-white text-black rounded-lg text-sm font-light tracking-wide hover:bg-gray-100 transition-colors"
          >
            Accept
          </button>
          <button
            onClick={handleLearnMore}
            className="flex-1 py-2 border border-white/30 rounded-lg text-sm font-light tracking-wide hover:bg-white/10 transition-colors"
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
