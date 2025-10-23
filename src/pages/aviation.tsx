import React, { useState } from 'react';
import {
  ArrowRight, Plane, Users, Zap, MapPin, Clock, Star, Shield, 
  CreditCard, Coins, Leaf, AlertTriangle, Mail, Search, Calendar,
  Wifi, Battery, Navigation, Globe, Check, X, Settings, Smartphone,
  Headphones, Monitor, Radio, Radar, Cloud, Database, Lock
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Modal Component for Service Details
const ServiceDetailModal = ({ service, onClose }) => {
  if (!service) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
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
          <div className="space-y-6">
            {service.detailedInfo.map((section, index) => (
              <div key={index}>
                <h3 className="text-lg font-medium text-black mb-3">{section.title}</h3>
                <div className="space-y-3">
                  {section.details.map((detail, detailIndex) => (
                    <div key={detailIndex} className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-3"></div>
                      <p className="text-gray-700 font-light leading-relaxed">{detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AviationWeb3Overview() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  // Aviation service cards with detailed information
  const aviationServices = [
    {
      id: 'private-jets',
      title: 'Private Jet Charter',
      subtitle: 'Global luxury aviation with blockchain transparency',
      description: 'Access to 5,000+ airports worldwide with premium jets ranging from light aircraft to long-range luxury cabins.',
      features: ['Global network coverage', 'Premium aircraft fleet', 'Instant booking confirmation', 'Blockchain payment integration'],
      icon: Plane,
      gradient: 'from-blue-50 to-indigo-50',
      hoverGradient: 'from-blue-100 to-indigo-100',
      link: '/private-jets',
      stats: { airports: '5,000+', aircraft: '200+', countries: '150+' },
      detailedInfo: [
        {
          title: 'Aircraft Categories & Fleet Management',
          details: [
            'Light Jets: Citation CJ3+, Phenom 300E, Learjet 75 - Perfect for short to medium-haul flights up to 4 hours',
            'Mid-size Jets: Hawker 850XP, Citation Sovereign, Gulfstream G150 - Ideal for transcontinental flights with enhanced comfort',
            'Heavy Jets: Gulfstream G550, Global 6000, Falcon 7X - Long-range intercontinental capability with maximum luxury',
            'Ultra Long Range: Gulfstream G650, Global 7500, Falcon 8X - Non-stop global reach with presidential-level amenities',
            'Real-time aircraft availability tracking with blockchain-verified maintenance records and certification status',
            'Smart contract-based aircraft allocation ensuring optimal routing and fuel efficiency for every charter request',
            'AI-powered fleet optimization reducing empty positioning flights and carbon footprint by up to 40%'
          ]
        },
        {
          title: 'Booking Process & Blockchain Integration',
          details: [
            'Instant quote generation with transparent pricing via smart contracts - no hidden fees or surprise charges',
            'Real-time aircraft availability confirmation within 15 minutes using distributed ledger technology',
            'Automated flight planning with weather analysis, permit processing, and alternative routing suggestions',
            'Passenger manifest verification through encrypted blockchain identity management for enhanced security',
            'Smart contract escrow system releasing payment only upon successful flight completion and passenger confirmation',
            'Immutable flight records stored on blockchain providing complete transparency and audit trail',
            'Integration with global air traffic management systems for real-time flight tracking and updates'
          ]
        },
        {
          title: 'Luxury Services & Customization',
          details: [
            'Michelin-starred catering available with 48-hour advance notice - dietary restrictions and preferences accommodated',
            'Ground transportation coordination from door-to-door with luxury vehicle fleet partnerships globally',
            'Concierge services including hotel reservations, restaurant bookings, and exclusive event access',
            'In-flight connectivity with high-speed satellite internet, streaming entertainment, and business communication tools',
            'Pet transportation services with specialized climate-controlled environments and veterinary documentation',
            'Special cargo handling for artwork, musical instruments, medical equipment, and oversized items',
            'Multi-aircraft coordination for large groups including sports teams, corporate events, and family gatherings'
          ]
        }
      ]
    },
    {
      id: 'helicopter-charter',
      title: 'Helicopter Charter',
      subtitle: 'Point-to-point urban mobility and scenic flights',
      description: 'Efficient helicopter services for city transfers, remote destinations, and exclusive aerial experiences.',
      features: ['Urban mobility solutions', 'Remote location access', 'Scenic flight experiences', 'Emergency medical transport'],
      icon: Users,
      gradient: 'from-emerald-50 to-teal-50',
      hoverGradient: 'from-emerald-100 to-teal-100',
      link: '/helicopter-charter',
      stats: { helipads: '1,200+', operators: '50+', cities: '80+' },
      detailedInfo: [
        {
          title: 'Urban Air Mobility & City Transfers',
          details: [
            'Executive helicopter transfers between airports, hotels, and business districts in major metropolitan areas',
            'Traffic-beating city transport with average time savings of 60-80% compared to ground transportation',
            'Access to verified helipads and helicopter landing zones with blockchain-recorded safety certifications',
            'Real-time traffic and weather analysis for optimal routing and flight safety in urban environments',
            'Integration with smart city infrastructure for automated landing permissions and air traffic coordination',
            'Corporate shuttle services for regular routes with subscription-based smart contract pricing models',
            'Emergency evacuation capabilities with rapid response protocols and medical equipment on standby'
          ]
        },
        {
          title: 'Remote Access & Specialized Operations',
          details: [
            'Oil rig and offshore platform transport with specialized maritime-certified aircraft and pilots',
            'Mountain rescue and remote location access for skiing, hiking, and adventure tourism activities',
            'Construction and heavy-lift operations using twin-engine helicopters with external load capabilities',
            'Search and rescue coordination with emergency services and blockchain-verified pilot certifications',
            'Agricultural services including crop monitoring, livestock management, and precision farming support',
            'Filming and photography services with gyro-stabilized camera mounts and experienced aerial cinematographers',
            'Scientific research support for environmental monitoring, wildlife surveys, and geological exploration'
          ]
        },
        {
          title: 'Luxury Tourism & Scenic Experiences',
          details: [
            'Private scenic tours of natural landmarks, national parks, and world-famous destinations with expert guides',
            'Wine country tours with helicopter transfers between vineyards and exclusive tasting experiences',
            'Sunset and sunrise flights with champagne service and professional photography documentation',
            'Beach and island hopping with access to exclusive resorts and private beaches in remote locations',
            'City skyline tours with historical narration and access to restricted airspace for unique perspectives',
            'Special occasion flights for proposals, anniversaries, and celebrations with customized routing',
            'Multi-day helicopter expeditions with luxury camping and remote destination exploration packages'
          ]
        }
      ]
    },
    {
      id: 'empty-legs',
      title: 'Empty Legs',
      subtitle: 'Discounted flights up to 75% savings on premium routes',
      description: 'Take advantage of repositioning flights with significant cost savings while maintaining luxury standards.',
      features: ['Up to 75% cost savings', 'Real-time availability', 'Flexible booking windows', 'Premium aircraft access'],
      icon: MapPin,
      gradient: 'from-amber-50 to-orange-50',
      hoverGradient: 'from-amber-100 to-orange-100',
      link: '/empty-legs',
      stats: { savings: '40-75%', routes: '500+', availability: '24/7' },
      detailedInfo: [
        {
          title: 'Real-Time Empty Leg Discovery & Booking',
          details: [
            'AI-powered empty leg prediction system analyzing flight patterns and generating opportunities 72 hours in advance',
            'Instant booking platform with smart contract execution for immediate confirmation and payment processing',
            'Real-time inventory updates every 15 minutes across global network of charter operators and aircraft owners',
            'Flexible departure windows allowing 2-4 hour flexibility to accommodate aircraft positioning requirements',
            'Route modification capabilities within 200-mile radius of original departure and arrival airports',
            'Last-minute availability alerts via mobile app and SMS for users with flexible travel schedules',
            'Blockchain-verified pricing transparency ensuring legitimate discounts without hidden fees or surcharges'
          ]
        },
        {
          title: 'Empty Leg Categories & Pricing Structure',
          details: [
            'Direct Payable Empty Legs: Fixed pricing with instant booking confirmation and immediate payment processing',
            'Negotiated Empty Legs: Operator approval required with response times of 2-6 hours and potential pricing adjustments',
            'Shared Empty Legs: Multiple passengers splitting costs with seat-by-seat booking and coordinated ground transport',
            'Premium Empty Legs: Luxury long-range aircraft with full service amenities at reduced rates for positioning flights',
            'Short-Notice Empty Legs: Same-day availability with 50-75% savings for flexible travelers with packed bags ready',
            'International Empty Legs: Intercontinental positioning flights with customs and immigration coordination included',
            'Recurring Empty Legs: Regular routes with seasonal patterns and subscription options for frequent travelers'
          ]
        },
        {
          title: 'Smart Contract Automation & Risk Management',
          details: [
            'Automated refund processing for cancelled empty legs with smart contract execution within 24 hours',
            'Weather contingency protocols with alternative aircraft or routing options provided automatically',
            'Passenger protection insurance covering unexpected cancellations, delays, and schedule changes',
            'Blockchain-based reputation system for operators ensuring reliability and service quality standards',
            'Dynamic pricing algorithms adjusting rates based on demand, aircraft utilization, and market conditions',
            'Multi-signature wallet security for high-value transactions with escrow protection for both parties',
            'Carbon offset certificates automatically purchased and recorded on blockchain for every empty leg flight'
          ]
        }
      ]
    },
    {
      id: 'evtol',
      title: 'eVTOL',
      subtitle: 'Next-generation electric vertical takeoff aircraft',
      description: 'Sustainable urban air mobility with zero-emission electric aircraft for short-distance premium transport.',
      features: ['Zero-emission flights', 'Urban air mobility', 'Vertical takeoff capability', 'Future of aviation'],
      icon: Zap,
      gradient: 'from-purple-50 to-violet-50',
      hoverGradient: 'from-purple-100 to-violet-100',
      link: '/evtol',
      stats: { emissions: '0%', noise: '-70%', efficiency: '+300%' },
      detailedInfo: [
        {
          title: 'Electric Aircraft Technology & Capabilities',
          details: [
            'Lilium Jet: 7-passenger capacity with 250km range and 175mph cruise speed for regional connectivity',
            'Joby Aviation eVTOL: 4-passenger urban air taxi with 150-mile range and whisper-quiet operation',
            'Archer Midnight: 4-passenger aircraft optimized for 20-mile urban trips with 10-minute charging capability',
            'EHang AAV: Autonomous aerial vehicle with 2-passenger capacity for short urban hops and sightseeing',
            'Distributed electric propulsion systems providing redundancy and enhanced safety over urban areas',
            'Advanced battery technology with rapid charging capabilities and swappable battery pack systems',
            'Fly-by-wire controls with autonomous flight capability and remote pilot oversight for maximum safety'
          ]
        },
        {
          title: 'Urban Air Mobility Infrastructure & Operations',
          details: [
            'Vertiport network development in major cities with charging infrastructure and passenger terminals',
            'Air traffic management integration with existing aviation systems and dedicated eVTOL corridors',
            'Noise abatement protocols ensuring operations comply with urban noise regulations and community standards',
            'Weather monitoring systems optimized for low-altitude flight operations and automated safety protocols',
            'Ground support equipment including specialized charging stations and aircraft maintenance facilities',
            'Passenger experience design with seamless booking, security screening, and boarding processes',
            'Integration with multimodal transportation networks including ground transport and traditional aviation'
          ]
        },
        {
          title: 'Sustainability & Environmental Impact',
          details: [
            'Zero direct emissions during flight operations powered by renewable energy sources and green electricity',
            'Lifecycle carbon analysis showing 90% reduction compared to traditional helicopter operations',
            'Noise pollution reduction of 70% compared to conventional helicopters enabling urban operations',
            'Sustainable manufacturing processes using recycled materials and renewable energy in production facilities',
            'End-of-life aircraft recycling programs ensuring responsible disposal of battery packs and composite materials',
            'Carbon negative operations when powered by verified renewable energy sources and carbon offset programs',
            'Smart charging optimization using AI to minimize grid impact and maximize use of renewable energy'
          ]
        }
      ]
    }
  ];

  const handleCardClick = (service) => {
    // In a real application, you would use React Router or Next.js router
    console.log(`Navigate to: ${service.link}`);
    // For demo purposes, you can replace this with actual navigation logic
    // Example: navigate(service.link); or window.location.href = service.link;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Main Content */}
      <main className="flex-1 pt-[88px]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-6 tracking-tighter">
              Aviation Web3.0
            </h1>
            
            <p className="text-xl text-gray-500 mb-8 max-w-3xl mx-auto font-light leading-relaxed">
              Revolutionary private aviation services powered by blockchain technology. 
              Experience transparent, efficient, and sustainable air travel across jets, helicopters, empty legs, and next-generation eVTOL aircraft.
            </p>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-400 font-light">
              <div className="flex items-center gap-2">
                <Shield size={16} />
                Blockchain Verified
              </div>
              <div className="flex items-center gap-2">
                <Leaf size={16} />
                Carbon Neutral
              </div>
              <div className="flex items-center gap-2">
                <Globe size={16} />
                Global Coverage
              </div>
              <div className="flex items-center gap-2">
                <Zap size={16} />
                Smart Contracts
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <button className="bg-black text-white px-8 py-4 rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2">
              Start Aviation Charter
              <ArrowRight size={18} />
            </button>
            <a
              href="mailto:aviation@privatecharterx.com"
              className="bg-gray-100 text-gray-700 px-8 py-4 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Mail size={18} />
              Contact Aviation Team
            </a>
          </div>

          {/* Aviation Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            {aviationServices.map((service) => (
              <div
                key={service.id}
                onMouseEnter={() => setHoveredCard(service.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`
                  relative overflow-hidden rounded-3xl border border-gray-100 cursor-pointer
                  transition-all duration-500 hover:shadow-xl hover:-translate-y-1
                  bg-gradient-to-br ${hoveredCard === service.id ? service.hoverGradient : service.gradient}
                `}
              >
                <div className="p-8">
                  {/* Service Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <service.icon size={28} className="text-gray-700" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedService(service)}
                        className="p-2 bg-white/60 hover:bg-white/80 rounded-lg transition-colors"
                      >
                        <Search size={16} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleCardClick(service)}
                        className="p-2 bg-white/60 hover:bg-white/80 rounded-lg transition-colors"
                      >
                        <ArrowRight 
                          size={16} 
                          className={`text-gray-600 transition-transform duration-300 ${
                            hoveredCard === service.id ? 'translate-x-1' : ''
                          }`} 
                        />
                      </button>
                    </div>
                  </div>

                  {/* Service Content */}
                  <h3 className="text-2xl font-light text-gray-900 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 font-light mb-4 text-sm">
                    {service.subtitle}
                  </p>
                  <p className="text-gray-700 font-light leading-relaxed mb-6">
                    {service.description}
                  </p>

                  {/* Service Features */}
                  <div className="space-y-2 mb-6">
                    {service.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-gray-700 rounded-full flex-shrink-0"></div>
                        <span className="text-sm text-gray-700 font-light">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Service Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/50">
                    {Object.entries(service.stats).map(([key, value], index) => (
                      <div key={index} className="text-center">
                        <div className="text-lg font-medium text-gray-900">{value}</div>
                        <div className="text-xs text-gray-600 font-light capitalize">{key}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hover Effect Overlay */}
                <div className={`
                  absolute inset-0 bg-gradient-to-br from-white/20 to-transparent 
                  opacity-0 transition-opacity duration-300
                  ${hoveredCard === service.id ? 'opacity-100' : ''}
                `} />
              </div>
            ))}
          </div>

          {/* Web3.0 Technology Features */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden mb-20">
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-light text-black mb-2">Web3.0 Aviation Technology</h2>
              <p className="text-gray-500 font-light">Blockchain-powered infrastructure revolutionizing private aviation</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
              {[
                { icon: Shield, label: 'Smart Contracts', desc: 'Automated booking & payments' },
                { icon: Database, label: 'Blockchain Records', desc: 'Immutable flight history' },
                { icon: Coins, label: 'Crypto Payments', desc: '15+ digital currencies' },
                { icon: Leaf, label: 'Carbon Tracking', desc: 'Verified CO2 certificates' },
                { icon: Lock, label: 'Secure Identity', desc: 'Encrypted passenger data' },
                { icon: Cloud, label: 'Decentralized Data', desc: 'Distributed flight records' },
                { icon: Navigation, label: 'AI Route Optimization', desc: 'Smart flight planning' },
                { icon: Battery, label: 'Green Energy', desc: 'Sustainable operations' },
                { icon: Star, label: 'NFT Membership', desc: 'Exclusive holder benefits' },
                { icon: Clock, label: 'Real-time Tracking', desc: 'Live flight monitoring' },
                { icon: Radar, label: 'Predictive Analytics', desc: 'Demand forecasting' },
                { icon: Radio, label: 'IoT Integration', desc: 'Aircraft sensor networks' }
              ].map((feature, index) => (
                <div key={index} className="p-6 border-r border-b border-gray-50 hover:bg-gray-25 transition-colors">
                  <feature.icon size={24} className="text-gray-400 mb-3" />
                  <h3 className="font-medium text-black mb-1 text-sm">{feature.label}</h3>
                  <p className="text-xs text-gray-500 font-light">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Blockchain Integration Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-20">
            <h3 className="text-xl font-light text-black mb-6">Blockchain-Powered Aviation Ecosystem</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <Shield size={20} className="text-blue-600" />
                </div>
                <h4 className="font-medium text-black mb-3">Transparent Operations</h4>
                <div className="space-y-2 text-sm text-gray-500 font-light">
                  <p>• Immutable flight records and maintenance logs</p>
                  <p>• Real-time aircraft availability and pricing</p>
                  <p>• Transparent operator ratings and safety scores</p>
                  <p>• Automated compliance with aviation regulations</p>
                </div>
              </div>
              <div>
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4">
                  <Leaf size={20} className="text-green-600" />
                </div>
                <h4 className="font-medium text-black mb-3">Environmental Accountability</h4>
                <div className="space-y-2 text-sm text-gray-500 font-light">
                  <p>• Verified carbon offset certificates for every flight</p>
                  <p>• Real-time emissions tracking and reporting</p>
                  <p>• Sustainable aviation fuel integration</p>
                  <p>• Electric aircraft fleet development support</p>
                </div>
              </div>
              <div>
                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                  <Coins size={20} className="text-purple-600" />
                </div>
                <h4 className="font-medium text-black mb-3">Token Economy & Rewards</h4>
                <div className="space-y-2 text-sm text-gray-500 font-light">
                  <p>• PVCX token rewards for every booking</p>
                  <p>• Governance voting on platform improvements</p>
                  <p>• Exclusive access to premium services</p>
                  <p>• Staking rewards for long-term holders</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods & Financial Infrastructure */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-20">
            <h3 className="text-xl font-light text-black mb-6">Advanced Payment Systems & Financial Infrastructure</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard size={20} className="text-gray-600" />
                </div>
                <h4 className="font-medium text-black mb-2">Traditional Payments</h4>
                <p className="text-sm text-gray-500 font-light">Wire transfers, credit cards, corporate accounts with instant processing</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-3">
                  <Coins size={20} className="text-white" />
                </div>
                <h4 className="font-medium text-black mb-2">Cryptocurrency</h4>
                <p className="text-sm text-gray-500 font-light">Bitcoin, Ethereum, and 15+ altcoins with smart contract escrow</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap size={20} className="text-purple-600" />
                </div>
                <h4 className="font-medium text-black mb-2">PVCX Tokens</h4>
                <p className="text-sm text-gray-500 font-light">Platform tokens for discounts, rewards, and exclusive access</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock size={20} className="text-blue-600" />
                </div>
                <h4 className="font-medium text-black mb-2">Smart Escrow</h4>
                <p className="text-sm text-gray-500 font-light">Multi-signature wallets with automated payment release protocols</p>
              </div>
            </div>
          </div>

          {/* Fleet Statistics & Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-black">Sustainability Metrics</h3>
                <Leaf size={20} className="text-gray-400" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">CO2 Reduced</span>
                  <span className="text-sm font-medium">40%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">SAF Integration</span>
                  <span className="text-sm font-medium">85%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Electric Fleet</span>
                  <span className="text-sm font-medium">12%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Carbon Certificates</span>
                  <span className="text-sm font-medium">100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* NFT Holder Benefits & Membership Tiers */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden mb-20">
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-light text-black mb-2">NFT Membership & Exclusive Benefits</h2>
              <p className="text-gray-500 font-light">Premium holder advantages and complimentary aviation services</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              <div className="p-8 border-r border-gray-100">
                <div className="w-12 h-12 bg-bronze-100 rounded-full flex items-center justify-center mb-4">
                  <Star size={20} className="text-amber-600" />
                </div>
                <h3 className="text-lg font-medium text-black mb-4">Bronze NFT Holders</h3>
                <div className="space-y-3 text-sm text-gray-600 font-light">
                  <div className="flex items-start gap-3">
                    <Check size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Priority empty leg access (2-hour window)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span>5% discount on all charter bookings</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Complimentary ground transfer (up to $200)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Carbon offset certificates included</span>
                  </div>
                </div>
              </div>

              <div className="p-8 border-r border-gray-100 bg-gray-25">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <Star size={20} className="text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-black mb-4">Silver NFT Holders</h3>
                <div className="space-y-3 text-sm text-gray-600 font-light">
                  <div className="flex items-start gap-3">
                    <Check size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Priority empty leg access (4-hour window)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span>10% discount on all charter bookings</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span>One free empty leg flight per year (up to $15k)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Premium catering included on all flights</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Dedicated concierge support 24/7</span>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gradient-to-br from-yellow-50 to-amber-50">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-200 to-amber-200 rounded-full flex items-center justify-center mb-4">
                  <Star size={20} className="text-amber-700" />
                </div>
                <h3 className="text-lg font-medium text-black mb-4">Gold NFT Holders</h3>
                <div className="space-y-3 text-sm text-gray-600 font-light">
                  <div className="flex items-start gap-3">
                    <Check size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Exclusive empty leg access (6-hour window)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span>15% discount on all charter bookings</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Two free flights per year (up to $25k each)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Free upgrades to larger aircraft when available</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Personalized flight planning and route optimization</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Access to exclusive eVTOL test flights</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Standards & Safety Protocols */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-20">
            <div className="flex items-start gap-4">
              <AlertTriangle size={24} className="text-gray-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-medium text-black mb-4">Aviation Safety Standards & Operational Excellence</h3>
                <div className="space-y-6 text-sm text-gray-700 font-light leading-relaxed">
                  <div>
                    <h4 className="font-medium text-black mb-2">Comprehensive Safety Management System</h4>
                    <p>
                      All aircraft and operators undergo rigorous blockchain-verified safety audits including maintenance records, 
                      pilot certifications, insurance coverage, and regulatory compliance. Real-time safety scoring system 
                      tracks performance metrics and automatically flags any safety concerns or irregularities.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-black mb-2">Advanced Booking & Verification Protocols</h4>
                    <p>
                      Double-verification system ensures every charter request is validated for feasibility, safety, and 
                      regulatory compliance before confirmation. AI-powered risk assessment analyzes weather, aircraft 
                      capability, route complexity, and pilot experience to optimize flight planning and safety outcomes.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-black mb-2">Environmental Responsibility & Carbon Neutrality</h4>
                    <p>
                      Every flight automatically includes verified carbon offset certificates recorded on blockchain. 
                      Sustainable aviation fuel (SAF) integration reduces direct emissions by up to 80%. Electric aircraft 
                      development program accelerating transition to zero-emission aviation for short-range flights.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-black mb-2">Emergency Response & Contingency Planning</h4>
                    <p>
                      24/7 operations center with real-time flight monitoring, weather tracking, and emergency response 
                      coordination. Automated backup aircraft allocation and alternative routing in case of mechanical 
                      issues, weather delays, or operational disruptions ensuring passenger safety and schedule reliability.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technology Integration & Innovation */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden mb-20">
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-light text-black mb-2">Advanced Technology Integration</h2>
              <p className="text-gray-500 font-light">Cutting-edge aviation technology and digital innovation</p>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-black mb-4">Artificial Intelligence & Machine Learning</h3>
                  <div className="space-y-3 text-sm text-gray-600 font-light">
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-2"></div>
                      <span>Predictive maintenance algorithms reducing aircraft downtime by 60%</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-2"></div>
                      <span>Dynamic pricing optimization based on demand, weather, and market conditions</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-2"></div>
                      <span>Route optimization reducing flight time and fuel consumption by up to 15%</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-2"></div>
                      <span>Customer preference learning for personalized service recommendations</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-black mb-4">IoT & Connected Aircraft Systems</h3>
                  <div className="space-y-3 text-sm text-gray-600 font-light">
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-2"></div>
                      <span>Real-time aircraft health monitoring with 10,000+ sensor data points</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-2"></div>
                      <span>Passenger comfort optimization through climate and cabin pressure control</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-2"></div>
                      <span>Fuel efficiency tracking and optimization reducing operational costs</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-2"></div>
                      <span>Automated regulatory compliance reporting and documentation</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-black mb-4">Mobile App & Digital Experience</h3>
                  <div className="space-y-3 text-sm text-gray-600 font-light">
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-2"></div>
                      <span>One-tap booking with instant confirmation and payment processing</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-2"></div>
                      <span>Real-time flight tracking with live aircraft position and ETA updates</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-2"></div>
                      <span>Digital concierge with AI-powered travel recommendations</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-2"></div>
                      <span>Blockchain wallet integration for crypto payments and token rewards</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-black mb-4">Sustainability Technology</h3>
                  <div className="space-y-3 text-sm text-gray-600 font-light">
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-2"></div>
                      <span>Electric aircraft charging infrastructure with renewable energy sources</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-2"></div>
                      <span>Carbon footprint calculation and automatic offset certificate generation</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-2"></div>
                      <span>Sustainable aviation fuel (SAF) supply chain integration and tracking</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-2"></div>
                      <span>Noise pollution monitoring and mitigation for urban operations</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-20">
            <h3 className="text-xl font-light text-black mb-6">Frequently Asked Questions</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-black mb-2">How does blockchain technology improve aviation charter services?</h4>
                <p className="text-sm text-gray-600 font-light leading-relaxed">
                  Blockchain provides immutable flight records, transparent pricing, automated smart contract payments, 
                  and verified safety documentation. This eliminates fraud, reduces costs, and ensures complete 
                  transparency in all transactions and operations.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-black mb-2">What cryptocurrencies do you accept for charter payments?</h4>
                <p className="text-sm text-gray-600 font-light leading-relaxed">
                  We accept Bitcoin, Ethereum, USDC, USDT, and 12+ other major cryptocurrencies. Payments are processed 
                  through smart contracts with automatic escrow release upon flight completion. Traditional payment 
                  methods are also available.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-black mb-2">How do empty leg flights work and what are the limitations?</h4>
                <p className="text-sm text-gray-600 font-light leading-relaxed">
                  Empty legs are repositioning flights sold at 40-75% discounts. They have fixed departure/arrival 
                  airports with limited flexibility, short booking windows (24-72 hours), and 2-4 hour departure time 
                  windows. Real-time availability updates every 15 minutes.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-black mb-2">When will eVTOL aircraft be available for commercial operations?</h4>
                <p className="text-sm text-gray-600 font-light leading-relaxed">
                  Commercial eVTOL operations are expected to begin in 2025-2026 in select major cities. We're currently 
                  conducting test flights and building vertiport infrastructure. NFT holders will receive priority access 
                  to inaugural commercial flights.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-black mb-2">How do you ensure carbon neutrality for all flights?</h4>
                <p className="text-sm text-gray-600 font-light leading-relaxed">
                  Every flight automatically includes verified carbon offset certificates from certified providers. 
                  We're increasing sustainable aviation fuel (SAF) usage and investing in electric aircraft development. 
                  All environmental data is tracked and verified on blockchain.
                </p>
              </div>
            </div>
          </div>

          {/* Contact & Support Information */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-20">
            <h3 className="text-xl font-light text-black mb-6">24/7 Aviation Support & Operations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Headphones size={20} className="text-blue-600" />
                </div>
                <h4 className="font-medium text-black mb-2">Operations Center</h4>
                <p className="text-sm text-gray-500 font-light mb-2">+1 (555) 123-AVIATION</p>
                <p className="text-xs text-gray-400">24/7 flight operations & support</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail size={20} className="text-green-600" />
                </div>
                <h4 className="font-medium text-black mb-2">Aviation Team</h4>
                <p className="text-sm text-gray-500 font-light mb-2">aviation@privatecharterx.com</p>
                <p className="text-xs text-gray-400">Charter bookings & inquiries</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Smartphone size={20} className="text-purple-600" />
                </div>
                <h4 className="font-medium text-black mb-2">Mobile App</h4>
                <p className="text-sm text-gray-500 font-light mb-2">iOS & Android</p>
                <p className="text-xs text-gray-400">Download from app stores</p>
              </div>
            </div>
          </div>

          {/* Final CTA Section */}
          <div className="mt-20">
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl"></div>
              <div className="relative px-8 sm:px-12 py-16 sm:py-20 text-center text-white">
                <h2 className="text-3xl sm:text-4xl font-light mb-6">
                  Ready to Experience Aviation Web3.0?
                </h2>
                <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed font-light">
                  Join the revolution in private aviation. Transparent blockchain operations, sustainable aircraft, 
                  and unparalleled service quality across our comprehensive aviation ecosystem.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <button className="inline-flex items-center justify-center bg-white text-gray-900 px-8 py-4 rounded-2xl font-medium hover:bg-gray-100 transition-all duration-300 group">
                    Book Your Flight Now
                    <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <a
                    href="mailto:aviation@privatecharterx.com"
                    className="inline-flex items-center justify-center bg-transparent text-white border border-white/30 px-8 py-4 rounded-2xl font-medium hover:bg-white/10 transition-all duration-300"
                  >
                    <Mail size={16} className="mr-2" />
                    Contact Aviation Specialist
                  </a>
                </div>
                
                <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Shield size={14} />
                    Blockchain Secured
                  </div>
                  <div className="flex items-center gap-2">
                    <Leaf size={14} />
                    Carbon Neutral
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    24/7 Operations
                  </div>
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
}black">Global Fleet</h3>
                <Plane size={20} className="text-gray-400" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Private Jets</span>
                  <span className="text-sm font-medium">2,500+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Helicopters</span>
                  <span className="text-sm font-medium">800+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">eVTOL Aircraft</span>
                  <span className="text-sm font-medium">50+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Partner Operators</span>
                  <span className="text-sm font-medium">400+</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-black">Network Coverage</h3>
                <Globe size={20} className="text-gray-400" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Airports Served</span>
                  <span className="text-sm font-medium">5,000+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Countries</span>
                  <span className="text-sm font-medium">150+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Helipads</span>
                  <span className="text-sm font-medium">1,200+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Vertiports</span>
                  <span className="text-sm font-medium">25+</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-
