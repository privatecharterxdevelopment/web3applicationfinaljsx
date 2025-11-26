import React, { useState, useEffect } from 'react';
import { X, Loader2, Bitcoin, Wallet, ExternalLink, Check, AlertCircle, Sparkles, Plane, Users, Calendar, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

// Crypto icons as SVG components - monochromatic style
const CryptoIcons = {
  BTC: () => (
    <svg viewBox="0 0 32 32" className="w-8 h-8">
      <circle cx="16" cy="16" r="16" fill="#1a1a1a"/>
      <path fill="#fff" d="M22.5 14.5c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.7 2.7c-.4-.1-.8-.2-1.3-.3l.7-2.7-1.6-.4-.7 2.7c-.4-.1-.7-.2-1.1-.3l-2.2-.5-.5 1.7s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.2c.1 0 .1 0 .2.1-.1 0-.1 0-.2-.1l-1.1 4.5c-.1.2-.3.5-.8.4 0 0-1.2-.3-1.2-.3l-.8 1.8 2.1.5c.4.1.8.2 1.2.3l-.7 2.8 1.6.4.7-2.7c.4.1.9.2 1.3.3l-.7 2.7 1.6.4.7-2.8c2.9.5 5.1.3 6-2.3.7-2.1 0-3.3-1.5-4.1 1.1-.2 1.9-1 2.1-2.5z"/>
    </svg>
  ),
  ETH: () => (
    <svg viewBox="0 0 32 32" className="w-8 h-8">
      <circle cx="16" cy="16" r="16" fill="#1a1a1a"/>
      <path fill="#fff" fillOpacity=".6" d="M16 4v8.9l7.5 3.3z"/>
      <path fill="#fff" d="M16 4L8.5 16.2l7.5-3.3z"/>
      <path fill="#fff" fillOpacity=".6" d="M16 21.5v6.5l7.5-10.4z"/>
      <path fill="#fff" d="M16 28v-6.5l-7.5-3.9z"/>
      <path fill="#fff" fillOpacity=".2" d="M16 20.4l7.5-4.2-7.5-3.3z"/>
      <path fill="#fff" fillOpacity=".6" d="M8.5 16.2l7.5 4.2v-7.5z"/>
    </svg>
  ),
  USDC: () => (
    <svg viewBox="0 0 32 32" className="w-8 h-8">
      <circle cx="16" cy="16" r="16" fill="#1a1a1a"/>
      <path fill="#fff" d="M16 6.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zm-.3 15.8v1.2h-.8v-1.2c-1.6-.2-2.6-1-2.8-2.3h1.4c.2.7.7 1.1 1.7 1.1.9 0 1.4-.4 1.4-1 0-.5-.3-.8-1.2-1l-1.1-.3c-1.4-.3-2.1-1-2.1-2.2 0-1.2.9-2 2.4-2.2v-1.2h.8v1.2c1.4.2 2.3 1 2.5 2.2h-1.4c-.1-.6-.6-1-1.4-1-.8 0-1.3.4-1.3.9 0 .5.3.8 1.1.9l1.2.3c1.5.3 2.2 1 2.2 2.2 0 1.3-1 2.1-2.6 2.3z"/>
    </svg>
  ),
  USDT: () => (
    <svg viewBox="0 0 32 32" className="w-8 h-8">
      <circle cx="16" cy="16" r="16" fill="#1a1a1a"/>
      <path fill="#fff" d="M17.9 17.1v-.1c-.1 0-.7-.1-1.9-.1-1 0-1.7.1-1.9.1v.1c-3.3.2-5.8.9-5.8 1.7 0 .8 2.5 1.5 5.8 1.7v5.5h3.8v-5.5c3.3-.2 5.8-.9 5.8-1.7s-2.5-1.5-5.8-1.7zm-1.9 2.8c-3.1 0-5.6-.5-5.6-1.1s2.5-1.1 5.6-1.1 5.6.5 5.6 1.1-2.5 1.1-5.6 1.1z"/>
      <path fill="#fff" d="M17.9 14.3v-2.4h4.8V8h-13v3.9h4.8v2.4c-3.7.2-6.5 1-6.5 2s2.8 1.8 6.5 2v7.2h3.8v-7.2c3.7-.2 6.5-1 6.5-2s-2.8-1.8-6.9-2z"/>
    </svg>
  ),
  LTC: () => (
    <svg viewBox="0 0 32 32" className="w-8 h-8">
      <circle cx="16" cy="16" r="16" fill="#1a1a1a"/>
      <path fill="#fff" d="M11.5 22.5l1-4-2 .8.5-2 2-.8 2-8h4l-1.5 6 2-.8-.5 2-2 .8-1 4h6l-.5 2z"/>
    </svg>
  )
};

const CryptoPaymentModal = ({ isOpen, onClose, service, serviceType, onSuccess }) => {
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const { open: openWalletModal } = useAppKit();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [priceBreakdown, setPriceBreakdown] = useState(null);
  const [email, setEmail] = useState(user?.email || '');
  const [step, setStep] = useState('details'); // 'details' | 'processing' | 'redirect' | 'success'

  // Get wallet address from connected wallet
  const walletAddress = address || '';

  // Extract service details with fallbacks
  const getServiceTitle = () => {
    if (service?.title) return service.title;
    if (service?.name) return service.name;

    // Build title from departure/arrival
    const from = service?.origin || service?.departure_airport || service?.from;
    const to = service?.destination || service?.arrival_airport || service?.to;
    if (from && to) return `${from} → ${to}`;

    return 'Private Charter Service';
  };

  const getServiceDescription = () => {
    if (service?.description) return service.description;
    if (service?.aircraft_type || service?.aircraft) {
      return `${service.aircraft_type || service.aircraft}`;
    }
    return serviceType === 'empty_leg' ? 'Empty Leg Flight' : 'Private Charter';
  };

  const getServiceDetails = () => {
    const details = [];

    // Aircraft
    const aircraft = service?.aircraft_type || service?.aircraft;
    if (aircraft) details.push({ icon: Plane, label: aircraft });

    // Passengers
    const pax = service?.max_passengers || service?.passengers || service?.pax;
    if (pax) details.push({ icon: Users, label: `Up to ${pax} passengers` });

    // Date
    const date = service?.departure_date || service?.date;
    if (date) {
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      details.push({ icon: Calendar, label: formattedDate });
    }

    return details;
  };

  const getServicePrice = () => {
    return service?.price || service?.price_usd || service?.discounted_price || service?.base_price || 0;
  };

  const getServiceCurrency = () => {
    return service?.currency || 'USD';
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('details');
      setError(null);
      setPaymentUrl(null);
      setEmail(user?.email || '');
    }
  }, [isOpen, user]);

  const handleConnectWallet = () => {
    openWalletModal();
  };

  const handleCreatePayment = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep('processing');

    try {
      console.log('Creating payment with:', {
        serviceType,
        serviceId: service.id,
        userId: user?.id,
        email,
        walletAddress,
        service
      });

      // Check if we're in test mode (set VITE_COINGATE_TEST_MODE=true to enable)
      const isTestMode = import.meta.env.VITE_COINGATE_TEST_MODE === 'true';

      if (isTestMode) {
        console.log('🧪 DEV MODE: Simulating payment creation...');
        await new Promise(resolve => setTimeout(resolve, 1500));

        const mockBookingId = `test-${Date.now()}`;
        const basePrice = getServicePrice();
        const platformFee = basePrice * 0.025;
        const coingateFee = basePrice * 0.01;
        const totalAmount = basePrice + platformFee + coingateFee;

        setPaymentUrl(`https://sandbox.coingate.com/pay/${mockBookingId}`);
        setPriceBreakdown({
          basePrice,
          platformFee,
          coingateFee,
          totalAmount,
          currency: getServiceCurrency(),
          pvcxReward: totalAmount * 0.015
        });
        setStep('redirect');
        return;
      }

      // Get Supabase config from environment - NO HARDCODED FALLBACKS
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/create-coingate-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`
          },
          body: JSON.stringify({
            serviceType: serviceType || service.type,
            serviceId: service.id,
            userId: user?.id,
            email,
            walletAddress,
            contactName: user?.first_name ? `${user.first_name} ${user.last_name || ''}` : null
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function error:', response.status, errorText);
        throw new Error(`Server error (${response.status}): ${errorText || 'Edge function not deployed or unavailable'}`);
      }

      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (!responseText) {
        throw new Error('Empty response from server. Please ensure the Edge Function is deployed.');
      }

      const result = JSON.parse(responseText);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment');
      }

      setPaymentUrl(result.paymentUrl);
      setPriceBreakdown(result.priceBreakdown);
      setStep('redirect');

      // Auto-redirect after showing the URL
      setTimeout(() => {
        window.open(result.paymentUrl, '_blank');
      }, 2000);

    } catch (err) {
      console.error('Payment creation error:', err);
      setError(err.message || 'Failed to create payment. Please try again.');
      setStep('details');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatPrice = (price, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const serviceDetails = getServiceDetails();
  const displayPrice = getServicePrice();
  const displayCurrency = getServiceCurrency();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - Monochromatic Design */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-black px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Bitcoin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Pay with Crypto</h2>
                <p className="text-white/60 text-sm">Secure payment via CoinGate</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Service Info Card */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-4">
              {(service?.image_url || service?.image || service?.aircraft_image) ? (
                <img
                  src={service.image_url || service.image || service.aircraft_image}
                  alt={getServiceTitle()}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-black flex items-center justify-center">
                  <Plane className="w-8 h-8 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">
                  {getServiceTitle()}
                </h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  {getServiceDescription()}
                </p>

                {/* Service Details */}
                {serviceDetails.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-2">
                    {serviceDetails.map((detail, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-xs text-gray-600">
                        <detail.icon className="w-3.5 h-3.5" />
                        <span>{detail.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xl font-bold text-black mt-2">
                  {formatPrice(displayPrice, displayCurrency)}
                </p>
              </div>
            </div>
          </div>

          {/* Step: Details */}
          {step === 'details' && (
            <>
              {/* Email Input */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Email for receipt
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-all"
                />
              </div>

              {/* Wallet Connection for PVCX Rewards */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Wallet for PVCX Rewards
                  <span className="text-gray-400 font-normal ml-2">(Base Network)</span>
                </label>

                {isConnected && walletAddress ? (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-800">Wallet Connected</p>
                      <p className="text-xs text-green-600 font-mono truncate">
                        {walletAddress}
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectWallet}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-black hover:bg-gray-100 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">Connect Wallet</p>
                        <p className="text-xs text-gray-500">To receive 1.5% PVCX rewards</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                  </button>
                )}
              </div>

              {/* Supported Cryptos */}
              <div className="mb-6">
                <p className="text-gray-700 text-sm font-medium mb-3">Supported cryptocurrencies</p>
                <div className="flex gap-2 justify-center">
                  {['BTC', 'ETH', 'USDC', 'USDT', 'LTC'].map((crypto) => {
                    const Icon = CryptoIcons[crypto];
                    return (
                      <div
                        key={crypto}
                        className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <Icon />
                        <span className="text-gray-600 text-xs font-medium">{crypto}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PVCX Reward Banner */}
              <div className="mb-6 p-4 rounded-xl bg-black text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/10">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">Earn 1.5% in $PVCX Rewards</p>
                    <p className="text-white/60 text-sm">
                      ~{formatPrice(displayPrice * 0.015, displayCurrency)} worth of $PVCX tokens
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Pay Button */}
              <button
                onClick={handleCreatePayment}
                disabled={isLoading || !email}
                className="w-full py-4 rounded-xl bg-black text-white font-bold text-lg hover:bg-gray-900 transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
              >
                <Bitcoin className="w-5 h-5" />
                Continue to Payment
              </button>

              {/* Fee Info */}
              <p className="text-gray-400 text-xs text-center mt-4">
                Platform fee: 2.5% • Processing fee: 1% • Powered by CoinGate
              </p>
            </>
          )}

          {/* Step: Processing */}
          {step === 'processing' && (
            <div className="py-12 text-center">
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                <div className="absolute inset-0 rounded-full border-4 border-black border-t-transparent animate-spin" />
                <div className="absolute inset-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Bitcoin className="w-6 h-6 text-black" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Creating Payment...</h3>
              <p className="text-gray-500">Please wait while we set up your crypto payment</p>
            </div>
          )}

          {/* Step: Redirect */}
          {step === 'redirect' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Ready!</h3>
              <p className="text-gray-500 mb-6">You will be redirected to complete your payment</p>

              {/* Price Breakdown */}
              {priceBreakdown && (
                <div className="mb-6 p-4 rounded-xl bg-gray-50 text-left">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Base Price</span>
                      <span className="text-gray-900 font-medium">{formatPrice(priceBreakdown.basePrice, priceBreakdown.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Platform Fee (2.5%)</span>
                      <span className="text-gray-900">{formatPrice(priceBreakdown.platformFee, priceBreakdown.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Processing Fee (1%)</span>
                      <span className="text-gray-900">{formatPrice(priceBreakdown.coingateFee, priceBreakdown.currency)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-black">{formatPrice(priceBreakdown.totalAmount, priceBreakdown.currency)}</span>
                    </div>
                    {walletAddress && (
                      <div className="border-t border-gray-200 pt-2 flex justify-between text-green-600">
                        <span>PVCX Reward</span>
                        <span className="font-medium">+{formatPrice(priceBreakdown.totalAmount * 0.015, priceBreakdown.currency)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {paymentUrl && (
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white font-bold hover:bg-gray-900 transition-all"
                >
                  <ExternalLink className="w-5 h-5" />
                  Open Payment Page
                </a>
              )}

              <p className="text-gray-400 text-xs mt-4">
                Complete the payment on CoinGate to confirm your booking
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CryptoPaymentModal;
