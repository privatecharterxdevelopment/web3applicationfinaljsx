import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const FavouritesContext = createContext();

export const useFavourites = () => {
  const context = useContext(FavouritesContext);
  if (!context) {
    throw new Error('useFavourites must be used within a FavouritesProvider');
  }
  return context;
};

export const FavouritesProvider = ({ children, user }) => {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFavourites();
    } else {
      setFavourites([]);
      setLoading(false);
    }
  }, [user]);

  const loadFavourites = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_favourites')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavourites(data || []);
    } catch (error) {
      console.error('Error loading favourites:', error);
      setFavourites([]);
    } finally {
      setLoading(false);
    }
  };

  const isFavourite = (itemId, itemType) => {
    return favourites.some(
      fav => fav.event_id === itemId
    );
  };

  const addFavourite = async (item) => {
    if (!user) {
      alert('Please sign in to add favourites');
      return false;
    }

    try {
      const favouriteData = {
        user_id: user.id,
        event_id: item.id,
        event_name: item.name || item.title,
        event_date: item.date || item.startDate || null,
        location: item.location || item.venue || item.city || null,
        category: item.category || item.classification || null,
        source: item.source || null
      };

      const { data, error } = await supabase
        .from('user_favourites')
        .insert([favouriteData])
        .select()
        .single();

      if (error) throw error;

      setFavourites([...favourites, data]);
      return true;
    } catch (error) {
      console.error('Error adding favourite:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      alert(`Failed to add to favourites. Error: ${error.message || 'Unknown error'}`);
      return false;
    }
  };

  const removeFavourite = async (itemId, itemType) => {
    if (!user) return false;

    try {
      const favourite = favourites.find(
        fav => fav.event_id === itemId
      );

      if (!favourite) return false;

      const { error } = await supabase
        .from('user_favourites')
        .delete()
        .eq('id', favourite.id);

      if (error) throw error;

      setFavourites(favourites.filter(fav => fav.id !== favourite.id));
      return true;
    } catch (error) {
      console.error('Error removing favourite:', error);
      alert('Failed to remove from favourites. Please try again.');
      return false;
    }
  };

  const toggleFavourite = async (item) => {
    const isCurrentlyFavourite = isFavourite(item.id, item.type);

    if (isCurrentlyFavourite) {
      return await removeFavourite(item.id, item.type);
    } else {
      return await addFavourite(item);
    }
  };

  const value = {
    favourites,
    loading,
    isFavourite,
    addFavourite,
    removeFavourite,
    toggleFavourite,
    refreshFavourites: loadFavourites
  };

  return (
    <FavouritesContext.Provider value={value}>
      {children}
    </FavouritesContext.Provider>
  );
};
