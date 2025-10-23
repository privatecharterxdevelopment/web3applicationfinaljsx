import React, { useState } from 'react';
import { X, Wallet, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const PVCXWithdrawalModal = ({ user, balance, onClose }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [network, setNetwork] = useState('ethereum');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const validateWalletAddress = (address) => {
    // Basic Ethereum address validation (0x followed by 40 hex characters)
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!walletAddress.trim()) {
      setError('Please enter your wallet address');
      return;
    }

    if (!validateWalletAddress(walletAddress)) {
      setError('Invalid wallet address. Please enter a valid Ethereum address (0x...)');
      return;
    }

    const withdrawalAmount = parseFloat(amount);
    if (!withdrawalAmount || withdrawalAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (withdrawalAmount > balance) {
      setError(`Insufficient balance. You have ${balance.toFixed(3)} $PVCX available.`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create withdrawal request
      const { error: insertError } = await supabase
        .from('pvcx_withdrawal_requests')
        .insert({
          user_id: user.id,
          wallet_address: walletAddress.trim(),
          network: network,
          amount: withdrawalAmount,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // Update pending withdrawal in user balance
      const { error: updateError } = await supabase
        .from('user_pvcx_balances')
        .update({
          pending_withdrawal: withdrawalAmount,
          wallet_address: walletAddress.trim()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Create notification for admin (if notifications table exists)
      try {
        await supabase.from('notifications').insert({
          user_id: 'admin', // Replace with actual admin user ID
          type: 'pvcx_withdrawal_request',
          title: 'New PVCX Withdrawal Request',
          message: `User has requested withdrawal of ${withdrawalAmount} $PVCX to ${walletAddress.substring(0, 10)}...`,
          metadata: { userId: user.id, amount: withdrawalAmount, network: network },
          is_read: false,
          created_at: new Date().toISOString()
        });
      } catch (notifError) {
        // Ignore if notifications table doesn't exist
        console.log('Notification creation skipped:', notifError);
      }

      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Error submitting withdrawal request:', error);
      setError('Failed to submit withdrawal request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Withdrawal Request Submitted
          </h3>
          <p className="text-gray-600 mb-4">
            Our admin team will process your withdrawal request within 24-48 hours and send the tokens to your wallet.
          </p>
          <p className="text-sm text-gray-500">
            You will receive a notification once the tokens have been sent.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Withdraw $PVCX</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
          <Info size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <p className="font-semibold mb-1">Manual Processing</p>
            <p>
              Withdrawal requests are processed manually by our admin team within 24-48 hours.
              You'll receive tokens at the provided wallet address on your selected network.
            </p>
          </div>
        </div>

        {/* Balance Display */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {balance.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
              </p>
              <p className="text-sm text-gray-600">$PVCX</p>
            </div>
            <Wallet size={32} className="text-purple-600" />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Network Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Network *
            </label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="ethereum">Ethereum Mainnet</option>
              <option value="base">Base Network</option>
            </select>
          </div>

          {/* Wallet Address */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Wallet Address (ETH/Base) *
            </label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter your Ethereum or Base wallet address (starts with 0x)
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Amount *
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.000"
                step="0.001"
                min="0.001"
                max={balance}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setAmount(balance.toString())}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium text-purple-600 hover:text-purple-700"
              >
                MAX
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Maximum: {balance.toFixed(3)} $PVCX
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-800">{error}</p>
            </div>
          )}

          {/* Warning */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertTriangle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-800">
              Please double-check your wallet address. Tokens sent to an incorrect address cannot be recovered.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting Request...' : 'Submit Withdrawal Request'}
          </button>
        </form>

        {/* Footer Info */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            Processing time: 24-48 hours • No fees for withdrawals
          </p>
        </div>
      </div>
    </div>
  );
};

export default PVCXWithdrawalModal;
