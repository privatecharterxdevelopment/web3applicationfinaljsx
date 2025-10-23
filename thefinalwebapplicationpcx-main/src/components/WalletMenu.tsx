import React, { useState, useEffect, useRef, memo } from 'react';
import { Wallet, ChevronDown, LogOut, ExternalLink, X, FileText, Check, Copy, AlertTriangle, Info, Leaf, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { web3Service } from '../lib/web3';
import type { NFTBenefit } from '../lib/web3';
import Portal from './Portal';

interface WalletMenuProps {
  onConnect: () => void;
  iconOnly?: boolean;
}

// CO2 Certificate type
interface CO2Certificate {
  tokenId: string;
  name: string;
  description?: string;
  image?: string;
  carbonOffset?: string;
  issuer?: string;
}

// Success Popup
function NFTSuccessPopup({ isOpen, onClose, nft }: {
  isOpen: boolean;
  onClose: () => void;
  nft?: NFTBenefit;
}) {
  if (!isOpen || !nft) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">NFT Detected!</h3>
          <p className="text-sm text-gray-600 mb-4">
            {nft.name} found in your wallet. All benefits are now unlocked!
          </p>
          <button
            onClick={onClose}
            className="w-full bg-green-600 text-white rounded-lg py-3 text-sm font-medium"
          >
            Awesome!
          </button>
        </div>
      </div>
    </div>
  );
}

// CO2 Success Popup
function CO2SuccessPopup({ isOpen, onClose, certificates }: {
  isOpen: boolean;
  onClose: () => void;
  certificates: CO2Certificate[];
}) {
  if (!isOpen || certificates.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Leaf size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">CO2 Certificates Found!</h3>
          <p className="text-sm text-gray-600 mb-4">
            {certificates.length} CO2 certificate{certificates.length > 1 ? 's' : ''} detected in your wallet.
            Your carbon offset contributions are verified!
          </p>
          <button
            onClick={onClose}
            className="w-full bg-green-600 text-white rounded-lg py-3 text-sm font-medium"
          >
            Great!
          </button>
        </div>
      </div>
    </div>
  );
}

