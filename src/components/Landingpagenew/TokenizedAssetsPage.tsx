import React from 'react';
import { Sparkles } from 'lucide-react';

const TokenizedAssetsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Tokenized Assets</h2>
          <p className="text-sm text-gray-600">View and manage your tokenized assets</p>
        </div>

        {/* Content */}
        <div className="bg-gray-100/40 rounded-xl p-8 text-center">
          <Sparkles size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tokenized Assets Yet</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Your tokenized assets will appear here once you create them
          </p>
        </div>
      </div>
    </div>
  );
};

export default TokenizedAssetsPage;