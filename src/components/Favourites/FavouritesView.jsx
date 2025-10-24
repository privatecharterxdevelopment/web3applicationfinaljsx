import React, { useState, useEffect } from 'react';
import { Heart, Calendar, MapPin, Ticket, Music, Trophy, Theater, Film, Users, Star, Trash2, Plus, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const FavouritesView = ({ user, onAddToCalendar }) => {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadFavourites();
    }
  }, [user]);

  const loadFavourites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_favourites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavourites(data || []);
    } catch (error) {
      console.error('Error loading favourites:', error);
      setFavourites([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFavourite = async (id) => {
    try {
      const { error } = await supabase
        .from('user_favourites')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setFavourites(favourites.filter(fav => fav.id !== id));
    } catch (error) {
      console.error('Error removing favourite:', error);
    }
  };

  const handleAddToCalendar = (favourite) => {
    if (onAddToCalendar) {
      onAddToCalendar(favourite);
    }
  };

  const getEventImage = (favourite) => {
    return favourite.image_url || 'https://via.placeholder.com/800x450?text=Event';
  };

  const formatDate = (favourite) => {
    if (!favourite.event_date) return 'Date TBA';
    const date = new Date(favourite.event_date);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isEventPast = (favourite) => {
    if (!favourite.event_date) return false;
    const eventDate = new Date(favourite.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today;
  };

  const filteredFavourites = favourites.filter(fav => {
    const matchesSearch = searchQuery === '' ||
      fav.event_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fav.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fav.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="w-full h-full p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">Favourites</h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search favourites by name, location, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300/50 rounded-lg bg-white/60 text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
            style={{ backdropFilter: 'blur(10px) saturate(150%)' }}
          />
        </div>
      </div>

      {/* Favourites List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : filteredFavourites.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Heart className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No favourites found' : 'No favourites yet'}
          </h3>
          <p className="text-sm text-gray-500">
            {searchQuery ? 'Try adjusting your search' : 'Start adding events to your favourites from Events & Sports'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFavourites.map((favourite) => {
            const isPast = isEventPast(favourite);
            return (
              <div
                key={favourite.id}
                className={`border rounded-xl p-4 transition-colors ${
                  isPast
                    ? 'border-gray-200/30 bg-gray-100/20 opacity-60'
                    : 'border-gray-300/50 bg-white/35 hover:bg-white/40'
                }`}
                style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    {/* Event Image */}
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 relative">
                      <img
                        src={getEventImage(favourite)}
                        alt={favourite.event_name}
                        className={`w-full h-full object-cover ${isPast ? 'grayscale' : ''}`}
                      />
                      {isPast && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">EXPIRED</span>
                        </div>
                      )}
                    </div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`font-medium line-clamp-1 ${isPast ? 'text-gray-500' : 'text-gray-900'}`}>
                          {favourite.event_name}
                        </h3>
                        {isPast && (
                          <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                            Not Valid
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-wrap mb-3">
                        {favourite.category && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            isPast ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {favourite.category}
                          </span>
                        )}
                        {favourite.source && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            isPast ? 'bg-gray-200 text-gray-500' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {favourite.source}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className={`flex items-center gap-2 text-sm ${isPast ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Calendar size={14} />
                          <span>{formatDate(favourite)}</span>
                        </div>
                        {favourite.location && (
                          <div className={`flex items-center gap-2 text-sm ${isPast ? 'text-gray-400' : 'text-gray-600'}`}>
                            <MapPin size={14} />
                            <span className="line-clamp-1">{favourite.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    {!isPast && (
                      <button
                        onClick={() => handleAddToCalendar(favourite)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-xs font-medium"
                        title="Add to Calendar"
                      >
                        <Plus size={14} />
                        Calendar
                      </button>
                    )}
                    <button
                      onClick={() => removeFavourite(favourite.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs font-medium"
                      title="Remove from Favourites"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FavouritesView;
