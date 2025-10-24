import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { Search, ShoppingBag, Settings, User, Shield, Plane, Clock, MapPin, Users, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { web3Service } from '../../lib/web3';

const JetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();

  const [jet, setJet] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [hasNFT, setHasNFT] = useState(false);
  const [nftDiscount, setNftDiscount] = useState(0);
  const [isCheckingNFT, setIsCheckingNFT] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchJet();
  }, [id]);

  const fetchJet = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('jets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Jet not found');

      setJet(data);
    } catch (error) {
      console.error('Error fetching jet:', error);
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
        alert(`✅ NFT Membership Detected!\n\nYou have ${eligibility.discountPercent}% discount on all charter bookings.`);
      } else {
        alert('❌ No NFT Membership found in your wallet.\n\nGet your membership at:\nhttps://opensea.io/collection/privatecharterx-membership');
      }
    } catch (error) {
      console.error('Error checking NFT:', error);
    } finally {
      setIsCheckingNFT(false);
    }
  };

  const requestQuote = async () => {
    if (!isConnected) {
      open();
      return;
    }
    try {
      const { error } = await supabase.from('charter_requests').insert([{
        wallet_address: address,
        jet_id: jet.id,
        aircraft_model: jet.aircraft_model,
        manufacturer: jet.manufacturer,
        has_nft: hasNFT,
        nft_discount: nftDiscount,
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;

      alert('✅ Quote request submitted!\n\nOur concierge team will contact you within 24 hours with pricing and availability.');
    } catch (error) {
      console.error('Error submitting quote request:', error);
      alert('❌ Failed to submit quote request. Please try again.');
    }
  };

  const getAllJetImages = () => {
    if (!jet) return [];
    const images = [];
    if (jet.image_url) images.push(jet.image_url);
    if (jet.image_url_1) images.push(jet.image_url_1);
    if (jet.image_url_2) images.push(jet.image_url_2);
    if (jet.image_url_3) images.push(jet.image_url_3);
    if (jet.image_url_4) images.push(jet.image_url_4);
    if (jet.image_url_5) images.push(jet.image_url_5);
    return images;
  };

  const handlePrevImage = () => {
    const images = getAllJetImages();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    const images = getAllJetImages();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const jetImages = getAllJetImages();
  const currentImage = jetImages[currentImageIndex] || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800';

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
                  placeholder="Search jets"
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
              ← Back to Jets
            </button>
            <button className="py-4 text-sm text-black border-b-2 border-black">✈ Jet Details</button>
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
              <p className="mt-4 text-sm text-gray-600">Loading jet details...</p>
            </div>
          </div>
        )}

        {/* Jet Header Card */}
        {!isLoading && jet && (
        <>
        <div className="bg-white rounded-lg border border-gray-300 mb-6">
          <div className="flex h-80">
            {/* Left side - Aircraft Image with Gallery */}
            <div className="w-2/5 relative bg-gray-100">
              <img
                src={currentImage}
                alt={jet.aircraft_model}
                className="w-full h-full object-cover"
              />

              {jetImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-black w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg text-sm"
                  >
                    ←
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-black w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg text-sm"
                  >
                    →
                  </button>
                  <div className="absolute bottom-3 right-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                    {currentImageIndex + 1} / {jetImages.length}
                  </div>
                </>
              )}

              <div className="absolute top-3 left-3 flex space-x-1.5">
                <div className="bg-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  <span>Available</span>
                </div>
                <div className="bg-white px-2 py-1 rounded text-xs font-medium">✈ Private Jet</div>
              </div>
            </div>

            {/* Right side - Jet info */}
            <div className="flex-1 p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">PCX JETS</span>
                <div className="flex space-x-2">
                  <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">⎘</button>
                  <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">◉</button>
                </div>
              </div>

              <h1 className="text-2xl font-semibold mb-4">
                {jet.aircraft_model}
              </h1>
              <p className="text-sm text-gray-600 mb-4">
                {jet.manufacturer} · {jet.aircraft_category}
              </p>

              {/* Tab Navigation */}
              <div className="flex space-x-6 border-b border-gray-300 mb-5">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-3 text-xs relative ${activeTab === 'details' ? 'text-black' : 'text-gray-600'}`}
                >
                  Aircraft Details
                  {activeTab === 'details' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`pb-3 text-xs relative ${activeTab === 'specs' ? 'text-black' : 'text-gray-600'}`}
                >
                  Specifications
                  {activeTab === 'specs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('pricing')}
                  className={`pb-3 text-xs relative ${activeTab === 'pricing' ? 'text-black' : 'text-gray-600'}`}
                >
                  Pricing
                  {activeTab === 'pricing' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
              </div>

              {/* Key metrics */}
              <div className="flex justify-between mt-auto mb-5">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Price Range</span>
                  <span className="text-sm font-semibold text-black">{jet.price_range}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Capacity</span>
                  <span className="text-sm font-semibold text-black">{jet.capacity} passengers</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Range</span>
                  <span className="text-sm font-semibold text-black">{jet.range}</span>
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
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-black mb-3">Aircraft Description</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {jet.description || `The ${jet.aircraft_model} by ${jet.manufacturer} is a premium private jet offering exceptional comfort and performance. This ${jet.aircraft_category} provides an outstanding flight experience with state-of-the-art amenities and technology.`}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                    <div className="flex items-start space-x-3">
                      <Plane className="text-gray-600 mt-0.5" size={20} />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Manufacturer</p>
                        <p className="text-sm font-semibold text-black">{jet.manufacturer}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Users className="text-gray-600 mt-0.5" size={20} />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Passenger Capacity</p>
                        <p className="text-sm font-semibold text-black">{jet.capacity} passengers</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="text-gray-600 mt-0.5" size={20} />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Range</p>
                        <p className="text-sm font-semibold text-black">{jet.range}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Calendar className="text-gray-600 mt-0.5" size={20} />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Category</p>
                        <p className="text-sm font-semibold text-black">{jet.aircraft_category}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-black mb-4">Technical Specifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500 mb-1">Aircraft Model</p>
                      <p className="text-sm font-semibold text-black">{jet.aircraft_model}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500 mb-1">Category</p>
                      <p className="text-sm font-semibold text-black">{jet.aircraft_category}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500 mb-1">Capacity</p>
                      <p className="text-sm font-semibold text-black">{jet.capacity} passengers</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500 mb-1">Range</p>
                      <p className="text-sm font-semibold text-black">{jet.range}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500 mb-1">Manufacturer</p>
                      <p className="text-sm font-semibold text-black">{jet.manufacturer}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500 mb-1">Price Range</p>
                      <p className="text-sm font-semibold text-black">{jet.price_range}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'pricing' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-black mb-4">Charter Pricing</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-gray-600">Estimated Price Range</span>
                      <span className="text-lg font-bold text-black">{jet.price_range}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Final pricing depends on route, flight time, positioning, and additional services. Request a quote for exact pricing.
                    </p>
                  </div>
                  {hasNFT && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-semibold text-green-800 mb-1">✅ NFT Member Discount</p>
                      <p className="text-xs text-green-700">{nftDiscount}% off all charter bookings</p>
                    </div>
                  )}
                </div>
              )}

              {/* Image Gallery */}
              {jetImages.length > 1 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-black mb-3">Gallery</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {jetImages.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`${jet.aircraft_model} ${idx + 1}`}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-full h-24 object-cover rounded cursor-pointer transition-all ${
                          idx === currentImageIndex ? 'ring-2 ring-black' : 'opacity-60 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Booking Widget */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg border border-gray-300 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-black mb-4">Request Charter Quote</h3>

              {hasNFT && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs font-semibold text-green-800">✅ NFT Member</p>
                  <p className="text-xs text-green-700 mt-1">{nftDiscount}% discount applied</p>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Aircraft</span>
                    <span className="text-sm font-semibold text-black">{jet.aircraft_model}</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Capacity</span>
                    <span className="text-sm font-semibold text-black">{jet.capacity} pax</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Est. Price Range</span>
                    <span className="text-sm font-semibold text-black">{jet.price_range}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={requestQuote}
                className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all mb-3"
              >
                Request Quote
              </button>

              <button
                onClick={checkNFTMembership}
                disabled={isCheckingNFT}
                className="w-full bg-white border-2 border-black text-black py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                {isCheckingNFT ? 'Checking...' : hasNFT ? '✅ NFT Member' : 'Check NFT Membership'}
              </button>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Our concierge team will contact you within 24 hours with exact pricing and availability. NFT members receive priority service and exclusive discounts.
                </p>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default JetDetail;
