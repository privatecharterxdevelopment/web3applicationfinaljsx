// CartSidebarTest.jsx
// Test page for the new CartSidebar component
// Route: /test/cart-sidebar (add to router for testing)

import React, { useState } from 'react';
import CartSidebar from './components/CartSidebar';

// Mock user data
const MOCK_USER = {
  id: 'test-user-123',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User'
  }
};

// Mock cart items - realistic data
const MOCK_CART_ITEMS = [
  // Empty Leg - London to Paris
  {
    id: 'el-001',
    cartId: 'cart-el-001',
    type: 'empty_legs',
    name: 'Citation XLS - Empty Leg',
    title: 'London → Paris Empty Leg',
    aircraft_type: 'Citation XLS',
    model: 'Citation XLS',
    from: 'London',
    from_city: 'London',
    from_iata: 'LTN',
    to: 'Paris',
    to_city: 'Paris',
    to_iata: 'LBG',
    departure_date: '2024-12-28',
    departure_time: '10:00',
    capacity: 8,
    available_seats: 8,
    price: 12500,
    price_usd: 12500,
    basePrice: 12500,
    totalWithFee: 13512.50, // with 8.1% VAT
    currency: 'USD',
    primaryImage: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=400',
    addedAt: new Date().toISOString()
  },
  // Private Jet Charter (request only)
  {
    id: 'jet-001',
    cartId: 'cart-jet-001',
    type: 'jets',
    name: 'Gulfstream G650',
    title: 'Private Jet Charter',
    aircraft_type: 'Gulfstream G650',
    model: 'G650',
    category: 'Heavy Jet',
    from: 'New York',
    from_city: 'New York',
    from_iata: 'TEB',
    to: 'Miami',
    to_city: 'Miami',
    to_iata: 'OPF',
    passengers: 4,
    departure_date: '2024-12-30',
    price: 45000,
    basePrice: 45000,
    totalWithFee: 48645, // with 8.1% VAT
    estimatedPrice: 48645,
    currency: 'USD',
    primaryImage: 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=400',
    isQuoteRequest: true,
    requiresConfirmation: true,
    addedAt: new Date().toISOString()
  },
  // Wine Extra
  {
    id: 'wine-001',
    cartId: 'cart-wine-001',
    type: 'custom_extra',
    category: 'wine',
    name: 'Dom Pérignon 2012',
    title: 'Dom Pérignon 2012',
    description: 'Premium Champagne',
    price: 450,
    unitPrice: 450,
    basePrice: 450,
    totalWithFee: 486.45,
    quantity: 2,
    currency: 'USD',
    image: 'https://images.unsplash.com/photo-1594372365401-3b5ff14eaaed?w=400',
    addedAt: new Date().toISOString()
  },
  // Catering Extra
  {
    id: 'catering-001',
    cartId: 'cart-catering-001',
    type: 'custom_extra',
    category: 'catering',
    name: 'Premium In-Flight Catering',
    title: 'Premium Catering Package',
    description: 'Gourmet meal service for 4 passengers',
    price: 1200,
    unitPrice: 1200,
    basePrice: 1200,
    totalWithFee: 1297.20,
    quantity: 1,
    currency: 'USD',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
    addedAt: new Date().toISOString()
  }
];

// Mock extras catalog
const MOCK_EXTRAS_CATALOG = [
  { id: 'wine-1', name: 'Moët & Chandon', category: 'wine', price: 150 },
  { id: 'wine-2', name: 'Veuve Clicquot', category: 'wine', price: 180 },
  { id: 'wine-3', name: 'Château Margaux 2015', category: 'wine', price: 850 },
  { id: 'cigar-1', name: 'Cohiba Behike', category: 'cigars', price: 120 },
  { id: 'cigar-2', name: 'Montecristo No. 2', category: 'cigars', price: 45 },
  { id: 'catering-1', name: 'Light Refreshments', category: 'catering', price: 350 },
  { id: 'catering-2', name: 'Full Meal Service', category: 'catering', price: 800 },
  { id: 'flowers-1', name: 'Rose Bouquet', category: 'flowers', price: 200 }
];

