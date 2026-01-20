import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from './LandingHeader';
import Footer from './Footer';
import { fetchEmptyLegs } from '../../services/emptyLegsService';

interface EmptyLegOffer {
  id: string;
  title: string;
  origin: string;
  destination?: string;
  price?: number;
  currency?: string;
  image_url?: string;
  aircraft_type?: string;
  departure_date?: string;
  passengers?: number;
}

interface AviationProps {
  setCurrentPage?: (page: string) => void;
}

function Aviation({ setCurrentPage }: AviationProps) {
  const navigate = useNavigate();
  const [emptyLegs, setEmptyLegs] = useState<EmptyLegOffer[]>([]);
  const [loadingEmptyLegs, setLoadingEmptyLegs] = useState(true);
  const [emptyLegIndexes, setEmptyLegIndexes] = useState([0, 0, 0, 0]);

  // Fetch empty legs from database
  useEffect(() => {
    const loadEmptyLegs = async () => {
      try {
        const result = await fetchEmptyLegs({ limit: 20 });
        setEmptyLegs(result.data);
      } catch (error) {
        console.error('Error fetching empty legs:', error);
      } finally {
        setLoadingEmptyLegs(false);
      }
    };

    loadEmptyLegs();
  }, []);

  // Animated empty legs rotation - each card switches at different intervals
  useEffect(() => {
    if (emptyLegs.length <= 4) return;

    const intervals = [4000, 6000, 5000, 7000]; // Different intervals for each card
    const legsPerCard = Math.ceil(emptyLegs.length / 4);

    const timers = intervals.map((interval, cardIndex) => {
      return setInterval(() => {
        setEmptyLegIndexes(prev => {
          const newIndexes = [...prev];
          newIndexes[cardIndex] = (newIndexes[cardIndex] + 1) % legsPerCard;
          return newIndexes;
        });
      }, interval);
    });

    return () => timers.forEach(timer => clearInterval(timer));
  }, [emptyLegs.length]);

  // Get empty leg for a specific card position
  const getEmptyLegForCard = (cardIndex: number) => {
    if (emptyLegs.length === 0) return null;
    const legsPerCard = Math.ceil(emptyLegs.length / 4);
    const startIndex = cardIndex * legsPerCard;
    const currentIndex = startIndex + (emptyLegIndexes[cardIndex] % legsPerCard);
    return emptyLegs[currentIndex] || emptyLegs[cardIndex] || emptyLegs[0];
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Satoshi', sans-serif" }}>
      <LandingHeader />

      {/* Hero Section - Clean title */}
      <section className="px-4 sm:px-8 pt-12 sm:pt-20 pb-8 max-w-6xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light mb-4 tracking-tight">
            <span className="text-gray-900">Aviation</span> <span className="text-gray-500">Services</span>
          </h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            Access to 16,000+ aircraft worldwide. From commercial flights to private jets,
            all with transparent pricing and crypto payments.
          </p>

          {/* Two Buttons */}
          <div className="flex gap-3 justify-center">
            <a
              href="mailto:bookings@privatecharterx.com?subject=Aviation Quote Request"
              className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Get a Quote
            </a>
            <button
              onClick={() => navigate('/chat?query=aviation&newChat=true')}
              className="px-4 py-2 bg-gray-900 rounded-full text-sm text-white hover:bg-gray-800 transition-colors"
            >
              Book by AI
            </button>
          </div>
        </div>
      </section>

      {/* Two Big Cards */}
      <section className="px-4 sm:px-8 py-8 sm:py-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Card 1 - Commercial Aviation */}
          <div className="group rounded-2xl overflow-hidden h-[400px] sm:h-[480px] flex flex-col bg-gray-100 border border-gray-200">
            {/* Image Area - Top */}
            <div className="relative h-[55%] overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{
                  backgroundImage: 'url(https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_e82354997b9109c97864b1fcd5f56776dr.png)'
                }}
              />
            </div>
            {/* Content Area - Bottom */}
            <div className="flex-1 bg-gray-100 p-6 sm:p-8">
              <h3 className="text-2xl sm:text-3xl font-light mb-3 tracking-tight">
                <span className="text-gray-900">Commercial</span> <span className="text-gray-500">Aviation</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4 max-w-md">
                Book flights with 300+ airlines worldwide. Economy to First Class,
                all payable with crypto. Best prices guaranteed.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">300+ Airlines</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">Crypto Payments</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">Best Price</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/flights')}
                  className="px-3 py-1.5 bg-gray-900 rounded-full text-xs text-white hover:bg-gray-800 transition-colors"
                >
                  Search Flights
                </button>
              </div>
            </div>
          </div>

          {/* Card 2 - Private Aviation */}
          <div className="group rounded-2xl overflow-hidden h-[400px] sm:h-[480px] flex flex-col bg-gray-100 border border-gray-200">
            {/* Image Area - Top */}
            <div className="relative h-[55%] overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{
                  backgroundImage: 'url(https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_a5109b014ee92cba42f48bfebce4fd92eg.png)'
                }}
              />
            </div>
            {/* Content Area - Bottom */}
            <div className="flex-1 bg-gray-100 p-6 sm:p-8">
              <h3 className="text-2xl sm:text-3xl font-light mb-3 tracking-tight">
                <span className="text-gray-900">Private</span> <span className="text-gray-500">Aviation</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4 max-w-md">
                Access 16,000+ private jets and helicopters. From light jets for short trips
                to ultra-long-range aircraft for intercontinental travel.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">16,000+ Aircraft</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">Jets & Helicopters</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">24/7 Service</span>
              </div>
              <div className="flex gap-2">
                <a
                  href="mailto:bookings@privatecharterx.com?subject=Private Jet Quote"
                  className="px-3 py-1.5 bg-gray-200 rounded-full text-xs text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  Get a Quote
                </a>
                <button
                  onClick={() => navigate('/chat?query=private+jet&newChat=true')}
                  className="px-3 py-1.5 bg-gray-900 rounded-full text-xs text-white hover:bg-gray-800 transition-colors"
                >
                  Book by AI
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Empty Legs Banner - Full Width */}
      <section className="px-4 sm:px-8 py-8 sm:py-12 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl sm:text-3xl font-light mb-2 tracking-tight">
                  <span className="text-gray-900">Empty</span> <span className="text-gray-500">Legs</span>
                </h3>
                <p className="text-sm text-gray-500 max-w-md">
                  Save up to 75% on repositioning flights. One-way private jet flights at a fraction of the regular charter price.
                </p>
              </div>
              <button
                onClick={() => navigate('/empty-legs')}
                className="px-3 py-1.5 bg-gray-900 rounded-full text-xs text-white hover:bg-gray-800 transition-colors"
              >
                View All
              </button>
            </div>

            {/* Empty Legs Cards Grid - 2 rows x 4 columns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {loadingEmptyLegs ? (
                // Loading skeleton
                [...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-[180px]" />
                ))
              ) : emptyLegs.length > 0 ? (
                emptyLegs.slice(0, 8).map((leg, index) => (
                  <div
                    key={leg.id || index}
                    onClick={() => navigate('/empty-legs')}
                    className="group relative rounded-xl overflow-hidden cursor-pointer h-[180px] transition-all duration-500"
                  >
                    {/* Background Image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                      style={{
                        backgroundImage: `url(${leg.image_url || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'})`
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* Content */}
                    <div className="absolute inset-0 p-3 flex flex-col justify-end">
                      <div className="flex items-center gap-1 text-white text-xs mb-1">
                        <span className="font-medium">{leg.origin?.substring(0, 3).toUpperCase()}</span>
                        <span className="text-white/60">→</span>
                        <span className="font-medium">{leg.destination?.substring(0, 3).toUpperCase() || 'TBD'}</span>
                      </div>
                      <p className="text-white/70 text-[10px] line-clamp-1 mb-2">{leg.aircraft_type || 'Private Jet'}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium text-sm">
                          {leg.price ? `$${leg.price.toLocaleString()}` : 'On Request'}
                        </span>
                        <span className="bg-green-500 text-white px-1.5 py-0.5 rounded text-[8px] font-medium">
                          -75%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // No empty legs available
                <div className="col-span-4 flex items-center justify-center text-gray-400 text-sm py-12">
                  No empty legs available at the moment
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* More Services - Same card style */}
      <section className="px-4 sm:px-8 py-8 sm:py-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Helicopter */}
          <div className="group rounded-2xl overflow-hidden h-[400px] sm:h-[480px] flex flex-col bg-gray-100 border border-gray-200">
            <div className="relative h-[55%] overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{
                  backgroundImage: 'url(https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_62421c53d9b112ab8db4a272d1420bd0eg.png)'
                }}
              />
            </div>
            <div className="flex-1 bg-gray-100 p-6 sm:p-8">
              <h3 className="text-2xl sm:text-3xl font-light mb-3 tracking-tight">
                <span className="text-gray-900">Helicopter</span> <span className="text-gray-500">Charter</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4 max-w-md">
                City-to-city transfers, scenic tours, and event transportation.
                Perfect for short-range travel and accessing remote locations.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">City Transfers</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">Scenic Tours</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">Events</span>
              </div>
              <div className="flex gap-2">
                <a
                  href="mailto:bookings@privatecharterx.com?subject=Helicopter Charter Inquiry"
                  className="px-3 py-1.5 bg-gray-200 rounded-full text-xs text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  Get a Quote
                </a>
                <button
                  onClick={() => navigate('/chat?query=helicopter&newChat=true')}
                  className="px-3 py-1.5 bg-gray-900 rounded-full text-xs text-white hover:bg-gray-800 transition-colors"
                >
                  Book by AI
                </button>
              </div>
            </div>
          </div>

          {/* Group Charter */}
          <div className="group rounded-2xl overflow-hidden h-[400px] sm:h-[480px] flex flex-col bg-gray-100 border border-gray-200">
            <div className="relative h-[55%] overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{
                  backgroundImage: 'url(https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_a03676b0c23fce485f841fbe26bcc9ffeg%20%281%29.png)'
                }}
              />
            </div>
            <div className="flex-1 bg-gray-100 p-6 sm:p-8">
              <h3 className="text-2xl sm:text-3xl font-light mb-3 tracking-tight">
                <span className="text-gray-900">Group</span> <span className="text-gray-500">Charter</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4 max-w-md">
                Tailored solutions for corporate events, sports teams, and large groups.
                Custom itineraries with dedicated service coordinators.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">10+ Passengers</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">Corporate</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">Sports Teams</span>
              </div>
              <div className="flex gap-2">
                <a
                  href="mailto:bookings@privatecharterx.com?subject=Group Charter Inquiry"
                  className="px-3 py-1.5 bg-gray-200 rounded-full text-xs text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  Get a Quote
                </a>
                <button
                  onClick={() => navigate('/chat?query=group+charter&newChat=true')}
                  className="px-3 py-1.5 bg-gray-900 rounded-full text-xs text-white hover:bg-gray-800 transition-colors"
                >
                  Book by AI
                </button>
              </div>
            </div>
          </div>

          {/* Cargo Charter */}
          <div className="group rounded-2xl overflow-hidden h-[400px] sm:h-[480px] flex flex-col bg-gray-100 border border-gray-200">
            <div className="relative h-[55%] overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{
                  backgroundImage: 'url(https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_6b293b36de4a53d812a4def7886fac81eg.png)'
                }}
              />
            </div>
            <div className="flex-1 bg-gray-100 p-6 sm:p-8">
              <h3 className="text-2xl sm:text-3xl font-light mb-3 tracking-tight">
                <span className="text-gray-900">Cargo</span> <span className="text-gray-500">Charter</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4 max-w-md">
                Time-critical freight solutions for urgent deliveries. Express air cargo
                services with dedicated aircraft and flexible scheduling.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">Express Delivery</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">Time-Critical</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">Dedicated Aircraft</span>
              </div>
              <div className="flex gap-2">
                <a
                  href="mailto:bookings@privatecharterx.com?subject=Cargo Charter Inquiry"
                  className="px-3 py-1.5 bg-gray-900 rounded-full text-xs text-white hover:bg-gray-800 transition-colors"
                >
                  Get a Quote
                </a>
              </div>
            </div>
          </div>

          {/* MEDEVAC */}
          <div className="group rounded-2xl overflow-hidden h-[400px] sm:h-[480px] flex flex-col bg-gray-100 border border-gray-200">
            <div className="relative h-[55%] overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{
                  backgroundImage: 'url(https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_298998b167301be944d4ff7fb3bc74e5eg.png)'
                }}
              />
            </div>
            <div className="flex-1 bg-gray-100 p-6 sm:p-8">
              <h3 className="text-2xl sm:text-3xl font-light mb-3 tracking-tight">
                <span className="text-gray-900">MEDEVAC</span> <span className="text-gray-500">Flights</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4 max-w-md">
                Medical evacuation and air ambulance services. 24/7 emergency response
                with fully equipped aircraft and medical personnel.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">24/7 Emergency</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">Medical Team</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">ICU Equipment</span>
              </div>
              <div className="flex gap-2">
                <a
                  href="mailto:bookings@privatecharterx.com?subject=MEDEVAC Inquiry"
                  className="px-3 py-1.5 bg-gray-200 rounded-full text-xs text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  Get a Quote
                </a>
                <button
                  onClick={() => navigate('/chat?query=medevac+medical+evacuation&newChat=true')}
                  className="px-3 py-1.5 bg-gray-900 rounded-full text-xs text-white hover:bg-gray-800 transition-colors"
                >
                  Book by AI
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Contact Section */}
      <section className="px-4 sm:px-8 py-12 sm:py-16 max-w-6xl mx-auto text-center">
        <h3 className="text-2xl sm:text-3xl font-light mb-3 tracking-tight">
          <span className="text-gray-900">Have questions?</span> <span className="text-gray-500">Get in touch</span>
        </h3>
        <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
          Our aviation experts are available 24/7 to help you plan your next flight.
        </p>
        <a
          href="mailto:bookings@privatecharterx.com?subject=Aviation Inquiry"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 rounded-full text-sm text-white hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Contact Us
        </a>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Aviation;
