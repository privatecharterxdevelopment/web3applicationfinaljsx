import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Search, 
  ArrowRight, 
  Car, 
  X, 
  Star, 
  Calendar, 
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Mail,
  CreditCard,
  Check,
  Fuel,
  Shield,
  Wallet
} from 'lucide-react';
import Logo from '../../components/Logo';
import Footer from '../../components/Footer';
import WalletMenu from '../../components/WalletMenu';
import { supabase } from '../../lib/supabase';
import NavigationMenu from '../../components/NavigationMenu';
import UserMenu from '../UserMenu';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LuxuryCar {
  id: string;
  name: string;
  brand: string;
  model: string;
  type: string;
  location: string;
  currency: string;
  price_per_hour: number;
  price_per_day: number;
  price_per_week: number;
  description: string;
  features: any[];
  image_url: string;
  is_featured: boolean;
  is_available: string;
  created_at: string;
  updated_at: string;
}

// Advanced Booking Modal Component (kept inside the same file)
const LuxuryCarBookingModal = ({ car, onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<'overview' | 'booking' | 'confirmation'>('overview');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [pickupTime, setPickupTime] = useState('10:00');
  const [dropoffTime, setDropoffTime] = useState('10:00');

  // Form state
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    driverLicense: '',
    pickupLocation: car?.location || '',
    dropoffLocation: car?.location || '',
    specialRequests: '',
    paymentMethod: 'card'
  });

  // Pricing state
  const [currency, setCurrency] = useState(car?.currency || 'CHF');
  const [rentalType, setRentalType] = useState<'hourly' | 'daily' | 'weekly'>('daily');

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

  // Exchange rates for currency conversion
  const exchangeRates = {
    CHF: { rate: 1, symbol: 'CHF' },
    USD: { rate: 1.1, symbol: '$' },
    EUR: { rate: 0.95, symbol: '€' },
    GBP: { rate: 0.85, symbol: '£' }
  };

  // Calculate rental duration and price
  const calculateRentalDetails = () => {
    if (!selectedStartDate || !selectedEndDate) {
      return { 
        duration: 0, 
        durationText: '0 days',
        basePrice: 0,
        subtotal: 0, 
        tax: 0, 
        total: 0 
      };
    }

    const diffTime = Math.abs(selectedEndDate.getTime() - selectedStartDate.getTime());
    let duration: number;
    let durationText: string;
    let basePrice: number;

    if (rentalType === 'hourly') {
      duration = Math.ceil(diffTime / (1000 * 60 * 60));
      durationText = `${duration} hours`;
      basePrice = car?.price_per_hour || 0;
    } else if (rentalType === 'weekly') {
      duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
      durationText = `${duration} weeks`;
      basePrice = car?.price_per_week || 0;
    } else {
      duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      durationText = `${duration} days`;
      basePrice = car?.price_per_day || 0;
    }
    
    const currencyRate = exchangeRates[currency]?.rate || 1;
    const subtotal = basePrice * currencyRate * duration;
    const tax = subtotal * 0.081;
    
    return {
      duration,
      durationText,
      basePrice: basePrice * currencyRate,
      subtotal,
      tax,
      total: subtotal + tax
    };
  };

  const rentalDetails = calculateRentalDetails();

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Date selection handler
  const handleDateClick = (date: Date) => {
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

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Submit booking
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStartDate || !selectedEndDate) {
      alert('Please select rental dates');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const bookingData = {
        user_id: user?.id,
        car_id: car.id,
        type: 'luxury_car_rental',
        status: 'pending',
        data: {
          car_details: {
            name: car.name,
            brand: car.brand,
            model: car.model,
            type: car.type,
            location: car.location
          },
          rental_details: {
            start_date: selectedStartDate.toISOString(),
            end_date: selectedEndDate.toISOString(),
            pickup_time: pickupTime,
            dropoff_time: dropoffTime,
            pickup_location: formData.pickupLocation,
            dropoff_location: formData.dropoffLocation,
            rental_type: rentalType,
            duration: rentalDetails.duration,
            duration_text: rentalDetails.durationText
          },
          pricing: {
            currency: currency,
            base_price: rentalDetails.basePrice,
            subtotal: rentalDetails.subtotal,
            tax: rentalDetails.tax,
            total: rentalDetails.total,
            payment_method: formData.paymentMethod
          },
          customer_info: {
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            driver_license: formData.driverLicense
          },
          special_requests: formData.specialRequests,
          booking_reference: `CAR-${Date.now()}-${car.id.substring(0, 6)}`,
          request_timestamp: new Date().toISOString()
        },
        client_name: formData.fullName,
        client_email: formData.email,
        client_phone: formData.phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('user_requests')
        .insert([bookingData]);
      
      if (error) throw error;
      
      // Create email
      const subject = encodeURIComponent(`Luxury Car Rental Request: ${car.name} - ${formatDate(selectedStartDate)} to ${formatDate(selectedEndDate)}`);
      
      const body = encodeURIComponent(`Hello,

I would like to book the following luxury car:

CUSTOMER INFORMATION:
- Name: ${formData.fullName}
- Email: ${formData.email}
- Phone: ${formData.phone}
- Driver's License: ${formData.driverLicense}
- Payment Method: ${formData.paymentMethod === 'card' ? 'Credit Card' : formData.paymentMethod === 'crypto' ? 'Cryptocurrency' : 'Bank Transfer'}

CAR DETAILS:
- Vehicle: ${car.name}
- Brand: ${car.brand} ${car.model}
- Type: ${car.type}
- Location: ${car.location}

RENTAL DETAILS:
- Pickup Date: ${formatDate(selectedStartDate)} at ${pickupTime}
- Dropoff Date: ${formatDate(selectedEndDate)} at ${dropoffTime}
- Pickup Location: ${formData.pickupLocation}
- Dropoff Location: ${formData.dropoffLocation}
- Duration: ${rentalDetails.durationText}
- Rental Type: ${rentalType}
- Total Price: ${exchangeRates[currency].symbol} ${rentalDetails.total.toFixed(2)}

${formData.specialRequests ? `SPECIAL REQUESTS:
${formData.specialRequests}

` : ''}Submitted via PrivateCharterX Platform

Please confirm availability and provide booking details.

Best regards,
${formData.fullName}`);

      window.open(`mailto:bookings@privatecharterx.com?subject=${subject}&body=${body}`, '_blank');
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('There was an error submitting your booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate calendar for current month
  const renderCalendar = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    const weeks: (Date | null)[][] = [];
    let week: (Date | null)[] = [];
    
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
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-medium">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button 
            onClick={goToNextMonth}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div key={index} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="h-12"></div>;
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
                className={`h-12 w-full flex items-center justify-center rounded-xl text-sm font-medium transition-all
                  ${isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
                  ${isToday && !isSelected ? 'border-2 border-gray-900' : ''}
                  ${isSelected ? 'bg-gray-900 text-white' : ''}
                  ${isInRange ? 'bg-gray-100' : ''}
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

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-auto p-10 text-center transform transition-all duration-300 scale-100">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <Check size={28} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-light text-gray-900 mb-4">Request submitted</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Your car rental request has been submitted successfully. We'll contact you shortly to confirm details.
          </p>
          <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-3">
            <p className="text-sm"><span className="font-medium text-gray-500">Car:</span> {car.name}</p>
            <p className="text-sm"><span className="font-medium text-gray-500">Duration:</span> {rentalDetails.durationText}</p>
            <p className="text-sm"><span className="font-medium text-gray-500">Total:</span> {exchangeRates[currency].symbol} {rentalDetails.total.toFixed(2)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl mx-auto my-8 relative transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        {/* Header with image */}
        <div className="relative">
          <div className="h-64 bg-gradient-to-r from-gray-900 to-gray-700 relative overflow-hidden rounded-t-3xl">
            <img 
              src={car.image_url || 'https://via.placeholder.com/800x300'}
              alt={car.name}
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
            >
              <X size={20} />
            </button>
            
            <div className="absolute bottom-6 left-6 text-white">
              <div className="text-sm opacity-80 mb-2 flex items-center gap-2">
                <Car size={16} />
                Luxury Car Rental
              </div>
              <h2 className="text-3xl font-light">
                {car.name}
              </h2>
              <div className="text-sm opacity-90 mt-2">
                {car.brand} {car.model} • {car.type}
              </div>
            </div>
            
            <div className="absolute bottom-6 right-6 text-white text-right">
              <div className="text-sm opacity-80 mb-2">
                Starting from
              </div>
              <div className="text-3xl font-light">
                {car.currency} {car.price_per_day?.toLocaleString()}/day
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 'overview' && (
            <>
              {/* Car details */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2 font-medium">Location</div>
                  <div className="font-medium text-gray-900 flex items-center justify-center gap-2">
                    <MapPin size={16} />
                    {car.location}
                  </div>
                </div>
                
                <div className="text-center border-l border-r border-gray-100">
                  <div className="text-sm text-gray-500 mb-2 font-medium">Type</div>
                  <div className="font-medium text-gray-900">{car.type}</div>
                </div>
                
                <div className="text-center border-r border-gray-100">
                  <div className="text-sm text-gray-500 mb-2 font-medium">Brand</div>
                  <div className="font-medium text-gray-900">{car.brand}</div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2 font-medium">Available</div>
                  <div className="font-medium text-green-600">Now</div>
                </div>
              </div>

              {/* Rental options */}
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-medium text-gray-900">Rental options</h3>
                
                {/* Daily rental */}
                {car.price_per_day && (
                  <button
                    onClick={() => {
                      setRentalType('daily');
                      setStep('booking');
                    }}
                    className="w-full p-6 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                          <Calendar size={20} className="text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Daily rental</div>
                          <div className="text-sm text-white/70">Perfect for city trips</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-lg">{car.currency} {car.price_per_day?.toLocaleString()}</div>
                        <div className="text-sm text-white/70">per day</div>
                      </div>
                    </div>
                  </button>
                )}

                {/* Hourly rental */}
                {car.price_per_hour && (
                  <button
                    onClick={() => {
                      setRentalType('hourly');
                      setStep('booking');
                    }}
                    className="w-full p-6 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-2xl transition-all text-left border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          <Clock size={20} className="text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Hourly rental</div>
                          <div className="text-sm text-gray-500">Short-term use</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-lg text-gray-900">{car.currency} {car.price_per_hour?.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">per hour</div>
                      </div>
                    </div>
                  </button>
                )}

                {/* Weekly rental */}
                {car.price_per_week && (
                  <button
                    onClick={() => {
                      setRentalType('weekly');
                      setStep('booking');
                    }}
                    className="w-full p-6 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-2xl transition-all text-left border border-green-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <Star size={20} className="text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Weekly rental</div>
                          <div className="text-sm text-green-600">Best value</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-lg text-gray-900">{car.currency} {car.price_per_week?.toLocaleString()}</div>
                        <div className="text-sm text-green-600">per week</div>
                      </div>
                    </div>
                  </button>
                )}
              </div>

              {/* Car features */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Shield size={24} className="mx-auto mb-2 text-gray-600" />
                  <div className="text-sm font-medium text-gray-900">Fully Insured</div>
                  <div className="text-xs text-gray-500">Comprehensive coverage</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Fuel size={24} className="mx-auto mb-2 text-gray-600" />
                  <div className="text-sm font-medium text-gray-900">Full Tank</div>
                  <div className="text-xs text-gray-500">Delivered with full fuel</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Users size={24} className="mx-auto mb-2 text-gray-600" />
                  <div className="text-sm font-medium text-gray-900">24/7 Support</div>
                  <div className="text-xs text-gray-500">Always available</div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h4 className="font-medium text-gray-900 mb-3">About this vehicle</h4>
                <p className="text-gray-600 leading-relaxed">
                  {car.description || `Experience the luxury and performance of the ${car.brand} ${car.model} in ${car.location}. This premium ${car.type} offers the perfect blend of comfort, style, and performance for your journey.`}
                </p>
              </div>
            </>
          )}

          {/* Booking Form */}
          {step === 'booking' && (
            <div className="space-y-8">
              {/* Back button */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setStep('overview')}
                  className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ArrowRight size={18} className="rotate-180 text-gray-600" />
                </button>
                <h3 className="text-xl font-medium text-gray-900">
                  Book {car.name} - {rentalType} rental
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Calendar & Pricing */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Select rental period</h4>
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                      {renderCalendar()}
                      
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pick-up Time
                          </label>
                          <select
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          >
                            {Array.from({ length: 24 }).map((_, i) => (
                              <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                                {i.toString().padStart(2, '0')}:00
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Drop-off Time
                          </label>
                          <select
                            value={dropoffTime}
                            onChange={(e) => setDropoffTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          >
                            {Array.from({ length: 24 }).map((_, i) => (
                              <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                                {i.toString().padStart(2, '0')}:00
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <div className="text-sm text-gray-500 mb-1">Pick-up Date</div>
                          <div className="font-medium flex items-center">
                            <Calendar size={16} className="mr-2 text-gray-400" />
                            {selectedStartDate ? formatDate(selectedStartDate) : 'Select date'}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <div className="text-sm text-gray-500 mb-1">Drop-off Date</div>
                          <div className="font-medium flex items-center">
                            <Calendar size={16} className="mr-2 text-gray-400" />
                            {selectedEndDate ? formatDate(selectedEndDate) : 'Select date'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Price Summary */}
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Price summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Rate ({rentalType})</span>
                        <div className="flex items-center gap-2">
                          <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="border-none bg-transparent text-right focus:ring-0 p-0"
                          >
                            {Object.keys(exchangeRates).map(curr => (
                              <option key={curr} value={curr}>{curr}</option>
                            ))}
                          </select>
                          <span className="font-medium">
                            {exchangeRates[currency].symbol} {rentalDetails.basePrice.toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration</span>
                        <span className="font-medium">{rentalDetails.durationText}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">{exchangeRates[currency].symbol} {rentalDetails.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax (8.1%)</span>
                        <span className="font-medium">{exchangeRates[currency].symbol} {rentalDetails.tax.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-3 flex justify-between font-bold">
                        <span>Total</span>
                        <span>{exchangeRates[currency].symbol} {rentalDetails.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Booking Form */}
                <div>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Your information</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Full Name
                            </label>
                            <input
                              type="text"
                              name="fullName"
                              value={formData.fullName}
                              onChange={handleInputChange}
                              required
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                              placeholder="John Doe"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email Address
                            </label>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              required
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                              placeholder="john@example.com"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              required
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                              placeholder="+41 79 123 45 67"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Driver's License
                            </label>
                            <input
                              type="text"
                              name="driverLicense"
                              value={formData.driverLicense}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                              placeholder="License number"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Delivery information</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pick-up Location
                          </label>
                          <div className="relative">
                            <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              name="pickupLocation"
                              value={formData.pickupLocation}
                              onChange={handleInputChange}
                              required
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                              placeholder="Enter pick-up location"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Drop-off Location
                          </label>
                          <div className="relative">
                            <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              name="dropoffLocation"
                              value={formData.dropoffLocation}
                              onChange={handleInputChange}
                              required
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                              placeholder="Enter drop-off location"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                      <div className="grid grid-cols-3 gap-3">
                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="card"
                            checked={formData.paymentMethod === 'card'}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className={`border-2 rounded-xl p-3 transition-all ${
                            formData.paymentMethod === 'card'
                              ? 'border-gray-900 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}>
                            <div className="flex items-center gap-2 justify-center">
                              <CreditCard size={16} className="text-gray-600" />
                              <span className="text-sm font-medium text-gray-900">Card</span>
                            </div>
                          </div>
                        </label>
                        
                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="crypto"
                            checked={formData.paymentMethod === 'crypto'}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className={`border-2 rounded-xl p-3 transition-all ${
                            formData.paymentMethod === 'crypto'
                              ? 'border-gray-900 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}>
                            <div className="flex items-center gap-2 justify-center">
                              <Wallet size={16} className="text-gray-600" />
                              <span className="text-sm font-medium text-gray-900">Crypto</span>
                            </div>
                          </div>
                        </label>
                        
                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="transfer"
                            checked={formData.paymentMethod === 'transfer'}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className={`border-2 rounded-xl p-3 transition-all ${
                            formData.paymentMethod === 'transfer'
                              ? 'border-gray-900 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}>
                            <div className="flex items-center gap-2 justify-center">
                              <span className="text-sm font-medium text-gray-900">Transfer</span>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Special Requests (optional)
                      </label>
                      <textarea
                        name="specialRequests"
                        value={formData.specialRequests}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                        placeholder="Any special requirements..."
                      />
                    </div>
                    
                    <div className="flex gap-4 pt-6">
                      <button
                        type="button"
                        onClick={() => setStep('overview')}
                        className="flex-1 py-4 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !selectedStartDate || !selectedEndDate}
                        className="flex-1 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            Submit request
                            <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LuxuryCars = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [cars, setCars] = React.useState<LuxuryCar[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedCar, setSelectedCar] = React.useState<LuxuryCar | null>(null);
  const [showModal, setShowModal] = React.useState(false);
  const [filterCategory, setFilterCategory] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  // FETCH CARS FROM SUPABASE
  const fetchCars = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching from luxury_cars table...');
      
      let query = supabase.from('luxury_cars').select('*');

      // Apply filters
      if (filterCategory !== 'all') {
        query = query.ilike('type', `%${filterCategory}%`);
      }

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%`);
      }

      const { data, error: fetchError } = await query.limit(50);
      
      if (fetchError) {
        console.error('Supabase fetch error:', fetchError);
        throw fetchError;
      }

      console.log('SUCCESS: Fetched cars data:', data);
      setCars(data || []);
      
    } catch (error) {
      console.error('ERROR fetching cars:', error);
      setError(`Failed to fetch cars: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // FETCH ON MOUNT AND FILTER CHANGES
  React.useEffect(() => {
    fetchCars();
  }, [filterCategory, searchTerm]);

  const handleCarClick = (car: LuxuryCar) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedCar(car);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCar(null);
  };

  const formatPrice = (price: number, currency: string) => {
    return `${currency} ${price?.toLocaleString() || 0}`;
  };

  const getCarIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'supercar':
      case 'sports':
        return '🏎️';
      case 'luxury':
        return '🚗';
      case 'suv':
        return '🚙';
      case 'convertible':
        return '🏎️';
      default:
        return '🚗';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-8xl mx-auto flex justify-between items-center px-6 py-4">
          <div className="flex gap-6 items-center">
            <Logo />
            <NavigationMenu />
          </div>
          <div className="flex items-center gap-4">
            <UserMenu onLogout={() => {}} />
            <WalletMenu onShowDashboard={() => {}} />
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 pt-[88px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          
          {/* HERO */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-thin mb-6 text-gray-900">Luxury Car Rental</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Experience the thrill of driving the world's most prestigious automobiles.
            </p>
          </div>

          {/* SEARCH */}
          <div className="max-w-md mx-auto mb-8 relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search cars..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-500 focus:border-transparent shadow-sm bg-white"
            />
          </div>

          {/* FILTERS */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {['all', 'supercar', 'luxury', 'suv', 'sports', 'convertible'].map((category) => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  filterCategory === category
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* RESULTS */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
              <p className="ml-4 text-gray-600">Loading luxury cars...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-red-50 rounded-2xl border border-red-100">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <X size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Cars</h3>
              <p className="text-red-600 mb-6 leading-relaxed">{error}</p>
              <button 
                onClick={fetchCars}
                className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          ) : cars.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cars.map((car) => (
                <div
                  key={car.id}
                  className="bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => handleCarClick(car)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={car.image_url || 'https://via.placeholder.com/400x300'}
                      alt={car.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Type Badge */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <span>{getCarIcon(car.type)}</span>
                      {car.type}
                    </div>

                    {/* Featured Badge */}
                    {car.is_featured && (
                      <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <Star size={12} />
                        Featured
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-1 text-gray-900">{car.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <span className="font-medium">{car.brand}</span>
                        <span>•</span>
                        <span>{car.model}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center text-gray-500 mb-4">
                      <MapPin size={14} className="mr-2" />
                      <span className="text-sm">{car.location}</span>
                    </div>
                    
                    {/* Features Preview */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <Settings size={16} className="mx-auto mb-1 text-gray-400" />
                        <div className="text-xs text-gray-500">Premium</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <Users size={16} className="mx-auto mb-1 text-gray-400" />
                        <div className="text-xs text-gray-500">Luxury</div>
                      </div>
                    </div>
                    
                    {/* Pricing */}
                    <div className="space-y-2">
                      {car.price_per_day && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Daily rate</span>
                          <span className="text-lg font-bold text-gray-900">
                            {formatPrice(car.price_per_day, car.currency)}
                          </span>
                        </div>
                      )}
                      {car.price_per_hour && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Hourly rate</span>
                          <span className="text-sm font-medium text-gray-600">
                            {formatPrice(car.price_per_hour, car.currency)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Available now</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Car size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Cars Found</h3>
              <p className="text-gray-600 leading-relaxed">
                {filterCategory !== 'all' || searchTerm
                  ? 'Try adjusting your filters to see more results.'
                  : 'Check back later for new luxury car offerings.'
                }
              </p>
              {(filterCategory !== 'all' || searchTerm) && (
                <button
                  onClick={() => {
                    setFilterCategory('all');
                    setSearchTerm('');
                  }}
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

      {/* BOOKING MODAL - kept inside the same file! */}
      {showModal && selectedCar && (
        <LuxuryCarBookingModal car={selectedCar} onClose={closeModal} />
      )}
    </div>
  );
};

export default LuxuryCars;