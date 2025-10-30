import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { web3Service } from '../lib/web3';
import type { NFTBenefit } from '../lib/web3';

interface NFTContextType {
  hasNFT: boolean;
  nftDiscount: number;
  nfts: NFTBenefit[];
  isCheckingNFT: boolean;
  checkNFTMembership: () => Promise<void>;
  showNFTModal: boolean;
  openNFTModal: () => void;
  closeNFTModal: () => void;
  usedBenefits: {
    freeFlightUsed: boolean;
    discountsUsed: number;
  };
  markFreeFlightUsed: () => void;
  incrementDiscountUsage: () => void;
}

const NFTContext = createContext<NFTContextType | undefined>(undefined);

export function NFTProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const [hasNFT, setHasNFT] = useState(false);
  const [nftDiscount, setNftDiscount] = useState(0);
  const [nfts, setNfts] = useState<NFTBenefit[]>([]);
  const [isCheckingNFT, setIsCheckingNFT] = useState(false);
  const [showNFTModal, setShowNFTModal] = useState(false);
  const [usedBenefits, setUsedBenefits] = useState({
    freeFlightUsed: false,
    discountsUsed: 0
  });

  // Auto-check NFT when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      checkNFTMembership(false); // Silent check on connect
    } else {
      // Reset when disconnected
      setHasNFT(false);
      setNftDiscount(0);
      setNfts([]);
    }
  }, [isConnected, address]);

  // Load benefit usage from localStorage
  useEffect(() => {
    if (address) {
      const stored = localStorage.getItem(`nft_benefits_${address}`);
      if (stored) {
        try {
          setUsedBenefits(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to load benefit usage:', e);
        }
      }
    }
  }, [address]);

  const checkNFTMembership = async (showModal = true) => {
    if (!isConnected || !address) {
      if (showModal) {
        setShowNFTModal(true); // Show modal to prompt wallet connection
      }
      return;
    }

    setIsCheckingNFT(true);
    try {
      const eligibility = await web3Service.checkDiscountEligibility(address as `0x${string}`);
      setHasNFT(eligibility.hasDiscount);
      setNftDiscount(eligibility.discountPercent);

      if (eligibility.hasDiscount) {
        const nftData = await web3Service.getUserNFTs(address as `0x${string}`);
        setNfts(nftData);
      }

      if (showModal) {
        setShowNFTModal(true);
      }
    } catch (error) {
      console.error('Error checking NFT:', error);
      setHasNFT(false);
      setNftDiscount(0);
      setNfts([]);
    } finally {
      setIsCheckingNFT(false);
    }
  };

  const openNFTModal = () => setShowNFTModal(true);
  const closeNFTModal = () => setShowNFTModal(false);

  const markFreeFlightUsed = () => {
    if (!address) return;
    const newBenefits = { ...usedBenefits, freeFlightUsed: true };
    setUsedBenefits(newBenefits);
    localStorage.setItem(`nft_benefits_${address}`, JSON.stringify(newBenefits));
  };

  const incrementDiscountUsage = () => {
    if (!address) return;
    const newBenefits = { ...usedBenefits, discountsUsed: usedBenefits.discountsUsed + 1 };
    setUsedBenefits(newBenefits);
    localStorage.setItem(`nft_benefits_${address}`, JSON.stringify(newBenefits));
  };

  return (
    <NFTContext.Provider
      value={{
        hasNFT,
        nftDiscount,
        nfts,
        isCheckingNFT,
        checkNFTMembership,
        showNFTModal,
        openNFTModal,
        closeNFTModal,
        usedBenefits,
        markFreeFlightUsed,
        incrementDiscountUsage
      }}
    >
      {children}
    </NFTContext.Provider>
  );
}

export function useNFT() {
  const context = useContext(NFTContext);
  if (context === undefined) {
    throw new Error('useNFT must be used within NFTProvider');
  }
  return context;
}
