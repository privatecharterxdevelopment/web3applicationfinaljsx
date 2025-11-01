import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FloatingSearchModal() {
  const navigate = useNavigate();
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [titleOpacity, setTitleOpacity] = useState(1);
  const [currentOpenSection, setCurrentOpenSection] = useState<string | null>(null);

  const titles = [
    'Tokenizing global mobility',
    'Charter the smart way',
    'Blockchain powered travel'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleOpacity(0);
      setTimeout(() => {
        setCurrentTitleIndex((prev) => (prev + 1) % titles.length);
        setTitleOpacity(1);
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const toggleSection = (section: string) => {
    setCurrentOpenSection(currentOpenSection === section ? null : section);
  };

  const handleSphereAISearch = (query: string) => {
    if (query.trim()) {
      navigate(`/glasdashboard?query=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="w-full max-w-[750px] animate-float">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(2); opacity: 0; }
        }
        .animate-pulse { animation: pulse 2s ease-in-out infinite; }
        .pulse-ring::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          background: #10b981;
          border-radius: 50%;
          animation: pulse-ring 2s ease-in-out infinite;
        }
      `}</style>

      <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.06)] border border-white/20 transition-all duration-300 hover:bg-white/20 hover:shadow-[0_30px_80px_rgba(0,0,0,0.12),0_12px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">

        {/* Status Bubble */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100/60 backdrop-blur-sm rounded-full border border-gray-300/30 mb-5">
          <div className="w-2 h-2 bg-green-500 rounded-full relative animate-pulse pulse-ring"></div>
          <span className="text-xs text-gray-600 font-medium tracking-wide uppercase">web3 and ai powered multi charter</span>
        </div>

        {/* Animated Title */}
        <h1
          className="text-[42px] font-light text-gray-900 mb-3 leading-tight tracking-tight transition-all duration-500 pb-3 border-b border-gray-300/20"
          style={{ opacity: titleOpacity, transform: `translateY(${titleOpacity === 0 ? '-20px' : '0'})` }}
        >
          {titles[currentTitleIndex]}
        </h1>

        {/* Services Row */}
        <div className="flex gap-5 mt-4 flex-wrap">
          {[
            { id: 'rwa', label: 'RWA services' },
            { id: 'web3', label: 'web3.0' },
            { id: 'sphera', label: 'sphera ai' },
            { id: 'luxury', label: 'luxury travel planner' }
          ].map(service => (
            <div
              key={service.id}
              onClick={() => toggleSection(service.id)}
              className="flex items-center gap-2.5 px-3 py-2 cursor-pointer select-none border border-gray-300/25 rounded-full transition-all duration-200 hover:border-gray-300/40 hover:bg-white/10"
            >
              <div className={`w-6 h-6 flex items-center justify-center text-gray-900 text-2xl font-light transition-transform duration-300 ${currentOpenSection === service.id ? 'rotate-45' : ''}`}>
                +
              </div>
              <span className="text-sm text-gray-700 font-medium tracking-wide">{service.label}</span>
            </div>
          ))}
        </div>

        {/* RWA Categories */}
        <div className={`flex flex-wrap gap-2 px-1 transition-all duration-400 ${currentOpenSection === 'rwa' ? 'max-h-[300px] opacity-100 mt-3 mb-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          {['emptylegs', 'p/jets', 'g/transport', 'charter'].map(cat => (
            <div key={cat} className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 cursor-pointer transition-all duration-200 border border-gray-300 font-medium hover:bg-gray-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-gray-400">
              {cat}
            </div>
          ))}
        </div>

        {/* Web3 Categories */}
        <div className={`flex flex-wrap gap-2 px-1 transition-all duration-400 ${currentOpenSection === 'web3' ? 'max-h-[300px] opacity-100 mt-3 mb-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          {['tokenize asset', 'NFTs', 'DAO', 'buy/sell', 'pvcx'].map(cat => (
            <div key={cat} className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 cursor-pointer transition-all duration-200 border border-gray-300 font-medium hover:bg-gray-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-gray-400">
              {cat}
            </div>
          ))}
        </div>

        {/* Sphera Categories */}
        <div className={`flex flex-wrap gap-2 px-1 transition-all duration-400 ${currentOpenSection === 'sphera' ? 'max-h-[300px] opacity-100 mt-3 mb-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          {['plan a trip', 'form spv'].map(cat => (
            <div key={cat} className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 cursor-pointer transition-all duration-200 border border-gray-300 font-medium hover:bg-gray-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-gray-400">
              {cat}
            </div>
          ))}
        </div>

        {/* Sphera AI Search Bar */}
        <div className={`transition-all duration-400 ${currentOpenSection === 'sphera' ? 'max-h-[100px] opacity-100 mt-3' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-100/60 backdrop-blur-sm rounded-2xl border border-gray-300/50 transition-all duration-200 focus-within:bg-gray-100/80 focus-within:border-gray-400 focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.05)]">
            <svg className="text-gray-600 w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Ask Sphera AI about PrivateCharterX..."
              className="flex-1 bg-transparent border-none outline-none text-[15px] text-gray-900 placeholder-gray-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSphereAISearch((e.target as HTMLInputElement).value);
                }
              }}
            />
            <button
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                handleSphereAISearch(input.value);
              }}
              className="w-8 h-8 rounded-xl bg-gray-900/80 text-white flex items-center justify-center transition-all duration-200 hover:bg-gray-900 hover:scale-105 active:scale-95 shadow-md"
            >
              <svg className="w-4 h-4" fill="currentColor" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>

        {/* Luxury Travel Categories */}
        <div className={`flex flex-wrap gap-2 px-1 transition-all duration-400 ${currentOpenSection === 'luxury' ? 'max-h-[300px] opacity-100 mt-3 mb-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          {['concierge service', 'VIP experience', 'bespoke itinerary'].map(cat => (
            <div key={cat} className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 cursor-pointer transition-all duration-200 border border-gray-300 font-medium hover:bg-gray-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-gray-400">
              {cat}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
