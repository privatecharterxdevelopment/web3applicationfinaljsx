import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Ticket, ChevronRight, Music, Trophy, Theater, Film, Users, Star, ArrowLeft, ExternalLink, Share2, Heart } from 'lucide-react';
import { ticketmasterService } from '../../services/ticketmasterService';
import { eventbriteService } from '../../services/eventbriteService';
import { supabase } from '../../lib/supabase';

const EventsSportsView = ({ cart = [], setCart, user }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('Miami');
  const [favourites, setFavourites] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);
  const eventsPerPage = 10;

  const categories = [
    { id: 'all', name: 'All Events', icon: Star, classification: null },
    { id: 'music', name: 'Music', icon: Music, classification: 'Music' },
    { id: 'sports', name: 'Sports', icon: Trophy, classification: 'Sports' },
    { id: 'arts', name: 'Arts & Theatre', icon: Theater, classification: 'Arts & Theatre' },
    { id: 'family', name: 'Family', icon: Users, classification: 'Family' },
    { id: 'film', name: 'Film', icon: Film, classification: 'Film' }
  ];

  const cities = [
    // North America
    { name: 'Miami', code: 'US' },
    { name: 'New York', code: 'US' },
    { name: 'Los Angeles', code: 'US' },
    { name: 'Chicago', code: 'US' },
    { name: 'Las Vegas', code: 'US' },
    // Europe
    { name: 'London', code: 'GB' },
    { name: 'Paris', code: 'FR' },
    { name: 'Monaco', code: 'MC' },
    { name: 'Barcelona', code: 'ES' },
    { name: 'Milan', code: 'IT' },
    { name: 'Zurich', code: 'CH' },
    // Middle East
    { name: 'Dubai', code: 'AE' },
    { name: 'Abu Dhabi', code: 'AE' },
    // Asia
    { name: 'Singapore', code: 'SG' },
    { name: 'Tokyo', code: 'JP' },
    { name: 'Hong Kong', code: 'HK' },
    { name: 'Bangkok', code: 'TH' },
    { name: 'Seoul', code: 'KR' },
    { name: 'Mumbai', code: 'IN' }
  ];

  useEffect(() => {
    loadEvents();
  }, [selectedCategory, selectedCity, searchQuery]);

  useEffect(() => {
    if (user) {
      loadFavourites();
    }
  }, [user]);

  const loadFavourites = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_favourites')
        .select('event_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavourites(data?.map(f => f.event_id) || []);
    } catch (error) {
      console.error('Error loading favourites:', error);
    }
  };

  const toggleFavourite = async (event) => {
    if (!user) {
      alert('Please sign in to add favourites');
      return;
    }

    const eventId = event.id;
    const isFavourite = favourites.includes(eventId);

    try {
      if (isFavourite) {
        // Remove from favourites
        const { error } = await supabase
          .from('user_favourites')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', eventId);

        if (error) throw error;
        setFavourites(favourites.filter(id => id !== eventId));
      } else {
        // Add to favourites
        const { error } = await supabase
          .from('user_favourites')
          .insert({
            user_id: user.id,
            event_id: eventId,
            event_name: event.name,
            event_date: event.source === 'ticketmaster'
              ? event.dates?.start?.dateTime || event.dates?.start?.localDate
              : event.start?.local,
            location: event.source === 'ticketmaster'
              ? `${event._embedded?.venues?.[0]?.name || ''}, ${event._embedded?.venues?.[0]?.city?.name || ''}`
              : event.venue?.address?.localized_address_display || event.venue?.name,
            category: event.classifications?.[0]?.segment?.name || event.category,
            image_url: getEventImage(event),
            source: event.source
          });

        if (error) throw error;
        setFavourites([...favourites, eventId]);
      }
    } catch (error) {
      console.error('Error toggling favourite:', error);
      alert('Failed to update favourites');
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    setPage(1);
    try {
      const hasTicketmasterKey = import.meta.env.VITE_TICKETMASTER_CONSUMER_KEY;
      const hasEventbriteKey = import.meta.env.VITE_EVENTBRITE_TOKEN;

      if (!hasTicketmasterKey && !hasEventbriteKey) {
        console.warn('No API keys configured. Using mock data.');
        setEvents(generateMockEvents());
        setLoading(false);
        return;
      }

      const cityData = cities.find(c => c.name === selectedCity);
      const category = categories.find(c => c.id === selectedCategory);

      const [ticketmasterData, eventbriteData] = await Promise.all([
        loadTicketmasterEvents(cityData, category, hasTicketmasterKey),
        loadEventbriteEvents(hasEventbriteKey)
      ]);

      // Combine all events
      const allEvents = [...ticketmasterData, ...eventbriteData];
      console.log('Total events fetched:', allEvents.length);

      // Filter out only passed events (events that already ended)
      const now = new Date();
      const filteredEvents = allEvents.filter(event => {
        if (!event.name) return false;

        // Get event date
        let eventDate;
        if (event.source === 'ticketmaster') {
          eventDate = new Date(event.dates?.start?.dateTime || event.dates?.start?.localDate);
        } else {
          eventDate = new Date(event.start?.local);
        }

        // Keep events that haven't passed yet
        return eventDate >= now;
      });

      console.log('Events after filtering passed:', filteredEvents.length);

      // Sort by date
      const sortedEvents = filteredEvents.sort((a, b) => {
        const dateA = getEventDateForSort(a);
        const dateB = getEventDateForSort(b);
        return dateA - dateB;
      });

      setEvents(sortedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getEventDateForSort = (event) => {
    if (event.source === 'ticketmaster') {
      return new Date(event.dates?.start?.dateTime || event.dates?.start?.localDate || '2099-12-31');
    } else if (event.source === 'eventbrite') {
      return new Date(event.start?.local || '2099-12-31');
    }
    return new Date('2099-12-31');
  };

  const loadTicketmasterEvents = async (cityData, category, hasKey) => {
    if (!hasKey) {
      console.log('❌ No Ticketmaster API key');
      return [];
    }
    try {
      const params = {
        city: selectedCity,
        countryCode: cityData?.code || 'US',
        size: 50,
        sort: 'date,asc'
      };
      // Only add classification if it's not "all" (which has null classification)
      if (category?.classification) {
        params.classificationName = category.classification;
      }
      if (searchQuery.trim()) {
        params.keyword = searchQuery;
      }

      console.log('🎫 Fetching Ticketmaster events with params:', params);
      const data = await ticketmasterService.searchEvents(params);
      console.log('✅ Ticketmaster raw response:', data);
      const events = (data.events || []).map(event => ({ ...event, source: 'ticketmaster' }));
      console.log(`✅ Ticketmaster events mapped: ${events.length} events`);
      return events;
    } catch (error) {
      console.error('❌ Ticketmaster error:', error);
      return [];
    }
  };

  const loadEventbriteEvents = async (hasKey) => {
    if (!hasKey) {
      console.log('❌ No Eventbrite API key');
      return [];
    }
    try {
      const params = {
        location_address: selectedCity,
        location_within: '50km',
        sort_by: 'date'
      };
      if (searchQuery.trim()) params.q = searchQuery;

      console.log('🎟️ Fetching Eventbrite events with params:', params);
      const data = await eventbriteService.searchEvents(params);
      console.log('✅ Eventbrite raw response:', data);
      const events = (data.events || []).map(event => ({ ...event, source: 'eventbrite' }));
      console.log(`✅ Eventbrite events mapped: ${events.length} events`);
      return events;
    } catch (error) {
      console.error('❌ Eventbrite error:', error);
      return [];
    }
  };

  const generateMockEvents = () => {
    const mockEvents = [
      { id: 'mock-1', name: 'Summer Music Festival 2025', classification: 'Music', date: '2025-07-15', time: '18:00', venue: 'City Stadium', price: '$50-150' },
      { id: 'mock-2', name: 'Championship Basketball Game', classification: 'Sports', date: '2025-08-20', time: '19:30', venue: 'Sports Arena', price: '$40-200' },
      { id: 'mock-3', name: 'Classical Symphony Orchestra', classification: 'Music', date: '2025-09-10', time: '20:00', venue: 'Concert Hall', price: '$30-120' },
      { id: 'mock-4', name: 'Comedy Night Special', classification: 'Arts & Theatre', date: '2025-10-05', time: '21:00', venue: 'Comedy Club', price: '$20-60' },
      { id: 'mock-5', name: 'Family Fun Day', classification: 'Family', date: '2025-11-12', time: '14:00', venue: 'City Park', price: '$10-30' },
      { id: 'mock-6', name: 'International Food Expo', classification: 'Arts & Theatre', date: '2025-12-01', time: '10:00', venue: 'Convention Center', price: '$25-75' }
    ];
    return mockEvents.map(e => ({
      ...e,
      source: 'mock',
      url: '#',
      images: [{ url: 'https://via.placeholder.com/800x450?text=' + encodeURIComponent(e.name) }],
      dates: { start: { localDate: e.date, localTime: e.time } },
      classifications: [{ segment: { name: e.classification } }],
      venues: [{ name: e.venue, city: { name: selectedCity } }],
      priceRanges: [{ min: parseInt(e.price.split('-')[0].replace('$', '')), max: parseInt(e.price.split('-')[1]), currency: 'USD' }]
    }));
  };

  const getEventImage = (event) => {
    if (event.source === 'ticketmaster') {
      // Ticketmaster images array - get the first available image
      return event.images?.[0]?.url || event.images?.[1]?.url || event.images?.[2]?.url || 'https://via.placeholder.com/800x450?text=Event';
    }
    if (event.source === 'eventbrite') {
      // Eventbrite logo/image - multiple fallbacks
      return event.logo?.url || event.logo?.original?.url || event.image || 'https://via.placeholder.com/800x450?text=Event';
    }
    return event.images?.[0]?.url || 'https://via.placeholder.com/800x450?text=Event';
  };

  const formatDate = (event) => {
    if (event.source === 'ticketmaster') {
      const date = event.dates?.start;
      if (!date || !date.localDate) return 'Date TBA';
      const d = new Date(date.localDate);
      const formatted = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      return date.localTime ? `${formatted} at ${date.localTime}` : formatted;
    }
    if (event.source === 'eventbrite') {
      if (!event.start?.local) return 'Date TBA';
      const d = new Date(event.start.local);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    return `${event.date} at ${event.time}`;
  };

  const formatPrice = (event) => {
    if (event.source === 'ticketmaster') {
      const pr = event.priceRanges?.[0];
      if (!pr) return 'Price TBA';
      return pr.min === pr.max ? `${pr.currency} ${pr.min}` : `${pr.currency} ${pr.min}-${pr.max}`;
    }
    if (event.source === 'eventbrite') {
      if (event.is_free) return 'Free';
      const pr = event.ticket_availability;
      if (pr?.minimum_ticket_price && pr?.maximum_ticket_price) {
        const min = pr.minimum_ticket_price.major_value;
        const max = pr.maximum_ticket_price.major_value;
        const currency = pr.minimum_ticket_price.currency;
        return min === max ? `${currency} ${min}` : `${currency} ${min}-${max}`;
      }
      return 'Price TBA';
    }
    return event.price || 'Price TBA';
  };

  const getVenueInfo = (event) => {
    if (event.source === 'ticketmaster') {
      const venue = event.venues?.[0];
      return venue ? `${venue.name}, ${venue.city?.name || ''}` : 'Venue TBA';
    }
    if (event.source === 'eventbrite') {
      const venue = event.venue;
      return venue ? `${venue.name}${venue.address?.city ? ', ' + venue.address.city : ''}` : 'Venue TBA';
    }
    return `${event.venue}, ${selectedCity}`;
  };

  const getEventCategory = (event) => {
    if (event.source === 'ticketmaster') return event.classifications?.[0]?.segment?.name || 'Event';
    if (event.source === 'eventbrite') return event.category?.name || 'Event';
    return event.classification || 'Event';
  };

  const getEventUrl = (event) => {
    if (event.source === 'ticketmaster') return event.url;
    if (event.source === 'eventbrite') return event.url;
    return '#';
  };

  const paginatedEvents = events.slice((page - 1) * eventsPerPage, page * eventsPerPage);
  const totalPages = Math.ceil(events.length / eventsPerPage);

  // Event Detail View
  if (selectedEvent) {
    const getEventDescription = (event) => {
      if (event.source === 'ticketmaster') {
        return event.info || event.pleaseNote || `Experience ${event.name} live! This exciting ${getEventCategory(event).toLowerCase()} event promises an unforgettable experience. Don't miss out on this incredible opportunity to be part of the action.`;
      }
      if (event.source === 'eventbrite') {
        return event.description?.text || event.summary || `Join us for ${event.name}! This ${getEventCategory(event).toLowerCase()} event offers a unique experience you won't want to miss.`;
      }
      return `Experience ${event.name} live at ${getVenueInfo(event)}. This spectacular ${getEventCategory(event).toLowerCase()} event is perfect for entertainment enthusiasts.`;
    };

    return (
      <div className="w-full flex-1 flex flex-col">
        <button
          onClick={() => {
            setSelectedEvent(null);
            setActiveTab('details');
          }}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back to Events</span>
        </button>

        {/* Event Header Card */}
        <div className="bg-white/35 rounded-lg border border-gray-300/50 mb-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
          <div className="flex h-80">
            {/* Left side - Event Image */}
            <div className="w-2/5 relative bg-gray-100/50">
              <img
                src={getEventImage(selectedEvent)}
                alt={selectedEvent.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex space-x-1.5">
                <div className="bg-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  <span>Available</span>
                </div>
                <div className="bg-white px-2 py-1 rounded text-xs font-medium">{getEventCategory(selectedEvent)}</div>
              </div>
            </div>

            {/* Right side - Event info */}
            <div className="flex-1 p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">
                  {selectedEvent.source === 'ticketmaster' ? 'TICKETMASTER' : selectedEvent.source === 'eventbrite' ? 'EVENTBRITE' : 'PCX EVENTS'}
                </span>
                <div className="flex space-x-2">
                  <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">⎘</button>
                  <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">◉</button>
                </div>
              </div>

              <h1 className="text-2xl font-semibold mb-4 text-gray-900">
                {selectedEvent.name}
              </h1>
              <p className="text-sm text-gray-600 mb-4">
                {getVenueInfo(selectedEvent)} · {getEventCategory(selectedEvent)}
              </p>

              {/* Tab Navigation */}
              <div className="flex space-x-6 border-b border-gray-300 mb-5">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-3 text-xs relative ${activeTab === 'details' ? 'text-black' : 'text-gray-600'}`}
                >
                  Event Details
                  {activeTab === 'details' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('venue')}
                  className={`pb-3 text-xs relative ${activeTab === 'venue' ? 'text-black' : 'text-gray-600'}`}
                >
                  Venue Info
                  {activeTab === 'venue' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('pricing')}
                  className={`pb-3 text-xs relative ${activeTab === 'pricing' ? 'text-black' : 'text-gray-600'}`}
                >
                  Pricing
                  {activeTab === 'pricing' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
              </div>

              {/* Key metrics */}
              <div className="flex justify-between mt-auto mb-5">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Date & Time</span>
                  <span className="text-sm font-semibold text-black">{formatDate(selectedEvent).substring(0, 20)}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Price Range</span>
                  <span className="text-sm font-semibold text-black">{formatPrice(selectedEvent)}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Category</span>
                  <span className="text-sm font-semibold text-black">{getEventCategory(selectedEvent)}</span>
                </div>
              </div>

              {/* Links */}
              <div className="flex space-x-4 pt-4 border-t border-gray-100 text-xs">
                <a
                  href={getEventUrl(selectedEvent)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-black"
                >
                  Official Page ↗
                </a>
                <button className="text-gray-600 hover:text-black">Terms & Conditions ⚖</button>
              </div>
            </div>
          </div>
        </div>

        {/* Content and Booking Section */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Content */}
          <div className="col-span-2">
            <div className="bg-white/35 rounded-lg border border-gray-300/50 p-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-black mb-3">Event Description</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {getEventDescription(selectedEvent)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                    <div className="flex items-start space-x-3">
                      <Calendar className="text-gray-600 mt-0.5" size={20} />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Event Date</p>
                        <p className="text-sm font-semibold text-black">{formatDate(selectedEvent)}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="text-gray-600 mt-0.5" size={20} />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Venue</p>
                        <p className="text-sm font-semibold text-black">{getVenueInfo(selectedEvent)}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Ticket className="text-gray-600 mt-0.5" size={20} />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Price Range</p>
                        <p className="text-sm font-semibold text-black">{formatPrice(selectedEvent)}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Star className="text-gray-600 mt-0.5" size={20} />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Category</p>
                        <p className="text-sm font-semibold text-black">{getEventCategory(selectedEvent)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'venue' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-black mb-4">Venue Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50/50 rounded">
                      <p className="text-xs text-gray-500 mb-1">Venue Name</p>
                      <p className="text-sm font-semibold text-black">{getVenueInfo(selectedEvent).split(',')[0]}</p>
                    </div>
                    <div className="p-3 bg-gray-50/50 rounded">
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="text-sm font-semibold text-black">{getVenueInfo(selectedEvent).split(',')[1] || selectedCity}</p>
                    </div>
                    <div className="p-3 bg-gray-50/50 rounded">
                      <p className="text-xs text-gray-500 mb-1">Event Date</p>
                      <p className="text-sm font-semibold text-black">{formatDate(selectedEvent)}</p>
                    </div>
                    <div className="p-3 bg-gray-50/50 rounded">
                      <p className="text-xs text-gray-500 mb-1">Category</p>
                      <p className="text-sm font-semibold text-black">{getEventCategory(selectedEvent)}</p>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50/50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      This venue offers excellent facilities and accessibility. Please check the official venue website for parking, public transport, and accessibility information.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'pricing' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-black mb-4">Ticket Pricing</h3>
                  <div className="p-4 bg-gray-50/50 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-gray-600">Price Range</span>
                      <span className="text-lg font-bold text-black">{formatPrice(selectedEvent)}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Ticket prices may vary based on seating location and availability. Additional fees may apply at checkout. Visit the official ticketing page for exact pricing.
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50/50 rounded-lg">
                    <h4 className="text-sm font-semibold text-black mb-2">Important Notes</h4>
                    <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                      <li>Prices exclude service fees and taxes</li>
                      <li>Early bird discounts may be available</li>
                      <li>Group bookings may receive special rates</li>
                      <li>Refund policies vary by event</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Booking Widget */}
          <div className="col-span-1">
            <div className="bg-white/35 rounded-lg border border-gray-300/50 p-6 sticky top-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
              <h3 className="text-lg font-semibold text-black mb-4">Purchase Tickets</h3>

              <div className="space-y-4 mb-6">
                <div className="p-3 bg-gray-50/50 rounded">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Event</span>
                    <span className="text-sm font-semibold text-black line-clamp-1">{selectedEvent.name.substring(0, 30)}</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50/50 rounded">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Date</span>
                    <span className="text-sm font-semibold text-black">{formatDate(selectedEvent).split(' at ')[0].substring(0, 20)}</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50/50 rounded">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Price Range</span>
                    <span className="text-sm font-semibold text-black">{formatPrice(selectedEvent)}</span>
                  </div>
                </div>
              </div>

              <a
                href={getEventUrl(selectedEvent)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all mb-3 flex items-center justify-center gap-2"
              >
                Buy Tickets
                <ExternalLink size={16} />
              </a>

              <button
                className="w-full bg-white border-2 border-black text-black py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Check NFT Membership
              </button>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Secure tickets directly from {selectedEvent.source === 'ticketmaster' ? 'Ticketmaster' : selectedEvent.source === 'eventbrite' ? 'Eventbrite' : 'official partners'}. NFT members receive priority access and exclusive benefits for premium events.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Events List View
  return (
    <div className="w-full flex-1 flex flex-col font-['DM_Sans']">
      {/* Floating Banner with Video Background */}
      <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-8 shadow-lg bg-black">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover rounded-2xl"
        >
          <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/fucking%20videos/4916768-hd_1920_1080_30fps.mp4" type="video/mp4" />
        </video>

        {/* Brighter Grey Gradient Filter - Light to Dark */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-gray-300/60 to-gray-600/70 pointer-events-none rounded-2xl" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter font-['DM_Sans']">Events & Sports</h2>
        <div className="flex items-center gap-2 bg-white/35 border border-gray-300/50 rounded-lg p-1" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${viewMode === 'grid' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:text-gray-800'}`}
          >
            Grid View
          </button>
          <button
            onClick={() => setViewMode('tabs')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${viewMode === 'tabs' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:text-gray-800'}`}
          >
            Tabs View
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/35 rounded-lg border border-gray-300/50 p-5 mb-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-800 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300/50 rounded-lg bg-white/60 text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
              style={{ backdropFilter: 'blur(10px) saturate(150%)' }}
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
              className="w-full px-3 py-2.5 border border-gray-300/50 rounded-lg bg-white/60 text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
              style={{ backdropFilter: 'blur(10px) saturate(150%)' }}
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
              placeholder="Search events, artists, teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300/50 rounded-lg bg-white/60 text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
              style={{ backdropFilter: 'blur(10px) saturate(150%)' }}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedCity('Miami'); }}
              className="w-full px-4 py-2.5 bg-gray-100/60 text-gray-700 rounded-lg text-sm hover:bg-gray-200/60 transition-all"
              style={{ backdropFilter: 'blur(10px) saturate(150%)' }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="text-sm text-gray-600">Loading events...</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && events.length === 0 && (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">No events found</p>
            <p className="text-xs text-gray-400">Try adjusting your filters or search query</p>
          </div>
        </div>
      )}

      {/* Events Grid View */}
      {!loading && paginatedEvents.length > 0 && viewMode === 'grid' && (
        <>
          <div className="grid grid-cols-2 gap-5 mb-6">
            {paginatedEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="bg-white/35 hover:bg-white/40 rounded-xl flex h-64 hover:shadow-lg transition-all cursor-pointer border border-gray-300/50"
                style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
              >
                <div className="w-2/5 relative rounded-l-xl overflow-hidden bg-white/10">
                  <img src={getEventImage(event)} alt={event.name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3">
                    <div className="bg-white/90 px-2 py-1 rounded text-xs font-medium text-gray-800 backdrop-blur-sm">
                      {getEventCategory(event)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavourite(event);
                    }}
                    className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-all backdrop-blur-sm"
                  >
                    <Heart
                      size={16}
                      className={favourites.includes(event.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}
                    />
                  </button>
                </div>

                <div className="flex-1 p-5 flex flex-col">
                  <h3 className="text-base font-semibold text-gray-900 mb-3 line-clamp-2">{event.name}</h3>

                  <div className="flex justify-between mb-4">
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-600">Date</span>
                      <span className="text-xs font-semibold text-gray-800">{formatDate(event).split(' at ')[0]}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-600">Price</span>
                      <span className="text-xs font-semibold text-gray-800">{formatPrice(event)}</span>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="text-xs text-gray-600 mb-3 flex items-center gap-1">
                      <MapPin size={12} />
                      <span className="line-clamp-1">{getVenueInfo(event)}</span>
                    </div>
                    <div className="flex space-x-2 text-xs">
                      <button className="flex-1 bg-gray-800 hover:bg-gray-900 text-white py-2 rounded-lg transition-colors font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white/35 hover:bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
              >
                Previous
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg text-sm transition-all ${
                      page === pageNum
                        ? 'bg-gray-800 text-white'
                        : 'bg-white/35 hover:bg-white/40 border border-gray-300/50 text-gray-700'
                    }`}
                    style={page !== pageNum ? { backdropFilter: 'blur(20px) saturate(180%)' } : {}}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white/35 hover:bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Events Tabs View */}
      {!loading && paginatedEvents.length > 0 && viewMode === 'tabs' && (
        <>
          {/* Category Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-black text-white border-black'
                    : 'bg-white/35 text-gray-700 border-gray-300/50 hover:bg-white/40'
                }`}
                style={selectedCategory !== cat.id ? { backdropFilter: 'blur(20px) saturate(180%)' } : {}}
              >
                <cat.icon size={16} />
                {cat.name}
              </button>
            ))}
          </div>

          {/* Events List */}
          <div className="space-y-4 mb-6">
            {paginatedEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="bg-white/35 hover:bg-white/40 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer border border-gray-300/50"
                style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
              >
                <div className="flex gap-4">
                  {/* Event Image */}
                  <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-white/10 relative">
                    <img src={getEventImage(event)} alt={event.name} className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavourite(event);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full hover:bg-white transition-all backdrop-blur-sm"
                    >
                      <Heart
                        size={14}
                        className={favourites.includes(event.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}
                      />
                    </button>
                  </div>

                  {/* Event Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <div className="bg-white/90 px-2 py-0.5 rounded text-gray-800 font-medium">
                            {getEventCategory(event)}
                          </div>
                          <span>•</span>
                          <span>{event.source === 'ticketmaster' ? 'Ticketmaster' : event.source === 'eventbrite' ? 'Eventbrite' : 'PCX'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-600 mb-1">From</div>
                        <div className="text-base font-semibold text-gray-900">{formatPrice(event)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar size={14} className="text-gray-500" />
                        <span>{formatDate(event).split(' at ')[0]}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPin size={14} className="text-gray-500" />
                        <span className="truncate">{getVenueInfo(event)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-medium transition-colors">
                        View Details
                      </button>
                      <a
                        href={getEventUrl(event)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-4 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        Buy Tickets
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white/35 hover:bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
              >
                Previous
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg text-sm transition-all ${
                      page === pageNum
                        ? 'bg-gray-800 text-white'
                        : 'bg-white/35 hover:bg-white/40 border border-gray-300/50 text-gray-700'
                    }`}
                    style={page !== pageNum ? { backdropFilter: 'blur(20px) saturate(180%)' } : {}}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white/35 hover:bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventsSportsView;
