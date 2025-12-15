import React from 'react';
import { Fuel, Info } from 'lucide-react';

const FuelNotice = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
        <Fuel size={10} className="text-gray-400" />
        <span>Fuel costs included in final quote</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-100 rounded-xl">
      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
        <Fuel size={12} className="text-green-600" />
      </div>
      <div>
        <p className="text-xs font-medium text-green-800">Fuel Costs Included</p>
        <p className="text-[10px] text-green-700 mt-0.5">
          All fuel costs are included in the final quote you'll receive from our flight coordinators.
          No hidden fees or surprises.
        </p>
      </div>
    </div>
  );
};

export default FuelNotice;
