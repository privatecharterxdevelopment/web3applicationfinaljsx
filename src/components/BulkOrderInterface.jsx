import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Users, Clock, MapPin, Edit3, Trash2, Send, MessageSquare, Check, X } from 'lucide-react';

/**
 * Super Modern Bulk Order Interface
 * Perplexity-style: Users can adjust orders visually OR by chatting with AI
 */
const BulkOrderInterface = ({ cartItems, onUpdateItem, onRemoveItem, onSubmit, onChatAdjust }) => {
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [localUpdates, setLocalUpdates] = useState({});
  const chatInputRef = useRef(null);

  // Initialize local updates from cart items
  useEffect(() => {
    const updates = {};
    cartItems.forEach(item => {
      updates[item.cartId] = {
        date: item.date || '',
        time: item.time || '',
        passengers: item.passengers || 1,
        notes: item.notes || ''
      };
    });
    setLocalUpdates(updates);
  }, [cartItems]);

  const handleLocalUpdate = (itemId, field, value) => {
    setLocalUpdates(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  const saveItemUpdates = (itemId) => {
    const updates = localUpdates[itemId];
    const item = cartItems.find(i => i.cartId === itemId);
    if (item && updates) {
      onUpdateItem(itemId, updates);
      setEditingItem(null);
    }
  };

  const handleChatSubmit = () => {
    if (chatMessage.trim()) {
      onChatAdjust(chatMessage);
      setChatMessage('');
    }
  };

  const formatPrice = (item) => {
    if (item.price_range) return item.price_range;
    if (item.price) return `€${item.price.toLocaleString()}`;
    return 'Price on request';
  };

  const getItemIcon = (type) => {
    const icons = {
      'jets': '✈️',
      'empty_legs': '🛫',
      'helicopters': '🚁',
      'yachts': '🛥️',
      'taxi_cars': '🚗',
      'adventures': '🏔️'
    };
    return icons[type] || '📦';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-black to-gray-800 text-white px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-light tracking-wide">Your Bulk Request</h2>
              <p className="text-sm text-white/60 mt-1">{cartItems.length} service{cartItems.length > 1 ? 's' : ''} selected</p>
            </div>
            <button
              onClick={() => setShowChat(!showChat)}
              className={`px-4 py-2 rounded-xl transition-all ${
                showChat
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <MessageSquare size={18} className="inline mr-2" />
              {showChat ? 'Close Chat' : 'Adjust via Chat'}
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Order Items List - Left Side */}
          <div className="flex-1 overflow-y-auto p-8 space-y-4">
            {cartItems.map((item, idx) => {
              const isEditing = editingItem === item.cartId;
              const updates = localUpdates[item.cartId] || {};

              return (
                <div
                  key={item.cartId}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all"
                >
                  {/* Item Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getItemIcon(item.type)}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {item.name || item.title}
                          </h3>
                          {item.subtitle && (
                            <p className="text-sm text-gray-600">{item.subtitle}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 font-medium">
                        {formatPrice(item)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {!isEditing ? (
                        <button
                          onClick={() => setEditingItem(item.cartId)}
                          className="p-2 hover:bg-white rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={18} className="text-gray-600" />
                        </button>
                      ) : (
                        <button
                          onClick={() => saveItemUpdates(item.cartId)}
                          className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                          title="Save"
                        >
                          <Check size={18} className="text-green-600" />
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveItem(item.cartId)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </div>

                  {/* Editable Fields */}
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-white rounded-xl">
                      {/* Date */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          <Calendar size={14} className="inline mr-1" />
                          Date
                        </label>
                        <input
                          type="date"
                          value={updates.date || ''}
                          onChange={(e) => handleLocalUpdate(item.cartId, 'date', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                        />
                      </div>

                      {/* Time */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          <Clock size={14} className="inline mr-1" />
                          Time
                        </label>
                        <input
                          type="time"
                          value={updates.time || ''}
                          onChange={(e) => handleLocalUpdate(item.cartId, 'time', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                        />
                      </div>

                      {/* Passengers */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          <Users size={14} className="inline mr-1" />
                          Passengers
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={updates.passengers || 1}
                          onChange={(e) => handleLocalUpdate(item.cartId, 'passengers', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                        />
                      </div>

                      {/* Notes */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Notes / Special Requests
                        </label>
                        <textarea
                          value={updates.notes || ''}
                          onChange={(e) => handleLocalUpdate(item.cartId, 'notes', e.target.value)}
                          placeholder="Any special requirements..."
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm resize-none"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                      {updates.date && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar size={14} className="text-gray-500" />
                          <span>{updates.date}</span>
                        </div>
                      )}
                      {updates.time && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock size={14} className="text-gray-500" />
                          <span>{updates.time}</span>
                        </div>
                      )}
                      {updates.passengers && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Users size={14} className="text-gray-500" />
                          <span>{updates.passengers} pax</span>
                        </div>
                      )}
                      {updates.notes && (
                        <div className="col-span-3 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          {updates.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* AI Chat Panel - Right Side (Perplexity-style) */}
          {showChat && (
            <div className="w-96 border-l border-gray-200 bg-gray-50 flex flex-col">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-white">
                <h3 className="text-sm font-semibold text-gray-900">Adjust via Chat</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Tell me what you'd like to change
                </p>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <p className="text-sm text-gray-700">
                    👋 <strong>Hi!</strong> I can help you adjust your booking. Try saying:
                  </p>
                  <ul className="mt-3 space-y-2 text-xs text-gray-600">
                    <li className="pl-4 border-l-2 border-gray-300">"Change the jet departure to 3pm"</li>
                    <li className="pl-4 border-l-2 border-gray-300">"Add 2 more passengers to the car"</li>
                    <li className="pl-4 border-l-2 border-gray-300">"Move everything to next Friday"</li>
                    <li className="pl-4 border-l-2 border-gray-300">"Remove the yacht, keep the rest"</li>
                  </ul>
                </div>

                {/* Example: Show previous adjustments here */}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                  <input
                    ref={chatInputRef}
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                    placeholder="Type your adjustment..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  />
                  <button
                    onClick={handleChatSubmit}
                    disabled={!chatMessage.trim()}
                    className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Submit Actions */}
        <div className="border-t border-gray-200 bg-gray-50 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Services: {cartItems.length}</p>
              <p className="text-xs text-gray-500 mt-1">Review and adjust before submitting</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onSubmit(false)}
                className="px-6 py-3 border-2 border-black text-black rounded-xl hover:bg-black hover:text-white transition-all text-sm font-medium"
              >
                Save as Draft
              </button>
              <button
                onClick={() => onSubmit(true)}
                className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium shadow-lg"
              >
                Submit Request →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkOrderInterface;
