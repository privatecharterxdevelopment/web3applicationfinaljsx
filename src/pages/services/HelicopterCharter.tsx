import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, Calendar, Users, Clock, Info, X, Search, ArrowRight,
  ChevronDown, Check, AlertTriangle, Mail, Lock, Eye, EyeOff,
  CheckCircle, AlertCircle, Cloud, Shield, Zap, Navigation,
  Mountain, Building2, Anchor, Compass, Phone, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Portal from '../../components/Portal';

const HelicopterCharterPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);

  // Information cards data - simplified for black/white/grey design
  const serviceCards = [
    {
      id: 'range',
      title: 'Maximum Range & Flight Specifications',
      subtitle: 'Understanding helicopter capabilities and limitations',
      details: [
        'Robinson R44: 600km range, 3 passengers, 70 minutes maximum flight time',
        'Airbus H125: 700km range, 5 passengers, single engine reliability',
        'Airbus H135: 650km range, 6 passengers, twin engine safety standards',
        'Leonardo AW109: 800km range, 7 passengers, luxury executive comfort',
        'Optimal flight distance: 50-250km for maximum operational efficiency',
        'All aircraft certified for VFR and IFR operations worldwide'
      ]
    },
    {
      id: 'weather',
      title: 'Weather Sensitivity & Safety Protocols',
      subtitle: 'High volatility operations with safety-first approach',
      details: [
        'Flights can be cancelled up to 15 minutes before departure due to weather conditions',
        'Safety is absolute priority - pilot decisions are final and non-negotiable',
        'Minimum visibility requirements: 5km for VFR operations',
        'Maximum wind speed limits: 35 knots for safe helicopter operations',
        'No flights during thunderstorms, heavy precipitation, or dense fog conditions',
        '24/7 meteorological monitoring by certified weather specialists',
        'Alternative dates offered at no additional cost for weather-related cancellations'
      ]
    },
    {
      id: 'operations',
      title: 'Operational Flexibility & Landing Sites',
      subtitle: 'Yacht transfers, urban access, and specialized operations',
      details: [
        'Yacht to land transfers: Direct helicopter-to-vessel operations available',
        'Land to land: Airports, certified helipads, and approved landing sites',
        'Urban helipad access: Major city centers and metropolitan areas',
        'Mountain landing sites: Alpine resorts and high-altitude destinations',
        'Ski resort direct access: Premium mountain resort connectivity',
        'Golf course landings: Subject to regulatory approval and permits',
        'Emergency medical transport: 24/7 availability for urgent situations'
      ]
    },
    {
      id: 'permits',
      title: 'Special Permits & Regulatory Requirements',
      subtitle: 'Sonderbewilligungen and aviation compliance worldwide',
      details: [
        'Special permits required for non-standard landing sites globally',
        'Aviation authority compliance mandatory in all operational territories',
        'Urban center landings require municipal permits and coordination',
        'Hospital helipad access requires medical justification documentation',
        'International flights require customs and immigration clearance',
        'Noise restriction compliance: Limited night operations in residential areas',
        '48-hour advance notice recommended for special permit applications'
      ]
    },
    {
      id: 'urban',
      title: 'Urban Operations & Building Landings',
      subtitle: 'Skyscraper access and metropolitan helicopter services',
      details: [
        'Certified rooftop helipads only - safety compliance mandatory',
        'Building height restrictions and designated approach corridors',
        'Structural load capacity verification required for rooftop operations',
        'Comprehensive insurance coverage required for building landing operations',
        'Emergency evacuation procedures and protocols mandatory',
        'Urban noise abatement procedures strictly enforced',
        'Air traffic control coordination required for all city operations'
      ]
    },
    {
      id: 'safety',
      title: 'Safety Standards & Operational Protocols',
      subtitle: 'Comprehensive safety management and pilot certification',
      details: [
        'All pilots certified with minimum 2,000 flight hours experience',
        'Daily pre-flight inspections conducted by certified aviation mechanics',
        'Emergency flotation systems mandatory for all water crossing operations',
        'GPS tracking and satellite communication systems on all aircraft',
        'Comprehensive liability and passenger insurance coverage included',
        'Regular maintenance schedules per international aviation standards',
        'Emergency response protocols established for all operational scenarios'
      ]
    }
  ];

  const helicopterSpecs = [
    {
      model: 'Robinson R44',
      passengers: '3 pax',
      range: '600 km',
      speed: '185 km/h',
      maxTime: '70 min',
      priceRange: '€2,800-3,200/h',
      application: 'Short transfers, aerial photography'
    },
    {
      model: 'Airbus H125',
      passengers: '5 pax',
      range: '700 km',
      speed: '220 km/h',
      maxTime: '70 min',
      priceRange: '€4,200-4,800/h',
      application: 'Mountain access, group transportation'
    },
    {
      model: 'Airbus H135',
      passengers: '6 pax',
      range: '650 km',
      speed: '230 km/h',
      maxTime: '70 min',
      priceRange: '€5,800-6,400/h',
      application: 'VIP transport, medical operations'
    },
    {
      model: 'Leonardo AW109',
      passengers: '7 pax',
      range: '800 km',
      speed: '240 km/h',
      maxTime: '70 min',
      priceRange: '€7,200-8,000/h',
      application: 'Executive transport, luxury charter'
    }
  ];

  const ServiceDetailModal = ({ service, onClose }) => {
    if (!service) return null;

    return (
      <Portal>
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
      </Portal>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Main Content */}
      <main className="flex-1 pt-[88px]">
        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-4 tracking-tighter">
              Global helicopter charter services with transparent pricing and safety-first operations
            </h1>
            
            <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto font-light">
              Direct point-to-point flights worldwide. Yacht transfers, urban access, mountain destinations. 
              Weather-dependent operations with 15-minute cancellation policy for your safety.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => navigate('/?service=helicopter')}
              className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
            >
              Request Charter Quote
              <ArrowRight size={18} />
            </button>
            <a
              href="mailto:bookings@privatecharterx.com"
              className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Mail size={18} />
              Email Operations Team
            </a>
          </div>

          {/* Information Cards Grid */}
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

          {/* Fleet Specifications */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden mb-20">
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-light text-black mb-2">Available Aircraft</h2>
              <p className="text-gray-500 font-light">Global helicopter fleet specifications and capabilities</p>
            </div>
            
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {helicopterSpecs.map((spec, index) => (
                  <div key={index} className="flex items-center justify-between p-6 border-b border-gray-50 last:border-b-0 hover:bg-gray-25 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-medium text-black mb-1">{spec.model}</h3>
                      <p className="text-sm text-gray-500 font-light">{spec.application}</p>
                    </div>
                    <div className="flex items-center gap-8 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-black">{spec.passengers}</div>
                        <div className="text-xs text-gray-400">Capacity</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-black">{spec.range}</div>
                        <div className="text-xs text-gray-400">Range</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-black">{spec.speed}</div>
                        <div className="text-xs text-gray-400">Cruise</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-black">{spec.maxTime}</div>
                        <div className="text-xs text-gray-400">Max Time</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-black">{spec.priceRange}</div>
                        <div className="text-xs text-gray-400">Hourly Rate</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Important Notices */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="flex items-start gap-4">
              <AlertTriangle size={24} className="text-gray-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-medium text-black mb-4">Operational Requirements & Safety Protocols</h3>
                <div className="space-y-4 text-sm text-gray-700 font-light leading-relaxed">
                  <p>
                    <strong className="text-black">Weather Dependency:</strong> Helicopter operations are highly weather-dependent. 
                    Flights may be cancelled up to 15 minutes before departure based on safety conditions. 
                    Continuous weather monitoring prioritizes passenger safety above all operational considerations.
                  </p>
                  
                  <p>
                    <strong className="text-black">Pilot Authority:</strong> Certified pilots maintain final authority on all flight decisions 
                    in accordance with international aviation safety standards. All decisions are based on real-time weather, 
                    visibility, and operational safety conditions.
                  </p>
                  
                  <p>
                    <strong className="text-black">Advance Planning:</strong> Special landing sites, international flights, and urban operations 
                    require regulatory permits. Standard helipad operations can be arranged same-day subject to aircraft availability 
                    and weather conditions.
                  </p>
                  
                  <p>
                    <strong className="text-black">Operational Flexibility:</strong> Due to dynamic helicopter operations, 
                    maintaining schedule flexibility is recommended for optimal charter experience.
                  </p>
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
};

export default HelicopterCharterPage;
