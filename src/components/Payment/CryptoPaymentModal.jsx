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
    // Get the final price (with VAT) - this is what will be charged
    if (service?.price_with_vat && service.price_with_vat > 0) {
      return service.price_with_vat;
    }
    if (service?.totalWithFee && service.totalWithFee > 0) {
      return service.totalWithFee;
    }
    if (service?.total_price && service.total_price > 0) {
      return service.total_price;
    }
    // Fallback to base price + VAT only (no platform fee)
    const basePrice = service?.price || service?.price_usd || service?.discounted_price || service?.base_price || 0;
    return Math.round(basePrice * 1.081); // Add VAT only (no platform fee)
  };

  // Get the base price (before VAT) for display
  const getBasePrice = () => {
    // If we have explicit base price, use it
    if (service?.base_price && service.base_price > 0) {
      return service.base_price;
    }
    if (service?.price_usd && service.price_usd > 0) {
      return service.price_usd;
    }
    if (service?.price && service.price > 0) {
      return service.price;
    }
    // Otherwise calculate from total by reversing VAT
    const totalPrice = getServicePrice();
    return Math.round(totalPrice / 1.081);
  };

  // Calculate VAT amount (8.1%)
  const getVatAmount = () => {
    const basePrice = getBasePrice();
    return Math.round(basePrice * 0.081);
  };

  const getServiceCurrency = () => {
    return service?.currency || 'USD';
  };

  // Auto-create payment and redirect when modal opens
  useEffect(() => {
    if (isOpen && !isLoading && !paymentUrl && !error) {
      setError(null);
      setEmail(user?.email || '');
      // Automatically start payment creation
      handleCreatePayment();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setPaymentUrl(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleConnectWallet = () => {
    openWalletModal();
  };

  const handleCreatePayment = async () => {
    // Use user email as default if available
    const paymentEmail = email || user?.email || '';

    setIsLoading(true);
    setError(null);

    try {
      console.log('Creating payment with:', {
        serviceType,
        serviceId: service.id,
        userId: user?.id,
        email: paymentEmail,
        walletAddress,
        service
      });

      // Check if we're in test mode (set VITE_COINGATE_TEST_MODE=true to enable)
      const isTestMode = import.meta.env.VITE_COINGATE_TEST_MODE === 'true';

      if (isTestMode) {
        console.log('🧪 DEV MODE: Simulating payment creation...');
        await new Promise(resolve => setTimeout(resolve, 500));

        const mockBookingId = `test-${Date.now()}`;
        const mockPaymentUrl = `https://sandbox.coingate.com/pay/${mockBookingId}`;

        // Direct redirect to CoinGate
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          window.location.href = mockPaymentUrl;
        } else {
          window.open(mockPaymentUrl, '_blank');
          onClose(); // Close modal after opening payment
        }
        return;
      }

      // Get Supabase config from environment - NO HARDCODED FALLBACKS
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
      }

      // Calculate the final price to send - use pre-calculated totalWithFee if available
      // VAT only (8.1%), no platform fee
      const finalPriceUSD = service?.totalWithFee || service?.price_with_vat || service?.total_price ||
        Math.round((service?.price_usd || service?.price || 0) * 1.081);

      console.log('=== SENDING TO COINGATE ===');
      console.log('service.totalWithFee:', service?.totalWithFee);
      console.log('service.price_usd:', service?.price_usd);
      console.log('service.price:', service?.price);
      console.log('Final price to send (USD):', finalPriceUSD);
      console.log('===========================');

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
            email: paymentEmail,
            walletAddress,
            contactName: user?.first_name ? `${user.first_name} ${user.last_name || ''}` : null,
            // Pass the pre-calculated USD price with fees
            priceUSD: finalPriceUSD,
            currency: 'USD',
            // Pass service details for the booking record - build title from route data
            serviceTitle: service?.title || service?.name || (() => {
              const from = service?.from_iata || service?.from_city || service?.origin || service?.departure_airport || service?.from;
              const to = service?.to_iata || service?.to_city || service?.destination || service?.arrival_airport || service?.to;
              return (from && to) ? `${from} → ${to}` : 'Private Charter';
            })(),
            serviceDescription: service?.description || `${service?.aircraft_type || service?.aircraft || 'Private'} flight`,
            serviceImageUrl: service?.imageUrl || service?.image_url
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

      // Direct redirect to CoinGate - no intermediate modal
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = result.paymentUrl;
      } else {
        window.open(result.paymentUrl, '_blank');
        onClose(); // Close modal after opening payment
      }

    } catch (err) {
      console.error('Payment creation error:', err);
      setError(err.message || 'Failed to create payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatPrice = (price, currency = 'USD') => {
    // Sanitize currency - handle invalid values like '$', '€', etc.
    let validCurrency = currency;
    if (!currency || currency.length !== 3 || /[^A-Za-z]/.test(currency)) {
      // Default to USD for invalid currency codes
      validCurrency = 'USD';
    }
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: validCurrency.toUpperCase(),
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price);
    } catch (e) {
      // Fallback if still invalid
      return `$${Number(price).toLocaleString()}`;
    }
  };

  const displayPrice = getServicePrice();
  const displayCurrency = getServiceCurrency();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Simple Loading Modal - Direct redirect to CoinGate */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          {/* Loading State */}
          {isLoading && !error && (
            <div className="text-center">
              <div className="relative mx-auto w-16 h-16 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                <div className="absolute inset-0 rounded-full border-4 border-black border-t-transparent animate-spin" />
                <div className="absolute inset-3 rounded-full bg-gray-100 flex items-center justify-center">
                  <Bitcoin className="w-6 h-6 text-black" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Opening CoinGate...</h3>
              <p className="text-gray-500 text-sm mb-4">Preparing your crypto payment</p>

              {/* Price Breakdown */}
              <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Price</span>
                  <span className="text-gray-900 font-medium">{formatPrice(getBasePrice(), displayCurrency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">VAT (8.1%)</span>
                  <span className="text-gray-900 font-medium">{formatPrice(getVatAmount(), displayCurrency)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="text-gray-900 font-semibold">Total</span>
                  <span className="text-black font-bold">{formatPrice(displayPrice, displayCurrency)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center">
              <div className="mx-auto w-16 h-16 mb-6 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Payment Error</h3>
              <p className="text-red-600 text-sm mb-6">{error}</p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setError(null);
                    handleCreatePayment();
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-900 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CryptoPaymentModal;
