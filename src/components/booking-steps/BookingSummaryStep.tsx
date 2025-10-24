// src/components/booking-steps/BookingSummaryStep.tsx
import React from 'react';
import { Check, Gift, Leaf } from 'lucide-react';
import type { AirportSearchResult } from '../../services/airportsStaticService';

interface Service {
  id: string;
  name: string;
  icon: any;
  desc: string;
  nftFree?: boolean;
}

interface BookingSummaryStepProps {
  // Flight details
  origin: AirportSearchResult | null;
  destination: AirportSearchResult | null;
  stops: AirportSearchResult[];
  departureDate: Date | null;
  departureTime: string;
  passengers: number;
  luggage: number;
  pets: number;
  selectedVehicleType: 'private-jet' | 'helicopter';
  selectedAircraft: any;
  formatDate: (date: Date | null, format: string) => string;
  
  // Services
  selectedAviationServices: string[];
  selectedLuxuryServices: string[];
  aviationServices: Service[];
  luxuryServices: Service[];
  
  // NFT benefits
  discountPercent: number;
  nftBenefits: string[];
  
  // Pricing
  basePrice: number;
  discountedBase: number;
  carbonFee: number;
  paymentFee: number;
  totalPrice: number;
  formatPrice: (amount: number) => string;
  
  // Carbon options
  carbonOption: string;
  flightHours: number;
  walletAddress: string;
}

export default function BookingSummaryStep({
  origin,
  destination,
  stops,
  departureDate,
  departureTime,
  passengers,
  luggage,
  pets,
  selectedVehicleType,
  selectedAircraft,
  formatDate,
  selectedAviationServices,
  selectedLuxuryServices,
  aviationServices,
  luxuryServices,
  discountPercent,
  nftBenefits,
  basePrice,
  discountedBase,
  carbonFee,
  paymentFee,
  totalPrice,
  formatPrice,
  carbonOption,
  flightHours,
  walletAddress
}: BookingSummaryStepProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 animate-slideIn">
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-2xl p-4 md:p-6">
          <h3 className="font-medium text-gray-900 mb-4">Flight Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Route</span>
              <span className="font-medium text-gray-900">
                {origin?.code}
                {stops.map(stop => ` → ${stop.code}`).join('')}
                {` → ${destination?.code}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-900">
                {departureDate && formatDate(departureDate, 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Time</span>
              <span className="font-medium text-gray-900">{departureTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Passengers</span>
              <span className="font-medium text-gray-900">{passengers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Luggage</span>
              <span className="font-medium text-gray-900">{luggage}</span>
            </div>
            {pets > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Pets</span>
                <span className="font-medium text-gray-900">{pets}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">{selectedVehicleType === 'helicopter' ? 'Helicopter' : 'Aircraft'}</span>
              <span className="font-medium text-gray-900">{selectedAircraft?.name}</span>
            </div>
          </div>
        </div>

        {((selectedVehicleType === 'private-jet' && selectedAviationServices.length > 0) || selectedLuxuryServices.length > 0) && (
          <div className="bg-gray-50 rounded-2xl p-4 md:p-6">
            <h3 className="font-medium text-gray-900 mb-4">Additional Services</h3>
            <div className="space-y-2">
              {selectedVehicleType === 'private-jet' && selectedAviationServices.map(serviceId => {
                const service = aviationServices.find(s => s.id === serviceId);
                return (
                  <div key={serviceId} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check size={14} className="text-green-600" />
                    {service?.name}
                  </div>
                );
              })}
              {selectedLuxuryServices.map(serviceId => {
                const service = luxuryServices.find(s => s.id === serviceId);
                return (
                  <div key={serviceId} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check size={14} className="text-green-600" />
                    {service?.name}
                    {service?.nftFree && <span className="text-xs text-green-600">(Free with NFT)</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {discountPercent > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Gift size={16} className="text-purple-600" />
              <span className="font-medium text-purple-900">NFT Benefits Applied</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-purple-900">{discountPercent}%</span>
              <span className="text-sm text-purple-600">discount applied</span>
            </div>
            {nftBenefits.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {nftBenefits.map((benefit, index) => (
                  <span key={index} className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
                    {benefit}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-black text-white rounded-2xl p-4 md:p-6">
          <h3 className="font-medium mb-4">Price Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/70">Base Flight</span>
              <span>{formatPrice(basePrice)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-green-400">
                <span className="text-white/70">NFT Discount (-{discountPercent}%)</span>
                <span>-{formatPrice(basePrice - discountedBase)}</span>
              </div>
            )}
            {carbonFee > 0 && (
              <div className="flex justify-between">
                <span className="text-white/70">Carbon Certificate</span>
                <span>{formatPrice(carbonFee)}</span>
              </div>
            )}
            {paymentFee > 0 && (
              <div className="flex justify-between">
                <span className="text-white/70">Payment Fee</span>
                <span>{formatPrice(paymentFee)}</span>
              </div>
            )}
            <div className="border-t border-white/20 pt-3">
              <div className="flex justify-between">
                <span>Estimated Total</span>
                <span className="text-xl md:text-2xl">{formatPrice(totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        {carbonOption === 'full' && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 md:p-6 border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
            <div className="flex items-center gap-3">
              <Leaf size={20} className="text-green-600" />
              <div>
                <div className="font-medium text-gray-900">Carbon NFT Certificate</div>
                <div className="text-sm text-gray-600">Offsetting {(flightHours * selectedAircraft?.co2PerHour).toFixed(1)} tons CO₂</div>
                {walletAddress && (
                  <div className="text-xs text-gray-500 mt-1">
                    To: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {carbonOption === 'full' && (
          <div className="bg-gray-100 rounded-2xl p-4 md:p-6">
            <p className="text-sm text-gray-600">
              You can receive additionally to the classic CO2 Certificate also the CO2 NFT, for which you need to share your receiving wallet (ETHEREUM ONLY). The certificate will not be issued BEFORE completed flights.
            </p>
          </div>
        )}
        <div className="text-center text-sm text-gray-600">
          Questions? Get in touch with us at <a href="mailto:bookings@privatecharterx.com" className="text-blue-600 hover:underline">bookings@privatecharterx.com</a>
        </div>
      </div>
    </div>
  );
}