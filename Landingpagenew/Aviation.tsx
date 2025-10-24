import React from 'react';
import LandingHeader from './LandingHeader';
import {
  Plane,
  Shield,
  Coins,
  Clock,
  Globe,
  Star,
  Users,
  Zap,
  ChevronDown,
  ArrowRight,
  Check,
  Leaf,
  Award,
  MapPin,
  Calendar,
  Headphones,
  Sparkles,
  TrendingUp,
  Wind,
  Battery,
  Settings,
  Info
} from 'lucide-react';

interface AviationProps {
  setCurrentPage: (page: string) => void;
}

function Aviation({ setCurrentPage }: AviationProps) {

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-4">
      <LandingHeader />

      {/* Hero Section with Background Image - Shorter Height */}
      <section className="relative px-4 sm:px-8 py-12 sm:py-16 max-w-7xl mx-auto rounded-2xl overflow-hidden mb-6 sm:mb-8" style={{
        backgroundImage: 'url(/bgd9a4m7.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/60 rounded-2xl"></div>
        
        <div className="relative z-10 text-center text-white">
          <div className="mb-6">
            <span className="bg-white/20 backdrop-blur-sm text-white px-3 sm:px-4 py-2 rounded-full text-xs font-medium tracking-wide uppercase border border-white/30">
              Access to 16,000+ Jets Worldwide
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light mb-4 sm:mb-6 leading-tight tracking-tight">
            Reinventing private aviation<br />
            <span className="font-medium">Blockchain-Powered travel</span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-200 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
            Experience the future of private aviation with transparent pricing, sustainable flight certificates, 
            and 24/7 blockchain-integrated service.
          </p>

          {/* Key Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-xl sm:text-2xl font-light mb-1">16,000+</div>
              <p className="text-xs sm:text-sm text-gray-300">Global Aircraft Fleet</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-2xl font-light mb-1">24/7</div>
              <p className="text-sm text-gray-300">Concierge Service</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-2xl font-light mb-1">100%</div>
              <p className="text-sm text-gray-300">Blockchain Verified</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <button 
              onClick={() => setCurrentPage('dashboard')}
              className="bg-white text-gray-900 px-6 sm:px-8 py-2.5 sm:py-3 rounded-md text-sm hover:bg-gray-100 transition-colors font-medium"
            >
              Book Your Flight
            </button>
            <button 
              onClick={() => setCurrentPage('dashboard')}
              className="border border-white/30 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-md text-sm hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              Explore Empty Legs
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
        {/* Our Aviation Services */}
        <section className="px-8 py-20 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-gray-900 mb-6 leading-tight">
              Our Aviation Services<br />
              <span className="font-medium">Comprehensive Air Travel Solutions</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From traditional private jets to cutting-edge eVTOLs, we provide access to the world's 
              most comprehensive aviation network with full blockchain transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Private Jets */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
              {/* Image Header */}
              <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl flex items-center justify-center">
                <div className="w-20 h-20 bg-gray-300 rounded-2xl flex items-center justify-center">
                  <Plane className="w-10 h-10 text-gray-600" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-medium text-gray-900 mb-4">Private Jets</h3>
                <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                  Access to 16,000+ private jets worldwide. From light jets for short trips to 
                  ultra-long-range aircraft for intercontinental travel.
                </p>
                {/* Grey Message Bubbles */}
                <div className="space-y-2 mb-6">
                  <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-xs inline-block mr-2">
                    Global fleet access
                  </div>
                  <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-xs inline-block mr-2">
                    Instant booking
                  </div>
                  <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-xs inline-block">
                    Transparent pricing
                  </div>
                </div>
                <button className="text-gray-900 font-medium text-sm flex items-center hover:text-gray-700 transition-colors">
                  <span onClick={() => setCurrentPage('dashboard')}>Explore Jets</span> <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>

            {/* Empty Legs */}
            <div className="bg-gray-900 text-white rounded-2xl overflow-hidden relative">
              <div className="absolute top-4 right-4 bg-white text-gray-900 px-3 py-1 rounded-full text-xs font-medium">
                NFT Perk
              </div>
              {/* Image Header */}
              <div className="h-40 bg-gradient-to-br from-gray-700 to-gray-800 rounded-t-2xl flex items-center justify-center">
                <div className="w-20 h-20 bg-gray-600 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-medium mb-4">Empty Legs</h3>
                <p className="text-gray-300 mb-6 leading-relaxed text-sm">
                  Exclusive access to empty leg flights at up to 75% off regular prices. 
                  NFT members get select free empty legs.
                </p>
                {/* Grey Message Bubbles */}
                <div className="space-y-2 mb-6">
                  <div className="bg-gray-700 text-gray-200 px-3 py-2 rounded-full text-xs inline-block mr-2">
                    Up to 75% savings
                  </div>
                  <div className="bg-gray-700 text-gray-200 px-3 py-2 rounded-full text-xs inline-block mr-2">
                    Free flights for NFT holders
                  </div>
                  <div className="bg-gray-700 text-gray-200 px-3 py-2 rounded-full text-xs inline-block">
                    Real-time availability
                  </div>
                </div>
                <button className="text-white font-medium text-sm flex items-center hover:text-gray-200 transition-colors">
                  <span onClick={() => setCurrentPage('dashboard')}>View Empty Legs</span> <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>

            {/* Group Charter */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
              {/* Image Header */}
              <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl flex items-center justify-center">
                <div className="w-20 h-20 bg-gray-300 rounded-2xl flex items-center justify-center">
                  <Users className="w-10 h-10 text-gray-600" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-medium text-gray-900 mb-4">Group Charter</h3>
                <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                  Tailored solutions for corporate events, sports teams, and large group travel 
                  with customized itineraries and dedicated service.
                </p>
                {/* Grey Message Bubbles */}
                <div className="space-y-2 mb-6">
                  <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-xs inline-block mr-2">
                    Custom itineraries
                  </div>
                  <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-xs inline-block mr-2">
                    Dedicated coordinator
                  </div>
                  <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-xs inline-block">
                    Volume discounts
                  </div>
                </div>
                <button className="text-gray-900 font-medium text-sm flex items-center hover:text-gray-700 transition-colors">
                  <span onClick={() => setCurrentPage('dashboard')}>Plan Group Travel</span> <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>

            {/* Helicopter */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
              {/* Image Header */}
              <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl flex items-center justify-center">
                <div className="w-20 h-20 bg-gray-300 rounded-2xl flex items-center justify-center">
                  <Settings className="w-10 h-10 text-gray-600" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-medium text-gray-900 mb-4">Helicopter</h3>
                <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                  Perfect for short-distance travel, city transfers, and accessing remote locations 
                  with precision and flexibility.
                </p>
                {/* Grey Message Bubbles */}
                <div className="space-y-2 mb-6">
                  <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-xs inline-block mr-2">
                    City center access
                  </div>
                  <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-xs inline-block mr-2">
                    Remote destinations
                  </div>
                  <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-xs inline-block">
                    Quick transfers
                  </div>
                </div>
                <button className="text-gray-900 font-medium text-sm flex items-center hover:text-gray-700 transition-colors">
                  <span onClick={() => setCurrentPage('dashboard')}>Book Helicopter</span> <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>

            {/* eVTOL */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-6 right-6 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium z-10">
                Coming Soon
              </div>
              {/* Image Header */}
              <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl flex items-center justify-center">
                <div className="w-20 h-20 bg-gray-300 rounded-2xl flex items-center justify-center">
                  <Zap className="w-10 h-10 text-gray-600" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-medium text-gray-900 mb-4">eVTOL</h3>
                <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                  The future of urban air mobility. Electric vertical takeoff and landing aircraft 
                  for sustainable, efficient city travel.
                </p>
                {/* Grey Message Bubbles */}
                <div className="space-y-2 mb-6">
                  <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-xs inline-block mr-2">
                    Zero emissions
                  </div>
                  <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-xs inline-block mr-2">
                    Quiet operation
                  </div>
                  <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-xs inline-block">
                    Urban mobility
                  </div>
                </div>
                <button className="text-gray-900 font-medium text-sm flex items-center hover:text-gray-700 transition-colors">
                  <span onClick={() => setCurrentPage('dashboard')}>Learn More</span> <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>

            {/* 24/7 Service */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
              {/* Image Header */}
              <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl flex items-center justify-center">
                <div className="w-20 h-20 bg-gray-300 rounded-2xl flex items-center justify-center">
                  <Headphones className="w-10 h-10 text-gray-600" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-medium text-gray-900 mb-4">24/7 Concierge</h3>
                <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                  Round-the-clock support from our aviation experts. From booking to landing, 
                  we're here to ensure your journey is seamless.
                </p>
                {/* Grey Message Bubbles */}
                <div className="space-y-2 mb-6">
                  <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-xs inline-block mr-2">
                    24/7 availability
                  </div>
                  <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-xs inline-block mr-2">
                    Expert aviation team
                  </div>
                  <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-xs inline-block">
                    Personalized service
                  </div>
                </div>
                <button className="text-gray-900 font-medium text-sm flex items-center hover:text-gray-700 transition-colors">
                  <span onClick={() => setCurrentPage('dashboard')}>Contact Support</span> <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Sustainability & Transparency */}
        <section className="px-8 py-20 max-w-6xl mx-auto border-t border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-light text-gray-900 mb-6 leading-tight">
                Sustainability & Transparency<br />
                <span className="font-medium">Blockchain-Certified Green Aviation</span>
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Every flight comes with optional blockchain-verified CO2 and SAF (Sustainable Aviation Fuel) 
                certificates, providing unprecedented transparency in aviation's environmental impact.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                    <Leaf className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-2">CO2 Certificates</h4>
                    <p className="text-sm text-gray-600">Blockchain-verified carbon footprint tracking for every flight with offset options</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                    <Award className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-2">SAF Certificates</h4>
                    <p className="text-sm text-gray-600">Sustainable Aviation Fuel usage verification through immutable blockchain records</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                    <Shield className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-2">Transparent Pricing</h4>
                    <p className="text-sm text-gray-600">All costs, fees, and environmental impacts clearly displayed and blockchain-verified</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <h3 className="text-xl font-medium text-gray-900 mb-6">Environmental Impact Dashboard</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Flights with SAF</span>
                  <span className="text-lg font-medium text-gray-900">23%</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">CO2 Offset Programs</span>
                  <span className="text-lg font-medium text-gray-900">89%</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Blockchain Certificates</span>
                  <span className="text-lg font-medium text-gray-900">100%</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-gray-600">Carbon Neutral Flights</span>
                  <span className="text-lg font-medium text-gray-900">67%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Commitment */}
        <section className="px-8 py-20 max-w-6xl mx-auto border-t border-gray-100">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-gray-900 mb-6 leading-tight">
              Our Commitment<br />
              <span className="font-medium">Brokers Today, Operators Tomorrow</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Currently serving as your trusted aviation brokers with full blockchain integration, 
              we're building toward becoming future operators in the evolving aviation landscape.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Headphones className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">24/7 Broker Service</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Our expert team provides round-the-clock support, ensuring seamless booking 
                and travel coordination for all your aviation needs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Blockchain Integration</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Every transaction, certificate, and booking is secured and verified through 
                blockchain technology for maximum transparency and trust.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Future Operations</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                We're actively developing our capabilities to become direct operators, 
                bringing even more control and innovation to your aviation experience.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* CTA Section */}
      <section className="px-8 py-20 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-light text-gray-900 mb-4">Ready to Take Flight?</h2>
        <p className="text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
          Experience the future of aviation with blockchain-verified transparency, 
          sustainable options, and unmatched service quality.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <button 
            onClick={() => setCurrentPage('dashboard')}
            className="bg-gray-900 text-white px-8 py-3 rounded-md text-sm hover:bg-gray-800 transition-colors flex items-center justify-center"
          >
            Book Your Flight
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
          <button 
            onClick={() => setCurrentPage('dashboard')}
            className="border border-gray-200 text-gray-700 px-8 py-3 rounded-md text-sm hover:bg-gray-50 transition-colors"
          >
            Explore Empty Legs
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 px-8 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Logo and Description */}
            <div className="lg:col-span-1">
              <img src="/PRIVATECHARTER__18_-removebg-preview.png" alt="PrivateCharterX" className="h-16 w-auto mb-4" />
              <p className="text-sm text-gray-500 leading-relaxed">
                Blockchain-powered private aviation platform revolutionizing luxury travel.
              </p>
            </div>

            {/* Aviation Services */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Aviation Services</h4>
              <div className="space-y-3">
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Private Jet Charter
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Group Charter
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Helicopter Charter
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  eVTOL Flights
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Adventure Packages
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Empty Legs
                </button>
              </div>
            </div>

            {/* Web3 & Digital */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Web3 & Digital</h4>
              <div className="space-y-3">
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Web3
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  PVCX Token
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  NFT Aviation
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Asset Licensing
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  JetCard Packages
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  CO2 Certificates
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Marketplace
                </button>
              </div>
            </div>

            {/* Partners & Press */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Partners & Press</h4>
              <div className="space-y-3">
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Partner With Us
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Blog Posts
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Press Center
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Quick Links</h4>
              <div className="space-y-3">
                <button 
                  onClick={() => setCurrentPage('home')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Home
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  How It Works
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  About
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  FAQ
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Support
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-400 mb-4 md:mb-0">©2023-2025 PrivateCharterX. All rights reserved.</p>
            <div className="flex space-x-6">
              <button 
                onClick={() => setCurrentPage('helpdesk')}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Privacy
              </button>
              <button 
                onClick={() => setCurrentPage('helpdesk')}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Terms
              </button>
              <button 
                onClick={() => setCurrentPage('helpdesk')}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Support
              </button>
              <button 
                onClick={() => setCurrentPage('helpdesk')}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Helpdesk
              </button>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default Aviation;