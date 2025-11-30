import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check, X, Plane, Clock, MapPin, Users, Gauge, Fuel } from 'lucide-react';
import BookableServiceCard from './BookableServiceCard';

/**
 * SearchResults component displays search results in expandable tabs/cards
 */
const SearchResults = ({ tabs, onSelectItem, selectedItems = [], onBookNow, onAddToCart, onRequestChanges }) => {
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
    <div className="w-full max-w-4xl mx-auto mb-8">
      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => {
          // Empty Legs - SAME format as Jets with count badge
          if (tab.id === 'emptylegs' && tab.items && tab.items.length > 0) {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-black text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Empty Legs</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-orange-100 text-orange-600'
                    }`}>
                      {tab.items.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs opacity-70">
                    <span>Up to 70% off</span>
                  </div>
                </div>
              </button>
            );
          }

          // Special formatting for Jets - Show distance and route info
          if (tab.id === 'jets' && tab.items && tab.items.length > 0) {
            const firstJet = tab.items[0];
            const distance = firstJet.flightDistance;
            const duration = firstJet.estimatedDuration;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-black text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{tab.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </div>
                  {distance && (
                    <div className="flex items-center gap-2 text-xs opacity-70">
                      <span>{distance} nm</span>
                      {duration && (
                        <>
                          <span>•</span>
                          <span>{duration}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          }

          // Luxury Cars tab - monochromatic styling
          if ((tab.id === 'luxury_cars' || tab.id === 'luxuryCars') && tab.items && tab.items.length > 0) {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Supercars</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.items.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs opacity-70">
                    <span>Self-drive rentals</span>
                  </div>
                </div>
              </button>
            );
          }

          // Transfers/Taxi tab - special styling
          if ((tab.id === 'transfers' || tab.id === 'ground_transport' || tab.id === 'taxi') && tab.items && tab.items.length > 0) {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-emerald-300'
                }`}
              >
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Transfers</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {tab.items.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs opacity-70">
                    <span>Chauffeur service</span>
                  </div>
                </div>
              </button>
            );
          }

          // Default format for other tabs
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-black text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.title}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content - List format instead of cards */}
      {currentTabData && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {currentTabData.items.slice(0, showAllItems ? currentTabData.items.length : 5).map((item, index) => (
              <div
                key={item.id}
                className={`border-b border-gray-100 transition-colors ${
                  index === currentTabData.items.length - 1 ? 'border-b-0' : ''
                }`}
              >
                {/* Clickable header */}
                <div
                  onClick={() => toggleCardExpanded(item.id)}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        {/* Service Image - check multiple image sources */}
                        {(item.primaryImage || item.image_url || item.image_url_1) && (
                          <img
                            src={item.primaryImage || item.image_url || item.image_url_1}
                            alt={item.name || item.title || item.aircraft_type || 'Service'}
                            className="w-16 h-16 rounded-lg object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}

                        {/* Service Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900">
                              {item.type === 'empty_legs'
                                ? `${item.from_iata || item.from_city || '?'} → ${item.to_iata || item.to_city || '?'}`
                                : (item.name || item.model || item.title || 'Unnamed Service')}
                            </h3>
                            {/* Category Badge - like jets page */}
                            {item.type === 'jets' && (item.category || item.aircraft_type) && (
                              <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                                {item.category || item.aircraft_type}
                              </span>
                            )}
                            {/* Fuel stops badge - prominent display */}
                            {item.type === 'jets' && item.stops !== undefined && (
                              item.stops === 0 ? (
                                <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-medium">
                                  ✓ Non-stop
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full font-medium">
                                  {item.stops} stop{item.stops > 1 ? 's' : ''}
                                </span>
                              )
                            )}
                            {expandedCards[item.id] ? (
                              <ChevronUp size={16} className="text-gray-400" />
                            ) : (
                              <ChevronDown size={16} className="text-gray-400" />
                            )}
                          </div>

                          {/* Service-specific info - Jets (comprehensive display) */}
                          {item.type === 'jets' && (
                            <div className="mt-2">
                              {/* Key specs row */}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                                {/* Passengers */}
                                <div className="flex items-center gap-1.5">
                                  <Users size={14} className="text-gray-500" />
                                  <span className="font-medium text-gray-900">
                                    {item.max_passengers || item.pax_capacity || item.passenger_capacity || '?'}
                                  </span>
                                  <span className="text-gray-500">pax</span>
                                </div>
                                {/* Max Range */}
                                {(item.range_km || item.range_nm || item.range) && (
                                  <div className="flex items-center gap-1.5">
                                    <Plane size={14} className="text-gray-500" />
                                    <span className="font-medium text-gray-900">
                                      {item.range_km ? `${item.range_km.toLocaleString()}` :
                                       item.range ? `${item.range.toLocaleString()}` :
                                       item.range_nm ? `${Math.round(item.range_nm * 1.852).toLocaleString()}` : '—'}
                                    </span>
                                    <span className="text-gray-500">km range</span>
                                  </div>
                                )}
                                {/* Speed */}
                                {(item.speed_kts || item.speed_kmh) && (
                                  <div className="flex items-center gap-1.5">
                                    <Gauge size={14} className="text-gray-500" />
                                    <span className="font-medium text-gray-900">
                                      {item.speed_kts || item.speed_kmh}
                                    </span>
                                    <span className="text-gray-500">{item.speed_kts ? 'kts' : 'km/h'}</span>
                                  </div>
                                )}
                              </div>

                              {/* Flight details row (if route is known) */}
                              {(item.flightDistance || item.estimatedDuration) && (
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 py-1.5 px-2 bg-gray-50 rounded-lg text-sm">
                                  {item.flightDistance && (
                                    <div className="flex items-center gap-1.5">
                                      <MapPin size={14} className="text-blue-500" />
                                      <span className="text-gray-600">Flight:</span>
                                      <span className="font-medium text-gray-900">
                                        {Math.round(item.flightDistance * 1.852).toLocaleString()} km
                                      </span>
                                    </div>
                                  )}
                                  {item.estimatedDuration && (
                                    <div className="flex items-center gap-1.5">
                                      <Clock size={14} className="text-blue-500" />
                                      <span className="text-gray-600">Est. time:</span>
                                      <span className="font-medium text-gray-900">{item.estimatedDuration}</span>
                                    </div>
                                  )}
                                  {item.stops !== undefined && (
                                    <div className="flex items-center gap-1.5">
                                      <Fuel size={14} className={item.stops > 0 ? 'text-amber-500' : 'text-green-500'} />
                                      <span className="text-gray-600">Stops:</span>
                                      <span className={`font-medium ${item.stops > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                        {item.stops === 0 ? 'Non-stop' : item.stops}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {item.type === 'empty_legs' && (
                            <div className="mt-2">
                              {/* Route with IATA codes - prominent display */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full font-medium">
                                  Empty Leg
                                </span>
                                {item.aircraft_type && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    {item.aircraft_type}
                                  </span>
                                )}
                              </div>

                              {/* Route info with IATA */}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                                {/* From/To with IATA */}
                                <div className="flex items-center gap-1.5">
                                  <MapPin size={14} className="text-gray-500" />
                                  <span className="font-medium text-gray-900">
                                    {item.from_iata || item.from_city || item.from || '?'}
                                  </span>
                                  <span className="text-gray-400">→</span>
                                  <span className="font-medium text-gray-900">
                                    {item.to_iata || item.to_city || item.to || '?'}
                                  </span>
                                </div>
                                {/* Passengers */}
                                <div className="flex items-center gap-1.5">
                                  <Users size={14} className="text-gray-500" />
                                  <span className="font-medium text-gray-900">
                                    {item.capacity || item.available_seats || item.max_passengers || '?'}
                                  </span>
                                  <span className="text-gray-500">pax</span>
                                </div>
                              </div>

                              {/* Date/Time row */}
                              {item.departure_date && (
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 py-1.5 px-2 bg-gray-50 rounded-lg text-sm">
                                  <div className="flex items-center gap-1.5">
                                    <Clock size={14} className="text-blue-500" />
                                    <span className="text-gray-600">Date:</span>
                                    <span className="font-medium text-gray-900">
                                      {new Date(item.departure_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </div>
                                  {item.departure_time && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-gray-600">Time:</span>
                                      <span className="font-medium text-gray-900">{item.departure_time}</span>
                                    </div>
                                  )}
                                  {item.operator && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-gray-600">Operator:</span>
                                      <span className="font-medium text-gray-900">{item.operator}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {item.type === 'helicopters' && (
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <Users size={14} />
                                {item.max_passengers} pax
                              </span>
                            </div>
                          )}

                          {item.type === 'yachts' && (
                            <div className="text-sm text-gray-600 mt-1">
                              <span>{item.length_ft}ft • {item.max_passengers} guests</span>
                            </div>
                          )}

                          {item.type === 'luxury_cars' && (
                            <div className="mt-2">
                              {/* Brand badge - monochromatic */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-gray-900 text-white text-xs rounded-full font-medium">
                                  {item.brand || 'Supercar'}
                                </span>
                                {item.category && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                                    {item.category}
                                  </span>
                                )}
                              </div>

                              {/* Key specs row */}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                                {/* Year */}
                                {item.year && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500">Year:</span>
                                    <span className="font-medium text-gray-900">{item.year}</span>
                                  </div>
                                )}
                                {/* Seats */}
                                <div className="flex items-center gap-1.5">
                                  <Users size={14} className="text-gray-500" />
                                  <span className="font-medium text-gray-900">
                                    {item.seats || item.max_passengers || 2}
                                  </span>
                                  <span className="text-gray-500">seats</span>
                                </div>
                                {/* Transmission */}
                                {item.transmission && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500">Trans:</span>
                                    <span className="font-medium text-gray-900">{item.transmission}</span>
                                  </div>
                                )}
                              </div>

                              {/* Important notice */}
                              <div className="mt-2 py-1.5 px-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                                <span className="font-medium">Note:</span> Colors & interior may vary. Valid driver's license required.
                              </div>
                            </div>
                          )}

                          {(item.type === 'ground_transport' || item.type === 'transfer' || item.type === 'taxi') && (
                            <div className="mt-2">
                              {/* Vehicle type badge */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full font-medium">
                                  Chauffeur
                                </span>
                                {item.vehicle_class && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                                    {item.vehicle_class}
                                  </span>
                                )}
                              </div>

                              {/* Key specs row */}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                                {/* Vehicle */}
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-gray-900">
                                    {item.brand || item.name} {item.model || ''}
                                  </span>
                                </div>
                                {/* Passengers */}
                                <div className="flex items-center gap-1.5">
                                  <Users size={14} className="text-gray-500" />
                                  <span className="font-medium text-gray-900">
                                    {item.seats || item.max_passengers || 4}
                                  </span>
                                  <span className="text-gray-500">pax</span>
                                </div>
                                {/* Distance if available */}
                                {item.distanceKm && (
                                  <div className="flex items-center gap-1.5">
                                    <MapPin size={14} className="text-gray-500" />
                                    <span className="font-medium text-gray-900">{item.distanceKm} km</span>
                                  </div>
                                )}
                                {/* Duration if available */}
                                {item.durationMinutes && (
                                  <div className="flex items-center gap-1.5">
                                    <Clock size={14} className="text-gray-500" />
                                    <span className="font-medium text-gray-900">~{item.durationMinutes} min</span>
                                  </div>
                                )}
                              </div>

                              {/* Professional driver notice */}
                              <div className="mt-2 py-1.5 px-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                                <span className="font-medium">Includes:</span> Professional chauffeur, meet & greet, flight tracking
                              </div>
                            </div>
                          )}

                          {item.type === 'adventures' && (
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-2">
                                {item.origin && item.destination ? `${item.origin} → ${item.destination}` : item.description?.substring(0, 60) + '...' || ''}
                              </span>
                              {item.duration && (
                                <span className="flex items-center gap-1 mt-1">
                                  <Clock size={14} />
                                  {item.duration}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price and Actions */}
                    <div className="flex items-center gap-4">
                      <div className="text-right min-w-[100px]">
                        {/* Jets: show price prominently */}
                        {item.type === 'jets' && (
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-gray-500">from</span>
                            <p className="text-lg font-bold text-gray-900">
                              {item.price_range || (item.price || item.hourly_rate_eur ?
                                `€${(item.price || item.hourly_rate_eur).toLocaleString()}/hr` :
                                'Quote')}
                            </p>
                          </div>
                        )}
                        {/* Empty legs - USD price */}
                        {item.type === 'empty_legs' && (
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-green-600 font-medium">Save up to 70%</span>
                            <p className="text-lg font-bold text-gray-900">
                              ${(item.price_usd || item.price || 0).toLocaleString()}
                            </p>
                          </div>
                        )}
                        {/* Other service types */}
                        {item.type !== 'jets' && item.type !== 'empty_legs' && item.price && (
                          <p className="text-lg font-semibold text-gray-900">
                            €{item.price.toLocaleString()}
                            {item.type === 'helicopters' ? '/hr' :
                             item.type === 'yachts' ? '/day' : ''}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart && onAddToCart(item);
                        }}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-xs font-medium whitespace-nowrap border border-gray-200"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {expandedCards[item.id] && (
                  <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3">
                      {item.type === 'jets' && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500">Passengers</p>
                            <p className="font-medium">{item.max_passengers || item.pax_capacity || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Range</p>
                            <p className="font-medium">
                              {item.range_nm ? `${item.range_nm.toLocaleString()} nm` :
                               item.range_km ? `${item.range_km.toLocaleString()} km` : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Cruise Speed</p>
                            <p className="font-medium">
                              {item.speed_kts ? `${item.speed_kts} kts` :
                               item.speed_kmh ? `${item.speed_kmh} km/h` : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Category</p>
                            <p className="font-medium">{item.category || item.aircraft_type || '—'}</p>
                          </div>
                          {item.flightDistance && (
                            <>
                              <div>
                                <p className="text-xs text-gray-500">Flight Distance</p>
                                <p className="font-medium">{item.flightDistance.toLocaleString()} nm</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Est. Flight Time</p>
                                <p className="font-medium">{item.estimatedDuration || '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Fuel Stops</p>
                                <p className={`font-medium ${item.stops > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                  {item.stops === 0 ? 'Non-stop' : `${item.stops} stop${item.stops > 1 ? 's' : ''}`}
                                </p>
                              </div>
                            </>
                          )}
                          <div>
                            <p className="text-xs text-gray-500">Hourly Rate</p>
                            <p className="font-medium">€{item.hourly_rate_eur?.toLocaleString() || item.price?.toLocaleString() || '—'}/hr</p>
                          </div>
                          {item.operator && (
                            <div>
                              <p className="text-xs text-gray-500">Operator</p>
                              <p className="font-medium">{item.operator}</p>
                            </div>
                          )}
                          {item.registration && (
                            <div>
                              <p className="text-xs text-gray-500">Registration</p>
                              <p className="font-medium">{item.registration}</p>
                            </div>
                          )}
                        </>
                      )}

                      {item.type === 'empty_legs' && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500">From</p>
                            <p className="font-medium">
                              {item.from_iata && <span className="font-bold">{item.from_iata}</span>}
                              {item.from_city && ` - ${item.from_city}`}
                              {item.from_country && `, ${item.from_country}`}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">To</p>
                            <p className="font-medium">
                              {item.to_iata && <span className="font-bold">{item.to_iata}</span>}
                              {item.to_city && ` - ${item.to_city}`}
                              {item.to_country && `, ${item.to_country}`}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Aircraft</p>
                            <p className="font-medium">{item.aircraft_type || item.aircraft_type_original || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Category</p>
                            <p className="font-medium">{item.category || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Seats Available</p>
                            <p className="font-medium">{item.capacity || item.available_seats || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Departure Date</p>
                            <p className="font-medium">
                              {item.departure_date ? new Date(item.departure_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Departure Time</p>
                            <p className="font-medium">{item.departure_time || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Price (USD)</p>
                            <p className="font-medium text-green-600">
                              ${(item.price_usd || item.price || 0).toLocaleString()}
                            </p>
                          </div>
                          {item.operator && (
                            <div>
                              <p className="text-xs text-gray-500">Operator</p>
                              <p className="font-medium">{item.operator}</p>
                            </div>
                          )}
                          {item.registration && (
                            <div>
                              <p className="text-xs text-gray-500">Registration</p>
                              <p className="font-medium">{item.registration}</p>
                            </div>
                          )}
                        </>
                      )}

                      {item.type === 'helicopters' && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500">Passengers</p>
                            <p className="font-medium">{item.max_passengers || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Range</p>
                            <p className="font-medium">{item.range_km ? `${item.range_km} km` : '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Hourly Rate</p>
                            <p className="font-medium">€{item.hourly_rate_eur?.toLocaleString() || '—'}/hr</p>
                          </div>
                        </>
                      )}

                      {item.type === 'yachts' && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500">Length</p>
                            <p className="font-medium">{item.length_ft}ft</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Guests</p>
                            <p className="font-medium">{item.max_passengers}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Cabins</p>
                            <p className="font-medium">{item.cabins || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Daily Rate</p>
                            <p className="font-medium">€{item.daily_rate_eur?.toLocaleString() || '—'}/day</p>
                          </div>
                        </>
                      )}

                      {item.type === 'luxury_cars' && (
                        <>
                          {/* Large image */}
                          {(item.primaryImage || item.image_url || item.image_url_1) && (
                            <div className="col-span-2 md:col-span-4 mb-3">
                              <img
                                src={item.primaryImage || item.image_url || item.image_url_1}
                                alt={`${item.brand} ${item.model}`}
                                className="w-full h-48 object-cover rounded-lg"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </div>
                          )}

                          {/* Vehicle specs */}
                          <div>
                            <p className="text-xs text-gray-500">Make & Model</p>
                            <p className="font-medium">{item.brand} {item.model}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Year</p>
                            <p className="font-medium">{item.year || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Seats</p>
                            <p className="font-medium">{item.seats || item.max_passengers || 2}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Transmission</p>
                            <p className="font-medium">{item.transmission || 'Automatic'}</p>
                          </div>

                          {/* Pricing */}
                          <div>
                            <p className="text-xs text-gray-500">Daily Rate</p>
                            <p className="font-medium text-lg">€{item.daily_rate_eur?.toLocaleString() || item.price?.toLocaleString() || '—'}/day</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Weekend Rate</p>
                            <p className="font-medium">€{item.weekend_rate_eur?.toLocaleString() || Math.round((item.daily_rate_eur || item.price || 0) * 0.9).toLocaleString() || '—'}/day</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Weekly Rate</p>
                            <p className="font-medium">€{item.weekly_rate_eur?.toLocaleString() || Math.round((item.daily_rate_eur || item.price || 0) * 5.5).toLocaleString() || '—'}/week</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Deposit</p>
                            <p className="font-medium">€{item.deposit?.toLocaleString() || '5,000 - 15,000'}</p>
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

                          {/* Color disclaimer */}
                          <div className="col-span-2 md:col-span-4 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="font-semibold text-amber-900 mb-1">Vehicle Availability</p>
                            <p className="text-sm text-amber-800">
                              Displayed color and interior are representative. Actual vehicle may vary in color, interior finish, and optional features.
                              <span className="font-medium"> Want a specific color or configuration?</span>
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
                            <p className="font-medium">{item.brand || item.name} {item.model || ''}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Passengers</p>
                            <p className="font-medium">{item.seats || item.max_passengers || 4}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Luggage</p>
                            <p className="font-medium">{item.luggage || '3-4 bags'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Vehicle Class</p>
                            <p className="font-medium">{item.vehicle_class || 'Business'}</p>
                          </div>

                          {/* Route info if available */}
                          {item.distanceKm && (
                            <>
                              <div>
                                <p className="text-xs text-gray-500">Distance</p>
                                <p className="font-medium">{item.distanceKm} km</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Est. Duration</p>
                                <p className="font-medium">~{item.durationMinutes || Math.round(item.distanceKm * 1.2)} min</p>
                              </div>
                            </>
                          )}

                          {/* Pricing */}
                          <div>
                            <p className="text-xs text-gray-500">Transfer Price</p>
                            <p className="font-medium text-lg">€{item.price?.toLocaleString() || item.totalWithFee?.toLocaleString() || '—'}</p>
                          </div>
                          {item.airportPickupFee > 0 && (
                            <div>
                              <p className="text-xs text-gray-500">Airport Fee</p>
                              <p className="font-medium text-amber-600">+€{item.airportPickupFee}</p>
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
                        </>
                      )}

                      {item.type === 'adventures' && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500">Package</p>
                            <p className="font-medium">{item.title || item.name || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Route</p>
                            <p className="font-medium">{item.origin && item.destination ? `${item.origin} → ${item.destination}` : '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Duration</p>
                            <p className="font-medium">{item.duration || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Price</p>
                            <p className="font-medium text-green-600">
                              {item.price_eur ? `€${item.price_eur.toLocaleString()}` : item.price ? `€${item.price.toLocaleString()}` : '—'}
                            </p>
                          </div>
                          {item.description && (
                            <div className="col-span-2 md:col-span-4">
                              <p className="text-xs text-gray-500">Description</p>
                              <p className="font-medium text-sm">{item.description}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
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
