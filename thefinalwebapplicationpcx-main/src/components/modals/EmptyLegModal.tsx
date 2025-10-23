import React, { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Clock, Users, Plane, ArrowRight, Check, Headphones } from 'lucide-react';
import type { EmptyLegOffer } from '../../pages/EmptyLegOffers';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const exchangeRates = {
  CHF: 1,
  USD: 1.1,
  EUR: 1.02,
  GBP: 0.9
};

interface EmptyLegModalProps {
  offer: EmptyLegOffer;
  onClose: () => void;
}

export default function EmptyLegModal({ offer, onClose }: EmptyLegModalProps) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: '',
    message: '',
    currency: 'USD' //offer?.currency || 'EUR'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const currencyCode = formData.currency;
      // const rate = exchangeRates[currencyCode as keyof typeof exchangeRates] || 1;
      const base = offer.price_usd; //* rate;
      const tax = Math.round(base * 0.081);
      const total = base + tax;

      // Save request to database
      if (user) {
        const { error: dbError } = await supabase
          .from('user_requests')
          .insert([{
            user_id: user.id,
            type: 'empty_leg',
            status: 'pending',
            data: {
              offer_id: offer.id,
              offer_title: `${offer.from_city} → ${offer.to_city}`,
              flight_route: `${offer.from_city} → ${offer.to_city}`,
              departure_date: offer.departure_date,
              departure_time: offer.departure_time,
              aircraft_type: offer.aircraft_type,
              capacity: offer.capacity,
              price: total,
              currency: currencyCode,
              customer_details: formData,
              pricing_breakdown: { base, tax, total }
            }
          }]);

        if (dbError) throw dbError;
      }

      setShowSuccess(true);

      // Navigate to dashboard after success
      setTimeout(() => {
        onClose();
        navigate('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to submit request. Please try again.');
    }
    setIsSubmitting(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const currencyCode = formData.currency;
  // const rate = exchangeRates[currencyCode as keyof typeof exchangeRates] || 1;
  const base = offer.price_usd; //* rate;
  const tax = Math.round(base * 0.081);
  const total = base + tax;

  const handleSupportClick = () => {
    onClose();
    navigate('/contact');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      {showSuccess ? (
        <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h3 className="text-2xl font-bold mb-4">Request Sent!</h3>
          <p className="text-gray-600 mb-2">
            Thank you for your interest in this empty leg flight.
          </p>
          <p className="text-gray-600">
            Our team will get in touch with you within a few minutes to discuss the details.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header with close button */}
          <div className="relative">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 hover:text-gray-900 z-10 transition-colors shadow-lg"
            >
              <X size={24} />
            </button>

            {/* Hero Image */}
            <div className="relative h-64 rounded-t-3xl overflow-hidden">
              <img
                src={offer.image_url || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2574&q=80'}
                alt={`${offer.from_city} to ${offer.to_city}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-6 left-6 bg-gray-100 text-gray-800 text-sm px-4 py-2 rounded-full font-medium shadow-lg">
                Empty Leg Deal
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Flight Info */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-4">{offer.from_city} → {offer.to_city}</h2>
              <div className="flex items-center text-gray-600 mb-6">
                <span className="font-medium">{offer.from} ({offer.from_iata})</span>
                <ArrowRight size={16} className="mx-2" />
                <span className="font-medium">{offer.to} ({offer.to_iata})</span>
              </div>

              {/* Flight Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                  <Calendar size={16} className="text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Departure</div>
                    <div className="font-semibold">{formatDate(offer.departure_date)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                  <Clock size={16} className="text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Time</div>
                    <div className="font-semibold">{offer.departure_time || 'TBD'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                  <Plane size={16} className="text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Aircraft</div>
                    <div className="font-semibold">{offer.aircraft_type}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                  <Users size={16} className="text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Capacity</div>
                    <div className="font-semibold">Up to {offer.capacity} pax</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="mb-8 p-6 bg-gray-50 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Currency:</span>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="CHF">CHF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Base Price</span>
                <span>{currencyCode} {base.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Taxes (8.1%)</span>
                <span>{currencyCode} {tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t border-gray-200 pt-3 mt-3">
                <span>Total Price</span>
                <span>{currencyCode} {total.toLocaleString()}</span>
              </div>
              <div className="text-sm text-green-600 mt-2 text-center font-medium">
                Save up to 75% compared to regular charter
              </div>
            </div>

            {!isAuthenticated && (
              <div className="bg-blue-50 p-4 rounded-xl mb-6">
                <p className="text-blue-700 font-medium">Please sign in to submit a booking request</p>
                <p className="text-blue-600 text-sm mt-1">
                  <a href="/login" className="underline">Sign in</a> or <a href="/register" className="underline">create an account</a>
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 p-4 rounded-xl mb-6">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Booking Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="First Name"
                  className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-black focus:border-black bg-gray-50 focus:bg-white transition-colors"
                  disabled={!isAuthenticated}
                />
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Last Name"
                  className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-black focus:border-black bg-gray-50 focus:bg-white transition-colors"
                  disabled={!isAuthenticated}
                />
              </div>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Email Address"
                type="email"
                className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-black focus:border-black bg-gray-50 focus:bg-white transition-colors"
                disabled={!isAuthenticated}
              />
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Phone Number"
                className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-black focus:border-black bg-gray-50 focus:bg-white transition-colors"
                disabled={!isAuthenticated}
              />
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Special requests or questions (optional)"
                rows={4}
                className="w-full border border-gray-200 px-4 py-3 rounded-xl resize-none focus:ring-2 focus:ring-black focus:border-black bg-gray-50 focus:bg-white transition-colors"
                disabled={!isAuthenticated}
              />

              <div className="flex gap-4">
                <button
                  disabled={isSubmitting || !isAuthenticated}
                  type="submit"
                  className="flex-1 bg-black text-white py-4 rounded-2xl font-semibold text-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Request</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSupportClick}
                  className="px-8 py-4 border border-gray-200 rounded-2xl font-semibold text-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Headphones size={18} />
                  <span>Support</span>
                </button>
              </div>
            </form>

            {/* Contact Info */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
              <div className="mb-1">
                Questions? <a href="mailto:bookings@privatecharterx.com" className="text-black underline">bookings@privatecharterx.com</a>
                {' '} or <a href="tel:+41447978853" className="text-black underline">+41 44 797 88 53</a>
              </div>
              <div>Available in: English, Deutsch, Français, Italiano, Español</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}