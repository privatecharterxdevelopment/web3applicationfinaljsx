import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Ticket, SlidersHorizontal, ChevronRight } from 'lucide-react';
import { ticketmasterService } from '../../services/ticketmasterService';
import { eventbriteService } from '../../services/eventbriteService';
import FavouriteButton from '../Favourites/FavouriteButton';

const EventsSportsView = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('Zurich');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);

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
  }, [selectedCategory, selectedCity, searchQuery]);

  const loadEvents = async () => {
    setLoading(true);
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

      console.log('🔍 Fetching events for:', { city: selectedCity, category: category?.name });

      const [ticketmasterData, eventbriteData] = await Promise.all([
        loadTicketmasterEvents(cityData, category, hasTicketmasterKey),
        loadEventbriteEvents(hasEventbriteKey)
      ]);

      console.log('📊 Events fetched:', { ticketmaster: ticketmasterData.length, eventbrite: eventbriteData.length });

      let allEvents = [...ticketmasterData, ...eventbriteData];

      // Filter by category
      if (selectedCategory !== 'all') {
        const categoryName = category?.classification;
        allEvents = allEvents.filter(event => {
          if (event.source === 'ticketmaster') {
            return event.classifications?.[0]?.segment?.name === categoryName;
          }
          if (event.source === 'eventbrite') {
            return event.category?.name === categoryName;
          }
          return false;
        });
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        allEvents = allEvents.filter(event =>
          event.name?.toLowerCase().includes(query)
        );
      }

      console.log('✅ Final filtered events:', allEvents.length);
      setEvents(allEvents);
    } catch (error) {
      console.error('❌ Error loading events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketmasterEvents = async (cityData, category, hasKey) => {
    if (!hasKey) {
      console.log('❌ No Ticketmaster API key');
      return [];
    }
    try {
      const params = {
        city: selectedCity,
        countryCode: cityData?.code || 'CH',
        size: 50,
        sort: 'date,asc'
      };
      if (category?.classification) params.classificationName = category.classification;
      if (searchQuery.trim()) params.keyword = searchQuery;

      console.log('🎫 Fetching Ticketmaster with:', params);
      const data = await ticketmasterService.searchEvents(params);
      console.log('✅ Ticketmaster response:', data);
      return (data.events || []).map(event => ({ ...event, source: 'ticketmaster' }));
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

      console.log('🎟️ Fetching Eventbrite with:', params);
      const data = await eventbriteService.searchEvents(params);
      console.log('✅ Eventbrite response:', data);
      return (data.events || []).map(event => ({ ...event, source: 'eventbrite' }));
    } catch (error) {
      console.error('❌ Eventbrite API error (this is normal - Eventbrite API has CORS restrictions):', error.message);
      console.log('ℹ️ Continuing with Ticketmaster events only');
      return [];
    }
  };

  const generateMockEvents = () => {
    // Generate different events for each city
    const eventsByCity = {
      'New York': [
        { id: 'ny-1', name: 'Broadway Music Night', classification: 'Music', date: '2025-07-15', time: '20:00', venue: 'Madison Square Garden', price: '$80-250', img: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=450&fit=crop' },
        { id: 'ny-2', name: 'Yankees vs Red Sox', classification: 'Sports', date: '2025-08-01', time: '19:00', venue: 'Yankee Stadium', price: '$60-300', img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=450&fit=crop' },
        { id: 'ny-3', name: 'Jazz Festival NYC', classification: 'Music', date: '2025-09-10', time: '18:00', venue: 'Apollo Theater', price: '$45-150', img: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&h=450&fit=crop' },
        { id: 'ny-4', name: 'Metropolitan Opera', classification: 'Arts & Theatre', date: '2025-08-22', time: '19:30', venue: 'Metropolitan Opera House', price: '$95-400', img: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=450&fit=crop' },
        { id: 'ny-5', name: 'NY Film Premiere', classification: 'Film', date: '2025-09-25', time: '18:00', venue: 'AMC Lincoln Square', price: '$35-120', img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=450&fit=crop' },
        { id: 'ny-6', name: 'Kids Discovery Festival', classification: 'Family', date: '2025-07-18', time: '10:00', venue: 'Central Park', price: '$25-60', img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=450&fit=crop' }
      ],
      'Los Angeles': [
        { id: 'la-1', name: 'Hollywood Bowl Concert', classification: 'Music', date: '2025-07-12', time: '19:30', venue: 'Hollywood Bowl', price: '$70-280', img: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=450&fit=crop' },
        { id: 'la-2', name: 'Lakers vs Warriors', classification: 'Sports', date: '2025-08-08', time: '19:30', venue: 'Crypto.com Arena', price: '$90-450', img: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&h=450&fit=crop' },
        { id: 'la-3', name: 'LA Film Festival', classification: 'Film', date: '2025-09-14', time: '18:00', venue: 'Chinese Theatre', price: '$40-150', img: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=450&fit=crop' },
        { id: 'la-4', name: 'Santa Monica Pier Festival', classification: 'Family', date: '2025-07-21', time: '11:00', venue: 'Santa Monica Pier', price: '$15-45', img: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=450&fit=crop' },
        { id: 'la-5', name: 'LA Theatre Production', classification: 'Arts & Theatre', date: '2025-08-28', time: '20:00', venue: 'Pantages Theatre', price: '$65-220', img: 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=800&h=450&fit=crop' }
      ],
      'London': [
        { id: 'ldn-1', name: 'West End Musical Gala', classification: 'Arts & Theatre', date: '2025-07-20', time: '19:30', venue: 'Royal Albert Hall', price: '£50-200', img: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=450&fit=crop' },
        { id: 'ldn-2', name: 'Premier League Final', classification: 'Sports', date: '2025-08-15', time: '15:00', venue: 'Wembley Stadium', price: '£100-500', img: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=450&fit=crop' },
        { id: 'ldn-3', name: 'Classical Orchestra', classification: 'Music', date: '2025-09-05', time: '20:00', venue: 'Royal Opera House', price: '£40-180', img: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&h=450&fit=crop' },
        { id: 'ldn-4', name: 'London Film Week', classification: 'Film', date: '2025-08-18', time: '18:30', venue: 'BFI IMAX', price: '£30-95', img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=450&fit=crop' },
        { id: 'ldn-5', name: 'Hyde Park Family Day', classification: 'Family', date: '2025-07-27', time: '12:00', venue: 'Hyde Park', price: '£20-55', img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=450&fit=crop' },
        { id: 'ldn-6', name: 'Jazz Night London', classification: 'Music', date: '2025-09-22', time: '21:00', venue: 'Ronnie Scotts', price: '£35-110', img: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&h=450&fit=crop' }
      ],
      'Paris': [
        { id: 'par-1', name: 'Paris Jazz Festival', classification: 'Music', date: '2025-07-25', time: '21:00', venue: 'Accor Arena', price: '€55-180', img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop' },
        { id: 'par-2', name: 'French Film Festival', classification: 'Film', date: '2025-08-10', time: '19:00', venue: 'Grand Rex Cinema', price: '€25-85', img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=450&fit=crop' },
        { id: 'par-3', name: 'PSG Football Match', classification: 'Sports', date: '2025-09-12', time: '20:45', venue: 'Parc des Princes', price: '€75-350', img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=450&fit=crop' },
        { id: 'par-4', name: 'Opera at Palais Garnier', classification: 'Arts & Theatre', date: '2025-08-05', time: '20:00', venue: 'Palais Garnier', price: '€60-250', img: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=450&fit=crop' },
        { id: 'par-5', name: 'Jardin du Luxembourg Fair', classification: 'Family', date: '2025-07-16', time: '10:00', venue: 'Jardin du Luxembourg', price: '€15-40', img: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=450&fit=crop' },
        { id: 'par-6', name: 'Louvre Night Concert', classification: 'Music', date: '2025-09-19', time: '19:00', venue: 'Louvre Museum', price: '€45-160', img: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=450&fit=crop' }
      ],
      'Zurich': [
        { id: 'zh-1', name: 'Zurich Music Festival', classification: 'Music', date: '2025-07-30', time: '19:00', venue: 'Hallenstadion', price: 'CHF 60-200', img: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=450&fit=crop' },
        { id: 'zh-2', name: 'Swiss Theatre Gala', classification: 'Arts & Theatre', date: '2025-08-20', time: '20:00', venue: 'Opernhaus Zürich', price: 'CHF 50-180', img: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=450&fit=crop' },
        { id: 'zh-3', name: 'FC Zurich Match', classification: 'Sports', date: '2025-09-15', time: '18:30', venue: 'Letzigrund Stadium', price: 'CHF 40-120', img: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&h=450&fit=crop' },
        { id: 'zh-4', name: 'Zurich Film Week', classification: 'Film', date: '2025-08-12', time: '18:00', venue: 'Arena Cinemas', price: 'CHF 25-75', img: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=450&fit=crop' },
        { id: 'zh-5', name: 'Lake Zurich Festival', classification: 'Family', date: '2025-07-24', time: '11:00', venue: 'Zürichsee', price: 'CHF 20-50', img: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=450&fit=crop' },
        { id: 'zh-6', name: 'Jazz Night Zurich', classification: 'Music', date: '2025-09-08', time: '21:00', venue: 'Moods Jazz Club', price: 'CHF 35-90', img: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&h=450&fit=crop' }
      ],
      'Geneva': [
        { id: 'gva-1', name: 'Geneva Classical Concert', classification: 'Music', date: '2025-07-19', time: '19:30', venue: 'Victoria Hall', price: 'CHF 55-190', img: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&h=450&fit=crop' },
        { id: 'gva-2', name: 'Geneva Servette Hockey', classification: 'Sports', date: '2025-08-16', time: '19:45', venue: 'Patinoire des Vernets', price: 'CHF 35-110', img: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&h=450&fit=crop' },
        { id: 'gva-3', name: 'Grand Theatre Production', classification: 'Arts & Theatre', date: '2025-09-03', time: '20:00', venue: 'Grand Théâtre', price: 'CHF 45-170', img: 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=800&h=450&fit=crop' },
        { id: 'gva-4', name: 'International Film Festival', classification: 'Film', date: '2025-08-25', time: '18:30', venue: 'Cinéma Pathé', price: 'CHF 28-80', img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=450&fit=crop' },
        { id: 'gva-5', name: 'Lake Geneva Family Fair', classification: 'Family', date: '2025-07-29', time: '10:30', venue: 'Jardin Anglais', price: 'CHF 18-45', img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=450&fit=crop' }
      ],
      'Dubai': [
        { id: 'dxb-1', name: 'Dubai Music Festival', classification: 'Music', date: '2025-08-05', time: '20:00', venue: 'Coca-Cola Arena', price: 'AED 200-800', img: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=450&fit=crop' },
        { id: 'dxb-2', name: 'Dubai Film Festival', classification: 'Film', date: '2025-09-01', time: '19:00', venue: 'Dubai Opera', price: 'AED 150-600', img: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=450&fit=crop' },
        { id: 'dxb-3', name: 'Family Festival Dubai', classification: 'Family', date: '2025-09-20', time: '16:00', venue: 'Global Village', price: 'AED 80-300', img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=450&fit=crop' },
        { id: 'dxb-4', name: 'Dubai Tennis Championship', classification: 'Sports', date: '2025-08-19', time: '18:00', venue: 'Dubai Tennis Stadium', price: 'AED 250-950', img: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=450&fit=crop' },
        { id: 'dxb-5', name: 'Arabian Nights Theatre', classification: 'Arts & Theatre', date: '2025-07-23', time: '20:30', venue: 'Madinat Theatre', price: 'AED 180-650', img: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=450&fit=crop' },
        { id: 'dxb-6', name: 'Desert Jazz Night', classification: 'Music', date: '2025-09-17', time: '19:30', venue: 'Dubai Desert Conservation', price: 'AED 220-750', img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop' }
      ],
      'Monaco': [
        { id: 'mon-1', name: 'Monaco Grand Prix', classification: 'Sports', date: '2025-07-13', time: '14:00', venue: 'Circuit de Monaco', price: '€500-3000', img: 'https://images.unsplash.com/photo-1583900985737-6d0495555783?w=800&h=450&fit=crop' },
        { id: 'mon-2', name: 'Monte Carlo Opera', classification: 'Arts & Theatre', date: '2025-08-09', time: '20:00', venue: 'Opéra de Monte-Carlo', price: '€120-450', img: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=450&fit=crop' },
        { id: 'mon-3', name: 'Monaco Jazz Festival', classification: 'Music', date: '2025-09-06', time: '21:00', venue: 'Sporting Monte-Carlo', price: '€85-320', img: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&h=450&fit=crop' },
        { id: 'mon-4', name: 'Monaco Film Gala', classification: 'Film', date: '2025-08-27', time: '19:00', venue: 'Grimaldi Forum', price: '€60-220', img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=450&fit=crop' },
        { id: 'mon-5', name: 'Monaco Yacht Show Concert', classification: 'Music', date: '2025-07-26', time: '20:30', venue: 'Port Hercules', price: '€95-380', img: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=450&fit=crop' }
      ]
    };

    // Get events for selected city
    let cityEvents = eventsByCity[selectedCity] || eventsByCity['Zurich'];

    // Filter by category
    if (selectedCategory !== 'all') {
      const category = categories.find(c => c.id === selectedCategory);
      cityEvents = cityEvents.filter(e => e.classification === category?.classification);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      cityEvents = cityEvents.filter(e => e.name.toLowerCase().includes(query));
    }

    return cityEvents.map(e => ({
      id: e.id,
      name: e.name,
      source: 'ticketmaster',
      url: '#',
      images: [{ url: e.img }],
      dates: { start: { localDate: e.date, localTime: e.time } },
      classifications: [{ segment: { name: e.classification } }],
      venues: [{ name: e.venue, city: { name: selectedCity } }],
      priceRanges: [{ min: parseInt(e.price.match(/\d+/)[0]), max: parseInt(e.price.match(/\d+/g)[1] || e.price.match(/\d+/)[0]), currency: e.price.match(/[A-Z£€₹]/)[0] || 'CHF' }]
    }));
  };

  const getEventImage = (event) => {
    if (event.source === 'ticketmaster') {
      return event.images?.[0]?.url || event.images?.[1]?.url || 'https://via.placeholder.com/800x450?text=Event';
    }
    if (event.source === 'eventbrite') {
      return event.logo?.url || event.image || 'https://via.placeholder.com/800x450?text=Event';
    }
    return event.images?.[0]?.url || 'https://via.placeholder.com/800x450?text=Event';
  };

  const formatDate = (event) => {
    if (event.source === 'ticketmaster') {
      const date = event.dates?.start;
      if (!date || !date.localDate) return 'Date TBA';
      const d = new Date(date.localDate);
      const formatted = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      return date.localTime ? `${formatted} at ${date.localTime}` : formatted;
    }
    if (event.source === 'eventbrite') {
      if (!event.start?.local) return 'Date TBA';
      const d = new Date(event.start.local);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
      if (event.isFree) return 'Free';
      return event.priceRange?.display || 'Price TBA';
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

  const getCategoryForEventbrite = () => {
    // Map our categories to Eventbrite category IDs
    const categoryMap = {
      'music': '103', // Music
      'sports': '108', // Sports & Fitness
      'arts': '105', // Performing & Visual Arts
      'family': '115', // Family & Education
      'film': '104' // Film & Media
    };
    return categoryMap[selectedCategory] || '';
  };

  return (
    <div className="w-full flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">Events & Sports</h2>
        <button
          onClick={() => setFiltersVisible(!filtersVisible)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all backdrop-blur-xl border ${
            filtersVisible
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-gray-100/60 text-gray-700 border-gray-300/50 hover:bg-gray-200/60'
          }`}
          style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
        >
          <SlidersHorizontal size={14} />
          <span>Filters</span>
        </button>
      </div>

      {filtersVisible && (
        <div className="bg-gray-100/60 rounded-lg border border-gray-300/50 p-5 mb-6 backdrop-blur-xl transition-all duration-300" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
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
      )}

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-sm text-gray-600">Loading events...</div>
        </div>
      )}

      {!loading && (
        <>
          {events.length > 0 && (
            <div className="grid grid-cols-3 gap-5 mb-12">
              {events.map((event) => (
              <div
                key={event.id}
                className="bg-white/35 hover:bg-white/40 rounded-xl flex flex-col hover:shadow-lg transition-all cursor-pointer border border-gray-300/50"
                style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
              >
                <div className="relative h-48 rounded-t-xl overflow-hidden">
                  <img src={getEventImage(event)} alt={event.name} className="w-full h-full object-cover" />
                  <FavouriteButton
                    item={{
                      id: event.id,
                      type: 'event',
                      name: event.name,
                      date: event.dates?.start?.localDate,
                      location: getVenueInfo(event),
                      image: getEventImage(event),
                      category: event.classifications?.[0]?.segment?.name || event.category?.name,
                      source: event.source,
                      price: formatPrice(event),
                      url: event.url
                    }}
                    variant="floating"
                    size={18}
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
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
                  <a
                    href={event.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto w-full bg-gray-800 hover:bg-gray-900 text-white text-xs font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Event
                    <ChevronRight size={14} />
                  </a>
                </div>
              </div>
              ))}
            </div>
          )}

          {/* Eventbrite Widget Section */}
          <div className={events.length > 0 ? 'mt-6' : ''}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-light text-gray-900">{events.length > 0 ? 'More Events on Eventbrite' : 'Events on Eventbrite'}</h3>
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="4" fill="#F05537"/>
                  <path d="M8 6h8v2H8V6zm0 4h8v2H8v-2zm0 4h5v2H8v-2z" fill="white"/>
                </svg>
                <span className="text-sm font-medium text-gray-700">Powered by Eventbrite</span>
              </div>
            </div>
            <div className="bg-white/35 rounded-xl p-6 border border-gray-300/50" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
              <iframe
                src={`https://www.eventbrite.com/discovery/embed?location=${encodeURIComponent(selectedCity)}&category=${getCategoryForEventbrite()}`}
                frameBorder="0"
                width="100%"
                height="800"
                className="rounded-lg"
                title="Eventbrite Events"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EventsSportsView;
