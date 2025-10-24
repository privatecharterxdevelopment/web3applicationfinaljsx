import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { Search, ShoppingBag, Settings, User, Shield, Plane, Clock, MapPin, Users, Leaf, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { airportsStaticService } from '../../services/airportsStaticService';
import { web3Service } from '../../lib/web3';

const AdventureDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();

  const [adventure, setAdventure] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [hasNFT, setHasNFT] = useState(false);
  const [nftDiscount, setNftDiscount] = useState(0);
  const [isCheckingNFT, setIsCheckingNFT] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [co2Data, setCo2Data] = useState({ emissions: 0, offset: 0, flightEmissions: 0, packageOverhead: 0 });
  const [participants, setParticipants] = useState(2);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    fetchAdventure();
  }, [id]);

  // Hybrid CO2 calculation for adventure packages
  const calculateAdventureCO2 = async (origin, destination, duration, inclusions = {}) => {
    let totalEmissions = 0;
    let flightEmissions = 0;
    let packageOverhead = 0;

    // 1. Calculate flight emissions (60-70% of total)
    if (origin && destination) {
      try {
        // Get coordinates for origin and destination
        const originAirport = await airportsStaticService.getAirportByCode(origin) ||
                             (await airportsStaticService.searchAirports(origin, 1))[0];
        const destAirport = await airportsStaticService.getAirportByCode(destination) ||
                           (await airportsStaticService.searchAirports(destination, 1))[0];

        if (originAirport && destAirport) {
          // Haversine distance calculation
          const R = 6371; // Earth's radius in km
          const dLat = (destAirport.lat - originAirport.lat) * Math.PI / 180;
          const dLon = (destAirport.lng - originAirport.lng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(originAirport.lat * Math.PI / 180) * Math.cos(destAirport.lat * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distanceKm = R * c;

          // Average CO2 rate for private jets (0.00107 tons/km for midsize)
          const co2RatePerKm = 0.00107;
          flightEmissions = distanceKm * co2RatePerKm * 2; // Round trip
        }
      } catch (error) {
        console.error('Error calculating flight distance:', error);
        // Fallback: estimate based on typical long-haul flight
        flightEmissions = 5.0; // 5 tons average for long-haul round trip
      }
    }

    // 2. Calculate package overhead (30-40% of total) based on duration and inclusions
    const durationDays = parseDuration(duration);
    let overheadMultiplier = 0.3; // Base 30% overhead

    // Adjust based on inclusions
    let inclusionCount = 0;
    if (inclusions.includes_helicopter) { inclusionCount++; overheadMultiplier += 0.15; }
    if (inclusions.includes_yacht) { inclusionCount++; overheadMultiplier += 0.20; }
    if (inclusions.includes_safari) { inclusionCount++; overheadMultiplier += 0.10; }
    if (inclusions.includes_ground_transport) { inclusionCount++; overheadMultiplier += 0.05; }
    if (inclusions.includes_accommodation) { inclusionCount++; overheadMultiplier += 0.08; }

    // Package overhead: duration × daily emissions × overhead multiplier
    packageOverhead = durationDays * 0.3 * overheadMultiplier; // 0.3 tons base per day

    totalEmissions = flightEmissions + packageOverhead;

    // Calculate offset cost (€80 per ton)
    const offsetCost = totalEmissions * 80;

    return {
      emissions: parseFloat(totalEmissions.toFixed(2)),
      offset: parseFloat(offsetCost.toFixed(2)),
      flightEmissions: parseFloat(flightEmissions.toFixed(2)),
      packageOverhead: parseFloat(packageOverhead.toFixed(2))
    };
  };

  // Parse duration string to days (e.g., "7 days", "3-5 days", "1 week")
  const parseDuration = (durationStr) => {
    if (!durationStr) return 7; // Default 7 days

    const str = durationStr.toLowerCase();

    // Extract number
    const match = str.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1]);
      if (str.includes('week')) return num * 7;
      if (str.includes('day')) return num;
      if (str.includes('month')) return num * 30;
      return num;
    }

    return 7; // Default
  };

  const fetchAdventure = async () => {
    setIsLoading(true);
    console.log('🔍 Fetching adventure with ID:', id);
    try {
      const { data, error } = await supabase
        .from('fixed_offers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      if (!data) {
        console.error('❌ No data returned for ID:', id);
        throw new Error('Adventure not found');
      }

      console.log('✅ Adventure data loaded:', data);
      setAdventure(data);
      setParticipants(data.min_passengers || 2);

      // Calculate CO2 for this adventure
      const co2Result = await calculateAdventureCO2(
        data.origin,
        data.destination,
        data.duration,
        {
          includes_helicopter: data.includes_helicopter,
          includes_yacht: data.includes_yacht,
          includes_safari: data.includes_safari,
          includes_ground_transport: data.includes_ground_transport,
          includes_accommodation: data.includes_accommodation
        }
      );
      console.log('✅ CO2 calculated:', co2Result);
      setCo2Data(co2Result);

    } catch (error) {
      console.error('💥 Error fetching adventure:', error);
      alert(`Error loading adventure: ${error.message}. Redirecting to marketplace...`);
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
        alert(`✅ NFT Membership Detected!\n\nYou have ${eligibility.discountPercent}% discount on all packages.\n\nPackages under $1,500 are FREE for NFT holders!`);
      } else {
        alert('❌ No NFT Membership found in your wallet.\n\nGet your membership at:\nhttps://opensea.io/collection/privatecharterx-membership');
      }
    } catch (error) {
      console.error('Error checking NFT:', error);
    } finally {
      setIsCheckingNFT(false);
    }
  };

  const requestAdventure = async () => {
    if (!isConnected) {
      open();
      return;
    }
    try {
      const isFree = hasNFT && adventure.price <= 1500;
      const discountedPrice = hasNFT ? adventure.price * (1 - nftDiscount / 100) : adventure.price;

      // TODO: Save to dashboard history
      // TODO: Send request to backend

      if (isFree) {
        alert(`🎉 Adventure Requested - FREE!\n\n${adventure.title}\nOriginal Price: €${adventure.price}\nYour Price: FREE (NFT Membership)`);
      } else if (hasNFT) {
        alert(`✈️ Adventure Requested with ${nftDiscount}% Discount!\n\n${adventure.title}\nOriginal Price: €${adventure.price}\nYour Price: €${discountedPrice.toFixed(2)}`);
      } else {
        alert(`✈️ Adventure Requested!\n\n${adventure.title}\nPrice: €${adventure.price}`);
      }
    } catch (error) {
      console.error('Request failed:', error);
    }
  };

  const finalPrice = hasNFT && adventure ? adventure.price * (1 - nftDiscount / 100) : (adventure?.price || 0);

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
                  placeholder="Search adventures"
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
            <button className="py-4 text-sm text-black border-b-2 border-black">◇ Adventure Details</button>
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
              <p className="mt-4 text-sm text-gray-600">Loading adventure details...</p>
            </div>
          </div>
        )}

        {/* Adventure Header Card and Content */}
        {!isLoading && adventure && (
        <>
        <div className="bg-white rounded-lg border border-gray-300 mb-6">
          <div className="flex h-80">
            {/* Left side - Adventure Image */}
            <div className="w-2/5 relative bg-gray-100">
              {adventure.image_url ? (
                <img
                  src={adventure.image_url}
                  alt={adventure.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <Plane className="text-gray-400 mx-auto mb-2" size={48} />
                    <div className="text-gray-600">{adventure.title}</div>
                  </div>
                </div>
              )}

              <div className="absolute top-3 left-3 flex space-x-1.5">
                <div className="bg-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  <span>Available</span>
                </div>
                <div className="bg-white px-2 py-1 rounded text-xs font-medium">◈ {adventure.package_type || 'Adventure'}</div>
              </div>
            </div>

            {/* Right side - Adventure info */}
            <div className="flex-1 p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">PCX</span>
                <div className="flex space-x-2">
                  <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">⎘</button>
                  <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">◉</button>
                </div>
              </div>

              <h1 className="text-2xl font-semibold mb-4">
                {adventure.title}
              </h1>
              <p className="text-sm text-gray-600 mb-4">
                {adventure.destination || adventure.origin}
              </p>

              {/* Tab Navigation */}
              <div className="flex space-x-6 border-b border-gray-300 mb-5">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-3 text-xs relative ${activeTab === 'overview' ? 'text-black' : 'text-gray-600'}`}
                >
                  Overview
                  {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('inclusions')}
                  className={`pb-3 text-xs relative ${activeTab === 'inclusions' ? 'text-black' : 'text-gray-600'}`}
                >
                  What's Included
                  {activeTab === 'inclusions' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
              </div>

              {/* Key metrics */}
              <div className="flex justify-between mt-auto mb-5">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Duration</span>
                  <span className="text-sm font-semibold text-black">{adventure.duration || 'Flexible'}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Participants</span>
                  <span className="text-sm font-semibold text-black">{adventure.min_passengers}-{adventure.max_passengers} pax</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Price</span>
                  <span className="text-sm font-semibold text-black">
                    {adventure.price_on_request ? 'On Request' : `€${adventure.price?.toLocaleString() || 'N/A'}`}
                  </span>
                </div>
              </div>

              {/* Links */}
              <div className="flex space-x-4 text-xs">
                <button className="text-gray-600 hover:text-black">Package details ↗</button>
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
              {activeTab === 'overview' && (
                <div>
                  <h3 className="text-base font-semibold mb-4">Adventure Overview</h3>

                  {/* Journey Roadmap */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold mb-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Journey Roadmap
                    </h4>
                    <div className="space-y-3">
                      {(() => {
                        const roadmapSteps = [];
                        let stepNumber = 1;

                        // Step 1: Starting Point (always show)
                        roadmapSteps.push(
                          <div key="origin" className="flex items-start">
                            <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">{stepNumber++}</div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-black">Departure</div>
                              <div className="text-xs text-gray-600">
                                {adventure.origin_city || adventure.origin || 'Your preferred location'}
                              </div>
                            </div>
                          </div>
                        );

                        // Step 2: Main Destination (always show)
                        roadmapSteps.push(
                          <div key="destination" className="flex items-start">
                            <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">{stepNumber++}</div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-black">Destination</div>
                              <div className="text-xs text-gray-600">
                                {adventure.destination_city || adventure.destination || 'Exclusive location'}
                              </div>
                            </div>
                          </div>
                        );

                        // Step: Special Experiences (only if any inclusions exist)
                        const specialInclusions = [];
                        if (adventure.includes_helicopter) specialInclusions.push('Helicopter Transfer');
                        if (adventure.includes_yacht) specialInclusions.push('Private Yacht Charter');
                        if (adventure.includes_safari) specialInclusions.push('Safari Adventure');

                        if (specialInclusions.length > 0) {
                          roadmapSteps.push(
                            <div key="special" className="flex items-start">
                              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">{stepNumber++}</div>
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-black">Special Experiences</div>
                                <div className="text-xs text-gray-600">
                                  {specialInclusions.join(' • ')}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // Step: Accommodation (only if included)
                        if (adventure.includes_accommodation) {
                          roadmapSteps.push(
                            <div key="accommodation" className="flex items-start">
                              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">{stepNumber++}</div>
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-black">Accommodation</div>
                                <div className="text-xs text-gray-600">
                                  5-Star luxury accommodation included
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // Step: Duration (always show if available)
                        if (adventure.duration) {
                          roadmapSteps.push(
                            <div key="duration" className="flex items-start">
                              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">{stepNumber++}</div>
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-black">Duration</div>
                                <div className="text-xs text-gray-600">
                                  {adventure.duration}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // Step: Return (always show)
                        roadmapSteps.push(
                          <div key="return" className="flex items-start">
                            <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">{stepNumber++}</div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-black">Return</div>
                              <div className="text-xs text-gray-600">
                                Return flight to {adventure.origin_city || adventure.origin || 'departure point'}
                              </div>
                            </div>
                          </div>
                        );

                        return roadmapSteps;
                      })()}
                    </div>
                  </div>

                  {/* Description with Read More */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold mb-3">Description</h4>
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {showFullDescription ? (
                        <p className="whitespace-pre-line">{adventure.description || 'Full details about this exclusive adventure package will be discussed with our concierge team. Contact us to create your perfect journey.'}</p>
                      ) : (
                        <p className="whitespace-pre-line line-clamp-3">{adventure.description || 'Full details about this exclusive adventure package will be discussed with our concierge team. Contact us to create your perfect journey.'}</p>
                      )}
                      {adventure.description && adventure.description.length > 200 && (
                        <button
                          onClick={() => setShowFullDescription(!showFullDescription)}
                          className="text-black font-semibold text-xs mt-2 hover:underline"
                        >
                          {showFullDescription ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Activities */}
                  {adventure.activities && adventure.activities.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold mb-3">Activities</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {adventure.activities.map((activity, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-700">
                            <span className="text-green-500 mr-2">✓</span>
                            {activity}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CO2 Certificate Section */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Leaf className="w-5 h-5 text-green-600" />
                      <h4 className="text-sm font-bold text-green-900">CO₂ Certificate INCLUDED</h4>
                    </div>
                    <p className="text-xs text-gray-700 mb-4">
                      All adventure packages include a complimentary CO₂ offset certificate - no additional cost!
                    </p>

                    {co2Data.emissions > 0 && (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="text-xs text-gray-500 mb-1">Total CO₂ Emissions</div>
                          <div className="text-lg font-bold text-black">{co2Data.emissions} <span className="text-xs font-normal">tons</span></div>
                          <div className="text-xs text-gray-500 mt-1">
                            Flight: {co2Data.flightEmissions}t + Package: {co2Data.packageOverhead}t
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="text-xs text-gray-500 mb-1">Certificate Value</div>
                          <div className="text-lg font-bold text-green-600">€{co2Data.offset} <span className="text-xs font-normal text-gray-600">saved</span></div>
                          <div className="text-xs text-gray-500 mt-1">€80/ton standard rate</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start space-x-2 text-xs text-gray-700">
                      <span className="text-green-600 font-bold">✓</span>
                      <div>
                        <span className="font-semibold">Classic or Blockchain Certificate:</span> Choose between traditional carbon offset certificate or blockchain-verified NFT certificate at checkout.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'inclusions' && (
                <div>
                  <h3 className="text-base font-semibold mb-4">What's Included</h3>

                  <div className="space-y-3">
                    {adventure.inclusions && adventure.inclusions.length > 0 ? (
                      adventure.inclusions.map((item, index) => (
                        <div key={index} className="flex items-start text-sm">
                          <span className="text-green-500 mr-2 mt-0.5">✓</span>
                          <span className="text-gray-700">{item}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        {adventure.includes_wifi && <div className="flex items-start text-sm"><span className="text-green-500 mr-2">✓</span>High-speed WiFi</div>}
                        {adventure.includes_catering && <div className="flex items-start text-sm"><span className="text-green-500 mr-2">✓</span>Gourmet catering</div>}
                        {adventure.includes_ground_transport && <div className="flex items-start text-sm"><span className="text-green-500 mr-2">✓</span>Ground transportation</div>}
                        {adventure.includes_accommodation && <div className="flex items-start text-sm"><span className="text-green-500 mr-2">✓</span>Luxury accommodation</div>}
                        {adventure.includes_helicopter && <div className="flex items-start text-sm"><span className="text-green-500 mr-2">✓</span>Helicopter experience</div>}
                        {adventure.includes_yacht && <div className="flex items-start text-sm"><span className="text-green-500 mr-2">✓</span>Yacht charter</div>}
                        {adventure.includes_safari && <div className="flex items-start text-sm"><span className="text-green-500 mr-2">✓</span>Safari experience</div>}
                        {adventure.guide_included && <div className="flex items-start text-sm"><span className="text-green-500 mr-2">✓</span>Professional guide</div>}
                        {adventure.equipment_provided && <div className="flex items-start text-sm"><span className="text-green-500 mr-2">✓</span>Equipment provided</div>}
                        {adventure.insurance_included && <div className="flex items-start text-sm"><span className="text-green-500 mr-2">✓</span>Travel insurance</div>}
                        {!adventure.includes_wifi && !adventure.includes_catering && !adventure.includes_ground_transport &&
                         !adventure.includes_accommodation && !adventure.includes_helicopter && !adventure.includes_yacht &&
                         !adventure.includes_safari && !adventure.guide_included && !adventure.equipment_provided &&
                         !adventure.insurance_included && (
                          <div className="text-sm text-gray-600 italic">
                            All inclusions and amenities will be discussed with our concierge team to create your perfect adventure package.
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {adventure.exclusions && adventure.exclusions.length > 0 ? (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold mb-3">Not Included</h4>
                      <div className="space-y-2">
                        {adventure.exclusions.map((item, index) => (
                          <div key={index} className="flex items-start text-sm">
                            <span className="text-red-500 mr-2 mt-0.5">✗</span>
                            <span className="text-gray-600">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600">
                        Exclusions will be clearly defined during the booking process with our concierge team.
                      </p>
                    </div>
                  )}
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
                  <span className="text-xs text-gray-500">Base Price</span>
                  <span className="text-xs font-semibold text-black">
                    {adventure.price_on_request ? 'On Request' : `€${adventure.price?.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Duration</span>
                  <span className="text-xs font-semibold text-black">{adventure.duration || 'Flexible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Max Participants</span>
                  <span className="text-xs font-semibold text-black">{adventure.max_passengers} pax</span>
                </div>
              </div>

              {/* Booking Details Form */}
              <div className="mb-5 pb-4 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-black mb-4">Booking Details</h4>

                <div className="space-y-3">
                  {/* Participants */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">
                      Participants
                      <span className="text-[10px] ml-1 text-gray-400">
                        (Base: {adventure.min_passengers || 2}-{adventure.max_passengers || 4} pax)
                      </span>
                    </label>
                    <div className="flex items-center justify-between border border-gray-300 rounded px-2 py-1.5">
                      <button
                        onClick={() => setParticipants(Math.max(1, participants - 1))}
                        className="text-gray-600 hover:text-black w-6 h-6 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="text-sm font-semibold">{participants}</span>
                      <button
                        onClick={() => setParticipants(participants + 1)}
                        className="text-gray-600 hover:text-black w-6 h-6 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    {participants > (adventure.max_passengers || 4) && (
                      <p className="text-[10px] text-amber-600 mt-1 flex items-center">
                        <span className="mr-1">⚠</span>
                        Extra passengers incur additional costs
                      </p>
                    )}
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Preferred Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                      <input
                        type="date"
                        value={selectedDate || ''}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200"
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
                      {nftDiscount}% discount on all packages
                      {adventure.price <= 1500 && <span className="block mt-1 font-semibold text-black">This package is FREE!</span>}
                    </p>
                  </div>
                </div>
              )}

              {/* Price Summary */}
              {!adventure.price_on_request && (
              <div className="p-3 bg-gray-50 rounded mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Base Price ({adventure.max_passengers || 4} pax):</span>
                  <span className="font-semibold text-black">€{adventure.price?.toLocaleString()}</span>
                </div>
                {participants > (adventure.max_passengers || 4) && (
                  <>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Price per passenger:</span>
                      <span className="font-semibold text-gray-600">
                        €{Math.round(adventure.price / (adventure.max_passengers || 4)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-amber-600">Extra Passengers (+{participants - (adventure.max_passengers || 4)}):</span>
                      <span className="font-semibold text-black">
                        +€{Math.round((participants - (adventure.max_passengers || 4)) * (adventure.price / (adventure.max_passengers || 4))).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
                {hasNFT && (
                  <>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">NFT Discount ({nftDiscount}%):</span>
                      <span className="font-semibold text-green-600">
                        -€{(() => {
                          const pricePerPax = adventure.price / (adventure.max_passengers || 4);
                          const extraPax = Math.max(0, participants - (adventure.max_passengers || 4));
                          const totalBeforeDiscount = adventure.price + (extraPax * pricePerPax);
                          return Math.round(totalBeforeDiscount * nftDiscount / 100).toLocaleString();
                        })()}
                      </span>
                    </div>
                    {adventure.price <= 1500 && participants <= (adventure.max_passengers || 4) && (
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Free Package Bonus:</span>
                        <span className="font-semibold text-green-600">-€{Math.round(adventure.price * (1 - nftDiscount / 100)).toLocaleString()}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 mt-2">
                  <span className="text-black">Total:</span>
                  <span className="text-black">
                    {hasNFT && adventure.price <= 1500 && participants <= (adventure.max_passengers || 4) ? 'FREE' : `€${(() => {
                      const pricePerPax = adventure.price / (adventure.max_passengers || 4);
                      const extraPax = Math.max(0, participants - (adventure.max_passengers || 4));
                      const subtotal = adventure.price + (extraPax * pricePerPax);
                      const afterDiscount = hasNFT ? subtotal * (1 - nftDiscount / 100) : subtotal;
                      return Math.round(afterDiscount).toLocaleString();
                    })()}`}
                  </span>
                </div>
              </div>
              )}

              {/* Request Adventure Button */}
              <button
                onClick={requestAdventure}
                className="w-full bg-black text-white py-3 px-4 rounded text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                {hasNFT && adventure.price <= 1500 ? 'Get Package FREE' : 'Request Package'}
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
                  <span>Free cancellation up to 48h</span>
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

export default AdventureDetail;
