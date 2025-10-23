import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Calendar, X, Search, ArrowRight, Grid, List, Check, Plane, DollarSign, Filter, Star, Sparkles, Percent, CheckCircle, CreditCard, Wallet, Leaf, Users, ChevronLeft, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';
import { airportsStaticService } from '../services/airportsStaticService';
import { web3Service } from '../lib/web3';
import type { NFTBenefit } from '../lib/web3';

// Aircraft categories with CO2 emissions and offset costs
const aircraftCategories = {
  'Very Light Jet': { emissionsPerHour: 0.8, offsetCostPerHour: 64 },
  'Light Jet': { emissionsPerHour: 1.2, offsetCostPerHour: 96 },
  'Mid-Size': { emissionsPerHour: 1.8, offsetCostPerHour: 144 },
  'Super Mid': { emissionsPerHour: 2.2, offsetCostPerHour: 176 },
  'Heavy Jet': { emissionsPerHour: 3.1, offsetCostPerHour: 248 },
  'Ultra Long': { emissionsPerHour: 3.8, offsetCostPerHour: 304 },
  'default': { emissionsPerHour: 1.2, offsetCostPerHour: 96 }
};

// Extended NFT interface that combines web3 data with database data
interface ExtendedNFTBenefit extends NFTBenefit {
  id: string;
  database_id: string | null;
  nft_name: string;
  nft_token_id: string;
  is_used: boolean;
  in_database: boolean;
}

// Interface definition for EmptyLegOffer
export interface EmptyLegOffer {
  id: string;
  from: string;
  to: string;
  from_iata: string;
  to_iata: string;
  aircraft_type: string;
  category: string;
  capacity: number;
  departure_date: string;
  price: number;
  currency: string;
  operator: string;
  booking_link: string;
  aircraft_type_original: string;
  from_country: string;
  to_country: string;
  from_city: string;
  to_city: string;
  departure_time: string;
  arrival_time: string;
  registration: string;
  image_url: string;
  price_usd: number;
  co2_emissions_kg: number;
  co2_offset_cost_eur: number;
  flight_duration_hours: number;
  from_continent?: string;
  to_continent?: string;
}

// Function to determine aircraft category from type
const getAircraftCategory = (aircraftType: string): keyof typeof aircraftCategories => {
  const type = aircraftType.toLowerCase();
  if (type.includes('very light') || type.includes('vlj') || type.includes('citation mustang') || type.includes('phenom 100')) {
    return 'Very Light Jet';
  }
  if (type.includes('light') || type.includes('citation cj') || type.includes('phenom 300') || type.includes('nextant 400xt')) {
    return 'Light Jet';
  }
  if (type.includes('mid-size') || type.includes('midsize') || type.includes('citation x') || type.includes('learjet 60') || type.includes('hawker 850xp')) {
    return 'Mid-Size';
  }
  if (type.includes('super mid') || type.includes('super midsize') || type.includes('gulfstream g280') || type.includes('citation sovereign') || type.includes('falcon 2000')) {
    return 'Super Mid';
  }
  if (type.includes('heavy') || type.includes('gulfstream g450') || type.includes('gulfstream g550') || type.includes('falcon 7x') || type.includes('global 5000')) {
    return 'Heavy Jet';
  }
  if (type.includes('ultra long') || type.includes('ultra-long') || type.includes('gulfstream g650') || type.includes('global 6000') || type.includes('falcon 8x')) {
    return 'Ultra Long';
  }
  return 'default';
};

// Function to get continent from airport code, city, or country using the airports dataset
const getContinentFromLocation = async (location: string | null | undefined, locationType: 'city' | 'country' | 'airport' = 'airport'): Promise<string> => {
  if (!location) return '';

  try {
    // First try to find by airport code (3-4 characters)
    if (locationType === 'airport' && location.length >= 3 && location.length <= 4) {
      const airport = await airportsStaticService.getAirportByCode(location);
      if (airport?.continent) {
        return airport.continent;
      }
    }

    // If not found by code, try searching by location name (city, country, or airport name)
    const airports = await airportsStaticService.searchAirports(location, 5);
    const airportWithContinent = airports.find(airport => airport.continent);

    return airportWithContinent?.continent || '';
  } catch (error) {
    console.error('Error looking up continent for location:', location, error);
    return '';
  }
};

// Function to calculate flight distance based on continents
const calculateFlightDistance = (fromContinent: string, toContinent: string): number => {
  const continentDistances: Record<string, Record<string, number>> = {
    'North America': {
      'North America': 2000,
      'South America': 4000,
      'Europe': 7000,
      'Asia': 11000,
      'Africa': 12000,
      'Oceania': 13000
    },
    'South America': {
      'North America': 4000,
      'South America': 2500,
      'Europe': 9000,
      'Asia': 18000,
      'Africa': 8000,
      'Oceania': 14000
    },
    'Europe': {
      'North America': 7000,
      'South America': 9000,
      'Europe': 1000,
      'Asia': 6000,
      'Africa': 3500,
      'Oceania': 17000
    },
    'Asia': {
      'North America': 11000,
      'South America': 18000,
      'Europe': 6000,
      'Asia': 3000,
      'Africa': 7000,
      'Oceania': 8000
    },
    'Africa': {
      'North America': 12000,
      'South America': 8000,
      'Europe': 3500,
      'Asia': 7000,
      'Africa': 2500,
      'Oceania': 11000
    },
    'Oceania': {
      'North America': 13000,
      'South America': 14000,
      'Europe': 17000,
      'Asia': 8000,
      'Africa': 11000,
      'Oceania': 2000
    }
  };
  // Default to a reasonable distance if continents not found
  return continentDistances[fromContinent]?.[toContinent] || 5000;
};

// Function to calculate CO2 emissions and offset cost
const calculateCO2Data = (fromContinent: string, toContinent: string, aircraftType: string) => {
  const category = getAircraftCategory(aircraftType);
  const { emissionsPerHour, offsetCostPerHour } = aircraftCategories[category];
  const distance = calculateFlightDistance(fromContinent, toContinent);
  const flightDurationHours = distance / 800;
  const co2EmissionsTons = emissionsPerHour * flightDurationHours;
  const co2EmissionsKg = Math.round(co2EmissionsTons * 1000);
  const offsetCostEur = Math.round(offsetCostPerHour * flightDurationHours);
  return {
    co2_emissions_kg: co2EmissionsKg,
    co2_offset_cost_eur: offsetCostEur,
    flight_duration_hours: parseFloat(flightDurationHours.toFixed(1))
  };
};

// Simplified Flight Modal Component
interface FlightModalProps {
  emptyLeg: EmptyLegOffer;
  onClose: () => void;
  isAuthenticated: boolean;
  onLoginRequired: () => void;
}

const FlightModal: React.FC<FlightModalProps> = ({
  emptyLeg,
  onClose,
  isAuthenticated,
  onLoginRequired
}) => {
  const { user } = useAuth();
  const { address, isConnected, chain } = useAccount();
  const { open } = useAppKit();
  const [step, setStep] = useState<'overview' | 'booking' | 'nft-booking' | 'summary'>('overview');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState('');
  const [userNFTs, setUserNFTs] = useState<ExtendedNFTBenefit[]>([]);
  const [loadingNFTs, setLoadingNFTs] = useState(false);
  const [bookingType, setBookingType] = useState<'normal' | 'nft-discount' | 'nft-free'>('normal');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: '',
    passengers: 1,
    message: '',
    paymentMethod: 'card'
  });

  const NFT_CONTRACT_ADDRESS = '0xDF86Cf55BD2E58aaaC09160AaD0ed8673382B339';
  const isNFTFreeEligible = emptyLeg.price_usd < 1500;

  // Fetch user profile data including phone number
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('phone')
            .eq('user_id', user.id)
            .single();

          if (profile?.phone) {
            setFormData(prev => ({
              ...prev,
              phone: profile.phone
            }));
          }
        } catch (error) {
          console.log('No phone number found in profile');
        }
      }
    };

    fetchUserProfile();
  }, [user?.id]);
  const nftDiscountPrice = Math.round(emptyLeg.price_usd * 0.9);

  // Helper to check if on Base network
  const isOnBaseNetwork = chain?.id === 8453;

  // Block body scroll when modal is open
  useEffect(() => {
    document.body.classList.add('modal-open');
    const style = document.createElement('style');
    style.id = 'modal-scroll-lock';
    style.textContent = `
      body.modal-open {
        overflow: hidden !important;
      }
    `;
    if (!document.getElementById('modal-scroll-lock')) {
      document.head.appendChild(style);
    }
    return () => {
      document.body.classList.remove('modal-open');
      const existingStyle = document.getElementById('modal-scroll-lock');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  // Check NFTs when wallet is connected and on Base network
  useEffect(() => {
    if (isConnected && address && isOnBaseNetwork) {
      fetchUserNFTs();
    } else {
      setUserNFTs([]);
    }
  }, [isConnected, address, chain?.id]);

  // FIXED: Improved connectWallet function that doesn't cause double connections
  const connectWallet = async () => {
    try {
      // If already connected, just check if we need to switch networks
      if (isConnected && address) {
        // If on wrong network, open network selection
        if (!isOnBaseNetwork) {
          console.log('Connected but on wrong network, opening network selection');
          open({ view: 'Networks' });
          return;
        }
        // If already connected and on correct network, no need to connect again
        console.log('Already connected to Base network');
        return;
      }

      // Only open connection modal if not connected
      console.log('Not connected, opening wallet connection');
      open();
    } catch (error) {
      console.error('Error with wallet connection:', error);
      alert('Failed to handle wallet connection. Please try again.');
    }
  };

  // Helper function to ensure NFT exists in database
  const ensureNFTInDatabase = async (selectedNFTId: string) => {
    const selectedNFTData = userNFTs.find(nft => nft.id === selectedNFTId);
    if (!selectedNFTData || !user?.id || !address) return null;

    // If NFT is already in database, return its database ID
    if (selectedNFTData.in_database && selectedNFTData.database_id) {
      return selectedNFTData.database_id;
    }

    // Insert NFT into database
    console.log('Inserting NFT into database:', selectedNFTData);
    const { data: insertedNFT, error } = await supabase
      .from('user_nfts')
      .insert({
        user_id: user.id,
        wallet_address: address.toLowerCase(),
        nft_contract_address: NFT_CONTRACT_ADDRESS.toLowerCase(),
        nft_token_id: selectedNFTData.nft_token_id,
        nft_name: selectedNFTData.nft_name || selectedNFTData.name,
        verified: true,
        is_used: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting NFT:', error);
      return null;
    }

    console.log('NFT inserted successfully:', insertedNFT);

    // Update local state to reflect the NFT is now in database
    setUserNFTs(prev => prev.map(nft =>
      nft.id === selectedNFTId
        ? { ...nft, database_id: insertedNFT.id, in_database: true }
        : nft
    ));

    return insertedNFT.id;
  };

  const fetchUserNFTs = async () => {
    if (!user?.id || !address || !isOnBaseNetwork) return;
    setLoadingNFTs(true);
    try {
      // Use web3Service to get NFTs
      const nfts = await web3Service.getUserNFTs(address as `0x${string}`);

      if (nfts.length > 0) {
        // Get NFTs from database for this user and address
        let query = supabase
          .from('user_nfts')
          .select('*')
          .eq('user_id', user.id)
          .eq('wallet_address', address.toLowerCase())
          .eq('nft_contract_address', NFT_CONTRACT_ADDRESS.toLowerCase())
          .eq('verified', true);

        // Only filter by is_used when bookingType is 'nft-free'
        if (bookingType === 'nft-free') {
          query = query.eq('is_used', false);
        }

        const { data: existingNFTs, error } = await query;

        if (error) {
          console.error('Error fetching NFTs from database:', error);
        }

        // Combine web3 data with database data
        const combinedNFTs: ExtendedNFTBenefit[] = nfts.map(nft => {
          const dbNFT = existingNFTs?.find(db => db.nft_token_id === nft.tokenId);
          return {
            ...nft,
            id: dbNFT?.id || `temp_${nft.tokenId}`, // Use temp ID if not in database
            database_id: dbNFT?.id || null, // Track actual database ID separately
            nft_name: dbNFT?.nft_name || nft.name,
            nft_token_id: nft.tokenId,
            is_used: dbNFT?.is_used || false,
            in_database: !!dbNFT // Flag to track if NFT exists in database
          };
        });

        setUserNFTs(combinedNFTs);
      } else {
        setUserNFTs([]);
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      setUserNFTs([]);
    } finally {
      setLoadingNFTs(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'passengers' ? parseInt(value) || 1 : value
    }));
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'TBD';

    if (timeString.includes('T')) {
      try {
        const timeDate = new Date(timeString);
        return timeDate.toISOString().substring(11, 16) + ' UTC';
      } catch {
        return timeString;
      }
    }
    return timeString;
  };

  const getDefaultImage = () => {
    return 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80';
  };

  // FIXED: Improved booking submit with better wallet state handling
  const handleBookingSubmit = async () => {
    if (!isAuthenticated || !user) {
      onLoginRequired();
      return;
    }

    // Improved wallet connection check for NFT bookings
    if ((bookingType === 'nft-discount' || bookingType === 'nft-free')) {
      if (!isConnected) {
        alert('Please connect your wallet to use NFT benefits');
        await connectWallet(); // This will now handle the connection properly
        return;
      }

      if (!isOnBaseNetwork) {
        alert('Please switch to Base network to use NFT benefits');
        await connectWallet(); // This will now open network selection
        return;
      }

      if (!selectedNFT && userNFTs.length > 0) {
        alert('Please select an NFT to use for this booking');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let signature = '';
      let finalPrice = emptyLeg.price_usd;
      let requestType = 'empty_leg';

      if (bookingType === 'nft-discount' || bookingType === 'nft-free') {
        finalPrice = bookingType === 'nft-free' ? 0 : nftDiscountPrice;
        requestType = bookingType === 'nft-free' ? 'nft_free_flight' : 'nft_discount_empty_leg';

        const message = `I confirm using my PrivateCharterX NFT for ${bookingType === 'nft-free' ? 'FREE' : '10% discount'} on:
Flight: ${emptyLeg.from_iata || emptyLeg.from} → ${emptyLeg.to_iata || emptyLeg.to}
Date: ${formatDate(emptyLeg.departure_date)}
Original Price: USD ${emptyLeg.price_usd.toLocaleString()}
Final Price: USD ${finalPrice.toLocaleString()}
${bookingType === 'nft-free' ? 'This will mark my NFT as USED for free flight benefit.' : 'This will use my NFT 10% discount benefit.'}
Timestamp: ${Date.now()}
Wallet: ${address}`;

        try {
          const signer = await (window as any).ethereum.request({
            method: 'personal_sign',
            params: [message, address]
          });
          signature = signer;
        } catch (signError) {
          console.error('Signature error:', signError);
          alert('Please sign the message to confirm your NFT usage.');
          setIsSubmitting(false);
          return;
        }
      }

      const flightData = {
        empty_leg_id: emptyLeg.id,
        route: `${emptyLeg.from_iata || emptyLeg.from} → ${emptyLeg.to_iata || emptyLeg.to}`,
        departure_airport: emptyLeg.from,
        arrival_airport: emptyLeg.to,
        departure_city: emptyLeg.from_city,
        arrival_city: emptyLeg.to_city,
        departure_iata: emptyLeg.from_iata,
        arrival_iata: emptyLeg.to_iata,
        departure_date: emptyLeg.departure_date,
        departure_time: emptyLeg.departure_time,
        arrival_time: emptyLeg.arrival_time,
        aircraft_type: emptyLeg.aircraft_type,
        aircraft_registration: emptyLeg.registration,
        original_price: emptyLeg.price_usd,
        final_price: finalPrice,
        currency: 'USD',
        capacity: emptyLeg.capacity,
        operator: emptyLeg.operator,
        passenger_count: formData.passengers,
        special_requests: formData.message,
        payment_method: formData.paymentMethod,
        booking_reference: `${bookingType === 'nft-free' ? 'NFTFREE' : bookingType === 'nft-discount' ? 'NFT10' : 'EL'}-${Date.now()}-${emptyLeg.id.substring(0, 6)}`,
        request_timestamp: new Date().toISOString(),
        ...(bookingType !== 'normal' && {
          nft_used: selectedNFT || null,
          wallet_address: address,
          nft_contract_address: NFT_CONTRACT_ADDRESS,
          has_valid_nft: userNFTs.length > 0 && selectedNFT ? true : false,
          signature_message: signature ? `NFT signature for ${bookingType}` : undefined,
          signature_hash: signature
        })
      };

      const requestData = {
        user_id: user.id,
        type: requestType,
        status: 'pending',
        data: flightData,
        client_name: `${formData.firstName} ${formData.lastName}`,
        client_email: formData.email,
        client_phone: formData.phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Ensure Supabase connection and store request
      const { data: requestResult, error: requestError } = await supabase
        .from('user_requests')
        .insert([requestData])
        .select()
        .single();

      if (requestError) {
        console.error('Supabase insertion error:', requestError);
        throw new Error(`Failed to save booking request: ${requestError.message}`);
      }

      console.log('Request saved successfully:', requestResult);

      // Handle NFT usage tracking for both discount and free flight
      // if ((bookingType === 'nft-discount' || bookingType === 'nft-free') && selectedNFT) {
      //   try {
      //     // Ensure NFT exists in database first
      //     const databaseNFTId = await ensureNFTInDatabase(selectedNFT);

      //     if (databaseNFTId) {
      //       // Mark NFT as used only for free flights (discount bookings don't mark as used)
      //       if (bookingType === 'nft-free') {
      //         const { error: nftUpdateError } = await supabase
      //           .from('user_nfts')
      //           .update({ is_used: true, used_at: new Date().toISOString() })
      //           .eq('id', databaseNFTId);

      //         if (nftUpdateError) {
      //           console.error('Error marking NFT as used:', nftUpdateError);
      //         } else {
      //           console.log('NFT marked as used successfully');
      //           // Update local state
      //           setUserNFTs(prev => prev.map(nft => 
      //             nft.id === selectedNFT 
      //               ? { ...nft, is_used: true }
      //               : nft
      //           ));
      //         }
      //       }
      //       console.log(`NFT ${bookingType === 'nft-free' ? 'used for free flight' : 'used for discount'}`);
      //     } else {
      //       console.error('Failed to ensure NFT exists in database');
      //     }
      //   } catch (error) {
      //     console.error('Error handling NFT usage:', error);
      //   }
      // }

      //       // Create email content
      //       const subject = encodeURIComponent(`${bookingType === 'nft-free' ? 'NFT Free Flight' : bookingType === 'nft-discount' ? 'NFT Discount' : 'Empty Leg'} Request: ${emptyLeg.from_iata || emptyLeg.from} to ${emptyLeg.to_iata || emptyLeg.to} - ${formatDate(emptyLeg.departure_date)}`);
      //       const body = encodeURIComponent(`Hello,

      // I would like to book the following flight:

      // CUSTOMER INFORMATION:
      // - Name: ${formData.firstName} ${formData.lastName}
      // - Email: ${formData.email}
      // - Phone: ${formData.phone}
      // - Passengers: ${formData.passengers}
      // - Payment Method: ${formData.paymentMethod === 'card' ? 'Credit Card' : formData.paymentMethod === 'crypto' ? 'Cryptocurrency' : 'Bank Transfer'}
      // ${address ? `- Wallet Address: ${address}` : ''}

      // FLIGHT DETAILS:
      // - Route: ${emptyLeg.from_city || emptyLeg.from} (${emptyLeg.from_iata || emptyLeg.from}) → ${emptyLeg.to_city || emptyLeg.to} (${emptyLeg.to_iata || emptyLeg.to})
      // - Date: ${formatDate(emptyLeg.departure_date)}
      // - Departure Time: ${formatTime(emptyLeg.departure_time)}
      // - Aircraft Type: ${emptyLeg.aircraft_type}
      // - Registration: ${emptyLeg.registration || 'N/A'}
      // - Capacity: Up to ${emptyLeg.capacity} passengers
      // - Original Price: ${emptyLeg.currency} ${emptyLeg.price.toLocaleString()}
      // - Final Price: ${emptyLeg.currency} ${finalPrice.toLocaleString()}

      // ${formData.message ? `ADDITIONAL MESSAGE:
      // ${formData.message}

      // ` : ''}REQUEST ID: ${requestResult.id}
      // Booking Type: ${bookingType === 'nft-free' ? 'NFT Free Flight' : bookingType === 'nft-discount' ? 'NFT 10% Discount' : 'Regular Booking'}

      // Submitted via PrivateCharterX Platform

      // Please confirm availability and provide booking details.

      // Best regards,
      // ${formData.firstName} ${formData.lastName}`);

      //       // Open email client
      //       window.open(`mailto:bookings@privatecharterx.com?subject=${subject}&body=${body}`, '_blank');

      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Error submitting booking request:', error);
      alert(`Failed to submit request: ${error.message || 'Please try again or contact support.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStepNavigation = (newStep: typeof step, newBookingType?: typeof bookingType) => {
    if (newStep !== 'overview' && !isAuthenticated) {
      onLoginRequired();
      return;
    }
    if (newBookingType) {
      setBookingType(newBookingType);
    }
    setStep(newStep);
  };

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto p-8 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={24} className="text-green-600" />
          </div>
          <h2 className="text-xl font-light text-black mb-3">Request submitted</h2>
          <p className="text-gray-600 font-light mb-6 leading-relaxed">
            Your booking request has been submitted successfully. We'll contact you shortly to confirm details.
          </p>
          <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2">
            <p className="text-sm font-light"><span className="text-gray-500">Route:</span> {emptyLeg.from_iata || emptyLeg.from} → {emptyLeg.to_iata || emptyLeg.to}</p>
            <p className="text-sm font-light"><span className="text-gray-500">Date:</span> {formatDate(emptyLeg.departure_date)}</p>
            <p className="text-sm font-light"><span className="text-gray-500">Passengers:</span> {formData.passengers}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-lg">
        {/* Header - Single image, no gallery */}
        <div className="relative">
          {step === 'overview' && (
            <div className="relative h-48 bg-gradient-to-r from-gray-900 to-gray-700 overflow-hidden rounded-t-2xl">
              <img
                src={emptyLeg.image_url || getDefaultImage()}
                alt="Flight"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = getDefaultImage();
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10"
              >
                <X className="w-4 h-4 stroke-2" />
              </button>

              {/* Flight route with IATA codes */}
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1.5 rounded-md flex items-center text-sm font-light">
                <MapPin className="w-4 h-4 mr-2 stroke-1" />
                {emptyLeg.from_iata || emptyLeg.from} → {emptyLeg.to_iata || emptyLeg.to}
              </div>
            </div>
          )}

          {/* Header for other steps */}
          {step !== 'overview' && (
            <div className="sticky top-0 bg-white p-5 border-b border-gray-100 rounded-t-2xl">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => {
                  if (step === 'summary') setStep(bookingType === 'nft-discount' || bookingType === 'nft-free' ? 'nft-booking' : 'booking');
                  else if (step === 'booking' || step === 'nft-booking') setStep('overview');
                }} className="text-gray-400 hover:text-black">
                  <ChevronLeft className="w-5 h-5 stroke-1" />
                </button>
                <div className="flex-1" />
                <button onClick={onClose} className="text-gray-400 hover:text-black">
                  <X className="w-5 h-5 stroke-1" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {step === 'overview' && (
            <div>
              <h2 className="text-lg font-light text-black mb-2">
                {emptyLeg.from_city || emptyLeg.from} → {emptyLeg.to_city || emptyLeg.to}
              </h2>

              {/* Prominent IATA codes display */}
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">From</div>
                    <div className="text-xl font-bold text-blue-900">{emptyLeg.from_iata || emptyLeg.from}</div>
                    <div className="text-xs text-gray-500">{emptyLeg.from_city || emptyLeg.from}</div>
                  </div>
                  <div className="text-blue-600">
                    <ArrowRight size={20} />
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">To</div>
                    <div className="text-xl font-bold text-blue-900">{emptyLeg.to_iata || emptyLeg.to}</div>
                    <div className="text-xs text-gray-500">{emptyLeg.to_city || emptyLeg.to}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-3">
                <div className="bg-gray-100 px-2 py-1 rounded-full flex items-center text-xs text-black font-light">
                  <Plane className="w-3 h-3 mr-1 stroke-1" />
                  {emptyLeg.aircraft_type}
                </div>
                <div className="bg-gray-100 px-2 py-1 rounded-full flex items-center text-xs text-black font-light">
                  <Users className="w-3 h-3 mr-1 stroke-1" />
                  {emptyLeg.capacity} seats
                </div>
                <div className="bg-gray-100 px-2 py-1 rounded-full flex items-center text-xs text-black font-light">
                  <Leaf className="w-3 h-3 mr-1 stroke-1" />
                  Carbon neutral
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="grid grid-cols-2 gap-3 text-sm font-light">
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <div className="text-black">{formatDate(emptyLeg.departure_date)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Time:</span>
                    <div className="text-black">{formatTime(emptyLeg.departure_time)}</div>
                  </div>
                </div>
              </div>

              {/* Empty Legs Description */}
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <div className="relative">
                    <Info
                      className="w-4 h-4 text-blue-600 mt-0.5 cursor-help"
                      onMouseEnter={() => setShowDisclaimer(true)}
                      onMouseLeave={() => setShowDisclaimer(false)}
                    />
                    {showDisclaimer && (
                      <div className="absolute bottom-6 left-0 bg-black text-white text-xs p-3 rounded-lg w-64 z-10">
                        <div className="font-medium mb-2">Disclaimer (Empty Legs)</div>
                        <ul className="text-xs space-y-1">
                          <li>• Price subject to availability and routing</li>
                          <li>• Includes aircraft, crew, standard drinks & snacks, safety and airport fees</li>
                          <li>• Excludes catering, special requests, transfers, extra baggage, and applicable taxes</li>
                          <li>• International flights are exempt from Swiss VAT (Art. 23 para. 2 no. 12 MWSTG)</li>
                          <li>• Domestic flights within Switzerland: +8.1% VAT</li>
                        </ul>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-blue-900 mb-1">About Empty Legs</div>
                    <p className="text-xs text-blue-800 font-light leading-4">
                      EmptyLegs refers to flights—usually private jet or charter flights—that are scheduled to fly without passengers on a particular leg of their journey. This typically happens when a private jet has dropped off passengers at their destination and needs to return to its home base or travel to pick up the next group of passengers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-light text-black mb-4">Booking options</h3>

                {/* Standard Booking */}
                <button
                  onClick={() => handleStepNavigation('booking', 'normal')}
                  className="w-full p-4 bg-black text-white rounded-xl transition-colors hover:bg-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <Plane className="w-4 h-4 text-white stroke-1" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-light">Standard booking</div>
                        <div className="text-xs text-white/70">Regular price</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-light">${emptyLeg.price_usd?.toLocaleString()}</div>
                    </div>
                  </div>
                </button>

                {/* NFT Discount Booking */}
                <button
                  onClick={() => handleStepNavigation('nft-booking', 'nft-discount')}
                  className="w-full p-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-gray-600 stroke-1" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-light text-black">Member discount</div>
                        <div className="text-xs text-gray-600">10% off with NFT</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-light text-black">${nftDiscountPrice.toLocaleString()}</div>
                      <div className="text-xs text-green-600">Save 10%</div>
                    </div>
                  </div>
                </button>

                {/* Free NFT Flight (if eligible) */}
                {isNFTFreeEligible && (
                  <button
                    onClick={() => handleStepNavigation('nft-booking', 'nft-free')}
                    className="w-full p-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl transition-colors border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center">
                          <Star className="w-4 h-4 text-gray-700 stroke-1" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-light text-black">Member flight</div>
                          <div className="text-xs text-gray-600">Free with NFT</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-light text-black">FREE</div>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Booking form steps */}
          {(step === 'booking' || step === 'nft-booking') && (
            <div>
              <h2 className="text-lg font-light text-black mb-4">
                {bookingType === 'nft-free' ? 'Free NFT Flight' : bookingType === 'nft-discount' ? 'NFT Discount Booking' : 'Book Flight'}
              </h2>

              {/* Form fields */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Passengers</label>
                  <select
                    name="passengers"
                    value={formData.passengers}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Array.from({ length: emptyLeg.capacity }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num} passenger{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="card">Credit Card</option>
                    <option value="crypto">Cryptocurrency</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests (Optional)</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any special requests or requirements..."
                  />
                </div>
              </div>

              {/* FIXED: NFT Selection with improved logic */}
              {(bookingType === 'nft-discount' || bookingType === 'nft-free') && (
                <div className="mb-6">
                  {!isConnected ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 mb-2">Connect Wallet Required</h4>
                      <p className="text-sm text-yellow-700 mb-3">
                        Connect your wallet to use NFT benefits for this booking.
                      </p>
                      <button
                        onClick={connectWallet}
                        className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        Connect Wallet
                      </button>
                    </div>
                  ) : !isOnBaseNetwork ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Switch to Base Network</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        You're connected but need to switch to Base network to use your NFTs.
                      </p>
                      <button
                        onClick={connectWallet}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Switch to Base Network
                      </button>
                    </div>
                  ) : loadingNFTs ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-700">Loading your NFTs...</p>
                    </div>
                  ) : userNFTs.length === 0 ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-800 mb-2">No Eligible NFTs</h4>
                      <p className="text-sm text-red-700">
                        You don't have any eligible NFTs for this booking type.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select NFT</label>
                      <select
                        value={selectedNFT}
                        onChange={(e) => setSelectedNFT(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select an NFT</option>
                        {userNFTs.map((nft) => (
                          <option key={nft.id} value={nft.id}>
                            {nft.nft_name || `NFT #${nft.nft_token_id}`} {nft.is_used ? '(Used)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Submit button */}
              <button
                onClick={handleBookingSubmit}
                disabled={isSubmitting ||
                  !formData.firstName ||
                  !formData.lastName ||
                  !formData.email ||
                  !formData.phone ||
                  ((bookingType === 'nft-discount' || bookingType === 'nft-free') && (!isConnected || !isOnBaseNetwork || !selectedNFT))
                }
                className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' :
                  bookingType === 'nft-free' ? 'Book Free Flight' :
                    bookingType === 'nft-discount' ? 'Book with Discount' :
                      'Submit Booking Request'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Price Filter Component
interface PriceFilterProps {
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  minPrice: number;
  maxPrice: number;
  onReset: () => void;
}

const PriceFilter: React.FC<PriceFilterProps> = ({
  priceRange,
  onPriceChange,
  minPrice,
  maxPrice,
  onReset
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<[number, number]>(priceRange);

  useEffect(() => {
    setTempRange(priceRange);
  }, [priceRange]);

  const handleApply = () => {
    onPriceChange(tempRange);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetRange: [number, number] = [0, maxPrice];
    setTempRange(resetRange);
    onPriceChange(resetRange);
    onReset();
    setIsOpen(false);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `${(price / 1000).toFixed(0)}K`;
    return `${price.toLocaleString()}`;
  };

  const isFiltered = priceRange[0] !== 0 || priceRange[1] !== maxPrice;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${isFiltered
          ? 'bg-gray-900 text-white shadow-lg'
          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
      >
        <DollarSign size={16} />
        <span className="hidden sm:inline">Price</span>
        {isFiltered && (
          <span className="ml-1 text-xs opacity-80 hidden sm:inline">
            {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 w-80 z-[200] transform transition-all duration-200 scale-100">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-gray-900">Price Range</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">USD</span>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Minimum Price</label>
                <input
                  type="range"
                  min={minPrice}
                  max={maxPrice}
                  step={100}
                  value={tempRange[0]}
                  onChange={(e) => {
                    const newMin = Math.max(minPrice, parseInt(e.target.value));
                    setTempRange([newMin, Math.max(newMin, tempRange[1])]);
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-sm font-semibold text-gray-900 mt-2">{formatPrice(tempRange[0])}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Maximum Price</label>
                <input
                  type="range"
                  min={minPrice}
                  max={maxPrice}
                  step={100}
                  value={tempRange[1]}
                  onChange={(e) => {
                    const newMax = parseInt(e.target.value);
                    setTempRange([Math.min(tempRange[0], newMax), newMax]);
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-sm font-semibold text-gray-900 mt-2">{formatPrice(tempRange[1])}</div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 py-3 text-sm border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className="flex-1 py-3 text-sm bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const fetchEmptyLegs = async () => {
  console.log('🔍 Fetching all empty legs from database');
  try {
    let query = supabase
      .from('EmptyLegs_')
      .select('*');
    // Only filter out past dates from the database - do everything else client-side
    const today = new Date().toISOString().split('T')[0];
    query = query.gte('departure_date', today);
    query = query.order('departure_date', { ascending: true });
    console.log('📡 Executing Supabase query...');
    const { data, error } = await query;
    if (error) {
      console.error('❌ Supabase query error:', error);
      throw error;
    }
    console.log(`✅ Query successful: ${data?.length || 0} results`);
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching empty legs:', error);
    throw error;
  }
};

const EmptyLegOffers: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [allEmptyLegs, setAllEmptyLegs] = useState<EmptyLegOffer[]>([]); // Store all data
  const [emptyLegs, setEmptyLegs] = useState<EmptyLegOffer[]>([]); // Store filtered/paginated data
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalOffers, setTotalOffers] = useState(0);
  const [selectedEmptyLeg, setSelectedEmptyLeg] = useState<EmptyLegOffer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [error, setError] = useState<string | null>(null);
  const [isChangingPage, setIsChangingPage] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [priceExtents, setPriceExtents] = useState<[number, number]>([0, 100000]);
  const [showFilters, setShowFilters] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Client-side filtering function
  const applyFilters = useCallback(async (
    data: EmptyLegOffer[],
    category: string,
    search: string,
    priceFilter: [number, number],
    currentPriceExtents: [number, number]
  ) => {
    console.log('🔧 Applying client-side filters:', { category, search, priceFilter });
    let filtered = [...data];

    // Apply continent-based category filter
    if (category && category !== 'all') {
      console.log(`📂 Filtering by continent: ${category}`);
      filtered = await Promise.all(
        filtered.map(async (emptyLeg) => {
          // Check if continent data is already available
          let fromContinent = emptyLeg.from_continent;
          let toContinent = emptyLeg.to_continent;

          // If not available, look it up using airport codes
          if (!fromContinent && emptyLeg.from_iata) {
            fromContinent = await getContinentFromLocation(emptyLeg.from_iata, 'airport');
          }
          if (!toContinent && emptyLeg.to_iata) {
            toContinent = await getContinentFromLocation(emptyLeg.to_iata, 'airport');
          }

          // Update the empty leg with continent data
          return {
            ...emptyLeg,
            from_continent: fromContinent || '',
            to_continent: toContinent || ''
          };
        })
      );

      // Now filter by continent
      let targetContinent = '';
      switch (category.toLowerCase()) {
        case 'europe':
          targetContinent = 'Europe';
          break;
        case 'asia':
          targetContinent = 'Asia';
          break;
        case 'africa':
          targetContinent = 'Africa';
          break;
        case 'north america':
          targetContinent = 'North America';
          break;
        case 'south america':
          targetContinent = 'South America';
          break;
        case 'oceania':
          targetContinent = 'Oceania';
          break;
        default:
          targetContinent = category;
      }

      filtered = filtered.filter((emptyLeg) => {
        const matchesContinent =
          emptyLeg.from_continent === targetContinent ||
          emptyLeg.to_continent === targetContinent;

        console.log(`${emptyLeg.from} → ${emptyLeg.to}: from=${emptyLeg.from_continent}, to=${emptyLeg.to_continent}, matches=${matchesContinent}, target=${targetContinent}`);
        return matchesContinent;
      });
    }

    // Apply search filter
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      console.log(`🔎 Filtering by search: "${searchTerm}"`);
      filtered = filtered.filter((emptyLeg) =>
        emptyLeg.from?.toLowerCase().includes(searchTerm) ||
        emptyLeg.to?.toLowerCase().includes(searchTerm) ||
        emptyLeg.from_city?.toLowerCase().includes(searchTerm) ||
        emptyLeg.to_city?.toLowerCase().includes(searchTerm) ||
        emptyLeg.from_iata?.toLowerCase().includes(searchTerm) ||
        emptyLeg.to_iata?.toLowerCase().includes(searchTerm) ||
        emptyLeg.aircraft_type?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply price filter (only if it's different from the full price range)
    if (priceFilter[0] !== currentPriceExtents[0] || priceFilter[1] !== currentPriceExtents[1]) {
      console.log(`💰 Filtering by price: $${priceFilter[0]} - $${priceFilter[1]}`);
      filtered = filtered.filter((emptyLeg) =>
        emptyLeg.price_usd >= priceFilter[0] && emptyLeg.price_usd <= priceFilter[1]
      );
    }

    console.log(`✅ Filtered results: ${filtered.length} of ${data.length} total`);
    return filtered;
  }, []);

  useEffect(() => {
    if (showModal || showLoginModal || showRegisterModal) {
      document.body.classList.add('modal-open');
      const style = document.createElement('style');
      style.id = 'modal-scroll-lock';
      style.textContent = `
        body.modal-open {
          overflow: hidden !important;
        }
      `;
      if (!document.getElementById('modal-scroll-lock')) {
        document.head.appendChild(style);
      }
    } else {
      document.body.classList.remove('modal-open');
      const existingStyle = document.getElementById('modal-scroll-lock');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    }
    return () => {
      document.body.classList.remove('modal-open');
      const existingStyle = document.getElementById('modal-scroll-lock');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, [showModal, showLoginModal, showRegisterModal]);

  // Load all data on component mount
  useEffect(() => {
    loadAllEmptyLegs();
  }, []);

  // Apply filters when data changes or filters change
  useEffect(() => {
    if (allEmptyLegs.length > 0) {
      const timeoutId = setTimeout(() => {
        console.log('⏱️ Filter/pagination change triggered');
        applyFiltersAndPagination();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [allEmptyLegs, searchTerm, filterCategory, priceRange, currentPage, itemsPerPage, priceExtents, applyFilters]);

  // Load all data from database (only once)
  const loadAllEmptyLegs = async () => {
    console.log('🚀 Loading all empty legs from database...');
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEmptyLegs();

      // Process all data with continent and CO2 information
      const emptyLegsWithCO2 = await Promise.all(
        data.map(async (emptyLeg) => {
          // Use existing continent data if available, otherwise look it up from airports
          let fromContinent = emptyLeg.from_continent;
          let toContinent = emptyLeg.to_continent;

          if (!fromContinent && emptyLeg.from_iata) {
            fromContinent = await getContinentFromLocation(emptyLeg.from_iata, 'airport');
          }
          if (!fromContinent && emptyLeg.from_city) {
            fromContinent = await getContinentFromLocation(emptyLeg.from_city, 'city');
          }
          if (!fromContinent && emptyLeg.from) {
            fromContinent = await getContinentFromLocation(emptyLeg.from, 'airport');
          }

          if (!toContinent && emptyLeg.to_iata) {
            toContinent = await getContinentFromLocation(emptyLeg.to_iata, 'airport');
          }
          if (!toContinent && emptyLeg.to_city) {
            toContinent = await getContinentFromLocation(emptyLeg.to_city, 'city');
          }
          if (!toContinent && emptyLeg.to) {
            toContinent = await getContinentFromLocation(emptyLeg.to, 'airport');
          }

          const co2Data = calculateCO2Data(
            fromContinent || 'Unknown',
            toContinent || 'Unknown',
            emptyLeg.aircraft_type
          );

          return {
            ...emptyLeg,
            from_continent: fromContinent || '',
            to_continent: toContinent || '',
            ...co2Data
          };
        })
      );

      setAllEmptyLegs(emptyLegsWithCO2);

      // Set price extents based on all data
      if (emptyLegsWithCO2.length > 0) {
        const prices = emptyLegsWithCO2.map(item => item.price_usd).filter(price => price && price > 0);
        if (prices.length > 0) {
          const minPrice = Math.max(0, Math.min(...prices));
          const maxPrice = Math.max(...prices);
          setPriceExtents([minPrice, maxPrice]);
          // Set initial price range to full range if not yet set
          if (priceRange[0] === 0 && priceRange[1] === 100000) {
            setPriceRange([minPrice, maxPrice]);
          }
        }
      }

      // Initial filtering and pagination
      await applyFiltersAndPagination();
    } catch (error) {
      console.error('❌ Error loading empty legs:', error);
      setError(`Failed to load empty leg offers: ${(error as Error).message}`);
      setAllEmptyLegs([]);
      setEmptyLegs([]);
      setTotalOffers(0);
    } finally {
      setLoading(false);
      setIsChangingPage(false);
    }
  };

  // Apply filters and pagination to the loaded data
  const applyFiltersAndPagination = async () => {
    if (allEmptyLegs.length === 0) return;
    console.log('🔧 Applying filters and pagination...');

    // Apply filters
    const filteredData = await applyFilters(allEmptyLegs, filterCategory, searchTerm, priceRange, priceExtents);

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    setEmptyLegs(paginatedData);
    setTotalOffers(filteredData.length);
    setIsChangingPage(false); // Reset page changing state after pagination is applied

    console.log(`📄 Page ${currentPage}: showing ${paginatedData.length} of ${filteredData.length} total filtered results`);
  };

  const resetFilters = () => {
    setFilterCategory('all');
    setSearchTerm('');
    setPriceRange(priceExtents); // Reset to actual price range
    setCurrentPage(1);
    setError(null);
  };

  const resetPriceFilter = () => {
    setPriceRange(priceExtents); // Reset only price to actual price range
    setCurrentPage(1);
  };

  const paginate = (pageNumber: number) => {
    if (pageNumber === currentPage) return;
    setIsChangingPage(true);
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePriceChange = useCallback((newRange: [number, number]) => {
    setPriceRange(newRange);
    setCurrentPage(1);
  }, []);

  const filterEmptyLegsByCategory = useCallback((category: string) => {
    setFilterCategory(category);
    setCurrentPage(1);
  }, []);

  const handleEmptyLegClick = (emptyLeg: EmptyLegOffer) => {
    setSelectedEmptyLeg(emptyLeg);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEmptyLeg(null);
  };

  const handleLoginRequired = () => {
    setShowModal(false);
    setShowLoginModal(true);
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    if (selectedEmptyLeg) {
      setShowModal(true);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'TBD';

    // If it's a full datetime string, extract just the time part
    if (timeString.includes('T')) {
      try {
        const timeDate = new Date(timeString);
        return timeDate.toISOString().substring(11, 16) + ' UTC';
      } catch {
        return timeString;
      }
    }

    return timeString;
  };

  const formatDateTime = (dateString: string, timeString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const isToday = date.toDateString() === today.toDateString();
      const isTomorrow = date.toDateString() === tomorrow.toDateString();

      // Extract time from timeString if it's a full datetime
      let formattedTime = 'TBD';
      if (timeString) {
        if (timeString.includes('T')) {
          // It's a full datetime string, extract time part
          try {
            const timeDate = new Date(timeString);
            formattedTime = timeDate.toISOString().substring(11, 16) + ' UTC';
          } catch {
            formattedTime = timeString;
          }
        } else {
          // It's already just a time string
          formattedTime = timeString;
        }
      }

      if (isToday) {
        return `Today ${formattedTime}`;
      } else if (isTomorrow) {
        return `Tomorrow ${formattedTime}`;
      } else {
        return `${formatDate(dateString)} ${formattedTime}`;
      }
    } catch {
      return `${dateString} ${timeString || 'TBD'}`;
    }
  };

  const getDefaultImage = () => {
    return 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80';
  };

  // NFT Free eligibility check
  const isNFTFreeEligible = (emptyLeg: EmptyLegOffer) => {
    return emptyLeg.price_usd < 1500;
  };

  const totalPages = Math.ceil(totalOffers / itemsPerPage);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 pt-[88px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* HERO */}
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-4 tracking-tighter">
              Empty Leg Flights
            </h1>
            <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto font-light">
              Discover exceptional empty leg opportunities with up to 75% savings on luxury private aviation.
            </p>
          </div>

          {/* SEARCH */}
          <div className="max-w-md mx-auto mb-8 relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search destinations..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-500 focus:border-transparent shadow-sm bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* FILTERS */}
          <div className="mb-8">
            <div className="flex justify-center mb-4 lg:hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm"
              >
                <Filter size={16} />
                Filters
                {(filterCategory !== 'all' || searchTerm ||
                  priceRange[0] !== priceExtents[0] || priceRange[1] !== priceExtents[1]) && (
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  )}
              </button>
            </div>

            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
              <h3 className="text-xl font-medium text-gray-900">
                Available Empty Legs
                {totalOffers > 0 && (
                  <span className="text-sm font-normal text-gray-500 ml-3">
                    ({totalOffers} {totalOffers === 1 ? 'offer' : 'offers'})
                  </span>
                )}
              </h3>

              <div className={`${showFilters ? 'flex' : 'hidden'} lg:flex flex-wrap items-center gap-3`}>
                {/* Region selector dropdown */}
                <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200 shadow-sm">
                  <span className="text-sm text-gray-600 whitespace-nowrap">Region:</span>
                  <select
                    value={filterCategory}
                    onChange={(e) => filterEmptyLegsByCategory(e.target.value)}
                    className="text-sm font-medium text-gray-900 bg-transparent border-none outline-none cursor-pointer"
                  >
                    <option value="all">All Regions</option>
                    <option value="europe">Europe</option>
                    <option value="asia">Asia</option>
                    <option value="africa">Africa</option>
                    <option value="north america">North America</option>
                    <option value="south america">South America</option>
                    <option value="oceania">Oceania</option>
                  </select>
                </div>

                <PriceFilter
                  priceRange={priceRange}
                  onPriceChange={handlePriceChange}
                  minPrice={priceExtents[0]}
                  maxPrice={priceExtents[1]}
                  onReset={resetPriceFilter}
                />

                {/* Items per page selector */}
                <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200 shadow-sm">
                  <span className="text-sm text-gray-600 whitespace-nowrap">Per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="text-sm font-medium text-gray-900 bg-transparent border-none outline-none cursor-pointer"
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>
                </div>

                {/* View mode toggle - desktop only */}
                <div className="hidden lg:flex bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 rounded-lg transition-colors ${viewMode === 'list'
                      ? 'bg-gray-100 text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <List size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 rounded-lg transition-colors ${viewMode === 'grid'
                      ? 'bg-gray-100 text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <Grid size={20} />
                  </button>
                </div>
              </div>
            </div>

            {(filterCategory !== 'all' || searchTerm ||
              priceRange[0] !== priceExtents[0] || priceRange[1] !== priceExtents[1]) && (
                <div className="flex justify-center lg:justify-end">
                  <button
                    onClick={resetFilters}
                    className="text-sm text-gray-600 hover:text-gray-800 underline underline-offset-4 decoration-gray-300 hover:decoration-gray-600 transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
          </div>

          {/* RESULTS */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
              <p className="ml-4 text-gray-600">Loading empty leg offers...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-red-50 rounded-2xl border border-red-100">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <X size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Offers</h3>
              <p className="text-red-600 mb-6 leading-relaxed">{error}</p>
              <button
                onClick={loadAllEmptyLegs}
                className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          ) : emptyLegs.length > 0 ? (
            <div className="transition-opacity duration-300">
              {viewMode === 'grid' || window.innerWidth < 768 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {emptyLegs.map((emptyLeg) => (
                    <div
                      key={emptyLeg.id}
                      className={`bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group ${isNFTFreeEligible(emptyLeg)
                        ? 'border-2 border-green-400 hover:border-green-500 animate-pulse'
                        : 'border border-gray-100 hover:border-gray-200'
                        }`}
                      onClick={() => handleEmptyLegClick(emptyLeg)}
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={emptyLeg.image_url || getDefaultImage()}
                          alt={`${emptyLeg.from_iata || emptyLeg.from} to ${emptyLeg.to_iata || emptyLeg.to}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== getDefaultImage()) {
                              target.src = getDefaultImage();
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* NFT Free Badge */}
                        {isNFTFreeEligible(emptyLeg) && (
                          <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                            <Star size={12} className="fill-current" />
                            FREE with NFT
                          </div>
                        )}

                        {/* Time Badge */}
                        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
                          {formatDateTime(emptyLeg.departure_date, emptyLeg.departure_time)}
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold mb-2 text-gray-900">
                            {emptyLeg.from_city || emptyLeg.from} → {emptyLeg.to_city || emptyLeg.to}
                          </h3>
                          {/* Prominent IATA codes */}
                          <div className="flex items-center justify-center gap-2 bg-blue-50 rounded-lg p-2 mb-3">
                            <span className="text-sm font-bold text-blue-900">{emptyLeg.from_iata || emptyLeg.from}</span>
                            <ArrowRight size={14} className="text-blue-600" />
                            <span className="text-sm font-bold text-blue-900">{emptyLeg.to_iata || emptyLeg.to}</span>
                          </div>
                        </div>

                        {/* Light grey bubbles for details */}
                        <div className="grid grid-cols-2 gap-2 mb-6">
                          <div className="bg-gray-100 rounded-xl p-3 text-center">
                            <Plane size={16} className="mx-auto mb-1 text-gray-500" />
                            <div className="text-xs text-gray-700 font-medium">{emptyLeg.aircraft_type}</div>
                          </div>
                          <div className="bg-gray-100 rounded-xl p-3 text-center">
                            <Users size={16} className="mx-auto mb-1 text-gray-500" />
                            <div className="text-xs text-gray-700 font-medium">Up to {emptyLeg.capacity}</div>
                          </div>
                          <div className="bg-gray-100 rounded-xl p-3 text-center">
                            <Leaf size={16} className="mx-auto mb-1 text-gray-500" />
                            <div className="text-xs text-gray-700 font-medium">Carbon Neutral</div>
                          </div>
                          <div className="bg-gray-100 rounded-xl p-3 text-center">
                            <Percent size={16} className="mx-auto mb-1 text-gray-500" />
                            <div className="text-xs text-gray-700 font-medium">Save 75%</div>
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="space-y-2 mb-6">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 line-through">
                              Regular: USD {(emptyLeg.price_usd * 3).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`text-lg font-bold ${isNFTFreeEligible(emptyLeg) ? 'text-green-600' : 'text-gray-900'}`}>
                              {isNFTFreeEligible(emptyLeg) ? 'FREE for NFT holders' : `USD ${emptyLeg.price_usd?.toLocaleString()}`}
                            </span>
                          </div>
                        </div>

                        {/* Black "See Details" Button */}
                        <button
                          className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmptyLegClick(emptyLeg);
                          }}
                        >
                          See Details
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // List view
                <div className="space-y-4">
                  {emptyLegs.map((emptyLeg) => (
                    <div
                      key={emptyLeg.id}
                      className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group ${isNFTFreeEligible(emptyLeg)
                        ? 'border-2 border-green-400 hover:border-green-500 animate-pulse'
                        : 'border border-gray-100 hover:border-gray-200'
                        }`}
                      onClick={() => handleEmptyLegClick(emptyLeg)}
                    >
                      <div className="flex">
                        <div className="relative w-64 h-40 overflow-hidden flex-shrink-0">
                          <img
                            src={emptyLeg.image_url || getDefaultImage()}
                            alt={`${emptyLeg.from_iata || emptyLeg.from} to ${emptyLeg.to_iata || emptyLeg.to}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src !== getDefaultImage()) {
                                target.src = getDefaultImage();
                              }
                            }}
                          />

                          {isNFTFreeEligible(emptyLeg) && (
                            <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1">
                              <Star size={10} className="fill-current" />
                              FREE
                            </div>
                          )}
                        </div>
                        <div className="flex-1 p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                                {emptyLeg.from_city || emptyLeg.from}
                                <span className="text-sm text-gray-500 ml-1">({emptyLeg.from_iata || emptyLeg.from})</span>
                                {' → '}
                                {emptyLeg.to_city || emptyLeg.to}
                                <span className="text-sm text-gray-500 ml-1">({emptyLeg.to_iata || emptyLeg.to})</span>
                              </h3>
                            </div>
                            <div className="text-right ml-4 flex-shrink-0">
                              <div className="text-sm text-gray-500 line-through mb-1">
                                USD {(emptyLeg.price_usd * 3).toLocaleString()}
                              </div>
                              <div className={`text-xl font-bold ${isNFTFreeEligible(emptyLeg) ? 'text-green-600' : 'text-gray-900'}`}>
                                {isNFTFreeEligible(emptyLeg) ? 'FREE*' : `USD ${emptyLeg.price_usd?.toLocaleString()}`}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-4 mb-4">
                            <div className="bg-gray-100 rounded-lg p-3">
                              <div className="text-xs text-gray-500 font-medium mb-1">Date</div>
                              <div className="text-sm font-medium text-gray-900">{formatDate(emptyLeg.departure_date)}</div>
                            </div>
                            <div className="bg-gray-100 rounded-lg p-3">
                              <div className="text-xs text-gray-500 font-medium mb-1">Time</div>
                              <div className="text-sm font-medium text-gray-900">{formatTime(emptyLeg.departure_time)}</div>
                            </div>
                            <div className="bg-gray-100 rounded-lg p-3">
                              <div className="text-xs text-gray-500 font-medium mb-1">Aircraft</div>
                              <div className="text-sm font-medium text-gray-900 truncate">{emptyLeg.aircraft_type}</div>
                            </div>
                            <div className="bg-gray-100 rounded-lg p-3">
                              <div className="text-xs text-gray-500 font-medium mb-1">Seats</div>
                              <div className="text-sm font-medium text-gray-900">Up to {emptyLeg.capacity}</div>
                            </div>
                          </div>
                          <button
                            className="bg-black text-white px-6 py-2 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 ml-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEmptyLegClick(emptyLeg);
                            }}
                          >
                            See Details
                            <ArrowRight size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-16">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1 || isChangingPage}
                      className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowRight size={16} className="rotate-180" />
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = currentPage <= 3
                        ? i + 1
                        : currentPage >= totalPages - 2
                          ? totalPages - 4 + i
                          : currentPage - 2 + i;

                      if (page > totalPages || page < 1) return null;

                      return (
                        <button
                          key={page}
                          onClick={() => paginate(page)}
                          disabled={isChangingPage}
                          className={`px-4 py-3 rounded-xl font-medium transition-colors ${currentPage === page
                            ? 'bg-gray-900 text-white shadow-lg'
                            : 'border border-gray-200 text-gray-700 hover:bg-gray-50 bg-white'
                            } disabled:opacity-50`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages || isChangingPage}
                      className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plane size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Empty Legs Found</h3>
              <p className="text-gray-600 leading-relaxed">
                {filterCategory !== 'all' || searchTerm ||
                  priceRange[0] !== priceExtents[0] || priceRange[1] !== priceExtents[1]
                  ? 'Try adjusting your filters to see more results.'
                  : 'Check back later for new empty leg opportunities.'
                }
              </p>
              {(filterCategory !== 'all' || searchTerm ||
                priceRange[0] !== priceExtents[0] || priceRange[1] !== priceExtents[1]) && (
                  <button
                    onClick={resetFilters}
                    className="mt-4 text-gray-900 underline hover:no-underline underline-offset-4 decoration-gray-300 hover:decoration-gray-600 transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Modals */}
      {showModal && selectedEmptyLeg && (
        <FlightModal
          emptyLeg={selectedEmptyLeg}
          onClose={closeModal}
          isAuthenticated={isAuthenticated}
          onLoginRequired={handleLoginRequired}
        />
      )}

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
          onSuccess={handleLoginSuccess}
        />
      )}

      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
        />
      )}
    </div>
  );
};

export default EmptyLegOffers;
