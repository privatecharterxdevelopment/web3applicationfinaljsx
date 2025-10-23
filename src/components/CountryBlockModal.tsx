import React from 'react';
import { X, Mail, MapPin, AlertCircle } from 'lucide-react';

interface CountryBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  country: string | null;
}

function CountryBlockModal({ isOpen, onClose, country }: CountryBlockModalProps) {
  if (!isOpen) return null;

  const handleEmailContact = () => {
    window.location.href = 'mailto:info@privatecharterx.com?subject=Service Inquiry from ' + country + '&body=Hello PrivateCharterX Team,%0D%0A%0D%0AI am interested in your services and would like to learn more about availability in my region.%0D%0A%0D%0AThank you for your time.';
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            Service Not Available
          </h2>
          <div className="flex items-center justify-center mb-4">
            <MapPin className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">Detected location: {country}</span>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Our services are currently not available in your country due to regulatory requirements.
            However, we'd love to hear from you and discuss potential future availability.
          </p>
        </div>

        {/* Contact Button */}
        <button
          onClick={handleEmailContact}
          className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center mb-4"
        >
          <Mail className="w-4 h-4 mr-2" />
          Contact Us via Email
        </button>

        {/* Info Text */}
        <p className="text-xs text-gray-500 text-center">
          Click above to send us an email and we'll get back to you with more information about our services.
        </p>
      </div>
    </div>
  );
}

export default CountryBlockModal;