import React, { useState, useEffect } from 'react';
import {
  createEscrow,
  calculateFee,
  FEE_CLASSIC,
  FEE_MANAGED,
  getFeeTierLabel,
  connectWallet,
  checkNetwork,
  switchToCorrectNetwork,
  getCurrentAddress
} from '../../lib/escrow';

/**
 * EscrowPayment Component
 *
 * Allows users to create escrow payments with:
 * - Fee tier selection (Classic 1.5% or Managed 2.5%)
 * - Real-time fee calculation
 * - Wallet connection
 * - Network validation
 *
 * @param {Object} props
 * @param {string} props.sellerAddress - Seller's wallet address
 * @param {string} props.bookingId - Unique booking reference
 * @param {Function} props.onSuccess - Callback on successful escrow creation
 * @param {Function} props.onError - Callback on error
 */
export default function EscrowPayment({
  sellerAddress,
  bookingId,
  onSuccess,
  onError
}) {
  // State
  const [amount, setAmount] = useState('');
  const [feeTier, setFeeTier] = useState(FEE_CLASSIC);
  const [feeBreakdown, setFeeBreakdown] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [error, setError] = useState('');

  // Check wallet connection on mount
  useEffect(() => {
    checkWalletConnection();
  }, []);

  // Calculate fees when amount or fee tier changes
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      calculateFeeBreakdown();
    } else {
      setFeeBreakdown(null);
    }
  }, [amount, feeTier]);

  /**
   * Check if wallet is connected
   */
  async function checkWalletConnection() {
    try {
      if (!window.ethereum) {
        setError('Please install MetaMask or another Web3 wallet');
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        const network = await checkNetwork();
        setIsCorrectNetwork(network.isCorrect);
      }
    } catch (err) {
      console.error('Wallet check failed:', err);
    }
  }

  /**
   * Connect wallet
   */
  async function handleConnectWallet() {
    try {
      setIsLoading(true);
      setError('');

      const address = await connectWallet();
      setWalletAddress(address);

      const network = await checkNetwork();
      setIsCorrectNetwork(network.isCorrect);

      if (!network.isCorrect) {
        setError('Please switch to the correct network');
      }
    } catch (err) {
      setError(err.message);
      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Switch to correct network
   */
  async function handleSwitchNetwork() {
    try {
      setIsLoading(true);
      setError('');

      await switchToCorrectNetwork();
      setIsCorrectNetwork(true);
    } catch (err) {
      setError('Failed to switch network: ' + err.message);
      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Calculate fee breakdown
   */
  async function calculateFeeBreakdown() {
    try {
      const breakdown = await calculateFee(amount, feeTier);
      setFeeBreakdown(breakdown);
    } catch (err) {
      console.error('Fee calculation failed:', err);
      setFeeBreakdown(null);
    }
  }

  /**
   * Handle escrow creation
   */
  async function handleCreateEscrow(e) {
    e.preventDefault();

    if (!walletAddress) {
      setError('Please connect your wallet');
      return;
    }

    if (!isCorrectNetwork) {
      setError('Please switch to the correct network');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!sellerAddress) {
      setError('Seller address is required');
      return;
    }

    if (!bookingId) {
      setError('Booking ID is required');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const result = await createEscrow(
        sellerAddress,
        amount,
        feeTier,
        bookingId
      );

      onSuccess?.({
        escrowId: result.escrowId,
        txHash: result.txHash,
        amount: feeBreakdown.totalAmount,
        feeAmount: feeBreakdown.feeAmount,
        netAmount: feeBreakdown.netAmount
      });

    } catch (err) {
      console.error('Escrow creation failed:', err);
      const errorMessage = err.reason || err.message || 'Failed to create escrow';
      setError(errorMessage);
      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <h3 className="text-2xl font-bold text-white mb-6">Secure Escrow Payment</h3>

      {/* Wallet Connection */}
      {!walletAddress ? (
        <div className="text-center py-8">
          <p className="text-white/70 mb-4">Connect your wallet to create an escrow</p>
          <button
            onClick={handleConnectWallet}
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      ) : (
        <>
          {/* Wallet Info */}
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70">Connected Wallet</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isCorrectNetwork ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className={`text-sm ${isCorrectNetwork ? 'text-green-400' : 'text-red-400'}`}>
                  {isCorrectNetwork ? 'Correct Network' : 'Wrong Network'}
                </span>
              </div>
            </div>
            <p className="text-white font-mono text-sm">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </p>
            {!isCorrectNetwork && (
              <button
                onClick={handleSwitchNetwork}
                disabled={isLoading}
                className="mt-3 w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Switch to Correct Network
              </button>
            )}
          </div>

          {/* Payment Form */}
          <form onSubmit={handleCreateEscrow} className="space-y-6">
            {/* Amount Input */}
            <div>
              <label className="block text-white/90 font-medium mb-2">
                Amount (ETH)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50"
                disabled={isLoading || !isCorrectNetwork}
              />
            </div>

            {/* Fee Tier Selection */}
            <div>
              <label className="block text-white/90 font-medium mb-3">
                Protection Level
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* Classic Tier */}
                <button
                  type="button"
                  onClick={() => setFeeTier(FEE_CLASSIC)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    feeTier === FEE_CLASSIC
                      ? 'border-blue-400 bg-blue-500/20'
                      : 'border-white/20 bg-white/5 hover:border-white/40'
                  }`}
                  disabled={isLoading || !isCorrectNetwork}
                >
                  <div className="text-white font-semibold mb-1">Classic</div>
                  <div className="text-white/70 text-sm">1.5% fee</div>
                  <div className="text-white/50 text-xs mt-2">Basic escrow</div>
                </button>

                {/* Managed Tier */}
                <button
                  type="button"
                  onClick={() => setFeeTier(FEE_MANAGED)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    feeTier === FEE_MANAGED
                      ? 'border-purple-400 bg-purple-500/20'
                      : 'border-white/20 bg-white/5 hover:border-white/40'
                  }`}
                  disabled={isLoading || !isCorrectNetwork}
                >
                  <div className="text-white font-semibold mb-1">Managed</div>
                  <div className="text-white/70 text-sm">2.5% fee</div>
                  <div className="text-white/50 text-xs mt-2">With disputes</div>
                </button>
              </div>
            </div>

            {/* Fee Breakdown */}
            {feeBreakdown && (
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-white/20">
                <div className="text-white/90 font-medium mb-3">Payment Breakdown</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Amount</span>
                    <span className="text-white font-mono">{feeBreakdown.netAmount} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Platform Fee ({getFeeTierLabel(feeTier)})</span>
                    <span className="text-white font-mono">{feeBreakdown.feeAmount} ETH</span>
                  </div>
                  <div className="pt-2 border-t border-white/20">
                    <div className="flex justify-between font-semibold">
                      <span className="text-white">Total Payment</span>
                      <span className="text-white font-mono">{feeBreakdown.totalAmount} ETH</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Seller Info */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-white/70 text-sm mb-1">Seller Address</div>
              <div className="text-white font-mono text-sm break-all">
                {sellerAddress}
              </div>
            </div>

            {/* Booking ID */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-white/70 text-sm mb-1">Booking Reference</div>
              <div className="text-white font-mono text-sm">
                {bookingId}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isCorrectNetwork || !feeBreakdown}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Escrow...
                </span>
              ) : (
                'Create Secure Escrow'
              )}
            </button>

            {/* Info */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-white/80">
                  <p className="font-medium mb-1">Secure Escrow Protection</p>
                  <ul className="space-y-1 text-white/60">
                    <li>• Funds locked on-chain until service complete</li>
                    <li>• Release only when you approve</li>
                    <li>• {feeTier === FEE_MANAGED && 'Dispute resolution included'}</li>
                    <li>• Emergency exit after 180 days of inactivity</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
