import React, { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, Plane, Mountain, Car, Zap, Leaf, Trophy, Music, Theater, ArrowRight, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ticketmasterService } from '../services/ticketmasterService';
import { eventbriteService } from '../services/eventbriteService';

const SearchIndexPage = ({ query, onNavigate, onSelectItem }) => {
  const [results, setResults] = useState({
    jets: [],
    emptyLegs: [],
    helicopters: [],
    luxuryCars: [],
    adventures: [],
    events: [],
    co2Certificates: []
  });
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    if (query) {
      searchAll();
    }
  }, [query]);

  const searchAll = async () => {
    setLoading(true);
    try {
      const searchTerm = query.toLowerCase();

      // Extract keywords from search term (remove common words, split by spaces)
      const commonWords = ['i', 'a', 'an', 'the', 'need', 'want', 'looking', 'for', 'from', 'to'];
      const keywords = searchTerm
        .split(' ')
        .filter(word => word.length > 2 && !commonWords.includes(word))
        .join(' ') || searchTerm;

      let allResults = {
        jets: [],
        emptyLegs: [],
        helicopters: [],
        luxuryCars: [],
        adventures: [],
        events: [],
        co2Certificates: []
      };

      // Check if it's a "how much" query - forward to charter page
      if (searchTerm.includes('how much') || searchTerm.includes('cost')) {
        onNavigate('jets');
        return;
      }

      // Search Jets
      try {
        const { data: jetsData } = await supabase
          .from('jets')
          .select('*')
          .or(`name.ilike.%${keywords}%,description.ilike.%${keywords}%,category.ilike.%${keywords}%`)
          .limit(5);
        allResults.jets = jetsData || [];
      } catch (error) {
        console.error('Error searching jets:', error);
        // Fallback: search without filter if or() fails
        try {
          const { data: fallbackData } = await supabase
            .from('jets')
            .select('*')
            .limit(5);
          allResults.jets = fallbackData || [];
        } catch (fallbackError) {
          console.error('Fallback jets search failed:', fallbackError);
        }
      }

      // Search Empty Legs
      try {
        const { data: emptyLegsData } = await supabase
          .from('EmptyLegs_')
          .select('*')
          .or(`from_city.ilike.%${keywords}%,to_city.ilike.%${keywords}%,from.ilike.%${keywords}%,to.ilike.%${keywords}%`)
          .limit(5);
        allResults.emptyLegs = emptyLegsData || [];
      } catch (error) {
        console.error('Error searching empty legs:', error);
      }

      // Search Helicopter Charters
      // Note: The correct table name is 'helicopter_charters' not 'helicopters'
      try {
        const { data: helisData } = await supabase
          .from('helicopter_charters')
          .select('*')
          .or(`name.ilike.%${keywords}%,description.ilike.%${keywords}%`)
          .limit(5);
        allResults.helicopters = helisData || [];
      } catch (error) {
        console.error('Error searching helicopter charters:', error);
      }

      // Search Luxury Cars
      try {
        const { data: carsData } = await supabase
          .from('luxury_cars')
          .select('*')
          .or(`brand.ilike.%${keywords}%,model.ilike.%${keywords}%,location.ilike.%${keywords}%`)
          .limit(5);
        allResults.luxuryCars = carsData || [];
      } catch (error) {
        console.error('Error searching luxury cars:', error);
      }

      // Search Fixed Offers (Adventures/Packages)
      // Note: The 'adventures' table doesn't exist - we use 'fixed_offers' instead
      // Filter by is_empty_leg = false to get only fixed offer packages
      try {
        const { data: fixedOffersData } = await supabase
          .from('fixed_offers')
          .select('*')
          .eq('is_empty_leg', false)
          .or(`title.ilike.%${keywords}%,description.ilike.%${keywords}%,origin.ilike.%${keywords}%,destination.ilike.%${keywords}%`)
          .limit(5);
        allResults.adventures = fixedOffersData || [];
      } catch (error) {
        console.error('Error searching fixed offers:', error);
      }

      // Search Events from Ticketmaster and Eventbrite
      try {
        const [tmData, ebData] = await Promise.allSettled([
          ticketmasterService.searchEvents({ keyword: searchTerm, size: 5 }),
          eventbriteService.searchEvents({ q: searchTerm })
        ]);

        const tmEvents = tmData.status === 'fulfilled' ? (tmData.value?.events || []).map(e => ({ ...e, source: 'ticketmaster' })) : [];
        const ebEvents = ebData.status === 'fulfilled' ? (ebData.value?.events || []).slice(0, 5).map(e => ({ ...e, source: 'eventbrite' })) : [];

        allResults.events = [...tmEvents, ...ebEvents];
      } catch (error) {
        console.error('Error searching events:', error);
      }

      // Search CO2/SAF Certificates
      try {
        const { data: co2Data } = await supabase
          .from('co2_certificates')
          .select('*')
          .or(`name.ilike.%${keywords}%,description.ilike.%${keywords}%`)
          .limit(5);
        allResults.co2Certificates = co2Data || [];
      } catch (error) {
        console.error('Error searching CO2 certificates:', error);
      }

      setResults(allResults);
      const total = Object.values(allResults).reduce((sum, arr) => sum + arr.length, 0);
      setTotalResults(total);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (category, item) => {
    if (onSelectItem) {
      onSelectItem(category, item);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      jets: Plane,
      emptyLegs: Plane,
      helicopters: Zap,
      luxuryCars: Car,
      adventures: Mountain,
      events: Calendar,
      co2Certificates: Leaf
    };
    return icons[category] || Search;
  };

  const renderResultSection = (category, items, title) => {
    if (!items || items.length === 0) return null;

    const Icon = getCategoryIcon(category);

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon size={20} className="text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <span className="text-sm text-gray-500">({items.length})</span>
          </div>
          <button
            onClick={() => onNavigate(category)}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
          >
            View all
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => handleItemClick(category, item)}
              className="w-full border border-gray-300/50 rounded-xl p-4 hover:bg-white/40 transition-colors bg-white/35 text-left"
              style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {item.name || item.title || item.brand + ' ' + item.model || `${item.from_city || item.from} → ${item.to_city || item.to}`}
                  </h4>
                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {item.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {item.location}
                      </span>
                    )}
                    {item.price_eur && (
                      <span className="font-medium text-gray-700">€{item.price_eur.toLocaleString()}</span>
                    )}
                    {item.price && (
                      <span className="font-medium text-gray-700">€{item.price.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full p-6 overflow-y-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter mb-2">
          Search Results
        </h1>
        <p className="text-gray-600">
          {loading ? 'Searching...' : `Found ${totalResults} results for "${query}"`}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : totalResults === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Search className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-sm text-gray-500 mb-4">Contact our travel specialists for assistance</p>
          <a
            href="mailto:bookings@privatecharterx.com"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <Mail size={16} />
            Get in touch with us now
          </a>
        </div>
      ) : (
        <>
          {renderResultSection('jets', results.jets, 'Private Jets')}
          {renderResultSection('emptyLegs', results.emptyLegs, 'Empty Legs')}
          {renderResultSection('helicopters', results.helicopters, 'Helicopters')}
          {renderResultSection('luxuryCars', results.luxuryCars, 'Luxury Cars')}
          {renderResultSection('adventures', results.adventures, 'Adventures')}
          {renderResultSection('events', results.events, 'Events & Sports')}
          {renderResultSection('co2Certificates', results.co2Certificates, 'CO2 / SAF Certificates')}
        </>
      )}
    </div>
  );
};

export default SearchIndexPage;
