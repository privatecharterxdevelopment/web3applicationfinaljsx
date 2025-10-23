// src/components/booking-steps/BookingProgress.tsx
import React from 'react';
import RouteDisplay from './RouteDisplay';
import type { AirportSearchResult } from '../../services/airportsStaticService';

interface BookingProgressProps {
  // Flight data
  origin: AirportSearchResult | null;
  destination: AirportSearchResult | null;
  stops: AirportSearchResult[];
  distance: number;
  departureDate: Date | null;
  departureTime: string;
  selectedVehicleType: 'private-jet' | 'helicopter';
  selectedAircraft: any | null;
  formatDate: (date: Date | null, format: string) => string;

  // Step navigation
  steps: Array<{ id: string; label: string }>;
  currentStep: number;
  setCurrentStep: (step: number) => void;

  // Step availability - determines which steps can be clicked
  getStepAvailability: (stepIndex: number) => boolean;
}

export default function BookingProgress({
  origin,
  destination,
  stops,
  distance,
  departureDate,
  departureTime,
  selectedVehicleType,
  selectedAircraft,
  formatDate,
  steps,
  currentStep,
  setCurrentStep,
  getStepAvailability
}: BookingProgressProps) {
  return (
    <div className="space-y-4">
      {/* Step Navigation */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 overflow-x-auto">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {index > 0 && (
                <div className="w-4 h-px bg-gray-300"></div>
              )}
              <button
                onClick={() => getStepAvailability(index) && setCurrentStep(index)}
                disabled={!getStepAvailability(index)}
                className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-all ${index === currentStep
                    ? 'bg-black text-white'
                    : index < currentStep || getStepAvailability(index)
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {step.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Booking Summary */}
      <RouteDisplay
        origin={origin}
        destination={destination}
        stops={stops}
        distance={distance}
        departureDate={departureDate}
        departureTime={departureTime}
        selectedVehicleType={selectedVehicleType}
        selectedAircraft={selectedAircraft}
        formatDate={formatDate}
      />
    </div>
  );
}