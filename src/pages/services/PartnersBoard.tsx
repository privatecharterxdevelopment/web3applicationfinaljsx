import React from 'react';
import { Globe, Users, Star, Zap, Shield, Target, ExternalLink } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const PartnersBoard: React.FC = () => {
  const benefits = [
    {
      icon: <Globe className="w-6 h-6 text-gray-400" />,
      title: "Global Visibility",
      description: "Your logo displayed prominently on our platform, reaching thousands of luxury travelers worldwide."
    },
    {
      icon: <Users className="w-6 h-6 text-gray-400" />,
      title: "Premium Network", 
      description: "Join an exclusive network of forward-thinking companies committed to sustainable luxury travel."
    },
    {
      icon: <Star className="w-6 h-6 text-gray-400" />,
      title: "Brand Excellence",
      description: "Associate your brand with innovation, sustainability, and the future of luxury transportation."
    },
    {
      icon: <Zap className="w-6 h-6 text-gray-400" />,
      title: "Future-Ready",
      description: "Demonstrate your commitment to sustainable aviation, Web3 technology, and environmental responsibility."
    },
    {
      icon: <Shield className="w-6 h-6 text-gray-400" />,
      title: "Trust & Credibility",
      description: "Build trust with your customers by showing your dedication to sustainable business practices."
    },
    {
      icon: <Target className="w-6 h-6 text-gray-400" />,
      title: "Targeted Exposure",
      description: "Reach high-net-worth individuals and corporate clients actively seeking luxury travel solutions."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 pt-[88px]">
        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-4 tracking-tighter">
              Partners Board
            </h1>

            <p className="text-gray-500 mb-12 max-w-2xl mx-auto font-light">
              Join our exclusive Partners Board and showcase your commitment to the future of sustainable luxury travel.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex justify-center mb-16">
            <a
              href="https://buy.stripe.com/28EcN4cBn91T5QN3NKdZ600"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center gap-2"
            >
              Join Now
              <ExternalLink size={18} />
            </a>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-gray-100 hover:shadow-sm transition-all duration-300 p-6"
              >
                <div className="mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-medium text-black mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-gray-500 font-light leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          {/* Partner Logos */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-light text-black mb-2">Current Partners</h2>
              <p className="text-gray-500 font-light">Companies committed to sustainable luxury travel</p>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Array.from({ length: 8 }, (_, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-xl p-6 flex items-center justify-center h-20 hover:bg-gray-100 transition-colors"
                  >
                    <div className="text-xs text-gray-400 text-center">Partner {index + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-xs text-gray-400 font-light">
              Your company logo will be listed within 24h after payment confirmation
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PartnersBoard;
