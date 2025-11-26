import React, { useState } from 'react';
import { Bitcoin, Loader2 } from 'lucide-react';
import CryptoPaymentModal from './CryptoPaymentModal';
import { useAuth } from '../../context/AuthContext';

const BuyWithCryptoButton = ({
  // Can pass either a service object OR individual props
  service: serviceProp,
  serviceType,
  serviceId,
  serviceTitle,
  serviceDescription,
  price,
  currency = 'USD',
  imageUrl,
  // Additional service details
  origin,
  destination,
  aircraft,
  aircraftType,
  departureDate,
  passengers,
  rawData, // Full raw data object from database
  user: userProp, // Allow passing user from parent
  className = '',
  size = 'default', // 'small' | 'default' | 'large'
  variant = 'gradient', // 'gradient' | 'outline' | 'ghost'
  onSuccess,
  disabled = false,
  children
}) => {
  const authContext = useAuth();
  const user = userProp || authContext?.user;
  const isAuthenticated = userProp ? !!userProp : authContext?.isAuthenticated;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Build service object from individual props if not provided
  // Merge rawData (if provided) with explicit props for complete service info
  const service = serviceProp || {
    id: serviceId || rawData?.id,
    title: serviceTitle,
    description: serviceDescription,
    price: price || rawData?.price_usd || rawData?.price,
    currency: currency,
    image_url: imageUrl || rawData?.image_url || rawData?.aircraft_image,
    type: serviceType,
    // Flight details
    origin: origin || rawData?.departure_airport,
    destination: destination || rawData?.arrival_airport,
    departure_airport: origin || rawData?.departure_airport,
    arrival_airport: destination || rawData?.arrival_airport,
    aircraft_type: aircraftType || aircraft || rawData?.aircraft_type,
    aircraft: aircraft || aircraftType || rawData?.aircraft_type,
    departure_date: departureDate || rawData?.departure_date,
    max_passengers: passengers || rawData?.max_passengers || rawData?.pax,
    // Pass through all raw data for completeness
    ...rawData
  };

  const handleClick = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 3000);
      return;
    }
    setIsModalOpen(true);
  };

  const handleSuccess = (result) => {
    setIsModalOpen(false);
    if (onSuccess) {
      onSuccess(result);
    }
  };

  // Size variants
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm gap-1.5',
    default: 'px-4 py-2.5 text-base gap-2',
    large: 'px-6 py-3.5 text-lg gap-3'
  };

  // Style variants - Monochromatic PrivateCharterX design
  const variantClasses = {
    gradient: 'bg-black text-white hover:bg-gray-900 shadow-lg shadow-black/25',
    outline: 'bg-transparent border-2 border-black text-black hover:bg-black/5',
    ghost: 'bg-black/10 text-black hover:bg-black/20'
  };

  const iconSize = size === 'small' ? 'w-4 h-4' : size === 'large' ? 'w-6 h-6' : 'w-5 h-5';

  return (
    <>
      <div className={`relative ${className}`}>
        <button
          onClick={handleClick}
          disabled={disabled}
          className={`
            w-full inline-flex items-center justify-center font-semibold rounded-xl
            transition-all duration-200 transform hover:scale-[1.02]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
            ${sizeClasses[size]}
            ${variantClasses[variant]}
          `}
        >
          <Bitcoin className={iconSize} />
          {children || 'Pay with Crypto'}
        </button>

        {/* Login Prompt Tooltip */}
        {showLoginPrompt && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 z-50">
            Please login to make a payment
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <CryptoPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        service={service}
        serviceType={serviceType}
        onSuccess={handleSuccess}
      />
    </>
  );
};

export default BuyWithCryptoButton;
