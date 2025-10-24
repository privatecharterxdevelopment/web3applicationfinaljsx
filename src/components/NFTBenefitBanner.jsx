import React, { useState, useEffect } from 'react';
import { Shield, ExternalLink, Wallet, Check, Gift, Sparkles } from 'lucide-react';
import { useAccount } from 'wagmi';
import { web3Service } from '../lib/web3';

const NFTBenefitBanner = ({ 
  item, 
  onNFTVerified, 
  onConnect,
  connectedWallet,
  hasNFT,
  benefitUsed 
}) => {
  const { address, isConnected } = useAccount();
  const [checking, setChecking] = useState(false);
  const [nftDetails, setNftDetails] = useState(null);
  const [canUseDiscount, setCanUseDiscount] = useState(false);

  // Check eligibility: Price <= $1500 (€1500)
  const isEligible = () => {
    const price = item.price_eur || item.price || item.hourly_rate_eur || item.daily_rate_eur || 0;
    return price > 0 && price <= 1500;
  };

  // Check if this item type is eligible (empty legs, cars, etc)
  const isEligibleType = () => {
    const type = item.type || item.serviceType;
    return ['empty_legs', 'luxury_cars', 'cars', 'helicopters'].includes(type);
  };

  const shouldShowBanner = isEligible() && isEligibleType();

  // Check NFT when wallet connects
  useEffect(() => {
    const checkNFT = async () => {
      if (!isConnected || !address || checking) return;
      
      setChecking(true);
      try {
        const nfts = await web3Service.getUserNFTs(address);
        
        if (nfts && nfts.length > 0) {
          setNftDetails(nfts[0]);
          setCanUseDiscount(!benefitUsed);
          onNFTVerified?.(true, nfts[0]);
        } else {
          setCanUseDiscount(false);
          onNFTVerified?.(false, null);
        }
      } catch (error) {
        console.error('NFT check failed:', error);
        setCanUseDiscount(false);
      } finally {
        setChecking(false);
      }
    };

    if (shouldShowBanner && isConnected && address) {
      checkNFT();
    }
  }, [isConnected, address, shouldShowBanner]);

  if (!shouldShowBanner) return null;

  // Already has NFT and can use benefit
  if (hasNFT && canUseDiscount && !benefitUsed) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 mb-4 animate-pulse-slow">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Gift size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-green-900">NFT Benefit Available! </h3>
              <Sparkles size={16} className="text-green-600" />
            </div>
            <p className="text-sm text-green-800 mb-2">
              This service is <strong>FREE</strong> with your PrivateCharterX NFT membership! 
              Your annual benefit will be applied at checkout.
            </p>
            <div className="flex items-center gap-2 text-xs text-green-700">
              <Check size={14} />
              <span>NFT Verified • One free service annually (up to €1,500)</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Has NFT but already used benefit
  if (hasNFT && benefitUsed) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
            <Shield size={20} className="text-gray-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">NFT Benefit Used</h3>
            <p className="text-sm text-gray-600">
              You've already used your annual free service benefit. It resets on your membership anniversary date.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Not connected or checking
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Shield size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-1">NFT Members: Get This FREE!</h3>
          <p className="text-sm text-blue-800 mb-3">
            PrivateCharterX NFT holders get one complimentary service annually (up to €1,500). 
            This qualifies!
          </p>
          
          {checking ? (
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Checking your wallet for NFT...
            </div>
          ) : !isConnected ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={onConnect}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Wallet size={16} />
                Connect Wallet to Verify NFT
              </button>
              <a
                href="https://opensea.io/collection/privatecharterx-membership-card"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <img 
                  src="https://opensea.io/static/images/logos/opensea-logo.svg" 
                  alt="OpenSea"
                  className="w-4 h-4"
                />
                Buy NFT on OpenSea
                <ExternalLink size={14} />
              </a>
            </div>
          ) : (
            <div className="text-sm text-blue-700">
              No NFT found in your wallet. 
              <a
                href="https://opensea.io/collection/privatecharterx-membership-card"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 underline hover:text-blue-900 inline-flex items-center gap-1"
              >
                Get one on OpenSea
                <ExternalLink size={12} />
              </a>
            </div>
          )}

          {/* NFT Benefits List */}
          <details className="mt-3">
            <summary className="text-xs text-blue-700 cursor-pointer hover:text-blue-900">
              View NFT Membership Benefits
            </summary>
            <ul className="mt-2 text-xs text-blue-700 space-y-1 ml-4">
              <li>• One free service annually (up to €1,500)</li>
              <li>• 10% permanent discount on all bookings</li>
              <li>• Priority access to empty leg flights</li>
              <li>• Complimentary limousine transfers</li>
              <li>• 24/7 VIP support</li>
              <li>• PVCX token rewards</li>
              <li>• Exclusive event invitations</li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
};

export default NFTBenefitBanner;