// Terms Modal
function TermsModal({ isOpen, onClose, onAccept }: {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}) {
  const [accepted, setAccepted] = useState(false);

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Terms & Conditions</h3>
              <button onClick={onClose} className="p-1">
                <X size={16} className="text-gray-400" />
              </button>
            </div>
          </div>

          <div className="p-6 max-h-64 overflow-y-auto">
            <div className="space-y-3 text-sm text-gray-600">
              <p><strong>Wallet Access:</strong> Read NFT holdings and display wallet address</p>
              <p><strong>Security:</strong> We cannot access private keys or funds</p>
              <p><strong>Benefits:</strong> NFT holders receive exclusive privileges</p>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setAccepted(!accepted)}
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  accepted ? 'bg-gray-900 border-gray-900' : 'border-gray-300'
                  }`}
              >
                {accepted && <Check size={10} className="text-white" />}
              </button>
              <span className="text-sm text-gray-600">I agree to the terms</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={onAccept}
                disabled={!accepted}
                className={`flex-1 py-2 text-sm font-medium rounded-lg ${
                  accepted ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                  }`}
              >
                Accept & Connect
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}

// Network Info Banner - Non-intrusive notification
function NetworkInfoBanner({ chain, onSwitchNetwork }: {
  chain: any;
  onSwitchNetwork: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || chain?.id === 8453) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-start gap-3">
        <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-blue-800">
            <strong>Network Notice:</strong> You're connected to {chain?.name || 'Unknown Network'}.
            To use NFT membership benefits, switch to Base Network.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={onSwitchNetwork}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
            >
              Switch to Base
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-400 hover:text-blue-600 flex-shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// Session storage keys
const STORAGE_KEYS = {
  TERMS_ACCEPTED: 'pcx_terms_accepted',
  CO2_TOGGLE: 'pcx_co2_toggle'
};


function WalletMenu({ onConnect, iconOnly = false }: WalletMenuProps) {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showCO2Popup, setShowCO2Popup] = useState(false);
  const [balance, setBalance] = useState<string>('0.0000');
  const [nfts, setNfts] = useState<NFTBenefit[]>([]);
  const [co2Certificates, setCO2Certificates] = useState<CO2Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingNFT, setCheckingNFT] = useState(false);
  const [checkingCO2, setCheckingCO2] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCO2Section, setShowCO2Section] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CO2_TOGGLE) === 'true';
    } catch {
      return false;
    }
  });

  // Track previous connection state to detect new connections
  const prevIsConnected = useRef(isConnected);
  const prevAddress = useRef(address);

  // Helper to check if on Base network
  const isOnBaseNetwork = chain?.id === 8453;

  // Check if terms were accepted this session
  const getTermsAcceptedThisSession = () => {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.TERMS_ACCEPTED) === 'true';
    } catch {
      return false;
    }
  };

  // Set terms accepted for this session
  const setTermsAcceptedThisSession = (accepted: boolean) => {
    try {
      if (accepted) {
        sessionStorage.setItem(STORAGE_KEYS.TERMS_ACCEPTED, 'true');
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.TERMS_ACCEPTED);
      }
    } catch {
      // Fallback if sessionStorage is not available
    }
  };

  // Toggle CO2 section
  const toggleCO2Section = () => {
    const newValue = !showCO2Section;
    setShowCO2Section(newValue);
    try {
      localStorage.setItem(STORAGE_KEYS.CO2_TOGGLE, newValue.toString());
    } catch {
      // Fallback if localStorage is not available
    }
  };


  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside desktop menu
      const isOutsideDesktopMenu = menuRef.current && !menuRef.current.contains(event.target as Node);
      
      // Check if click is outside mobile menu
      const isOutsideMobileMenu = mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node);
      
      // Only close if click is outside both menus (or if the respective menu doesn't exist)
      if (isOutsideDesktopMenu && (!mobileMenuRef.current || isOutsideMobileMenu)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isConnected && address) {
      loadWalletData();

      // Only check NFTs if on Base network
      if (isOnBaseNetwork) {
        // Never show popup on connection - only check silently
        checkNFTStatus(false);
        checkCO2Certificates(false);
      } else {
        // Clear NFTs if not on Base network
        setNfts([]);
        setCO2Certificates([]);
      }

      onConnect();
    } else {
      setBalance('0.0000');
      setNfts([]);
      setCO2Certificates([]);
    }

    // Update refs for next comparison
    prevIsConnected.current = isConnected;
    prevAddress.current = address;
  }, [isConnected, address, chain?.id]);

  const loadWalletData = async () => {
    if (!address) return;

    setLoading(true);
    try {
      // Always try to get balance regardless of network
      const balanceResult = await web3Service.getBalance(address as `0x${string}`);
      setBalance(balanceResult);
    } catch (error) {
      console.error('Failed to load balance:', error);
      setBalance('0.0000');
    } finally {
      setLoading(false);
    }
  };

  const checkNFTStatus = async (shouldShowPopup: boolean = false) => {
    if (!address || !isOnBaseNetwork) {
      console.log('Not checking NFTs - not on Base network');
      return;
    }

    setCheckingNFT(true);
    try {
      console.log('🔍 Checking NFTs for address:', address);

      // Try both methods to ensure we get real data
      let nftResult = [];

      try {
        // First try the Alchemy method directly
        console.log('📡 Trying Alchemy API...');
        nftResult = await web3Service.getUserNFTsViaAlchemy(address as `0x${string}`);
        console.log('✅ Alchemy result:', nftResult);
      } catch (alchemyError) {
        console.log('❌ Alchemy failed:', alchemyError);

        // Fallback to contract method
        console.log('🔗 Trying contract method...');
        nftResult = await web3Service.getUserNFTsViaContract(address as `0x${string}`);
        console.log('✅ Contract result:', nftResult);
      }

      if (nftResult.length > 0) {
        // Log detailed token information
        nftResult.forEach((nft, index) => {
          console.log(`🎫 NFT ${index + 1}:`, {
            tokenId: nft.tokenId,
            name: nft.name,
            collection: nft.collection,
            discountPercent: nft.discountPercent
          });
        });

        setNfts(nftResult);

        // Only show success popup if:
        // 1. This is a new connection/wallet switch OR manual refresh
        // 2. AND NFTs were found
        if (shouldShowPopup) {
          setShowSuccessPopup(true);
        }

      } else {
        console.log('❌ No NFTs found for this address');
        setNfts([]);
      }
    } catch (error) {
      console.error('💥 NFT check completely failed:', error);
      setNfts([]);
    } finally {
      setCheckingNFT(false);
    }
  };

  const checkCO2Certificates = async (shouldShowPopup: boolean = false) => {
    if (!address || !isOnBaseNetwork) {
      console.log('Not checking CO2 certificates - not on Base network');
      return;
    }

    setCheckingCO2(true);
    try {
      console.log('🌱 Checking CO2 certificates for address:', address);

      // Use web3Service to get CO2 certificates
      const co2Result = await web3Service.getUserCO2Certificates(address as `0x${string}`);

      if (co2Result.length > 0) {
        console.log(`🌱 Found ${co2Result.length} CO2 certificate(s)`);
        setCO2Certificates(co2Result);

        if (shouldShowPopup) {
          setShowCO2Popup(true);
        }
      } else {
        console.log('❌ No CO2 certificates found for this address');
        setCO2Certificates([]);
      }
    } catch (error) {
      console.error('💥 CO2 certificate check failed:', error);
      setCO2Certificates([]);
    } finally {
      setCheckingCO2(false);
    }
  };

  const handleConnectClick = () => {
    if (!getTermsAcceptedThisSession()) {
      setShowTerms(true);
      return;
    }
    open();
  };

  const handleTermsAccept = () => {
    setTermsAcceptedThisSession(true);
    setShowTerms(false);
    setTimeout(() => open(), 100);
  };

  const handleDisconnect = async () => {
    try {
      disconnect();
      setIsOpen(false);
      setTermsAcceptedThisSession(false);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleSwitchToBase = () => {
    // Open wallet modal to let user switch networks
    open({ view: 'Networks' });
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getNetworkDisplayName = () => {
    if (!chain) return 'Unknown';
    if (chain.id === 8453) return 'Base';
    if (chain.id === 1) return 'Ethereum';
    return chain.name || `Network ${chain.id}`;
  };

  // Handle manual refresh - this will check NFTs and potentially show popup
  const handleManualRefresh = () => {
    if (isOnBaseNetwork && address) {
      checkNFTStatus(true); // Pass true to indicate this is a manual refresh
      if (showCO2Section) {
        checkCO2Certificates(true);
      }
    }
  };

  // Icon-only mode for header
  if (iconOnly) {
    return (
      <>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => {
              if (!isConnected) {
                handleConnectClick();
              } else {
                setIsOpen(!isOpen);
              }
            }}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 border border-gray-200 rounded-md hover:border-gray-300 relative"
          >
            <Wallet size={20} />
            <div className={`absolute -top-1 -right-1 w-3 h-3 border-2 border-white rounded-full ${
              isConnected 
                ? (isOnBaseNetwork ? 'bg-green-500' : 'bg-yellow-500')
                : 'bg-orange-500'
            }`}></div>
          </button>
          
          {isConnected && isOpen && (
            <>
              {/* Desktop Dropdown */}
              <div className="hidden md:block absolute right-0 top-full mt-2 w-screen max-w-2xl lg:max-w-4xl bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Wallet</h3>
                      <p className="text-sm text-gray-500">
                        {balance} ETH on {getNetworkDisplayName()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={copyAddress}
                        className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                      >
                        <span className="font-mono text-xs tracking-wider">
                          {web3Service.formatAddress(address!)}
                        </span>
                        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                      </button>
                      <button
                        onClick={handleDisconnect}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                      >
                        <LogOut size={16} />
                      </button>
                    </div>
                  </div>

                  <NetworkInfoBanner
                    chain={chain}
                    onSwitchNetwork={handleSwitchToBase}
                  />

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-medium text-gray-900">VIP Membership</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                          {isOnBaseNetwork ? (nfts.length > 0 ? '1 owned' : 'None owned') : 'Switch to Base to check'}
                        </span>
                        {isOnBaseNetwork && (
                          <button
                            onClick={handleManualRefresh}
                            disabled={checkingNFT || checkingCO2}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors disabled:opacity-50"
                          >
                            {(checkingNFT || checkingCO2) ? (
                              <>
                                <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                Checking...
                              </>
                            ) : (
                              <>
                                <div className="w-3 h-3 border border-gray-400 rounded-full"></div>
                                Refresh
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                        <span className="ml-2 text-sm text-gray-500">Loading...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <video
                              className="w-full h-48 rounded-lg object-cover"
                              autoPlay
                              loop
                              muted
                              playsInline
                            >
                              <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivateCharterX_transparent-_3_.mp4" type="video/mp4" />
                            </video>
                            <div className="mt-3">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">
                                  {isOnBaseNetwork && nfts.length > 0 ? nfts[0].name : 'PCX Membership Card'}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  isOnBaseNetwork && nfts.length > 0 
                                  ? 'bg-green-500 text-white'
                                  : !isOnBaseNetwork
                                    ? 'bg-gray-300 text-gray-500'
                                    : 'bg-gray-300 text-gray-500'
                                  }`}>
                                  {isOnBaseNetwork && nfts.length > 0 ? '✓ OWNED' : '10% OFF'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {isOnBaseNetwork && nfts.length > 0
                                  ? `Token #${nfts[0].tokenId} • Verified Owner`
                                  : 'VIP Membership • Limited (001-100)'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <h5 className={`text-sm font-medium mb-3 ${
                              isOnBaseNetwork && nfts.length > 0 ? 'text-gray-900' : 'text-gray-400'
                              }`}>
                              {isOnBaseNetwork && nfts.length > 0 ? 'Your Active Benefits' : 'Unlock with NFT Purchase'}
                            </h5>

                            <div className="grid grid-cols-2 gap-2">
                              {[
                                'Free Empty Leg Flight',
                                'Up to 10% Permanent Discount',
                                'Priority Empty Leg Access',
                                'Limousine Transfers (CH)',
                                '24/7 Priority Support',
                                'Early Token Access',
                                '$PVCX Token Rewards',
                                'VIP Event Invitations'
                              ].map((benefit, idx) => (
                                <div
                                  key={idx}
                                  className={`text-xs px-3 py-2 rounded-md font-medium transition-all ${
                                    isOnBaseNetwork && nfts.length > 0 
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                                    }`}
                                >
                                  {isOnBaseNetwork && nfts.length > 0 && <span className="mr-1">✓</span>}
                                  {benefit}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-gray-100">
                            {isOnBaseNetwork && nfts.length > 0 ? (
                              <a
                                href="https://opensea.io/collection/privatecharterx-membership-card"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                              >
                                View on OpenSea
                                <ExternalLink size={12} />
                              </a>
                            ) : (
                              <a
                                href="https://opensea.io/collection/privatecharterx-membership-card"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors w-full justify-center"
                              >
                                Buy NFT to Unlock
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CO2 Certificates Section */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h4 className="text-base font-medium text-gray-900 flex items-center gap-2">
                          <Leaf size={16} className="text-green-600" />
                          CO2 Certificates
                        </h4>
                        <button
                          onClick={toggleCO2Section}
                          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showCO2Section ? (
                            <ToggleRight size={20} className="text-green-600" />
                          ) : (
                            <ToggleLeft size={20} className="text-gray-400" />
                          )}
                          <span className="text-sm">
                            {showCO2Section ? 'Hide' : 'Show'}
                          </span>
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                          {isOnBaseNetwork && showCO2Section
                            ? `${co2Certificates.length} owned`
                            : showCO2Section
                              ? 'Switch to Base to check'
                              : 'Hidden'
                          }
                        </span>
                        {isOnBaseNetwork && showCO2Section && (
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        )}
                      </div>
                    </div>

                    {showCO2Section && (
                      <div className="space-y-4">
                        {!isOnBaseNetwork ? (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                            <p className="text-sm text-blue-800 mb-2">
                              Switch to Base network to view your CO2 certificates
                            </p>
                            <button
                              onClick={handleSwitchToBase}
                              className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                            >
                              Switch to Base
                            </button>
                          </div>
                        ) : checkingCO2 ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                            <span className="ml-2 text-sm text-gray-500">Checking CO2 certificates...</span>
                          </div>
                        ) : co2Certificates.length > 0 ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {co2Certificates.map((cert, idx) => (
                              <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h6 className="font-medium text-green-800 text-sm">{cert.name}</h6>
                                    <p className="text-xs text-green-600 mt-1">
                                      Token #{cert.tokenId} • {cert.issuer}
                                    </p>
                                  </div>
                                  <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                                    VERIFIED
                                  </span>
                                </div>

                                {cert.image && (
                                  <div className="w-full h-24 bg-gray-100 rounded-md mb-3 overflow-hidden">
                                    <img
                                      src={cert.image}
                                      alt={cert.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}

                                <div className="space-y-2">
                                  {cert.description && (
                                    <p className="text-xs text-green-700">{cert.description}</p>
                                  )}
                                  {cert.carbonOffset && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-green-800">Carbon Offset:</span>
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                        {cert.carbonOffset}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-6 text-center">
                            <Leaf size={32} className="text-gray-400 mx-auto mb-3" />
                            <h6 className="text-sm font-medium text-gray-600 mb-2">No CO2 Certificates Found</h6>
                            <p className="text-xs text-gray-500 mb-4">
                              Purchase flights or services with carbon offset to receive verified CO2 certificates
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile Modal */}
              <Portal>
                <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start pt-16">
                  <div ref={mobileMenuRef} className="bg-white rounded-b-2xl w-full max-h-[85vh] overflow-y-auto animate-in slide-in-from-top duration-300">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Wallet</h3>
                          <p className="text-sm text-gray-500">
                            {balance} ETH on {getNetworkDisplayName()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={copyAddress}
                            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <span className="font-mono text-xs tracking-wider">
                              {web3Service.formatAddress(address!)}
                            </span>
                            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                          </button>
                          <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>

                      <NetworkInfoBanner
                        chain={chain}
                        onSwitchNetwork={handleSwitchToBase}
                      />

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-base font-medium text-gray-900">VIP Membership</h4>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">
                              {isOnBaseNetwork ? (nfts.length > 0 ? '1 owned' : 'None owned') : 'Switch to Base to check'}
                            </span>
                            {isOnBaseNetwork && (
                              <button
                                onClick={handleManualRefresh}
                                disabled={checkingNFT || checkingCO2}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors disabled:opacity-50"
                              >
                                {(checkingNFT || checkingCO2) ? (
                                  <>
                                    <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    Checking...
                                  </>
                                ) : (
                                  <>
                                    <div className="w-3 h-3 border border-gray-400 rounded-full"></div>
                                    Refresh
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                            <span className="ml-2 text-sm text-gray-500">Loading...</span>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="space-y-4">
                              <div className="bg-gray-50 rounded-lg p-4">
                                <video
                                  className="w-full h-48 rounded-lg object-cover"
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                >
                                  <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivateCharterX_transparent-_3_.mp4" type="video/mp4" />
                                </video>
                                <div className="mt-3">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-900">
                                      {isOnBaseNetwork && nfts.length > 0 ? nfts[0].name : 'PCX Membership Card'}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      isOnBaseNetwork && nfts.length > 0 
                                        ? 'bg-green-500 text-white'
                                        : !isOnBaseNetwork
                                          ? 'bg-gray-300 text-gray-500'
                                          : 'bg-gray-300 text-gray-500'
                                        }`}>
                                      {isOnBaseNetwork && nfts.length > 0 ? '✓ OWNED' : '10% OFF'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {isOnBaseNetwork && nfts.length > 0
                                      ? `Token #${nfts[0].tokenId} • Verified Owner`
                                      : 'VIP Membership • Limited (001-100)'
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <h5 className={`text-sm font-medium mb-3 ${
                                  isOnBaseNetwork && nfts.length > 0 ? 'text-gray-900' : 'text-gray-400'
                                  }`}>
                                  {isOnBaseNetwork && nfts.length > 0 ? 'Your Active Benefits' : 'Unlock with NFT Purchase'}
                                </h5>

                                <div className="grid grid-cols-1 gap-2">
                                  {[
                                    'Free Empty Leg Flight',
                                    'Up to 10% Permanent Discount',
                                    'Priority Empty Leg Access',
                                    'Limousine Transfers (CH)',
                                    '24/7 Priority Support',
                                    'Early Token Access',
                                    '$PVCX Token Rewards',
                                    'VIP Event Invitations'
                                  ].map((benefit, idx) => (
                                    <div
                                      key={idx}
                                      className={`text-xs px-3 py-2 rounded-md font-medium transition-all ${
                                        isOnBaseNetwork && nfts.length > 0 
                                          ? 'bg-green-50 text-green-700 border border-green-200'
                                          : 'bg-gray-100 text-gray-400 border border-gray-200'
                                          }`}
                                    >
                                      {isOnBaseNetwork && nfts.length > 0 && <span className="mr-1">✓</span>}
                                      {benefit}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="pt-3 border-t border-gray-100">
                                {isOnBaseNetwork && nfts.length > 0 ? (
                                  <a
                                    href="https://opensea.io/collection/privatecharterx-membership-card"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                  >
                                    View on OpenSea
                                    <ExternalLink size={12} />
                                  </a>
                                ) : (
                                  <a
                                    href="https://opensea.io/collection/privatecharterx-membership-card"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors w-full justify-center"
                                  >
                                    Buy NFT to Unlock
                                    <ExternalLink size={14} />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CO2 Certificates Section */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <h4 className="text-base font-medium text-gray-900 flex items-center gap-2">
                              <Leaf size={16} className="text-green-600" />
                              CO2 Certificates
                            </h4>
                            <button
                              onClick={toggleCO2Section}
                              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              {showCO2Section ? (
                                <ToggleRight size={20} className="text-green-600" />
                              ) : (
                                <ToggleLeft size={20} className="text-gray-400" />
                              )}
                              <span className="text-sm">
                                {showCO2Section ? 'Hide' : 'Show'}
                              </span>
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">
                              {isOnBaseNetwork && showCO2Section
                                ? `${co2Certificates.length} owned`
                                : showCO2Section
                                  ? 'Switch to Base to check'
                                  : 'Hidden'
                              }
                            </span>
                            {isOnBaseNetwork && showCO2Section && (
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            )}
                          </div>
                        </div>

                        {showCO2Section && (
                          <div className="space-y-4">
                            {!isOnBaseNetwork ? (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                <p className="text-sm text-blue-800 mb-2">
                                  Switch to Base network to view your CO2 certificates
                                </p>
                                <button
                                  onClick={handleSwitchToBase}
                                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                  Switch to Base
                                </button>
                              </div>
                            ) : checkingCO2 ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                                <span className="ml-2 text-sm text-gray-500">Checking CO2 certificates...</span>
                              </div>
                            ) : co2Certificates.length > 0 ? (
                              <div className="space-y-4">
                                {co2Certificates.map((cert, idx) => (
                                  <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <h6 className="font-medium text-green-800 text-sm">{cert.name}</h6>
                                        <p className="text-xs text-green-600 mt-1">
                                          Token #{cert.tokenId} • {cert.issuer}
                                        </p>
                                      </div>
                                      <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                                        VERIFIED
                                      </span>
                                    </div>

                                    {cert.image && (
                                      <div className="w-full h-24 bg-gray-100 rounded-md mb-3 overflow-hidden">
                                        <img
                                          src={cert.image}
                                          alt={cert.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}

                                    <div className="space-y-2">
                                      {cert.description && (
                                        <p className="text-xs text-green-700">{cert.description}</p>
                                      )}
                                      {cert.carbonOffset && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-medium text-green-800">Carbon Offset:</span>
                                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                            {cert.carbonOffset}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-gray-50 rounded-lg p-6 text-center">
                                <Leaf size={32} className="text-gray-400 mx-auto mb-3" />
                                <h6 className="text-sm font-medium text-gray-600 mb-2">No CO2 Certificates Found</h6>
                                <p className="text-xs text-gray-500 mb-4">
                                  Purchase flights or services with carbon offset to receive verified CO2 certificates
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <button
                          onClick={handleDisconnect}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <LogOut size={16} />
                          Disconnect Wallet
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Portal>
            </>
          )}
        </div>
        
        <TermsModal
          isOpen={showTerms}
          onClose={() => setShowTerms(false)}
          onAccept={handleTermsAccept}
        />
        
        <NFTSuccessPopup
          isOpen={showSuccessPopup}
          onClose={() => setShowSuccessPopup(false)}
          nft={nfts[0]}
        />

        <CO2SuccessPopup
          isOpen={showCO2Popup}
          onClose={() => setShowCO2Popup(false)}
          certificates={co2Certificates}
        />
      </>
    );
  }

  if (!isConnected) {
    return (
      <>
        <button
          onClick={handleConnectClick}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <Wallet size={16} />
          </div>
          Connect
        </button>

        <TermsModal
          isOpen={showTerms}
          onClose={() => setShowTerms(false)}
          onAccept={handleTermsAccept}
        />
      </>
    );
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isOnBaseNetwork ? 'bg-green-500 animate-pulse' : 'bg-orange-500'
              }`}></div>
            <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center">
              <Wallet size={12} className="text-white" />
            </div>
          </div>
          <span className="text-gray-900">{web3Service.formatAddress(address!)}</span>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            {/* Desktop Dropdown */}
            <div className="hidden md:block absolute right-0 top-full mt-2 w-screen max-w-2xl lg:max-w-4xl bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Wallet</h3>
                    <p className="text-sm text-gray-500">
                      {balance} ETH on {getNetworkDisplayName()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={copyAddress}
                      className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <span className="font-mono text-xs tracking-wider">
                        {web3Service.formatAddress(address!)}
                      </span>
                      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </button>
                    <button
                      onClick={handleDisconnect}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                </div>

                {/* Network Info Banner - only show if not on Base */}
                <NetworkInfoBanner
                  chain={chain}
                  onSwitchNetwork={handleSwitchToBase}
                />

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-medium text-gray-900">VIP Membership</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {isOnBaseNetwork ? (nfts.length > 0 ? '1 owned' : 'None owned') : 'Switch to Base to check'}
                      </span>
                      {isOnBaseNetwork && (
                        <button
                          onClick={handleManualRefresh}
                          disabled={checkingNFT || checkingCO2}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors disabled:opacity-50"
                        >
                          {(checkingNFT || checkingCO2) ? (
                            <>
                              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                              Checking...
                            </>
                          ) : (
                            <>
                              <div className="w-3 h-3 border border-gray-400 rounded-full"></div>
                              Refresh
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      <span className="ml-2 text-sm text-gray-500">Loading...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <video
                            className="w-full h-48 rounded-lg object-cover"
                            autoPlay
                            loop
                            muted
                            playsInline
                          >
                            <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivateCharterX_transparent-_3_.mp4" type="video/mp4" />
                          </video>
                          <div className="mt-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">
                                {isOnBaseNetwork && nfts.length > 0 ? nfts[0].name : 'PCX Membership Card'}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                isOnBaseNetwork && nfts.length > 0 
                                ? 'bg-green-500 text-white'
                                : !isOnBaseNetwork
                                  ? 'bg-gray-300 text-gray-500'
                                  : 'bg-gray-300 text-gray-500'
                                }`}>
                                {isOnBaseNetwork && nfts.length > 0 ? '✓ OWNED' : '10% OFF'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {isOnBaseNetwork && nfts.length > 0
                                ? `Token #${nfts[0].tokenId} • Verified Owner`
                                : 'VIP Membership • Limited (001-100)'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h5 className={`text-sm font-medium mb-3 ${
                            isOnBaseNetwork && nfts.length > 0 ? 'text-gray-900' : 'text-gray-400'
                            }`}>
                            {isOnBaseNetwork && nfts.length > 0 ? 'Your Active Benefits' : 'Unlock with NFT Purchase'}
                          </h5>

                          <div className="grid grid-cols-2 gap-2">
                            {[
                              'Free Empty Leg Flight',
                              'Up to 10% Permanent Discount',
                              'Priority Empty Leg Access',
                              'Limousine Transfers (CH)',
                              '24/7 Priority Support',
                              'Early Token Access',
                              '$PVCX Token Rewards',
                              'VIP Event Invitations'
                            ].map((benefit, idx) => (
                              <div
                                key={idx}
                                className={`text-xs px-3 py-2 rounded-md font-medium transition-all ${
                                  isOnBaseNetwork && nfts.length > 0 
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : 'bg-gray-100 text-gray-400 border border-gray-200'
                                  }`}
                              >
                                {isOnBaseNetwork && nfts.length > 0 && <span className="mr-1">✓</span>}
                                {benefit}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100">
                          {isOnBaseNetwork && nfts.length > 0 ? (
                            <a
                              href="https://opensea.io/collection/privatecharterx-membership-card"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            >
                              View on OpenSea
                              <ExternalLink size={12} />
                            </a>
                          ) : (
                            <a
                              href="https://opensea.io/collection/privatecharterx-membership-card"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors w-full justify-center"
                            >
                              Buy NFT to Unlock
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CO2 Certificates Section */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h4 className="text-base font-medium text-gray-900 flex items-center gap-2">
                        <Leaf size={16} className="text-green-600" />
                        CO2 Certificates
                      </h4>
                      <button
                        onClick={toggleCO2Section}
                        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {showCO2Section ? (
                          <ToggleRight size={20} className="text-green-600" />
                        ) : (
                          <ToggleLeft size={20} className="text-gray-400" />
                        )}
                        <span className="text-sm">
                          {showCO2Section ? 'Hide' : 'Show'}
                        </span>
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {isOnBaseNetwork && showCO2Section
                          ? `${co2Certificates.length} owned`
                          : showCO2Section
                            ? 'Switch to Base to check'
                            : 'Hidden'
                        }
                      </span>
                      {isOnBaseNetwork && showCO2Section && (
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      )}
                    </div>
                  </div>

                  {showCO2Section && (
                    <div className="space-y-4">
                      {!isOnBaseNetwork ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                          <p className="text-sm text-blue-800 mb-2">
                            Switch to Base network to view your CO2 certificates
                          </p>
                          <button
                            onClick={handleSwitchToBase}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                          >
                            Switch to Base
                          </button>
                        </div>
                      ) : checkingCO2 ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                          <span className="ml-2 text-sm text-gray-500">Checking CO2 certificates...</span>
                        </div>
                      ) : co2Certificates.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {co2Certificates.map((cert, idx) => (
                            <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h6 className="font-medium text-green-800 text-sm">{cert.name}</h6>
                                  <p className="text-xs text-green-600 mt-1">
                                    Token #{cert.tokenId} • {cert.issuer}
                                  </p>
                                </div>
                                <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                                  VERIFIED
                                </span>
                              </div>

                              {cert.image && (
                                <div className="w-full h-24 bg-gray-100 rounded-md mb-3 overflow-hidden">
                                  <img
                                    src={cert.image}
                                    alt={cert.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}

                              <div className="space-y-2">
                                {cert.description && (
                                  <p className="text-xs text-green-700">{cert.description}</p>
                                )}
                                {cert.carbonOffset && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-green-800">Carbon Offset:</span>
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                      {cert.carbonOffset}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-6 text-center">
                          <Leaf size={32} className="text-gray-400 mx-auto mb-3" />
                          <h6 className="text-sm font-medium text-gray-600 mb-2">No CO2 Certificates Found</h6>
                          <p className="text-xs text-gray-500 mb-4">
                            Purchase flights or services with carbon offset to receive verified CO2 certificates
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Modal */}
            <Portal>
              <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start pt-16">
                <div ref={mobileMenuRef} className="bg-white rounded-b-2xl w-full max-h-[85vh] overflow-y-auto animate-in slide-in-from-top duration-300">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Wallet</h3>
                        <p className="text-sm text-gray-500">
                          {balance} ETH on {getNetworkDisplayName()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={copyAddress}
                          className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                        >
                          <span className="font-mono text-xs tracking-wider">
                            {web3Service.formatAddress(address!)}
                          </span>
                          {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                        </button>
                        <button
                          onClick={() => setIsOpen(false)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Network Info Banner - only show if not on Base */}
                    <NetworkInfoBanner
                      chain={chain}
                      onSwitchNetwork={handleSwitchToBase}
                    />

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-medium text-gray-900">VIP Membership</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">
                            {isOnBaseNetwork ? (nfts.length > 0 ? '1 owned' : 'None owned') : 'Switch to Base to check'}
                          </span>
                          {isOnBaseNetwork && (
                            <button
                              onClick={handleManualRefresh}
                              disabled={checkingNFT || checkingCO2}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors disabled:opacity-50"
                            >
                              {(checkingNFT || checkingCO2) ? (
                                <>
                                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                  Checking...
                                </>
                              ) : (
                                <>
                                  <div className="w-3 h-3 border border-gray-400 rounded-full"></div>
                                  Refresh
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                          <span className="ml-2 text-sm text-gray-500">Loading...</span>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <video
                                className="w-full h-48 rounded-lg object-cover"
                                autoPlay
                                loop
                                muted
                                playsInline
                              >
                                <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivateCharterX_transparent-_3_.mp4" type="video/mp4" />
                              </video>
                              <div className="mt-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-900">
                                    {isOnBaseNetwork && nfts.length > 0 ? nfts[0].name : 'PCX Membership Card'}
                                  </span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  isOnBaseNetwork && nfts.length > 0 
                                    ? 'bg-green-500 text-white'
                                    : !isOnBaseNetwork
                                      ? 'bg-gray-300 text-gray-500'
                                      : 'bg-gray-300 text-gray-500'
                                    }`}>
                                    {isOnBaseNetwork && nfts.length > 0 ? '✓ OWNED' : '10% OFF'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  {isOnBaseNetwork && nfts.length > 0
                                    ? `Token #${nfts[0].tokenId} • Verified Owner`
                                    : 'VIP Membership • Limited (001-100)'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                            <h5 className={`text-sm font-medium mb-3 ${
                              isOnBaseNetwork && nfts.length > 0 ? 'text-gray-900' : 'text-gray-400'
                                }`}>
                                {isOnBaseNetwork && nfts.length > 0 ? 'Your Active Benefits' : 'Unlock with NFT Purchase'}
                              </h5>

                              <div className="grid grid-cols-1 gap-2">
                                {[
                                  'Free Empty Leg Flight',
                                  'Up to 10% Permanent Discount',
                                  'Priority Empty Leg Access',
                                  'Limousine Transfers (CH)',
                                  '24/7 Priority Support',
                                  'Early Token Access',
                                  '$PVCX Token Rewards',
                                  'VIP Event Invitations'
                                ].map((benefit, idx) => (
                                  <div
                                    key={idx}
                                  className={`text-xs px-3 py-2 rounded-md font-medium transition-all ${
                                    isOnBaseNetwork && nfts.length > 0 
                                      ? 'bg-green-50 text-green-700 border border-green-200'
                                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                                      }`}
                                  >
                                    {isOnBaseNetwork && nfts.length > 0 && <span className="mr-1">✓</span>}
                                    {benefit}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="pt-3 border-t border-gray-100">
                              {isOnBaseNetwork && nfts.length > 0 ? (
                                <a
                                  href="https://opensea.io/collection/privatecharterx-membership-card"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                  View on OpenSea
                                  <ExternalLink size={12} />
                                </a>
                              ) : (
                                <a
                                  href="https://opensea.io/collection/privatecharterx-membership-card"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors w-full justify-center"
                                >
                                  Buy NFT to Unlock
                                  <ExternalLink size={14} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CO2 Certificates Section */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h4 className="text-base font-medium text-gray-900 flex items-center gap-2">
                            <Leaf size={16} className="text-green-600" />
                            CO2 Certificates
                          </h4>
                          <button
                            onClick={toggleCO2Section}
                            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            {showCO2Section ? (
                              <ToggleRight size={20} className="text-green-600" />
                            ) : (
                              <ToggleLeft size={20} className="text-gray-400" />
                            )}
                            <span className="text-sm">
                              {showCO2Section ? 'Hide' : 'Show'}
                            </span>
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">
                            {isOnBaseNetwork && showCO2Section
                              ? `${co2Certificates.length} owned`
                              : showCO2Section
                                ? 'Switch to Base to check'
                                : 'Hidden'
                            }
                          </span>
                          {isOnBaseNetwork && showCO2Section && (
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          )}
                        </div>
                      </div>

                      {showCO2Section && (
                        <div className="space-y-4">
                          {!isOnBaseNetwork ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                              <p className="text-sm text-blue-800 mb-2">
                                Switch to Base network to view your CO2 certificates
                              </p>
                              <button
                                onClick={handleSwitchToBase}
                                className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                              >
                                Switch to Base
                              </button>
                            </div>
                          ) : checkingCO2 ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                              <span className="ml-2 text-sm text-gray-500">Checking CO2 certificates...</span>
                            </div>
                          ) : co2Certificates.length > 0 ? (
                            <div className="space-y-4">
                              {co2Certificates.map((cert, idx) => (
                                <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <h6 className="font-medium text-green-800 text-sm">{cert.name}</h6>
                                      <p className="text-xs text-green-600 mt-1">
                                        Token #{cert.tokenId} • {cert.issuer}
                                      </p>
                                    </div>
                                    <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                                      VERIFIED
                                    </span>
                                  </div>

                                  {cert.image && (
                                    <div className="w-full h-24 bg-gray-100 rounded-md mb-3 overflow-hidden">
                                      <img
                                        src={cert.image}
                                        alt={cert.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )}

                                  <div className="space-y-2">
                                    {cert.description && (
                                      <p className="text-xs text-green-700">{cert.description}</p>
                                    )}
                                    {cert.carbonOffset && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-green-800">Carbon Offset:</span>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                          {cert.carbonOffset}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded-lg p-6 text-center">
                              <Leaf size={32} className="text-gray-400 mx-auto mb-3" />
                              <h6 className="text-sm font-medium text-gray-600 mb-2">No CO2 Certificates Found</h6>
                              <p className="text-xs text-gray-500 mb-4">
                                Purchase flights or services with carbon offset to receive verified CO2 certificates
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <button
                        onClick={handleDisconnect}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <LogOut size={16} />
                        Disconnect Wallet
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Portal>
          </>
        )}
      </div>

      <NFTSuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        nft={nfts[0]}
      />

      <CO2SuccessPopup
        isOpen={showCO2Popup}
        onClose={() => setShowCO2Popup(false)}
        certificates={co2Certificates}
      />

    </>
  );
}

export default memo(WalletMenu);
