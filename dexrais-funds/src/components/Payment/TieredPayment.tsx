import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { AlertCircle, CheckCircle, Loader2, Wallet } from 'lucide-react';
import { useAppKit } from '@reown/appkit/react';
import { TierDetails, formatPrice } from '../../lib/pricing';
import { usdcContract, usdcToWei } from '../../lib/contracts/usdc';
import { useUsdcBalance } from '../../hooks/useUsdcBalance';

interface TieredPaymentProps {
  tier: TierDetails;
  onPaymentSuccess: (txHash: string) => void;
  onCancel: () => void;
}

const PLATFORM_WALLET = import.meta.env.VITE_PLATFORM_WALLET as `0x${string}`;

export default function TieredPayment({ tier, onPaymentSuccess, onCancel }: TieredPaymentProps) {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { balanceNumber, balanceFormatted, isLoading: balanceLoading } = useUsdcBalance(address);
  const [step, setStep] = useState<'review' | 'processing' | 'success' | 'error'>('review');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed
  } = useWaitForTransactionReceipt({
    hash
  });

  // Check if user has sufficient balance
  const hasInsufficientBalance = !balanceLoading && balanceNumber < tier.priceUsdc;

  // Handle payment
  const handlePayment = async () => {
    if (!address || !PLATFORM_WALLET) {
      setErrorMessage('Wallet not connected or platform wallet not configured');
      setStep('error');
      return;
    }

    if (hasInsufficientBalance) {
      setErrorMessage(`Insufficient USDC balance. You have ${balanceFormatted} USDC but need ${tier.priceUsdc} USDC.`);
      setStep('error');
      return;
    }

    try {
      setStep('processing');
      setErrorMessage('');

      // Transfer USDC directly to platform wallet
      writeContract({
        ...usdcContract,
        functionName: 'transfer',
        args: [PLATFORM_WALLET, usdcToWei(tier.priceUsdc)],
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      setErrorMessage(error.message || 'Failed to process payment');
      setStep('error');
    }
  };

  // Watch for transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      setStep('success');
      setTimeout(() => {
        onPaymentSuccess(hash);
      }, 2000);
    }
  }, [isConfirmed, hash, onPaymentSuccess]);

  // Watch for write errors
  useEffect(() => {
    if (writeError) {
      console.error('Write error:', writeError);
      setErrorMessage(writeError.message || 'Transaction failed');
      setStep('error');
    }
  }, [writeError]);

  return (
    <div className="glassmorphic-card p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-medium text-gray-900 mb-2">
          Complete Payment
        </h2>
        <p className="text-gray-600 font-light">
          Pay the launch fee to publish your campaign
        </p>
      </div>

      {/* Tier Summary */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-medium text-gray-900">{tier.name} Tier</h3>
            <p className="text-sm text-gray-600 font-light mt-1">
              {tier.features.milestones === -1 ? 'Unlimited' : tier.features.milestones} milestones
              {tier.features.featuredDays > 0 && ` • Featured ${tier.features.featuredDays} days`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-light text-gray-900">
              {formatPrice(tier.priceChf)}
            </div>
            <div className="text-sm text-gray-600">
              {tier.priceUsdc} USDC
            </div>
          </div>
        </div>

        {/* Transaction Fee Info */}
        <div className="pt-4 border-t border-gray-300">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Transaction Fee (after success)</span>
            <span className="text-gray-900 font-medium">{tier.transactionFee}%</span>
          </div>
        </div>
      </div>

      {/* Wallet Connection Prompt */}
      {!isConnected && (
        <div className="mb-6 p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <Wallet className="w-12 h-12 text-gray-900 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h4>
          <p className="text-sm text-gray-600 mb-4">
            Please connect your wallet to proceed with payment
          </p>
          <button
            onClick={() => open()}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            Connect Wallet
          </button>
        </div>
      )}

      {/* Balance Display */}
      {isConnected && !balanceLoading && (
        <div className="mb-6 p-4 bg-white/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Your USDC Balance</span>
            <span className={`text-lg font-medium ${hasInsufficientBalance ? 'text-red-600' : 'text-gray-900'}`}>
              {balanceFormatted} USDC
            </span>
          </div>
        </div>
      )}

      {/* Insufficient Balance Warning */}
      {hasInsufficientBalance && step === 'review' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-red-900 mb-1">Insufficient Balance</h4>
            <p className="text-sm text-red-700">
              You need {tier.priceUsdc} USDC to proceed. Please add USDC to your wallet first.
            </p>
          </div>
        </div>
      )}

      {/* Processing State */}
      {step === 'processing' && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg text-center">
          <Loader2 className="w-8 h-8 text-gray-900 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 mb-1">
            {isWritePending && 'Confirm transaction in your wallet...'}
            {isConfirming && 'Processing payment...'}
          </p>
          <p className="text-xs text-gray-600">
            This may take a few seconds
          </p>
        </div>
      )}

      {/* Success State */}
      {step === 'success' && hash && (
        <div className="mb-6 p-6 bg-green-50 rounded-lg text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-green-900 mb-2">Payment Successful!</h4>
          <p className="text-sm text-green-700 mb-3">
            Your campaign will be published shortly
          </p>
          <a
            href={`https://basescan.org/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-600 hover:underline"
          >
            View transaction ↗
          </a>
        </div>
      )}

      {/* Error State */}
      {step === 'error' && errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-900 mb-1">Payment Failed</h4>
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        {(step === 'review' || step === 'error') && (
          <>
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              disabled={isWritePending || isConfirming}
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={!isConnected || hasInsufficientBalance || isWritePending || isConfirming || !PLATFORM_WALLET}
              className="flex-1 py-3 px-6 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!isConnected ? 'Connect Wallet First' : !PLATFORM_WALLET ? 'Wallet Not Configured' : `Pay ${tier.priceUsdc} USDC`}
            </button>
          </>
        )}
      </div>

      {/* Platform Wallet Warning */}
      {!PLATFORM_WALLET && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            Platform wallet not configured. Add VITE_PLATFORM_WALLET to .env file.
          </p>
        </div>
      )}

      {/* Terms */}
      <div className="mt-6 pt-6 border-t border-gray-300">
        <p className="text-xs text-gray-500 text-center font-light">
          By proceeding, you agree to pay the {formatPrice(tier.priceChf)} launch fee and
          a {tier.transactionFee}% transaction fee on successfully raised funds.
        </p>
      </div>
    </div>
  );
}
