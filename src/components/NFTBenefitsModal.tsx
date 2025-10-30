import React, { useState } from 'react';
import { X, Check, Gift, Plane, Car, Star, Zap, Crown, Wallet, RefreshCw } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { web3Service } from '../lib/web3';
import type { NFTBenefit } from '../lib/web3';

interface NFTBenefitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft: NFTBenefit | null;
  hasNFT: boolean;
  usedBenefits?: {
    freeFlightUsed?: boolean;
    discountsUsed?: number;
  };
}

export default function NFTBenefitsModal({ isOpen, onClose, nft, hasNFT, usedBenefits = {} }: NFTBenefitsModalProps) {
  const { address, isConnected } = useAccount();
  const { open: openWallet } = useAppKit();
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleConnectWallet = () => {
    openWallet();
  };

  const handleRefresh = async () => {
    if (!address) return;

    setIsRefreshing(true);
    try {
      await web3Service.getUserNFTs(address as `0x${string}`);
      // Force a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      window.location.reload(); // Reload to refresh NFT state
    } catch (error) {
      console.error('Error refreshing NFTs:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const benefits = [
    {
      icon: Plane,
      title: 'Free Empty Leg Flight',
      desc: 'One complimentary flight',
      used: usedBenefits.freeFlightUsed,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      icon: Star,
      title: '10% Permanent Discount',
      desc: 'On all flights and services',
      used: false, // Always active
      color: 'text-purple-600 bg-purple-50'
    },
    {
      icon: Zap,
      title: 'Priority Access',
      desc: 'Early access to empty legs',
      used: false,
      color: 'text-yellow-600 bg-yellow-50'
    },
    {
      icon: Car,
      title: 'Free Transfers',
      desc: 'Complimentary limousine service',
      used: false,
      color: 'text-green-600 bg-green-50'
    },
    {
      icon: Crown,
      title: '24/7 VIP Support',
      desc: 'Dedicated concierge team',
      used: false,
      color: 'text-indigo-600 bg-indigo-50'
    },
    {
      icon: Gift,
      title: 'Exclusive Perks',
      desc: '$PVCX rewards & event invites',
      used: false,
      color: 'text-pink-600 bg-pink-50'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl animate-slideUp overflow-hidden">
        {/* Header */}
        <div className={`relative ${hasNFT ? 'bg-white border-b border-gray-200' : 'bg-white border-b border-gray-200'} p-6`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain"
              >
                <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/videoExport-2025-10-19@11-32-10.850-540x540@60fps.mp4" type="video/mp4" />
              </video>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {hasNFT ? 'NFT Membership Active!' : 'No NFT Membership Found'}
              </h2>
              <p className="text-gray-500 text-sm">
                {hasNFT
                  ? `${nft?.name} • Token #${nft?.tokenId}`
                  : 'Get your membership to unlock exclusive benefits'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {hasNFT ? (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Check size={20} className="text-gray-900 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      All Benefits Unlocked!
                    </p>
                    <p className="text-xs text-gray-600">
                      Your NFT membership gives you access to exclusive perks. Discounts are applied automatically at checkout.
                    </p>
                  </div>
                </div>
              </div>

              {/* Benefits Grid */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Your Active Benefits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {benefits.map((benefit, idx) => (
                    <div
                      key={idx}
                      className={`relative border rounded-xl p-4 transition-all ${
                        benefit.used
                          ? 'border-gray-200 bg-gray-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-gray-100">
                          <benefit.icon size={20} className="text-gray-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold text-gray-900">{benefit.title}</h4>
                            {benefit.used && (
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Used</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">{benefit.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              {usedBenefits.discountsUsed !== undefined && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Total Discounts Applied</p>
                      <p className="text-2xl font-bold text-gray-900">{usedBenefits.discountsUsed}</p>
                    </div>
                    <Star size={32} className="text-gray-400" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* No NFT - Show Wallet Connection or Refresh */}
              {!isConnected ? (
                <div className="mb-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6 text-center">
                    <Wallet size={48} className="mx-auto text-gray-600 mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Connect your wallet to check for NFT membership and unlock exclusive benefits
                    </p>
                    <button
                      onClick={handleConnectWallet}
                      className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
                    >
                      <Wallet size={18} />
                      Connect Wallet
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Wallet connected but no NFT - Show refresh button */}
                  <div className="mb-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet size={16} className="text-gray-600" />
                          <span className="text-sm text-gray-600">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                          </span>
                        </div>
                        <button
                          onClick={handleRefresh}
                          disabled={isRefreshing}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium disabled:opacity-50"
                        >
                          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                          {isRefreshing ? 'Checking...' : 'Refresh'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Show Benefits as Locked */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Unlock These Benefits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {benefits.map((benefit, idx) => (
                        <div
                          key={idx}
                          className="border border-gray-200 bg-gray-50 rounded-xl p-4 opacity-60"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-gray-100">
                              <benefit.icon size={20} className="text-gray-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-700 mb-1">{benefit.title}</h4>
                              <p className="text-xs text-gray-500">{benefit.desc}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <a
                    href="https://opensea.io/collection/privatecharterx-membership-card"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                    className="block w-full bg-black text-white text-center py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
                  >
                    Get Membership NFT on OpenSea →
                  </a>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>NFT Contract: 0xDF86...B339</span>
            <a
              href="https://basescan.org/address/0xDF86Cf55BD2E58aaaC09160AaD0ed8673382B339"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 underline"
            >
              View on BaseScan
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
