// src/components/booking-steps/ServicesStep.tsx
import React from 'react';

interface Service {
  id: string;
  name: string;
  desc: string;
  image: string;
  nftFree?: boolean;
}

interface ServicesStepProps {
  luxuryServices: Service[];
  selectedLuxuryServices: string[];
  setSelectedLuxuryServices: (services: string[] | ((prev: string[]) => string[])) => void;
}

export default function ServicesStep({
  luxuryServices,
  selectedLuxuryServices,
  setSelectedLuxuryServices
}: ServicesStepProps) {
  return (
    <div className="space-y-6 animate-slideIn">
      <h3 className="text-sm font-medium text-gray-700 mb-4">PrivateCharterX Services</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {luxuryServices.map(service => {
          const isSelected = selectedLuxuryServices.includes(service.id);
          return (
            <button
              key={service.id}
              onClick={() => {
                setSelectedLuxuryServices(prev =>
                  isSelected
                    ? prev.filter(id => id !== service.id)
                    : [...prev, service.id]
                );
              }}
              className={`p-4 rounded-xl border transition-all ${isSelected
                ? 'border-black bg-gray-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
            >
              <div className="text-3xl mb-2 mx-auto">{service.image}</div>
              <div className="text-xs font-medium text-gray-900">{service.name}</div>
              <div className="text-[10px] text-gray-500 mt-1">{service.desc}</div>
              {service.nftFree && (
                <div className="text-[10px] text-green-600 mt-1">Free with NFT</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}