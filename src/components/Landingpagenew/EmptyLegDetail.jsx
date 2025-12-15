import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { Search, ShoppingBag, Settings, User, Shield, Plane, Clock, MapPin, Users, ExternalLink, Leaf } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import RoutePreviewMap from '../RoutePreviewMap';
import { airportsStaticService } from '../../services/airportsStaticService';
import { web3Service } from '../../lib/web3';
import { useAuth } from '../../context/AuthContext';
import { useNFT } from '../../context/NFTContext';
import { createRequest } from '../../services/requests';
import SuccessNotification from '../SuccessNotification';
import NFTBenefitsModal from '../NFTBenefitsModal';
import CryptoPaymentModal from '../Payment/CryptoPaymentModal';
import { convertToUSD, formatUSD, initializeExchangeRates } from '../../services/currencyService';
import { generateRequestConfirmationPDF, downloadPDF, savePDFToStorage } from '../../services/pdfGeneratorService';

const EmptyLegDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { user } = useAuth();
  const { hasNFT, nftDiscount, isCheckingNFT, checkNFTMembership, showNFTModal, closeNFTModal, nfts, usedBenefits, markFreeFlightUsed, incrementDiscountUsage } = useNFT();
  const [emptyLeg, setEmptyLeg] = useState(null);
  const [priceUSD, setPriceUSD] = useState(0);
  const [activeTab, setActiveTab] = useState('details');
  const [isLoading, setIsLoading] = useState(true);
  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(0);
  const [hasPet, setHasPet] = useState(false);
  const [co2Data, setCo2Data] = useState({ emissions: 0, offset: 0, distance: 0 });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);

  useEffect(() => {
    fetchEmptyLeg();
  }, [id]);

  // Calculate CO2 when coordinates and aircraft type are available
  useEffect(() => {
    if (originCoords && destCoords && emptyLeg?.category) {
      const co2Result = calculateCO2(originCoords, destCoords, emptyLeg.category);
      setCo2Data(co2Result);
    }
  }, [originCoords, destCoords, emptyLeg]);

  // Calculate CO2 emissions based on aircraft type and distance
  const calculateCO2 = (originCoords, destCoords, aircraftType) => {
    if (!originCoords || !destCoords) return { emissions: 0, offset: 0, distance: 0 };

    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (destCoords.lat - originCoords.lat) * Math.PI / 180;
    const dLon = (destCoords.lng - originCoords.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(originCoords.lat * Math.PI / 180) * Math.cos(destCoords.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c;

    // CO2 emissions per km by aircraft category (tons per km)
    const co2RatesByCategory = {
      'Very Light Jet': 0.00053,
      'Light Jet': 0.00080,
      'Midsize Jet': 0.00107,
      'Super Midsize': 0.00133,
      'Heavy Jet': 0.00160,
      'Ultra Long Range': 0.00187,
      'VIP Airliner': 0.00240,
      'Turboprop': 0.00035,
      'Helicopter': 0.00040
    };

    // Default to midsize if category not found
    const co2Rate = co2RatesByCategory[aircraftType] || 0.00107;
    const totalEmissions = distanceKm * co2Rate;
    const offsetCost = totalEmissions * 80; // €80 per ton CO2

    return {
      emissions: parseFloat(totalEmissions.toFixed(2)),
      offset: parseFloat(offsetCost.toFixed(2)),
      distance: Math.round(distanceKm)
    };
  };

  const fetchEmptyLeg = async () => {
    setIsLoading(true);
    try {
      // Initialize exchange rates first
      await initializeExchangeRates();

      const { data, error } = await supabase
        .from('EmptyLegs_')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setEmptyLeg(data);

      // Use price_usd directly from database (no conversion needed)
      const usdPrice = data.price_usd || data.price_in_usd || data.price || 0;
      setPriceUSD(usdPrice);

      console.log('Empty Leg Price Debug:', {
        price_usd: data.price_usd,
        price_in_usd: data.price_in_usd,
        price: data.price,
        final_usdPrice: usdPrice
      });
      console.log('Empty Leg Data - FULL:', data);
      console.log('Empty Leg Data - Aircraft fields:', {
        aircraft_type: data.aircraft_type,
        aircraft_type_original: data.aircraft_type_original,
        aircraft_model: data.aircraft_model,
        aircraft: data.aircraft,
        category: data.category,
        aircraft_category: data.aircraft_category,
        all_keys: Object.keys(data)
      });

      // Get airport coordinates from Supabase airports table (supports ALL airports)
      if (data.from_iata) {
        try {
          const { data: originAirport, error: originError } = await supabase
            .from('airports')
            .select('code, lat, lon, city, country')
            .eq('code', data.from_iata)
            .single();

          if (!originError && originAirport && originAirport.lat && originAirport.lon) {
            console.log('Found origin airport in database:', originAirport);
            setOriginCoords({
              lat: parseFloat(originAirport.lat),
              lng: parseFloat(originAirport.lon),
              name: originAirport.code,
              city: originAirport.city || data.from_city || data.from,
              country: originAirport.country || data.from_country || ''
            });
          } else {
            // Fallback to static service if not in database
            console.log('Airport not in database, trying static service:', data.from_iata);
            const fallbackAirport = await airportsStaticService.getAirportByCode(data.from_iata);
            if (fallbackAirport) {
              console.log('Found in static service:', fallbackAirport);
              setOriginCoords({
                lat: fallbackAirport.lat,
                lng: fallbackAirport.lng,
                name: fallbackAirport.code,
                city: fallbackAirport.city,
                country: fallbackAirport.country
              });
            } else {
              console.warn('Origin airport not found:', data.from_iata);
            }
          }
        } catch (err) {
          console.error('Error fetching origin airport:', err);
        }
      }

      if (data.to_iata) {
        try {
          const { data: destAirport, error: destError } = await supabase
            .from('airports')
            .select('code, lat, lon, city, country')
            .eq('code', data.to_iata)
            .single();

          if (!destError && destAirport && destAirport.lat && destAirport.lon) {
            console.log('Found destination airport in database:', destAirport);
            setDestCoords({
              lat: parseFloat(destAirport.lat),
              lng: parseFloat(destAirport.lon),
              name: destAirport.code,
              city: destAirport.city || data.to_city || data.to,
              country: destAirport.country || data.to_country || ''
            });
          } else {
            // Fallback to static service if not in database
            console.log('Airport not in database, trying static service:', data.to_iata);
            const fallbackAirport = await airportsStaticService.getAirportByCode(data.to_iata);
            if (fallbackAirport) {
              console.log('Found in static service:', fallbackAirport);
              setDestCoords({
                lat: fallbackAirport.lat,
                lng: fallbackAirport.lng,
                name: fallbackAirport.code,
                city: fallbackAirport.city,
                country: fallbackAirport.country
              });
            } else {
              console.warn('Destination airport not found:', data.to_iata);
            }
          }
        } catch (err) {
          console.error('Error fetching destination airport:', err);
        }
      }
    } catch (error) {
      console.error('Error fetching empty leg:', error);
      navigate('/dashboard?tab=empty-legs');
    } finally {
      setIsLoading(false);
    }
  };

  // NFT check now handled by useNFT context - modal will show automatically

  const requestFlight = async () => {
    if (!user) {
      alert('Please sign in to request a flight');
      navigate('/login');
      return;
    }

    try {
      // NFT free flight eligibility: price < $1500 USD
      const isFree = hasNFT && !usedBenefits.freeFlightUsed && priceUSD < 1500;
      const discountedPrice = hasNFT ? priceUSD * (1 - nftDiscount / 100) : priceUSD;
      const finalPrice = isFree ? 0 : discountedPrice;

      const requestType = isFree ? 'nft_free_flight' : hasNFT ? 'nft_discount_empty_leg' : 'empty_leg';

      // Save to database - DIRECT INSERT with client_email for notifications
      const { data: insertedData, error: dbError } = await supabase
        .from('user_requests')
        .insert([{
          user_id: user.id,
          type: requestType,
          status: 'pending',
          client_email: user.email,
          data: {
            empty_leg_id: emptyLeg.id,
            flight_route: `${emptyLeg.from_iata} → ${emptyLeg.to_iata}`,
            route: `${emptyLeg.from_city || emptyLeg.from_iata} → ${emptyLeg.to_city || emptyLeg.to_iata}`,
            from_city: emptyLeg.from_city,
            to_city: emptyLeg.to_city,
            from_iata: emptyLeg.from_iata,
            to_iata: emptyLeg.to_iata,
            departure: emptyLeg.from_city || emptyLeg.from_iata,
            destination: emptyLeg.to_city || emptyLeg.to_iata,
            departure_airport: emptyLeg.from_iata,
            arrival_airport: emptyLeg.to_iata,
            departure_date: emptyLeg.departure_date,
            departure_time: emptyLeg.departure_time,
            arrival_date: emptyLeg.arrival_date,
            arrival_time: emptyLeg.arrival_time,
            aircraft_type: emptyLeg.category,
            capacity: emptyLeg.capacity,
            original_price: priceUSD,
            discounted_price: finalPrice,
            final_price: finalPrice,
            currency: 'USD',
            passengers: passengers,
            passenger_count: passengers,
            luggage: luggage,
            has_pet: hasPet,
            wallet_address: isConnected && address ? address : null,
            has_nft: hasNFT,
            nft_discount: nftDiscount,
            is_free: isFree,
            co2_emissions: co2Data.emissions,
            co2_offset_cost: co2Data.offset,
            distance_km: co2Data.distance,
            user_email: user.email
          }
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      // Generate PDF and send email with attachment
      try {
        const pdfRequest = {
          id: insertedData.id,
          type: 'empty_leg',
          service_type: 'empty_leg',
          created_at: new Date().toISOString(),
          client_email: user?.email,
          data: {
            from: emptyLeg.from_city || emptyLeg.from_iata,
            to: emptyLeg.to_city || emptyLeg.to_iata,
            date: emptyLeg.departure_date,
            passengers: passengers,
            total: finalPrice,
            currency: 'USD'
          }
        };

        const { blob, filename, base64 } = await generateRequestConfirmationPDF(pdfRequest);

        // Save PDF to storage
        try {
          await savePDFToStorage(blob, filename, 'request', insertedData.id);
        } catch (storageErr) {
          console.warn('Could not save PDF:', storageErr);
        }

        // Download PDF
        downloadPDF(blob, filename);

        // Send email with PDF attachment
        await supabase.functions.invoke('send-request-email', {
          body: {
            to: user?.email,
            requestData: {
              id: insertedData.id,
              type: 'empty_leg',
              created_at: new Date().toISOString(),
              status: 'pending',
              user: {
                name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Valued Client',
                email: user?.email
              },
              details: {
                from: emptyLeg.from_city || emptyLeg.from_iata,
                to: emptyLeg.to_city || emptyLeg.to_iata,
                date: emptyLeg.departure_date,
                passengers: passengers,
                service_type: 'Empty Leg Flight',
                price: finalPrice,
                currency: 'USD'
              }
            },
            pdfBase64: base64,
            pdfFilename: filename
          }
        });
        console.log('Email with PDF sent for empty leg request');
      } catch (pdfEmailErr) {
        console.error('PDF/Email error (non-blocking):', pdfEmailErr);
      }

      // Track benefit usage
      if (isFree) {
        markFreeFlightUsed(); // Mark free flight as used
      } else if (hasNFT) {
        incrementDiscountUsage(); // Track discount usage
      }

      // Show success notification
      setShowSuccess(true);
    } catch (error) {
      console.error('Request failed:', error);
      alert('Flight request failed. Please try again.');
    }
  };

  const departureDate = emptyLeg ? new Date(emptyLeg.departure_date) : null;
  const arrivalDate = emptyLeg?.arrival_date ? new Date(emptyLeg.arrival_date) : null;
  const calculatedFinalPrice = hasNFT && emptyLeg ? priceUSD * 0.85 : priceUSD;

  return (
    <div className="min-h-screen bg-gray-50 font-['DM_Sans']">
      {/* Header - Mobile Optimized */}
      <header className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-5 py-3 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/')}>
                <img
                  src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_Logo_written-removebg-preview.png"
                  alt="PrivateCharterX"
                  className="h-6 md:h-8 w-auto"
                />
              </button>
            </div>

            {/* Desktop Header Items */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search empty legs"
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

            {/* Mobile Header - Back Button */}
            <button
              onClick={() => navigate('/dashboard?tab=empty-legs')}
              className="md:hidden flex items-center text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200"
            >
              ← Back
            </button>
          </div>
        </div>
      </header>

      {/* Navigation - Hidden on mobile */}
      <nav className="hidden md:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex space-x-8">
            <button
              onClick={() => navigate('/dashboard?tab=empty-legs')}
              className="py-4 text-sm text-gray-600 border-b-2 border-transparent hover:text-black"
            >
              ← Back to Empty Legs
            </button>
            <button className="py-4 text-sm text-black border-b-2 border-black">◇ Empty Leg Details</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-5 py-4 md:py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg border border-gray-300 mb-6 h-[300px] md:h-[600px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 md:h-16 w-12 md:w-16 border-b-2 border-black mx-auto"></div>
              <p className="mt-4 text-sm text-gray-600">Loading flight details...</p>
            </div>
          </div>
        )}

        {/* Flight Header Card - Mobile Optimized */}
        {!isLoading && emptyLeg && (
        <>
        <div className="bg-white rounded-xl md:rounded-lg border border-gray-300 mb-4 md:mb-6 overflow-hidden">
          {/* Mobile Layout - Stacked */}
          <div className="md:hidden">
            {/* Image Section - Full Width on Mobile */}
            <div className="relative h-48 bg-gray-100">
              {emptyLeg.image_url ? (
                <img
                  src={emptyLeg.image_url}
                  alt={`${emptyLeg.aircraft_type} - ${emptyLeg.from_iata} to ${emptyLeg.to_iata}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center px-4">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-black">{emptyLeg.from_iata || emptyLeg.from?.substring(0, 3).toUpperCase()}</div>
                        <div className="text-[10px] text-gray-600 mt-1">{emptyLeg.from_city || emptyLeg.from}</div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-0.5 bg-gray-400"></div>
                        <Plane className="text-gray-600 mx-1" size={18} />
                        <div className="w-8 h-0.5 bg-gray-400"></div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-black">{emptyLeg.to_iata || emptyLeg.to?.substring(0, 3).toUpperCase()}</div>
                        <div className="text-[10px] text-gray-600 mt-1">{emptyLeg.to_city || emptyLeg.to}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="absolute top-3 left-3 flex space-x-1.5">
                <div className="bg-white px-2 py-1 rounded text-[10px] font-medium flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  <span>Available</span>
                </div>
              </div>
            </div>

            {/* Mobile Content */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-black text-white px-2 py-0.5 rounded text-[10px] font-semibold uppercase">PCX</span>
                <span className="text-xs text-gray-500">✈︎ Empty Leg</span>
              </div>

              <h1 className="text-xl font-semibold mb-1">
                {emptyLeg.from_iata || emptyLeg.from?.substring(0, 3).toUpperCase()} → {emptyLeg.to_iata || emptyLeg.to?.substring(0, 3).toUpperCase()}
              </h1>
              <p className="text-xs text-gray-600 mb-1">
                {emptyLeg.from_city || emptyLeg.from} to {emptyLeg.to_city || emptyLeg.to}
              </p>
              {/* Aircraft Type - prominently displayed */}
              {emptyLeg.aircraft_type && (
                <p className="text-xs font-medium text-gray-800 mb-3">
                  ✈ {emptyLeg.aircraft_type}
                </p>
              )}

              {/* Mobile Key Metrics - Grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <span className="text-[10px] text-gray-500 block">Date</span>
                  <span className="text-xs font-semibold text-black">{departureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <span className="text-[10px] text-gray-500 block">Capacity</span>
                  <span className="text-xs font-semibold text-black">{emptyLeg.capacity || emptyLeg.pax || 'N/A'} pax</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <span className="text-[10px] text-gray-500 block">Price</span>
                  <span className="text-xs font-semibold text-black">${Math.round(priceUSD).toLocaleString() || 'N/A'}</span>
                </div>
              </div>

              {/* Mobile Tab Navigation - Scrollable */}
              <div className="flex space-x-4 overflow-x-auto pb-2 border-b border-gray-200 mb-3 -mx-4 px-4">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-2 text-xs whitespace-nowrap relative ${activeTab === 'details' ? 'text-black font-medium' : 'text-gray-500'}`}
                >
                  Details
                  {activeTab === 'details' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('aircraft')}
                  className={`pb-2 text-xs whitespace-nowrap relative ${activeTab === 'aircraft' ? 'text-black font-medium' : 'text-gray-500'}`}
                >
                  Aircraft
                  {activeTab === 'aircraft' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('operator')}
                  className={`pb-2 text-xs whitespace-nowrap relative ${activeTab === 'operator' ? 'text-black font-medium' : 'text-gray-500'}`}
                >
                  Operator
                  {activeTab === 'operator' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('map')}
                  className={`pb-2 text-xs whitespace-nowrap relative ${activeTab === 'map' ? 'text-black font-medium' : 'text-gray-500'}`}
                >
                  Map
                  {activeTab === 'map' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Layout - Side by Side */}
          <div className="hidden md:flex h-80">
            {/* Left side - Aircraft Image */}
            <div className="w-2/5 relative bg-gray-100">
              {emptyLeg.image_url ? (
                <img
                  src={emptyLeg.image_url}
                  alt={`${emptyLeg.aircraft_type} - ${emptyLeg.from_iata} to ${emptyLeg.to_iata}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-4 mb-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-black">{emptyLeg.from_iata || emptyLeg.from?.substring(0, 3).toUpperCase()}</div>
                        <div className="text-xs text-gray-600 mt-1">{emptyLeg.from_city || emptyLeg.from}</div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-12 h-0.5 bg-gray-400"></div>
                        <Plane className="text-gray-600 mx-2" size={24} />
                        <div className="w-12 h-0.5 bg-gray-400"></div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-black">{emptyLeg.to_iata || emptyLeg.to?.substring(0, 3).toUpperCase()}</div>
                        <div className="text-xs text-gray-600 mt-1">{emptyLeg.to_city || emptyLeg.to}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {emptyLeg.from_continent} → {emptyLeg.to_continent}
                    </div>
                  </div>
                </div>
              )}

              <div className="absolute top-3 left-3 flex space-x-1.5">
                <div className="bg-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  <span>Available</span>
                </div>
                <div className="bg-white px-2 py-1 rounded text-xs font-medium">✈︎ Empty Leg</div>
              </div>
            </div>

            {/* Right side - Flight info */}
            <div className="flex-1 p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">PCX</span>
                <div className="flex space-x-2">
                  <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">⎘</button>
                  <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">◉</button>
                </div>
              </div>

              <h1 className="text-2xl font-semibold mb-2">
                {emptyLeg.from_iata || emptyLeg.from?.substring(0, 3).toUpperCase()} → {emptyLeg.to_iata || emptyLeg.to?.substring(0, 3).toUpperCase()}
              </h1>
              <p className="text-sm text-gray-600 mb-1">
                {emptyLeg.from_city || emptyLeg.from} to {emptyLeg.to_city || emptyLeg.to}
              </p>
              {/* Aircraft Type - prominently displayed */}
              {emptyLeg.aircraft_type && (
                <p className="text-sm font-medium text-gray-800 mb-4">
                  ✈ {emptyLeg.aircraft_type}
                </p>
              )}

              {/* Tab Navigation */}
              <div className="flex space-x-6 border-b border-gray-300 mb-5">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-3 text-xs relative ${activeTab === 'details' ? 'text-black' : 'text-gray-600'}`}
                >
                  Flight Details
                  {activeTab === 'details' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('aircraft')}
                  className={`pb-3 text-xs relative ${activeTab === 'aircraft' ? 'text-black' : 'text-gray-600'}`}
                >
                  Aircraft
                  {activeTab === 'aircraft' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('operator')}
                  className={`pb-3 text-xs relative ${activeTab === 'operator' ? 'text-black' : 'text-gray-600'}`}
                >
                  Operator
                  {activeTab === 'operator' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('map')}
                  className={`pb-3 text-xs relative ${activeTab === 'map' ? 'text-black' : 'text-gray-600'}`}
                >
                  Map
                  {activeTab === 'map' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
              </div>

              {/* Key metrics */}
              <div className="flex justify-between mt-auto mb-5">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Departure</span>
                  <span className="text-sm font-semibold text-black">{departureDate.toLocaleDateString()}</span>
                  <span className="text-xs text-gray-500">{emptyLeg.departure_time || 'TBD'}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Capacity</span>
                  <span className="text-sm font-semibold text-black">{emptyLeg.capacity || emptyLeg.pax || 'N/A'} passengers</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Price</span>
                  <span className="text-sm font-semibold text-black">${Math.round(priceUSD).toLocaleString() || 'N/A'}</span>
                </div>
              </div>

              {/* Links */}
              <div className="flex space-x-4 pt-4 border-t border-gray-100 text-xs">
                <button className="text-gray-600 hover:text-black">Flight tracking ↗</button>
                <button className="text-gray-600 hover:text-black">Terms & Conditions ⚖</button>
              </div>
            </div>
          </div>
        </div>

        {/* Content and Booking Section - Mobile Optimized */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column - Content */}
          <div className="md:col-span-2 order-2 md:order-1">
            <div className="bg-white rounded-xl md:rounded-lg border border-gray-300 p-4 md:p-6">
              {activeTab === 'details' && (
                <div>
                  <h3 className="text-base font-semibold mb-4">Flight Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">From</div>
                      <div className="text-sm font-semibold text-black">{emptyLeg.from_city || emptyLeg.from} ({emptyLeg.from_iata})</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">To</div>
                      <div className="text-sm font-semibold text-black">{emptyLeg.to_city || emptyLeg.to} ({emptyLeg.to_iata})</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Departure Date</div>
                      <div className="text-sm font-semibold text-black">{departureDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Departure Time</div>
                      <div className="text-sm font-semibold text-black">{emptyLeg.departure_time || 'Flexible'}</div>
                    </div>
                    {arrivalDate && (
                      <>
                        <div className="border-b border-gray-100 pb-2">
                          <div className="text-xs text-gray-500 font-medium">Arrival Date</div>
                          <div className="text-sm font-semibold text-black">{arrivalDate.toLocaleDateString()}</div>
                        </div>
                        <div className="border-b border-gray-100 pb-2">
                          <div className="text-xs text-gray-500 font-medium">Arrival Time</div>
                          <div className="text-sm font-semibold text-black">{emptyLeg.arrival_time || 'TBD'}</div>
                        </div>
                      </>
                    )}
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Flight Duration</div>
                      <div className="text-sm font-semibold text-black">{emptyLeg.duration || emptyLeg.flight_time || 'TBD'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Distance</div>
                      <div className="text-sm font-semibold text-black">{co2Data.distance > 0 ? `${co2Data.distance} km` : (emptyLeg.distance || 'N/A')}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Aircraft</div>
                      <div className="text-sm font-semibold text-black">{emptyLeg.aircraft_type || 'N/A'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Passengers</div>
                      <div className="text-sm font-semibold text-black">{emptyLeg.capacity || emptyLeg.pax || 'N/A'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Luggage Capacity</div>
                      <div className="text-sm font-semibold text-black">{emptyLeg.baggage || 'Standard'}</div>
                    </div>
                  </div>

                  {/* CO2 Certificate Section - INCLUDED */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Leaf className="w-5 h-5 text-green-600" />
                      <h4 className="text-sm font-bold text-green-900">CO₂ Certificate INCLUDED</h4>
                    </div>
                    <p className="text-xs text-gray-700 mb-4">
                      All empty leg flights include a complimentary CO₂ offset certificate - no additional cost!
                    </p>

                    {co2Data.emissions > 0 && (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="text-xs text-gray-500 mb-1">Estimated CO₂ Emissions</div>
                          <div className="text-lg font-bold text-black">{co2Data.emissions} <span className="text-xs font-normal">tons</span></div>
                          <div className="text-xs text-gray-500 mt-1">Based on {emptyLeg.category}</div>
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

              {activeTab === 'aircraft' && (
                <div>
                  <h3 className="text-base font-semibold mb-4">Aircraft Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Aircraft Type</div>
                      <div className="text-sm font-semibold text-black">{emptyLeg.aircraft_type || 'N/A'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Category</div>
                      <div className="text-sm font-semibold text-black">{emptyLeg.category || 'Private Jet'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Tail Number</div>
                      <div className="text-sm font-semibold text-black">{emptyLeg.tail_number || 'Available on request'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Year of Manufacture</div>
                      <div className="text-sm font-semibold text-black">{emptyLeg.yom || 'N/A'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Max Passengers</div>
                      <div className="text-sm font-semibold text-black">{emptyLeg.capacity || emptyLeg.pax || 'N/A'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Cabin Configuration</div>
                      <div className="text-sm font-semibold text-black">Executive</div>
                    </div>
                  </div>

                  {emptyLeg.description && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold mb-3">Aircraft Features</h4>
                      <p className="text-xs text-gray-700 leading-relaxed">{emptyLeg.description}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'operator' && (
                <div>
                  <h3 className="text-base font-semibold mb-4">Operator Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Operator</div>
                      <div className="text-sm font-semibold text-black">To be disclosed</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Certification</div>
                      <div className="text-sm font-semibold text-black">Part 135 Certified</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Safety Rating</div>
                      <div className="text-sm font-semibold text-black">★★★★★ (Argus Gold)</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Insurance</div>
                      <div className="text-sm font-semibold text-black">$100M Liability</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Base Location</div>
                      <div className="text-sm font-semibold text-black">{emptyLeg.from_city || emptyLeg.from}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Verified</div>
                      <div className="text-sm font-semibold text-green-600">✓ Verified Operator</div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-600 text-sm mt-0.5">ℹ</span>
                      <div>
                        <div className="text-xs font-semibold text-black mb-1">Operator Details</div>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          The operator information will be disclosed after your booking is confirmed. All operators are verified by PrivateCharterX and meet our strict safety and service standards.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'map' && (
                <div>
                  <h3 className="text-base font-semibold mb-4">Route Map</h3>
                  <div className="h-[350px]">
                    {originCoords && destCoords ? (
                      <RoutePreviewMap
                        origin={originCoords}
                        destination={destCoords}
                        className="h-full"
                      />
                    ) : (
                      <div className="h-full bg-gray-100 rounded-xl flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Route preview unavailable</p>
                          <p className="text-xs mt-1">Airport coordinates not found</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Booking Widget - Show first on mobile */}
          <div className="col-span-1 order-1 md:order-2">
            <div className="bg-white rounded-xl md:rounded-lg border border-gray-300 p-4 md:p-5 md:sticky md:top-6">
              <h3 className="text-base font-semibold mb-4">Book This Flight</h3>

              {/* Flight Summary */}
              <div className="space-y-3 mb-5">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Base Price</span>
                  <span className="text-xs font-semibold text-black">${Math.round(priceUSD).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Departure</span>
                  <span className="text-xs font-semibold text-black">{departureDate.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Max Capacity</span>
                  <span className="text-xs font-semibold text-black">{emptyLeg.capacity || emptyLeg.pax} pax</span>
                </div>
              </div>

              {/* Booking Details Form */}
              <div className="mb-5 pb-4 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-black mb-4">Booking Details</h4>

                <div className="grid grid-cols-3 gap-3">
                  {/* Passengers */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Passengers</label>
                    <div className="flex items-center justify-between border border-gray-300 rounded px-2 py-1.5">
                      <button
                        onClick={() => setPassengers(Math.max(1, passengers - 1))}
                        className="text-gray-600 hover:text-black w-6 h-6 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="text-sm font-semibold">{passengers}</span>
                      <button
                        onClick={() => setPassengers(Math.min(emptyLeg.capacity || emptyLeg.pax || 10, passengers + 1))}
                        className="text-gray-600 hover:text-black w-6 h-6 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Luggage */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Luggage</label>
                    <div className="flex items-center justify-between border border-gray-300 rounded px-2 py-1.5">
                      <button
                        onClick={() => setLuggage(Math.max(0, luggage - 1))}
                        className="text-gray-600 hover:text-black w-6 h-6 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="text-sm font-semibold">{luggage}</span>
                      <button
                        onClick={() => setLuggage(luggage + 1)}
                        className="text-gray-600 hover:text-black w-6 h-6 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Pet */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Pet</label>
                    <button
                      onClick={() => setHasPet(!hasPet)}
                      className={`w-full py-1.5 rounded text-sm font-semibold transition-colors ${
                        hasPet
                          ? 'bg-black text-white'
                          : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {hasPet ? 'Yes' : 'No'}
                    </button>
                  </div>
                </div>
              </div>

              {/* NFT Membership Status */}
              {hasNFT && (
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <div className={`p-3 rounded-lg border ${priceUSD < 1500 && !usedBenefits.freeFlightUsed ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-black font-semibold text-sm">✓ NFT Member</span>
                    </div>
                    <p className="text-xs text-gray-700">
                      {nftDiscount}% discount on all flights
                      {priceUSD < 1500 && !usedBenefits.freeFlightUsed && (
                        <span className="block mt-1 font-semibold text-green-700">🎁 This flight qualifies for FREE redemption!</span>
                      )}
                      {usedBenefits.freeFlightUsed && (
                        <span className="block mt-1 text-gray-500">Free flight benefit already used this year</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Total Price */}
              <div className={`p-3 rounded mb-4 ${hasNFT && priceUSD < 1500 && !usedBenefits.freeFlightUsed ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Base Price:</span>
                  <span className={`font-semibold ${hasNFT && priceUSD < 1500 && !usedBenefits.freeFlightUsed ? 'line-through text-gray-400' : 'text-black'}`}>${Math.round(priceUSD).toLocaleString()}</span>
                </div>
                {hasNFT && (
                  <>
                    {priceUSD < 1500 && !usedBenefits.freeFlightUsed ? (
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-green-600 font-medium">🎁 NFT Free Flight:</span>
                        <span className="font-semibold text-green-600">-${Math.round(priceUSD).toLocaleString()}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">NFT Discount ({nftDiscount}%):</span>
                        <span className="font-semibold text-black">-${Math.round(priceUSD * nftDiscount / 100).toLocaleString()}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 mt-2">
                  <span className="text-black">Total:</span>
                  <span className={hasNFT && priceUSD < 1500 && !usedBenefits.freeFlightUsed ? 'text-green-600' : 'text-black'}>
                    {hasNFT && priceUSD < 1500 && !usedBenefits.freeFlightUsed ? 'FREE' : `$${Math.round(hasNFT ? priceUSD * (1 - nftDiscount / 100) : priceUSD).toLocaleString()}`}
                  </span>
                </div>
              </div>

              {/* Request Flight Button */}
              <button
                onClick={requestFlight}
                className={`w-full py-3 px-4 rounded text-sm font-semibold transition-colors ${
                  hasNFT && priceUSD < 1500 && !usedBenefits.freeFlightUsed
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {hasNFT && priceUSD < 1500 && !usedBenefits.freeFlightUsed ? '🎁 Redeem FREE Flight' : 'Request Flight'}
              </button>

              {/* Pay with Crypto Button - Only show when price is available */}
              {emptyLeg.price && emptyLeg.price > 0 ? (
                <button
                  onClick={() => setShowCryptoModal(true)}
                  className="w-full bg-black text-white py-3 px-4 rounded text-sm font-semibold hover:bg-gray-800 transition-colors mt-2 flex items-center justify-center gap-2"
                >
                  <svg viewBox="0 0 32 32" className="w-4 h-4">
                    <circle cx="16" cy="16" r="16" fill="currentColor"/>
                    <path fill="#000" d="M22.5 14.5c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.7 2.7c-.4-.1-.8-.2-1.3-.3l.7-2.7-1.6-.4-.7 2.7c-.4-.1-.7-.2-1.1-.3l-2.2-.5-.5 1.7s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.2c.1 0 .1 0 .2.1-.1 0-.1 0-.2-.1l-1.1 4.5c-.1.2-.3.5-.8.4 0 0-1.2-.3-1.2-.3l-.8 1.8 2.1.5c.4.1.8.2 1.2.3l-.7 2.8 1.6.4.7-2.7c.4.1.9.2 1.3.3l-.7 2.7 1.6.4.7-2.8c2.9.5 5.1.3 6-2.3.7-2.1 0-3.3-1.5-4.1 1.1-.2 1.9-1 2.1-2.5z"/>
                  </svg>
                  Pay with Crypto
                </button>
              ) : (
                <button
                  onClick={requestFlight}
                  className="w-full bg-white/50 hover:bg-white/70 text-gray-700 py-3 px-4 rounded text-sm font-semibold transition-colors mt-2 flex items-center justify-center gap-2 border border-gray-200/50 hover:border-gray-300/50"
                  style={{ backdropFilter: 'blur(8px)' }}
                >
                  Send Request
                </button>
              )}

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

              {isConnected && address && (
                <div className="mt-3 text-xs text-gray-500 text-center">
                  Connected: {address.slice(0, 6)}...{address.slice(-4)}
                </div>
              )}

              {/* Additional Info */}
              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex items-start space-x-2 mb-2">
                  <span className="text-green-500">✓</span>
                  <span>Instant confirmation</span>
                </div>
                <div className="flex items-start space-x-2 mb-2">
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
                <button onClick={() => navigate('/dashboard')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Web3</button>
                <button onClick={() => navigate('/dashboard?tab=pvcx')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">PVCX Token</button>
                <button onClick={() => navigate('/dashboard?tab=nfts')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">NFT Aviation</button>
                <button onClick={() => navigate('/dashboard?tab=tokenize')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Asset Licensing</button>
                <button onClick={() => navigate('/dashboard?tab=subscription-plans')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">JetCard Packages</button>
                <button onClick={() => navigate('/dashboard?tab=co2')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">CO2 Certificates</button>
                <button onClick={() => navigate('/dashboard')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Tokenized Assets</button>
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

      {/* Success Notification */}
      {showSuccess && (
        <SuccessNotification
          message="Flight request submitted successfully!"
          onClose={() => {
            setShowSuccess(false);
            navigate('/dashboard');
          }}
        />
      )}

      {/* NFT Benefits Modal */}
      <NFTBenefitsModal
        isOpen={showNFTModal}
        onClose={closeNFTModal}
        nft={nfts[0] || null}
        hasNFT={hasNFT}
        usedBenefits={usedBenefits}
      />

      {/* Crypto Payment Modal */}
      {emptyLeg && (
        <CryptoPaymentModal
          isOpen={showCryptoModal}
          onClose={() => setShowCryptoModal(false)}
          service={{
            id: emptyLeg.id,
            title: `${emptyLeg.from_iata} → ${emptyLeg.to_iata}`,
            price: hasNFT && priceUSD < 1900 ? 0 : (hasNFT ? priceUSD * (1 - nftDiscount / 100) : priceUSD),
            originalPrice: priceUSD,
            currency: 'USD',
            departure: emptyLeg.from_city || emptyLeg.from_iata,
            destination: emptyLeg.to_city || emptyLeg.to_iata,
            departureDate: emptyLeg.departure_date,
            passengers: passengers,
            aircraft: emptyLeg.category || emptyLeg.aircraft_type
          }}
          serviceType="empty_leg"
          onSuccess={() => {
            setShowCryptoModal(false);
            setShowSuccess(true);
          }}
        />
      )}
    </div>
  );
};

export default EmptyLegDetail;
