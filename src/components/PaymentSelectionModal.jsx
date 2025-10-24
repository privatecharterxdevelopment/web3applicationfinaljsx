import React, { useState } from 'react';
import { X, CreditCard, Building2, Wallet, Clock } from 'lucide-react';

/**
 * Payment Selection Modal
 * Allows users to choose between bank transfer or crypto payment
 * For crypto payments, triggers wallet signature
 */
const PaymentSelectionModal = ({
  isOpen,
  onClose,
  onSelectPayment,
  cartTotal,
  cartItems,
  connectedWallet
}) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!selectedMethod) {
      alert('Please select a payment method');
      return;
    }

    setLoading(true);

    try {
      if (selectedMethod === 'crypto') {
        // For crypto, we'll need the wallet to be connected
        if (!connectedWallet) {
          alert('Please connect your wallet first to pay with crypto');
          setLoading(false);
          return;
        }

        // Trigger the payment selection with crypto
        await onSelectPayment(selectedMethod);
      } else {
        // Bank transfer - just confirm
        await onSelectPayment(selectedMethod);
      }
    } catch (error) {
      console.error('Payment selection error:', error);
      alert('Failed to process payment method selection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-2xl w-full p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Payment Method</h2>
          <p className="text-sm text-gray-600">
            Choose how you'd like to complete your booking of €{cartTotal.toLocaleString()}
          </p>
        </div>

        {/* Payment Options */}
        <div className="space-y-4 mb-8">
          {/* Bank Transfer Option */}
          <button
            onClick={() => setSelectedMethod('bank')}
            className={`w-full p-6 rounded-xl border-2 transition-all ${
              selectedMethod === 'bank'
                ? 'border-black bg-gray-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                selectedMethod === 'bank' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                <Building2 size={24} />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">Bank Transfer</h3>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                    <Clock size={12} />
                    1-3 days
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Traditional bank transfer. Payment instructions will be sent via email.
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  • Secure bank-to-bank transfer
                  <br />
                  • Processing time: 1-3 business days
                  <br />
                  • Confirmation required upon receipt
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === 'bank' ? 'border-black' : 'border-gray-300'
              }`}>
                {selectedMethod === 'bank' && (
                  <div className="w-3 h-3 rounded-full bg-black"></div>
                )}
              </div>
            </div>
          </button>

          {/* Crypto Payment Option */}
          <button
            onClick={() => setSelectedMethod('crypto')}
            className={`w-full p-6 rounded-xl border-2 transition-all ${
              selectedMethod === 'crypto'
                ? 'border-black bg-gray-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                selectedMethod === 'crypto' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                <Wallet size={24} />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">Cryptocurrency</h3>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    +50 currencies
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Pay with crypto. Signature required to confirm your booking request.
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  • BTC, ETH, USDC, USDT & 50+ currencies
                  <br />
                  • Instant payment confirmation
                  <br />
                  • Wallet signature required (no funds transfer at this stage)
                  <br />
                  {connectedWallet && (
                    <span className="text-green-600 font-medium">
                      ✓ Wallet connected: {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
                    </span>
                  )}
                  {!connectedWallet && (
                    <span className="text-orange-600 font-medium">
                      ⚠ Please connect wallet first
                    </span>
                  )}
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === 'crypto' ? 'border-black' : 'border-gray-300'
              }`}>
                {selectedMethod === 'crypto' && (
                  <div className="w-3 h-3 rounded-full bg-black"></div>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Cart Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Items</span>
            <span className="text-sm text-gray-600">{cartItems.length}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">€{cartTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedMethod || loading}
            className="flex-1 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Confirm & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSelectionModal;
