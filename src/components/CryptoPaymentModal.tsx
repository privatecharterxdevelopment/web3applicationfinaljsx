// src/components/CryptoPaymentModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { coinGateService, type CreateOrderParams } from '../services/coingate';

interface CryptoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
  title: string;
  description?: string;
  orderId: string;
  userEmail?: string;
  onSuccess: (transactionData: any) => void;
}

const SUPPORTED_CRYPTOS = [
  { code: 'BTC', name: 'Bitcoin', logo: '₿' },
  { code: 'ETH', name: 'Ethereum', logo: 'Ξ' },
  { code: 'USDT', name: 'Tether (ERC20)', logo: '₮' },
  { code: 'USDC', name: 'USD Coin', logo: '$' },
  { code: 'LTC', name: 'Litecoin', logo: 'Ł' },
  { code: 'BCH', name: 'Bitcoin Cash', logo: 'BCH' },
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
      // Create CoinGate order
      const orderParams: CreateOrderParams = {
        price_amount: amount,
        price_currency: currency,
        receive_currency: selectedCrypto,
        title: title,
        description: description || '',
        order_id: orderId,
        purchaser_email: userEmail,
        success_url: `${window.location.origin}/dashboard`,
        cancel_url: `${window.location.origin}/dashboard`,
        callback_url: `${window.location.origin}/api/coingate-callback`,
      };

      const order = await coinGateService.createOrder(orderParams);

      // Save transaction data
      const transactionData = {
        coingate_order_id: order.id,
        order_id: orderId,
        amount: amount,
        currency: currency,
        crypto_currency: selectedCrypto,
        status: order.status,
        payment_url: order.payment_url,
        created_at: order.created_at,
      };

      onSuccess(transactionData);

      // Redirect to CoinGate payment page
      window.open(order.payment_url, '_blank');
      onClose();

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment service temporarily unavailable. Please try again later.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Choose payment method</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Amount Display */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900">
              {currency === 'EUR' ? '€' : '$'}{amount.toLocaleString()}
            </p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>

          {/* Crypto List */}
          <div className="space-y-2 mb-6">
            {SUPPORTED_CRYPTOS.map((crypto) => (
              <button
                key={crypto.code}
                onClick={() => setSelectedCrypto(crypto.code)}
                className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all ${
                  selectedCrypto === crypto.code
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-700">
                    {crypto.logo}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">{crypto.name}</div>
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

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isProcessing && (
            <div className="flex flex-col items-center justify-center py-8 mb-4">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-20 h-20 mb-3"
              >
                <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/videoExport-2025-10-19@11-32-10.850-540x540@60fps.mp4" type="video/mp4" />
              </video>
              <p className="text-sm text-gray-600">Opening wallet...</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Continue'}
            </button>
          </div>

          {/* Security Notice */}
          <p className="text-xs text-gray-500 text-center mt-4">
            🔒 Secured by CoinGate
          </p>
        </div>
      </div>
    </div>
  );
}
