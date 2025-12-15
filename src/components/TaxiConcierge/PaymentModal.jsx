import React, { useState } from 'react';
import { X, Check, Briefcase, CreditCard, Coins, Lock, Car, MapPin, Clock, Users, Sparkles, ArrowRight } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

const PaymentModal = ({
  bookingData,
  onClose,
  onPaymentComplete
}) => {
  const [activeTab, setActiveTab] = useState('crypto'); // 'crypto' or 'card'
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [baggage, setBaggage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    selectedCar,
    distance,
    eta,
    priceRange,
    locationA,
    locationB,
    passengers,
    pickupDate,
    pickupTime,
    bookNow
  } = bookingData;

  const estimatedPrice = parseFloat(priceRange?.max || '0.00');
  const currency = bookingData.currency || 'CHF';
  const VAT_PERCENT = 8.1;
  const pvcxEarned = Math.round(distance * 1.5);

  const calculateFees = () => {
    if (!selectedPaymentMethod) return { fee: 0, total: estimatedPrice };
    const fee = (estimatedPrice * VAT_PERCENT) / 100;
    const total = estimatedPrice + fee;
    return { fee, total, feePercent: VAT_PERCENT };
  };

  const { fee, total, feePercent } = calculateFees();

  const cryptoOptions = [
    {
      id: 'btc',
      name: 'Bitcoin',
      symbol: 'BTC',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/PaymentIcons/bitcoin-btc-3d-coin-icon_767610-4.jpg'
    },
    {
      id: 'eth',
      name: 'Ethereum',
      symbol: 'ETH',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/PaymentIcons/ethereum-3d-icon-png-download-3364022.webp'
    },
    {
      id: 'usdt',
      name: 'Tether',
      symbol: 'USDT',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/PaymentIcons/green-circle-with-large-t-it-that-is-labeled-t_767610-17.jpg'
    },
    {
      id: 'usdc',
      name: 'USD Coin',
      symbol: 'USDC',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/PaymentIcons/usdc-3d-icon-png-download-8263869.webp'
    }
  ];

  const handlePayment = async () => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      if (onPaymentComplete) {
        onPaymentComplete({
          ...bookingData,
          paymentMethod: activeTab === 'crypto' ? selectedPaymentMethod : 'card',
          baggage,
          paymentStatus: 'pending',
          estimatedPrice
        });
      }
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-5 font-['DM_Sans']">
      {/* Modal Container - Floating with spacing on all devices */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

        {/* Header - Clean minimal style */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Car size={16} className="text-gray-600" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-medium text-gray-900 truncate max-w-[180px] sm:max-w-none">{selectedCar?.name}</h2>
                <p className="text-[10px] sm:text-xs text-gray-500">Complete your booking</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 sm:py-5 space-y-3 sm:space-y-4">

          {/* Route Card - Styled like MyBookingsView */}
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-400">From</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{locationA}</p>
              </div>
              <ArrowRight size={12} className="text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0 text-right">
                <p className="text-[10px] sm:text-xs text-gray-400">To</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{locationB}</p>
              </div>
            </div>
          </div>

          {/* Details Grid - Like MyBookingsView */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center">
              <Clock size={12} className="text-gray-400 mx-auto mb-0.5 sm:mb-1" />
              <p className="text-[9px] sm:text-[10px] text-gray-400">Duration</p>
              <p className="text-[11px] sm:text-xs font-medium text-gray-900">{eta} min</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center">
              <MapPin size={12} className="text-gray-400 mx-auto mb-0.5 sm:mb-1" />
              <p className="text-[9px] sm:text-[10px] text-gray-400">Distance</p>
              <p className="text-[11px] sm:text-xs font-medium text-gray-900">{distance} km</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center">
              <Users size={12} className="text-gray-400 mx-auto mb-0.5 sm:mb-1" />
              <p className="text-[9px] sm:text-[10px] text-gray-400">Passengers</p>
              <p className="text-[11px] sm:text-xs font-medium text-gray-900">{passengers}</p>
            </div>
          </div>

          {/* Pickup Time & Baggage - Compact row on mobile */}
          <div className="flex items-center justify-between py-2 text-xs sm:text-sm">
            <span className="text-gray-500">Pickup</span>
            <span className="font-medium text-gray-900">
              {bookNow ? 'Now' : `${pickupDate} at ${pickupTime}`}
            </span>
          </div>

          {/* Baggage Selection - Compact */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Briefcase size={12} className="text-gray-400" />
              <span className="text-xs sm:text-sm text-gray-700">Baggage</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setBaggage(Math.max(0, baggage - 1))}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors flex items-center justify-center text-gray-600 text-sm"
              >
                -
              </button>
              <span className="text-xs sm:text-sm font-medium text-gray-900 w-5 text-center">{baggage}</span>
              <button
                onClick={() => setBaggage(Math.min(10, baggage + 1))}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors flex items-center justify-center text-gray-600 text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Payment Method - Tab Style */}
          <div className="pt-1 sm:pt-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 sm:mb-3">Payment Method</p>

            {/* Tab Buttons - Pill style */}
            <div className="flex gap-2 mb-3 sm:mb-4">
              <button
                onClick={() => {
                  setActiveTab('crypto');
                  setSelectedPaymentMethod(null);
                }}
                className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-[11px] sm:text-xs font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                  activeTab === 'crypto'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Coins size={12} />
                Crypto
              </button>
              <button
                onClick={() => {
                  setActiveTab('card');
                  setSelectedPaymentMethod('card');
                }}
                className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-[11px] sm:text-xs font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                  activeTab === 'card'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <CreditCard size={12} />
                Card / Bank
              </button>
            </div>

            {/* Crypto Options - Grid */}
            {activeTab === 'crypto' && (
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {cryptoOptions.map((crypto) => (
                  <button
                    key={crypto.id}
                    onClick={() => setSelectedPaymentMethod(crypto.id)}
                    className={`relative p-2 sm:p-2.5 rounded-xl border-2 transition-all flex flex-col items-center gap-1 sm:gap-1.5 ${
                      selectedPaymentMethod === crypto.id
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <img
                      src={crypto.image}
                      alt={crypto.name}
                      className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                    />
                    <span className="text-[9px] sm:text-[10px] font-medium text-gray-700">{crypto.symbol}</span>
                    {selectedPaymentMethod === crypto.id && (
                      <div className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gray-900 rounded-full flex items-center justify-center">
                        <Check size={8} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Card/Bank Option */}
            {activeTab === 'card' && (
              <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3 border border-gray-100">
                <p className="text-[11px] sm:text-xs text-gray-600">
                  We'll send you payment details via email. You can pay by bank transfer or card.
                </p>
                <div className="mt-2 flex items-center gap-2 opacity-60">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-3 sm:h-4" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-3 sm:h-4" />
                </div>
              </div>
            )}
          </div>

          {/* Payment Summary - Dark bg like MyBookingsView */}
          <div className="bg-gray-900 text-white rounded-xl p-3 sm:p-4 mt-2 sm:mt-4">
            <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wide mb-2 sm:mb-3">Payment Summary</p>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Estimated Ride Cost</span>
                <span>{estimatedPrice.toFixed(2)} {currency}</span>
              </div>
              {selectedPaymentMethod && (
                <div className="flex justify-between">
                  <span className="text-gray-400">VAT ({feePercent}%)</span>
                  <span>{fee.toFixed(2)} {currency}</span>
                </div>
              )}
              <div className="flex justify-between pt-1.5 sm:pt-2 border-t border-gray-700 font-medium">
                <span>Estimated Total</span>
                <span className="text-base sm:text-lg">{(selectedPaymentMethod ? total : estimatedPrice).toFixed(2)} {currency}</span>
              </div>
              {/* PVCX Rewards - Like MyBookingsView */}
              <div className="flex justify-between pt-1.5 sm:pt-2 border-t border-gray-700 text-emerald-400">
                <span className="flex items-center gap-1">
                  <Sparkles size={10} />
                  PVCX Reward
                </span>
                <span>+{pvcxEarned}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Submit Button */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-gray-100 bg-white flex-shrink-0">
          <button
            onClick={handlePayment}
            disabled={!selectedPaymentMethod || isProcessing}
            className="w-full py-2.5 sm:py-3 bg-gray-900 text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock size={12} />
                Submit Booking Request
              </>
            )}
          </button>
          <p className="text-[9px] sm:text-[10px] text-gray-400 text-center mt-1.5 sm:mt-2">
            Final price will be confirmed in your offer
          </p>
        </div>
      </div>
    </div>
  );
};

// Card Element Wrapper Component
const CardElementWrapper = () => {
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '14px',
        color: '#1f2937',
        fontFamily: 'DM Sans, system-ui, sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
      },
    },
  };

  return (
    <div className="bg-white p-3 rounded-lg border border-gray-300">
      <CardElement options={cardElementOptions} />
    </div>
  );
};

export default PaymentModal;
