import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Ticket, Users, Music, Trophy, Theater, Film, Star, Info, Share2, ExternalLink, ChevronRight } from 'lucide-react';
import { ticketmasterService } from '../../services/ticketmasterService';
import { eventbriteService } from '../../services/eventbriteService';

const EventsSportsView = ({ cart = [], setCart }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('Zurich');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const categories = [
    { id: 'all', name: 'All Events', classification: null },
    { id: 'music', name: 'Music', classification: 'Music' },
    { id: 'sports', name: 'Sports', classification: 'Sports' },
    { id: 'arts', name: 'Arts & Theatre', classification: 'Arts & Theatre' },
    { id: 'family', name: 'Family', classification: 'Family' },
    { id: 'film', name: 'Film', classification: 'Film' }
  ];

  const cities = [
    { name: 'New York', code: 'US' },
    { name: 'Los Angeles', code: 'US' },
    { name: 'London', code: 'GB' },
    { name: 'Paris', code: 'FR' },
    { name: 'Zurich', code: 'CH' },
    { name: 'Geneva', code: 'CH' },
    { name: 'Dubai', code: 'AE' },
    { name: 'Monaco', code: 'MC' }
  ];

  useEffect(() => {
    loadEvents();
  }, [selectedCategory, selectedCity, searchQuery, page]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const hasTicketmasterKey = import.meta.env.VITE_TICKETMASTER_CONSUMER_KEY;
      const hasEventbriteKey = import.meta.env.VITE_EVENTBRITE_TOKEN;

      if (!hasTicketmasterKey && !hasEventbriteKey) {
        console.warn('No API keys configured. Using mock data.');
        setEvents(generateMockEvents());
        setTotalPages(1);
        setLoading(false);
        return;
      }

      const cityData = cities.find(c => c.name === selectedCity);
      const category = categories.find(c => c.id === selectedCategory);

      const [ticketmasterData, eventbriteData] = await Promise.all([
        loadTicketmasterEvents(cityData, category, hasTicketmasterKey),
        loadEventbriteEvents(hasEventbriteKey)
      ]);

      const combinedEvents = [...ticketmasterData, ...eventbriteData];
      setEvents(combinedEvents);
      setTotalPages(1);
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketmasterEvents = async (cityData, category, hasKey) => {
    if (!hasKey) return [];
    try {
      const params = {
        city: selectedCity,
        countryCode: cityData?.code || 'CH',
        size: 10,
        page,
        sort: 'date,asc'
      };
      if (category?.classification) params.classificationName = category.classification;
      if (searchQuery.trim()) params.keyword = searchQuery;

      const data = await ticketmasterService.searchEvents(params);
      return (data.events || []).map(event => ({ ...event, source: 'ticketmaster', hasCheckout: false }));
    } catch (error) {
      console.error('Ticketmaster error:', error);
      return [];
    }
  };

  const loadEventbriteEvents = async (hasKey) => {
    if (!hasKey) return [];
    try {
      const params = {
        location_address: selectedCity,
        location_within: '50km',
        page: page + 1,
        sort_by: 'date'
      };
      if (searchQuery.trim()) params.q = searchQuery;

      const data = await eventbriteService.searchEvents(params);
      return (data.events || []).map(event => ({ ...event, source: 'eventbrite', hasCheckout: true }));
    } catch (error) {
      console.error('Eventbrite error:', error);
      return [];
    }
  };

  const generateMockEvents = () => {
    return [
      {
        id: 'mock-1',
        name: 'Summer Music Festival 2025',
        source: 'mock',
        url: '#',
        images: [{ url: 'https://via.placeholder.com/800x450?text=Music+Festival', ratio: '16_9' }],
        dates: { start: { localDate: '2025-07-15', localTime: '18:00:00' }, status: { code: 'onsale' } },
        classifications: [{ segment: { name: 'Music' } }],
        venues: [{ name: 'City Stadium', city: { name: selectedCity } }],
        priceRanges: [{ min: 50, max: 150, currency: 'USD' }]
      }
    ];
  };

  const getEventImage = (event) => {
    if (event.source === 'ticketmaster') {
      return event.images?.[0]?.url || 'https://via.placeholder.com/800x450?text=Event';
    }
    return event.logo?.url || event.image || 'https://via.placeholder.com/800x450?text=Event';
  };

  const formatDate = (event) => {
    if (event.source === 'ticketmaster') {
      const date = event.dates?.start;
      if (!date) return 'Date TBA';
      return `${date.localDate} ${date.localTime || ''}`.trim();
    }
    return event.start?.local || 'Date TBA';
  };

  const formatPrice = (event) => {
    if (event.source === 'ticketmaster') {
      const pr = event.priceRanges?.[0];
      if (!pr) return 'Price TBA';
      return `${pr.currency} ${pr.min}-${pr.max}`;
    }
    return event.priceRange?.display || 'Price TBA';
  };

  const getVenueInfo = (event) => {
    if (event.source === 'ticketmaster') {
      const venue = event.venues?.[0];
      return venue ? `${venue.name}, ${venue.city?.name || ''}` : 'Venue TBA';
    }
    return event.venue?.name || 'Venue TBA';
  };

  if (selectedEvent) {
    return (
      <div className="w-full flex-1 flex flex-col">
        <button
          onClick={() => setSelectedEvent(null)}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6 transition-colors"
        >
          <span className="text-xl">←</span>
          <span className="text-sm font-medium">Back to Events</span>
        </button>

        <div className="bg-white/35 rounded-lg border border-gray-300/50 p-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
          <h2 className="text-2xl font-semibold mb-4">{selectedEvent.name}</h2>
          <img src={getEventImage(selectedEvent)} alt={selectedEvent.name} className="w-full h-64 object-cover rounded-lg mb-4" />

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-500 mb-1">Date</p>
              <p className="text-sm font-semibold">{formatDate(selectedEvent)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Venue</p>
              <p className="text-sm font-semibold">{getVenueInfo(selectedEvent)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Price</p>
              <p className="text-sm font-semibold">{formatPrice(selectedEvent)}</p>
            </div>
          </div>

          <a
            href={selectedEvent.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg text-sm font-semibold hover:bg-black transition-colors block text-center"
          >
            Buy Tickets
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Events & Sports</h2>
        <div className="flex items-center gap-2 bg-white/35 border border-gray-300/50 rounded-lg p-1" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${viewMode === 'grid' ? 'bg-gray-800 text-white' : 'text-gray-600'}`}
          >
            Grid View
          </button>
          <button
            onClick={() => setViewMode('tabs')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${viewMode === 'tabs' ? 'bg-gray-800 text-white' : 'text-gray-600'}`}
          >
            Tabs View
          </button>
        </div>
      </div>

      <div className="bg-white/35 rounded-lg border border-gray-300/50 p-5 mb-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-800 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300/50 rounded-lg bg-white/60 text-sm"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-800 mb-2">City</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300/50 rounded-lg bg-white/60 text-sm"
            >
              {cities.map((city) => (
                <option key={city.name} value={city.name}>{city.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-800 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300/50 rounded-lg bg-white/60 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedCity('Zurich'); }}
              className="w-full px-4 py-2.5 bg-gray-100/60 text-gray-700 rounded-lg text-sm hover:bg-gray-200/60"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-sm text-gray-600">Loading events...</div>
        </div>
      )}

      {!loading && events.length === 0 && (
        <div className="flex justify-center items-center py-12">
          <p className="text-sm text-gray-600">No events found</p>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="grid grid-cols-2 gap-5">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="bg-white/35 hover:bg-white/40 rounded-xl flex h-64 hover:shadow-lg transition-all cursor-pointer border border-gray-300/50"
              style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
            >
              <div className="w-2/5 relative rounded-l-xl overflow-hidden">
                <img src={getEventImage(event)} alt={event.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 p-5 flex flex-col">
                <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">{event.name}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Calendar size={14} />
                    <span>{formatDate(event)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <MapPin size={14} />
                    <span>{getVenueInfo(event)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Ticket size={14} />
                    <span className="font-semibold text-gray-900">{formatPrice(event)}</span>
                  </div>
                </div>
                <button className="mt-auto w-full bg-gray-800 hover:bg-gray-900 text-white text-xs font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                  View Details
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsSportsView;
