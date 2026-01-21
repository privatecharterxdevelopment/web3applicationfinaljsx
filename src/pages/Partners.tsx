import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Globe, Users, TrendingUp, MessageSquare } from 'lucide-react';

export default function Partners() {
  const navigate = useNavigate();

  const handleApplyNow = () => {
    const subject = encodeURIComponent('Partner Application - [Your Company Name]');
    const body = encodeURIComponent(`Hello PrivateCharterX Team,

I am interested in becoming a partner and getting listed on your AI-powered booking platform.

Company Information:
- Company Name:
- Website:
- Industry/Services:
- Location(s):
- Contact Person:
- Email:
- Phone:

Services we offer:
- [ ] Flights / Aviation
- [ ] Hotels / Accommodation
- [ ] Ground Transportation
- [ ] Adventures / Experiences
- [ ] Yacht Charter
- [ ] Other:

Brief description of your business:


Why you want to partner with PrivateCharterX:


Looking forward to hearing from you.

Best regards,
[Your Name]`);

    window.location.href = `mailto:admin@privatecharterx.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Satoshi', sans-serif" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Back</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-xs font-medium mb-6">
            <Sparkles size={14} />
            Partner Program
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900 tracking-tight mb-6">
            Partner with us and get listed<br />
            <span className="text-gray-500">within all major AIs</span>
          </h1>

          <p className="text-lg text-gray-600 font-light max-w-2xl mx-auto mb-10">
            Allow users to book your services by AI Chat. Join the future of travel booking where customers discover and book through natural conversation with AI assistants.
          </p>

          <button
            onClick={handleApplyNow}
            className="inline-flex items-center gap-2 bg-black hover:bg-gray-900 text-white px-8 py-4 rounded-full text-base font-medium transition-all hover:scale-105"
          >
            Apply Now
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 12h14m-7-7 7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="bg-white rounded-2xl p-8 border border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <Globe size={24} className="text-gray-700" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Global AI Visibility</h3>
            <p className="text-gray-600 font-light">
              Your services become discoverable through AI conversations. Users can find and book you simply by chatting with our AI assistant.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <MessageSquare size={24} className="text-gray-700" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Conversational Booking</h3>
            <p className="text-gray-600 font-light">
              Customers book through natural language. No complicated forms - just a simple chat that converts into real bookings.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <Users size={24} className="text-gray-700" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">New Customer Channel</h3>
            <p className="text-gray-600 font-light">
              Reach customers who prefer AI-assisted booking. Tap into the growing market of travelers who want seamless, chat-based experiences.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp size={24} className="text-gray-700" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Commission-Based Model</h3>
            <p className="text-gray-600 font-light">
              No upfront costs. You only pay a commission when we bring you confirmed bookings. Performance-based partnership.
            </p>
          </div>
        </div>

        {/* Who Can Partner */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 mb-16">
          <h2 className="text-xl font-medium text-gray-900 mb-6">Who can partner with us?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              'Airlines & Flight Operators',
              'Hotels & Resorts',
              'Ground Transportation',
              'Adventure Companies',
              'Yacht Charter Services',
              'Tour Operators',
              'Car Rental Services',
              'Concierge Services',
              'Experience Providers'
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-gray-700">
                <div className="w-1.5 h-1.5 bg-black rounded-full" />
                <span className="text-sm font-light">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-4">
            Questions? Contact us at{' '}
            <a href="mailto:admin@privatecharterx.com" className="text-gray-900 hover:underline">
              admin@privatecharterx.com
            </a>
          </p>
          <button
            onClick={handleApplyNow}
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-full text-sm font-medium transition-colors"
          >
            Apply to become a partner
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <p className="text-xs text-gray-500 text-center">
            © 2025 PrivateCharterX LLC · Miami, Florida
          </p>
        </div>
      </div>
    </div>
  );
}
