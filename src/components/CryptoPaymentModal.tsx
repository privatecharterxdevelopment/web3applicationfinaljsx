// src/components/CryptoPaymentModal.tsx
import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface CryptoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
  title: string;
  description?: string;
  orderId: string;
  userEmail?: string;
  userId?: string;
  serviceType?: 'empty_leg' | 'adventure_package' | 'co2_certificate';
  serviceId?: string;
  onSuccess: (transactionData: any) => void;
}

const SUPPORTED_CRYPTOS = [
  { code: 'BTC', name: 'Bitcoin', logo: '₿' },
  { code: 'ETH', name: 'Ethereum', logo: 'Ξ' },
  { code: 'USDC', name: 'USDC', logo: '$' },
  { code: 'LTC', name: 'Litecoin', logo: 'Ł' },
  { code: 'BCH', name: 'Bitcoin Cash', logo: 'BCH' },
  { code: 'SOL', name: 'Solana', logo: 'SOL' },
  { code: 'BNB', name: 'Binance Coin', logo: 'BNB' },
  { code: 'POL', name: 'Polygon', logo: 'POL' },
  { code: 'XRP', name: 'XRP', logo: 'XRP' },
  { code: 'TRX', name: 'TRON', logo: 'TRX' },
  { code: 'DOGE', name: 'Dogecoin', logo: 'Ð' },
];

export default function CryptoPaymentModal({
  isOpen,
  onClose,
  amount,
  currency,
  title,
  description,
  orderId,
  userEmail,
  userId,
  serviceType,
  serviceId,
  onSuccess,
}: CryptoPaymentModalProps) {
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handlePayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // Use Supabase Edge Function for payment creation
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase configuration');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/create-coingate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          serviceType: serviceType || 'adventure_package',
          serviceId: serviceId || orderId,
          userId: userId || 'anonymous',
          email: userEmail || 'guest@privatecharterx.com',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function error:', errorText);
        throw new Error(errorText || 'Failed to create payment order');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment');
      }

      // Save transaction data with CoinGate order details
      const transactionData = {
        coingate_order_id: result.coingateOrderId,
        order_id: result.bookingId,
        amount: result.priceBreakdown?.totalAmount || amount,
        currency: result.priceBreakdown?.currency || currency,
        crypto_currency: selectedCrypto,
        status: 'pending',
        payment_url: result.paymentUrl,
        created_at: new Date().toISOString(),
      };

      onSuccess(transactionData);

      // Detect if mobile and use appropriate redirect
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        // On mobile, redirect in the same window to avoid popup blockers
        window.location.href = result.paymentUrl;
      } else {
        // On desktop, open in new window
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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Choose payment method</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {/* Loading State */}
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-12">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-16 h-16 mb-3"
              >
                <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/videoExport-2025-10-19@11-32-10.850-540x540@60fps.mp4" type="video/mp4" />
              </video>
              <p className="text-sm text-gray-600">Opening wallet...</p>
            </div>
          ) : (
            <>
              {/* Amount Display - Compact */}
              <div className="mb-4 pb-3 border-b border-gray-100">
                <p className="text-xs text-gray-500 mb-0.5">Total Amount</p>
                <p className="text-xl font-bold text-gray-900">
                  {currency === 'EUR' ? '€' : '$'}{amount.toLocaleString()}
                </p>
              </div>

              {/* Crypto List - Scrollable */}
              <div className="mb-4 max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {SUPPORTED_CRYPTOS.map((crypto) => (
                  <button
                    key={crypto.code}
                    onClick={() => setSelectedCrypto(crypto.code)}
                    className={`w-full flex items-center justify-between p-3 border rounded-xl transition-all ${
                      selectedCrypto === crypto.code
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                        {crypto.logo}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">{crypto.name}</div>
                        <div className="text-xs text-gray-500">{crypto.code}</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
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

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3">
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}
