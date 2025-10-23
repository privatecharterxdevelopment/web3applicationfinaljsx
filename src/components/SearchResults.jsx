import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check, X, CalendarPlus } from 'lucide-react';
import BookableServiceCard from './BookableServiceCard';

/**
 * SearchResults component displays search results in expandable tabs/cards
 */
const SearchResults = ({ tabs, onSelectItem, selectedItems = [], onBookNow, onAddToCalendar, onAddToCart, onRequestChanges }) => {
  // Set initial active tab - for empty legs, use first leg's individual tab
  const getInitialTab = () => {
    if (tabs.length === 0) return null;
    const firstTab = tabs[0];
    if (firstTab.id === 'emptylegs' && firstTab.items && firstTab.items.length > 0) {
      return `emptyleg-${firstTab.items[0].id || 0}`;
    }
    return firstTab.id;
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

  // Handle Empty Leg individual tabs
  let currentTabData = tabs.find(tab => tab.id === activeTab);
  
  // If it's an individual empty leg tab, create a synthetic tab with just that item
  if (activeTab?.startsWith('emptyleg-')) {
    const emptyLegsTab = tabs.find(tab => tab.id === 'emptylegs');
    if (emptyLegsTab && emptyLegsTab.items) {
      const legId = activeTab.replace('emptyleg-', '');
      const legItem = emptyLegsTab.items.find((item, idx) => 
        item.id === legId || item.id === parseInt(legId) || idx === parseInt(legId)
      );
      if (legItem) {
        currentTabData = {
          id: activeTab,
          title: 'Empty Leg',
          items: [legItem]
        };
      }
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => {
          // Special formatting for Empty Legs - Each leg gets its own button
          if (tab.id === 'emptylegs' && tab.items && tab.items.length > 0) {
            return tab.items.map((leg, idx) => {
              const from = leg.departure_city || leg.from_city || leg.from || 'TBD';
              const to = leg.arrival_city || leg.to_city || leg.to || 'TBD';
              const pax = leg.available_seats || leg.passengers || leg.max_passengers || '?';
              const priceUSD = leg.price_eur ? Math.round(leg.price_eur * 1.1) : '?';
              const tabId = `emptyleg-${leg.id || idx}`;
              
              return (
                <button
                  key={tabId}
                  onClick={() => setActiveTab(tabId)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                    activeTab === tabId
                      ? 'bg-black text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{from} → {to}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs opacity-70">
                      <span>{pax} pax</span>
                      <span>•</span>
                      <span>${priceUSD.toLocaleString()}</span>
                    </div>
                  </div>
                </button>
              );
            });
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
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  index === currentTabData.items.length - 1 ? 'border-b-0' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      {/* Service Image */}
                      {item.primaryImage && (
                        <img
                          src={item.primaryImage}
                          alt={item.name || item.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      
                      {/* Service Details */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {item.name || item.title || 'Unnamed Service'}
                        </h3>
                        
                        {/* Service-specific info */}
                        {item.type === 'jets' && (
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Passengers: {item.min_passengers || 1}-{item.max_passengers}</p>
                            {item.range_km && <p>Range: {item.range_km.toLocaleString()} km</p>}
                            {item.speed_kmh && <p>Speed: {item.speed_kmh} km/h</p>}
                          </div>
                        )}
                        
                        {item.type === 'empty_legs' && (
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>{item.subtitle}</p>
                            {item.aircraft_type && <p>Aircraft: {item.aircraft_type}</p>}
                            {item.capacity && <p>Capacity: {item.capacity}</p>}
                          </div>
                        )}
                        
                        {item.type === 'helicopters' && (
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Passengers: {item.max_passengers}</p>
                            {item.range_km && <p>Range: {item.range_km} km</p>}
                          </div>
                        )}
                        
                        {item.type === 'yachts' && (
                          <div className="text-sm text-gray-600 space-y-1">
                            {item.length_ft && <p>Length: {item.length_ft}ft</p>}
                            <p>Passengers: {item.max_passengers}</p>
                            {item.cabins && <p>Cabins: {item.cabins}</p>}
                          </div>
                        )}
                        
                        {item.type === 'luxury_cars' && (
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>{item.year} {item.brand} {item.model}</p>
                            {item.fuel_type && <p>Fuel: {item.fuel_type}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Price and Actions */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {item.price && (
                        <p className="text-lg font-semibold text-gray-900">
                          €{item.price.toLocaleString()}
                          {item.type === 'jets' || item.type === 'helicopters' ? '/hr' : 
                           item.type === 'yachts' ? '/day' : ''}
                        </p>
                      )}
                      {item.currency && item.currency !== 'EUR' && (
                        <p className="text-sm text-gray-500">
                          {item.currency} {item.price}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onAddToCalendar && onAddToCalendar(item)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Add to Calendar"
                      >
                        <CalendarPlus size={18} />
                      </button>
                      
                      <button
                        onClick={() => onAddToCart && onAddToCart(item)}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Show More/Less Buttons */}
          {currentTabData.items.length > 5 && (
            <div className="flex justify-center mt-6">
              {!showAllItems ? (
                <button
                  onClick={() => setShowAllItems(true)}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Show {currentTabData.items.length - 5} More
                </button>
              ) : (
                <button
                  onClick={() => setShowAllItems(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Show Less
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
