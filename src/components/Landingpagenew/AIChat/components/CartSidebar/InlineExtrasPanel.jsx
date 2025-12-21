// InlineExtrasPanel - Quick add extras within cart sidebar
import React from 'react';
import { X, Plus, Wine, Package } from 'lucide-react';

const EXTRA_CATEGORIES = [
  { id: 'wine', label: 'Wine & Champagne', icon: '🍷' },
  { id: 'cigars', label: 'Premium Cigars', icon: '🚬' },
  { id: 'catering', label: 'Catering', icon: '🍽️' },
  { id: 'flowers', label: 'Flowers', icon: '💐' },
  { id: 'other', label: 'Other', icon: '✨' }
];

const InlineExtrasPanel = ({
  selectedCategory,
  setSelectedCategory,
  customExtraForm,
  setCustomExtraForm,
  extrasCatalog = [],
  onAddExtra,
  onClose
}) => {
  // Get items for selected category
  const categoryItems = selectedCategory
    ? extrasCatalog.filter(item =>
        item.category?.toLowerCase() === selectedCategory ||
        item.type?.toLowerCase() === selectedCategory
      )
    : [];

  return (
    <div className="border-b border-gray-200 bg-white">
      {/* Header */}
      <div className="p-3 border-b border-gray-100 flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-900">Add Extras</h4>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Category Selection */}
      {!selectedCategory && (
        <div className="p-3 grid grid-cols-2 gap-2">
          {EXTRA_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors border border-gray-200 hover:border-gray-300"
            >
              <span className="text-xl">{cat.icon}</span>
              <p className="text-xs font-medium text-gray-700 mt-1">{cat.label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Category Items */}
      {selectedCategory && (
        <div className="p-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-xs text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1"
          >
            ← Back to categories
          </button>

          {categoryItems.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categoryItems.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {item.name || item.title}
                    </p>
                    {item.price && (
                      <p className="text-[10px] text-gray-500">
                        ${item.price.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      onAddExtra({
                        ...item,
                        cartId: `extra-${Date.now()}`,
                        type: 'custom_extra',
                        addedAt: new Date().toISOString()
                      });
                    }}
                    className="px-2 py-1 bg-gray-900 text-white text-[10px] font-medium rounded hover:bg-gray-800 transition-colors"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-4">
              No items in this category
            </p>
          )}

          {/* Custom Request */}
          <div className="pt-3 mt-3 border-t border-gray-200">
            <p className="text-[10px] text-gray-500 mb-2">Or add a custom request:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customExtraForm?.name || ''}
                onChange={(e) => setCustomExtraForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Custom item name..."
                className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gray-900 focus:border-transparent"
              />
              <button
                onClick={() => {
                  if (!customExtraForm?.name?.trim()) return;
                  onAddExtra({
                    id: `custom-${Date.now()}`,
                    name: customExtraForm.name,
                    type: 'custom_extra',
                    category: selectedCategory,
                    price: 0,
                    isEstimate: true,
                    isCustomRequest: true,
                    cartId: `extra-${Date.now()}`,
                    addedAt: new Date().toISOString()
                  });
                  setCustomExtraForm({ name: '', category: '', quantity: 1, notes: '' });
                }}
                disabled={!customExtraForm?.name?.trim()}
                className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus size={12} />
                Add
              </button>
            </div>
            <p className="text-[9px] text-gray-400 mt-1">Price on request</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InlineExtrasPanel;
