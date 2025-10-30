// src/components/CryptoPaymentModal.tsx
import React, { useState } from 'react';
import { X, Loader2, ExternalLink, CheckCircle, AlertCircle, Coins } from 'lucide-react';
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
  { code: 'BTC', name: 'Bitcoin', icon: '₿', color: 'text-orange-500' },
  { code: 'ETH', name: 'Ethereum', icon: 'Ξ', color: 'text-blue-500' },
  { code: 'USDT', name: 'Tether', icon: '₮', color: 'text-green-500' },
  { code: 'USDC', name: 'USD Coin', icon: '$', color: 'text-blue-400' },
  { code: 'LTC', name: 'Litecoin', icon: 'Ł', color: 'text-gray-400' },
  { code: 'BCH', name: 'Bitcoin Cash', icon: 'BCH', color: 'text-green-600' },
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
  const [paymentUrl, setPaymentUrl] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'select' | 'processing' | 'redirect'>('select');

  if (!isOpen) return null;

  const handlePayment = async () => {
    setIsProcessing(true);
    setError('');
    setStep('processing');

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
        success_url: `${window.location.origin}/payment-success?order=${orderId}`,
        cancel_url: `${window.location.origin}/payment-cancel?order=${orderId}`,
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

      setPaymentUrl(order.payment_url);
      setStep('redirect');

      // Redirect to CoinGate payment page
      setTimeout(() => {
        window.open(order.payment_url, '_blank');
      }, 1500);

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to create payment. Please try again.');
      setStep('select');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl animate-slideUp overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-black to-gray-900 text-white p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <div className="flex items-center gap-3">
            <Coins size={32} className="text-white" />
            <div>
              <h2 className="text-2xl font-bold">Pay with Cryptocurrency</h2>
              <p className="text-white/80 text-sm mt-1">Secure & Fast Payment</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 'select' && (
            <>
              {/* Amount Display */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-4xl font-bold text-gray-900">
                  {currency === 'EUR' ? '€' : '$'}{amount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-2">{title}</p>
                {description && (
                  <p className="text-xs text-gray-400 mt-1">{description}</p>
                )}
              </div>

              {/* Crypto Selection */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  Select Cryptocurrency
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {SUPPORTED_CRYPTOS.map((crypto) => (
                    <button
                      key={crypto.code}
                      onClick={() => setSelectedCrypto(crypto.code)}
                      className={`relative border-2 rounded-xl p-4 transition-all ${
                        selectedCrypto === crypto.code
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`text-3xl mb-2 ${selectedCrypto === crypto.code ? 'text-white' : crypto.color}`}>
                          {crypto.icon}
                        </div>
                        <div className={`text-xs font-semibold ${selectedCrypto === crypto.code ? 'text-white' : 'text-gray-900'}`}>
                          {crypto.name}
                        </div>
                        <div className={`text-xs ${selectedCrypto === crypto.code ? 'text-white/70' : 'text-gray-500'}`}>
                          {crypto.code}
                        </div>
                      </div>
                      {selectedCrypto === crypto.code && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle size={20} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">Payment Error</p>
                    <p className="text-xs text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Pay {currency === 'EUR' ? '€' : '$'}{amount.toLocaleString()} with {selectedCrypto}</>
                )}
              </button>

              {/* Security Notice */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  🔒 Secured by CoinGate • Your payment is processed securely
                </p>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-32 h-32 mb-6"
              >
                <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/videoExport-2025-10-19@11-32-10.850-540x540@60fps.mp4" type="video/mp4" />
              </video>
              <p className="text-lg font-semibold text-gray-900 mb-2">
                Creating Payment Order...
              </p>
              <p className="text-sm text-gray-600">Please wait while we prepare your payment</p>
            </div>
          )}

          {step === 'redirect' && (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle size={64} className="text-green-600 mb-6" />
              <p className="text-lg font-semibold text-gray-900 mb-2">
                Payment Page Opening...
              </p>
              <p className="text-sm text-gray-600 mb-6 text-center">
                You will be redirected to complete your payment
              </p>
              {paymentUrl && (
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all"
                >
                  Open Payment Page
                  <ExternalLink size={18} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
