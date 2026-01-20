import React, { useState, useEffect } from 'react';
import { X, Plane, MapPin, Clock, Users, ChevronDown, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface FlightOp {
  id: string;
  title: string;
  description: string;
  origin: string;
  destination: string;
  price: number;
  currency: string;
  departure_date: string;
  image_url: string;
  aircraft_type: string;
  passengers: number;
  duration: string;
  is_featured: boolean;
}

interface FlightBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: FlightOp | null;
  bidCount: number;
  onBidSuccess?: () => void;
}

// Jet categories with their models
const jetCategories: Record<string, string[]> = {
  'Light Jet': [
    'Any Light Jet',
    'Citation CJ2',
    'Citation CJ3',
    'Citation CJ4',
    'Phenom 100',
    'Phenom 300',
    'Learjet 45',
    'Learjet 75',
    'HondaJet',
    'Pilatus PC-24',
  ],
  'Midsize Jet': [
    'Any Midsize Jet',
    'Citation XLS',
    'Citation XLS+',
    'Hawker 800XP',
    'Hawker 900XP',
    'Learjet 60',
    'Learjet 60XR',
    'Gulfstream G150',
    'Praetor 500',
  ],
  'Super Midsize Jet': [
    'Any Super Midsize Jet',
    'Citation Sovereign',
    'Citation Latitude',
    'Citation Longitude',
    'Challenger 350',
    'Gulfstream G280',
    'Praetor 600',
    'Legacy 500',
  ],
  'Heavy Jet': [
    'Any Heavy Jet',
    'Challenger 604',
    'Challenger 605',
    'Challenger 650',
    'Gulfstream G450',
    'Gulfstream GIV-SP',
    'Falcon 900',
    'Falcon 900LX',
    'Legacy 600',
    'Legacy 650',
  ],
  'Ultra Long Range': [
    'Any Ultra Long Range',
    'Gulfstream G550',
    'Gulfstream G650',
    'Gulfstream G650ER',
    'Gulfstream G700',
    'Global 5000',
    'Global 6000',
    'Global 7500',
    'Falcon 7X',
    'Falcon 8X',
  ],
};

// Get category from aircraft type
const getCategoryFromType = (aircraftType: string): string => {
  const type = aircraftType?.toLowerCase() || '';
  if (type.includes('ultra') || type.includes('long range')) return 'Ultra Long Range';
  if (type.includes('heavy')) return 'Heavy Jet';
  if (type.includes('super mid')) return 'Super Midsize Jet';
  if (type.includes('midsize') || type.includes('mid-size') || type.includes('mid size')) return 'Midsize Jet';
  if (type.includes('light')) return 'Light Jet';
  if (type.includes('gulfstream g6') || type.includes('global') || type.includes('falcon 7') || type.includes('falcon 8')) return 'Ultra Long Range';
  if (type.includes('challenger') || type.includes('gulfstream g4') || type.includes('falcon 9') || type.includes('legacy 6')) return 'Heavy Jet';
  if (type.includes('citation sovereign') || type.includes('citation lat') || type.includes('citation long') || type.includes('praetor 6') || type.includes('g280')) return 'Super Midsize Jet';
  if (type.includes('citation xls') || type.includes('hawker') || type.includes('learjet 6') || type.includes('praetor 5')) return 'Midsize Jet';
  return 'Light Jet';
};

// HD City images mapping
const getCityImage = (destination: string): string => {
  const cityImages: Record<string, string> = {
    'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80',
    'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80',
    'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80',
    'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80',
    'miami': 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=1200&q=80',
    'los angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=1200&q=80',
    'monaco': 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/heromonaco.webp',
    'geneva': 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/589bc75d1b83a01b8588e7b6d12895b8ff254934-1600x1066.jpg',
    'aspen': 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/download.jpeg',
    'st moritz': 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/Things-to-do-in-St-Moritz.jpeg',
    'nashville': 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/nashville.webp',
    'pittsburgh': 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/Downtown%20Pittsburgh_AdobeStock_221230893_licensed_c_rs1000px.jpg',
    'nantucket': 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/660c3c914ed7bbfb9ce64ef7_Nantucket%20Lighthouse.jpeg',
    'frankfurt': 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/GettyImages-601823765.jpg',
  };

  const destLower = destination?.toLowerCase() || '';
  for (const [city, url] of Object.entries(cityImages)) {
    if (destLower.includes(city)) return url;
  }
  return 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80';
};

