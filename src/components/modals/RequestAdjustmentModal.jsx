import React, { useState } from 'react';
import { X, Calendar, Clock, Plus, Minus } from 'lucide-react';

const RequestAdjustmentModal = ({ item, onClose, onSave, onSendRequest }) => {
  const [adjustedItem, setAdjustedItem] = useState({
    ...item,
    passengers: item.passengers || 2,
    date: item.date || '',
    time: item.time || '',
    additionalServices: item.additionalServices || [],
    airportTransfer: item.airportTransfer || false
  });

  const [additionalService, setAdditionalService] = useState('');

  const isEmptyLeg = item.type === 'empty_legs';

  const handleChange = (field, value) => {
    setAdjustedItem(prev => ({ ...prev, [field]: value }));
  };

  const addAdditionalService = () => {
    if (!additionalService.trim()) return;
    setAdjustedItem(prev => ({
      ...prev,
      additionalServices: [...prev.additionalServices, additionalService]
    }));
    setAdditionalService('');
  };

  const removeAdditionalService = (index) => {
    setAdjustedItem(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    onSave(adjustedItem);
    onClose();
  };

  const handleSendRequest = () => {
    onSendRequest(adjustedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-black/10 w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="bg-black text-white px-8 py-6 rounded-t-3xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-light tracking-tight mb-2">{item.name || item.title}</h2>
              <p className="text-xs text-white/60 tracking-wider">ADJUST BOOKING DETAILS</p>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-2xl border border-white/20 hover:bg-white/10 flex items-center justify-center transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          {/* Current Details */}
          <div className="bg-black/5 border border-black/5 rounded-2xl p-6">
            <p className="text-[10px] text-black/30 tracking-widest uppercase mb-4">CURRENT BOOKING</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-black/40 mb-1">Price</p>
                <p className="text-sm font-light text-black">{item.currency} {item.price?.toLocaleString()}</p>
              </div>
              {item.from && (
                <div>
                  <p className="text-xs text-black/40 mb-1">Route</p>
                  <p className="text-sm font-light text-black">{item.from} → {item.to}</p>
                </div>
              )}
            </div>
          </div>

          {/* Passengers (not for empty legs) */}
          {!isEmptyLeg && (
            <div>
              <label className="text-[10px] text-black/30 tracking-widest uppercase mb-3 block">PASSENGERS</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleChange('passengers', Math.max(1, adjustedItem.passengers - 1))}
                  className="w-10 h-10 rounded-2xl border border-black/10 hover:bg-black/5 flex items-center justify-center transition-all"
                >
                  <Minus size={16} />
                </button>
                <span className="text-2xl font-light text-black min-w-[60px] text-center">{adjustedItem.passengers}</span>
                <button
                  onClick={() => handleChange('passengers', adjustedItem.passengers + 1)}
                  className="w-10 h-10 rounded-2xl border border-black/10 hover:bg-black/5 flex items-center justify-center transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Date (not for empty legs) */}
          {!isEmptyLeg && (
            <div>
              <label className="text-[10px] text-black/30 tracking-widest uppercase mb-3 block">
                <Calendar size={12} className="inline mr-2" />
                DEPARTURE DATE
              </label>
              <input
                type="date"
                value={adjustedItem.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full px-4 py-3 bg-transparent border-b border-black/20 outline-none text-sm text-black focus:border-black/40 transition-colors"
              />
            </div>
          )}

          {/* Time (not for empty legs) */}
          {!isEmptyLeg && (
            <div>
              <label className="text-[10px] text-black/30 tracking-widest uppercase mb-3 block">
                <Clock size={12} className="inline mr-2" />
                DEPARTURE TIME
              </label>
              <input
                type="time"
                value={adjustedItem.time}
                onChange={(e) => handleChange('time', e.target.value)}
                className="w-full px-4 py-3 bg-transparent border-b border-black/20 outline-none text-sm text-black focus:border-black/40 transition-colors"
              />
            </div>
          )}

          {/* Empty Leg: Airport Transfer */}
          {isEmptyLeg && (
            <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-6">
              <p className="text-xs text-black/60 mb-2 font-light">This empty leg has fixed departure time</p>
              <p className="text-sm text-black mb-4">Would you like ground transfer to/from the airport?</p>
              <button
                onClick={() => handleChange('airportTransfer', !adjustedItem.airportTransfer)}
                className={`px-4 py-2 rounded-2xl text-xs tracking-wider transition-all ${
                  adjustedItem.airportTransfer 
                    ? 'bg-black text-white' 
                    : 'bg-transparent border border-black/10 text-black hover:bg-black/5'
                }`}
              >
                {adjustedItem.airportTransfer ? 'TRANSFER INCLUDED' : 'ADD TRANSFER'}
              </button>
            </div>
          )}

          {/* Additional Services */}
          <div>
            <label className="text-[10px] text-black/30 tracking-widest uppercase mb-3 block">ADDITIONAL SERVICES</label>
            
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={additionalService}
                onChange={(e) => setAdditionalService(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') addAdditionalService();
                }}
                placeholder="Catering, champagne, special requests..."
                className="flex-1 px-4 py-3 bg-transparent border-b border-black/20 outline-none text-sm text-black placeholder-black/30 focus:border-black/40 transition-colors"
              />
              <button
                onClick={addAdditionalService}
                className="px-4 py-3 rounded-2xl bg-black text-white hover:bg-black/80 transition-all"
              >
                <Plus size={16} />
              </button>
            </div>

            {adjustedItem.additionalServices.length > 0 && (
              <div className="space-y-2">
                {adjustedItem.additionalServices.map((service, index) => (
                  <div key={index} className="flex items-center justify-between px-4 py-2 bg-black/5 border border-black/5 rounded-2xl">
                    <span className="text-xs text-black/60">{service}</span>
                    <button
                      onClick={() => removeAdditionalService(index)}
                      className="w-6 h-6 rounded-lg hover:bg-black/5 flex items-center justify-center text-black/40 transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-black/10 p-8 bg-white/60 rounded-b-3xl">
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 rounded-2xl bg-transparent border border-black/10 text-black hover:bg-black/5 text-xs tracking-widest transition-all"
            >
              SAVE CHANGES
            </button>
            <button
              onClick={handleSendRequest}
              className="flex-1 px-6 py-3 rounded-2xl bg-black text-white hover:bg-black/80 text-xs tracking-widest transition-all"
            >
              SEND REQUEST
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestAdjustmentModal;