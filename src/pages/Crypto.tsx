import React, { useState, useEffect } from 'react';
import { Coins, Shield, Users, ArrowRight, Check, ExternalLink, Globe, Award, CreditCard, FileText } from 'lucide-react';

export default function ICO() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleJoinWaitlist = () => {
    window.location.href = 'mailto:info@privatecharterx.com?subject=PVCX Token Waitlist Request';
  };

  const handleBuyOnUniswap = () => {
    window.open('https://app.uniswap.org', '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Clean Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-xl font-medium text-black">PrivateCharterX</div>
            <div className="flex items-center gap-3">
              <button className="text-gray-600 hover:text-black transition-colors text-sm">
                Connect Wallet
              </button>
              <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all transform hover:scale-105">
                Join Waitlist
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <div className={`max-w-6xl mx-auto px-6 py-20 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm text-gray-700 font-medium mb-8 shadow-sm border border-gray-100">
            <Coins size={16} />
            <span>PVCX Token Ecosystem</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extralight mb-6 tracking-tight text-black">
            The Future of 
            <span className="block font-light">Private Aviation</span>
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            Revolutionary tokenized aviation platform combining loyalty rewards, NFT memberships, and blockchain-powered flight booking.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={handleJoinWaitlist}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all transform hover:scale-105 shadow-lg"
            >
              <span>Join Waitlist</span>
              <ArrowRight size={18} />
            </button>
            <button
              onClick={handleBuyOnUniswap}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black border border-gray-200 rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105"
            >
              <span>Buy on Uniswap</span>
              <ExternalLink size={18} />
            </button>
          </div>
        </div>

        {/* 4 Main Feature Cards */}
        <div className="max-w-6xl mx-auto px-6 mb-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Token Card */}
            <div className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                <Coins size={20} className="text-white" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-black">PVCX Token</h3>
              <p className="text-gray-600 mb-4 text-xs leading-relaxed">
                Limited supply token. 5% of each booking flows into token supply.
              </p>
              <div className="space-y-1">
                <div className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">Limited Supply</div>
                <div className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">Booking Rewards</div>
                <div className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">Free Jet Flights</div>
              </div>
            </div>

            {/* Web3 Card */}
            <div className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                <Globe size={20} className="text-white" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-black">Web3 Platform</h3>
              <p className="text-gray-600 mb-4 text-xs leading-relaxed">
                Decentralized booking with smart contracts and transparent pricing.
              </p>
              <div className="space-y-1">
                <div className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">Smart Contracts</div>
                <div className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">DAO Governance</div>
                <div className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">Transparent</div>
              </div>
            </div>

            {/* NFT Member Card */}
            <div className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                <Award size={20} className="text-white" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-black">NFT Members</h3>
              <p className="text-gray-600 mb-4 text-xs leading-relaxed">
                Exclusive membership with premium benefits and special privileges.
              </p>
              <div className="space-y-1">
                <div className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">Premium Access</div>
                <div className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">VIP Benefits</div>
                <div className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">Free Empty Legs</div>
              </div>
            </div>

            {/* Licenses Card */}
            <div className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                <FileText size={20} className="text-white" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-black">Licenses</h3>
              <p className="text-gray-600 mb-4 text-xs leading-relaxed">
                Fully compliant with global aviation regulations and certifications.
              </p>
              <div className="space-y-1">
                <div className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">FAA Certified</div>
                <div className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">Global Compliance</div>
                <div className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">CO2 Certified</div>
              </div>
            </div>
          </div>
        </div>

        {/* Token Economics */}
        <div className="bg-white py-16 border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light mb-4 text-black">Token Economics</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Designed for sustainability and growth in the private aviation ecosystem
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Token Details */}
              <div className="bg-gray-50 p-8 rounded-2xl shadow-sm">
                <h3 className="text-xl font-medium mb-6 text-black">Token Specifications</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600 text-sm">Token Name</span>
                    <span className="font-medium text-black">PrivateCharterX Token</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600 text-sm">Symbol</span>
                    <span className="font-medium text-black">PVCX</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600 text-sm">Total Supply</span>
                    <span className="font-medium text-black">100,000,000 PVCX</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-600 text-sm">Booking Reward</span>
                    <span className="font-medium text-black">5% of each booking</span>
                  </div>
                </div>
              </div>

              {/* Distribution */}
              <div className="bg-gray-50 p-8 rounded-2xl shadow-sm">
                <h3 className="text-xl font-medium mb-6 text-black">Token Distribution</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <div>
                      <div className="font-medium text-black text-sm">Presale</div>
                      <div className="text-xs text-gray-500">Early supporters</div>
                    </div>
                    <span className="text-lg font-semibold text-black">30%</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <div>
                      <div className="font-medium text-black text-sm">Reward Pool</div>
                      <div className="text-xs text-gray-500">Flight rewards</div>
                    </div>
                    <span className="text-lg font-semibold text-black">25%</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <div>
                      <div className="font-medium text-black text-sm">Team & Advisors</div>
                      <div className="text-xs text-gray-500">12-month vesting</div>
                    </div>
                    <span className="text-lg font-semibold text-black">15%</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <div>
                      <div className="font-medium text-black text-sm">Marketing</div>
                      <div className="text-xs text-gray-500">Growth & partnerships</div>
                    </div>
                    <span className="text-lg font-semibold text-black">15%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NFT Membership Section */}
        <div className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light mb-4 text-black">NFT Membership</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Exclusive NFT membership offering unprecedented access to private aviation services
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="flex justify-center py-8">
                <div className="relative">
                  <div className="w-64 h-64 bg-gray-100 rounded-2xl shadow-lg flex items-center justify-center border border-gray-200 transform hover:scale-105 transition-all duration-500">
                    <video 
                      className="w-full h-full object-cover rounded-2xl"
                      src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/PrivateCharterX_transparent%20(1)%20(1).webm?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9Qcml2YXRlQ2hhcnRlclhfdHJhbnNwYXJlbnQgKDEpICgxKS53ZWJtIiwiaWF0IjoxNzU0MDQyNjIwLCJleHAiOjE3ODU1Nzg2MjB9.3kOuKPr5TzbAALEEgGHeFM0BFeLI7UloF1HXl0t-9Us"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-8 text-center">
                <h3 className="text-2xl font-light mb-4 text-black">Premium Membership NFT</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Exclusive membership with unprecedented access to private aviation services and premium benefits.
                </p>
                <button 
                  onClick={() => window.open('https://subtle-truffle-ac3f8c.netlify.app/web3/nft-collection', '_blank')}
                  className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-all transform hover:scale-105"
                >
                  Explore Collection
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CO2 Certification Section */}
        <div className="bg-white py-16 border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 font-medium mb-8">
              <Shield size={16} />
              <span>CO2 Neutral Aviation</span>
            </div>
            
            <h2 className="text-3xl font-light mb-6 text-black">Carbon Neutral Flight Program</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
              PrivateCharterX is pioneering sustainable aviation through blockchain-verified carbon offsetting and eco-friendly flight operations. Every flight booked through our platform contributes to verified carbon reduction projects worldwide.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-gray-50 p-6 rounded-xl">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌱</span>
                </div>
                <h3 className="font-medium mb-2 text-black">Verified Offsets</h3>
                <p className="text-sm text-gray-600">Blockchain-verified carbon credits from certified environmental projects</p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-xl">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="font-medium mb-2 text-black">Real-time Tracking</h3>
                <p className="text-sm text-gray-600">Live CO2 emissions tracking and offset allocation per flight</p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-xl">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏆</span>
                </div>
                <h3 className="font-medium mb-2 text-black">Industry Leading</h3>
                <p className="text-sm text-gray-600">First tokenized aviation platform with integrated carbon neutrality</p>
              </div>
            </div>

            <div className="bg-gray-100 p-8 rounded-2xl">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></div>
                <span className="text-lg font-medium text-gray-700">Coming Q2 2025</span>
                <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></div>
              </div>
              <p className="text-sm text-gray-600">
                Carbon certification program launching with comprehensive offset tracking and environmental impact reporting
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-light mb-4 text-black">Ready to Join the Future?</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Be among the first to experience tokenized luxury travel with environmental responsibility.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <button 
                onClick={handleJoinWaitlist}
                className="bg-black text-white px-8 py-4 rounded-lg font-medium hover:bg-gray-800 transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Join Waitlist</span>
                <ArrowRight size={18} />
              </button>
              <button 
                onClick={handleBuyOnUniswap}
                className="border border-gray-300 text-black px-8 py-4 rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <span>Buy PVCX Token</span>
                <ExternalLink size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500">
              info@privatecharterx.com
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}