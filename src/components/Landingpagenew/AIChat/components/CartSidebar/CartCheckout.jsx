// CartCheckout - Checkout section of the cart sidebar
import React, { useMemo, useState, useCallback } from 'react';
import { Coins, Loader2, Send, Plus, ShoppingCart, Sparkles, CheckCircle, PenTool } from 'lucide-react';
import { useAccount, useSignMessage } from 'wagmi';

// NFT Discount Constants
const NFT_FREE_EMPTY_LEG_LIMIT = 1500; // USD
const NFT_JET_DISCOUNT_PERCENT = 0.10; // 10%
const NFT_GROUND_DISCOUNT_PERCENT = 0.10; // 10%

const CartCheckout = ({
  cartItems,
  cartTotal,
  payableItems,
  payableTotal,
  requestOnlyItems,
  canDoDirectCheckout,
  hasPayableItems,
  hasRequestOnlyItems,
  user,
  userHasNFT,
  isProcessing,
  isProcessingPayment,
  setIsProcessingPayment,
  showRequestForm,
  setShowRequestForm,
  onSendRequest,
  onAddExtras,
  onToast,
  setCartItems,
  // NFT Signature props
  onNFTSignatureComplete
}) => {
  // Wallet state for NFT signature
  const { address: walletAddress, isConnected: isWalletConnected } = useAccount();

  // Inline signature state (no modal)
  const [signatureStatus, setSignatureStatus] = useState('idle'); // 'idle' | 'signing' | 'success' | 'error'
  const [signatureError, setSignatureError] = useState(null);

  // useSignMessage hook from wagmi
  const { signMessageAsync, isPending: isSigningMessage } = useSignMessage();

  // Check if NFT holder needs to sign
  const needsNFTSignature = userHasNFT && isWalletConnected && signatureStatus !== 'success';

  // Generate signature message
  const generateSignatureMessage = useCallback(() => {
    const timestamp = new Date().toISOString();
    const itemCount = cartItems.length;
    const total = cartTotal?.toFixed(2) || '0.00';

    return `I, the owner of wallet ${walletAddress}, hereby authorize the use of my NFT membership benefits for this PrivateCharterX request.

Request Details:
- Items: ${itemCount}
- Total Value: $${total}
- Timestamp: ${timestamp}

This signature verifies my NFT ownership and authorizes the application of member discounts.

Wallet: ${walletAddress}
Date: ${new Date().toLocaleDateString()}`;
  }, [walletAddress, cartItems.length, cartTotal]);

  // Handle NFT signature - triggers wallet popup directly
  const handleNFTSignature = useCallback(async () => {
    if (!walletAddress || !isWalletConnected) {
      setSignatureError('Wallet not connected');
      setSignatureStatus('error');
      return;
    }

    try {
      setSignatureStatus('signing');
      setSignatureError(null);

      const message = generateSignatureMessage();
      const timestamp = new Date().toISOString();

      // Request signature from wallet (opens wallet popup directly)
      const signature = await signMessageAsync({ message });

      // Store signature data
      const signatureData = {
        wallet_address: walletAddress,
        signature: signature,
        message: message,
        signed_at: timestamp,
        cart_total: cartTotal,
        item_count: cartItems.length,
        items_summary: cartItems.map(item => ({
          type: item.type,
          name: item.name || item.title,
          price: item.price || item.totalWithFee || item.basePrice
        }))
      };

      setSignatureStatus('success');

      // Call the callback with signature data
      if (onNFTSignatureComplete) {
        onNFTSignatureComplete(signatureData);
      }

    } catch (error) {
      console.error('Signature failed:', error);
      setSignatureError(error.message || 'Signature was rejected');
      setSignatureStatus('error');
    }
  }, [walletAddress, isWalletConnected, generateSignatureMessage, signMessageAsync, cartTotal, cartItems, onNFTSignatureComplete]);

  // Handle Send Request click
  const handleSendRequestClick = useCallback(() => {
    // If NFT holder hasn't signed yet, don't proceed
    if (userHasNFT && isWalletConnected && signatureStatus !== 'success') {
      return; // Must sign first via the inline tab
    }
    // Proceed to request form
    setShowRequestForm(true);
  }, [userHasNFT, isWalletConnected, signatureStatus, setShowRequestForm]);
  // Calculate NFT discounts for each item type
  const nftDiscounts = useMemo(() => {
    if (!userHasNFT) return { emptyLeg: 0, jet: 0, ground: 0, total: 0, details: [] };

    let emptyLegDiscount = 0;
    let jetDiscount = 0;
    let groundDiscount = 0;
    const details = [];

    cartItems.forEach(item => {
      const price = item.totalWithFee || item.price || item.basePrice || 0;
      const itemType = item.type?.toLowerCase() || '';

      // Empty Leg: FREE if under $1500
      if (itemType === 'empty_legs' || itemType === 'emptyleg') {
        if (price <= NFT_FREE_EMPTY_LEG_LIMIT && price > 0) {
          emptyLegDiscount += price;
          details.push({
            type: 'empty_leg',
            name: item.name || 'Empty Leg Flight',
            originalPrice: price,
            discount: price,
            discountPercent: 100,
            isFree: true
          });
        }
      }

      // Jets/Helicopters: 10% discount
      if (['jets', 'jet', 'helicopters', 'helicopter'].includes(itemType)) {
        const discount = price * NFT_JET_DISCOUNT_PERCENT;
        if (discount > 0) {
          jetDiscount += discount;
          details.push({
            type: 'jet',
            name: item.name || item.aircraft_type || 'Private Jet',
            originalPrice: price,
            discount: discount,
            discountPercent: 10,
            isFree: false
          });
        }
      }

      // Ground Transport/Limousine: 10% discount
      if (['ground_transport', 'transfer', 'taxi', 'limousine', 'luxury_cars', 'luxury_car'].includes(itemType)) {
        const discount = price * NFT_GROUND_DISCOUNT_PERCENT;
        if (discount > 0) {
          groundDiscount += discount;
          details.push({
            type: 'ground',
            name: item.name || 'Ground Transport',
            originalPrice: price,
            discount: discount,
            discountPercent: 10,
            isFree: false
          });
        }
      }
    });

    return {
      emptyLeg: emptyLegDiscount,
      jet: jetDiscount,
      ground: groundDiscount,
      total: emptyLegDiscount + jetDiscount + groundDiscount,
      details
    };
  }, [cartItems, userHasNFT]);

  // Calculate discounted totals
  const discountedCartTotal = useMemo(() => {
    return Math.max(0, cartTotal - nftDiscounts.total);
  }, [cartTotal, nftDiscounts.total]);

  const discountedPayableTotal = useMemo(() => {
    // Calculate payable discount (only for payable item types)
    const payableDiscount = nftDiscounts.details
      .filter(d => d.type === 'empty_leg') // Only empty legs are in payable
      .reduce((sum, d) => sum + d.discount, 0);
    return Math.max(0, payableTotal - payableDiscount);
  }, [payableTotal, nftDiscounts.details]);
  // Handle crypto checkout
  const handleCryptoCheckout = async () => {
    if (!user?.id) {
      onToast?.({ message: 'Please sign in to checkout', type: 'error' });
      return;
    }

    if (payableItems.length === 0) {
      onToast?.({ message: 'No items available for direct checkout', type: 'error' });
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Get unpaid items only
      const unpaidItems = payableItems.filter(item => !item.isPaid);
      if (unpaidItems.length === 0) {
        onToast?.({ message: 'All items already paid', type: 'info' });
        setIsProcessingPayment(false);
        return;
      }

      const primaryItem = unpaidItems[0];
      const itemDescriptions = unpaidItems.map(i => i.name || i.title || i.type).join(', ');

      // Map cart item types to valid CoinGate service types
      const getServiceType = (type) => {
        const typeMap = {
          'empty_legs': 'empty_leg',
          'emptyleg': 'empty_leg',
          'wines': 'wine',
          'wine': 'wine',
          'cigars': 'cigars',
          'delicatesse': 'delicatesse',
          'delicacies': 'delicatesse',
          'custom_extra': 'custom_extra',
          'service_fee': 'service_fee'
        };
        return typeMap[type] || 'custom_extra';
      };

      const serviceType = getServiceType(primaryItem.type);
      const serviceId = primaryItem.original_id || primaryItem.db_id || primaryItem.id || `custom-${Date.now()}`;

      // Call CoinGate edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-coingate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          userId: user.id,
          serviceType: serviceType,
          serviceId: serviceId,
          priceUSD: Math.round((userHasNFT ? discountedPayableTotal : payableTotal) * 100) / 100,
          email: user.email,
          contactName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
          serviceTitle: primaryItem.name || primaryItem.title || itemDescriptions,
          serviceDescription: primaryItem.description || primaryItem.notes || `${primaryItem.category || primaryItem.type || 'Service'}`,
          orderDescription: `PrivateCharterX Cart: ${itemDescriptions}${userHasNFT && (nftDiscounts.jet + nftDiscounts.ground) > 0 ? ` (NFT Discount: -$${(nftDiscounts.jet + nftDiscounts.ground).toFixed(2)})` : ''}${userHasNFT && nftDiscounts.emptyLeg > 0 ? ' (Free Empty Leg)' : ''}`,
          nftDiscount: userHasNFT ? (nftDiscounts.jet + nftDiscounts.ground) : 0,
          freeEmptyLeg: userHasNFT && nftDiscounts.emptyLeg > 0,
          hasNFT: userHasNFT,
          cartItems: unpaidItems.map(item => ({
            id: item.id,
            name: item.name || item.title,
            type: getServiceType(item.type),
            price: item.price_usd || item.price || item.basePrice,
            quantity: item.quantity || 1
          }))
        })
      });

      const result = await response.json();

      if (result.success && result.paymentUrl) {
        // Mark items as pending payment
        setCartItems(prev => prev.map(item => {
          const isPaying = unpaidItems.some(p => p.cartId === item.cartId);
          if (isPaying) {
            return {
              ...item,
              paymentStatus: 'pending_confirmation',
              coingateOrderId: result.coingateOrderId
            };
          }
          return item;
        }));

        // Redirect to CoinGate payment page
        onToast?.({ message: 'Redirecting to payment...', type: 'success' });
        window.location.href = result.paymentUrl;
      } else {
        throw new Error(result.error || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      onToast?.({ message: error.message || 'Failed to process checkout', type: 'error' });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50 flex-shrink-0">
      {/* Add Extras Button */}
      <div className="p-3 border-b border-gray-200">
        <button
          onClick={onAddExtras}
          className="w-full px-3 py-2 bg-white border border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all text-xs font-medium flex items-center justify-center gap-2"
        >
          <Plus size={14} />
          Add extras (wine, catering, cigars...)
        </button>
      </div>

      {/* Cart Summary */}
      <div className="p-4 space-y-3">
        {/* Subtotal (only show if there are non-free discounts like jet/ground) */}
        {userHasNFT && (nftDiscounts.jet > 0 || nftDiscounts.ground > 0) && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 font-light tracking-wide">Subtotal</span>
            <span className="text-sm text-gray-400 font-light line-through">
              ${(cartTotal - nftDiscounts.emptyLeg).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* NFT Discount Line Items */}
        {userHasNFT && nftDiscounts.total > 0 && (
          <div className="py-2 border-y border-gray-100 space-y-1.5">
            {/* NFT Badge */}
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-4 h-4 rounded bg-gray-900 flex items-center justify-center">
                <Sparkles size={10} className="text-white" />
              </div>
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">NFT Member Discounts</span>
            </div>

            {/* Empty Leg FREE - hide value, just show FREE */}
            {nftDiscounts.emptyLeg > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 font-light">
                  Empty Leg Flight
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-gray-900 text-white rounded font-medium">
                  FREE
                </span>
              </div>
            )}

            {/* Jet Discount -10% */}
            {nftDiscounts.jet > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 font-light">
                  Jet Discount <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded ml-1">-10%</span>
                </span>
                <span className="text-xs text-gray-700 font-medium">
                  -${nftDiscounts.jet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {/* Ground Transport Discount -10% */}
            {nftDiscounts.ground > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 font-light">
                  Ground Transport <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded ml-1">-10%</span>
                </span>
                <span className="text-xs text-gray-700 font-medium">
                  -${nftDiscounts.ground.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {/* Total Savings - only show for jet/ground discounts, not empty leg */}
            {(nftDiscounts.jet > 0 || nftDiscounts.ground > 0) && (
              <div className="flex justify-between items-center pt-1 mt-1 border-t border-gray-50">
                <span className="text-[10px] text-gray-400 font-light uppercase tracking-wide">Total Savings</span>
                <span className="text-xs text-gray-800 font-semibold">
                  -${(nftDiscounts.jet + nftDiscounts.ground).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Final Total */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 font-light tracking-wide">Estimated Total</span>
          <span className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            ${(userHasNFT && nftDiscounts.total > 0 ? discountedCartTotal : cartTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* NFT Member Status */}
        {userHasNFT && nftDiscounts.total === 0 && (
          <div className="text-[10px] text-gray-400 text-right font-light">
            NFT member · discounts apply on jets, empty legs, transfers
          </div>
        )}

        {/* NFT Signature Tab - Inline, above Send Request (Monochromatic) */}
        {userHasNFT && isWalletConnected && (
          <div className="mb-3">
            <button
              onClick={signatureStatus === 'success' ? undefined : handleNFTSignature}
              disabled={isSigningMessage}
              className={`w-full px-3 py-2.5 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                signatureStatus === 'success'
                  ? 'bg-gray-900 border-gray-900 cursor-default'
                  : signatureStatus === 'error'
                  ? 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  signatureStatus === 'success' ? 'bg-white' : 'bg-gray-900'
                }`}>
                  {signatureStatus === 'signing' ? (
                    <Loader2 size={12} className="text-white animate-spin" />
                  ) : signatureStatus === 'success' ? (
                    <CheckCircle size={12} className="text-gray-900" />
                  ) : (
                    <PenTool size={12} className="text-white" />
                  )}
                </div>
                <div className="text-left">
                  <span className={`text-xs font-medium ${
                    signatureStatus === 'success' ? 'text-white' : 'text-gray-700'
                  }`}>
                    {signatureStatus === 'signing'
                      ? 'Waiting for wallet...'
                      : signatureStatus === 'success'
                      ? 'Wallet verified'
                      : signatureStatus === 'error'
                      ? 'Signature failed - tap to retry'
                      : 'Verify NFT ownership'}
                  </span>
                  {signatureStatus === 'idle' && (
                    <p className="text-[10px] text-gray-400">Sign to apply member benefits</p>
                  )}
                </div>
              </div>

              {/* Right side status */}
              <div className="flex items-center">
                {signatureStatus === 'signing' && (
                  <span className="text-[10px] text-gray-400">Check wallet</span>
                )}
                {signatureStatus === 'success' && (
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={12} className="text-white" />
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  </div>
                )}
                {signatureStatus === 'idle' && (
                  <span className="text-[10px] text-gray-500 px-2 py-0.5 bg-gray-200 rounded">Sign</span>
                )}
              </div>
            </button>
          </div>
        )}

        {/* Checkout Buttons */}
        {/* NFT Holders: Always Send Request (no crypto payment) */}
        {/* Non-NFT: Can use crypto payment for payable items */}
        {!userHasNFT && canDoDirectCheckout ? (
          // Direct crypto checkout - ONLY for non-NFT holders with payable items
          <div className="space-y-2">
            <button
              onClick={handleCryptoCheckout}
              disabled={isProcessingPayment}
              className="w-full px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Coins size={16} />
                  Pay with Crypto
                </>
              )}
            </button>

            <p className="text-[10px] text-gray-500 text-center">
              Total: ${payableTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (incl. VAT)
            </p>
          </div>
        ) : (
          // Send Request - For NFT holders (always) or mixed cart / request-only items
          <div className="space-y-2">
            <button
              onClick={handleSendRequestClick}
              disabled={isProcessing || isSigningMessage || (userHasNFT && isWalletConnected && signatureStatus !== 'success')}
              className={`w-full px-4 py-3 text-white text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 ${
                userHasNFT && isWalletConnected && signatureStatus !== 'success'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gray-900 hover:bg-gray-800'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Request
                </>
              )}
            </button>

            <p className="text-[10px] text-gray-500 text-center">
              {userHasNFT && isWalletConnected && signatureStatus !== 'success'
                ? 'Sign above to unlock Send Request'
                : userHasNFT && signatureStatus === 'success'
                ? 'NFT verified · Discounts applied'
                : userHasNFT
                ? 'NFT member · Connect wallet to sign'
                : 'Our team will review and confirm your request'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartCheckout;
