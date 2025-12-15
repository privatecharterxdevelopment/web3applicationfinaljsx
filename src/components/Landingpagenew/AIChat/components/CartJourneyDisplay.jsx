import React, { useState } from 'react';
import {
  Plane, MapPin, Clock, Route, ArrowRight, ChevronDown, ChevronUp,
  Trash2, Edit2, Plus, Moon, Fuel, Users, AlertTriangle, Car
} from 'lucide-react';
import { formatDuration, kmToNm } from '../utils/routeCalculator';
import { FuelNotice } from './MultiStopJourney';

const CartJourneyDisplay = ({
  item,
  onEdit,
  onRemove,
  onAddStop,
  onAddTransfer,
  isExpanded = false,
  onToggleExpand
}) => {
  const [expanded, setExpanded] = useState(isExpanded);

  const handleToggle = () => {
    setExpanded(!expanded);
    onToggleExpand?.(!expanded);
  };

  const totalDistanceNm = Math.round(kmToNm(item.totalDistance || 0));
  const hasOvernightStays = item.hasOvernightStays || item.stops?.some(s => s.isOvernight);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-gray-900 text-white text-[10px] font-medium rounded">
              CHARTER
            </span>
            {item.isMultiStop && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded">
                MULTI-STOP
              </span>
            )}
            {hasOvernightStays && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded flex items-center gap-0.5">
                <Moon size={8} />
                OVERNIGHT
              </span>
            )}
          </div>
          <button
            onClick={handleToggle}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {expanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
          </button>
        </div>

        {/* Aircraft Name */}
        <h4 className="text-sm font-semibold text-gray-900 mt-2">
          {item.name || item.aircraft_model}
        </h4>

        {/* Route Display */}
        <div className="flex items-center gap-1.5 mt-1">
          <MapPin size={12} className="text-gray-400" />
          <span className="text-xs font-mono text-gray-700">
            {item.route || `${item.from_iata || item.from_city} → ${item.to_iata || item.to_city}`}
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-3 space-y-3 bg-gray-50">
          {/* Legs */}
          {item.legs && item.legs.length > 0 && (
            <div className="space-y-2">
              {item.legs.map((leg, index) => {
                const stop = item.stops?.[index];
                const legDistanceNm = Math.round(kmToNm(leg.distance));

                return (
                  <div key={index} className="relative">
                    {/* Leg Card */}
                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                      <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-gray-600">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-gray-900">{leg.fromCode}</span>
                          <ArrowRight size={10} className="text-gray-400" />
                          <span className="text-[10px] font-mono font-bold text-gray-900">{leg.toCode}</span>
                        </div>
                        <p className="text-[9px] text-gray-500 truncate">{leg.from} → {leg.to}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] font-medium text-gray-900">{legDistanceNm} nm</p>
                        <p className="text-[9px] text-gray-500">{formatDuration(leg.flightTime)}</p>
                      </div>
                    </div>

                    {/* Stop Info */}
                    {stop && index < item.legs.length - 1 && (
                      <div className={`ml-2.5 mt-1 mb-1 flex items-center gap-1.5 px-2 py-1 rounded text-[9px] ${
                        stop.isOvernight
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {stop.isOvernight ? (
                          <Moon size={9} className="text-amber-500" />
                        ) : (
                          <Clock size={9} className="text-gray-400" />
                        )}
                        <span>
                          {stop.isOvernight ? 'Overnight' : 'Stop'} in {stop.city}: {formatDuration(stop.stopDuration / 60)}
                        </span>
                      </div>
                    )}

                    {/* Connecting Line */}
                    {index < item.legs.length - 1 && (
                      <div
                        className="absolute left-[12px] top-[28px] w-px bg-gray-200"
                        style={{ height: stop ? '28px' : '8px' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Totals */}
          <div className="grid grid-cols-3 gap-2 p-2 bg-white rounded-lg border border-gray-100">
            <div>
              <p className="text-[9px] text-gray-500 uppercase">Distance</p>
              <p className="text-xs font-semibold text-gray-900">{totalDistanceNm} nm</p>
              <p className="text-[9px] text-gray-400">{(item.totalDistance || 0).toLocaleString()} km</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase">Flight Time</p>
              <p className="text-xs font-semibold text-gray-900">
                {formatDuration(item.totalFlightTime || item.flightTimeHours || 0)}
              </p>
              <p className="text-[9px] text-gray-400">{item.billedHours || 1}h billed</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase">Est. Price</p>
              <p className="text-xs font-semibold text-gray-900">
                ~${(item.estimatedPrice || item.price || 0).toLocaleString()}
              </p>
              <p className="text-[9px] text-gray-400">{item.priceCalculation}</p>
            </div>
          </div>

          {/* Travel Details */}
          {(item.departure_date || item.passengers) && (
            <div className="flex items-center gap-3 text-[10px] text-gray-600">
              {item.departure_date && (
                <span className="flex items-center gap-1">
                  <Clock size={10} className="text-gray-400" />
                  {new Date(item.departure_date).toLocaleDateString()} {item.departure_time}
                </span>
              )}
              {item.passengers && (
                <span className="flex items-center gap-1">
                  <Users size={10} className="text-gray-400" />
                  {item.passengers} pax
                </span>
              )}
            </div>
          )}

          {/* Fuel Notice */}
          <FuelNotice compact />

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <button
              onClick={() => onAddStop?.(item)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus size={10} />
              Add Stop
            </button>
            <button
              onClick={() => onEdit?.(item)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit2 size={10} />
              Edit
            </button>
            <button
              onClick={() => onRemove?.(item.cartId)}
              className="flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 size={10} />
            </button>
          </div>

          {/* Transfer Suggestion for overnight stops */}
          {hasOvernightStays && item.suggestedTransfers?.some(t => t.isOvernight && !t.cartId) && (
            <div className="p-2 bg-amber-50 border border-amber-100 rounded-lg">
              <div className="flex items-start gap-2">
                <Car size={12} className="text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[10px] font-medium text-amber-800">Airport Transfers Available</p>
                  <p className="text-[9px] text-amber-700">
                    Would you like to add luxury ground transport for your overnight stops?
                  </p>
                  <button
                    onClick={() => onAddTransfer?.(item)}
                    className="mt-1.5 text-[10px] font-medium text-amber-700 hover:text-amber-900 underline"
                  >
                    Add Transfers
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapsed Summary */}
      {!expanded && (
        <div className="p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-gray-600">
            <span>{totalDistanceNm} nm</span>
            <span>{formatDuration(item.totalFlightTime || item.flightTimeHours || 0)}</span>
            {item.stops?.length > 0 && (
              <span className="text-gray-400">{item.stops.length} stop{item.stops.length > 1 ? 's' : ''}</span>
            )}
          </div>
          <span className="font-semibold text-gray-900">
            ~${(item.estimatedPrice || item.price || 0).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default CartJourneyDisplay;
