import React, { useState } from 'react';
import {
  ArrowRight, Users, Zap, GraduationCap, Heart, Star, Shield,
  Coins, Leaf, Mail, Check, X, Plane, Award, Target,
  Globe, Briefcase, BookOpen, Rocket, TrendingUp, Handshake
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Modal Component for Program Details
const ProgramDetailModal = ({ program, onClose }: { program: any; onClose: () => void }) => {
  if (!program) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-8 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-light text-black mb-2">{program.title}</h2>
            <p className="text-gray-500 font-light">{program.subtitle}</p>
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
            {program.detailedInfo.map((section: any, index: number) => (
              <div key={index}>
                <h3 className="text-lg font-medium text-black mb-3">{section.title}</h3>
                <div className="space-y-3">
                  {section.details.map((detail: string, detailIndex: number) => (
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

// Application Form Component
const ApplicationForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    program: 'pilot',
    experience: '',
    motivation: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Create mailto link with form data
    const subject = encodeURIComponent(`Crypto Fund Application - ${formData.program.charAt(0).toUpperCase() + formData.program.slice(1)} Program`);
    const body = encodeURIComponent(`
Full Name: ${formData.fullName}
Email: ${formData.email}
Phone: ${formData.phone}
Program: ${formData.program}
Experience: ${formData.experience}
Motivation: ${formData.motivation}
    `);
    window.location.href = `mailto:jobs@privatecharterx.com?subject=${subject}&body=${body}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            placeholder="Your full name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            placeholder="your@email.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            placeholder="+1 234 567 8900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Program *</label>
          <select
            required
            value={formData.program}
            onChange={(e) => setFormData({ ...formData, program: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          >
            <option value="pilot">Pilot Training Program</option>
            <option value="mechanic">Aircraft Mechanic Program</option>
            <option value="cabin">Cabin Crew Training</option>
            <option value="ground">Ground Operations</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Current Experience</label>
        <input
          type="text"
          value={formData.experience}
          onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          placeholder="e.g., Student pilot with 50 hours, Aviation school graduate, etc."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Why do you want to join? *</label>
        <textarea
          required
          value={formData.motivation}
          onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none"
          placeholder="Tell us about your passion for aviation and why you'd be a great fit for our program..."
        />
      </div>

      <button
        type="submit"
        className="w-full bg-black text-white px-8 py-4 rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
      >
        Submit Application
        <ArrowRight size={18} />
      </button>
    </form>
  );
};

export default function CryptoFund() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);

  // Fund programs with detailed information
  const fundPrograms = [
    {
      id: 'pilot-training',
      title: 'Pilot Training Program',
      subtitle: 'From zero to commercial pilot license',
      description: 'Complete financial support for aspiring pilots to obtain their theoretical knowledge and practical flight training, leading to a commercial pilot license.',
      features: ['Theory exam preparation', 'Flight hour financing', 'Type rating support', 'Job placement assistance'],
      icon: Plane,
      gradient: 'from-blue-50 to-indigo-50',
      hoverGradient: 'from-blue-100 to-indigo-100',
      stats: { duration: '18-24 months', funding: 'Up to €80k', success: '94%' },
      detailedInfo: [
        {
          title: 'Training Path & Milestones',
          details: [
            'Private Pilot License (PPL): Initial flight training with 45+ hours of flight time including solo flights',
            'Instrument Rating (IR): Advanced navigation training for all-weather flying capabilities',
            'Commercial Pilot License (CPL): Professional pilot qualification with 200+ total flight hours',
            'Multi-Engine Rating (ME): Training on twin-engine aircraft for commercial operations',
            'Type Rating: Specific aircraft qualification for jets used in charter operations',
            'Line Training: On-the-job training with experienced captains in real charter scenarios'
          ]
        },
        {
          title: 'Financial Support Structure',
          details: [
            'Tuition fees for accredited flight schools covered up to €60,000',
            'Living allowance during intensive training periods',
            'Examination fees for all theoretical and practical tests',
            'Medical examination costs for Class 1 medical certificate',
            'Study materials and flight planning tools provided',
            'Simulator sessions for advanced training scenarios'
          ]
        },
        {
          title: 'Career Integration & Mentorship',
          details: [
            'Guaranteed interview opportunities with PrivateCharterX partner operators',
            'Mentorship program pairing trainees with experienced charter pilots',
            'Networking events with aviation industry professionals',
            'Resume and interview preparation assistance',
            'First Officer positions available upon successful completion',
            'Ongoing professional development and recurrent training support'
          ]
        }
      ]
    },
    {
      id: 'mechanic-training',
      title: 'Aircraft Mechanic Program',
      subtitle: 'Certified aircraft maintenance engineer',
      description: 'Comprehensive training program for aircraft mechanics covering theoretical exams and practical workshop experience on various aircraft types.',
      features: ['EASA Part-66 certification', 'Workshop training', 'Type certifications', 'Career placement'],
      icon: Briefcase,
      gradient: 'from-emerald-50 to-teal-50',
      hoverGradient: 'from-emerald-100 to-teal-100',
      stats: { duration: '24-36 months', funding: 'Up to €50k', success: '92%' },
      detailedInfo: [
        {
          title: 'Certification Pathway',
          details: [
            'EASA Part-66 Category B1: Mechanical systems, structures, and powerplant',
            'EASA Part-66 Category B2: Avionic and electrical systems',
            'Type Training: Specific aircraft type certifications (Cessna, Embraer, Bombardier)',
            'Practical experience requirements: 2-5 years depending on category',
            'Human Factors training and safety management systems',
            'Continuing airworthiness management organization (CAMO) training'
          ]
        },
        {
          title: 'Hands-On Workshop Experience',
          details: [
            'Maintenance base access at partner facilities across Europe',
            'Real aircraft maintenance tasks under supervision of licensed engineers',
            'Engine overhaul and component repair training',
            'Avionics troubleshooting and installation experience',
            'Documentation and compliance training for airworthiness',
            'Quality assurance and inspection techniques'
          ]
        },
        {
          title: 'Employment Opportunities',
          details: [
            'Direct placement with PrivateCharterX maintenance partners',
            'Line maintenance positions at major European airports',
            'Base maintenance opportunities at MRO facilities',
            'Mobile maintenance team positions for on-site repairs',
            'Competitive salary packages with industry-leading benefits',
            'Career advancement to Lead Engineer and Management roles'
          ]
        }
      ]
    },
    {
      id: 'cabin-crew',
      title: 'Cabin Crew Training',
      subtitle: 'VIP service excellence in private aviation',
      description: 'Elite training program for cabin crew members specializing in ultra-high-net-worth client service aboard private jets and luxury charter flights.',
      features: ['Safety certifications', 'VIP service training', 'Culinary arts', 'Multi-language support'],
      icon: Star,
      gradient: 'from-amber-50 to-orange-50',
      hoverGradient: 'from-amber-100 to-orange-100',
      stats: { duration: '3-6 months', funding: 'Up to €15k', success: '96%' },
      detailedInfo: [
        {
          title: 'Safety & Emergency Training',
          details: [
            'SEP (Safety Equipment & Procedures) certification for private jets',
            'First aid and medical emergency response training',
            'Fire fighting and smoke evacuation procedures',
            'Ditching and water survival training',
            'Security awareness and threat assessment',
            'Dangerous goods handling and awareness'
          ]
        },
        {
          title: 'VIP Service Excellence',
          details: [
            'Ultra-high-net-worth client psychology and expectations',
            'Fine dining service and wine pairing expertise',
            'Luxury brand knowledge and protocol awareness',
            'Discretion and confidentiality training',
            'Cultural sensitivity and international etiquette',
            'Personal styling and presentation standards'
          ]
        },
        {
          title: 'Specialized Skills',
          details: [
            'Culinary arts training with celebrity chef partnerships',
            'Mixology and beverage service certification',
            'Language training (minimum 2 languages required)',
            'Event planning and special occasion coordination',
            'Child care and family travel assistance',
            'Pet handling and comfort during flights'
          ]
        }
      ]
    },
    {
      id: 'ground-ops',
      title: 'Ground Operations',
      subtitle: 'Airport operations and flight coordination',
      description: 'Training program for ground operations staff covering flight planning, passenger handling, and FBO operations for private aviation.',
      features: ['Flight dispatch training', 'FBO operations', 'Passenger services', 'Regulatory compliance'],
      icon: Globe,
      gradient: 'from-purple-50 to-violet-50',
      hoverGradient: 'from-purple-100 to-violet-100',
      stats: { duration: '6-12 months', funding: 'Up to €20k', success: '98%' },
      detailedInfo: [
        {
          title: 'Flight Operations Training',
          details: [
            'Flight planning and dispatch procedures',
            'Weather analysis and route optimization',
            'Fuel planning and weight & balance calculations',
            'NOTAM interpretation and airspace management',
            'Slot coordination and airport permissions',
            'International flight planning and overflight permits'
          ]
        },
        {
          title: 'FBO & Passenger Services',
          details: [
            'VIP lounge management and hospitality',
            'Customs and immigration coordination',
            'Ground transportation and concierge services',
            'Catering coordination and special requests handling',
            'Aircraft cleaning and preparation supervision',
            'Baggage handling and security procedures'
          ]
        },
        {
          title: 'Regulatory & Compliance',
          details: [
            'Aviation security regulations and procedures',
            'Data protection and passenger privacy (GDPR)',
            'Quality management systems (ISO standards)',
            'Environmental compliance and sustainability',
            'Emergency response procedures',
            'Continuous improvement and audit readiness'
          ]
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Main Content */}
      <main className="flex-1 pt-[88px]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm font-light mb-6">
              <Coins size={16} />
              Tokenized Aviation Fund
            </div>

            <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-6 tracking-tighter">
              Crypto Fund
            </h1>

            <p className="text-xl text-gray-500 mb-8 max-w-3xl mx-auto font-light leading-relaxed">
              Building the future of aviation together. A portion of our revenue flows into this tokenized fund
              to support aspiring pilots, mechanics, and aviation professionals on their journey to the skies.
            </p>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-400 font-light flex-wrap">
              <div className="flex items-center gap-2">
                <Heart size={16} />
                Community Driven
              </div>
              <div className="flex items-center gap-2">
                <Shield size={16} />
                Blockchain Transparent
              </div>
              <div className="flex items-center gap-2">
                <Coins size={16} />
                Tokenized Fund
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap size={16} />
                Career Support
              </div>
            </div>
          </div>

          {/* Fund Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={24} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-light text-black mb-2">5%</h3>
              <p className="text-sm text-gray-500 font-light">Of revenue allocated to fund</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={24} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-light text-black mb-2">50+</h3>
              <p className="text-sm text-gray-500 font-light">Professionals supported annually</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award size={24} className="text-purple-600" />
              </div>
              <h3 className="text-2xl font-light text-black mb-2">95%</h3>
              <p className="text-sm text-gray-500 font-light">Career placement success rate</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <a
              href="#apply-now"
              className="bg-black text-white px-8 py-4 rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
            >
              Apply Now
              <ArrowRight size={18} />
            </a>
            <a
              href="mailto:jobs@privatecharterx.com"
              className="bg-gray-100 text-gray-700 px-8 py-4 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Mail size={18} />
              Contact Us
            </a>
          </div>

          {/* Programs Grid */}
          <div className="mb-20">
            <h2 className="text-2xl font-light text-center text-black mb-12">Available Programs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {fundPrograms.map((program) => (
                <div
                  key={program.id}
                  onMouseEnter={() => setHoveredCard(program.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`
                    relative overflow-hidden rounded-3xl border border-gray-100 cursor-pointer
                    transition-all duration-500 hover:shadow-xl hover:-translate-y-1
                    bg-gradient-to-br ${hoveredCard === program.id ? program.hoverGradient : program.gradient}
                  `}
                >
                  <div className="p-8">
                    {/* Program Icon */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        <program.icon size={28} className="text-gray-700" />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedProgram(program)}
                          className="p-2 bg-white/60 hover:bg-white/80 rounded-lg transition-colors"
                        >
                          <BookOpen size={16} className="text-gray-600" />
                        </button>
                        <a
                          href="#apply-now"
                          className="p-2 bg-white/60 hover:bg-white/80 rounded-lg transition-colors"
                        >
                          <ArrowRight
                            size={16}
                            className={`text-gray-600 transition-transform duration-300 ${
                              hoveredCard === program.id ? 'translate-x-1' : ''
                            }`}
                          />
                        </a>
                      </div>
                    </div>

                    {/* Program Content */}
                    <h3 className="text-2xl font-light text-gray-900 mb-2">
                      {program.title}
                    </h3>
                    <p className="text-gray-600 font-light mb-4 text-sm">
                      {program.subtitle}
                    </p>
                    <p className="text-gray-700 font-light leading-relaxed mb-6">
                      {program.description}
                    </p>

                    {/* Program Features */}
                    <div className="space-y-2 mb-6">
                      {program.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-gray-700 rounded-full flex-shrink-0"></div>
                          <span className="text-sm text-gray-700 font-light">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Program Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/50">
                      {Object.entries(program.stats).map(([key, value], index) => (
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
                    ${hoveredCard === program.id ? 'opacity-100' : ''}
                  `} />
                </div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden mb-20">
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-light text-black mb-2">How the Crypto Fund Works</h2>
              <p className="text-gray-500 font-light">Transparent, tokenized funding for aviation careers</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
              {[
                { icon: Coins, label: 'Revenue Allocation', desc: '5% of platform revenue flows into fund' },
                { icon: Shield, label: 'Tokenization', desc: 'Fund is tokenized on blockchain' },
                { icon: Users, label: 'Community Voting', desc: 'Token holders vote on allocations' },
                { icon: GraduationCap, label: 'Training Support', desc: 'Funds distributed to trainees' },
                { icon: Handshake, label: 'Mentorship', desc: 'Industry expert guidance' },
                { icon: Target, label: 'Career Placement', desc: 'Job opportunities guaranteed' },
                { icon: TrendingUp, label: 'Success Tracking', desc: 'Transparent progress reports' },
                { icon: Heart, label: 'Community Building', desc: 'Alumni network support' }
              ].map((feature, index) => (
                <div key={index} className="p-6 border-r border-b border-gray-50 hover:bg-gray-25 transition-colors">
                  <feature.icon size={24} className="text-gray-400 mb-3" />
                  <h3 className="font-medium text-black mb-1 text-sm">{feature.label}</h3>
                  <p className="text-xs text-gray-500 font-light">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-20">
            <h3 className="text-xl font-light text-black mb-6">Why Join Our Programs?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <Shield size={20} className="text-blue-600" />
                </div>
                <h4 className="font-medium text-black mb-3">Financial Security</h4>
                <div className="space-y-2 text-sm text-gray-500 font-light">
                  <p>• Full tuition coverage for approved programs</p>
                  <p>• Living allowance during training periods</p>
                  <p>• No repayment required - it's a grant, not a loan</p>
                  <p>• Equipment and materials provided</p>
                </div>
              </div>
              <div>
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4">
                  <Rocket size={20} className="text-green-600" />
                </div>
                <h4 className="font-medium text-black mb-3">Career Acceleration</h4>
                <div className="space-y-2 text-sm text-gray-500 font-light">
                  <p>• Guaranteed job interviews upon completion</p>
                  <p>• Industry connections and networking events</p>
                  <p>• Resume and interview coaching</p>
                  <p>• Fast-track career progression paths</p>
                </div>
              </div>
              <div>
                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                  <Heart size={20} className="text-purple-600" />
                </div>
                <h4 className="font-medium text-black mb-3">Ongoing Support</h4>
                <div className="space-y-2 text-sm text-gray-500 font-light">
                  <p>• Lifetime alumni network membership</p>
                  <p>• Continuous professional development</p>
                  <p>• Mentorship from industry veterans</p>
                  <p>• Community events and gatherings</p>
                </div>
              </div>
            </div>
          </div>

          {/* Application Form Section */}
          <div id="apply-now" className="bg-white rounded-3xl border border-gray-100 overflow-hidden mb-20">
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-light text-black mb-2">Apply Now</h2>
              <p className="text-gray-500 font-light">Start your journey in aviation today</p>
            </div>

            <div className="p-8">
              <ApplicationForm />
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-20">
            <h3 className="text-xl font-light text-black mb-6">Frequently Asked Questions</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-black mb-2">Who can apply for the Crypto Fund programs?</h4>
                <p className="text-sm text-gray-600 font-light leading-relaxed">
                  Anyone with a passion for aviation can apply. We welcome applications from all backgrounds,
                  whether you're a recent graduate, career changer, or someone who has always dreamed of working
                  in aviation. Selection is based on motivation, aptitude, and commitment.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-black mb-2">Do I need to repay the funding?</h4>
                <p className="text-sm text-gray-600 font-light leading-relaxed">
                  No, the Crypto Fund provides grants, not loans. Once you're accepted into a program,
                  the funding is yours to keep. We only ask that you complete the program and contribute
                  to the aviation community through your career.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-black mb-2">How is the fund tokenized?</h4>
                <p className="text-sm text-gray-600 font-light leading-relaxed">
                  The fund is represented on blockchain as a transparent pool. Token holders can track
                  all allocations, see how funds are distributed, and participate in governance decisions
                  about program priorities and selection criteria.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-black mb-2">What happens after I complete the program?</h4>
                <p className="text-sm text-gray-600 font-light leading-relaxed">
                  Graduates receive guaranteed job interviews with our partner operators and airlines.
                  We have a 95% placement success rate, and you'll have lifetime access to our alumni
                  network for ongoing support and career advancement opportunities.
                </p>
              </div>
            </div>
          </div>

          {/* Final CTA Section */}
          <div className="mt-20">
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl"></div>
              <div className="relative px-8 sm:px-12 py-16 sm:py-20 text-center text-white">
                <h2 className="text-3xl sm:text-4xl font-light mb-6">
                  Ready to Start Your Aviation Career?
                </h2>
                <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed font-light">
                  Join our community-driven initiative and let us help you achieve your dreams in aviation.
                  Together, we're building the future of the industry.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <a
                    href="#apply-now"
                    className="inline-flex items-center justify-center bg-white text-gray-900 px-8 py-4 rounded-2xl font-medium hover:bg-gray-100 transition-all duration-300 group"
                  >
                    Apply for a Program
                    <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <a
                    href="mailto:jobs@privatecharterx.com"
                    className="inline-flex items-center justify-center bg-transparent text-white border border-white/30 px-8 py-4 rounded-2xl font-medium hover:bg-white/10 transition-all duration-300"
                  >
                    <Mail size={16} className="mr-2" />
                    Contact Our Team
                  </a>
                </div>

                <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Coins size={14} />
                    Tokenized Fund
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart size={14} />
                    Community Driven
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap size={14} />
                    Career Support
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Program Detail Modal */}
      <ProgramDetailModal
        program={selectedProgram}
        onClose={() => setSelectedProgram(null)}
      />
    </div>
  );
}
