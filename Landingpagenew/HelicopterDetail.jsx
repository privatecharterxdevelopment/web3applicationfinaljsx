import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { Search, ShoppingBag, Settings, User, Shield, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { web3Service } from '../../lib/web3';

const HelicopterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const [helicopter, setHelicopter] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [hasNFT, setHasNFT] = useState(false);
  const [nftDiscount, setNftDiscount] = useState(0);
  const [isCheckingNFT, setIsCheckingNFT] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [passengers, setPassengers] = useState(1);
  const [flightDuration, setFlightDuration] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');

  useEffect(() => {
    fetchHelicopter();
  }, [id]);

  const fetchHelicopter = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('helicopter_charters')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setHelicopter(data);
    } catch (error) {
      console.error('Error fetching helicopter:', error);
      navigate('/tokenized-assets');
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
        alert(`✅ NFT Membership Detected!\n\nYou have ${eligibility.discountPercent}% discount on all flights.`);
      } else {
        alert('❌ No NFT Membership found in your wallet.\n\nGet your membership at:\nhttps://opensea.io/collection/privatecharterx-membership');
      }
    } catch (error) {
      console.error('Error checking NFT:', error);
      alert('Error checking NFT membership. Please try again.');
    } finally {
      setIsCheckingNFT(false);
    }
  };

  const requestFlight = async () => {
    if (!isConnected) {
      open();
      return;
    }

    try {
      const hourlyRate = helicopter.price ? parseFloat(helicopter.price) : 0;
      const totalPrice = hourlyRate * flightDuration;
      const discountedPrice = hasNFT ? totalPrice * (1 - nftDiscount / 100) : totalPrice;

      console.log(`Helicopter Charter Request: ${helicopter.name}`);
      console.log(`Hourly Rate: €${hourlyRate}`);
      console.log(`Duration: ${flightDuration} hours`);
      console.log(`Total: €${totalPrice}`);
      console.log(`Has NFT: ${hasNFT}`);
      console.log(`Discount: ${nftDiscount}%`);
      console.log(`Final Price: €${discountedPrice}`);

      if (hasNFT) {
        alert(`✈️ Charter Requested with ${nftDiscount}% Discount!\n\n${helicopter.name}\nHourly Rate: €${hourlyRate}\nDuration: ${flightDuration} hours\nOriginal Price: €${totalPrice}\nYour Price: €${discountedPrice.toFixed(2)}\n\nYour request has been saved to your dashboard!`);
      } else {
        alert(`✈️ Charter Requested!\n\n${helicopter.name}\nHourly Rate: €${hourlyRate}\nDuration: ${flightDuration} hours\nTotal Price: €${totalPrice}\n\nYour request has been saved to your dashboard!`);
      }
    } catch (error) {
      console.error('Request failed:', error);
      alert('Charter request failed. Please try again.');
    }
  };

  const hourlyRate = helicopter && helicopter.price ? parseFloat(helicopter.price) : 0;
  const totalPrice = hourlyRate * flightDuration;
  const finalPrice = hasNFT ? totalPrice * (1 - nftDiscount / 100) : totalPrice;

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
                  placeholder="Search helicopters"
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
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex space-x-8">
            <button
              onClick={() => navigate('/tokenized-assets')}
              className="py-4 text-sm text-gray-600 border-b-2 border-transparent hover:text-black"
            >
              ← Back to Helicopters
            </button>
            <button className="py-4 text-sm text-black border-b-2 border-black">◐ Helicopter Charter</button>
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
              <p className="mt-4 text-sm text-gray-600">Loading helicopter details...</p>
            </div>
          </div>
        )}

        {/* Helicopter Header Card */}
        {!isLoading && helicopter && (
        <>
        <div className="bg-white rounded-lg border border-gray-300 mb-6">
          <div className="flex h-80">
            {/* Left side - Helicopter Image */}
            <div className="w-2/5 relative bg-gray-100">
              {helicopter.image_url_main ? (
                <img
                  src={helicopter.image_url_main}
                  alt={helicopter.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-6xl mb-2">🚁</div>
                    <div className="text-sm">{helicopter.name}</div>
                  </div>
                </div>
              )}

              <div className="absolute top-3 left-3 flex space-x-1.5">
                <div className="bg-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  <span>Available</span>
                </div>
                <div className="bg-white px-2 py-1 rounded text-xs font-medium">◐ Helicopter</div>
              </div>
            </div>

            {/* Right side - Helicopter info */}
            <div className="flex-1 p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">PCX</span>
                <div className="flex space-x-2">
                  <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">⎘</button>
                  <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">◉</button>
                </div>
              </div>

              <h1 className="text-2xl font-semibold mb-4">{helicopter.name}</h1>
              <p className="text-sm text-gray-600 mb-4">
                {helicopter.type ? helicopter.type.substring(0, 80) + '...' : 'Helicopter Charter'}
              </p>

              {/* Tab Navigation */}
              <div className="flex space-x-6 border-b border-gray-300 mb-5">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-3 text-xs relative ${activeTab === 'details' ? 'text-black' : 'text-gray-600'}`}
                >
                  Details
                  {activeTab === 'details' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('specifications')}
                  className={`pb-3 text-xs relative ${activeTab === 'specifications' ? 'text-black' : 'text-gray-600'}`}
                >
                  Specifications
                  {activeTab === 'specifications' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('operator')}
                  className={`pb-3 text-xs relative ${activeTab === 'operator' ? 'text-black' : 'text-gray-600'}`}
                >
                  Operator
                  {activeTab === 'operator' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
              </div>

              {/* Key metrics */}
              <div className="flex justify-between mt-auto mb-5">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Hourly Rate</span>
                  <span className="text-sm font-semibold text-black">€{helicopter.price ? parseFloat(helicopter.price).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Capacity</span>
                  <span className="text-sm font-semibold text-black">{helicopter.capacity || 'N/A'} pax</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Location</span>
                  <span className="text-sm font-semibold text-black">{helicopter.location || 'Global'}</span>
                </div>
              </div>

              {/* Links */}
              <div className="flex space-x-4 pt-4 border-t border-gray-100 text-xs">
                <button className="text-gray-600 hover:text-black">Aircraft specs ↗</button>
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
                  <h3 className="text-base font-semibold mb-4">Helicopter Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Model</div>
                      <div className="text-sm font-semibold text-black">{helicopter.name}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Status</div>
                      <div className="text-sm font-semibold text-black">{helicopter.status === 'available' ? 'Available' : 'Contact us'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Base Location</div>
                      <div className="text-sm font-semibold text-black">{helicopter.location || 'Multiple locations'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Passengers</div>
                      <div className="text-sm font-semibold text-black">{helicopter.capacity || 'N/A'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Hourly Rate</div>
                      <div className="text-sm font-semibold text-black">€{helicopter.price ? parseFloat(helicopter.price).toLocaleString() : 'N/A'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Range</div>
                      <div className="text-sm font-semibold text-black">{helicopter.range ? `${helicopter.range} km` : 'N/A'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Cruise Speed</div>
                      <div className="text-sm font-semibold text-black">{helicopter.speed ? `${helicopter.speed} km/h` : 'N/A'}</div>
                    </div>
                  </div>

                  {helicopter.type && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold mb-3">Description</h4>
                      <p className="text-xs text-gray-700 leading-relaxed">{helicopter.type}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'specifications' && (
                <div>
                  <h3 className="text-base font-semibold mb-4">Technical Specifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Engine Type</div>
                      <div className="text-sm font-semibold text-black">{helicopter.engine_type || 'Turbine'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Cruise Speed</div>
                      <div className="text-sm font-semibold text-black">{helicopter.cruise_speed || 'N/A'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Max Range</div>
                      <div className="text-sm font-semibold text-black">{helicopter.range || helicopter.max_range || 'N/A'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Flight Time</div>
                      <div className="text-sm font-semibold text-black">{helicopter.flight_time || 'N/A'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Baggage Capacity</div>
                      <div className="text-sm font-semibold text-black">{helicopter.baggage_capacity || 'Standard'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Year of Manufacture</div>
                      <div className="text-sm font-semibold text-black">{helicopter.year_of_manufacture || 'N/A'}</div>
                    </div>
                  </div>

                  {helicopter.features && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold mb-3">Features & Amenities</h4>
                      <p className="text-xs text-gray-700 leading-relaxed">{helicopter.features}</p>
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
                      <div className="text-sm font-semibold text-black">{helicopter.operator || 'To be disclosed'}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Certification</div>
                      <div className="text-sm font-semibold text-black">Part 135 Certified</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Safety Rating</div>
                      <div className="text-sm font-semibold text-black">★★★★★</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Insurance</div>
                      <div className="text-sm font-semibold text-black">$50M Liability</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Base Location</div>
                      <div className="text-sm font-semibold text-black">{helicopter.location || 'Global'}</div>
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
            </div>
          </div>

          {/* Right Column - Booking Widget */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg border border-gray-300 p-5 sticky top-6">
              <h3 className="text-base font-semibold mb-4">Book This Helicopter</h3>

              {/* Flight Summary */}
              <div className="space-y-3 mb-5">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Hourly Rate</span>
                  <span className="text-xs font-semibold text-black">€{hourlyRate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Max Capacity</span>
                  <span className="text-xs font-semibold text-black">{helicopter.capacity || 'N/A'} pax</span>
                </div>
              </div>

              {/* Booking Details Form */}
              <div className="mb-5 pb-4 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-black mb-4">Charter Details</h4>

                <div className="space-y-3">
                  {/* Passengers */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Passengers</label>
                    <div className="flex items-center justify-between border border-gray-300 rounded px-3 py-2">
                      <button
                        onClick={() => setPassengers(Math.max(1, passengers - 1))}
                        className="text-gray-600 hover:text-black w-6 h-6 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="text-sm font-semibold">{passengers}</span>
                      <button
                        onClick={() => setPassengers(Math.min(helicopter.capacity || helicopter.passengers || 10, passengers + 1))}
                        className="text-gray-600 hover:text-black w-6 h-6 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Flight Duration */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Flight Duration (hours)</label>
                    <div className="flex items-center justify-between border border-gray-300 rounded px-3 py-2">
                      <button
                        onClick={() => setFlightDuration(Math.max(0.5, flightDuration - 0.5))}
                        className="text-gray-600 hover:text-black w-6 h-6 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="text-sm font-semibold">{flightDuration}</span>
                      <button
                        onClick={() => setFlightDuration(flightDuration + 0.5)}
                        className="text-gray-600 hover:text-black w-6 h-6 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Special Requests (optional)</label>
                    <textarea
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Landing site preferences, special equipment, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
                      rows="3"
                    />
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
                    <p className="text-xs text-gray-700">{nftDiscount}% discount on all charters</p>
                  </div>
                </div>
              )}

              {/* Total Price */}
              <div className="p-3 bg-gray-50 rounded mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Hourly Rate:</span>
                  <span className="font-semibold text-black">€{helicopter.hourly_rate?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Duration:</span>
                  <span className="font-semibold text-black">{flightDuration} hours</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Subtotal:</span>
                  <span className="font-semibold text-black">€{totalPrice.toLocaleString()}</span>
                </div>
                {hasNFT && (
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">NFT Discount ({nftDiscount}%):</span>
                    <span className="font-semibold text-black">-€{(totalPrice * nftDiscount / 100).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 mt-2">
                  <span className="text-black">Total:</span>
                  <span className="text-black">€{finalPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Request Charter Button */}
              <button
                onClick={requestFlight}
                className="w-full bg-black text-white py-3 px-4 rounded text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Request Charter
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

              {/* Additional Info */}
              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex items-start space-x-2 mb-2">
                  <span className="text-green-500">✓</span>
                  <span>Weather-dependent operations</span>
                </div>
                <div className="flex items-start space-x-2 mb-2">
                  <span className="text-green-500">✓</span>
                  <span>Flexible cancellation policy</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>24/7 operations support</span>
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
                <button onClick={() => navigate('/services')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Helicopter Charter</button>
                <button onClick={() => navigate('/services')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Empty Legs</button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HelicopterDetail;
