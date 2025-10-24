import React, { useState, useEffect } from 'react';
import {
  ArrowUpDown,
  Settings,
  Info,
  ChevronDown,
  Loader2,
  AlertTriangle,

  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { formatUnits, parseUnits, Address } from 'viem';
import { ZeroXService } from '../../services/zeroXService';

interface Token {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  balance?: string;
}

const COMMON_TOKENS: Token[] = [
  {
    address: '0x0000000000000000000000000000000000000000' as Address,
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    logoURI: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png'
  },
  {
    address: '0x4200000000000000000000000000000000000006' as Address,
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    logoURI: 'https://tokens.1inch.io/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png'
  },
  {
    address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' as Address,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: 'https://tokens.1inch.io/0xa0b86a33e6e1a2e2b4e7e7a7c2e0b7e6e7e7e7e7.png'
  },
  {
    address: '0x50c5725949a6f0c72e6c4a641f24049a917db0cb' as Address,
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    logoURI: 'https://tokens.1inch.io/0x6b175474e89094c44da98b954eedeac495271d0f.png'
  }
];

interface TokenSwapProps {
  className?: string;
}

export default function TokenSwap({ className = '' }: TokenSwapProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const [fromToken, setFromToken] = useState<Token>(COMMON_TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(COMMON_TOKENS[2]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [isSwapping, setIsSwapping] = useState(false);
  const [showTokenSelector, setShowTokenSelector] = useState<'from' | 'to' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [priceImpact, setPriceImpact] = useState('0.00');
  const [exchangeRate, setExchangeRate] = useState('0');

  const { data: fromBalance } = useBalance({
    address: address,
    token: fromToken.address === '0x0000000000000000000000000000000000000000' ? undefined : fromToken.address,
  });

  const { data: toBalance } = useBalance({
    address: address,
    token: toToken.address === '0x0000000000000000000000000000000000000000' ? undefined : toToken.address,
  });

  useEffect(() => {
    const fetchPrice = async () => {
      if (fromAmount && !isNaN(Number(fromAmount)) && Number(fromAmount) > 0) {
        try {
          const sellAmountWei = parseUnits(fromAmount, fromToken.decimals).toString();

          const priceData = await ZeroXService.getPrice({
            chainId: chainId || 1,
            sellToken: fromToken.address,
            buyToken: toToken.address,
            sellAmount: sellAmountWei,
          });

          const buyAmountFormatted = formatUnits(
            BigInt(priceData.buyAmount),
            toToken.decimals
          );

          setToAmount(Number(buyAmountFormatted).toFixed(6));
          setExchangeRate(priceData.price);
          setPriceImpact('0.12'); // Keep mock impact for now
        } catch (error) {
          console.error('Price fetch failed:', error);
          setToAmount('0');
          setExchangeRate('0');
        }
      } else {
        setToAmount('');
        setExchangeRate('0');
      }
    };

    const timeoutId = setTimeout(fetchPrice, 500); // Debounce API calls
    return () => clearTimeout(timeoutId);
  }, [fromAmount, fromToken, toToken, chainId]);

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleTokenSelect = (token: Token, position: 'from' | 'to') => {
    if (position === 'from') {
      setFromToken(token);
    } else {
      setToToken(token);
    }
    setShowTokenSelector(null);
  };

  const handleSwap = async () => {
    if (!isConnected || !fromAmount || !toAmount || !address) return;

    setIsSwapping(true);
    try {
      // Get quote from 0x API
      const sellAmountWei = parseUnits(fromAmount, fromToken.decimals).toString();

      const quote = await ZeroXService.getQuote({
        chainId: chainId || 1, // Default to Ethereum mainnet
        sellToken: fromToken.address,
        buyToken: toToken.address,
        sellAmount: sellAmountWei,
        taker: address,
      });

      console.log('0x Quote received:', quote);

      // Here you would execute the actual swap transaction
      // For now, we'll just log the quote and clear the form
      console.log('Swap would execute with quote:', {
        sellAmount: quote.sellAmount,
        buyAmount: quote.buyAmount,
        price: quote.price,
        to: quote.to,
        data: quote.data
      });

      alert(`Swap quote received! Price: ${quote.price}. Check console for details.`);
      setFromAmount('');
      setToAmount('');
    } catch (error) {
      console.error('Swap failed:', error);
      alert(`Swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSwapping(false);
    }
  };

  const formatBalance = (balance: any) => {
    if (!balance) return '0.00';
    return Number(formatUnits(balance.value, balance.decimals)).toFixed(4);
  };

  const isSwapDisabled = !isConnected || !fromAmount || !toAmount || isSwapping || Number(fromAmount) <= 0;

  if (!isConnected) {
    return (
      <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowUpDown className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Wallet to Swap</h3>
          <p className="text-sm text-gray-600">Connect your wallet to start swapping tokens</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Token Swap</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slippage Tolerance
              </label>
              <div className="flex space-x-2">
                {['0.1', '0.5', '1.0'].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={`px-3 py-2 text-sm rounded-lg border ${
                      slippage === value
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
                <input
                  type="text"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg w-20 text-center"
                  placeholder="Custom"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* From Token */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">From</label>
            <span className="text-xs text-gray-500">
              Balance: {formatBalance(fromBalance)} {fromToken.symbol}
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.0"
              className="w-full p-4 pr-32 text-xl font-medium border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <button
              onClick={() => setShowTokenSelector('from')}
              className="absolute right-2 top-2 flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {fromToken.logoURI && (
                <img src={fromToken.logoURI} alt={fromToken.symbol} className="w-5 h-5 rounded-full" />
              )}
              <span className="font-medium">{fromToken.symbol}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwapTokens}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ArrowUpDown className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">To</label>
            <span className="text-xs text-gray-500">
              Balance: {formatBalance(toBalance)} {toToken.symbol}
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              value={toAmount}
              readOnly
              placeholder="0.0"
              className="w-full p-4 pr-32 text-xl font-medium border border-gray-200 rounded-xl bg-gray-50"
            />
            <button
              onClick={() => setShowTokenSelector('to')}
              className="absolute right-2 top-2 flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {toToken.logoURI && (
                <img src={toToken.logoURI} alt={toToken.symbol} className="w-5 h-5 rounded-full" />
              )}
              <span className="font-medium">{toToken.symbol}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Swap Details */}
        {fromAmount && toAmount && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Exchange Rate</span>
              <span className="font-medium">1 {fromToken.symbol} = {exchangeRate} {toToken.symbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Price Impact</span>
              <span className={`font-medium ${Number(priceImpact) > 1 ? 'text-orange-600' : 'text-green-600'}`}>
                {priceImpact}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Slippage Tolerance</span>
              <span className="font-medium">{slippage}%</span>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={isSwapDisabled}
          className={`w-full py-4 px-6 rounded-xl font-medium text-white transition-all ${
            isSwapDisabled
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-black hover:bg-gray-800 transform hover:scale-[1.02] shadow-lg'
          }`}
        >
          {isSwapping ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Swapping...</span>
            </div>
          ) : (
            'Swap Tokens'
          )}
        </button>

        {/* Warning */}
        <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-700">
            <p className="font-medium">Demo Mode</p>
            <p>This is a demonstration. Connect to a real DEX aggregator for actual swaps.</p>
          </div>
        </div>
      </div>

      {/* Token Selector Modal */}
      {showTokenSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowTokenSelector(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Select Token</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {COMMON_TOKENS.map((token) => (
                <button
                  key={token.address}
                  onClick={() => handleTokenSelect(token, showTokenSelector)}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {token.logoURI && (
                    <img src={token.logoURI} alt={token.symbol} className="w-8 h-8 rounded-full" />
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-medium">{token.symbol}</div>
                    <div className="text-sm text-gray-600">{token.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}