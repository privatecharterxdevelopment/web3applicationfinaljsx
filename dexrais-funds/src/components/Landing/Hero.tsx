import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';

const rotatingTitles = [
  'Decentralized Fundraising Platform',
  'All-or-Nothing Campaigns',
  'Blockchain Powered Escrow',
  'Raise Funds On-Chain',
];

const features = [
  {
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80',
    title: 'Gnosis Safe Escrow',
    subtitle: 'Battle-tested Security',
    description: 'All funds locked in battle-tested multisig wallets. Automatic unlock at 100% goal or full refunds.',
    tags: ['Secure', 'Automated'],
  },
  {
    image: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&q=80',
    title: 'USDC Payments',
    subtitle: 'Stable Currency',
    description: 'Stable, predictable fundraising with USDC on Base Chain. Low fees, fast transactions.',
    tags: ['Fast', 'Low Fees'],
  },
  {
    image: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&q=80',
    title: 'All-or-Nothing',
    subtitle: 'Fair Funding',
    description: 'Campaigns only succeed at 100% funding goal. Builds confidence for backers and creators.',
    tags: ['Transparent', 'Fair'],
  },
  {
    image: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=800&q=80',
    title: '100% On-Chain',
    subtitle: 'Fully Decentralized',
    description: 'Fully decentralized with smart contracts. No intermediaries, no custody, full transparency.',
    tags: ['Trustless', 'Open'],
  },
];

export default function Hero() {
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);


  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentTitleIndex((prev) => (prev + 1) % rotatingTitles.length);
        setFadeIn(true);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white relative">
      {/* Shared Header Component */}
      <Header />

      {/* Hero Section - No Frame */}
      <div className="relative min-h-screen flex items-center justify-center bg-white px-3 pb-3 pt-[4rem]">
        {/* Content Container - No border */}
        <div className="relative w-full h-[calc(100vh-4rem)] bg-white p-12 flex flex-col items-center justify-center text-center overflow-hidden">
          {/* Content Layer */}
          <div className="relative z-10">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 mb-8">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-700 font-medium tracking-wide uppercase">Web3 Fundraising Platform</span>
          </div>

          {/* Main Title - Rotating with smooth fade */}
          <h1
            className={`text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tighter transition-opacity duration-500 ${
              fadeIn ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {rotatingTitles[currentTitleIndex]}
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto font-normal">
            Launch campaigns with Gnosis Safe escrow, USDC payments, and Aragon DAO governance.
            100% on-chain, fully decentralized.
          </p>

          {/* CTA Buttons - Enhanced Glass Effect with Rainbow Shine */}
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              to="/create"
              className="rainbow-shine px-6 py-2.5 bg-white/30 backdrop-blur-xl rounded-full text-sm font-medium text-gray-900 hover:bg-white/40 transition-all drop-shadow-lg border border-white/50 shadow-inner"
            >
              <span className="relative z-10">Launch Campaign</span>
            </Link>
            <Link
              to="/launchpad"
              className="rainbow-shine px-6 py-2.5 bg-white/30 backdrop-blur-xl rounded-full text-sm font-medium text-gray-900 hover:bg-white/40 transition-all drop-shadow-lg border border-white/50 shadow-inner"
            >
              <span className="relative z-10">Browse Campaigns</span>
            </Link>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
