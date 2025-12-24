// CartSidebar - Extracted from AIChat.jsx
// This component handles the cart display, item management, and checkout flow

import React, { useState, useMemo } from 'react';
import {
  X, ShoppingCart, Trash2, Plus, Minus, Clock, Plane, Car,
  Coins, Loader2, Send, ChevronDown, ChevronUp, Calendar,
  MapPin, Users, Briefcase, Wine, Anchor, AlertCircle
} from 'lucide-react';

// Import sub-components
import CartItem from './CartItem';
import CartCheckout from './CartCheckout';
import InlineExtrasPanel from './InlineExtrasPanel';

const CartSidebar = ({
  isOpen,
  onClose,
  cartItems,
  setCartItems,
  cartTotal,
  user,
  userHasNFT,
  usedNFTBenefitThisYear,
  onToast,
  onSendRequest,
  onOpenCalendar,
  isProcessing,
  isProcessingPayment,
  setIsProcessingPayment,
  showRequestForm,
  setShowRequestForm,
  // Inline extras
  showInlineExtras,
  setShowInlineExtras,
  selectedExtraCategory,
  setSelectedExtraCategory,
  customExtraForm,
  setCustomExtraForm,
  // Extras catalog
  extrasCatalog = []
}) => {
  const [expandedItems, setExpandedItems] = useState({});

  // Separate items by type
  const { payableItems, requestOnlyItems, hasPayableItems, hasRequestOnlyItems } = useMemo(() => {
    const payableTypes = ['empty_legs', 'emptyleg', 'wines', 'wine', 'custom_extra', 'service_fee', 'cigars', 'delicatesse'];
    const payable = cartItems.filter(item => payableTypes.includes(item.type));
    const requestOnly = cartItems.filter(item => !payableTypes.includes(item.type));

    return {
      payableItems: payable,
      requestOnlyItems: requestOnly,
      hasPayableItems: payable.length > 0,
      hasRequestOnlyItems: requestOnly.length > 0
    };
  }, [cartItems]);

  // Calculate payable total
  const payableTotal = useMemo(() => {
    return payableItems.reduce((sum, item) => {
      const price = item.totalWithFee || item.price || item.basePrice || 0;
      return sum + (typeof price === 'number' ? price : 0);
    }, 0);
  }, [payableItems]);

  // Can do direct checkout (only payable items, no request-only)
  const canDoDirectCheckout = hasPayableItems && !hasRequestOnlyItems;

  // Remove item handler
  const removeItem = (cartId) => {
    setCartItems(prev => prev.filter(item => item.cartId !== cartId));
    onToast?.({ message: 'Item removed from cart', type: 'cart' });
  };

  // Update item handler
  const updateItem = (cartId, updates) => {
    setCartItems(prev => prev.map(item =>
      item.cartId === cartId ? { ...item, ...updates } : item
    ));
  };

  // Toggle item expansion
  const toggleExpand = (cartId) => {
    setExpandedItems(prev => ({
      ...prev,
      [cartId]: !prev[cartId]
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white border-l border-gray-200 shadow-xl z-50 animate-fade-in-right flex flex-col max-h-screen">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} className="text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">Your Cart</h3>
              {cartItems.length > 0 && (
                <span className="px-2 py-0.5 bg-gray-900 text-white text-xs font-medium rounded-full">
                  {cartItems.length}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Inline Extras Panel */}
        {showInlineExtras && (
          <InlineExtrasPanel
            selectedCategory={selectedExtraCategory}
            setSelectedCategory={setSelectedExtraCategory}
            customExtraForm={customExtraForm}
            setCustomExtraForm={setCustomExtraForm}
            extrasCatalog={extrasCatalog}
            cartItems={cartItems}
            onAddExtra={(extra) => {
              setCartItems(prev => [...prev, extra]);
              onToast?.({ message: `${extra.name} added`, type: 'cart' });
            }}
            onClose={() => {
              setShowInlineExtras(false);
              setSelectedExtraCategory(null);
            }}
          />
        )}

        {/* Empty State */}
        {cartItems.length === 0 && !showInlineExtras && (
          <div className="p-6 text-center text-gray-500 flex-1 flex flex-col items-center justify-center">
            <ShoppingCart size={48} className="mx-auto mb-4 opacity-30" />
            <p>Your cart is empty</p>
          </div>
        )}

        {/* Cart Items List */}
        {cartItems.length > 0 && (
          <>
            <div className="flex-1 min-h-0 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
              {cartItems.map((item, idx) => (
                <CartItem
                  key={item.cartId || idx}
                  item={item}
                  index={idx}
                  isExpanded={expandedItems[item.cartId]}
                  onToggleExpand={() => toggleExpand(item.cartId)}
                  onRemove={() => removeItem(item.cartId)}
                  onUpdate={(updates) => updateItem(item.cartId, updates)}
                  onOpenCalendar={onOpenCalendar}
                />
              ))}
            </div>

            {/* Checkout Section */}
            <CartCheckout
              cartItems={cartItems}
              cartTotal={cartTotal}
              payableItems={payableItems}
              payableTotal={payableTotal}
              requestOnlyItems={requestOnlyItems}
              canDoDirectCheckout={canDoDirectCheckout}
              hasPayableItems={hasPayableItems}
              hasRequestOnlyItems={hasRequestOnlyItems}
              user={user}
              userHasNFT={userHasNFT}
              isProcessing={isProcessing}
              isProcessingPayment={isProcessingPayment}
              setIsProcessingPayment={setIsProcessingPayment}
              showRequestForm={showRequestForm}
              setShowRequestForm={setShowRequestForm}
              onSendRequest={onSendRequest}
              onAddExtras={() => setShowInlineExtras(true)}
              onToast={onToast}
              setCartItems={setCartItems}
            />
          </>
        )}
      </div>
    </>
  );
};

export default CartSidebar;
