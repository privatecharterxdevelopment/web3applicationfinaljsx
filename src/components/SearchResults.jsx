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
                  {(item.primaryImage || item.image_url || item.image_url_1) ? (
                    <img
                      src={item.primaryImage || item.image_url || item.image_url_1}
                      alt={item.name || item.title || 'Service'}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3l14 9-14 9V3z"/></svg>'; }}
                    />
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

                    {/* Luxury Cars */}
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
                  </p>
                  {item.type === 'empty_legs' && (
                    <p className="text-[10px] text-emerald-600">Save up to 70%</p>
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
