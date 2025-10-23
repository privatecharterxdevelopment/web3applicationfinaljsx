import React, { useState } from 'react';
import { X, Plus, Zap, Check } from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';

const TopUpModal = ({ isOpen, onClose, currentChats, onPurchase }) => {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(false);

  const topUpPackages = [
    {
      id: '5_chats',
      name: '5 Chats',
      chats: 5,
      price: 15,
      pricePerChat: 3.00,
      savings: null,
      popular: false
    },
    {
      id: '10_chats',
      name: '10 Chats',
      chats: 10,
      price: 25,
      pricePerChat: 2.50,
      savings: '17% OFF',
      popular: true
    },
    {
      id: '25_chats',
      name: '25 Chats',
      chats: 25,
      price: 50,
      pricePerChat: 2.00,
      savings: '33% OFF',
      popular: false
    },
    {
      id: '50_chats',
      name: '50 Chats',
      chats: 50,
      price: 85,
      pricePerChat: 1.70,
      savings: '43% OFF',
      popular: false
    }
  ];

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setLoading(true);
    try {
      // This will trigger Stripe payment
      if (onPurchase) {
        await onPurchase(selectedPackage);
      }
      onClose();
    } catch (error) {
      console.error('Error purchasing top-up:', error);
      alert('Failed to purchase top-up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-light text-black mb-2">Top Up Chats</h2>
            <p className="text-gray-500 font-light">
              {currentChats?.chatsRemaining !== null ? (
                <>
                  You have <strong>{currentChats.chatsRemaining}</strong> chats remaining this month
                </>
              ) : (
                'Add extra conversations to your account'
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-50 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Packages */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {topUpPackages.map((pkg) => {
              const isSelected = selectedPackage?.id === pkg.id;

              return (
                <div
                  key={pkg.id}
                  onClick={() => handleSelectPackage(pkg)}
                  className={`relative rounded-2xl border-2 p-6 cursor-pointer transition-all duration-300 ${
                    pkg.popular
                      ? 'border-black bg-black text-white scale-105'
                      : isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {/* Savings Badge */}
                  {pkg.savings && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium ${
                      pkg.popular ? 'bg-white text-black' : 'bg-green-500 text-white'
                    }`}>
                      {pkg.savings}
                    </div>
                  )}

                  {/* Popular Badge */}
                  {pkg.popular && !pkg.savings && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium bg-white text-black">
                      BEST VALUE
                    </div>
                  )}

                  {/* Icon */}
                  <div className="mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      pkg.popular ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      <Plus size={24} className={pkg.popular ? 'text-white' : 'text-gray-600'} />
                    </div>
                  </div>

                  {/* Chats */}
                  <h3 className={`text-2xl font-light mb-2 ${
                    pkg.popular ? 'text-white' : 'text-black'
                  }`}>
                    {pkg.chats} Chats
                  </h3>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-light ${
                        pkg.popular ? 'text-white' : 'text-black'
                      }`}>
                        ${pkg.price}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${
                      pkg.popular ? 'text-white/60' : 'text-gray-400'
                    }`}>
                      ${pkg.pricePerChat.toFixed(2)} per chat
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2">
                      <Check size={14} className={pkg.popular ? 'text-white' : 'text-green-500'} />
                      <span className={`text-xs ${
                        pkg.popular ? 'text-white/80' : 'text-gray-600'
                      }`}>
                        25 messages per chat
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className={pkg.popular ? 'text-white' : 'text-green-500'} />
                      <span className={`text-xs ${
                        pkg.popular ? 'text-white/80' : 'text-gray-600'
                      }`}>
                        Voice & text support
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className={pkg.popular ? 'text-white' : 'text-green-500'} />
                      <span className={`text-xs ${
                        pkg.popular ? 'text-white/80' : 'text-gray-600'
                      }`}>
                        Never expires
                      </span>
                    </div>
                  </div>

                  {/* Select Button */}
                  <button
                    onClick={() => handleSelectPackage(pkg)}
                    className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : pkg.popular
                        ? 'bg-white text-black hover:bg-gray-100'
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap size={20} className="text-white" />
              </div>
              <div>
                <h4 className="font-medium text-black mb-2">Top-Up Benefits</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Top-up chats <strong>never expire</strong></li>
                  <li>• Use them anytime, even after your subscription renews</li>
                  <li>• Each chat includes <strong>25 full messages</strong></li>
                  <li>• Instant activation - start chatting immediately</li>
                  <li>• Combine with your subscription for unlimited flexibility</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-8 border-t border-gray-100 bg-gray-50">
          <div>
            <p className="text-sm text-gray-600">
              {selectedPackage ? (
                <>
                  You selected <strong>{selectedPackage.name}</strong> for <strong>${selectedPackage.price}</strong>
                </>
              ) : (
                'Select a package to continue'
              )}
            </p>
            {selectedPackage && currentChats?.chatsRemaining !== null && (
              <p className="text-xs text-gray-400 mt-1">
                After purchase: {currentChats.chatsRemaining + selectedPackage.chats} chats available
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handlePurchase}
              disabled={!selectedPackage || loading}
              className={`px-8 py-3 rounded-xl text-sm font-medium transition-all ${
                selectedPackage && !loading
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Processing...' : `Purchase for $${selectedPackage?.price || 0}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopUpModal;
