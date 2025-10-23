import React, { useState } from 'react';
import { X, Check, Briefcase, CreditCard, Coins, Lock } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 font-['DM_Sans']">
      {/* Modal Container */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Complete Payment</h2>
            <p className="text-xs text-gray-500 mt-0.5">Secure checkout</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* Trip Summary Card */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-6 border border-gray-200">
            <div className="flex items-start gap-3">
              <img
                src={selectedCar?.image}
                alt={selectedCar?.name}
                className="w-20 h-14 object-contain rounded-lg bg-white p-1"
              />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">{selectedCar?.name}</h3>
                <p className="text-xs text-gray-600 mt-1">
                  {passengers} passenger{passengers > 1 ? 's' : ''} • {distance} km • {eta} min
                </p>
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">From:</span> {locationA}
                  </p>
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">To:</span> {locationB}
                  </p>
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">When:</span> {bookNow ? 'Now' : `${pickupDate} at ${pickupTime}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Baggage Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Briefcase size={16} />
              Number of Baggage
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setBaggage(Math.max(0, baggage - 1))}
                className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-gray-900 transition-colors flex items-center justify-center font-semibold text-gray-900"
              >
                -
              </button>
              <span className="text-xl font-semibold text-gray-900 w-12 text-center">{baggage}</span>
              <button
                onClick={() => setBaggage(Math.min(10, baggage + 1))}
                className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-gray-900 transition-colors flex items-center justify-center font-semibold text-gray-900"
              >
                +
              </button>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Payment Method</h3>

            {/* Tab Buttons */}
            <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => {
                  setActiveTab('crypto');
                  setSelectedPaymentMethod(null);
                }}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'crypto'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Coins size={16} />
                Cryptocurrency
              </button>
              <button
                onClick={() => {
                  setActiveTab('card');
                  setSelectedPaymentMethod('card');
                }}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'card'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CreditCard size={16} />
                Credit Card
              </button>
            </div>

            {/* Crypto Tab Content */}
            {activeTab === 'crypto' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-600">Powered by CoinGate</p>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                    +{VAT_PERCENT}% VAT
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {cryptoOptions.map((crypto) => (
                    <button
                      key={crypto.id}
                      onClick={() => setSelectedPaymentMethod(crypto.id)}
                      className={`relative p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        selectedPaymentMethod === crypto.id
                          ? 'border-gray-900 bg-gray-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={crypto.image}
                        alt={crypto.name}
                        className="w-10 h-10 object-contain"
                      />
                      <span className="text-xs font-semibold text-gray-900">{crypto.symbol}</span>
                      {selectedPaymentMethod === crypto.id && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Credit Card Tab Content */}
            {activeTab === 'card' && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Lock size={14} className="text-gray-600" />
                  <p className="text-xs text-gray-600">Secured by Stripe</p>
                </div>
                <Elements stripe={stripePromise}>
                  <CardElementWrapper />
                </Elements>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-6" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" alt="Amex" className="h-6" />
                </div>
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Ride Cost</span>
                <span className="font-semibold text-gray-900">
                  {estimatedPrice.toFixed(2)} {currency}
                </span>
              </div>

              {selectedPaymentMethod && (
                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">VAT (Swiss Tax)</span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full font-medium">
                      {feePercent}%
                    </span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {fee.toFixed(2)} {currency}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 text-white">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Amount</span>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {(selectedPaymentMethod ? total : estimatedPrice).toFixed(2)} {currency}
                  </div>
                  <p className="text-xs opacity-75 mt-0.5">
                    {selectedPaymentMethod
                      ? 'Held until driver confirms'
                      : 'Select payment to continue'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Pay Button */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <button
            onClick={handlePayment}
            disabled={!selectedPaymentMethod || isProcessing}
            className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock size={16} />
                Confirm & Pay {selectedPaymentMethod ? `${total.toFixed(2)} ${currency}` : ''}
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Payment will be held and charged after driver confirms arrival
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
