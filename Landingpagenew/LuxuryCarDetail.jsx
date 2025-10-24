import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { Search, ShoppingBag, Settings, User, Shield, Car, Clock, MapPin, Users, Calendar, Fuel, Gauge } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { web3Service } from '../../lib/web3';

const LuxuryCarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();

  const [car, setCar] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [hasNFT, setHasNFT] = useState(false);
  const [nftDiscount, setNftDiscount] = useState(0);
  const [isCheckingNFT, setIsCheckingNFT] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [rentalDuration, setRentalDuration] = useState('day');
  const [rentalDays, setRentalDays] = useState(1);
  const [pickupDate, setPickupDate] = useState(null);
  const [pickupTime, setPickupTime] = useState('10:00');
  const [dropoffDate, setDropoffDate] = useState(null);
  const [dropoffTime, setDropoffTime] = useState('10:00');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchCar();
  }, [id]);

  const fetchCar = async () => {
    setIsLoading(true);
    console.log('🚗 Fetching luxury car with ID:', id);
    try {
      const { data, error } = await supabase
        .from('luxury_cars')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      if (!data) {
        console.error('❌ No data returned for ID:', id);
        throw new Error('Luxury car not found');
      }

      console.log('✅ Car data loaded:', data);
      console.log('📸 Image URL:', data.image_url);
      console.log('🎨 Features:', data.features);
      setCar(data);

    } catch (error) {
      console.error('💥 Error fetching car:', error);
      alert(`Error loading car: ${error.message}. Redirecting to marketplace...`);
      setTimeout(() => navigate('/tokenized-assets'), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const checkNFTMembership = async () => {
    if (!isConnected || !address) {
      open();
      return;
    }
    setIsCheckingNFT(true);
    try {
      const eligibility = await web3Service.checkDiscountEligibility(address);
      setHasNFT(eligibility.hasDiscount);
      setNftDiscount(eligibility.discountPercent);

      if (eligibility.hasDiscount) {
        alert(`✅ NFT Membership Detected!\n\nYou have ${eligibility.discountPercent}% discount on all rentals.`);
      } else {
        alert('❌ No NFT Membership found in your wallet.\n\nGet your membership at:\nhttps://opensea.io/collection/privatecharterx-membership');
      }
    } catch (error) {
      console.error('Error checking NFT:', error);
    } finally {
      setIsCheckingNFT(false);
    }
  };

  const requestRental = async () => {
    if (!isConnected) {
      open();
      return;
    }
    try {
      // Check if weekly rental is available
      if (rentalDuration === 'week' && !car.price_per_week) {
        alert('⚠️ Weekly rental pricing is not available for this car.\n\nPlease contact our concierge team to discuss weekly rental options.');
        return;
      }

      const price = rentalDuration === 'hour' ? car.price_per_hour * rentalDays :
                    rentalDuration === 'day' ? car.price_per_day * rentalDays :
                    car.price_per_week * rentalDays;

      const discountedPrice = hasNFT ? price * (1 - nftDiscount / 100) : price;

      console.log(`Car Rental Request: ${car.brand} ${car.model}`);
      console.log(`Duration: ${rentalDays} ${rentalDuration}(s)`);
      console.log(`Price: €${price}`);
      console.log(`Final Price: €${discountedPrice}`);

      if (hasNFT) {
        alert(`🚗 Car Rental Requested with ${nftDiscount}% Discount!\n\n${car.brand} ${car.model}\nDuration: ${rentalDays} ${rentalDuration}(s)\nOriginal Price: €${price}\nYour Price: €${discountedPrice.toFixed(2)}\n\nYour request has been saved to your dashboard!`);
      } else {
        alert(`🚗 Car Rental Requested!\n\n${car.brand} ${car.model}\nDuration: ${rentalDays} ${rentalDuration}(s)\nPrice: €${price}\n\nYour request has been saved to your dashboard!`);
      }
    } catch (error) {
      console.error('Request failed:', error);
    }
  };

  const calculateTotalPrice = () => {
    if (!car) return 0;
    // If weekly rental and no price, return 0 to show "TO BE DISCUSSED"
    if (rentalDuration === 'week' && !car.price_per_week) return 0;

    const basePrice = rentalDuration === 'hour' ? car.price_per_hour * rentalDays :
                      rentalDuration === 'day' ? car.price_per_day * rentalDays :
                      car.price_per_week * rentalDays;
    return hasNFT ? basePrice * (1 - nftDiscount / 100) : basePrice;
  };

  // Get all available images (support both single image_url and images array)
  const getCarImages = () => {
    if (!car) return [];

    // If car has an 'images' array field
    if (car.images && Array.isArray(car.images) && car.images.length > 0) {
      return car.images;
    }

    // If car has only image_url
    if (car.image_url) {
      return [car.image_url];
    }

    // Fallback image
    return ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800'];
  };

  const carImages = getCarImages();

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % carImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + carImages.length) % carImages.length);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['DM_Sans']">
      {/* Header */}
      <header className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-5 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/')}>
                <img
                  src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_Logo_written-removebg-preview.png"
                  alt="PrivateCharterX"
                  className="h-8 w-auto"
                />
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search luxury cars"
                  className="w-64 pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 outline-none text-sm font-light placeholder-gray-400 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200 shadow-sm"
                />
              </div>

              <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200" title="Verified">
                <Shield size={16} />
              </button>

              <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200 relative" title="Basket">
                <ShoppingBag size={16} />
              </button>

              <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200" title="Connect Wallet">
                💰
              </button>

              <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200" title="Settings">
                <Settings size={16} />
              </button>

              <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200" title="Profile">
                <User size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex items-center space-x-6 overflow-x-auto scrollbar-hide">
            <button onClick={() => navigate('/tokenized-assets')} className="py-4 text-sm text-gray-600 hover:text-black whitespace-nowrap">
              ← Back to Marketplace
            </button>
            <button className="py-4 text-sm text-black border-b-2 border-black">◆ Luxury Car Details</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-5 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg border border-gray-300 mb-6 h-[600px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto"></div>
              <p className="mt-4 text-sm text-gray-600">Loading car details...</p>
            </div>
          </div>
        )}

        {/* Car Header Card and Content */}
        {!isLoading && car && (
        <>
        <div className="bg-white rounded-lg border border-gray-300 mb-6">
          <div className="flex h-80">
            {/* Left side - Car Image with Gallery */}
            <div className="w-2/5 relative bg-gray-100">
              {carImages.length > 0 ? (
                <>
                  <img
                    src={carImages[currentImageIndex]}
                    alt={`${car.brand} ${car.model}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Gallery Navigation Arrows - only show if multiple images */}
                  {carImages.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all"
                      >
                        ‹
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all"
                      >
                        ›
                      </button>

                      {/* Image Counter */}
                      <div className="absolute bottom-3 right-3 bg-black/50 text-white px-2 py-1 rounded text-xs">
                        {currentImageIndex + 1} / {carImages.length}
                      </div>

                      {/* Thumbnail Dots */}
                      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {carImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <Car className="text-gray-400 mx-auto mb-2" size={48} />
                    <div className="text-gray-600">{car.brand} {car.model}</div>
                  </div>
                </div>
              )}

              <div className="absolute top-3 left-3 flex space-x-1.5">
                <div className="bg-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  <span>Available</span>
                </div>
                <div className="bg-white px-2 py-1 rounded text-xs font-medium">◆ {car.type}</div>
              </div>
            </div>

            {/* Right side - Car info */}
            <div className="flex-1 p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">PCX</span>
                <div className="flex space-x-2">
                  <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">⎘</button>
                  <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">◉</button>
                </div>
              </div>

              <h1 className="text-2xl font-semibold mb-4">
                {car.brand} {car.model}
              </h1>
              <p className="text-sm text-gray-600 mb-4">
                {car.location}
              </p>

              {/* Tab Navigation */}
              <div className="flex space-x-6 border-b border-gray-300 mb-5">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-3 text-xs relative ${activeTab === 'details' ? 'text-black' : 'text-gray-600'}`}
                >
                  Car Details
                  {activeTab === 'details' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('features')}
                  className={`pb-3 text-xs relative ${activeTab === 'features' ? 'text-black' : 'text-gray-600'}`}
                >
                  Features
                  {activeTab === 'features' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
              </div>

              {/* Key metrics */}
              <div className="flex justify-between mt-auto mb-5">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Per Hour</span>
                  <span className="text-sm font-semibold text-black">€{car.price_per_hour?.toLocaleString()}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Per Day</span>
                  <span className="text-sm font-semibold text-black">€{car.price_per_day?.toLocaleString()}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Per Week</span>
                  <span className="text-sm font-semibold text-black">
                    {car.price_per_week ? `€${car.price_per_week?.toLocaleString()}` : 'TO BE DISCUSSED'}
                  </span>
                </div>
              </div>

              {/* Links */}
              <div className="flex space-x-4 text-xs">
                <button className="text-gray-600 hover:text-black">Car details ↗</button>
                <button className="text-gray-600 hover:text-black">Terms & Conditions ⚖</button>
              </div>
            </div>
          </div>
        </div>

        {/* Content and Booking Section */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Content */}
          <div className="col-span-2">
            <div className="bg-white rounded-lg border border-gray-300 p-6">
              {activeTab === 'details' && (
                <div>
                  <h3 className="text-base font-semibold mb-4">Car Details</h3>

                  {/* Description */}
                  <div className="mb-6">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {car.description || 'Experience luxury and performance with this exceptional vehicle. Perfect for special occasions or business travel.'}
                    </p>
                  </div>

                  {/* Specifications Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Brand</div>
                      <div className="text-sm font-semibold text-black">{car.brand}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Model</div>
                      <div className="text-sm font-semibold text-black">{car.model}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Type</div>
                      <div className="text-sm font-semibold text-black">{car.type}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Location</div>
                      <div className="text-sm font-semibold text-black">{car.location}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'features' && (
                <div>
                  <h3 className="text-base font-semibold mb-4">Features & Amenities</h3>

                  <div className="space-y-3">
                    {car.features && Array.isArray(car.features) && car.features.length > 0 ? (
                      car.features.map((feature, index) => (
                        <div key={index} className="flex items-start text-sm">
                          <span className="text-green-500 mr-2 mt-0.5">✓</span>
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="text-sm text-gray-600 mb-4">
                          Standard luxury features include:
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-start text-sm">
                            <span className="text-green-500 mr-2 mt-0.5">✓</span>
                            <span className="text-gray-700">Premium leather interior</span>
                          </div>
                          <div className="flex items-start text-sm">
                            <span className="text-green-500 mr-2 mt-0.5">✓</span>
                            <span className="text-gray-700">Climate control</span>
                          </div>
                          <div className="flex items-start text-sm">
                            <span className="text-green-500 mr-2 mt-0.5">✓</span>
                            <span className="text-gray-700">Premium sound system</span>
                          </div>
                          <div className="flex items-start text-sm">
                            <span className="text-green-500 mr-2 mt-0.5">✓</span>
                            <span className="text-gray-700">Navigation system</span>
                          </div>
                          <div className="flex items-start text-sm">
                            <span className="text-green-500 mr-2 mt-0.5">✓</span>
                            <span className="text-gray-700">Bluetooth connectivity</span>
                          </div>
                          <div className="flex items-start text-sm">
                            <span className="text-green-500 mr-2 mt-0.5">✓</span>
                            <span className="text-gray-700">Full insurance included</span>
                          </div>
                          <div className="flex items-start text-sm">
                            <span className="text-green-500 mr-2 mt-0.5">✓</span>
                            <span className="text-gray-700">24/7 roadside assistance</span>
                          </div>
                          <div className="flex items-start text-sm">
                            <span className="text-green-500 mr-2 mt-0.5">✓</span>
                            <span className="text-gray-700">Concierge delivery service</span>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-600">
                            Contact our concierge for detailed specifications and additional customization options.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Booking Widget */}
          <div className="bg-white rounded-lg border border-gray-300 p-5 h-fit sticky top-6">
            <div>
              {/* Summary */}
              <div className="space-y-3 mb-5">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Base Rate</span>
                  <span className="text-xs font-semibold text-black">
                    €{car.price_per_day?.toLocaleString()}/day
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Location</span>
                  <span className="text-xs font-semibold text-black">{car.location}</span>
                </div>
              </div>

              {/* Booking Details Form */}
              <div className="mb-5 pb-4 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-black mb-4">Rental Details</h4>

                <div className="space-y-3">
                  {/* Rental Duration Type */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Rental Type</label>
                    <select
                      value={rentalDuration}
                      onChange={(e) => setRentalDuration(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                    >
                      <option value="hour">Hourly</option>
                      <option value="day">Daily</option>
                      <option value="week">Weekly</option>
                    </select>
                  </div>

                  {/* Number of Days/Hours/Weeks */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">
                      Duration ({rentalDuration}s)
                    </label>
                    <div className="flex items-center justify-between border border-gray-300 rounded px-2 py-1.5">
                      <button
                        onClick={() => setRentalDays(Math.max(1, rentalDays - 1))}
                        className="text-gray-600 hover:text-black w-6 h-6 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="text-sm font-semibold">{rentalDays}</span>
                      <button
                        onClick={() => setRentalDays(rentalDays + 1)}
                        className="text-gray-600 hover:text-black w-6 h-6 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Pickup Date */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Pickup Date & Time</label>
                    <div className="space-y-2">
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        <input
                          type="date"
                          value={pickupDate || ''}
                          onChange={(e) => setPickupDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <input
                        type="time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* NFT Membership Status */}
              {hasNFT && (
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-black font-semibold text-sm">NFT Member</span>
                    </div>
                    <p className="text-xs text-gray-700">
                      {nftDiscount}% discount on all rentals
                    </p>
                  </div>
                </div>
              )}

              {/* Price Summary */}
              <div className="p-3 bg-gray-50 rounded mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Rate ({rentalDuration}):</span>
                  <span className="font-semibold text-black">
                    {rentalDuration === 'week' && !car.price_per_week ?
                      'TO BE DISCUSSED' :
                      `€${(rentalDuration === 'hour' ? car.price_per_hour :
                         rentalDuration === 'day' ? car.price_per_day :
                         car.price_per_week)?.toLocaleString()}`
                    }
                  </span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Duration:</span>
                  <span className="font-semibold text-black">{rentalDays} {rentalDuration}(s)</span>
                </div>
                {hasNFT && calculateTotalPrice() > 0 && (
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">NFT Discount ({nftDiscount}%):</span>
                    <span className="font-semibold text-green-600">
                      -€{(calculateTotalPrice() / (1 - nftDiscount / 100) - calculateTotalPrice()).toFixed(0)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 mt-2">
                  <span className="text-black">Total:</span>
                  <span className="text-black">
                    {rentalDuration === 'week' && !car.price_per_week ?
                      'TO BE DISCUSSED' :
                      `€${Math.round(calculateTotalPrice()).toLocaleString()}`
                    }
                  </span>
                </div>
              </div>

              {/* Request Rental Button */}
              <button
                onClick={requestRental}
                className="w-full bg-black text-white py-3 px-4 rounded text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Request Rental
              </button>

              {/* NFT Membership Link */}
              <div className="mt-4 text-center">
                <button
                  onClick={checkNFTMembership}
                  disabled={isCheckingNFT}
                  className="text-xs text-gray-600 hover:text-black underline"
                >
                  {isCheckingNFT ? 'Checking NFT...' : 'Check NFT Membership for Discounts'}
                </button>
              </div>

              {isConnected && (
                <div className="mt-3 text-xs text-gray-500 text-center">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
              )}

              {/* Trust badges */}
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                <div className="flex items-start space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Instant confirmation</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Free cancellation up to 24h</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>24/7 concierge support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>

      {/* Divider Line */}
      <div className="border-t border-gray-200"></div>

      {/* Footer */}
      <footer className="bg-gray-50 px-4 sm:px-8 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 mb-8 sm:mb-12">
            <div className="col-span-2 sm:col-span-1 lg:col-span-1">
              <button onClick={() => navigate('/')} className="mb-4">
                <img
                  src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_Logo_written-removebg-preview.png"
                  alt="PrivateCharterX"
                  className="h-12 w-auto hover:opacity-80 transition-opacity"
                />
              </button>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Blockchain-powered private aviation platform revolutionizing luxury travel.
              </p>
            </div>

            <div>
              <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-3 sm:mb-4">Aviation Services</h4>
              <div className="space-y-2 sm:space-y-3">
                <button onClick={() => navigate('/services')} className="block text-xs sm:text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">Private Jet Charter</button>
                <button onClick={() => navigate('/services')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Group Charter</button>
                <button onClick={() => navigate('/aviation')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Helicopter Charter</button>
                <button onClick={() => navigate('/aviation')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">eVTOL Flights</button>
                <button onClick={() => navigate('/services')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Adventure Packages</button>
                <button onClick={() => navigate('/services')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Empty Legs</button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Web3 & Digital</h4>
              <div className="space-y-3">
                <button onClick={() => navigate('/tokenized')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Web3</button>
                <button onClick={() => navigate('/tokenized')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">PVCX Token</button>
                <button onClick={() => navigate('/tokenized')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">NFT Aviation</button>
                <button onClick={() => navigate('/tokenized')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Asset Licensing</button>
                <button onClick={() => navigate('/tokenized')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">JetCard Packages</button>
                <button onClick={() => navigate('/tokenized')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">CO2 Certificates</button>
                <button onClick={() => navigate('/tokenized-assets')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Tokenized Assets</button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Partners & Press</h4>
              <div className="space-y-3">
                <button onClick={() => navigate('/services')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Partner With Us</button>
                <button onClick={() => navigate('/services')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Blog Posts</button>
                <button onClick={() => navigate('/services')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Press Center</button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Quick Links</h4>
              <div className="space-y-3">
                <button onClick={() => navigate('/')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Home</button>
                <button onClick={() => navigate('/services')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">How It Works</button>
                <button onClick={() => navigate('/services')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Helpdesk</button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LuxuryCarDetail;