const CartSidebarTest = () => {
  // State
  const [cartItems, setCartItems] = useState(MOCK_CART_ITEMS);
  const [isOpen, setIsOpen] = useState(true);
  const [toast, setToast] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showInlineExtras, setShowInlineExtras] = useState(false);
  const [selectedExtraCategory, setSelectedExtraCategory] = useState(null);
  const [customExtraForm, setCustomExtraForm] = useState({ name: '', category: '', quantity: 1, notes: '' });

  // Calculate cart total
  const cartTotal = cartItems.reduce((sum, item) => {
    const price = item.totalWithFee || item.price || item.basePrice || 0;
    const qty = item.quantity || 1;
    return sum + (price * (item.type === 'custom_extra' ? 1 : 1)); // quantity already factored in totalWithFee
  }, 0);

  // Toast handler
  const handleToast = (toastData) => {
    setToast(toastData);
    setTimeout(() => setToast(null), 3000);
  };

  // Mock send request
  const handleSendRequest = async () => {
    setIsProcessing(true);
    console.log('📤 Sending request with items:', cartItems);
    await new Promise(resolve => setTimeout(resolve, 1500));
    handleToast({ message: 'Request sent successfully!', type: 'success' });
    setIsProcessing(false);
    setShowRequestForm(false);
  };

  // Mock open calendar
  const handleOpenCalendar = (item) => {
    console.log('📅 Opening calendar for:', item);
    handleToast({ message: `Calendar opened for ${item.name}`, type: 'info' });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Test Controls */}
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">CartSidebar Test Page</h1>

        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          {/* Toggle Cart */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Cart Sidebar</span>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isOpen
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isOpen ? 'Close Cart' : 'Open Cart'}
            </button>
          </div>

          {/* Cart Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{cartItems.length}</p>
              <p className="text-xs text-gray-500">Items</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                ${cartTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {cartItems.filter(i => ['empty_legs', 'emptyleg', 'wines', 'wine', 'custom_extra'].includes(i.type)).length}
              </p>
              <p className="text-xs text-gray-500">Payable</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={() => setCartItems(MOCK_CART_ITEMS)}
              className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-200"
            >
              Reset Cart
            </button>
            <button
              onClick={() => setCartItems([])}
              className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-lg hover:bg-red-200"
            >
              Clear Cart
            </button>
            <button
              onClick={() => setCartItems(prev => [...prev, {
                id: `extra-${Date.now()}`,
                cartId: `cart-extra-${Date.now()}`,
                type: 'custom_extra',
                category: 'other',
                name: `Test Item ${Date.now().toString().slice(-4)}`,
                price: Math.floor(Math.random() * 500) + 100,
                quantity: 1,
                addedAt: new Date().toISOString()
              }])}
              className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-lg hover:bg-green-200"
            >
              Add Random Item
            </button>
          </div>

          {/* State Debug */}
          <details className="pt-4 border-t">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
              Debug State
            </summary>
            <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs overflow-auto max-h-48">
              {JSON.stringify({
                itemCount: cartItems.length,
                cartTotal,
                isOpen,
                showRequestForm,
                showInlineExtras,
                isProcessing,
                isProcessingPayment
              }, null, 2)}
            </pre>
          </details>
        </div>
      </div>

      {/* Cart Items Preview */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Cart Items Preview</h2>
        <div className="space-y-2">
          {cartItems.map((item, idx) => (
            <div key={item.cartId || idx} className="bg-white rounded-lg p-3 shadow-sm flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {item.type} • ${(item.totalWithFee || item.price || 0).toLocaleString()}
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                ['empty_legs', 'emptyleg', 'wines', 'wine', 'custom_extra'].includes(item.type)
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {['empty_legs', 'emptyleg', 'wines', 'wine', 'custom_extra'].includes(item.type) ? 'Payable' : 'Request Only'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-gray-800 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* CartSidebar Component */}
      <CartSidebar
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        cartItems={cartItems}
        setCartItems={setCartItems}
        cartTotal={cartTotal}
        user={MOCK_USER}
        userHasNFT={false}
        usedNFTBenefitThisYear={false}
        onToast={handleToast}
        onSendRequest={handleSendRequest}
        onOpenCalendar={handleOpenCalendar}
        isProcessing={isProcessing}
        isProcessingPayment={isProcessingPayment}
        setIsProcessingPayment={setIsProcessingPayment}
        showRequestForm={showRequestForm}
        setShowRequestForm={setShowRequestForm}
        showInlineExtras={showInlineExtras}
        setShowInlineExtras={setShowInlineExtras}
        selectedExtraCategory={selectedExtraCategory}
        setSelectedExtraCategory={setSelectedExtraCategory}
        customExtraForm={customExtraForm}
        setCustomExtraForm={setCustomExtraForm}
        extrasCatalog={MOCK_EXTRAS_CATALOG}
      />
    </div>
  );
};

export default CartSidebarTest;
