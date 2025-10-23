import React, { useState, useEffect } from 'react';
import { ArrowRight, Globe, Briefcase, Code, BarChart, Target, Heart, Users, Shield, Plane, Headphones, UserCheck, MapPin, Calendar, Star, Building2, TrendingUp } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function BehindTheScene() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const teamMembers = [
    // Leadership
    {
      name: "Lorenzo Vanza",
      role: "Founder & CEO",
      location: "Asia",
      icon: Briefcase,
      description: "With over 12 years in business development, Lorenzo brings unparalleled expertise and vision to PrivateCharterX.",
      category: "leadership"
    },
    {
      name: "Andrin Schaufelberger",
      role: "Chief Financial Officer",
      location: "Basel, Switzerland",
      icon: BarChart,
      description: "With 26 years of CEO experience and extensive knowledge in financial strategy, Andrin leads our financial operations.",
      category: "leadership"
    },
    {
      name: "Claudio Steyskal",
      role: "Head of Branch Switzerland",
      location: "Zurich, Switzerland",
      icon: Target,
      description: "Leading our Swiss operations, Claudio brings strategic vision and operational excellence to our core market.",
      category: "leadership"
    },
    {
      name: "Moreno Guerini",
      role: "Head of Marketing",
      location: "Zurich, Switzerland",
      icon: Star,
      description: "A creative force in luxury marketing, Moreno crafts our brand strategy and digital presence.",
      category: "Marketing, Organization"
    },
    {
      name: "Marisa Clarks",
      role: "Head of Administration",
      location: "London, United Kingdom",
      icon: Shield,
      description: "With meticulous attention to detail, Marisa oversees our administrative operations.",
      category: "leadership"
    },

    // Aviation Team
    {
      name: "Ivan Sarastov",
      role: "Lead Backend Developer",
      location: "Pomorie, Bulgaria",
      icon: Globe,
      description: "Guiding our team through the technical challenges of building an advanced Web3 platform, Ivan combines extensive knowledge with hands-on leadership.",
      category: "Development"
    },
    {
      name: "Simon Kulik",
      role: "IT Specialist & Crypto Expert",
      location: "Konstanz, Germany",
      icon: Code,
      description: "Leading our crypto marketing initiatives, Simon brings extensive knowledge in technology and digital strategy.",
      category: "aviation"
    },
    {
      name: "Dylan Fechner",
      role: "IT Specialist",
      location: "Düsseldorf, Germany",
      icon: Code,
      description: "Technical specialist focusing on system architecture and digital infrastructure development for our growing platform.",
      category: "Web3 / Crypto"
    },
    {
      name: "Marco Marino",
      role: "Business Aviation Manager",
      location: "Padova, Italy",
      icon: Plane,
      description: "Seasoned aviation professional managing flight operations and ensuring safety compliance across our European network.",
      category: "aviation"
    },
    {
      name: "Elena Rodriguez",
      role: "Business Aviation Coordinator",
      location: "Madrid, Spain",
      icon: Calendar,
      description: "Expert flight coordinator specializing in complex itineraries and premium customer service delivery.",
      category: "aviation"
    },
    {
      name: "Thomas Mueller",
      role: "Sales Manager Aviation",
      location: "Frankfurt, Germany",
      icon: UserCheck,
      description: "Leading sales initiatives in the German market with deep expertise in private aviation services.",
      category: "aviation"
    },
    {
      name: "Sophie Laurent",
      role: "Flight Operations Coordinator",
      location: "Paris, France",
      icon: MapPin,
      description: "Managing daily flight operations and coordinating with international aviation authorities for seamless travel experiences.",
      category: "aviation"
    },
    // Support Team  
  ];

  const leadershipTeam = teamMembers.filter(member => member.category === 'leadership');
  const aviationTeam = teamMembers.filter(member => member.category === 'aviation');
  const supportTeam = teamMembers.filter(member => member.category === 'support');

  const handleJoinTeam = () => {
    window.location.href = 'mailto:careers@privatecharterx.com?subject=Career Opportunity Inquiry';
  };

  const handleReadBlog = () => {
    window.open('https://privatecharterx.blog', '_blank');
  };

  const milestones = [
    {
      year: "2023",
      location: "London",
      title: "The Beginning",
      description: "Founded in the heart of London's financial district, PrivateCharterX began with a vision to revolutionize private aviation through technology and exceptional service.",
      icon: Building2
    },
    {
      year: "2024",
      location: "Zurich",
      title: "European Expansion",
      description: "Established our European headquarters in Zurich, positioning ourselves at the center of Europe's luxury travel market and expanding our operational capabilities.",
      icon: TrendingUp
    },
    {
      year: "2025",
      location: "Miami",
      title: "Global Reach",
      description: "Opening our Americas hub in Miami, connecting three continents and establishing PrivateCharterX as a truly global private aviation leader.",
      icon: Globe
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />

      <main className="flex-1 pt-[120px]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

          {/* Hero Section */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-black/5 rounded-full px-6 py-2 mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Building the future of private aviation</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-light mb-8 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Behind the Scenes
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
              We are dedicated to excellence, precision, and seamless experiences. Our global team of aviation specialists, technology innovators, and customer experience professionals work tirelessly to redefine what's possible in private aviation.
            </p>
          </div>

          {/* Journey Timeline */}
          <div className="mb-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-light mb-6 text-gray-900">Our Journey</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From a London startup to a global aviation network spanning three continents
              </p>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 md:left-1/2 transform md:-translate-x-px h-full w-0.5 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300"></div>

              <div className="space-y-16">
                {milestones.map((milestone, index) => {
                  const Icon = milestone.icon;
                  const isEven = index % 2 === 0;

                  return (
                    <div key={index} className={`relative flex items-center justify-start md:${isEven ? 'justify-start' : 'justify-end'}`}>
                      {/* Timeline dot */}
                      <div className="absolute left-8 md:left-1/2 transform -translate-x-1/2 w-4 h-4 bg-black rounded-full border-4 border-white shadow-lg z-10"></div>

                      {/* Content */}
                      <div className={`w-full pl-16 md:w-5/12 md:pl-0 ${isEven ? 'md:pr-8 md:text-right' : 'md:pl-8 md:text-left'}`}>
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                          <div className={`flex items-center gap-4 mb-4 justify-start ${isEven ? 'md:justify-end' : 'md:justify-start'}`}>
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center">
                              <Icon size={20} className="text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">{milestone.year}</p>
                              <p className="text-lg font-medium text-gray-900">{milestone.location}</p>
                            </div>
                          </div>
                          <h3 className="text-2xl font-light mb-3 text-gray-900">{milestone.title}</h3>
                          <p className="text-gray-600 leading-relaxed">{milestone.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Our Team */}
          <div className="mb-20">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {teamMembers.map((member, index) => {
                return (
                  <div key={index} className="group bg-white p-5 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200">
                    <h3 className="text-base font-medium mb-1 text-gray-900">{member.name}</h3>
                    <p className="text-gray-800 font-semibold text-xs mb-2">{member.role}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin size={10} />
                      {member.location}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact CTA */}
          <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white py-16 rounded-2xl text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>

            <div className="relative z-10 max-w-3xl mx-auto px-8">
              <h2 className="text-3xl font-light mb-4">Ready to Experience Excellence?</h2>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                Connect with our team to discover how PrivateCharterX can elevate your next journey.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.location.href = 'mailto:admin@privatecharterx.com?subject=Charter Inquiry'}
                  className="group inline-flex items-center justify-center gap-3 px-8 py-3 bg-white text-black rounded-xl font-medium hover:bg-gray-100 transition-all transform hover:scale-105"
                >
                  <span>Get in Touch</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={handleReadBlog}
                  className="group inline-flex items-center justify-center gap-3 px-8 py-3 border border-white/20 text-white rounded-xl font-medium hover:bg-white/10 transition-all transform hover:scale-105"
                >
                  <Globe size={18} />
                  <span>Learn More</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
