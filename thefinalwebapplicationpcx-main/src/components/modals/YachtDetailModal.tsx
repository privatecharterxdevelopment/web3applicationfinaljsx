import React, { useState } from 'react';
import { X, MapPin, Calendar, Clock, Users, Check, ArrowRight, Anchor, Shield } from 'lucide-react';
import currency from 'currency.js';

const exchangeRates = {
  CHF: 1,
  USD: 1.1,
  EUR: 1.02,
  GBP: 0.9
};

interface YachtDetailModalProps {
  yacht: any;
  onClose: () => void;
}

export default function YachtDetailModal({ yacht, onClose }: YachtDetailModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    currency: 'EUR',
    startDate: '',
    endDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showAddons, setShowAddons] = useState(false);
  const [addons, setAddons] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleAddon = (addon: string) => {
    setAddons(prev =>
      prev.includes(addon) ? prev.filter(a => a !== addon) : [...prev, addon]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Calculate pricing
      const currencyCode = formData.currency;
      const rate = exchangeRates[currencyCode] || 1;
      
      // Parse yacht price (e.g., "€150,000/week" -> 150000)
      const priceMatch = yacht.price.match(/[\d,]+/);
      const basePrice = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;
      
      const base = basePrice * rate;
      const tax = base * 0.081;
      const total = base + tax;

      // In a real application, you would send this data to your backend
      const emailText = `New Yacht Charter Request\n\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\n\nYacht: ${yacht.name}\nDates: ${formData.startDate} to ${formData.endDate}\n\nPricing:\nSubtotal: ${currencyCode} ${currency(base).format()}\nTaxes: ${currencyCode} ${currency(tax).format()}\nTotal incl. tax: ${currencyCode} ${currency(total).format()}\n\nAdd-ons: ${addons.join(', ') || 'None'}\n\nMessage:\n${formData.message}`;

      console.log(emailText);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSubmitted(true);
    } catch (err) {
      console.error('Submission error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center py-8">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden mx-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/80 rounded-full text-gray-600 hover:text-gray-900 z-10"
          >
            <X size={24} />
          </button>

          <div className="relative w-full h-64">
            <img
              src={yacht.image}
              alt={yacht.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 bg-blue-500 text-white text-sm font-medium px-3 py-1 rounded-full">
              {yacht.type}
            </div>
          </div>

          <div className="px-6 sm:px-8 pt-8 pb-10">
            <h1 className="text-3xl font-bold mb-3">{yacht.name}</h1>
            
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 mb-6 text-base">
              <div className="flex items-center text-gray-700">
                <MapPin size={18} className="mr-2 text-gray-500" />
                <span className="font-medium">{yacht.location}</span>
              </div>
              
              <div className="flex items-center text-gray-700">
                <Users size={18} className="mr-2 text-gray-500" />
                <span className="font-medium">{yacht.capacity}</span>
              </div>
              
              <div className="flex items-center text-gray-700">
                <Anchor size={18} className="mr-2 text-gray-500" />
                <span className="font-medium">{yacht.length}</span>
              </div>
              
              <div className="flex items-center text-gray-700">
                <Shield size={18} className="mr-2 text-gray-500" />
                <span className="font-medium">{yacht.crew}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Yacht Details</h3>
                <div className="bg-gray-50 p-6 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-base">Type</span>
                    <span className="font-medium text-base">{yacht.type}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-base">Length</span>
                    <span className="font-medium text-base">{yacht.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-base">Capacity</span>
                    <span className="font-medium text-base">{yacht.capacity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-base">Crew</span>
                    <span className="font-medium text-base">{yacht.crew}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-base">Charter Rate</span>
                    <span className="font-medium text-base">{yacht.price}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-xl font-bold mb-4">Included Services</h3>
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 text-base">Professional crew including captain, chef, and stewards</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 text-base">Gourmet meals and standard beverages</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 text-base">Water sports equipment and activities</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 text-base">Fuel for standard cruising and generator use</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">Booking Details</h3>
                
                <div className="mb-4">
                  <label className="block font-medium mb-2 text-base">Preferred Currency</label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-base"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="CHF">CHF</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block font-medium mb-2 text-base">Start Date</label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-base"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium mb-2 text-base">End Date</label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-base"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block font-medium mb-2 text-base flex items-center justify-between">
                    Select Additional Services
                    <button
                      type="button"
                      onClick={() => setShowAddons(!showAddons)}
                      className="ml-2 text-xl text-black"
                    >
                      {showAddons ? '-' : '+'}
                    </button>
                  </label>
                  {showAddons && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {['Jet Ski Rental', 'Scuba Diving', 'Private Chef', 'Helicopter Transfer'].map((addon) => (
                        <label key={addon} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={addons.includes(addon)}
                            onChange={() => toggleAddon(addon)}
                            className="rounded border-gray-300 text-black focus:ring-black"
                          />
                          <span className="text-base">{addon}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-6 border border-gray-200 p-5 rounded-lg bg-gray-50">
                  {(() => {
                    const currencyCode = formData.currency;
                    const rate = exchangeRates[currencyCode] || 1;
                    
                    // Parse yacht price (e.g., "€150,000/week" -> 150000)
                    const priceMatch = yacht.price.match(/[\d,]+/);
                    const basePrice = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;
                    
                    const base = basePrice * rate;
                    const tax = base * 0.081;
                    const total = base + tax;
                    
                    return (
                      <>
                        <div className="flex justify-between text-base mb-1">
                          <span className="text-gray-600">Charter Rate</span>
                          <span className="font-semibold">{currencyCode} {currency(base).format()}</span>
                        </div>
                        <div className="flex justify-between text-base mb-1">
                          <span className="text-gray-600">Taxes (8.1%)</span>
                          <span>{currencyCode} {currency(tax).format()}</span>
                        </div>
                        <div className="border-t border-gray-300 my-2"></div>
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total</span>
                          <span>{currencyCode} {currency(total).format()}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {!isSubmitted ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      required 
                      placeholder="Full Name" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-base" 
                    />
                    <input 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      required 
                      placeholder="Email Address" 
                      type="email" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-base" 
                    />
                    <div className="flex">
                      <div className="bg-gray-100 flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300">
                        <span className="text-gray-500 text-base">+</span>
                      </div>
                      <input 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleChange} 
                        required 
                        placeholder="Phone Number" 
                        className="w-full px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-black focus:border-transparent text-base" 
                      />
                    </div>
                    <textarea 
                      name="message" 
                      value={formData.message} 
                      onChange={handleChange} 
                      placeholder="Additional Requests" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none text-base" 
                      rows={3}
                    ></textarea>
                    <button 
                      disabled={isSubmitting} 
                      type="submit" 
                      className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors text-base font-medium"
                    >
                      {isSubmitting ? 'Sending…' : 'Request Booking'}
                    </button>
                  </form>
                ) : (
                  <div className="bg-green-100 text-green-800 p-5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Check size={24} className="text-green-600" />
                      <h3 className="font-bold text-lg">Booking Request Sent!</h3>
                    </div>
                    <p className="text-base">Thank you for your booking request. Our team will contact you shortly to confirm your reservation.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 text-center text-base text-gray-500">
              Questions? Email <a href="mailto:bookings@privatecharterx.com" className="underline">bookings@privatecharterx.com</a> or call <a href="tel:+41447978853" className="underline">+41 (0) 44 797 88 53</a><br />
              Languages: Deutsch, English, Français, Italiano, Español
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}