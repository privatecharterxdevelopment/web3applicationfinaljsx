import React, { useState } from 'react';
import { Users, Clock, Gauge, ChevronRight } from 'lucide-react';

// Jet Categories with specifications
const jetCategories = [
  {
    id: 'very-light',
    name: 'Very Light Jet',
    pricePerHour: 3500,
    capacity: 4,
    speed: 650,
    range: 2200,
    co2PerHour: 0.8,
    co2OffsetPerHour: 64,
    description: 'Perfect for short trips',
    examples: ['Citation Mustang', 'Phenom 100']
  },
  {
    id: 'light',
    name: 'Light Jet',
    pricePerHour: 4500,
    capacity: 6,
    speed: 720,
    range: 3000,
    co2PerHour: 1.2,
    co2OffsetPerHour: 96,
    description: 'Ideal for regional travel',
    examples: ['Citation CJ3+', 'Learjet 75']
  },
  {
    id: 'mid-size',
    name: 'Mid-Size Jet',
    pricePerHour: 6500,
    capacity: 9,
    speed: 750,
    range: 4500,
    co2PerHour: 1.8,
    co2OffsetPerHour: 144,
    description: 'Comfortable for medium distances',
    examples: ['Citation Latitude', 'Learjet 60XR']
  },
  {
    id: 'super-mid',
    name: 'Super Mid-Size',
    pricePerHour: 8500,
    capacity: 10,
    speed: 800,
    range: 6000,
    co2PerHour: 2.2,
    co2OffsetPerHour: 176,
    description: 'Premium comfort and range',
    examples: ['Citation X+', 'Challenger 350']
  },
  {
    id: 'heavy',
    name: 'Heavy Jet',
    pricePerHour: 12000,
    capacity: 14,
    speed: 850,
    range: 7500,
    co2PerHour: 3.1,
    co2OffsetPerHour: 248,
    description: 'Spacious cabin for long flights',
    examples: ['Gulfstream G450', 'Falcon 7X']
  },
  {
    id: 'ultra-long',
    name: 'Ultra Long Range',
    pricePerHour: 16000,
    capacity: 16,
    speed: 900,
    range: 12000,
    co2PerHour: 3.8,
    co2OffsetPerHour: 304,
    description: 'Ultimate luxury and range',
    examples: ['Gulfstream G650', 'Global 7500']
  }
];

interface JetCategorySelectorProps {
  distance: number;
  passengers: number;
  onCategorySelect: (category: any) => void;
  onBack: () => void;
}

export default function JetCategorySelector({ 
  distance, 
  passengers, 
  onCategorySelect,
  onBack 
}: JetCategorySelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDuration = (distance: number, speed: number) => {
    const hours = distance / speed;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getEstimatedTotal = (category: any) => {
    const flightHours = distance / category.speed;
    return Math.round(flightHours * category.pricePerHour);
  };

  const handleContinue = () => {
    const category = jetCategories.find(c => c.id === selectedCategory);
    if (category) {
      onCategorySelect(category);
    }
  };

  // Filter categories that can accommodate the passengers
  const suitableCategories = jetCategories.filter(cat => cat.capacity >= passengers);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col h-full max-h-[90vh]">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-light text-black">Select Aircraft Category</h1>
            <p className="text-sm text-gray-500 mt-1">
              {Math.round(distance)} km • {passengers} passengers
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-4">
          {suitableCategories.map((category) => {
            const isSelected = selectedCategory === category.id;
            const flightTime = formatDuration(distance, category.speed);
            const estimatedTotal = getEstimatedTotal(category);
            
            return (
              <div
                key={category.id}
                className={`border rounded-xl p-5 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-black bg-gray-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-black bg-black' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <h3 className="text-lg font-medium text-black">{category.name}</h3>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                    
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users size={14} />
                        <span>{category.capacity} seats</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={14} />
                        <span>{flightTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Gauge size={14} />
                        <span>{category.speed} km/h</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Examples: {category.examples.join(', ')}
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="text-sm text-gray-600">From</div>
                    <div className="text-xl font-light text-black">{formatPrice(estimatedTotal)}</div>
                    <div className="text-xs text-gray-500">{formatPrice(category.pricePerHour)}/hour</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100">
        <button
          onClick={handleContinue}
          disabled={!selectedCategory}
          className={`w-full py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
            selectedCategory
              ? 'bg-black text-white hover:bg-gray-800'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
