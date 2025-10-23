import React from 'react';
import TokenSwap from './TokenSwap';
import LandingHeader from './LandingHeader';

interface TokenSwapPageProps {
  setCurrentPage?: (page: string) => void;
}

export default function TokenSwapPage({ setCurrentPage }: TokenSwapPageProps) {
  return (
    <div className="min-h-screen bg-gray-100 px-4 py-4">
      <LandingHeader />

      {/* TokenSwap Content - Centered */}
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-4">
        <div className="w-full max-w-md">
          <TokenSwap />
        </div>
      </div>
    </div>
  );
}