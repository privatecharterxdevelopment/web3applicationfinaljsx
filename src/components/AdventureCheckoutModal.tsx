import React, { useState } from 'react';
import { X, MapPin, Plane, Users, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { FixedOffer } from '../pages/FixedOffers';

interface AdventureCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  adventure: FixedOffer;
  userEmail?: string;
  userId?: string;
}

const SUPPORTED_CRYPTOS = [
  { code: 'BTC', name: 'Bitcoin', logo: '₿' },
  { code: 'ETH', name: 'Ethereum', logo: 'Ξ' },
  { code: 'USDC', name: 'USDC', logo: '$' },
  { code: 'USDT', name: 'Tether', logo: '₮' },
  { code: 'SOL', name: 'Solana', logo: 'SOL' },
  { code: 'BNB', name: 'Binance Coin', logo: 'BNB' },
];

export default function AdventureCheckoutModal({
  isOpen,
  onClose,
  adventure,
  userEmail,
  userId,
}: AdventureCheckoutModalProps) {
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen) return null;

  // Get all available images
  const images = [
    adventure.image_url,
    (adventure as any).image_url_2,
    (adventure as any).image_url_3,
  ].filter(Boolean) as string[];

  if (images.length === 0) {
    images.push('https://images.unsplash.com/photo-1540962351504-03099e0a754b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80');
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing configuration');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/create-coingate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          serviceType: 'adventure_package',
          serviceId: adventure.id,
          userId: userId || 'anonymous',
          email: userEmail || 'guest@privatecharterx.com',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create payment order');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment');
      }

      // Redirect to payment
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = result.paymentUrl;
      } else {
        window.open(result.paymentUrl, '_blank');
        onClose();
      }

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to initialize payment. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Book Adventure Package</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row overflow-hidden flex-1">
          {/* Left Side - Images & Description */}
          <div className="md:w-1/2 border-r border-gray-100 overflow-y-auto">
            {/* Image Gallery */}
            <div className="relative aspect-[4/3] bg-gray-100">
              <img
                src={images[currentImageIndex]}
                alt={adventure.title}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
              {adventure.is_featured && (
                <div className="absolute top-3 left-3">
                  <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Featured
                  </span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{adventure.title}</h3>

              {/* Route */}
              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <MapPin size={16} />
                <span className="text-sm">{adventure.origin}</span>
                <span className="text-gray-400">→</span>
                <span className="text-sm">{adventure.destination || 'Multiple destinations'}</span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {adventure.aircraft_type && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Plane size={14} />
                    <span>{adventure.aircraft_type}</span>
                  </div>
                )}
                {adventure.passengers && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={14} />
                    <span>{adventure.passengers} passengers</span>
                  </div>
                )}
                {adventure.departure_date && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} />
                    <span>{new Date(adventure.departure_date).toLocaleDateString()}</span>
                  </div>
                )}
                {adventure.duration && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} />
                    <span>{adventure.duration}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {adventure.description}
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-4">
                {adventure.aircraft_category && (
                  <span className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600">
                    {adventure.aircraft_category}
                  </span>
                )}
                {adventure.is_empty_leg && (
                  <span className="bg-green-100 px-3 py-1 rounded-full text-xs text-green-700">
                    Empty Leg
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Payment */}
          <div className="md:w-1/2 p-6 bg-gray-50 overflow-y-auto">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-16">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-20 h-20 mb-4"
                >
                  <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/videoExport-2025-10-19@11-32-10.850-540x540@60fps.mp4" type="video/mp4" />
                </video>
                <p className="text-sm text-gray-600">Opening payment gateway...</p>
              </div>
            ) : (
              <>
                {/* Price Summary */}
                <div className="bg-white rounded-xl p-5 mb-6 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Total Price</h4>
                  <p className="text-3xl font-bold text-gray-900">
                    {adventure.currency === 'EUR' ? '€' : '$'}
                    {adventure.price?.toLocaleString() || 'On Request'}
                  </p>
                  {adventure.price_on_request && (
                    <p className="text-xs text-gray-500 mt-1">{adventure.price_on_request}</p>
                  )}
                </div>

                {/* Crypto Selection */}
                <h4 className="text-sm font-medium text-gray-900 mb-3">Select Payment Method</h4>
                <div className="space-y-2 mb-6">
                  {SUPPORTED_CRYPTOS.map((crypto) => (
                    <button
                      key={crypto.code}
                      onClick={() => setSelectedCrypto(crypto.code)}
                      className={`w-full flex items-center justify-between p-3 border rounded-xl transition-all ${
                        selectedCrypto === crypto.code
                          ? 'border-gray-900 bg-white'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                          {crypto.logo}
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-900">{crypto.name}</div>
                          <div className="text-xs text-gray-500">{crypto.code}</div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedCrypto === crypto.code
                          ? 'border-gray-900 bg-gray-900'
                          : 'border-gray-300'
                      }`}>
                        {selectedCrypto === crypto.code && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* More cryptos note */}
                <p className="text-xs text-gray-500 text-center mb-6">
                  70+ cryptocurrencies available via CoinGate
                </p>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={!adventure.price}
                    className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Pay with {selectedCrypto}
                  </button>
                </div>

                {/* Contact for custom */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500">
                    Need a custom package?{' '}
                    <a href="mailto:bookings@privatecharterx.com" className="text-gray-900 underline">
                      Contact us
                    </a>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
