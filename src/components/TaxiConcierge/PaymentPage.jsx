import React, { useState } from 'react';
import { ArrowLeft, Check, Briefcase, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe (you'll need to add your publishable key to .env)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

const PaymentPage = ({
  bookingData,
  onBack,
  onPaymentComplete
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null); // 'btc', 'eth', 'usdt', 'usdc', 'card'
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

  // Calculate estimated price (using max price for display)
  const estimatedPrice = parseFloat(priceRange?.max || '0.00');
  const currency = bookingData.currency || 'CHF';

  // VAT (Swiss tax rate)
  const VAT_PERCENT = 8.1; // 8.1% VAT for all payment methods

  // Calculate VAT and total
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

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      if (onPaymentComplete) {
        onPaymentComplete({
          ...bookingData,
          paymentMethod: selectedPaymentMethod,
          baggage,
          paymentStatus: 'pending', // Will be confirmed when driver arrives
          estimatedPrice
        });
      }
    }, 2000);
  };

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Trip Summary */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Payment</h2>

          {/* Route Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <img
                src={selectedCar?.image}
                alt={selectedCar?.name}
                className="w-24 h-16 object-contain"
              />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">{selectedCar?.name}</h3>
                <p className="text-xs text-gray-600 mt-1">
                  {passengers} passenger{passengers > 1 ? 's' : ''} • {distance} km • {eta} min
                </p>
                <div className="mt-2 space-y-1">
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
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              <Briefcase size={16} className="inline mr-2" />
              Number of Baggage
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setBaggage(Math.max(0, baggage - 1))}
                className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-gray-900 transition-colors flex items-center justify-center font-semibold text-gray-900"
              >
                -
              </button>
              <span className="text-2xl font-semibold text-gray-900 w-12 text-center">{baggage}</span>
              <button
                onClick={() => setBaggage(Math.min(10, baggage + 1))}
                className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-gray-900 transition-colors flex items-center justify-center font-semibold text-gray-900"
              >
                +
              </button>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-4">
            {/* Ride Cost */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Ride Cost</span>
                <span className="text-base font-semibold text-gray-900">
                  {estimatedPrice.toFixed(2)} {currency}
                </span>
              </div>

              {/* VAT - Shows when payment method selected */}
              {selectedPaymentMethod && (
                <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-gray-100">
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

            {/* Total */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-700 p-4 text-white">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium opacity-90">Total Amount</span>
                <div className="text-right">
                  <div className="text-3xl font-bold animate-fadeInUp">
                    {(selectedPaymentMethod ? total : estimatedPrice).toFixed(2)} {currency}
                  </div>
                  <p className="text-xs opacity-75 mt-1">
                    {selectedPaymentMethod
                      ? 'Held until driver confirms arrival'
                      : 'Select payment method to see total'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h3>

          {/* Crypto Payments (CoinGate) */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-600 font-medium">Cryptocurrency via CoinGate</p>
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-semibold">
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
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <img
                    src={crypto.image}
                    alt={crypto.name}
                    className="w-12 h-12 object-contain"
                  />
                  <span className="text-xs font-semibold text-gray-900">{crypto.symbol}</span>
                  {selectedPaymentMethod === crypto.id && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Credit Card Payment (Stripe) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-600 font-medium">Credit or Debit Card</p>
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-semibold">
                +{VAT_PERCENT}% VAT
              </span>
            </div>
            <button
              onClick={() => setSelectedPaymentMethod('card')}
              className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                selectedPaymentMethod === 'card'
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <img
                src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/PaymentIcons/360_F_425383660_cLLE2tW2JDSBJ62sBaiVcnYYWCqWgD88-removebg-preview.png"
                alt="Credit Card"
                className="w-16 h-12 object-contain"
              />
              <div className="flex-1 text-left">
                <h4 className="text-sm font-semibold text-gray-900">Credit / Debit Card</h4>
                <p className="text-xs text-gray-600">Visa, Mastercard, Amex</p>
              </div>
              {selectedPaymentMethod === 'card' && (
                <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
              )}
            </button>

            {/* Stripe Card Element - Show when card is selected */}
            {selectedPaymentMethod === 'card' && (
              <div className="mt-4 p-4 border-2 border-gray-200 rounded-xl">
                <Elements stripe={stripePromise}>
                  <StripeCardForm />
                </Elements>
              </div>
            )}
          </div>

          {/* Stripe Disclaimer */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 leading-relaxed">
              💳 Payments are securely processed by Stripe. Your payment will be held and only charged once your driver confirms arrival at the pickup location. All transactions are encrypted and PCI-compliant.
            </p>
          </div>
        </div>
      </div>

      {/* Fixed Bottom - Confirm Button */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-white">
        <button
          onClick={handlePayment}
          disabled={!selectedPaymentMethod || isProcessing}
          className={`w-full py-4 rounded-xl font-semibold transition-all ${
            selectedPaymentMethod && !isProcessing
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing Payment...
            </span>
          ) : (
            'Confirm & Pay'
          )}
        </button>
      </div>

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              {/* Outer rotating circle */}
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              {/* Inner rotating gradient circle */}
              <div className="absolute inset-0 border-4 border-transparent border-t-gray-900 rounded-full animate-spin"></div>
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Check size={32} className="text-gray-900" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 animate-pulse">
              Processing Payment
            </h3>
            <p className="text-sm text-gray-600">
              {selectedPaymentMethod === 'card'
                ? 'Securing your payment with Stripe...'
                : 'Generating cryptocurrency payment link...'}
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            transform: translateY(10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

// Stripe Card Form Component
const StripeCardForm = () => {
  const stripe = useStripe();
  const elements = useElements();

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
      },
      invalid: {
        color: '#ef4444',
      },
    },
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-2">
        Card Details
      </label>
      <div className="p-3 border border-gray-300 rounded-lg bg-white">
        <CardElement options={cardElementOptions} />
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Your card will be authorized but not charged until driver confirms arrival
      </p>
    </div>
  );
};

export default PaymentPage;
