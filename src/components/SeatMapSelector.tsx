import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Check, X, Plane } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Passenger {
  givenName: string;
  familyName: string;
  gender: 'male' | 'female';
  email: string;
  phone: string;
  bornOn: string;
}

interface SeatSelection {
  passengerId: string;
  segmentId: string;
  seatId: string;
  seatDesignator: string;
  price?: number;
}

interface SeatElement {
  type: 'seat' | 'empty' | 'lavatory' | 'galley' | 'closet' | 'stairs' | 'bassinet';
  designator?: string;
  available?: boolean;
  serviceId?: string | null;
  price?: { amount: number; currency: string } | null;
  isWindow?: boolean;
  isAisle?: boolean;
  isMiddle?: boolean;
  isExtraLegroom?: boolean;
  isExitRow?: boolean;
}

interface SeatRow {
  rowNumber: string;
  sections: Array<{ elements: SeatElement[] }>;
}

interface Cabin {
  cabinClass: string;
  deckNumber: number;
  wingsStart?: string;
  wingsEnd?: string;
  rows: SeatRow[];
}

interface SeatMap {
  segmentId: string;
  flightNumber: string;
  departure: {
    airport: string;
    city: string;
    time: string;
  };
  arrival: {
    airport: string;
    city: string;
    time: string;
  };
  aircraft: string;
  cabins: Cabin[];
}

interface SeatMapSelectorProps {
  offerId: string;
  passengers: Passenger[];
  onSeatsSelected: (seats: SeatSelection[]) => void;
  selectedSeats: SeatSelection[];
}

