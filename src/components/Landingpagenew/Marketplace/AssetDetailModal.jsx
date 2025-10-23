import React, { useState, useEffect } from 'react';
import {
  X, ExternalLink, Shield, TrendingUp, Users, Calendar,
  Info, CheckCircle, AlertCircle, DollarSign, Percent,
  FileText, Download
} from 'lucide-react';
import { useAuth } from '../../../../thefinalwebapplicationpcx-main/src/context/AuthContext';
import { useAccount } from 'wagmi';
import { purchaseSTOShares } from '../../../services/stoContractService';
import { supabase } from '../../../lib/supabase';

export default function AssetDetailModal({ asset, userKYCStatus, onClose, onRefresh }) {
  const { user } = useAuth();
  const { address: walletAddress, isConnected } = useAccount();

  const [investmentAmount, setInvestmentAmount] = useState(asset.minInvestment);
  const [calculatedShares, setCalculatedShares] = useState(0);
  const [purchaseStep, setPurchaseStep] = useState('calculator'); // 'calculator', 'confirm', 'processing', 'success'
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  useEffect(() => {
    calculateShares();
  }, [investmentAmount]);

  const calculateShares = () => {
    const shares = Math.floor(investmentAmount / asset.pricePerToken);
    setCalculatedShares(shares);
  };

  const handleInvestmentChange = (value) => {
    const numValue = parseFloat(value) || 0;
    if (numValue >= asset.minInvestment && numValue <= asset.totalValue) {
      setInvestmentAmount(numValue);
    }
  };

  const canPurchase = () => {
    if (!user) return { can: false, reason: 'Please log in to invest' };
    if (userKYCStatus !== 'verified') return { can: false, reason: 'KYC verification required' };
    if (!isConnected) return { can: false, reason: 'Connect your wallet' };
    if (investmentAmount < asset.minInvestment) return { can: false, reason: `Minimum investment: $${asset.minInvestment}` };
    if (calculatedShares > asset.availableTokens) return { can: false, reason: 'Not enough shares available' };
    return { can: true, reason: null };
  };

  const handlePurchase = async () => {
    const check = canPurchase();
    if (!check.can) {
      setError(check.reason);
      return;
    }

    setPurchaseStep('processing');
    setError(null);

    try {
      // Call mock smart contract (will be real tomorrow)
      const result = await purchaseSTOShares(
        asset.id,
        calculatedShares,
        investmentAmount,
        walletAddress
      );

      if (!result.success) {
        throw new Error(result.error || 'Transaction failed');
      }

      // Store investment in database
      const { error: dbError } = await supabase
        .from('sto_investments')
        .insert([{
          user_id: user.id,
          asset_id: asset.id,
          shares_purchased: calculatedShares,
          investment_amount: investmentAmount,
          wallet_address: walletAddress,
          transaction_hash: result.transactionHash,
          status: 'confirmed',
          created_at: new Date().toISOString()
        }]);

      if (dbError) throw dbError;

      setTxHash(result.transactionHash);
      setPurchaseStep('success');

      // Refresh marketplace data
      setTimeout(() => {
        onRefresh();
      }, 2000);

    } catch (err) {
      console.error('Purchase failed:', err);
      setError(err.message || 'Failed to complete purchase');
      setPurchaseStep('calculator');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const ownershipPercentage = ((calculatedShares / asset.totalSupply) * 100).toFixed(4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-colors shadow-lg"
        >
          <X size={20} className="text-gray-700" />
        </button>

        <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
          {/* Left Side - Asset Details */}
          <div className="lg:w-1/2 p-8 overflow-y-auto bg-gray-50">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-gray-900 text-white text-xs font-semibold rounded-full mb-3">
                {asset.tokenType}
              </span>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{asset.name}</h2>
              <p className="text-gray-600">{asset.description}</p>
            </div>

            {/* Asset Image */}
            {asset.images && asset.images.length > 0 && (
              <div className="mb-6 rounded-xl overflow-hidden">
                <img
                  src={asset.images[0]}
                  alt={asset.name}
                  className="w-full h-64 object-cover"
                />
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Total Value</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(asset.totalValue)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Price per Share</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(asset.pricePerToken)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Total Shares</p>
                <p className="text-lg font-bold text-gray-900">{asset.totalSupply}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Available</p>
                <p className="text-lg font-bold text-gray-900">{asset.availableTokens}</p>
              </div>
            </div>

            {/* Specifications */}
            {asset.specifications && Object.keys(asset.specifications).length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Specifications</h3>
                <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                  {Object.entries(asset.specifications).map(([key, value]) => (
                    <div key={key} className="px-4 py-3 flex justify-between">
                      <span className="text-sm text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-sm font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Owner Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">Asset Owner</p>
                  <p className="text-sm text-blue-800">{asset.owner.name}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Listed on {new Date(asset.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Investment Calculator & Purchase */}
          <div className="lg:w-1/2 p-8 overflow-y-auto bg-white">
            {purchaseStep === 'calculator' && (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Investment Calculator</h3>

                {/* Investment Amount Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Investment Amount (USD)
                  </label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={investmentAmount}
                      onChange={(e) => handleInvestmentChange(e.target.value)}
                      min={asset.minInvestment}
                      max={asset.totalValue}
                      step={100}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-lg font-semibold"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum: {formatCurrency(asset.minInvestment)} • Maximum: {formatCurrency(asset.totalValue)}
                  </p>
                </div>

                {/* Calculated Results */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Shares You'll Receive</span>
                      <span className="text-xl font-bold text-gray-900">{calculatedShares}</span>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Ownership Percentage</span>
                      <span className="text-lg font-semibold text-gray-900">{ownershipPercentage}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Investment</span>
                      <span className="text-xl font-bold text-gray-900">{formatCurrency(investmentAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* KYC Status Check */}
                {userKYCStatus !== 'verified' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Shield size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-yellow-900 mb-1">
                          KYC Verification Required
                        </p>
                        <p className="text-sm text-yellow-800 mb-3">
                          Complete identity verification to invest in this asset.
                        </p>
                        <button className="text-sm font-medium text-yellow-900 hover:text-yellow-700 underline">
                          Start Verification →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Wallet Connection Check */}
                {!isConnected && userKYCStatus === 'verified' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900 mb-1">
                          Connect Wallet
                        </p>
                        <p className="text-sm text-blue-800">
                          Connect your wallet to complete the purchase.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                {/* Purchase Button */}
                <button
                  onClick={handlePurchase}
                  disabled={!canPurchase().can}
                  className={`w-full px-6 py-4 rounded-lg font-semibold transition-all ${
                    canPurchase().can
                      ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {canPurchase().can ? 'Confirm Purchase' : canPurchase().reason}
                </button>

                {/* Legal Disclaimer */}
                <p className="text-xs text-gray-500 mt-4 text-center">
                  By proceeding, you agree to our Terms of Service and acknowledge the risks of investing in security tokens.
                </p>
              </>
            )}

            {purchaseStep === 'processing' && (
              <div className="flex flex-col items-center justify-center h-full py-20">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Transaction</h3>
                <p className="text-gray-600 text-center">
                  Please wait while we confirm your purchase on the blockchain...
                </p>
              </div>
            )}

            {purchaseStep === 'success' && (
              <div className="flex flex-col items-center justify-center h-full py-20">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle size={48} className="text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Purchase Successful!</h3>
                <p className="text-gray-600 text-center mb-6">
                  You now own {calculatedShares} shares of {asset.name}
                </p>

                {txHash && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 w-full">
                    <p className="text-xs text-gray-500 mb-2">Transaction Hash</p>
                    <a
                      href={`https://basescan.org/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-mono text-blue-600 hover:text-blue-700"
                    >
                      {txHash.slice(0, 10)}...{txHash.slice(-8)}
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
