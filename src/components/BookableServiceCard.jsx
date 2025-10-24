import React, { useState, useEffect } from 'react';
import { Calendar, Users, Plus, Minus, ShoppingCart, Check, ChevronDown, ChevronUp, Crown, Sparkles } from 'lucide-react';
import NFTBenefitBanner from './NFTBenefitBanner';
import { useAccount } from 'wagmi';
import nftBenefitsService from '../services/nftBenefitsService';

const BookableServiceCard = ({ 
  item, 
  onAddToCart, 
  serviceType = 'jet',
  showDatePicker = true,
  showPassengers = true,
  onConnectWallet,
  connectedWallet,
  userHasNFT = false,
  nftBenefitUsed = false,
  onNFTVerified,
  compact = false
}) => {
  const { address } = useAccount();
  const [showDetails, setShowDetails] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [passengers, setPassengers] = useState(item.max_passengers || item.passengers || 1);
  const [isAdded, setIsAdded] = useState(false);
  const [nftInfo, setNftInfo] = useState({ hasNFT: false, nfts: [] });
  const [isFreeWithNFT, setIsFreeWithNFT] = useState(false);
  const [discountedPrice, setDiscountedPrice] = useState(null);

  // Check NFT benefits on mount
  useEffect(() => {
    const checkNFTBenefits = async () => {
      if (address) {
        try {
          const nftData = await nftBenefitsService.checkUserNFTs(address);
          setNftInfo(nftData);
          
          // Calculate if service is free or discounted
          const price = item.price || item.price_eur || item.hourly_rate_eur || item.daily_rate_eur || 0;
          
          if (nftData.hasNFT) {
            // Check if service is eligible for free benefit (≤$1,500)
            if (price <= 1500 && nftData.nfts.some(nft => !nft.benefit_used)) {
              setIsFreeWithNFT(true);
              setDiscountedPrice(0);
            } else {
              // Apply 10% discount
              setIsFreeWithNFT(false);
              setDiscountedPrice(price * 0.9);
            }
          }
        } catch (error) {
          console.error('Error checking NFT benefits:', error);
        }
      }
    };
    
    checkNFTBenefits();
  }, [address, item]);
  
  // Get display name
  const getDisplayName = () => {
    if (serviceType === 'tokenization') return item.title || item.name;
    if (serviceType === 'empty_legs' || serviceType === 'emptylegs') {
      const from = item.from_location || item.departure_city || item.from || 'Unknown';
      const to = item.to_location || item.arrival_city || item.to || 'Unknown';
      return `${from} → ${to}`;
    }
    if (serviceType === 'jets') {
      // Use the formatted title from AIChat.jsx that shows route A → B
      if (item.title && item.title.includes('→')) {
        return item.title;
      }
      // Fallback to jet model/name
      return item.model || item.name || item.aircraft_type || 'Private Jet';
    }
    if (serviceType === 'cars') return `${item.brand} ${item.model}`;
    return item.name || item.title;
  };

  // Format price like UnifiedBookingFlow.tsx
  const formatPrice = (amount) => {
    if (!amount) return 'Price on request';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get price display with NFT discount
  const getPriceDisplay = () => {
    // If NFT holder and free service
    if (nftInfo.hasNFT && isFreeWithNFT) {
      return 'FREE with NFT 🎁';
    }
    
    // If NFT holder and 10% discount
    if (nftInfo.hasNFT && discountedPrice !== null) {
      const suffix = serviceType === 'yachts' ? '/day' : serviceType === 'tokenization' ? '' : (serviceType === 'empty_legs' || serviceType === 'emptylegs') ? '' : '/hr';
      return `${formatPrice(discountedPrice)}${suffix}`;
    }
    
    // Regular price
    if (serviceType === 'tokenization') {
      return formatPrice(item.price || item.price_eur);
    }
    if (serviceType === 'yachts') {
      return `${formatPrice(item.daily_rate_eur)}/day`;
    }
    if (serviceType === 'jets') {
      // Show route price if available (calculated total), otherwise hourly rate
      if (item.estimatedCost && item.flightDistance) {
        return formatPrice(item.estimatedCost);
      }
      return `${formatPrice(item.hourly_rate_eur || item.price)}/hr`;
    }
    if (serviceType === 'empty_legs' || serviceType === 'emptylegs') {
      // Convert EUR to USD (approx 1.1 rate) or use pre-calculated USD
      const priceUsd = item.price_usd || Math.round((item.price_eur || item.price || 0) * 1.1);
      return `$${priceUsd.toLocaleString()}`;
    }
    return `${formatPrice(item.hourly_rate_eur || item.price)}/hr`;
  };

  // Get image with service-type specific fallbacks
  const getImage = () => {
    if (item.primaryImage) return item.primaryImage;
    if (item.images && item.images[0]) return item.images[0];
    if (item.image_url) return item.image_url;
    if (item.photo_url) return item.photo_url;
    
    // Service-specific fallback images
    const fallbackImages = {
      'emptylegs': 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800&q=80', // Private jet on tarmac
      'jets': 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800&q=80', // Gulfstream interior
      'helicopters': 'https://images.unsplash.com/photo-1589519160732-57fc498494f8?w=800&q=80', // Helicopter
      'yachts': 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&q=80', // Luxury yacht
      'cars': 'https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=800&q=80', // Luxury car
      'tokenization': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80' // Business/tech
    };
    
    return fallbackImages[serviceType] || fallbackImages['jets'];
  };

  // Handle add to cart
  const handleAddToCart = () => {
    const cartItem = {
      ...item,
      selectedDate: selectedDate || undefined,
      passengers: showPassengers ? passengers : undefined,
      serviceType,
      cartId: Date.now()
    };
    
    onAddToCart(cartItem);
    setIsAdded(true);
    
    setTimeout(() => setIsAdded(false), 2000);
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden hover:shadow-xl transition-all duration-300 ${
      nftInfo.hasNFT && isFreeWithNFT
        ? 'border-2 border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:shadow-[0_0_30px_rgba(74,222,128,0.5)] animate-pulse-slow'
        : nftInfo.hasNFT && discountedPrice !== null
        ? 'border-2 border-green-400'
        : 'border-black/10'
    }`}>
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
        <img 
          src={getImage()} 
          alt={getDisplayName()}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=400';
          }}
        />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {item.featured && (
            <div className="bg-black text-white text-xs px-3 py-1 rounded-full">
              Featured
            </div>
          )}
          {nftInfo.hasNFT && isFreeWithNFT && (
            <div className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg animate-pulse flex items-center gap-1">
              <Crown size={12} />
              FREE with NFT
            </div>
          )}
          {nftInfo.hasNFT && !isFreeWithNFT && discountedPrice !== null && (
            <div className="bg-green-500/90 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md flex items-center gap-1">
              <Sparkles size={12} />
              10% NFT Discount
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* NFT Benefit Banner */}
        <NFTBenefitBanner
          item={item}
          onConnect={onConnectWallet}
          connectedWallet={connectedWallet}
          hasNFT={userHasNFT}
          benefitUsed={nftBenefitUsed}
          onNFTVerified={onNFTVerified}
        />

        {/* Title */}
        <h3 className="text-lg font-semibold text-black mb-2 line-clamp-2">
          {getDisplayName()}
        </h3>

        {/* Quick Info */}
        <div className="flex items-center gap-4 text-sm text-black/60 mb-3">
          {serviceType === 'jets' && (
            <>
              <span>{item.type || item.model || item.aircraft_type || 'Private Jet'}</span>
              {(item.max_passengers || item.pax_capacity) && <span>• {item.max_passengers || item.pax_capacity} pax</span>}
            </>
          )}
          {serviceType === 'helicopters' && (
            <span>{item.max_passengers} passengers</span>
          )}
          {serviceType === 'yachts' && (
            <>
              {item.length_ft && <span>{item.length_ft}ft</span>}
              {item.max_passengers && <span>• {item.max_passengers} guests</span>}
            </>
          )}
          {(serviceType === 'empty_legs' || serviceType === 'emptylegs') && (
            <>
              {item.max_passengers && <span>{item.max_passengers} pax</span>}
              {item.departure_date && (
                <span>• {new Date(item.departure_date).toLocaleDateString()}</span>
              )}
            </>
          )}
          {serviceType === 'tokenization' && (
            <span>{item.duration_hours}h delivery</span>
          )}
        </div>

        {/* Price */}
        <div className="mb-4">
          {nftInfo.hasNFT && isFreeWithNFT ? (
            <div className="text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
              {getPriceDisplay()}
            </div>
          ) : nftInfo.hasNFT && discountedPrice !== null ? (
            <div>
              <div className="text-2xl font-bold text-green-600">
                {getPriceDisplay()}
              </div>
              <div className="text-xs text-gray-500 line-through">
                Original: €{(item.price || item.price_eur || item.hourly_rate_eur || item.daily_rate_eur)?.toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-2xl font-bold text-black">
              {getPriceDisplay()}
            </div>
          )}
        </div>

        {/* Date Picker or Calendar Quick-Add (if applicable) */}
        {showDatePicker && serviceType !== 'tokenization' && (
          <div className="mb-3">
            {(serviceType === 'empty_legs' || serviceType === 'emptylegs') && item.departure_date ? (
              <div>
                <label className="flex items-center gap-2 text-sm text-black/60 mb-2">
                  <Calendar size={14} />
                  Departure: {new Date(item.departure_date).toLocaleDateString()}
                </label>
                <button
                  onClick={() => {
                    const date = item.departure_date;
                    const route = getDisplayName();
                    if (window.confirm(`Add "${route}" on ${new Date(date).toLocaleDateString()} to your Google Calendar?`)) {
                      // Trigger parent to show calendar modal
                      window.dispatchEvent(new CustomEvent('addToCalendar', { 
                        detail: { 
                          title: `Empty Leg Flight: ${route}`,
                          date: date,
                          description: `Empty Leg from ${item.from_location || 'TBA'} to ${item.to_location || 'TBA'}. Price: ${getPriceDisplay()}`,
                          serviceType: 'emptylegs',
                          item: item
                        } 
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-green-500 text-green-600 rounded-lg text-sm hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar size={14} />
                  Add to Google Calendar
                </button>
              </div>
            ) : (
              <div>
                <label className="flex items-center gap-2 text-sm text-black/60 mb-2">
                  <Calendar size={14} />
                  Travel Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getMinDate()}
                  className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm focus:outline-none focus:border-black/40"
                />
              </div>
            )}
          </div>
        )}

        {/* Passenger Adjuster (if applicable) */}
        {showPassengers && serviceType !== 'tokenization' && serviceType !== 'cars' && (
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm text-black/60 mb-2">
              <Users size={14} />
              Passengers
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPassengers(Math.max(1, passengers - 1))}
                className="p-2 rounded-lg border border-black/20 hover:bg-black/5 transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="text-lg font-semibold w-12 text-center">{passengers}</span>
              <button
                onClick={() => setPassengers(Math.min(item.max_passengers || 20, passengers + 1))}
                className="p-2 rounded-lg border border-black/20 hover:bg-black/5 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Details Toggle */}
        {(item.description || item.includes || item.deliverables) && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-sm text-black/60 hover:text-black transition-colors mb-3"
          >
            <span>Details</span>
            {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}

        {/* Expanded Details */}
        {showDetails && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm space-y-2">
            {item.description && (
              <p className="text-black/70">{item.description}</p>
            )}
            {item.includes && item.includes.length > 0 && (
              <div>
                <p className="font-semibold text-black mb-1">Includes:</p>
                <ul className="text-black/70 text-xs space-y-1">
                  {item.includes.slice(0, 5).map((inc, idx) => (
                    <li key={idx}>• {inc}</li>
                  ))}
                </ul>
              </div>
            )}
            {item.deliverables && item.deliverables.length > 0 && (
              <div>
                <p className="font-semibold text-black mb-1">Deliverables:</p>
                <ul className="text-black/70 text-xs space-y-1">
                  {item.deliverables.slice(0, 3).map((del, idx) => (
                    <li key={idx}>• {del}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={isAdded}
          className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
            isAdded
              ? 'bg-green-500 text-white'
              : 'bg-black text-white hover:bg-black/80'
          }`}
        >
          {isAdded ? (
            <>
              <Check size={18} />
              Added to Cart
            </>
          ) : (
            <>
              <ShoppingCart size={18} />
              Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BookableServiceCard;
