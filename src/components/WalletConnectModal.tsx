import React from 'react';
import { X } from 'lucide-react';
import { useAppKit } from '@reown/appkit/react';

interface WalletConnectModalProps {
  onClose: () => void;
}

export default function WalletConnectModal({ onClose }: WalletConnectModalProps) {
  const { open } = useAppKit();

  const handleConnect = async () => {
    try {
      await open({ view: 'Connect' });
      onClose();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleConnect}
            className="w-full flex items-center justify-center gap-2 p-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            <span>Connect Wallet</span>
          </button>
        </div>

        <p className="text-center text-sm text-gray-500">
          By connecting a wallet, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}