export default function SeatMapSelector({
  offerId,
  passengers,
  onSeatsSelected,
  selectedSeats
}: SeatMapSelectorProps) {
  const [seatMaps, setSeatMaps] = useState<SeatMap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState(0);
  const [activePassenger, setActivePassenger] = useState(0);

  useEffect(() => {
    fetchSeatMap();
  }, [offerId]);

  const fetchSeatMap = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('get-seat-map', {
        body: { offerId }
      });

      if (error) throw error;

      if (!data?.available) {
        setError('Seat selection is not available for this flight');
        setSeatMaps([]);
        return;
      }

      setSeatMaps(data.seatMaps || []);
    } catch (err: any) {
      console.error('Error fetching seat map:', err);
      setError(err.message || 'Failed to load seat map');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeatClick = (seat: SeatElement, segmentId: string) => {
    if (!seat.available || !seat.designator) return;

    const passengerId = `passenger-${activePassenger}`;

    // Check if seat is already selected by another passenger
    const existingSelection = selectedSeats.find(
      s => s.segmentId === segmentId && s.seatDesignator === seat.designator
    );

    if (existingSelection && existingSelection.passengerId !== passengerId) {
      return; // Seat taken by another passenger
    }

    // Check if this passenger already has a seat on this segment
    const passengerExistingSeat = selectedSeats.find(
      s => s.segmentId === segmentId && s.passengerId === passengerId
    );

    let newSelections = [...selectedSeats];

    if (passengerExistingSeat) {
      // Remove existing selection
      newSelections = newSelections.filter(
        s => !(s.segmentId === segmentId && s.passengerId === passengerId)
      );
    }

    if (!existingSelection) {
      // Add new selection
      newSelections.push({
        passengerId,
        segmentId,
        seatId: seat.serviceId || '',
        seatDesignator: seat.designator,
        price: seat.price?.amount
      });

      // Auto-advance to next passenger
      if (activePassenger < passengers.length - 1) {
        setActivePassenger(activePassenger + 1);
      }
    }

    onSeatsSelected(newSelections);
  };

  const isSeatSelected = (seat: SeatElement, segmentId: string) => {
    return selectedSeats.some(
      s => s.segmentId === segmentId && s.seatDesignator === seat.designator
    );
  };

  const getSeatOwner = (seat: SeatElement, segmentId: string) => {
    const selection = selectedSeats.find(
      s => s.segmentId === segmentId && s.seatDesignator === seat.designator
    );
    if (!selection) return null;
    const passengerIndex = parseInt(selection.passengerId.split('-')[1]);
    return passengers[passengerIndex];
  };

  const isCurrentPassengerSeat = (seat: SeatElement, segmentId: string) => {
    const passengerId = `passenger-${activePassenger}`;
    return selectedSeats.some(
      s => s.segmentId === segmentId && s.seatDesignator === seat.designator && s.passengerId === passengerId
    );
  };

  const getSeatClassName = (seat: SeatElement, segmentId: string) => {
    const baseClass = 'w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-all';

    if (seat.type !== 'seat') {
      if (seat.type === 'lavatory') return `${baseClass} bg-blue-100 text-blue-500`;
      if (seat.type === 'galley') return `${baseClass} bg-orange-100 text-orange-500`;
      return `${baseClass} bg-transparent`;
    }

    if (!seat.available) {
      return `${baseClass} bg-gray-200 text-gray-400 cursor-not-allowed`;
    }

    if (isSeatSelected(seat, segmentId)) {
      if (isCurrentPassengerSeat(seat, segmentId)) {
        return `${baseClass} bg-green-500 text-white ring-2 ring-green-300`;
      }
      return `${baseClass} bg-blue-500 text-white`;
    }

    if (seat.isExtraLegroom) {
      return `${baseClass} bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-pointer border border-purple-300`;
    }

    if (seat.isExitRow) {
      return `${baseClass} bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer border border-amber-300`;
    }

    return `${baseClass} bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 size={32} className="text-gray-400 animate-spin mb-4" />
        <p className="text-gray-600">Loading seat map...</p>
      </div>
    );
  }

  if (error || seatMaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={32} className="text-amber-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Seat Selection Unavailable</h3>
        <p className="text-sm text-gray-500 text-center max-w-md">
          {error || 'Seat selection is not available for this flight. Seats will be assigned at check-in.'}
        </p>
      </div>
    );
  }

  const currentSeatMap = seatMaps[activeSegment];

  return (
    <div className="space-y-6">
      {/* Segment Selector */}
      {seatMaps.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {seatMaps.map((map, index) => (
            <button
              key={map.segmentId}
              onClick={() => setActiveSegment(index)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                activeSegment === index
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {map.departure.airport} → {map.arrival.airport}
            </button>
          ))}
        </div>
      )}

      {/* Flight Info */}
      <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Plane size={20} className="text-gray-400" />
          <div>
            <p className="font-medium text-gray-900">{currentSeatMap.flightNumber}</p>
            <p className="text-sm text-gray-500">{currentSeatMap.aircraft}</p>
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="text-gray-900">{currentSeatMap.departure.airport} → {currentSeatMap.arrival.airport}</p>
        </div>
      </div>

      {/* Passenger Selector */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Select seat for:</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {passengers.map((passenger, index) => {
            const hasSelection = selectedSeats.some(
              s => s.segmentId === currentSeatMap.segmentId && s.passengerId === `passenger-${index}`
            );
            return (
              <button
                key={index}
                onClick={() => setActivePassenger(index)}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activePassenger === index
                    ? 'bg-gray-900 text-white'
                    : hasSelection
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {hasSelection && <Check size={14} />}
                {passenger.givenName || `Passenger ${index + 1}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-100 rounded-md border border-gray-300" />
          <span className="text-gray-600">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-200 rounded-md" />
          <span className="text-gray-600">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded-md" />
          <span className="text-gray-600">Your selection</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-purple-100 rounded-md border border-purple-300" />
          <span className="text-gray-600">Extra legroom</span>
        </div>
      </div>

      {/* Seat Map */}
      <div className="bg-gray-50 rounded-xl p-4 overflow-x-auto">
        <div className="flex flex-col items-center min-w-max">
          {/* Aircraft nose */}
          <div className="w-20 h-8 bg-gray-200 rounded-t-full mb-4" />

          {currentSeatMap.cabins.map((cabin, cabinIndex) => (
            <div key={cabinIndex} className="mb-6">
              {/* Cabin label */}
              <div className="text-center mb-3">
                <span className="text-xs font-medium text-gray-500 uppercase px-3 py-1 bg-white rounded-full">
                  {cabin.cabinClass}
                </span>
              </div>

              {/* Rows */}
              {cabin.rows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex items-center gap-2 mb-1">
                  {/* Row number */}
                  <div className="w-6 text-center text-xs text-gray-400">
                    {row.rowNumber}
                  </div>

                  {/* Sections */}
                  {row.sections.map((section, sectionIndex) => (
                    <React.Fragment key={sectionIndex}>
                      <div className="flex gap-1">
                        {section.elements.map((element, elementIndex) => (
                          <div
                            key={elementIndex}
                            onClick={() => element.type === 'seat' && handleSeatClick(element, currentSeatMap.segmentId)}
                            className={getSeatClassName(element, currentSeatMap.segmentId)}
                            title={
                              element.type === 'seat'
                                ? `${element.designator}${element.price ? ` - $${element.price.amount}` : ''}${
                                    isSeatSelected(element, currentSeatMap.segmentId)
                                      ? ` (${getSeatOwner(element, currentSeatMap.segmentId)?.givenName || 'Selected'})`
                                      : ''
                                  }`
                                : element.type
                            }
                          >
                            {element.type === 'seat' ? (
                              isSeatSelected(element, currentSeatMap.segmentId) ? (
                                <Check size={14} />
                              ) : element.available ? (
                                element.designator?.slice(-1)
                              ) : (
                                <X size={12} />
                              )
                            ) : element.type === 'lavatory' ? (
                              'WC'
                            ) : element.type === 'galley' ? (
                              'G'
                            ) : null}
                          </div>
                        ))}
                      </div>

                      {/* Aisle separator */}
                      {sectionIndex < row.sections.length - 1 && (
                        <div className="w-6" />
                      )}
                    </React.Fragment>
                  ))}

                  {/* Row number (right side) */}
                  <div className="w-6 text-center text-xs text-gray-400">
                    {row.rowNumber}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Aircraft tail */}
          <div className="w-16 h-6 bg-gray-200 rounded-b-lg mt-4" />
        </div>
      </div>

      {/* Selected Seats Summary */}
      {selectedSeats.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h4 className="font-medium text-green-900 mb-2">Selected Seats</h4>
          <div className="space-y-1">
            {selectedSeats
              .filter(s => s.segmentId === currentSeatMap.segmentId)
              .map((seat, index) => {
                const passengerIndex = parseInt(seat.passengerId.split('-')[1]);
                const passenger = passengers[passengerIndex];
                return (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-green-700">
                      {passenger?.givenName || `Passenger ${passengerIndex + 1}`} - Seat {seat.seatDesignator}
                    </span>
                    {seat.price && seat.price > 0 && (
                      <span className="text-green-900 font-medium">+${seat.price}</span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Skip Button */}
      <div className="text-center">
        <button
          onClick={() => onSeatsSelected([])}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Skip seat selection (seats assigned at check-in)
        </button>
      </div>
    </div>
  );
}
