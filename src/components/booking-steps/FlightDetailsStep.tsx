// src/components/booking-steps/FlightDetailsStep.tsx
import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import MapboxMap from '../Map';
import RouteDisplay from './RouteDisplay';
import type { AirportSearchResult } from '../../services/airportsStaticService';

interface FlightDetailsStepProps {
  // Route and map props
  origin: AirportSearchResult | null;
  destination: AirportSearchResult | null;
  stops: AirportSearchResult[];
  selectedVehicleType: 'private-jet' | 'helicopter';
  distance: number;
  
  // Stop management
  showStopsDropdown: boolean;
  setShowStopsDropdown: (show: boolean) => void;
  stopInput: string;
  setStopInput: (input: string) => void;
  stopAirports: AirportSearchResult[];
  isLoadingStopAirports: boolean;
  searchStopAirports: (query: string) => void;
  addStop: (airport: AirportSearchResult) => void;
  setStops: (stops: AirportSearchResult[]) => void;
  
  // Route summary
  formatPrice: (amount: number) => string;
  
  // Tab and offers
  activeTab: string;
  setActiveTab: (tab: string) => void;
  popularRoutes: any[];
  setDepartureDate: (date: Date | null) => void;
  
  // Calendar and flight details
  CalendarComponent: React.ComponentType<{ selectedDate: Date | null; onDateSelect: (date: Date | null) => void }>;
  departureDate: Date | null;
  departureTime: string;
  setDepartureTime: (time: string) => void;
  passengers: number;
  setPassengers: (passengers: number) => void;
  luggage: number;
  setLuggage: (luggage: number) => void;
  pets: number;
  setPets: (pets: number) => void;
  
  // Aviation services  
  selectedAviationServices: string[];
  setSelectedAviationServices: (services: string[] | ((prev: string[]) => string[])) => void;
  aviationServices: any[];
  aviationServiceSliderRef: React.RefObject<HTMLDivElement>;
}

