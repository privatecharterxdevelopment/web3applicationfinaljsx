// CartCheckout - Checkout section of the cart sidebar
import React from 'react';
import { Coins, Loader2, Send, Plus, ShoppingCart } from 'lucide-react';

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
  setCartItems
}) => {
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

      // Determine service type
      const isEmptyLeg = primaryItem.type === 'empty_legs' || primaryItem.type === 'emptyleg';
      const serviceType = isEmptyLeg ? 'empty_leg' : primaryItem.type;
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
          priceUSD: Math.round(payableTotal * 100) / 100,
          email: user.email,
          contactName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
          serviceTitle: primaryItem.name || primaryItem.title || itemDescriptions,
          serviceDescription: primaryItem.description || primaryItem.notes || `${primaryItem.category || primaryItem.type || 'Service'}`,
          orderDescription: `PrivateCharterX Cart: ${itemDescriptions}`,
          cartItems: unpaidItems.map(item => ({
            id: item.id,
            name: item.name || item.title,
            type: item.type,
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

        // Open CoinGate payment page
        window.open(result.paymentUrl, '_blank');
        onToast?.({ message: 'Payment page opened. Complete your crypto payment.', type: 'success' });
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
        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Estimated Total</span>
          <span className="text-lg font-bold text-gray-900">
            ${cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* NFT Discount Notice */}
        {userHasNFT && (
          <div className="text-xs text-emerald-600 text-right">
            NFT holder benefits applied
          </div>
        )}

        {/* Checkout Buttons */}
        {canDoDirectCheckout ? (
          // Direct checkout for payable items only
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
          // Send Request for items requiring confirmation
          <div className="space-y-2">
            {hasPayableItems && hasRequestOnlyItems && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRequestForm(true)}
                  disabled={isProcessing}
                  className="flex-1 px-3 py-2.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 border border-gray-300"
                >
                  <Send size={14} />
                  Send Request
                </button>

                <button
                  onClick={handleCryptoCheckout}
                  disabled={isProcessingPayment}
                  className="flex-1 px-3 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Coins size={14} />
                      Pay with Crypto
                    </>
                  )}
                </button>
              </div>
            )}

            {!hasPayableItems && (
              <button
                onClick={() => setShowRequestForm(true)}
                disabled={isProcessing}
                className="w-full px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
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
            )}

            <p className="text-[10px] text-gray-500 text-center">
              {hasRequestOnlyItems
                ? 'Some items require confirmation from our team'
                : 'Our team will review and confirm your request'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartCheckout;
