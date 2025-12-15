import React from 'react';
import { Plane, Clock, ArrowRight, Moon, MapPin } from 'lucide-react';
import { formatDuration, kmToNm } from '../../utils/routeCalculator';

const LegCard = ({ leg, index, isLast, stop }) => {
  const distanceNm = Math.round(kmToNm(leg.distance));

  return (
    <div className="relative">
      {/* Leg Info */}
      <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100">
        {/* Leg Number */}
        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-gray-600">{index + 1}</span>
        </div>

        {/* Route */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-gray-900">{leg.fromCode || leg.from?.substring(0, 3).toUpperCase()}</span>
            <ArrowRight size={12} className="text-gray-400" />
            <span className="text-xs font-mono font-bold text-gray-900">{leg.toCode || leg.to?.substring(0, 3).toUpperCase()}</span>
          </div>
          <p className="text-[10px] text-gray-500 truncate">
            {leg.from} → {leg.to}
          </p>
        </div>

        {/* Distance & Time */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-xs font-medium text-gray-900">{distanceNm} nm</p>
            <p className="text-[10px] text-gray-500">{leg.distance} km</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-gray-900">{formatDuration(leg.flightTime)}</p>
            <p className="text-[10px] text-gray-500">
              {leg.departureTime} - {leg.arrivalTime}
            </p>
          </div>
        </div>
      </div>

      {/* Stop Duration (if not last leg) */}
      {stop && !isLast && (
        <div className={`ml-3 mt-1 mb-1 flex items-center gap-2 px-2 py-1 rounded text-[10px] ${
          stop.isOvernight
            ? 'bg-amber-50 text-amber-700'
            : 'bg-gray-50 text-gray-600'
        }`}>
          {stop.isOvernight ? (
            <Moon size={10} className="text-amber-500" />
          ) : (
            <Clock size={10} className="text-gray-400" />
          )}
          <span>
            {stop.isOvernight ? 'Overnight' : 'Stop'} in {stop.city}: {formatDuration(stop.stopDuration / 60)}
          </span>
        </div>
      )}

      {/* Connecting Line */}
      {!isLast && (
        <div className="absolute left-[18px] top-[38px] bottom-0 w-px bg-gray-200" style={{ height: stop ? '32px' : '8px' }} />
      )}
    </div>
  );
};

export default LegCard;
