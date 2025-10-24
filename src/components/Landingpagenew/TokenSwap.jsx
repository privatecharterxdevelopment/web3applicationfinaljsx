import React, { useState, useEffect, useRef } from 'react';
import { ArrowDownUp, Check, X, Loader2, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { ZeroXService, REVENUE_CONFIG } from '../../services/zeroXService';
import TransactionService from '../../services/transactionService';
import { parseEther } from 'viem';

const TokenSwap = () => {
  const { address, isConnected } = useAccount();

  // Wagmi hooks for transaction
  const { data: hash, sendTransaction, isPending: isSendingTx, error: sendError } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Token selection and amounts
  const [sellToken, setSellToken] = useState('ETH');
  const [buyToken, setBuyToken] = useState('USDC');
  const [sellAmount, setSellAmount] = useState('1');
  const [buyAmount, setBuyAmount] = useState('0');
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quote, setQuote] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  // Transaction states
  const [txStatus, setTxStatus] = useState(null); // 'pending', 'confirming', 'success', 'failed'
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [countdown, setCountdown] = useState(30);

  // Token selector dropdowns
  const [showSellTokenDropdown, setShowSellTokenDropdown] = useState(false);
  const [showBuyTokenDropdown, setShowBuyTokenDropdown] = useState(false);

  // Custom token input
  const [showCustomTokenInput, setShowCustomTokenInput] = useState(false);
  const [customTokenAddress, setCustomTokenAddress] = useState('');
  const [customTokenType, setCustomTokenType] = useState(''); // 'sell' or 'buy'

  // Auto-refresh price every 30 seconds
  const intervalRef = useRef(null);

  // Popular tokens with real addresses - Using Trust Wallet token list for logos
  const tokens = [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
      balance: '3.42'
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
      balance: '5,224.32'
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
      balance: '1,250.00'
    },
    {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
      balance: '0.125'
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
      balance: '0.00'
    },
    {
      symbol: 'UNI',
      name: 'Uniswap',
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
      balance: '45.00'
    },
    {
      symbol: 'LINK',
      name: 'Chainlink',
      address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png',
      balance: '120.50'
    },
  ];

  const getSellTokenData = () => tokens.find(t => t.symbol === sellToken) || tokens[0];
  const getBuyTokenData = () => tokens.find(t => t.symbol === buyToken) || tokens[3];

  // Fetch quote
  const fetchQuote = async () => {
    if (!sellAmount || !isConnected) return;

    setIsLoadingQuote(true);
    try {
      const sellTokenData = getSellTokenData();
      const buyTokenData = getBuyTokenData();

      const params = {
        chainId: 1,
        sellToken: sellTokenData.address,
        buyToken: buyTokenData.address,
        sellAmount: (parseFloat(sellAmount) * 1e18).toString(),
      };

      const priceData = await ZeroXService.getPrice(params);
      const calculatedBuyAmount = (parseFloat(priceData.buyAmount) / 1e18).toFixed(0);

      setBuyAmount(calculatedBuyAmount);
      setQuote(priceData);
      setLastFetchTime(Date.now());
      setCountdown(30);
    } catch (error) {
      console.error('Error fetching quote:', error);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  // Auto-fetch on mount and when inputs change
  useEffect(() => {
    if (sellAmount && parseFloat(sellAmount) > 0 && isConnected) {
      const delayDebounceFn = setTimeout(() => {
        fetchQuote();
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setBuyAmount('');
      setQuote(null);
    }
  }, [sellAmount, sellToken, buyToken, isConnected]);

  // 30-second countdown and auto-refresh
  useEffect(() => {
    if (lastFetchTime && isConnected) {
      intervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            fetchQuote();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(intervalRef.current);
    }
  }, [lastFetchTime, isConnected]);

  // CSS-based confetti animation
  const triggerConfetti = () => {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    confettiContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-piece';
      confetti.style.cssText = `
        position: absolute;
        width: 10px;
        height: 10px;
        background: ${['#00ff00', '#00cc00', '#00aa00', '#ffff00'][Math.floor(Math.random() * 4)]};
        left: ${Math.random() * 100}%;
        top: -10px;
        opacity: ${Math.random()};
        transform: rotate(${Math.random() * 360}deg);
        animation: confetti-fall ${2 + Math.random() * 2}s linear forwards;
      `;
      confettiContainer.appendChild(confetti);
    }

    document.body.appendChild(confettiContainer);

    // Add keyframe animation
    if (!document.getElementById('confetti-style')) {
      const style = document.createElement('style');
      style.id = 'confetti-style';
      style.textContent = `
        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => {
      document.body.removeChild(confettiContainer);
    }, 4000);
  };

  // Handle swap - REAL TRANSACTION EXECUTION
  const handleSwap = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setTxStatus('pending');
      setShowStatusPopup(true);

      const sellTokenData = getSellTokenData();
      const buyTokenData = getBuyTokenData();

      // Get full quote from 0x with transaction data + 0.2% revenue fee
      const quoteParams = {
        chainId: 1,
        sellToken: sellTokenData.address,
        buyToken: buyTokenData.address,
        sellAmount: (parseFloat(sellAmount) * 1e18).toString(),
        taker: address,
        feeRecipient: REVENUE_CONFIG.REVENUE_WALLET,
        feeBps: REVENUE_CONFIG.FEE_BASIS_POINTS,
      };

      console.log('Fetching quote from 0x with 0.2% fee...', quoteParams);
      const fullQuote = await ZeroXService.getQuote(quoteParams);
      console.log('Quote received (includes 0.2% fee to revenue wallet):', fullQuote);

      // Execute transaction through wallet
      const txData = {
        to: fullQuote.to,
        data: fullQuote.data,
        value: BigInt(fullQuote.value || '0'),
        gas: BigInt(fullQuote.estimatedGas || '500000'),
      };

      console.log('Sending transaction...', txData);

      // Send transaction via wagmi
      sendTransaction(txData);

    } catch (error) {
      console.error('Swap error:', error);
      setTxStatus('failed');
      alert(`Swap failed: ${error.message || 'Unknown error'}`);
    }
  };

  // Watch for transaction status changes
  useEffect(() => {
    if (hash && address) {
      setTxHash(hash);
      setTxStatus('confirming');
      console.log('Transaction sent:', hash);

      // Save transaction to history
      const transaction = {
        id: `${hash}-${Date.now()}`,
        hash: hash,
        from: address,
        sellToken: sellToken,
        buyToken: buyToken,
        sellAmount: sellAmount,
        buyAmount: buyAmount,
        status: 'confirming',
        timestamp: Date.now(),
        chainId: 1,
        etherscanUrl: `https://etherscan.io/tx/${hash}`,
      };

      TransactionService.saveTransaction(address, transaction);
    }
  }, [hash, address, sellToken, buyToken, sellAmount, buyAmount]);

  useEffect(() => {
    if (isConfirmed && hash && address) {
      setTxStatus('success');
      triggerConfetti();
      console.log('Transaction confirmed!');

      // Update transaction status to success
      TransactionService.updateTransactionStatus(address, hash, 'success');
    }
  }, [isConfirmed, hash, address]);

  useEffect(() => {
    if (sendError && hash && address) {
      setTxStatus('failed');
      console.error('Transaction error:', sendError);

      // Update transaction status to failed
      TransactionService.updateTransactionStatus(address, hash, 'failed');
    }
  }, [sendError, hash, address]);

  const switchTokens = () => {
    const tempToken = sellToken;
    const tempAmount = sellAmount;
    setSellToken(buyToken);
    setBuyToken(tempToken);
    setSellAmount(buyAmount);
    setBuyAmount(tempAmount);
  };

  const closeStatusPopup = () => {
    setShowStatusPopup(false);
    setTxStatus(null);
    setTxHash(null);
  };

  const sellTokenData = getSellTokenData();
  const buyTokenData = getBuyTokenData();

  return (
    <div className="w-full flex-1 flex flex-col justify-center">
      <div className="max-w-lg mx-auto w-full">
        {/* Spacing where title was */}
        <div className="mb-6"></div>

        {/* Swap Card */}
        <div className="bg-white/35 backdrop-blur-xl border border-gray-300/50 rounded-xl p-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>

          {/* Title */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 font-['DM_Sans']">Swap Tokens</h2>
            <p className="text-xs text-gray-600 mt-1 font-['DM_Sans']">Exchange tokens instantly using 0x Protocol</p>
          </div>

          {/* SELL Section */}
          <div className="mb-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-600 uppercase font-['DM_Sans']">SELL</span>
              {isConnected && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="opacity-60 font-['DM_Sans']">💰 {sellTokenData.balance} {sellToken}</span>
                  <button className="px-2 py-0.5 bg-gray-200/50 hover:bg-gray-300/50 rounded text-xs font-medium transition-all font-['DM_Sans']">
                    MAX
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white/60 rounded-xl p-4 border border-gray-200/50 relative" style={{ backdropFilter: 'blur(15px) saturate(180%)' }}>
              <div className="flex items-center gap-3">
                {/* Token Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowSellTokenDropdown(!showSellTokenDropdown)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/80 hover:bg-white rounded-lg border border-gray-200/50 transition-all font-['DM_Sans']"
                  >
                    <img
                      src={sellTokenData.icon}
                      alt={sellToken}
                      className="w-6 h-6 rounded-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/24/6B7280/FFFFFF?text=' + sellToken.charAt(0);
                      }}
                    />
                    <span className="font-semibold text-gray-900">{sellToken}</span>
                    <span className="text-xs opacity-60">▼</span>
                  </button>

                  {/* Dropdown Menu */}
                  {showSellTokenDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl border border-gray-300/50 shadow-xl z-50 max-h-80 overflow-y-auto" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                      {tokens.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => {
                            setSellToken(token.symbol);
                            setShowSellTokenDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100/50 transition-all text-left"
                        >
                          <img
                            src={token.icon}
                            alt={token.symbol}
                            className="w-8 h-8 rounded-full object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/32/6B7280/FFFFFF?text=' + token.symbol.charAt(0);
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-sm font-['DM_Sans']">{token.symbol}</div>
                            <div className="text-xs text-gray-600 font-['DM_Sans']">{token.name}</div>
                          </div>
                          {isConnected && (
                            <div className="text-xs text-gray-600 font-['DM_Sans']">{token.balance}</div>
                          )}
                        </button>
                      ))}
                      {/* Add Custom Token */}
                      <div className="border-t border-gray-200 p-2">
                        <button
                          onClick={() => {
                            setShowSellTokenDropdown(false);
                            setCustomTokenType('sell');
                            setShowCustomTokenInput(true);
                          }}
                          className="w-full px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-['DM_Sans'] font-medium"
                        >
                          + Add Custom Token
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Amount Input */}
                <input
                  type="number"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-transparent text-right text-2xl font-semibold text-gray-900 outline-none font-['DM_Sans']"
                />
              </div>

              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500 font-['DM_Sans']">~ ${(parseFloat(sellAmount || 0) * 2686.55).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Switch Button */}
          <div className="flex justify-center -my-2 z-10 relative">
            <button
              onClick={switchTokens}
              className="w-10 h-10 bg-white hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all shadow-md border border-gray-200/50"
            >
              <ArrowDownUp size={18} className="text-gray-700" />
            </button>
          </div>

          {/* BUY Section */}
          <div className="mt-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-600 uppercase font-['DM_Sans']">BUY</span>
              {isConnected && (
                <span className="text-xs text-gray-600 opacity-60 font-['DM_Sans']">💰 {buyTokenData.balance} {buyToken}</span>
              )}
            </div>

            <div className="bg-white/60 rounded-xl p-4 border border-gray-200/50 relative" style={{ backdropFilter: 'blur(15px) saturate(180%)' }}>
              <div className="flex items-center gap-3">
                {/* Token Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowBuyTokenDropdown(!showBuyTokenDropdown)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/80 hover:bg-white rounded-lg border border-gray-200/50 transition-all font-['DM_Sans']"
                  >
                    <img
                      src={buyTokenData.icon}
                      alt={buyToken}
                      className="w-6 h-6 rounded-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/24/6B7280/FFFFFF?text=' + buyToken.charAt(0);
                      }}
                    />
                    <span className="font-semibold text-gray-900">{buyToken}</span>
                    <span className="text-xs opacity-60">▼</span>
                  </button>

                  {/* Dropdown Menu */}
                  {showBuyTokenDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl border border-gray-300/50 shadow-xl z-50 max-h-80 overflow-y-auto" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                      {tokens.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => {
                            setBuyToken(token.symbol);
                            setShowBuyTokenDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100/50 transition-all text-left"
                        >
                          <img
                            src={token.icon}
                            alt={token.symbol}
                            className="w-8 h-8 rounded-full object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/32/6B7280/FFFFFF?text=' + token.symbol.charAt(0);
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-sm font-['DM_Sans']">{token.symbol}</div>
                            <div className="text-xs text-gray-600 font-['DM_Sans']">{token.name}</div>
                          </div>
                          {isConnected && (
                            <div className="text-xs text-gray-600 font-['DM_Sans']">{token.balance}</div>
                          )}
                        </button>
                      ))}
                      {/* Add Custom Token */}
                      <div className="border-t border-gray-200 p-2">
                        <button
                          onClick={() => {
                            setShowBuyTokenDropdown(false);
                            setCustomTokenType('buy');
                            setShowCustomTokenInput(true);
                          }}
                          className="w-full px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-['DM_Sans'] font-medium"
                        >
                          + Add Custom Token
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Amount Display */}
                <div className="flex-1 text-right text-2xl font-semibold text-gray-900 font-['DM_Sans']">
                  {isLoadingQuote ? (
                    <Loader2 size={24} className="animate-spin inline-block" />
                  ) : (
                    buyAmount || '0'
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500 font-['DM_Sans']">~ ${(parseFloat(buyAmount || 0) * 0.98).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Route Info */}
          {quote && (
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 font-['DM_Sans']">Route</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium font-['DM_Sans']">Best Rate</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-gray-700">
                <span className="font-['DM_Sans']">Platform Fee (0.5%)</span>
                <span className="font-medium font-['DM_Sans'] text-xs text-gray-600">
                  {(parseFloat(buyAmount || 0) * REVENUE_CONFIG.FEE_PERCENTAGE).toFixed(4)} {buyToken}
                </span>
              </div>

              <div className="flex justify-between items-center text-gray-700">
                <span className="font-['DM_Sans']">You Receive (after fee)</span>
                <span className="font-medium font-['DM_Sans']">
                  {(parseFloat(buyAmount || 0) * (1 - REVENUE_CONFIG.FEE_PERCENTAGE)).toFixed(4)} {buyToken}
                </span>
              </div>
            </div>
          )}

          {/* Auto-refresh countdown */}
          {lastFetchTime && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-600">
              <RefreshCw size={12} className={isLoadingQuote ? 'animate-spin' : ''} />
              <span>Price updates in {countdown}s</span>
            </div>
          )}

          {/* Legal Disclaimer */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-yellow-800 font-['DM_Sans']">
                <strong>Disclaimer:</strong> Token swaps are executed via decentralized protocols. Use at your own risk.
                Always verify transaction details before confirming. Not financial advice.
              </p>
            </div>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={!isConnected || isLoadingQuote || isSendingTx || isConfirming || !sellAmount || parseFloat(sellAmount) <= 0}
            className="w-full mt-4 py-3 bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-all font-['DM_Sans']"
          >
            {!isConnected
              ? 'Connect Wallet'
              : isSendingTx
              ? 'Confirming in Wallet...'
              : isConfirming
              ? 'Processing Transaction...'
              : 'Swap Tokens'}
          </button>
        </div>
      </div>

      {/* Transaction Status Popup */}
      {showStatusPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
            {/* Close button */}
            {txStatus !== 'pending' && txStatus !== 'confirming' && (
              <button
                onClick={closeStatusPopup}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all"
              >
                <X size={20} className="text-gray-600" />
              </button>
            )}

            {/* Status Icon */}
            <div className="flex justify-center mb-6">
              {txStatus === 'pending' && (
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 size={40} className="text-blue-600 animate-spin" />
                </div>
              )}
              {txStatus === 'confirming' && (
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Loader2 size={40} className="text-yellow-600 animate-spin" />
                </div>
              )}
              {txStatus === 'success' && (
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <Check size={40} className="text-green-600" />
                </div>
              )}
              {txStatus === 'failed' && (
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <X size={40} className="text-red-600" />
                </div>
              )}
            </div>

            {/* Status Text */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {txStatus === 'pending' && 'Initiating Swap...'}
                {txStatus === 'confirming' && 'Confirming Transaction'}
                {txStatus === 'success' && 'Swap Successful!'}
                {txStatus === 'failed' && 'Swap Failed'}
              </h3>
              <p className="text-gray-600">
                {txStatus === 'pending' && 'Please confirm the transaction in your wallet'}
                {txStatus === 'confirming' && 'Your transaction is being confirmed on the blockchain'}
                {txStatus === 'success' && `Successfully swapped ${sellAmount} ${sellToken} for ${buyAmount} ${buyToken}`}
                {txStatus === 'failed' && 'Transaction failed. Please try again.'}
              </p>
            </div>

            {/* Transaction Hash */}
            {txHash && (
              <div className="bg-gray-100 rounded-xl p-4 mb-4">
                <div className="text-xs text-gray-600 mb-1">Transaction Hash</div>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-mono text-gray-900 truncate">
                    {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </code>
                  <a
                    href={`https://etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {txStatus === 'success' && (
              <div className="flex gap-3">
                <button
                  onClick={closeStatusPopup}
                  className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-xl font-semibold transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    closeStatusPopup();
                    setSellAmount('');
                    setBuyAmount('');
                  }}
                  className="flex-1 py-3 bg-black hover:bg-gray-800 text-white rounded-xl font-semibold transition-all"
                >
                  New Swap
                </button>
              </div>
            )}
            {txStatus === 'failed' && (
              <button
                onClick={closeStatusPopup}
                className="w-full py-3 bg-black hover:bg-gray-800 text-white rounded-xl font-semibold transition-all"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenSwap;
