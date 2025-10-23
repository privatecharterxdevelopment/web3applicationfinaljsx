import React, { useState, useRef } from 'react';
import { X, Check, ChevronLeft, ChevronRight, Calendar, MapPin, Clock, Users } from 'lucide-react';
import { FixedOffer } from '../../pages/FixedOffers';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const exchangeRates = {
  CHF: { rate: 1, symbol: 'CHF' },
  USD: { rate: 1.1, symbol: '$' },
  EUR: { rate: 0.95, symbol: '€' },
  GBP: { rate: 0.85, symbol: '£' }
};

interface FixedOfferModalProps {
  offer: FixedOffer;
  onClose: () => void;
}

export default function FixedOfferModal({ offer, onClose }: FixedOfferModalProps) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    specialRequests: ''
  });

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [currency, setCurrency] = useState('CHF');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const calculatePackageDetails = () => {
    if (!selectedStartDate || !selectedEndDate) {
      return { days: 0, subtotal: 0, tax: 0, total: 0 };
    }

    const diffTime = Math.abs(selectedEndDate.getTime() - selectedStartDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const rate = offer?.price || 0;
    const currencyRate = exchangeRates[currency]?.rate || 1;
    const subtotal = rate * currencyRate * diffDays;
    const tax = subtotal * 0.081;
    
    return {
      days: diffDays,
      subtotal,
      tax,
      total: subtotal + tax
    };
  };

  const packageDetails = calculatePackageDetails();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date) => {
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    } else {
      if (date < selectedStartDate) {
        setSelectedStartDate(date);
      } else {
        setSelectedEndDate(date);
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStartDate || !selectedEndDate) {
      alert('Please select travel dates');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save request to Supabase
      const { error } = await supabase
        .from('user_requests')
        .insert([{
          user_id: user?.id,
          type: 'fixed_offer',
          status: 'pending',
          data: {
            offer_id: offer.id,
            offer_title: offer.title,
            offer_origin: offer.origin,
            offer_destination: offer.destination,
            offer_aircraft_type: offer.aircraft_type,
            offer_passengers: offer.passengers,
            offer_price: offer.price,
            offer_currency: offer.currency,
            selected_dates: {
              from: selectedStartDate?.toISOString(),
              to: selectedEndDate?.toISOString(),
              days: packageDetails.days
            },
            pricing: {
              currency: currency,
              base: packageDetails.subtotal,
              tax: packageDetails.tax,
              total: packageDetails.total
            },
            customer_details: {
              name: formData.fullName,
              email: formData.email,
              phone: formData.phone,
              special_requests: formData.specialRequests
            }
          }
        }]);

      if (error) throw error;
      
      setIsSubmitted(true);
      
      // Navigate to dashboard after success
      setTimeout(() => {
        onClose();
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCalendar = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    const weeks = [];
    let week = [];
    
    days.forEach((day, index) => {
      week.push(day);
      if ((index + 1) % 7 === 0 || index === days.length - 1) {
        weeks.push(week);
        week = [];
      }
    });
    
    return (
      <div className="calendar">
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={goToPreviousMonth}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-medium">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button 
            onClick={goToNextMonth}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div key={index} className="text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="h-10"></div>;
            }
            
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = selectedStartDate && date.toDateString() === selectedStartDate.toDateString() || 
                              selectedEndDate && date.toDateString() === selectedEndDate.toDateString();
            const isInRange = selectedStartDate && selectedEndDate && 
                             date > selectedStartDate && date < selectedEndDate;
            const isPast = date < today;
            
            return (
              <button
                key={date.toDateString()}
                onClick={() => !isPast && handleDateClick(date)}
                disabled={isPast}
                className={`h-10 w-full flex items-center justify-center rounded-full text-sm
                  ${isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
                  ${isToday && !isSelected ? 'border border-black' : ''}
                  ${isSelected ? 'bg-black text-white' : ''}
                  ${isInRange ? 'bg-gray-200' : ''}
                `}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 bg-white/80 rounded-full w-9 h-9 flex items-center justify-center hover:bg-black hover:text-white transition-colors z-10">
          <X size={20} />
        </button>

        {isSubmitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Booking Request Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your booking request. We will contact you shortly to confirm your reservation.
            </p>
            <button 
              onClick={onClose}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <img src={offer.image_url} alt={offer.title} className="w-full h-72 object-cover" />
            
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-2">{offer.title}</h1>
              <p className="text-gray-600 mb-6">{offer.description}</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Package Details & Calendar */}
                <div>
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold mb-4">Package Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Route</span>
                        <span className="font-medium">{offer.origin} → {offer.destination}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Aircraft</span>
                        <span className="font-medium">{offer.aircraft_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Departure</span>
                        <span className="font-medium">Flexible - Choose your dates</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration</span>
                        <span className="font-medium">{offer.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Passengers</span>
                        <span className="font-medium">Up to {offer.passengers}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Select Travel Period</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      {renderCalendar()}
                      
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-500">Start Date</div>
                          <div className="font-medium flex items-center">
                            <Calendar size={16} className="mr-1 text-gray-400" />
                            {selectedStartDate ? formatDate(selectedStartDate) : 'Select date'}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-500">End Date</div>
                          <div className="font-medium flex items-center">
                            <Calendar size={16} className="mr-1 text-gray-400" />
                            {selectedEndDate ? formatDate(selectedEndDate) : 'Select date'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold mb-4">Price Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Package Price</span>
                        <div className="flex items-center">
                          <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="mr-2 border-none bg-transparent text-right focus:ring-0"
                          >
                            {Object.keys(exchangeRates).map(curr => (
                              <option key={curr} value={curr}>{curr}</option>
                            ))}
                          </select>
                          <span className="font-medium">
                            <span className="font-thin">{exchangeRates[currency].symbol}</span> {(offer.price * exchangeRates[currency].rate).toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Travel Period</span>
                        <span className="font-medium">{packageDetails.days} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium"><span className="font-thin">{exchangeRates[currency].symbol}</span> {packageDetails.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax (8.1%)</span>
                        <span className="font-medium"><span className="font-thin">{exchangeRates[currency].symbol}</span> {packageDetails.tax.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-gray-300 my-2 pt-2 flex justify-between font-bold">
                        <span>Total</span>
                        <span><span className="font-thin">{exchangeRates[currency].symbol}</span> {packageDetails.total.toFixed(2)}</span>
                      </div>
                      <div className="text-xs font-thin text-gray-500 text-center mt-2">
                        all prices incl. VAT
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Booking Form */}
                <div>
                  <form onSubmit={handleSubmit}>
                    <h3 className="text-lg font-semibold mb-4">Your Information</h3>
                    
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="John Doe"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="john@example.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <div className="flex">
                          <div className="bg-gray-100 flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300">
                            <span className="text-gray-500">+</span>
                          </div>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder="41 79 123 45 67"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Special Requests
                        </label>
                        <textarea
                          name="specialRequests"
                          value={formData.specialRequests}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                          placeholder="Any special requirements or notes..."
                        ></textarea>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting || !selectedStartDate || !selectedEndDate}
                      className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Processing...' : 'Send Booking Request'}
                    </button>
                    
                    <p className="text-xs text-gray-500 text-center mt-4">
                      By submitting this form, you agree to our Terms & Conditions and Privacy Policy.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}