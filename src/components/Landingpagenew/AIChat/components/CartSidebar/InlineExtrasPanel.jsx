// InlineExtrasPanel - Add in-flight extras within cart sidebar
// Full catalog with pricing for champagne, cigars, caviar, flowers, catering, spirits
import React, { useState } from 'react';
import { X, Plus, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

// Extras categories
const EXTRAS_CATEGORIES = [
  { id: 'champagne', label: 'Champagne', icon: '🍾', description: 'Premium champagnes & sparkling wines' },
  { id: 'cigars', label: 'Premium Cigars', icon: '🚬', description: 'Cuban & premium cigars', warning: '+$2,000 aircraft cleaning fee' },
  { id: 'caviar', label: 'Caviar', icon: '🥄', description: 'Finest caviars & accompaniments' },
  { id: 'flowers', label: 'Flowers', icon: '💐', description: 'Fresh arrangements & cabin decoration' },
  { id: 'catering', label: 'Catering', icon: '🍽️', description: 'Gourmet meals & snacks' },
  { id: 'spirits', label: 'Spirits', icon: '🥃', description: 'Premium whisky, cognac & vodka' }
];

// Full extras catalog with pricing
const EXTRAS_CATALOG = {
  champagne: [
    { name: 'Moët & Chandon Brut', price: 120, description: 'Classic brut champagne' },
    { name: 'Veuve Clicquot Yellow Label', price: 150, description: 'Rich and full-bodied' },
    { name: 'Krug Grande Cuvée', price: 350, description: 'Multi-vintage prestige' },
    { name: 'Louis Roederer Cristal', price: 450, description: 'Iconic prestige cuvée' },
    { name: 'Dom Pérignon Rosé', price: 550, description: 'Vintage rosé champagne' },
    { name: 'Bollinger La Grande Année', price: 280, description: 'Vintage prestige cuvée' },
    { name: 'Perrier-Jouët Belle Epoque', price: 380, description: 'Floral prestige cuvée' },
    { name: 'Armand de Brignac Brut Gold', price: 650, description: 'Ace of Spades' }
  ],
  cigars: [
    { name: 'Cohiba Behike BHK 52', price: 150, description: 'Per stick - Ultra premium' },
    { name: 'Cohiba Behike BHK 54', price: 180, description: 'Per stick - Rare & exclusive' },
    { name: 'Montecristo No. 2', price: 80, description: 'Per stick - Torpedo classic' },
    { name: 'Davidoff Churchill', price: 60, description: 'Per stick - Smooth & refined' },
    { name: 'Romeo y Julieta Churchill', price: 45, description: 'Per stick - Medium-bodied' },
    { name: 'Partagás Serie D No. 4', price: 55, description: 'Per stick - Full-bodied Cuban' },
    { name: 'Box of 5 Cohiba Robustos', price: 350, description: 'Premium gift box' },
    { name: 'Smoking Lounge Setup', price: 500, description: 'Humidor, cutter, lighter + cleaning' }
  ],
  caviar: [
    { name: 'Beluga Caviar 50g', price: 400, description: 'Huso huso - The finest' },
    { name: 'Beluga Caviar 125g', price: 950, description: 'Huso huso - For larger groups' },
    { name: 'Oscietra Caviar 50g', price: 250, description: 'Nutty & complex flavor' },
    { name: 'Oscietra Caviar 125g', price: 580, description: 'For larger groups' },
    { name: 'Sevruga Caviar 50g', price: 180, description: 'Intense & delicate' },
    { name: 'Kaluga Queen 50g', price: 300, description: 'River Beluga alternative' },
    { name: 'Caviar Tasting Set', price: 450, description: '3x 30g with blinis & crème fraîche' },
    { name: 'Caviar Service Setup', price: 650, description: 'Mother of pearl spoons, ice bed, full service' }
  ],
  flowers: [
    { name: 'Red Roses Bouquet (12)', price: 150, description: 'Classic romantic arrangement' },
    { name: 'White Orchids Arrangement', price: 200, description: 'Elegant phalaenopsis' },
    { name: 'Mixed Seasonal Bouquet', price: 120, description: 'Fresh seasonal selection' },
    { name: 'Luxury Arrangement', price: 350, description: 'Designer custom arrangement' },
    { name: 'Cabin Rose Petals', price: 180, description: 'Romantic cabin decoration' },
    { name: 'Full Cabin Decoration', price: 500, description: 'Flowers, candles, ambiance setup' },
    { name: 'Wedding/Proposal Setup', price: 750, description: 'Complete romantic setup' },
    { name: 'Anniversary Package', price: 400, description: 'Flowers + champagne setup' }
  ],
  catering: [
    { name: 'Light Snacks & Drinks', price: 100, description: 'Nuts, fruits, soft drinks' },
    { name: 'Continental Breakfast', price: 150, description: 'Pastries, coffee, juice' },
    { name: 'Gourmet Lunch Box', price: 200, description: 'Premium sandwiches & salads' },
    { name: 'Hot Meal Service', price: 350, description: 'Chef-prepared hot dishes' },
    { name: 'Premium Dinner Service', price: 450, description: '3-course gourmet dinner' },
    { name: 'Michelin-Star Menu', price: 750, description: 'Curated by partner chefs' },
    { name: 'Sushi & Sashimi Platter', price: 300, description: 'Fresh premium selection' },
    { name: 'Custom Menu Request', price: 0, description: 'Price on request - Bespoke menu' }
  ],
  spirits: [
    { name: 'Macallan 18 Year', price: 350, description: 'Single malt Scotch whisky' },
    { name: 'Macallan 25 Year', price: 850, description: 'Rare aged single malt' },
    { name: 'Hennessy XO', price: 280, description: 'Prestige cognac' },
    { name: 'Rémy Martin Louis XIII', price: 3500, description: 'Ultra-premium cognac' },
    { name: 'Grey Goose Vodka', price: 80, description: 'Premium French vodka' },
    { name: 'Beluga Noble Vodka', price: 120, description: 'Russian luxury vodka' },
    { name: 'Whisky Tasting Set', price: 250, description: '4x premium whiskies' },
    { name: 'Cognac Tasting Set', price: 350, description: '3x prestige cognacs' }
  ]
};

const InlineExtrasPanel = ({
  selectedCategory,
  setSelectedCategory,
  customExtraForm,
  setCustomExtraForm,
  cartItems = [],
  onAddExtra,
  onClose
}) => {
  const [expandedCategory, setExpandedCategory] = useState(selectedCategory);

  // Get items for selected category
  const categoryItems = expandedCategory ? EXTRAS_CATALOG[expandedCategory] || [] : [];
  const categoryInfo = EXTRAS_CATEGORIES.find(c => c.id === expandedCategory);

  // Check if cigar cleaning fee already exists in cart
  const hasCleaningFee = cartItems.some(item =>
    item.name === 'Aircraft Cleaning Fee (Cigars)' || item.isCleaningFee
  );

  const handleAddItem = (item) => {
    // Add the item
    onAddExtra({
      ...item,
      id: `extra-${Date.now()}`,
      cartId: `extra-${Date.now()}`,
      type: 'custom_extra',
      category: expandedCategory,
      unitPrice: item.price,
      quantity: 1,
      addedAt: new Date().toISOString()
    });

    // If adding cigars and no cleaning fee exists, add the cleaning fee
    if (expandedCategory === 'cigars' && !hasCleaningFee) {
      setTimeout(() => {
        onAddExtra({
          name: 'Aircraft Cleaning Fee (Cigars)',
          description: 'Required deep cleaning after cigar smoking',
          price: 2000,
          id: `cleaning-fee-${Date.now()}`,
          cartId: `cleaning-fee-${Date.now()}`,
          type: 'service_fee',
          category: 'service',
          unitPrice: 2000,
          quantity: 1,
          isCleaningFee: true,
          addedAt: new Date().toISOString()
        });
      }, 100);
    }
  };

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-white/50">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            ✨ In-Flight Extras
          </h4>
          <p className="text-[10px] text-gray-500">Add champagne, cigars, caviar & more</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Category Selection */}
      {!expandedCategory && (
        <div className="p-3 grid grid-cols-2 gap-2">
          {EXTRAS_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setExpandedCategory(cat.id);
                setSelectedCategory(cat.id);
              }}
              className="p-3 bg-white hover:bg-gray-100 rounded-xl text-left transition-all border border-gray-200 hover:border-gray-400 hover:shadow-sm"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{cat.icon}</span>
                <span className="text-xs font-semibold text-gray-800">{cat.label}</span>
              </div>
              <p className="text-[10px] text-gray-500 leading-tight">{cat.description}</p>
              {cat.warning && (
                <p className="text-[9px] text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle size={10} />
                  {cat.warning}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Category Items */}
      {expandedCategory && (
        <div className="p-3">
          {/* Back button */}
          <button
            onClick={() => {
              setExpandedCategory(null);
              setSelectedCategory(null);
            }}
            className="text-xs text-gray-600 hover:text-gray-800 mb-3 flex items-center gap-1 font-medium"
          >
            ← Back to categories
          </button>

          {/* Category header */}
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
            <span className="text-2xl">{categoryInfo?.icon}</span>
            <div>
              <h5 className="font-semibold text-gray-900 text-sm">{categoryInfo?.label}</h5>
              <p className="text-[10px] text-gray-500">{categoryInfo?.description}</p>
            </div>
          </div>

          {/* Cigars warning */}
          {expandedCategory === 'cigars' && (
            <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-800">
                <strong>Note:</strong> A $2,000 aircraft cleaning fee applies for smoking on board. This will be added to your final invoice.
              </p>
            </div>
          )}

          {/* Items list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {categoryItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200 hover:border-gray-400 transition-colors"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-medium text-gray-800">{item.name}</p>
                  <p className="text-[10px] text-gray-500">{item.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-semibold text-gray-900">
                    {item.price > 0 ? `$${item.price.toLocaleString()}` : 'Quote'}
                  </span>
                  <button
                    onClick={() => handleAddItem(item)}
                    className="px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-[10px] font-medium rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus size={12} />
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Custom Request */}
          <div className="pt-3 mt-3 border-t border-gray-200">
            <p className="text-[10px] text-gray-600 mb-2 font-medium">Custom Request:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customExtraForm?.name || ''}
                onChange={(e) => setCustomExtraForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Describe your custom request..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
              />
              <button
                onClick={() => {
                  if (!customExtraForm?.name?.trim()) return;
                  onAddExtra({
                    id: `custom-${Date.now()}`,
                    name: customExtraForm.name,
                    type: 'custom_extra',
                    category: expandedCategory,
                    price: 0,
                    isEstimate: true,
                    isCustomRequest: true,
                    cartId: `extra-${Date.now()}`,
                    addedAt: new Date().toISOString()
                  });
                  setCustomExtraForm({ name: '', category: '', quantity: 1, notes: '' });
                }}
                disabled={!customExtraForm?.name?.trim()}
                className="px-3 py-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus size={12} />
                Add
              </button>
            </div>
            <p className="text-[9px] text-gray-400 mt-1">Custom items are priced on request</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InlineExtrasPanel;
