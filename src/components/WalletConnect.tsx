// src/components/WalletConnect.tsx
// Modern wallet connection component using Reown AppKit
// Features: Terms modal, security notice, proper error handling

// ===== IMPORTS =====
import React, { useState } from 'react';
import { X, Shield, Wallet } from 'lucide-react';
import { useAccount, useConnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

// ===== TYPES =====
interface WalletConnectProps {
  show: boolean;
  onClose: () => void;
  onConnect: (address: string) => void;
  onError?: (error: string) => void;
}

// ===== MAIN COMPONENT =====
export default function WalletConnect({
  show,
  onClose,
  onConnect,
  onError
}: WalletConnectProps) {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const [isConnecting, setIsConnecting] = useState(false);

  React.useEffect(() => {
    if (isConnected && address) {
      onConnect(address);
      onClose();
    }
  }, [isConnected, address, onConnect, onClose]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await open({ view: 'Connect' });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-thin text-black">Connect Wallet</h2>
              <p className="text-sm text-gray-600 font-light mt-1">
                Connect to access NFT benefits
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Connect Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-xl py-4 px-6 font-medium transition-colors"
            >
              {isConnecting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet size={20} />
                  Connect Wallet
                </>
              )}
            </button>
          </div>

          {/* Security Notice */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                <Shield size={12} className="text-gray-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-black mb-1">
                  Secure Connection
                </div>
                <div className="text-sm text-gray-600 font-light">
                  Connect for NFT features only. View benefits on <a href="https://opensea.io/collection/privatecharterx-membership-card" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">OpenSea</a>.
                  We never access funds or keys.
                </div>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              New to wallets? <a href="https://ethereum.org/en/wallets/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Learn more</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== HOOK FOR WALLET CONNECTION =====
export function useWalletConnect() {
  const { address, isConnecting, connector, isConnected } = useAccount();
  const { open } = useAppKit();
  const { disconnect: wagmiDisconnect } = useConnect();

  const connect = async () => {
    try {
      await open({ view: 'Connect' });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      if (connector) {
        await connector.disconnect();
      }
      // Additional cleanup if needed
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  };

  return {
    connect,
    disconnect,
    isConnecting,
    isConnected,
    address: address || null,
    error: null // Add error handling if needed
  };
}
