// src/components/booking-steps/RouteDisplay.tsx
import React from 'react';
import { Calendar, Plane } from 'lucide-react';
import type { AirportSearchResult } from '../../services/airportsStaticService';

interface RouteDisplayProps {
  // Flight data
  origin: AirportSearchResult | null;
  destination: AirportSearchResult | null;
  stops: AirportSearchResult[];
  distance: number;
  departureDate?: Date | null;
  departureTime?: string;
  selectedVehicleType: 'private-jet' | 'helicopter';
  selectedAircraft?: any | null;
  formatDate?: (date: Date | null, format: string) => string;
}

export default function RouteDisplay({
  origin,
  destination,
  stops,
  distance,
  departureDate,
  departureTime,
  selectedVehicleType,
  selectedAircraft,
  formatDate
}: RouteDisplayProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Conditional layout based on stops */}
        {selectedVehicleType === 'private-jet' && stops.length > 0 ? (
          /* Vertical layout for routes with stops */
          <div className="flex flex-col gap-2">
            <div className="text-center">
              <div className="font-medium text-gray-900">{origin?.code}</div>
              <div className="text-xs text-gray-500">{origin?.city}{origin?.state ? `, ${origin?.state}` : ''}, {origin?.country}</div>
            </div>
            
            {/* Show all stops vertically */}
            {stops.map((stop) => (
              <React.Fragment key={stop.code}>
                <div className="flex justify-center text-gray-400">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-px h-4 bg-gray-300"></div>
                    <Plane size={14} />
                    <div className="w-px h-4 bg-gray-300"></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{stop.code}</div>
                  <div className="text-xs text-gray-500">{stop.city}{stop.state ? `, ${stop.state}` : ''}, {stop.country}</div>
                </div>
              </React.Fragment>
            ))}
            
            <div className="flex justify-center text-gray-400">
              <div className="flex flex-col items-center gap-1">
                <div className="w-px h-4 bg-gray-300"></div>
                <Plane size={16} />
                <div className="w-px h-4 bg-gray-300"></div>
              </div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">{destination?.code}</div>
              <div className="text-xs text-gray-500">{destination?.city}{destination?.state ? `, ${destination?.state}` : ''}, {destination?.country}</div>
            </div>
          </div>
        ) : (
          /* Horizontal layout for direct routes */
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="font-medium text-gray-900">{origin?.code}</div>
              <div className="text-xs text-gray-500">{origin?.city}{origin?.state ? `, ${origin?.state}` : ''}, {origin?.country}</div>
            </div>

            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-8 h-px bg-gray-300"></div>
              {selectedVehicleType === 'helicopter' ? (
                <span className="text-2xl">🚁</span>
              ) : (
                <Plane size={16} />
              )}
              <div className="w-8 h-px bg-gray-300"></div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">{destination?.code}</div>
              <div className="text-xs text-gray-500">{destination?.city}{destination?.state ? `, ${destination?.state}` : ''}, {destination?.country}</div>
            </div>
          </div>
        )}
        <div className="text-right">
          <div className="font-medium text-gray-900">{Math.round(distance)} km</div>
          <div className="text-xs text-gray-500">{Math.round(distance * 0.621371)} miles</div>
          {selectedVehicleType === 'private-jet' && stops.length > 0 && (
            <div className="text-xs text-gray-400">{stops.length} stop{stops.length > 1 ? 's' : ''}</div>
          )}
          {departureDate && departureTime && formatDate && (
            <div className="text-sm text-gray-600 flex items-center gap-1 justify-end mt-2">
              <Calendar size={14} />
              {formatDate(departureDate, 'MMM d')} • {departureTime}
            </div>
          )}
          {selectedAircraft && (
            <div className="text-xs text-gray-500 mt-1">
              {selectedAircraft.name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}