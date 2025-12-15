import React from 'react';
import { Moon, AlertTriangle, Hotel, Car, X, Check } from 'lucide-react';
import { formatDuration } from '../../utils/routeCalculator';

const OvernightWarning = ({ stop, onAcknowledge, onClose }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-amber-50 border-b border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Moon size={20} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-amber-900">Overnight Stay Detected</h3>
              <p className="text-xs text-amber-700">
                {stop.city} • {formatDuration(stop.stopDuration / 60)}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600">
            Your stop in <span className="font-medium text-gray-900">{stop.city}</span> ({formatDuration(stop.stopDuration / 60)})
            suggests an overnight stay. This may affect:
          </p>

          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-gray-600">
              <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <span>Aircraft availability (crew rest requirements)</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-600">
              <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <span>Additional parking and handling fees</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-600">
              <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <span>Requires double confirmation from coordinators</span>
            </li>
          </ul>

          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-3">Would you like us to arrange:</p>
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-700 transition-colors">
                <Hotel size={14} />
                Hotel
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-700 transition-colors">
                <Car size={14} />
                Transfer
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onAcknowledge}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Check size={16} />
            I Understand, Continue
          </button>
          <p className="text-[10px] text-gray-500 text-center mt-2">
            Our coordinators will confirm availability and final pricing
          </p>
        </div>
      </div>
    </div>
  );
};

export default OvernightWarning;
