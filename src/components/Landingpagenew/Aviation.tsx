import React from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from './LandingHeader';
import Footer from './Footer';
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
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-4">
      <LandingHeader />

      {/* Hero Section with Background Image - Shorter Height */}
      <section className="relative px-4 sm:px-8 py-12 sm:py-16 max-w-7xl mx-auto rounded-2xl overflow-hidden mb-6 sm:mb-8" style={{
        backgroundImage: 'url(https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/winery/Privatecharterx_clouds.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/30 rounded-2xl"></div>

        <div className="relative z-10 text-center text-white">
          <div className="mb-6">
            <span className="bg-white/20 backdrop-blur-sm text-white px-3 sm:px-4 py-2 rounded-full text-xs font-medium tracking-wide uppercase border border-white/30">
              Access to 16,000+ Jets Worldwide
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-white mb-4 sm:mb-6 leading-tight tracking-tight">
            Reinventing private aviation<br />
            <span className="text-gray-900">Blockchain-Powered travel</span>
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
              onClick={() => navigate('/dashboard/chat?newChat=true')}
              className="bg-white text-gray-900 px-6 sm:px-8 py-2.5 sm:py-3 rounded-md text-sm hover:bg-gray-100 transition-colors font-medium"
            >
              Book Your Flight
            </button>
            <button
              onClick={() => navigate('/dashboard/empty-legs')}
              className="border border-white/30 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-md text-sm hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              Explore Empty Legs
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto">
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
            <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer">
              {/* Image Header */}
              <div className="w-full h-32 overflow-hidden">
                <img src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/winery/Privatecharterx_privatejet_charter.png" alt="Private Jets" className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">Private Jets</h3>
                <p className="text-gray-600 text-sm leading-snug mb-3">
                  Access to 16,000+ private jets worldwide. From light jets for short trips to
                  ultra-long-range aircraft for intercontinental travel.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                    Global fleet access
                  </span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                    Instant booking
                  </span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                    Transparent pricing
                  </span>
                </div>
                <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">+</div>
              </div>
            </div>

            {/* Empty Legs */}
            <div className="bg-gray-900 text-white rounded-2xl overflow-hidden relative">
              <div className="absolute top-4 right-4 bg-white text-gray-900 px-3 py-1 rounded-full text-xs font-medium">
                NFT Perk
              </div>
              {/* Image Header */}
              <div className="h-40 overflow-hidden">
                <img src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/winery/privatecharterx_emptylegs.png" alt="Empty Legs" className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-light mb-3 leading-tight">Empty Legs</h3>
                <p className="text-gray-300 text-sm leading-snug mb-3">
                  Exclusive access to empty leg flights at up to 75% off regular prices.
                  NFT members get select free empty legs.
                </p>
                {/* Tags */}
                <div className="space-y-2 mb-6">
                  <div className="bg-gray-700 text-gray-200 px-2 py-1 rounded-full text-xs inline-block mr-2">
                    Up to 75% savings
                  </div>
                  <div className="bg-gray-700 text-gray-200 px-2 py-1 rounded-full text-xs inline-block mr-2">
                    Free flights for NFT holders
                  </div>
                  <div className="bg-gray-700 text-gray-200 px-2 py-1 rounded-full text-xs inline-block">
                    Real-time availability
                  </div>
                </div>
                <button
                  onClick={() => navigate('/dashboard/empty-legs')}
                  className="text-white font-light text-sm flex items-center hover:text-gray-200 transition-colors"
                >
                  View Empty Legs <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>

            {/* Group Charter */}
            <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer">
              {/* Image Header */}
              <div className="w-full h-32 overflow-hidden">
                <img src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/winery/privatecharterx_group_charter.png" alt="Group Charter" className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">Group Charter</h3>
                <p className="text-gray-600 text-sm leading-snug mb-3">
                  Tailored solutions for corporate events, sports teams, and large group travel
                  with customized itineraries and dedicated service.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                    Custom itineraries
                  </span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                    Dedicated coordinator
                  </span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                    Volume discounts
                  </span>
                </div>
                <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">+</div>
              </div>
            </div>

            {/* Helicopter */}
            <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer">
              {/* Image Header */}
              <div className="w-full h-32 overflow-hidden">
                <img src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/winery/Privatecharterx_helicopter.png" alt="Helicopter" className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">Helicopter</h3>
                <p className="text-gray-600 text-sm leading-snug mb-3">
                  Perfect for short-distance travel, city transfers, and accessing remote locations
                  with precision and flexibility.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                    City center access
                  </span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                    Remote destinations
                  </span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                    Quick transfers
                  </span>
                </div>
                <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">+</div>
              </div>
            </div>

            {/* eVTOL */}
            <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer relative">
              <div className="absolute top-6 right-6 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs z-10">
                Coming Soon
              </div>
              {/* Image Header */}
              <div className="w-full h-32 overflow-hidden">
                <img src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/winery/Privatecharterx_evtol.png" alt="eVTOL" className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">eVTOL</h3>
                <p className="text-gray-600 text-sm leading-snug mb-3">
                  The future of urban air mobility. Electric vertical takeoff and landing aircraft
                  for sustainable, efficient city travel.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                    Zero emissions
                  </span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                    Quiet operation
                  </span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                    Urban mobility
                  </span>
                </div>
                <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">+</div>
              </div>
            </div>

            {/* 24/7 Service */}
            <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer">
              {/* Image Header */}
              <div className="w-full h-32 overflow-hidden">
                <img src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/winery/privatecharterx_support.png" alt="24/7 Concierge" className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">24/7 Concierge</h3>
                <p className="text-gray-600 text-sm leading-snug mb-3">
                  Round-the-clock support from our aviation experts. From booking to landing,
                  we're here to ensure your journey is seamless.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                    24/7 availability
                  </span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                    Expert aviation team
                  </span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                    Personalized service
                  </span>
                </div>
                <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">+</div>
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
                    <h4 className="text-base font-light text-gray-900 mb-2">CO2 Certificates</h4>
                    <p className="text-sm text-gray-600">Blockchain-verified carbon footprint tracking for every flight with offset options</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                    <Award className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-light text-gray-900 mb-2">SAF Certificates</h4>
                    <p className="text-sm text-gray-600">Sustainable Aviation Fuel usage verification through immutable blockchain records</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                    <Shield className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-light text-gray-900 mb-2">Transparent Pricing</h4>
                    <p className="text-sm text-gray-600">All costs, fees, and environmental impacts clearly displayed and blockchain-verified</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <h3 className="text-lg font-light text-gray-900 mb-6 leading-tight">Environmental Impact Dashboard</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Flights with SAF</span>
                  <span className="text-lg font-light text-gray-900">23%</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">CO2 Offset Programs</span>
                  <span className="text-lg font-light text-gray-900">89%</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Blockchain Certificates</span>
                  <span className="text-lg font-light text-gray-900">100%</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-gray-600">Carbon Neutral Flights</span>
                  <span className="text-lg font-light text-gray-900">67%</span>
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
              <h3 className="text-lg font-light text-gray-900 mb-4 leading-tight">24/7 Service</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Our expert team provides round-the-clock support, ensuring seamless booking
                and travel coordination for all your aviation needs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="text-lg font-light text-gray-900 mb-4 leading-tight">Blockchain Integration</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Every transaction, certificate, and booking is secured and verified through
                blockchain technology for maximum transparency and trust.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="text-lg font-light text-gray-900 mb-4 leading-tight">Future Operations</h3>
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
            onClick={() => navigate('/dashboard/chat?newChat=true&query=private+jet+charter')}
            className="bg-gray-900 text-white px-8 py-3 rounded-md text-sm hover:bg-gray-800 transition-colors flex items-center justify-center"
          >
            Book Your Flight
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
          <button
            onClick={() => navigate('/dashboard/empty-legs')}
            className="border border-gray-200 text-gray-700 px-8 py-3 rounded-md text-sm hover:bg-gray-50 transition-colors"
          >
            Explore Empty Legs
          </button>
        </div>
      </section>

      {/* Footer */}
      <Footer />

    </div>
  );
}

export default Aviation;