export default function FlightBidModal({ isOpen, onClose, route, bidCount, onBidSuccess }: FlightBidModalProps) {
  const { user } = useAuth();
  const [bidAmount, setBidAmount] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedJetModel, setSelectedJetModel] = useState('');
  const [showJetDropdown, setShowJetDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [error, setError] = useState('');

  const jetCategory = route ? getCategoryFromType(route.aircraft_type) : 'Light Jet';
  const availableModels = jetCategories[jetCategory] || jetCategories['Light Jet'];

  useEffect(() => {
    if (isOpen && route) {
      setBidAmount(route.price?.toString() || '');
      setDepartureDate('');
      setPassengers(1);
      setNotes('');
      setSelectedJetModel(availableModels[0] || '');
      setBidSuccess(false);
      setError('');
    }
  }, [isOpen, route]);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmitBid = async () => {
    if (!user) {
      setError('Please log in to place a bid');
      return;
    }
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      setError('Please enter a valid bid amount');
      return;
    }
    if (!departureDate) {
      setError('Please select a departure date');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('flight_bids')
        .insert({
          user_id: user.id,
          route_id: route?.id,
          bid_amount: parseFloat(bidAmount),
          currency: 'USD',
          passengers: passengers,
          departure_date: departureDate,
          notes: selectedJetModel !== availableModels[0]
            ? `Preferred Aircraft: ${selectedJetModel}${notes ? '\n' + notes : ''}`
            : notes || null,
          status: 'pending',
        });

      if (insertError) throw insertError;
      setBidSuccess(true);
      onBidSuccess?.();
      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      console.error('Error submitting bid:', err);
      setError(err.message || 'Failed to submit bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !route) return null;

  const imageUrl = route.image_url || getCityImage(route.destination);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 pointer-events-auto flex flex-col max-h-[calc(100vh-4rem)]"
          onClick={(e) => e.stopPropagation()}
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {/* Success State */}
          {bidSuccess ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-light text-gray-900 mb-2">Bid Submitted</h3>
              <p className="text-sm text-gray-400 font-light">${parseFloat(bidAmount).toLocaleString()} USD</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="relative flex-shrink-0">
                {/* Image */}
                <div className="h-44 bg-gray-100 flex-shrink-0">
                  <img
                    src={imageUrl}
                    alt={route.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Close */}
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <X size={16} className="text-gray-600" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="p-6 overflow-y-auto flex-1">
                {/* Route */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider mb-1">
                    <span>{route.aircraft_type}</span>
                    <span>·</span>
                    <span>{route.duration}</span>
                  </div>
                  <h2 className="text-xl font-light text-gray-900 tracking-tight">
                    {route.origin?.split('(')[0]?.trim()}
                    <span className="mx-2 text-gray-300">→</span>
                    {route.destination?.split('(')[0]?.trim()}
                  </h2>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline gap-3 mb-6 pb-6 border-b border-gray-100">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Avg. Price</p>
                    <p className="text-2xl font-light text-gray-900 tracking-tight">${route.price?.toLocaleString()}</p>
                  </div>
                  {bidCount > 0 && (
                    <span className="text-xs text-gray-400 font-light">{bidCount} bid{bidCount !== 1 ? 's' : ''} this week</span>
                  )}
                </div>

                {/* Form */}
                <div className="space-y-4">
                  {/* Row 1: Bid + Date */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 block">Your Bid</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-light">$</span>
                        <input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border-0 rounded-lg text-sm font-light text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 block">Date</label>
                      <input
                        type="date"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        min={minDate}
                        className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-lg text-sm font-light text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 2: Passengers + Aircraft */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 block">Passengers</label>
                      <select
                        value={passengers}
                        onChange={(e) => setPassengers(parseInt(e.target.value))}
                        className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-lg text-sm font-light text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all appearance-none"
                      >
                        {[...Array(route.passengers || 8)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'passenger' : 'passengers'}</option>
                        ))}
                      </select>
                    </div>
                    <div className="relative">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 block">Aircraft</label>
                      <button
                        type="button"
                        onClick={() => setShowJetDropdown(!showJetDropdown)}
                        className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-lg text-sm font-light text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all text-left flex items-center justify-between"
                      >
                        <span className="truncate">{selectedJetModel || 'Any'}</span>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform flex-shrink-0 ${showJetDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {showJetDropdown && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowJetDropdown(false)} />
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 max-h-40 overflow-y-auto">
                            {availableModels.map((model) => (
                              <button
                                key={model}
                                onClick={() => {
                                  setSelectedJetModel(model);
                                  setShowJetDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm font-light hover:bg-gray-50 transition-colors ${
                                  selectedJetModel === model ? 'text-gray-900 bg-gray-50' : 'text-gray-500'
                                }`}
                              >
                                {model}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 block">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional"
                      rows={2}
                      className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-lg text-sm font-light text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all resize-none placeholder:text-gray-300"
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <p className="text-xs text-red-500 font-light">{error}</p>
                  )}

                  {/* Submit */}
                  <button
                    onClick={handleSubmitBid}
                    disabled={isSubmitting || !user}
                    className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-light tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : !user ? (
                      'Log in to continue'
                    ) : (
                      'Submit Bid'
                    )}
                  </button>

                  <p className="text-[10px] text-gray-300 text-center font-light">
                    Response within 24h
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
