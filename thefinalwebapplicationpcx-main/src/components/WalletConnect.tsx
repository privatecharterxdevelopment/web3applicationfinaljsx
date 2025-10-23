// src/components/WalletConnect.tsx
// Improved: Replaced custom modal/UI with Reown's prebuilt modal trigger (<AppKitButton />).
// Props preserved; onConnect called with address when connected.
// Use Wagmi hooks for state (e.g., useAccount for address).
// Dependencies: @reown/appkit/ui, wagmi.

// ===== IMPORTS =====
import React from 'react';
import { X, Shield } from 'lucide-react';
import { AppKitButton } from '@reown/appkit/ui';
import { useAccount } from 'wagmi';

// ===== TYPES ===== (unchanged)
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

  React.useEffect(() => {
    if (isConnected && address) {
      onConnect(address);
      onClose();
    }
  }, [isConnected, address, onConnect, onClose]);

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

          {/* Reown Button (opens prebuilt modal) */}
          <div className="flex justify-center mb-6">
            <AppKitButton />
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

// ===== HOOK FOR WALLET CONNECTION ===== (Now uses Wagmi)
export function useWalletConnect() {
  const { address, isConnecting, connector } = useAccount();

  const connect = async () => {
    // Reown modal opens via <AppKitButton />, so this hook is for state
    // If needed, use useReown() hook from @reown/appkit for programmatic open
  };

  const disconnect = async () => {
    if (connector) await connector.disconnect();
  };

  return {
    connect, // Trigger modal via button
    disconnect,
    isConnecting,
    address: address || null,
    error: null // Add error handling if needed
  };
}
