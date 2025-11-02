import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useFavourites } from '../../contexts/FavouritesContext';

const FavouriteButton = ({ item, className = '', size = 20, variant = 'default' }) => {
  const { isFavourite, toggleFavourite } = useFavourites();
  const [isAnimating, setIsAnimating] = useState(false);

  const isFav = isFavourite(item.id, item.type);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAnimating(true);
    await toggleFavourite(item);

    setTimeout(() => setIsAnimating(false), 300);
  };

  // Variant styles
  const variants = {
    default: {
      base: 'p-2 rounded-lg transition-all backdrop-blur-sm',
      bg: isFav ? 'bg-red-500/90 hover:bg-red-600' : 'bg-white/90 hover:bg-white',
      icon: isFav ? 'text-white' : 'text-gray-600 hover:text-red-500'
    },
    floating: {
      base: 'absolute top-3 right-3 p-2 rounded-full shadow-lg transition-all backdrop-blur-md z-10',
      bg: isFav ? 'bg-red-500/95 hover:bg-red-600' : 'bg-white/95 hover:bg-white',
      icon: isFav ? 'text-white' : 'text-gray-600 hover:text-red-500'
    },
    minimal: {
      base: 'p-1.5 transition-all',
      bg: '',
      icon: isFav ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
    }
  };

  const selectedVariant = variants[variant] || variants.default;

  return (
    <button
      onClick={handleClick}
      className={`${selectedVariant.base} ${selectedVariant.bg} ${className} ${
        isAnimating ? 'scale-110' : 'scale-100'
      }`}
      title={isFav ? 'Remove from favourites' : 'Add to favourites'}
      aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
    >
      <Heart
        size={size}
        className={`${selectedVariant.icon} transition-all ${
          isAnimating ? 'animate-ping' : ''
        }`}
        fill={isFav ? 'currentColor' : 'none'}
        strokeWidth={isFav ? 0 : 2}
      />
    </button>
  );
};

export default FavouriteButton;
