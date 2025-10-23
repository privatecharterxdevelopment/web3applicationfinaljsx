import React, { useState } from 'react';
import {
  Check, ArrowRight, Plane, CreditCard, Shield, Users, Clock, Star, Car, X,
  Mail, AlertTriangle, Search, Calendar, MapPin, Zap, Coins, Gift, Leaf
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Modal Component
const ServiceDetailModal = ({ service, onClose }) => {
  if (!service) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-8 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-light text-black mb-2">{service.title}</h2>
            <p className="text-gray-500 font-light">{service.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-50 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto">
          <div className="space-y-4">
            {service.details.map((detail, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-3"></div>
                <p className="text-gray-700 font-light leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HowItWorks() {
  const [selectedService, setSelectedService] = useState(null);

  // Service information cards
  const serviceCards = [
    {
      id: 'booking-process',
      title: 'Booking Process & Verification',
      subtitle: 'Double-checked requests with rapid confirmation timeframes',
      details: [
        'Every charter request undergoes comprehensive double-verification by our operations team',
        'Real-time aircraft availability confirmation within 30 minutes during business hours',
        'Route feasibility assessment including permits, fuel stops, and operational requirements',
        'Passenger manifest verification and documentation requirements check',
        'Weather contingency planning and alternative routing options provided',
        'Immediate booking confirmation upon successful verification and payment processing',
        '24/7 operations desk available for urgent charter requirements worldwide'
      ]
    },
    {
      id: 'empty-legs',
      title: 'Empty Leg Operations & Availability',
      subtitle: 'Direct booking and negotiated empty leg charter opportunities',
      details: [
        'Direct payable empty legs: Instant booking with fixed pricing and immediate confirmation',
        'Negotiated empty legs: Operator approval required, typically 2-6 hours response time',
        'Real-time empty leg inventory updated every 15 minutes across global network',
        'Savings potential: 40-75% off standard charter rates depending on route and timing',
        'Short booking windows: Most empty legs must be booked 24-72 hours in advance',
        'Flexible departure times within 2-hour windows to accommodate positioning flights',
        'Route modifications limited - departure and arrival airports typically fixed'
      ]
    },
    {
      id: 'payment-blockchain',
      title: 'Payment Systems & Blockchain Integration',
      subtitle: 'Multiple payment options with blockchain transparency',
      details: [
        'Traditional payments: Wire transfers, credit cards, and corporate accounts accepted',
        'Cryptocurrency payments: 15+ digital currencies supported for transparent transactions',
        'Smart contract escrow: Automated payment release upon successful flight completion',
        'Real-time transaction tracking: Complete payment transparency via blockchain verification',
        'Multi-signature wallet security: Enhanced protection for high-value charter transactions',
        'PVCX token integration: Earn rewards tokens with every booking transaction',
        'Instant payment confirmation: Immediate booking confirmation with crypto payments'
      ]
    },
    {
      id: 'additional-services',
      title: 'Additional Services & Custom Arrangements',
      subtitle: 'Comprehensive luxury travel support and specialized requests',
      details: [
        'Ground transportation: Luxury vehicle transfers from address to runway',
        'Catering services: Gourmet in-flight dining and special dietary accommodations',
        'Concierge support: Hotel bookings, restaurant reservations, and activity planning',
        'Special cargo: Art transport, medical equipment, and oversized item handling',
        'Pet transportation: Certified pet travel with veterinary documentation support',
        'Group charter coordination: Multi-aircraft arrangements for large parties',
        'International permit handling: Customs, immigration, and regulatory compliance'
      ]
    },
    {
      id: 'nft-benefits',
      title: 'NFT Holder Benefits & Exclusive Privileges',
      subtitle: 'Premium membership advantages and complimentary services',
      details: [
        'One free empty leg flight per year: Full charter value up to $25,000 included',
        'Complimentary ground transfers: Free luxury vehicle service from address to runway',
        'Priority booking access: 6-hour exclusive window before public empty leg releases',
        'Upgraded catering: Premium dining options at no additional cost',
        'Flexible cancellation: Extended cancellation windows with full refund privileges',
        'Concierge priority: Dedicated account manager for personalized service coordination',
        'Partner network access: Exclusive rates with luxury hotels, restaurants, and experiences'
      ]
    },
    {
      id: 'rewards-co2',
      title: 'Token Rewards & Carbon Certification',
      subtitle: 'Blockchain-verified environmental impact and rewards program',
      details: [
        'PVCX token accumulation: Earn 2-5% of charter value in pre-vault token rewards',
        'Token utility: Future discounts, governance voting, and exclusive service access',
        'Carbon offset certificates: Verified CO2 compensation for every flight via blockchain',
        'Environmental transparency: Real-time carbon footprint tracking and offset verification',
        'Sustainability initiatives: Partnership with certified carbon credit providers worldwide',
        'Token vesting schedule: Graduated release upon official PVCX token public launch',
        'Gamified rewards: Milestone bonuses for frequent flyers and loyal customers'
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Main Content */}
      <main className="flex-1 pt-[88px]">
        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-4 tracking-tighter">
              Global private aviation with transparent blockchain-powered charter operations
            </h1>

            <p className="text-gray-500 mb-12 max-w-2xl mx-auto font-light">
              Comprehensive charter services across jets, helicopters, and yachts.
              Double-verified bookings, blockchain payments, NFT holder benefits, and carbon-neutral operations.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2">
              Start Charter Request
              <ArrowRight size={18} />
            </button>
            <a
              href="mailto:bookings@privatecharterx.com"
              className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Mail size={18} />
              Contact Operations
            </a>
          </div>

          {/* Service Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {serviceCards.map((card) => (
              <button
                key={card.id}
                onClick={() => setSelectedService(card)}
                className="bg-white rounded-2xl border border-gray-100 hover:shadow-sm transition-all duration-300 p-6 text-left group"
              >
                <h3 className="text-lg font-medium text-black mb-2 group-hover:text-gray-700 transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-500 font-light leading-relaxed mb-4">
                  {card.subtitle}
                </p>
                <div className="space-y-2">
                  {card.details.slice(0, 2).map((detail, index) => (
                    <p key={index} className="text-xs text-gray-600 font-light leading-relaxed">
                      {detail}
                    </p>
                  ))}
                </div>
                <div className="mt-4 text-sm text-black font-light flex items-center gap-1 group-hover:gap-2 transition-all">
                  View details <ArrowRight size={14} />
                </div>
              </button>
            ))}
          </div>

          {/* Service Categories */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden mb-20">
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-light text-black mb-2">Available Services</h2>
              <p className="text-gray-500 font-light">Global charter services with transparent blockchain integration</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
              {[
                { icon: Plane, label: 'Private Jets', desc: '5,000+ airports' },
                { icon: Users, label: 'Helicopters', desc: 'Point-to-point flights' },
                { icon: Shield, label: 'Yachts', desc: 'Luxury maritime' },
                { icon: Car, label: 'Ground Transfer', desc: 'Door-to-runway' },
                { icon: Clock, label: 'Empty Legs', desc: 'Up to 75% savings' },
                { icon: CreditCard, label: 'Crypto Payments', desc: '15+ currencies' },
                { icon: Gift, label: 'NFT Benefits', desc: 'Free flights & perks' },
                { icon: Leaf, label: 'CO2 Certificates', desc: 'Carbon neutral flights' }
              ].map((service, index) => (
                <div key={index} className="p-6 border-r border-b border-gray-50 hover:bg-gray-25 transition-colors">
                  <service.icon size={24} className="text-gray-400 mb-3" />
                  <h3 className="font-medium text-black mb-1 text-sm">{service.label}</h3>
                  <p className="text-xs text-gray-500 font-light">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-20">
            <h3 className="text-xl font-light text-black mb-6">Payment Options & Blockchain Integration</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard size={20} className="text-gray-600" />
                </div>
                <h4 className="font-medium text-black mb-1">Traditional</h4>
                <p className="text-sm text-gray-500 font-light">Wire, cards, corporate</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-3">
                  <Coins size={20} className="text-white" />
                </div>
                <h4 className="font-medium text-black mb-1">Cryptocurrency</h4>
                <p className="text-sm text-gray-500 font-light">15+ digital currencies</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap size={20} className="text-gray-600" />
                </div>
                <h4 className="font-medium text-black mb-1">PVCX Tokens</h4>
                <p className="text-sm text-gray-500 font-light">Rewards & discounts</p>
              </div>
            </div>
          </div>

          {/* Important Information */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-20">
            <div className="flex items-start gap-4">
              <AlertTriangle size={24} className="text-gray-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-medium text-black mb-4">Operational Standards & Requirements</h3>
                <div className="space-y-4 text-sm text-gray-700 font-light leading-relaxed">
                  <p>
                    <strong className="text-black">Double Verification:</strong> Every charter request undergoes comprehensive verification
                    by our operations team to ensure safety, regulatory compliance, and operational feasibility before confirmation.
                  </p>

                  <p>
                    <strong className="text-black">Booking Timeframes:</strong> Standard charters confirmed within 30 minutes during business hours.
                    Empty legs require immediate booking due to short availability windows and positioning requirements.
                  </p>

                  <p>
                    <strong className="text-black">Blockchain Transparency:</strong> All transactions, flight records, and carbon certificates
                    are recorded on blockchain for complete transparency and immutable record-keeping.
                  </p>

                  <p>
                    <strong className="text-black">NFT Holder Benefits:</strong> Premium membership holders receive priority access,
                    complimentary services, and exclusive empty leg opportunities as part of our loyalty program.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Get In Touch CTA */}
          <div className="mt-20">
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl"></div>
              <div className="relative px-8 sm:px-12 py-16 sm:py-20 text-center text-white">
                <h2 className="text-3xl sm:text-4xl font-light mb-6">
                  Ready to Experience Private Aviation?
                </h2>
                <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
                  Get started with your charter request today. Our operations team is available 24/7
                  to assist with bookings, empty legs, and custom travel arrangements.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="inline-flex items-center justify-center bg-white text-gray-900 px-8 py-4 rounded-2xl font-medium hover:bg-gray-100 transition-all duration-300 group">
                    Start Charter Request
                    <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <a
                    href="mailto:bookings@privatecharterx.com"
                    className="inline-flex items-center justify-center bg-transparent text-white border border-white/30 px-8 py-4 rounded-2xl font-medium hover:bg-white/10 transition-all duration-300"
                  >
                    <Mail size={16} className="mr-2" />
                    Get In Touch
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Service Detail Modal */}
      <ServiceDetailModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
      />
    </div>
  );
}
