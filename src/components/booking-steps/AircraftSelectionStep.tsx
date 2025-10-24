// src/components/booking-steps/AircraftSelectionStep.tsx
import React from 'react';
import { Check, Clock, Users, MapPin, Leaf } from 'lucide-react';
import type { AirportSearchResult } from '../../services/airportsStaticService';

interface AircraftSelectionStepProps {
  // Flight data needed for aircraft calculations  
  distance: number;
  
  // Aircraft selection
  selectedVehicleType: 'private-jet' | 'helicopter';
  passengers: number;
  jetCategories: any[];
  helicopterCategories: any[];
  selectedJet: any | null;
  selectedHelicopter: any | null;
  setSelectedJet: (jet: any) => void;
  setSelectedHelicopter: (helicopter: any) => void;
  setSelectedVehicleType: (type: 'private-jet' | 'helicopter') => void;
  formatPrice: (amount: number) => string;
}

export default function AircraftSelectionStep({
  distance,
  selectedVehicleType,
  passengers,
  jetCategories,
  helicopterCategories,
  selectedJet,
  selectedHelicopter,
  setSelectedJet,
  setSelectedHelicopter,
  setSelectedVehicleType,
  formatPrice
}: AircraftSelectionStepProps) {
  return (
    <div className="space-y-6 animate-slideIn">

      {/* Aircraft Options */}
      <div className="space-y-4">
        {(selectedVehicleType === 'helicopter' ? helicopterCategories : jetCategories)
          .filter(aircraft => {
            // Filter by passenger capacity
            if (aircraft.capacity < passengers) return false;

            // For helicopters, filter by distance
            if (selectedVehicleType === 'helicopter' && distance > aircraft.maxDistance) {
              return false;
            }

            return true;
          })
          .sort((a, b) => {
            // Calculate stops for each aircraft
            const stopsA = selectedVehicleType === 'private-jet' && distance > a.range ? Math.ceil(distance / a.range) - 1 : 0;
            const stopsB = selectedVehicleType === 'private-jet' && distance > b.range ? Math.ceil(distance / b.range) - 1 : 0;
            
            // Primary sort: by number of stops (ascending)
            if (stopsA !== stopsB) {
              return stopsA - stopsB;
            }
            
            // Secondary sort: by cost (ascending)
            const flightTimeA = Math.max(1, distance / a.speed);
            const flightTimeB = Math.max(1, distance / b.speed);
            const priceA = Math.round(flightTimeA * a.pricePerHour);
            const priceB = Math.round(flightTimeB * b.pricePerHour);
            
            return priceA - priceB;
          })
          .map((aircraft) => {
            const isSelected = selectedVehicleType === 'helicopter'
              ? selectedHelicopter?.id === aircraft.id
              : selectedJet?.id === aircraft.id;
            const flightTime = Math.max(1, distance / aircraft.speed);
            const price = Math.round(flightTime * aircraft.pricePerHour);
            const requiresStops = selectedVehicleType === 'private-jet' && distance > aircraft.range;
            const stopsRequired = Math.ceil(distance / aircraft.range) - 1;
            const exceedsMaxTime = selectedVehicleType === 'helicopter' &&
              (flightTime * 60) > aircraft.maxFlightTime;
            const exceedsMaxDistance = selectedVehicleType === 'helicopter' &&
              distance > aircraft.maxDistance;

            return (
              <div
                key={aircraft.id}
                onClick={() => {
                  if (!exceedsMaxTime && !exceedsMaxDistance) {
                    if (selectedVehicleType === 'helicopter') {
                      setSelectedHelicopter(aircraft);
                    } else {
                      setSelectedJet(aircraft);
                    }
                  }
                }}
                className={`relative p-4 md:p-6 rounded-2xl border-2 transition-all bg-cover bg-center bg-no-repeat ${isSelected
                  ? 'border-black bg-gray-50'
                  : exceedsMaxTime || exceedsMaxDistance
                    ? 'border-red-200 bg-red-50 opacity-60 cursor-not-allowed'
                    : 'border-gray-200 hover:border-gray-300 bg-white cursor-pointer'
                  }`}
                style={selectedVehicleType === 'private-jet' && aircraft.imageLink ? {
                  backgroundImage: `url(${aircraft.imageLink})`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right center'
                } : {}}
              >
                {isSelected && (
                  <div className="absolute top-4 md:top-6 right-4 md:right-6 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                )}

                {/* Semi-transparent overlay for text readability when background image is present */}
                {selectedVehicleType === 'private-jet' && aircraft.imageLink && (
                  <div className="absolute inset-0 bg-white/80 rounded-2xl"></div>
                )}
                
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl md:text-4xl">{aircraft.image}</div>
                    <div>
                      <h3 className="font-medium text-base md:text-lg text-gray-900">{aircraft.name}</h3>
                      <p className="text-gray-500 text-sm">{aircraft.description}</p>

                      {/* Details in light grey bubbles */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          <Users size={12} className="inline mr-1" />{aircraft.capacity} seats
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          <Clock size={12} className="inline mr-1" />{Math.round(flightTime)}h {Math.round((flightTime % 1) * 60)}m
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          <MapPin size={12} className="inline mr-1" />{aircraft.range} km range
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          <Leaf size={12} className="inline mr-1" />{aircraft.co2PerHour}t CO₂/h
                        </span>
                        {selectedVehicleType === 'helicopter' && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                            Max {aircraft.maxFlightTime}min / {aircraft.maxDistance}km
                          </span>
                        )}
                        {requiresStops && (
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">
                            {stopsRequired} stop{stopsRequired > 1 ? 's' : ''} required
                          </span>
                        )}
                        {exceedsMaxTime && (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                            Exceeds max flight time
                          </span>
                        )}
                        {exceedsMaxDistance && (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                            Route too long
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl md:text-2xl font-light text-gray-900">{formatPrice(price)}</div>
                    <div className="text-xs text-gray-400">
                      {requiresStops || exceedsMaxTime || exceedsMaxDistance ? 'not available' : 'estimated total'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

        {/* No helicopters available message */}
        {selectedVehicleType === 'helicopter' && helicopterCategories.filter(aircraft =>
          aircraft.capacity >= passengers && distance <= aircraft.maxDistance
        ).length === 0 && (
            <div className="text-center py-8">
              <div className="text-2xl mb-4">🚁</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No helicopters available for this route</h3>
              <p className="text-gray-500 mb-4">
                The distance of {Math.round(distance)} km exceeds our helicopter service range.
              </p>
              <button
                onClick={() => {
                  setSelectedVehicleType('private-jet');
                  setSelectedHelicopter(null);
                }}
                className="bg-black text-white px-6 py-2 rounded-xl hover:bg-gray-800 transition-colors"
              >
                View Private Jet Options
              </button>
            </div>
          )}
      </div>
    </div>
  );
}