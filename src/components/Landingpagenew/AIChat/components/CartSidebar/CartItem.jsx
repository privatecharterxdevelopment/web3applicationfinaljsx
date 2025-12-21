// CartItem - Individual cart item display with type-specific rendering
import React from 'react';
import {
  Trash2, Plus, Minus, Clock, Plane, Car, ChevronDown, ChevronUp,
  Calendar, MapPin, Users, Briefcase, Wine, Anchor, Package
} from 'lucide-react';

const CartItem = ({
  item,
  index,
  isExpanded,
  onToggleExpand,
  onRemove,
  onUpdate,
  onOpenCalendar
}) => {
  // Determine item type
  const isEmptyLeg = item.type === 'empty_legs' || item.type === 'emptyleg';
  const isAdventure = item.type === 'adventure' || item.type === 'fixed_offer';
  const isTransfer = item.type === 'taxi' || item.type === 'transfer' || item.type === 'ground_transport';
  const isJet = item.type === 'jets' || item.type === 'jet';
  const isHelicopter = item.type === 'helicopters' || item.type === 'helicopter';
  const isYacht = item.type === 'yachts' || item.type === 'yacht';
  const isLuxuryCar = item.type === 'luxury_cars' || item.type === 'luxury_car';
  const isWine = item.type === 'wines' || item.type === 'wine';
  const isCustomExtra = item.type === 'custom_extra';
  const canDirectCheckout = isEmptyLeg || isAdventure || isWine;

  // Get item icon
  const getIcon = () => {
    if (isEmptyLeg || isJet) return <Plane size={14} className="text-gray-500" />;
    if (isHelicopter) return <Plane size={14} className="text-gray-500 rotate-45" />;
    if (isYacht) return <Anchor size={14} className="text-gray-500" />;
    if (isLuxuryCar || isTransfer) return <Car size={14} className="text-gray-500" />;
    if (isWine) return <Wine size={14} className="text-gray-500" />;
    return <Package size={14} className="text-gray-500" />;
  };

  // Get item image
  const getImage = () => {
    return item.primaryImage || item.image_url || item.image || item.aircraft_image;
  };

  // Format price
  const formatPrice = (price) => {
    if (!price || isNaN(price)) return 'TBD';
    return `$${Number(price).toLocaleString()}`;
  };

  const price = item.totalWithFee || item.price || item.basePrice || 0;
  const itemName = item.name || item.title || item.aircraft_type || item.model || 'Item';

  // Custom Extra - Special horizontal layout
  if (isCustomExtra) {
    return (
      <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 animate-fade-in hover:border-gray-400 transition-all duration-300">
        <div className="flex gap-3">
          {/* Left: Product Image */}
          <div className="flex-shrink-0">
            {item.image ? (
              <div className="w-14 h-18 rounded-lg overflow-hidden bg-white border border-gray-200 shadow-sm">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-14 h-18 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 text-lg">
                {item.category === 'wine' ? '🍷' : item.category === 'champagne' ? '🍾' : item.category === 'cigars' ? '🚬' : '✨'}
              </div>
            )}
          </div>

          {/* Center: Title & Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-gray-700 text-white">
                {item.category?.toUpperCase() || 'EXTRA'}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">{itemName}</p>

            {/* Quantity selector */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-gray-500">Qty:</span>
              <button
                onClick={() => {
                  const qty = Math.max(1, (item.quantity || 1) - 1);
                  const unitPrice = item.unitPrice || item.price;
                  onUpdate({
                    quantity: qty,
                    price: unitPrice * qty,
                    basePrice: unitPrice * qty,
                    totalWithFee: unitPrice * qty
                  });
                }}
                className="w-5 h-5 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 text-xs"
              >
                -
              </button>
              <span className="text-xs font-medium w-4 text-center">{item.quantity || 1}</span>
              <button
                onClick={() => {
                  const qty = (item.quantity || 1) + 1;
                  const unitPrice = item.unitPrice || item.price;
                  onUpdate({
                    quantity: qty,
                    price: unitPrice * qty,
                    basePrice: unitPrice * qty,
                    totalWithFee: unitPrice * qty
                  });
                }}
                className="w-5 h-5 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 text-xs"
              >
                +
              </button>
            </div>
          </div>

          {/* Right: Price & Remove */}
          <div className="flex flex-col items-end justify-between">
            <button
              onClick={onRemove}
              className="p-1 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded transition-all"
            >
              <Trash2 size={12} />
            </button>
            <div className="text-right">
              <p className="text-xs text-gray-500">Est.</p>
              <p className="text-sm font-bold text-gray-900">~{formatPrice(price)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard item layout
  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 animate-fade-in hover:border-gray-400 transition-all duration-300">
      {/* Header Row */}
      <div className="flex items-start gap-3">
        {/* Image */}
        <div className="flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden bg-gray-200">
          {getImage() ? (
            <img src={getImage()} alt={itemName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {getIcon()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {canDirectCheckout && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-emerald-100 text-emerald-700">
                INSTANT
              </span>
            )}
            {item.isPaid && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-green-100 text-green-700">
                PAID
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate">{itemName}</p>
          {(item.from || item.from_city) && (item.to || item.to_city) && (
            <p className="text-xs text-gray-500 truncate">
              {item.from || item.from_city} → {item.to || item.to_city}
            </p>
          )}
        </div>

        {/* Price & Actions */}
        <div className="flex flex-col items-end">
          <button
            onClick={onRemove}
            className="p-1 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded transition-all"
          >
            <Trash2 size={12} />
          </button>
          <p className="text-sm font-bold text-gray-900 mt-1">{formatPrice(price)}</p>
        </div>
      </div>

      {/* Expandable Details */}
      {(isEmptyLeg || isJet || isHelicopter) && (
        <button
          onClick={onToggleExpand}
          className="w-full mt-2 pt-2 border-t border-gray-200 flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {isExpanded ? 'Hide details' : 'Show details'}
        </button>
      )}

      {isExpanded && isEmptyLeg && (
        <div className="mt-2 pt-2 border-t border-gray-200 space-y-1.5 text-xs text-gray-600">
          {item.departure_date && (
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-gray-400" />
              <span>{item.departure_date} {item.departure_time && `at ${item.departure_time}`}</span>
            </div>
          )}
          {item.aircraft_type && (
            <div className="flex items-center gap-2">
              <Plane size={12} className="text-gray-400" />
              <span>{item.aircraft_type}</span>
            </div>
          )}
          {item.capacity && (
            <div className="flex items-center gap-2">
              <Users size={12} className="text-gray-400" />
              <span>{item.capacity} passengers max</span>
            </div>
          )}
        </div>
      )}

      {/* Add to Calendar button for flights */}
      {(isEmptyLeg || isJet || isHelicopter) && item.departure_date && onOpenCalendar && (
        <button
          onClick={() => onOpenCalendar(item)}
          className="w-full mt-2 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <Calendar size={12} />
          Add to Calendar
        </button>
      )}
    </div>
  );
};

export default CartItem;
