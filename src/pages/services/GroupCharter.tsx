import React, { useState } from 'react';
import { ArrowRight, Users, X, AlertTriangle, FileCheck, Mail, Briefcase, Church, PartyPopper, GraduationCap, Heart, Shield, UserCheck, Cross } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Portal from '../../components/Portal';

export default function GroupCharter() {
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState(null);
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  // Email template
  const emailSubject = `Group Charter Request - ${new Date().toLocaleDateString()}`;
  const emailBody = `Dear Charter Team,%0A%0AI would like to request a quote for group charter services. Please find our requirements below:%0A%0A--- GROUP DETAILS ---%0AContact Name: [Your Full Name]%0AEmail Address: [Your Email]%0APhone Number: [Your Phone]%0ACompany/Organization: [Company Name if applicable]%0A%0A--- TRAVEL DETAILS ---%0ANumber of Passengers: [20-50 / 51-100 / 101-200 / 201-300 / 300+]%0ADeparture Location: [City, Airport Code]%0ADestination: [City, Airport Code]%0ADeparture Date: [Date]%0AReturn Date: [Date - if applicable]%0AEvent Type: [Corporate / Pilgrimage / Educational / Church Group / Sports / Bachelor Party / Other]%0A%0A--- SPECIAL SERVICES REQUIRED ---%0A☐ Wheelchair Accessible Travel%0A☐ Senior Group Assistance%0A☐ Medical Staff On Board%0A☐ Security/Bodyguard Service%0A☐ Premium Catering Service%0A☐ Corporate Branding%0A☐ Multilingual Staff Support%0A☐ Ground Transportation Coordination%0A%0A--- ADDITIONAL REQUIREMENTS ---%0A[Please describe any other special requirements, equipment needs, or services]%0A%0APlease provide a comprehensive quote including all fees, positioning costs, and international charges.%0A%0AThank you for your assistance.%0A%0ABest regards,`;

  const handleEmailClick = (e) => {
    e.preventDefault();
    setShowEmailPopup(true);
    
    // Try to open email client after a short delay to show the loading animation
    setTimeout(() => {
      window.location.href = `mailto:bookings@privatecharterx.com?subject=${emailSubject}&body=${emailBody}`;
    }, 2000);
  };

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText('bookings@privatecharterx.com').then(() => {
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 3000);
    });
  };

  const handleManualEmail = () => {
    // Create a dummy link to trigger the mailto protocol
    const mailtoLink = `mailto:bookings@privatecharterx.com?subject=${emailSubject}&body=${emailBody}`;
    
    // Create a temporary anchor tag to open the mailto link
    const tempLink = document.createElement('a');
    tempLink.href = mailtoLink;
    tempLink.click();
  };

  // Information cards data
  const serviceCards = [
    {
      id: 'capacity',
      title: 'Group Size & Aircraft Capacity',
      subtitle: 'Optimal solutions for 20-400+ passengers',
      details: [
        'Boeing 737-800: 160-189 passengers, 5,765km range, ideal for medium groups',
        'Airbus A320: 150-180 passengers, 6,150km range, modern efficiency standards',
        'Boeing 757-200: 200-239 passengers, 7,222km range, extended range capability',
        'Airbus A330-200: 250-300 passengers, 13,400km range, wide-body comfort',
        'Boeing 777-200: 300-400 passengers, 14,260km range, maximum capacity operations',
        'Minimum group size: 20 passengers for charter viability',
        'Custom seating configurations available for corporate and special events'
      ]
    },
    {
      id: 'events',
      title: 'Specialized Event Transportation',
      subtitle: 'Corporate, religious, and educational group travel',
      details: [
        'Corporate events: Executive transport for business meetings and conferences',
        'Religious pilgrimages: Sacred site visits with specialized ground coordination',
        'Educational tours: Student groups with educational program integration',
        'Church group travel: Parish trips and religious event transportation',
        'Sports team transport: Athletic team travel with equipment handling',
        'Bachelor/bachelorette parties: Celebration group transport services',
        'Custom itinerary planning with destination coordination services'
      ]
    },
    {
      id: 'services',
      title: 'Special Care & Assistance Services',
      subtitle: 'Accessibility and medical support options',
      details: [
        'Wheelchair accessible travel: Barrier-free boarding and specialized equipment',
        'Senior group assistance: Dedicated support staff for elderly passengers',
        'Medical staff on board: Qualified medical personnel for high-risk groups',
        'Security services: Professional protection and escort services',
        'Dietary accommodations: Kosher, halal, vegetarian, and special meal services',
        'Ground transportation coordination: Bus transfers and local transport',
        'Multilingual staff support: Communication assistance in multiple languages'
      ]
    },
    {
      id: 'logistics',
      title: 'Flight Operations & Logistics',
      subtitle: 'Advanced planning and operational coordination',
      details: [
        'Minimum advance booking: 2-3 months for standard groups, 4-6 months for large groups',
        'International clearances: Customs, immigration, and regulatory compliance',
        'Fuel stop coordination: Strategic refueling for extended range operations',
        'Weather contingency planning: Alternative routing and schedule flexibility',
        'Crew coordination: Certified flight crews with group charter experience',
        'Aircraft positioning: Ferry flights to optimize departure locations',
        '24/7 operations support: Real-time coordination and passenger assistance'
      ]
    },
    {
      id: 'destinations',
      title: 'Global Destination Access',
      subtitle: 'Worldwide airport network and remote location capability',
      details: [
        'Major international airports: Direct access to primary global destinations',
        'Secondary airport access: Smaller regional airports for specific locations',
        'Remote destination capability: Access to limited infrastructure locations',
        'Multi-leg journey coordination: Complex itineraries with multiple stops',
        'Seasonal destination planning: Peak season coordination and scheduling',
        'Permit acquisition: Special landing rights and regulatory approvals',
        'Ground service coordination: Passenger handling at destination airports'
      ]
    },
    {
      id: 'pricing',
      title: 'Charter Pricing & Cost Structure',
      subtitle: 'Transparent pricing models and cost optimization',
      details: [
        'Hourly charter rates: €8,000-25,000/hour depending on aircraft type',
        'Positioning costs: Ferry flights included in total charter pricing',
        'Fuel surcharges: Variable pricing based on current fuel market rates',
        'International fees: Customs, handling, and regulatory charges',
        'Catering costs: Premium in-flight dining options available',
        'Ground services: Airport handling and passenger assistance fees',
        'All-inclusive quotes: No hidden fees, comprehensive pricing transparency'
      ]
    }
  ];

  // Event types for group charter
  const eventTypes = [
    { id: 'pilgrimage', name: 'Pilgrimages', icon: Church, description: 'Religious journeys and spiritual experiences' },
    { id: 'corporate', name: 'Corporate Events', icon: Briefcase, description: 'Business travel and company events' },
    { id: 'bachelor', name: 'Bachelor Parties', icon: PartyPopper, description: 'Bachelor/bachelorette party celebrations' },
    { id: 'excursion', name: 'Educational Tours', icon: GraduationCap, description: 'Educational trips and study tours' },
    { id: 'church', name: 'Church Groups', icon: Church, description: 'Parish trips and religious events' },
    { id: 'sports', name: 'Sports Teams', icon: Users, description: 'Team travel and sports tournaments' }
  ];

  // Special services
  const specialServices = [
    { id: 'wheelchair-accessible', name: 'Wheelchair Accessible Travel', icon: UserCheck, description: 'Barrier-free equipment and support' },
    { id: 'senior-care', name: 'Senior Group Assistance', icon: Heart, description: 'Specialized care for elderly travelers' },
    { id: 'medical-staff', name: 'Medical Staff On Board', icon: Cross, description: 'Medical personnel accompanying the flight' },
    { id: 'security', name: 'Security Service', icon: Shield, description: 'Professional personal protection' }
  ];

  const aircraftSpecs = [
    {
      model: 'Boeing 737-800',
      passengers: '160-189',
      range: '5,765 km',
      speed: '842 km/h',
      application: 'Medium groups, regional routes'
    },
    {
      model: 'Airbus A320',
      passengers: '150-180',
      range: '6,150 km',
      speed: '828 km/h',
      application: 'Corporate groups, efficient operations'
    },
    {
      model: 'Boeing 757-200',
      passengers: '200-239',
      range: '7,222 km',
      speed: '850 km/h',
      application: 'Large groups, extended range'
    },
    {
      model: 'Airbus A330-200',
      passengers: '250-300',
      range: '13,400 km',
      speed: '871 km/h',
      application: 'Very large groups, intercontinental'
    },
    {
      model: 'Boeing 777-200',
      passengers: '300-400',
      range: '14,260 km',
      speed: '892 km/h',
      application: 'Maximum capacity, long-haul routes'
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

  const EmailPopup = () => {
    if (!showEmailPopup) return null;

    return (
      <Portal>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-light text-black">Email Request</h2>
              <button
                onClick={() => setShowEmailPopup(false)}
                className="p-2 hover:bg-gray-50 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
              </div>
              
              <h3 className="text-lg font-medium text-black text-center mb-2">
                Opening Your Email Client
              </h3>
              
              <p className="text-gray-500 text-center mb-6">
                Please wait while we try to open your default email application...
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-600 text-center mb-2">
                  If your email client doesn't open, you can manually send an email to:
                </p>
                
                <p className="text-base font-medium text-black text-center mb-3 break-all">
                  bookings@privatecharterx.com
                </p>
                
                <button
                  onClick={copyEmailToClipboard}
                  className="w-full bg-black text-white py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <FileCheck size={16} />
                  Copy Email Address
                </button>
                
                {emailCopied && (
                  <div className="mt-3 bg-green-50 text-green-700 py-2 px-3 rounded-lg text-sm text-center flex items-center justify-center gap-2">
                    <i className="fas fa-check-circle"></i>
                    Email address copied to clipboard!
                  </div>
                )}
              </div>

              <button
                onClick={handleManualEmail}
                className="w-full bg-red-500 text-white py-2.5 rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Mail size={16} />
                Select Email Client Manually
              </button>
            </div>
          </div>
        </div>
      </Portal>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 pt-[88px]">
        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-4 tracking-tighter">
              Specialized aircraft solutions for groups of 20-400+ passengers worldwide
            </h1>

            <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto font-light">
              Corporate events, pilgrimages, educational tours, and special occasions.
              Advanced planning required with 2-6 months lead time for optimal scheduling.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={handleEmailClick}
              className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
            >
              Request Group Charter Quote
              <ArrowRight size={18} />
            </button>
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
              <p className="text-gray-500 font-light">Group charter aircraft specifications and capabilities</p>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-full">
                {aircraftSpecs.map((spec, index) => (
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
                <h3 className="text-lg font-medium text-black mb-4">Charter Requirements & Planning Guidelines</h3>
                <div className="space-y-4 text-sm text-gray-700 font-light leading-relaxed">
                  <p>
                    <strong className="text-black">Advance Booking:</strong> Group charter requires 2-3 months advance planning for standard groups,
                    4-6 months for groups exceeding 100 passengers or during peak travel seasons.
                    Aircraft availability and international permits require extended coordination time.
                  </p>

                  <p>
                    <strong className="text-black">Minimum Group Size:</strong> Charter services are optimized for groups of 20+ passengers.
                    Smaller groups may be accommodated subject to positioning costs and minimum charter fees.
                  </p>

                  <p>
                    <strong className="text-black">International Operations:</strong> Cross-border flights require customs clearance,
                    immigration processing, and regulatory compliance in multiple jurisdictions.
                    Additional documentation and lead time required for international charter operations.
                  </p>

                  <p>
                    <strong className="text-black">Pricing Structure:</strong> Charter costs include aircraft hourly rates, positioning flights,
                    fuel surcharges, and international handling fees. All-inclusive pricing provided with no hidden costs.
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
      
      {/* Email Popup Modal */}
      <EmailPopup />
    </div>
  );
}
