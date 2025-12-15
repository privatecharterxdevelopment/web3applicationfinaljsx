import React, { useState } from 'react';
import { X, Car, MapPin, Check, ChevronRight, Moon } from 'lucide-react';

const AirportTransferOffer = ({
  airports,  // Array of { code, city, name, isOvernight }
  onAddTransfer,  // (airport) => void
  onAddAllTransfers,  // () => void
  onSkip,
  onClose
}) => {
  const [selectedAirports, setSelectedAirports] = useState(
    // Pre-select overnight stops
    airports.filter(a => a.isOvernight).map(a => a.code)
  );

  const toggleAirport = (code) => {
    setSelectedAirports(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const handleAddSelected = () => {
    selectedAirports.forEach(code => {
      const airport = airports.find(a => a.code === code);
      if (airport) {
        onAddTransfer(airport);
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Car size={20} className="text-gray-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Airport Transfers</h3>
              <p className="text-xs text-gray-500">Complete your journey with luxury ground transport</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-600">
            Would you like to arrange luxury chauffeur service at your arrival airports?
          </p>

          <div className="space-y-2">
            {airports.map((airport) => (
              <button
                key={airport.code}
                onClick={() => toggleAirport(airport.code)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  selectedAirports.includes(airport.code)
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Checkbox */}
                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                  selectedAirports.includes(airport.code)
                    ? 'bg-gray-900'
                    : 'bg-white border-2 border-gray-300'
                }`}>
                  {selectedAirports.includes(airport.code) && (
                    <Check size={12} className="text-white" />
                  )}
                </div>

                {/* Airport Info */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {airport.city}
                    </span>
                    <span className="text-xs font-mono text-gray-500">({airport.code})</span>
                    {airport.isOvernight && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 rounded text-[10px] font-medium text-amber-700">
                        <Moon size={8} />
                        Overnight
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{airport.name}</p>
                </div>

                {/* Arrow */}
                <ChevronRight size={16} className="text-gray-400" />
              </button>
            ))}
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
            <MapPin size={14} className="text-gray-500 mt-0.5" />
            <p className="text-xs text-gray-600">
              Our coordinators will contact you to arrange pickup locations and times for each transfer.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-2">
          <div className="flex gap-3">
            <button
              onClick={onSkip}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Skip for Now
            </button>
            <button
              onClick={handleAddSelected}
              disabled={selectedAirports.length === 0}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                selectedAirports.length > 0
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Car size={16} />
              Add {selectedAirports.length > 0 ? `${selectedAirports.length} Transfer${selectedAirports.length > 1 ? 's' : ''}` : 'Transfers'}
            </button>
          </div>
          <p className="text-[10px] text-gray-500 text-center">
            Transfers can be added later from your cart
          </p>
        </div>
      </div>
    </div>
  );
};

export default AirportTransferOffer;
