// CartItem - Individual cart item display with type-specific rendering
import React from 'react';
import {
  Trash2, Plus, Minus, Clock, Plane, Car, ChevronDown, ChevronUp,
  Calendar, MapPin, Users, Briefcase, Wine, Anchor, Package, Sparkles, Route, Heart
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
  const isTripPackage = item.type === 'trip_package';
  const isMedevac = item.type === 'medevac';
  const canDirectCheckout = isEmptyLeg || isAdventure || isWine;

  // Get item icon
  const getIcon = () => {
    if (isEmptyLeg || isJet) return <Plane size={14} className="text-gray-500" />;
    if (isHelicopter) return <Plane size={14} className="text-gray-500 rotate-45" />;
    if (isYacht) return <Anchor size={14} className="text-gray-500" />;
    if (isLuxuryCar || isTransfer) return <Car size={14} className="text-gray-500" />;
    if (isWine) return <Wine size={14} className="text-gray-500" />;
    if (isTripPackage) return <Route size={14} className="text-gray-500" />;
    if (isMedevac) return <Heart size={14} className="text-gray-500" />;
    return <Package size={14} className="text-gray-500" />;
  };

  // Get item image
  const getImage = () => {
    return item.primaryImage || item.image_url || item.image || item.aircraft_image;
  };

  // Format price - show "On Request" for items without fixed pricing
  const formatPrice = (price, showOnRequest = false) => {
    if (!price || isNaN(price) || price === 0) {
      return showOnRequest ? 'On Request' : 'TBD';
    }
    return `$${Number(price).toLocaleString()}`;
  };

  const price = item.totalWithFee || item.price || item.basePrice || 0;

  // Determine if this is a quote-only item (no fixed price)
  const isQuoteItem = isTransfer || isJet || isHelicopter || isYacht || isLuxuryCar || isMedevac;
  const hasNoPrice = !price || price === 0;
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

  // Trip Package - Special multi-segment layout
  if (isTripPackage) {
    const segments = item.segments || [];
    return (
      <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 animate-fade-in hover:border-gray-400 transition-all duration-300">
        {/* Header */}
        <div className="flex items-start gap-3 mb-2">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-gray-900 to-gray-700 flex items-center justify-center">
            <Sparkles size={16} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-gray-700 text-white">
                TRIP PACKAGE
              </span>
              {item.occasion && (
                <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-gray-200 text-gray-600">
                  {item.occasion}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">{itemName}</p>
            {item.dateRange && (
              <p className="text-xs text-gray-500">{item.dateRange}</p>
            )}
          </div>
          <button
            onClick={onRemove}
            className="p-1 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded transition-all"
          >
            <Trash2 size={12} />
          </button>
        </div>

        {/* Segments Summary */}
        <div className="border-t border-gray-200 pt-2 mt-2">
          <button
            onClick={onToggleExpand}
            className="w-full flex items-center justify-between text-xs text-gray-600 hover:text-gray-900"
          >
            <span>{segments.length} segments</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-2">
              {/* Trip Description */}
              {item.description && (
                <p className="text-[11px] text-gray-600 italic pb-2 border-b border-gray-200">
                  {item.description}
                </p>
              )}

              {/* Segments Detail */}
              {segments.map((seg, idx) => {
                const segIcon = {
                  jet: '✈️',
                  helicopter: '🚁',
                  ground_transfer: '🚗',
                  car: '🚘',
                  yacht: '🛥️',
                  activity: '⭐',
                  hotel: '🏨',
                  other: '📍'
                }[seg.type] || '📍';

                const typeLabel = {
                  jet: 'Private Jet',
                  helicopter: 'Helicopter',
                  ground_transfer: 'Ground Transfer',
                  car: 'Chauffeur Service',
                  yacht: 'Yacht Charter',
                  activity: 'Activity',
                  hotel: 'Accommodation',
                  other: 'Service'
                }[seg.type] || 'Service';

                return (
                  <div key={idx} className="bg-white rounded-lg p-2.5 border border-gray-100">
                    {/* Segment Header */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{segIcon}</span>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                            {idx + 1}. {typeLabel}
                          </p>
                          <p className="text-xs font-medium text-gray-800">
                            {seg.name || `${seg.from} → ${seg.to}`}
                          </p>
                        </div>
                      </div>
                      {seg.estimatedPrice > 0 && (
                        <span className="text-xs font-semibold text-gray-700">
                          €{seg.estimatedPrice.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Segment Details */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500">
                      {seg.from && seg.to && (
                        <span>{seg.from} → {seg.to}</span>
                      )}
                      {seg.date && (
                        <span className="flex items-center gap-0.5">
                          <Calendar size={10} />
                          {seg.date}
                        </span>
                      )}
                      {seg.time && <span>{seg.time}</span>}
                      {seg.duration && (
                        <span className="flex items-center gap-0.5">
                          <Clock size={10} />
                          {seg.duration}
                        </span>
                      )}
                      {seg.passengers && (
                        <span className="flex items-center gap-0.5">
                          <Users size={10} />
                          {seg.passengers} pax
                        </span>
                      )}
                      {seg.aircraft && <span>{seg.aircraft}</span>}
                      {seg.vehicle && <span>{seg.vehicle}</span>}
                    </div>

                    {/* Segment Notes */}
                    {seg.notes && (
                      <p className="text-[10px] text-gray-400 italic mt-1.5 pt-1.5 border-t border-gray-50">
                        {seg.notes}
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Trip Notes */}
              {item.notes && (
                <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-[10px] text-amber-700">
                    <strong>Note:</strong> {item.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            {item.passengers && <span>{item.passengers} pax</span>}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500">Est. Total</p>
            <p className="text-base font-bold text-gray-900">€{(item.estimatedTotal || price).toLocaleString()}</p>
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
            {isMedevac && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                item.urgencyLevel === 'critical' ? 'bg-red-100 text-red-700' :
                item.urgencyLevel === 'urgent' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {item.urgencyLevel === 'critical' ? 'CRITICAL' : item.urgencyLevel === 'urgent' ? 'URGENT' : 'MEDEVAC'}
              </span>
            )}
            {item.isPaid && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-green-100 text-green-700">
                PAID
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate">{itemName}</p>
          {/* Show full route for multi-stop journeys */}
          {item.route && typeof item.route === 'string' ? (
            <p className="text-xs text-gray-500 truncate font-mono">
              {item.route}
            </p>
          ) : item.route && typeof item.route === 'object' ? (
            <p className="text-xs text-gray-500 truncate">
              {item.route.origin} → {item.route.destination}
            </p>
          ) : (item.from || item.from_city) && (item.to || item.to_city) ? (
            <p className="text-xs text-gray-500 truncate">
              {item.from || item.from_city} → {item.to || item.to_city}
            </p>
          ) : null}
          {/* Show flight time and price summary for jets */}
          {(isJet || isHelicopter) && (item.estimatedDuration || item.billedHours) && (
            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
              {item.estimatedDuration && <span>{item.estimatedDuration}</span>}
              {item.isMultiStop && item.stops?.length > 0 && (
                <span className="px-1 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px]">
                  {item.stops.length} stop{item.stops.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
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
          {isQuoteItem && hasNoPrice ? (
            <p className="text-xs font-medium text-gray-500 italic mt-1">On Request</p>
          ) : (
            <p className="text-sm font-bold text-gray-900 mt-1">{formatPrice(price, isQuoteItem)}</p>
          )}
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

      {/* Jet/Helicopter Expanded Details - Multi-Stop Route */}
      {isExpanded && (isJet || isHelicopter) && (
        <div className="mt-2 pt-2 border-t border-gray-200 space-y-3 text-xs">
          {/* Route Overview */}
          {item.route && typeof item.route === 'string' && (
            <div className="flex items-center gap-2 text-gray-600">
              <Route size={12} className="text-gray-400 flex-shrink-0" />
              <span className="font-mono text-[11px] font-medium">{item.route}</span>
            </div>
          )}

          {/* Multi-Stop Legs */}
          {item.isMultiStop && item.legs && item.legs.length > 0 && (
            <div className="space-y-2 bg-white rounded-lg p-2 border border-gray-100">
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Flight Legs</p>
              {item.legs.map((leg, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-medium text-gray-600">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-gray-800">
                        {leg.fromCode || leg.from} → {leg.toCode || leg.to}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <span>{Math.round(leg.distance * 0.54)} nm</span>
                        <span>•</span>
                        <span>{leg.flightTime ? `${Math.floor(leg.flightTime)}h ${Math.round((leg.flightTime % 1) * 60)}m` : '—'}</span>
                      </div>
                    </div>
                  </div>
                  {leg.departureTime && leg.arrivalTime && (
                    <div className="text-right text-[10px] text-gray-500">
                      <p>{leg.departureTime} → {leg.arrivalTime}</p>
                    </div>
                  )}
                </div>
              ))}

              {/* Stops Info */}
              {item.stops && item.stops.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-[10px] text-gray-500">
                    <span className="font-medium">Stops:</span> {item.stops.map(s => s.city || s.code).join(' • ')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Flight Summary */}
          <div className="grid grid-cols-3 gap-2 bg-gray-100 rounded-lg p-2">
            <div className="text-center">
              <p className="text-[10px] text-gray-500">Flight Time</p>
              <p className="text-[11px] font-semibold text-gray-800">
                {item.flightDuration || item.estimatedDuration ||
                 (item.flightHours ? `${Math.floor(item.flightHours)}h ${Math.round((item.flightHours % 1) * 60)}m` :
                  item.flightTimeHours ? `${Math.floor(item.flightTimeHours)}h ${Math.round((item.flightTimeHours % 1) * 60)}m` :
                  item.billedHours ? `${item.billedHours}h` : '—')}
              </p>
            </div>
            <div className="text-center border-x border-gray-200">
              <p className="text-[10px] text-gray-500">Hourly Rate</p>
              <p className="text-[11px] font-semibold text-gray-800">
                {item.hourlyRate ? `€${item.hourlyRate.toLocaleString()}/hr` : '—'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-500">Est. Price</p>
              <p className="text-[11px] font-semibold text-gray-800">
                {(item.estimatedPrice || item.price || item.basePrice) > 0
                  ? `€${(item.estimatedPrice || item.price || item.basePrice).toLocaleString()}`
                  : 'On Request'}
              </p>
            </div>
          </div>

          {/* Price Calculation */}
          {item.priceCalculation && (
            <p className="text-[10px] text-gray-500 text-center">
              {item.priceCalculation}
            </p>
          )}

          {/* Travel Details */}
          <div className="space-y-1.5 text-gray-600">
            {(item.date || item.departure_date) && (
              <div className="flex items-center gap-2">
                <Calendar size={12} className="text-gray-400" />
                <span>{item.date || item.departure_date} {(item.time || item.departure_time) && `at ${item.time || item.departure_time}`}</span>
              </div>
            )}
            {item.passengers && (
              <div className="flex items-center gap-2">
                <Users size={12} className="text-gray-400" />
                <span>{item.passengers} passengers</span>
              </div>
            )}
            {item.catering && item.catering !== 'complimentary' && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">🍽️</span>
                <span>{item.catering}</span>
              </div>
            )}
            {item.notes && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                <span className="text-amber-500 mt-0.5">📝</span>
                <span className="text-amber-700">{item.notes}</span>
              </div>
            )}
          </div>

          {/* Overnight Stays Warning */}
          {item.hasOvernightStays && (
            <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-amber-500">🌙</span>
              <p className="text-[10px] text-amber-700">Includes overnight stop(s)</p>
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