export default function FlightDetailsStep({
  origin,
  destination,
  stops,
  selectedVehicleType,
  distance,
  showStopsDropdown,
  setShowStopsDropdown,
  stopInput,
  setStopInput,
  stopAirports,
  isLoadingStopAirports,
  searchStopAirports,
  addStop,
  setStops,
  formatPrice,
  activeTab,
  setActiveTab,
  popularRoutes,
  setDepartureDate,
  CalendarComponent,
  departureDate,
  departureTime,
  setDepartureTime,
  passengers,
  setPassengers,
  luggage,
  setLuggage,
  pets,
  setPets,
  selectedAviationServices,
  setSelectedAviationServices,
  aviationServices,
  aviationServiceSliderRef
}: FlightDetailsStepProps) {
  const scrollLeft = () => {
    if (aviationServiceSliderRef.current) {
      // Scroll by item width (128px) + gap (12px) = 140px
      aviationServiceSliderRef.current.scrollBy({ left: -140, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (aviationServiceSliderRef.current) {
      // Scroll by item width (128px) + gap (12px) = 140px
      aviationServiceSliderRef.current.scrollBy({ left: 140, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-slideIn">
      {/* Map */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="h-80">
          <MapboxMap
            origin={origin}
            destination={destination}
            isReturn={false}
            stops={stops}
          />
        </div>
      </div>

      {/* Stops Management - Only show for private jets */}
      {selectedVehicleType === 'private-jet' && (
        <div className="bg-gray-50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Route Stops</h3>
            <div className="relative airport-dropdown">
              <button
                onClick={() => setShowStopsDropdown(!showStopsDropdown)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                + Add Stop
              </button>
              {showStopsDropdown && (
                <div className="absolute top-full mt-2 right-0 w-80 bg-white border border-gray-100 rounded-xl shadow-lg z-10">
                  <div className="p-4">
                    <input
                      type="text"
                      value={stopInput}
                      onChange={(e) => {
                        setStopInput(e.target.value);
                        searchStopAirports(e.target.value);
                      }}
                      onFocus={() => {
                        if (stopInput.length === 0) {
                          searchStopAirports('');
                        }
                      }}
                      placeholder="Search for stop airport..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-gray-400 focus:outline-none"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {isLoadingStopAirports ? (
                      <div className="px-4 py-3 text-center text-gray-500">Searching...</div>
                    ) : stopAirports.length > 0 ? (
                      stopAirports.map(airport => (
                        <button
                          key={airport.code}
                          onClick={() => addStop(airport)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0"
                        >
                          <div className="font-medium text-gray-900">{airport.name}</div>
                          <div className="text-xs text-gray-400">{airport.code} • {airport.city}{airport.state ? `, ${airport.state}` : ''}, {airport.country}</div>
                        </button>
                      ))
                    ) : stopInput.length >= 2 && (
                      <div className="px-4 py-3 text-center text-gray-500">No airports found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{origin?.name}</div>
                <div className="text-xs text-gray-500">Departure • {origin?.code}</div>
              </div>
            </div>

            {stops.map((stop, index) => (
              <div key={stop.code} className="flex items-center gap-3 p-3 bg-white rounded-xl">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{stop.name}</div>
                  <div className="text-xs text-gray-500">Stop {index + 1} • {stop.code}</div>
                </div>
                <button
                  onClick={() => setStops(stops.filter((_, i) => i !== index))}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{destination?.name}</div>
                <div className="text-xs text-gray-500">Arrival • {destination?.code}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Helicopter specific route display */}
      {selectedVehicleType === 'helicopter' && (
        <div className="bg-gray-50 rounded-2xl p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Helicopter Route</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{origin?.name}</div>
                <div className="text-xs text-gray-500">Departure • {origin?.code}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{destination?.name}</div>
                <div className="text-xs text-gray-500">Arrival • {destination?.code}</div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Helicopter flights are direct point-to-point with no intermediate stops.
            </p>
          </div>
        </div>
      )}

      {/* Route Summary */}
      <RouteDisplay
        origin={origin}
        destination={destination}
        stops={stops}
        distance={distance}
        selectedVehicleType={selectedVehicleType}
      />

      {activeTab === 'custom' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Calendar */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">Select Date</h3>
            <CalendarComponent
              selectedDate={departureDate}
              onDateSelect={setDepartureDate}
            />
          </div>

          {/* Flight Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Flight Details</h3>

              {/* Time Selection */}
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-2">Departure Time</label>
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Passengers */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Passengers</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPassengers(Math.max(1, passengers - 1))}
                      className="w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-medium">{passengers}</span>
                    <button
                      onClick={() => setPassengers(passengers + 1)}
                      className="w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Luggage */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Luggage</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLuggage(Math.max(0, luggage - 1))}
                      className="w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-medium">{luggage}</span>
                    <button
                      onClick={() => setLuggage(luggage + 1)}
                      className="w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Pets */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Pets</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPets(Math.max(0, pets - 1))}
                      className="w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-medium">{pets}</span>
                    <button
                      onClick={() => setPets(pets + 1)}
                      className="w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Aviation Services - Only for private jets */}
            {selectedVehicleType === 'private-jet' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">In-Flight Services</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={scrollLeft}
                      className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft size={16} className="text-gray-600" />
                    </button>
                    <button
                      onClick={scrollRight}
                      className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                    >
                      <ChevronRight size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>
                <div className="relative w-full max-w-full">
                  <div
                    ref={aviationServiceSliderRef}
                    className="flex gap-3 overflow-x-scroll scrollbar-hide pb-2"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      WebkitOverflowScrolling: 'touch',
                      width: '100%',
                      minWidth: '0',
                      scrollSnapType: 'x mandatory'
                    }}
                  >
                    {aviationServices.map(service => {
                      const Icon = service.icon;
                      const isSelected = selectedAviationServices.includes(service.id);
                      return (
                        <button
                          key={service.id}
                          onClick={() => {
                            setSelectedAviationServices(prev =>
                              isSelected
                                ? prev.filter(id => id !== service.id)
                                : [...prev, service.id]
                            );
                          }}
                          className={`flex-shrink-0 w-32 p-4 rounded-xl border transition-all ${isSelected
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          style={{ scrollSnapAlign: 'start' }}
                        >
                          <Icon size={20} className="mb-2 text-gray-600 mx-auto" />
                          <div className="text-xs font-medium text-gray-900">{service.name}</div>
                          <div className="text-[10px] text-gray-500 mt-1">{service.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Select a Popular Route</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularRoutes.map(offer => (
              <div
                key={offer.id}
                className="p-4 md:p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all cursor-pointer"
                onClick={() => {
                  setDepartureDate(new Date());
                  setActiveTab('custom');
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-lg font-medium text-gray-900">{offer.from} → {offer.to}</div>
                    <div className="text-xs text-gray-400">to</div>
                    <div className="text-lg font-medium text-gray-900">{offer.to}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-medium text-gray-900">{formatPrice(offer.price)}</div>
                    <div className="text-xs text-gray-400">total</div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-600">{offer.aircraft}</div>
                  <div className="text-sm text-gray-600">{offer.duration}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}