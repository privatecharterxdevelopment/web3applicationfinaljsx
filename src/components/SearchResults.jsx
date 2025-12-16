import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check, X, Plane, Clock, MapPin, Users, Gauge, Fuel, ShoppingCart, CreditCard, Wallet, Wine, Thermometer, Star, Grape } from 'lucide-react';
import BookableServiceCard from './BookableServiceCard';

/**
 * SearchResults component displays search results in expandable tabs/cards
 */
const SearchResults = ({ tabs, onSelectItem, selectedItems = [], onBookNow, onAddToCart, onRequestChanges, onPayCrypto, onBuildJourney }) => {
  // Debug: Log tabs data on mount
  React.useEffect(() => {
    console.log('📋 SearchResults tabs:', tabs);
    if (tabs?.[0]?.items?.[0]) {
      const item = tabs[0].items[0];
      console.log('📋 First item in first tab:', item);
      console.log('📋 Item type:', item.type);
      console.log('📋 Item max_passengers:', item.max_passengers);
      console.log('📋 Item range_km:', item.range_km);
      console.log('📋 Item category:', item.category);
      console.log('📋 Item price_range:', item.price_range);
    }
  }, [tabs]);

  // Set initial active tab
  const getInitialTab = () => {
    if (tabs.length === 0) return null;
    return tabs[0].id;
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [expandedCards, setExpandedCards] = useState({});
  const [showAllItems, setShowAllItems] = useState(false);
  const [expandedWineSections, setExpandedWineSections] = useState({});

  const toggleWineSection = (itemId, section) => {
    setExpandedWineSections(prev => ({
      ...prev,
      [`${itemId}-${section}`]: !prev[`${itemId}-${section}`]
    }));
  };

  if (!tabs || tabs.length === 0) {
    return null;
  }

  const toggleCardExpanded = (itemId) => {
    setExpandedCards(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const isItemSelected = (itemId) => {
    return selectedItems.includes(itemId);
  };

  // Get current tab data
  let currentTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="w-full max-w-4xl mx-auto mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Tabs Navigation - Minimal like MyBookings filter tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {tab.id === 'emptylegs' ? 'Empty Legs' :
             tab.id === 'jets' ? 'Private Jets' :
             tab.id === 'helicopters' ? 'Helicopters' :
             tab.id === 'yachts' ? 'Yachts' :
             tab.id === 'adventures' ? 'Adventures' :
             tab.id === 'wines' ? 'Wines' :
             (tab.id === 'luxury_cars' || tab.id === 'luxuryCars') ? 'Supercars' :
             (tab.id === 'transfers' || tab.id === 'ground_transport' || tab.id === 'taxi') ? 'Transfers' :
             tab.title}
            {tab.items?.length > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.id
                  ? 'bg-white/20'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.items.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content - List format like MyBookings */}
      {currentTabData && (
        <div className="space-y-2">
          {currentTabData.items.slice(0, showAllItems ? currentTabData.items.length : 5).map((item, index) => (
            <div
              key={item.id}
              className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-all"
            >
              {/* Clickable header - compact like MyBookings */}
              <div
                onClick={() => toggleCardExpanded(item.id)}
                className="px-4 py-3 flex items-center gap-4 cursor-pointer"
              >
                {/* Service Icon/Image - smaller */}
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 flex-shrink-0 overflow-hidden">
                  {/* No images for luxury cars - show icon instead */}
                  {item.type === 'luxury_cars' ? (
                    <span className="text-sm">🏎️</span>
                  ) : (item.primaryImage || item.image_url || item.image_url_1 || item.image) ? (
                    <img
                      src={item.primaryImage || item.image_url || item.image_url_1 || item.image}
                      alt={item.name || item.title || 'Service'}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3l14 9-14 9V3z"/></svg>'; }}
                    />
                  ) : item.type === 'wines' ? (
                    <Wine size={14} className="text-gray-500" />
                  ) : item.type === 'delicatesse' || item.type === 'cigars' ? (
                    <span className="text-sm">🎁</span>
                  ) : (
                    <Plane size={14} />
                  )}
                </div>

                {/* Service Details - refined typography */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.type === 'empty_legs'
                        ? `${item.from_iata || item.from_city || '?'} → ${item.to_iata || item.to_city || '?'}`
                        : item.type === 'wines'
                        ? (item.displayTitle || item.name || 'Wine')
                        : item.type === 'delicatesse' || item.type === 'cigars'
                        ? (item.displayTitle || item.name || 'Luxury Extra')
                        : (item.name || item.model || item.title || 'Unnamed Service')}
                    </p>
                    {/* Category Badge - subtle */}
                    {item.type === 'jets' && (item.category || item.aircraft_type) && (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full border bg-blue-50 text-blue-600 border-blue-200">
                        {item.category || item.aircraft_type}
                      </span>
                    )}
                    {/* Fuel stops badge - subtle */}
                    {item.type === 'jets' && item.stops !== undefined && (
                      item.stops === 0 ? (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                          Non-stop
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                          {item.stops} stop{item.stops > 1 ? 's' : ''}
                        </span>
                      )
                    )}
                  </div>

                  {/* Subtle sub-info line - MyBookings style */}
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                    {/* Jets */}
                    {item.type === 'jets' && (
                      <>
                        <span>{item.max_passengers || item.pax_capacity || '?'} pax</span>
                        {item.estimatedDuration && (
                          <>
                            <span>•</span>
                            <span>{item.estimatedDuration}</span>
                          </>
                        )}
                        {item.range_km && (
                          <>
                            <span>•</span>
                            <span>{item.range_km.toLocaleString()} km range</span>
                          </>
                        )}
                      </>
                    )}

                    {/* Empty Legs */}
                    {item.type === 'empty_legs' && (
                      <>
                        {item.aircraft_type && <span>{item.aircraft_type}</span>}
                        <span>•</span>
                        <span>{item.capacity || item.available_seats || '?'} pax</span>
                        {item.departure_date && (
                          <>
                            <span>•</span>
                            <span>{new Date(item.departure_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </>
                        )}
                      </>
                    )}

                    {/* Helicopters */}
                    {item.type === 'helicopters' && (
                      <span>{item.max_passengers} pax</span>
                    )}

                    {/* Yachts */}
                    {item.type === 'yachts' && (
                      <>
                        <span>{item.length_ft}ft</span>
                        <span>•</span>
                        <span>{item.max_passengers} guests</span>
                      </>
                    )}

                    {/* Luxury Cars - show description like empty legs */}
                    {item.type === 'luxury_cars' && (
                      <>
                        {item.brand && <span>{item.brand}</span>}
                        {item.year && (
                          <>
                            <span>•</span>
                            <span>{item.year}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{item.seats || 2} seats</span>
                        {item.category && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{item.category}</span>
                          </>
                        )}
                      </>
                    )}

                    {/* Transfers */}
                    {(item.type === 'ground_transport' || item.type === 'transfer' || item.type === 'taxi') && (
                      <>
                        <span>{item.vehicle_class || 'Business'}</span>
                        <span>•</span>
                        <span>{item.seats || item.max_passengers || 4} pax</span>
                        {item.durationMinutes && (
                          <>
                            <span>•</span>
                            <span>~{item.durationMinutes} min</span>
                          </>
                        )}
                      </>
                    )}

                    {/* Adventures */}
                    {item.type === 'adventures' && (
                      <>
                        {item.duration && <span>{item.duration}</span>}
                        {item.origin && item.destination && (
                          <>
                            <span>•</span>
                            <span>{item.origin} → {item.destination}</span>
                          </>
                        )}
                      </>
                    )}

                    {/* Wines */}
                    {item.type === 'wines' && (
                      <>
                        {item.producer && <span>{item.producer}</span>}
                        {item.region && (
                          <>
                            <span>•</span>
                            <span>{item.region}</span>
                          </>
                        )}
                        {item.category && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{item.category}</span>
                          </>
                        )}
                      </>
                    )}

                    {/* Delicatesse */}
                    {item.type === 'delicatesse' && (
                      <>
                        {item.category && <span className="capitalize">{item.category}</span>}
                        {item.preparationTime && (
                          <>
                            <span>•</span>
                            <span>{item.preparationTime}</span>
                          </>
                        )}
                      </>
                    )}

                    {/* Premium Cigars */}
                    {item.type === 'cigars' && (
                      <>
                        {item.brand && <span>{item.brand}</span>}
                        {item.origin && (
                          <>
                            <span>•</span>
                            <span>{item.origin}</span>
                          </>
                        )}
                        {item.strength && (
                          <>
                            <span>•</span>
                            <span>{item.strength}</span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Price - Compact, right-aligned like MyBookings */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {item.type === 'jets' && (
                      item.price_range || (item.price || item.hourly_rate_eur ?
                        `€${(item.price || item.hourly_rate_eur).toLocaleString()}/hr` :
                        'Quote')
                    )}
                    {item.type === 'empty_legs' && `$${(item.price_usd || item.price || 0).toLocaleString()}`}
                    {item.type === 'helicopters' && item.price && `€${item.price.toLocaleString()}/hr`}
                    {item.type === 'yachts' && item.price && `€${item.price.toLocaleString()}/day`}
                    {item.type === 'luxury_cars' && (item.daily_rate_eur || item.price) && `€${(item.daily_rate_eur || item.price).toLocaleString()}/day`}
                    {(item.type === 'ground_transport' || item.type === 'transfer' || item.type === 'taxi') && item.price && `€${item.price.toLocaleString()}`}
                    {item.type === 'adventures' && (item.price_eur || item.price) && `€${(item.price_eur || item.price).toLocaleString()}`}
                    {item.type === 'wines' && (item.priceRange || (item.typicalPrice || item.typical_price_eur || item.price ? `€${(item.typicalPrice || item.typical_price_eur || item.price).toLocaleString()}` : 'Price on request'))}
                    {item.type === 'delicatesse' && (item.priceDisplay || (item.price ? `$${item.price.toLocaleString()}` : 'Price on request'))}
                    {item.type === 'cigars' && (item.priceDisplay || (item.price ? `$${item.price}/stick` : 'Price on request'))}
                  </p>
                  {item.type === 'empty_legs' && (
                    <p className="text-[10px] text-emerald-600">Save up to 70%</p>
                  )}
                  {item.type === 'wines' && item.vintage && (
                    <p className="text-[10px] text-gray-500">{item.vintage}</p>
                  )}
                  {item.type === 'cigars' && (
                    <p className="text-[10px] text-amber-600">+$2K cleaning fee</p>
                  )}
                </div>

                {/* Expand Icon */}
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform flex-shrink-0 ${expandedCards[item.id] ? 'rotate-180' : ''}`}
                />
              </div>

                {/* Expanded Details Section */}
                {expandedCards[item.id] && (
                  <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3">
                      {item.type === 'jets' && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500">Passengers</p>
                            <p className="text-sm font-semibold text-gray-900">{item.max_passengers || item.pax_capacity || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Range</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {item.range_nm ? `${item.range_nm.toLocaleString()} nm` :
                               item.range_km ? `${item.range_km.toLocaleString()} km` : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Cruise Speed</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {item.speed_kts ? `${item.speed_kts} kts` :
                               item.speed_kmh ? `${item.speed_kmh} km/h` : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Category</p>
                            <p className="text-sm font-semibold text-gray-900">{item.category || item.aircraft_type || '—'}</p>
                          </div>
                          {item.flightDistance && (
                            <>
                              <div>
                                <p className="text-xs text-gray-500">Flight Distance</p>
                                <p className="text-sm font-semibold text-gray-900">{item.flightDistance.toLocaleString()} nm</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Est. Flight Time</p>
                                <p className="text-sm font-semibold text-gray-900">{item.estimatedDuration || '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Fuel Stops</p>
                                <p className={`text-sm font-semibold ${item.stops > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                  {item.stops === 0 ? 'Non-stop' : `${item.stops} stop${item.stops > 1 ? 's' : ''}`}
                                </p>
                              </div>
                            </>
                          )}
                          <div>
                            <p className="text-xs text-gray-500">Hourly Rate</p>
                            <p className="text-sm font-semibold text-gray-900">€{item.hourly_rate_eur?.toLocaleString() || item.price?.toLocaleString() || '—'}/hr</p>
                          </div>
                          {/* Estimated Total based on flight time */}
                          {item.estimatedDuration && item.hourly_rate_eur && (
                            <div className="col-span-2 md:col-span-4 mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                              <p className="font-semibold text-emerald-900 mb-1">Estimated Flight Cost</p>
                              <div className="flex items-center gap-4 text-sm text-emerald-800">
                                <span>⏱️ {item.estimatedDuration}</span>
                                <span>×</span>
                                <span>€{item.hourly_rate_eur?.toLocaleString()}/hr</span>
                                <span>=</span>
                                <span className="font-bold text-lg">
                                  €{(Math.ceil(item.flightTimeHours || 1) * item.hourly_rate_eur).toLocaleString()}
                                </span>
                                <span className="text-emerald-600 text-xs">(est.)</span>
                              </div>
                            </div>
                          )}
                          {item.operator && (
                            <div>
                              <p className="text-xs text-gray-500">Operator</p>
                              <p className="text-sm font-semibold text-gray-900">{item.operator}</p>
                            </div>
                          )}
                          {item.registration && (
                            <div>
                              <p className="text-xs text-gray-500">Registration</p>
                              <p className="text-sm font-semibold text-gray-900">{item.registration}</p>
                            </div>
                          )}
                          {/* Safety & Security Info for Jets */}
                          <div className="col-span-2 md:col-span-4 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="font-semibold text-blue-900 mb-2">✈️ Safety & Security</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
                              <div className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span>
                                <span>EASA/FAA certified operators</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span>
                                <span>IS-BAO safety accredited</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span>
                                <span>Experienced flight crew</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span>
                                <span>Private FBO terminal access</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span>
                                <span>Discreet security screening</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span>
                                <span>Full insurance coverage</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons for Private Jets */}
                          <div className="col-span-2 md:col-span-4 mt-4 pt-4 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row gap-2">
                              {/* Add to Cart - Direct Flight */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddToCart && onAddToCart(item);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors text-sm border border-gray-200"
                              >
                                <ShoppingCart size={16} />
                                Add Direct Flight
                              </button>

                              {/* Build Multi-Stop Journey */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onBuildJourney && onBuildJourney(item);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors text-sm border border-blue-200"
                              >
                                <MapPin size={16} />
                                Build Multi-Stop
                              </button>

                              {/* Send Request */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onBookNow && onBookNow(item);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors text-sm"
                              >
                                <CreditCard size={16} />
                                Send Request
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {item.type === 'empty_legs' && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500">From</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {item.from_iata && <span className="font-bold">{item.from_iata}</span>}
                              {item.from_city && ` - ${item.from_city}`}
                              {item.from_country && `, ${item.from_country}`}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">To</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {item.to_iata && <span className="font-bold">{item.to_iata}</span>}
                              {item.to_city && ` - ${item.to_city}`}
                              {item.to_country && `, ${item.to_country}`}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Aircraft</p>
                            <p className="text-sm font-semibold text-gray-900">{item.aircraft_type || item.aircraft_type_original || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Category</p>
                            <p className="text-sm font-semibold text-gray-900">{item.category || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Seats Available</p>
                            <p className="text-sm font-semibold text-gray-900">{item.capacity || item.available_seats || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Departure Date</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {item.departure_date ? new Date(item.departure_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Departure Time</p>
                            <p className="text-sm font-semibold text-gray-900">{item.departure_time || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Price (USD)</p>
                            <p className="text-sm font-semibold text-green-600">
                              ${(item.price_usd || item.price || 0).toLocaleString()}
                            </p>
                          </div>
                          {item.operator && (
                            <div>
                              <p className="text-xs text-gray-500">Operator</p>
                              <p className="text-sm font-semibold text-gray-900">{item.operator}</p>
                            </div>
                          )}
                          {item.registration && (
                            <div>
                              <p className="text-xs text-gray-500">Registration</p>
                              <p className="text-sm font-semibold text-gray-900">{item.registration}</p>
                            </div>
                          )}

                          {/* Action Buttons for Empty Legs - Add to Cart only */}
                          <div className="col-span-2 md:col-span-4 mt-4 pt-4 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row gap-2">
                              {/* Add to Cart - Only button for empty legs */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddToCart && onAddToCart(item);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors text-sm border border-gray-200"
                              >
                                <ShoppingCart size={16} />
                                Add to Cart
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {item.type === 'helicopters' && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500">Passengers</p>
                            <p className="text-sm font-semibold text-gray-900">{item.max_passengers || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Range</p>
                            <p className="text-sm font-semibold text-gray-900">{item.range_km ? `${item.range_km} km` : '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Hourly Rate</p>
                            <p className="text-sm font-semibold text-gray-900">€{item.hourly_rate_eur?.toLocaleString() || '—'}/hr</p>
                          </div>

                          {/* Action Buttons for Helicopters */}
                          <div className="col-span-2 md:col-span-4 mt-4 pt-4 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddToCart && onAddToCart(item);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors text-sm border border-gray-200"
                              >
                                <ShoppingCart size={16} />
                                Add to Cart
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onBookNow && onBookNow(item);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors text-sm"
                              >
                                <CreditCard size={16} />
                                Send Request
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {item.type === 'yachts' && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500">Length</p>
                            <p className="text-sm font-semibold text-gray-900">{item.length_ft}ft</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Guests</p>
                            <p className="text-sm font-semibold text-gray-900">{item.max_passengers}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Cabins</p>
                            <p className="text-sm font-semibold text-gray-900">{item.cabins || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Daily Rate</p>
                            <p className="text-sm font-semibold text-gray-900">€{item.daily_rate_eur?.toLocaleString() || '—'}/day</p>
                          </div>

                          {/* Action Buttons for Yachts */}
                          <div className="col-span-2 md:col-span-4 mt-4 pt-4 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddToCart && onAddToCart(item);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors text-sm border border-gray-200"
                              >
                                <ShoppingCart size={16} />
                                Add to Cart
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onBookNow && onBookNow(item);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors text-sm"
                              >
                                <CreditCard size={16} />
                                Send Request
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {item.type === 'luxury_cars' && (
                        <>
                          {/* Description - show at top like empty legs (no images) */}
                          {item.description && (
                            <div className="col-span-2 md:col-span-4 mb-3 p-3 bg-gray-100 border border-gray-200 rounded-lg">
                              <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
                            </div>
                          )}

                          {/* Vehicle specs */}
                          <div>
                            <p className="text-xs text-gray-500">Make & Model</p>
                            <p className="text-sm font-semibold text-gray-900">{item.brand} {item.model}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Year</p>
                            <p className="text-sm font-semibold text-gray-900">{item.year || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Seats</p>
                            <p className="text-sm font-semibold text-gray-900">{item.seats || item.max_passengers || 2}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Transmission</p>
                            <p className="text-sm font-semibold text-gray-900">{item.transmission || 'Automatic'}</p>
                          </div>

                          {/* Pricing */}
                          <div>
                            <p className="text-xs text-gray-500">Daily Rate</p>
                            <p className="text-sm font-semibold text-gray-900">€{item.daily_rate_eur?.toLocaleString() || item.price?.toLocaleString() || '—'}/day</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Weekend Rate</p>
                            <p className="text-sm font-semibold text-gray-900">€{item.weekend_rate_eur?.toLocaleString() || Math.round((item.daily_rate_eur || item.price || 0) * 0.9).toLocaleString() || '—'}/day</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Weekly Rate</p>
                            <p className="text-sm font-semibold text-gray-900">€{item.weekly_rate_eur?.toLocaleString() || Math.round((item.daily_rate_eur || item.price || 0) * 5.5).toLocaleString() || '—'}/week</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Deposit</p>
                            <p className="text-sm font-semibold text-gray-900">€{item.deposit?.toLocaleString() || '5,000 - 15,000'}</p>
                          </div>

                          {/* Rental Requirements - Full width */}
                          <div className="col-span-2 md:col-span-4 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="font-semibold text-blue-900 mb-2">Rental Requirements</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
                              <div className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span>
                                <span>Valid driver's license (min. 2 years)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span>
                                <span>Minimum age: 18 years</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span>
                                <span>Full insurance included</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span>
                                <span>Mileage: {item.mileage_included || '150 km/day'} included</span>
                              </div>
                            </div>
                          </div>

                          {/* Custom specification notice */}
                          <div className="col-span-2 md:col-span-4 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="font-semibold text-amber-900 mb-1">Vehicle Options</p>
                            <p className="text-sm text-amber-800">
                              Vehicle availability and exact specifications may vary. We can source specific colors, interior finishes, and configurations.
                              <span className="font-medium"> Need a specific setup?</span>
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRequestChanges && onRequestChanges(item, 'custom_color');
                              }}
                              className="mt-2 px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors font-medium"
                            >
                              Request Custom Specification
                            </button>
                          </div>

                          {/* Insurance info */}
                          <div className="col-span-2 md:col-span-4 mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="font-semibold text-green-900 mb-1">Insurance Coverage</p>
                            <div className="text-sm text-green-800 space-y-1">
                              <p>• Comprehensive insurance included in rental price</p>
                              <p>• Excess/deductible: €{item.insurance_excess?.toLocaleString() || '2,500 - 5,000'}</p>
                              <p>• Optional zero-excess coverage available</p>
                            </div>
                          </div>

                          {/* Action Buttons for Luxury Cars */}
                          <div className="col-span-2 md:col-span-4 mt-4 pt-4 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddToCart && onAddToCart(item);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors text-sm border border-gray-200"
                              >
                                <ShoppingCart size={16} />
                                Add to Cart
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onBookNow && onBookNow(item);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors text-sm"
                              >
                                <CreditCard size={16} />
                                Send Request
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {(item.type === 'ground_transport' || item.type === 'transfer' || item.type === 'taxi') && (
                        <>
                          {/* Vehicle image */}
                          {(item.primaryImage || item.image_url || item.image_url_1) && (
                            <div className="col-span-2 md:col-span-4 mb-3">
                              <img
                                src={item.primaryImage || item.image_url || item.image_url_1}
                                alt={`${item.brand || item.name} ${item.model || ''}`}
                                className="w-full h-40 object-cover rounded-lg"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </div>
                          )}

                          <div>
                            <p className="text-xs text-gray-500">Vehicle</p>
                            <p className="text-sm font-semibold text-gray-900">{item.brand || item.name} {item.model || ''}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Passengers</p>
                            <p className="text-sm font-semibold text-gray-900">{item.seats || item.max_passengers || 4}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Luggage</p>
                            <p className="text-sm font-semibold text-gray-900">{item.luggage || '3-4 bags'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Vehicle Class</p>
                            <p className="text-sm font-semibold text-gray-900">{item.vehicle_class || 'Business'}</p>
                          </div>

                          {/* Route info if available */}
                          {item.distanceKm && (
                            <>
                              <div>
                                <p className="text-xs text-gray-500">Distance</p>
                                <p className="text-sm font-semibold text-gray-900">{item.distanceKm} km</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Est. Duration</p>
                                <p className="text-sm font-semibold text-gray-900">~{item.durationMinutes || Math.round(item.distanceKm * 1.2)} min</p>
                              </div>
                            </>
                          )}

                          {/* Pricing */}
                          <div>
                            <p className="text-xs text-gray-500">Transfer Price</p>
                            <p className="text-sm font-semibold text-gray-900">€{item.price?.toLocaleString() || item.totalWithFee?.toLocaleString() || '—'}</p>
                          </div>
                          {item.airportPickupFee > 0 && (
                            <div>
                              <p className="text-xs text-gray-500">Airport Fee</p>
                              <p className="text-sm font-semibold text-amber-600">+€{item.airportPickupFee}</p>
                            </div>
                          )}

                          {/* What's included */}
                          <div className="col-span-2 md:col-span-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <p className="font-semibold text-emerald-900 mb-2">Included in Price</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-emerald-800">
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-500">✓</span>
                                <span>Professional uniformed chauffeur</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-500">✓</span>
                                <span>Meet & greet with name sign</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-500">✓</span>
                                <span>Flight tracking (airport pickups)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-500">✓</span>
                                <span>60 min free waiting time</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-500">✓</span>
                                <span>Bottled water & WiFi</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-500">✓</span>
                                <span>Luggage assistance</span>
                              </div>
                            </div>
                          </div>

                          {/* Estimated price notice */}
                          {item.isEstimate && (
                            <div className="col-span-2 md:col-span-4 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-blue-800">
                                <span className="font-medium">Estimated price</span> - Final price may vary based on traffic conditions, waiting time, and route changes. Price confirmed upon booking.
                              </p>
                            </div>
                          )}

                          {/* Action Buttons for Transfers */}
                          <div className="col-span-2 md:col-span-4 mt-4 pt-4 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddToCart && onAddToCart(item);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors text-sm border border-gray-200"
                              >
                                <ShoppingCart size={16} />
                                Add to Cart
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onBookNow && onBookNow(item);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors text-sm"
                              >
                                <CreditCard size={16} />
                                Send Request
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {item.type === 'adventures' && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500">Package</p>
                            <p className="text-sm font-semibold text-gray-900">{item.title || item.name || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Route</p>
                            <p className="text-sm font-semibold text-gray-900">{item.origin && item.destination ? `${item.origin} → ${item.destination}` : '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Duration</p>
                            <p className="text-sm font-semibold text-gray-900">{item.duration || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Price</p>
                            <p className="text-sm font-semibold text-green-600">
                              {item.price_eur ? `€${item.price_eur.toLocaleString()}` : item.price ? `€${item.price.toLocaleString()}` : '—'}
                            </p>
                          </div>
                          {item.description && (
                            <div className="col-span-2 md:col-span-4">
                              <p className="text-xs text-gray-500">Description</p>
                              <p className="text-sm font-semibold text-gray-900">{item.description}</p>
                            </div>
                          )}

                          {/* Action Buttons for Adventures - Directly Bookable with Crypto */}
                          <div className="col-span-2 md:col-span-4 mt-4 pt-4 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row gap-2">
                              {/* Add to Cart */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddToCart && onAddToCart(item);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors text-sm border border-gray-200"
                              >
                                <ShoppingCart size={16} />
                                Add to Cart
                              </button>

                              {/* Pay with Crypto - Direct checkout for adventures */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPayCrypto && onPayCrypto(item);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all text-sm"
                              >
                                <Wallet size={16} />
                                Pay with Crypto
                              </button>

                              {/* Send Request */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onBookNow && onBookNow(item);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors text-sm"
                              >
                                <CreditCard size={16} />
                                Send Request
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {/* WINES - Expanded Details - Compact & Foldable */}
                      {item.type === 'wines' && (
                        <>
                          {/* Compact wine info grid */}
                          <div className="col-span-2 md:col-span-4">
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-600">
                              {item.producer && <span><span className="text-gray-400">Producer:</span> {item.producer}</span>}
                              {item.vintage && <span><span className="text-gray-400">Vintage:</span> {item.vintage}</span>}
                              {item.region && <span><span className="text-gray-400">Region:</span> {item.region}{item.country ? `, ${item.country}` : ''}</span>}
                              {(item.wineType || item.category) && <span><span className="text-gray-400">Type:</span> <span className="capitalize">{item.wineType || item.category}</span></span>}
                              {item.alcohol && <span><span className="text-gray-400">ABV:</span> {item.alcohol}</span>}
                              {item.rating && <span className="flex items-center gap-0.5"><span className="text-gray-400">Rating:</span> <Star size={9} className="text-gray-500 fill-gray-400" /> {item.rating}</span>}
                              {item.classification && <span><span className="text-gray-400">Class:</span> {item.classification}</span>}
                            </div>
                          </div>

                          {/* Foldable: Serving Recommendations */}
                          {(item.servingTemp || item.decantingTime || item.agingPotential) && (
                            <div className="col-span-2 md:col-span-4 mt-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleWineSection(item.id, 'serving'); }}
                                className="w-full flex items-center justify-between py-1.5 text-[11px] text-gray-500 hover:text-gray-700 border-b border-gray-100"
                              >
                                <span className="flex items-center gap-1.5 font-medium">
                                  <Thermometer size={11} />
                                  Serving
                                </span>
                                <ChevronDown size={12} className={`transition-transform ${expandedWineSections[`${item.id}-serving`] ? 'rotate-180' : ''}`} />
                              </button>
                              {expandedWineSections[`${item.id}-serving`] && (
                                <div className="py-2 text-[11px] text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                                  {item.servingTemp && <span><span className="text-gray-400">Temp:</span> {item.servingTemp}</span>}
                                  {item.decantingTime && <span><span className="text-gray-400">Decant:</span> {item.decantingTime}</span>}
                                  {item.agingPotential && <span><span className="text-gray-400">Aging:</span> {item.agingPotential}</span>}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Foldable: Tasting Notes */}
                          {item.tastingNotes && (
                            <div className="col-span-2 md:col-span-4">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleWineSection(item.id, 'tasting'); }}
                                className="w-full flex items-center justify-between py-1.5 text-[11px] text-gray-500 hover:text-gray-700 border-b border-gray-100"
                              >
                                <span className="flex items-center gap-1.5 font-medium">
                                  <Grape size={11} />
                                  Tasting Notes
                                </span>
                                <ChevronDown size={12} className={`transition-transform ${expandedWineSections[`${item.id}-tasting`] ? 'rotate-180' : ''}`} />
                              </button>
                              {expandedWineSections[`${item.id}-tasting`] && (
                                <p className="py-2 text-[11px] text-gray-600 leading-relaxed">{item.tastingNotes}</p>
                              )}
                            </div>
                          )}

                          {/* Foldable: Description */}
                          {item.description && (
                            <div className="col-span-2 md:col-span-4">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleWineSection(item.id, 'description'); }}
                                className="w-full flex items-center justify-between py-1.5 text-[11px] text-gray-500 hover:text-gray-700 border-b border-gray-100"
                              >
                                <span className="font-medium">Description</span>
                                <ChevronDown size={12} className={`transition-transform ${expandedWineSections[`${item.id}-description`] ? 'rotate-180' : ''}`} />
                              </button>
                              {expandedWineSections[`${item.id}-description`] && (
                                <p className="py-2 text-[11px] text-gray-600 leading-relaxed">{item.description}</p>
                              )}
                            </div>
                          )}

                          {/* Price & Actions - Compact */}
                          <div className="col-span-2 md:col-span-4 mt-3 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-[10px] text-gray-400">Price per bottle</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {item.priceRange || (item.typicalPrice || item.typical_price_eur || item.price ? `€${(item.typicalPrice || item.typical_price_eur || item.price).toLocaleString()}` : 'On request')}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddToCart && onAddToCart(item);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors border border-gray-200"
                              >
                                <ShoppingCart size={12} />
                                Add
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onBookNow && onBookNow(item);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition-colors"
                              >
                                <CreditCard size={12} />
                                Request
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {/* DELICATESSE - Expanded Details */}
                      {item.type === 'delicatesse' && (
                        <>
                          {/* Compact delicatesse info grid */}
                          <div className="col-span-2 md:col-span-4">
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-600">
                              {item.category && <span><span className="text-gray-400">Category:</span> <span className="capitalize">{item.category}</span></span>}
                              {item.preparationTime && <span><span className="text-gray-400">Lead time:</span> {item.preparationTime}</span>}
                            </div>
                            {item.description && (
                              <p className="mt-2 text-[11px] text-gray-600 leading-relaxed">{item.description}</p>
                            )}
                            {item.notes && (
                              <p className="mt-1 text-[10px] text-gray-500 italic">{item.notes}</p>
                            )}
                          </div>

                          {/* Price & Actions */}
                          <div className="col-span-2 md:col-span-4 mt-3 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-[10px] text-gray-400">Price</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {item.priceDisplay || (item.price ? `$${item.price.toLocaleString()}` : 'On request')}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddToCart && onAddToCart(item);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors border border-gray-200"
                              >
                                <ShoppingCart size={12} />
                                Add
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onBookNow && onBookNow(item);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition-colors"
                              >
                                <CreditCard size={12} />
                                Request
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {/* CIGARS - Expanded Details */}
                      {item.type === 'cigars' && (
                        <>
                          {/* Compact cigar info grid */}
                          <div className="col-span-2 md:col-span-4">
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-600">
                              {item.brand && <span><span className="text-gray-400">Brand:</span> {item.brand}</span>}
                              {item.origin && <span><span className="text-gray-400">Origin:</span> {item.origin}</span>}
                              {item.strength && <span><span className="text-gray-400">Strength:</span> {item.strength}</span>}
                              {item.ring_gauge && <span><span className="text-gray-400">Ring:</span> {item.ring_gauge}</span>}
                              {item.length && <span><span className="text-gray-400">Length:</span> {item.length}</span>}
                            </div>
                            {item.flavor_profile && (
                              <p className="mt-2 text-[11px] text-gray-600"><span className="text-gray-400">Flavor:</span> {item.flavor_profile}</p>
                            )}
                            {item.description && (
                              <p className="mt-1 text-[11px] text-gray-600 leading-relaxed">{item.description}</p>
                            )}
                            {/* Cleaning fee warning */}
                            <div className="mt-2 px-2 py-1.5 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-700">
                              ⚠️ $2,000 aircraft cleaning fee applies for cigar smoking
                            </div>
                          </div>

                          {/* Price & Actions */}
                          <div className="col-span-2 md:col-span-4 mt-3 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-[10px] text-gray-400">Price per stick</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {item.priceDisplay || (item.price ? `$${item.price}` : 'On request')}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddToCart && onAddToCart(item);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors border border-gray-200"
                              >
                                <ShoppingCart size={12} />
                                Add
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onBookNow && onBookNow(item);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition-colors"
                              >
                                <CreditCard size={12} />
                                Request
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

          {/* Show More/Less Buttons */}
          {currentTabData.items.length > 5 && (
            <div className="flex justify-center mt-4">
              {!showAllItems ? (
                <button
                  onClick={() => setShowAllItems(true)}
                  className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors text-xs font-medium border border-gray-200"
                >
                  Show {currentTabData.items.length - 5} more
                </button>
              ) : (
                <button
                  onClick={() => setShowAllItems(false)}
                  className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors text-xs font-medium border border-gray-200"
                >
                  Show less
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
