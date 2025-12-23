import React from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from './LandingHeader';
import Footer from './Footer';
import {
  MessageSquare,
  Sparkles,
  Plane,
  Car,
  Ship,
  Wine,
  MapPin,
  Clock,
  Shield,
  Zap,
  Globe,
  Check,
  ArrowRight,
  Bot,
  Brain,
  Mic,
  Image,
  ChevronDown
} from 'lucide-react';

interface SpheraAIProps {
  setCurrentPage: (page: string) => void;
}

function SpheraAI({ setCurrentPage }: SpheraAIProps) {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = React.useState<string | null>(null);

  const toggleFaq = (faqId: string) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  const capabilities = [
    {
      icon: Plane,
      title: 'Private Jets',
      description: 'Search and book private jets, empty legs, and helicopter transfers worldwide'
    },
    {
      icon: Car,
      title: 'Luxury Cars',
      description: 'Find premium vehicles, chauffeur services, and airport transfers'
    },
    {
      icon: Ship,
      title: 'Yachts & Boats',
      description: 'Discover yacht charters, superyachts, and maritime experiences'
    },
    {
      icon: Wine,
      title: 'Sommelier',
      description: 'Get personalized wine recommendations and add to your journey'
    },
    {
      icon: MapPin,
      title: 'Restaurants',
      description: 'Find luxury dining, make reservations, and arrange transfers'
    },
    {
      icon: Globe,
      title: 'Concierge',
      description: 'Custom requests, event planning, and exclusive experiences'
    }
  ];

  const features = [
    {
      icon: Brain,
      title: 'Powered by Claude AI',
      description: 'Advanced reasoning and natural conversation powered by Anthropic\'s Claude'
    },
    {
      icon: Zap,
      title: 'Real-Time Results',
      description: 'Live pricing, availability, and instant booking capabilities'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your conversations are encrypted and never shared with third parties'
    },
    {
      icon: Clock,
      title: '24/7 Available',
      description: 'Your AI concierge is always ready to assist, day or night'
    }
  ];

  const faqs = [
    {
      id: 'what-is',
      question: 'What is Sphera AI?',
      answer: 'Sphera AI is your personal luxury travel concierge powered by advanced AI. It can help you search and book private jets, find restaurants, arrange transfers, get wine recommendations, and handle custom requests through natural conversation.'
    },
    {
      id: 'how-works',
      question: 'How does Sphera AI work?',
      answer: 'Simply type or speak your request in natural language. Sphera AI understands context, remembers your preferences, and can handle complex multi-step requests. It connects to our real-time booking systems to provide accurate pricing and availability.'
    },
    {
      id: 'subscription',
      question: 'Do I need a subscription?',
      answer: 'Yes, Sphera AI is available through our subscription plans: Explorer ($49/mo - 5 chats), Traveller ($99/mo - 10 chats), and Elite ($399/mo - unlimited). Each chat can have multiple messages within the plan limits.'
    },
    {
      id: 'booking',
      question: 'Can Sphera AI actually book services?',
      answer: 'Yes! Sphera AI can add items to your cart and prepare booking requests. For jets, cars, and other services, our team reviews and confirms each booking. For some services like restaurant reservations, the process is handled directly.'
    },
    {
      id: 'languages',
      question: 'What languages does Sphera AI support?',
      answer: 'Sphera AI can understand and respond in multiple languages including English, German, French, Spanish, Italian, and more. Simply write in your preferred language.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-4">
      <LandingHeader />

      {/* Hero Section */}
      <section className="px-4 sm:px-8 py-12 sm:py-24 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Content */}
          <div>
            <div className="mb-8">
              <span className="bg-gray-900 text-white px-4 py-2 rounded-full text-xs font-medium tracking-wide uppercase flex items-center gap-2 w-fit">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Concierge
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 mb-6 sm:mb-8 leading-tight tracking-tight">
              Meet Sphera AI<br />
              <span className="text-gray-400">Your luxury travel assistant</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed">
              Book private jets, discover fine wines, arrange transfers, and access exclusive experiences
              through natural conversation. Sphera AI understands your needs and delivers results instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/dashboard/chat')}
                className="bg-gray-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-md text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Start Chatting
              </button>
              <button
                onClick={() => navigate('/subscriptions/plans')}
                className="border border-gray-300 text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-md text-sm hover:bg-gray-50 transition-colors"
              >
                View Plans
              </button>
            </div>
          </div>

          {/* Right side - Chat Preview */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <span className="text-xs text-gray-500 ml-2">Sphera AI</span>
            </div>
            <div className="p-4 space-y-4 h-80 overflow-y-auto">
              {/* AI Message */}
              <div className="flex justify-start">
                <div className="max-w-[80%]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
                    <span className="text-[10px] text-gray-500">Sphera AI</span>
                  </div>
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl text-sm text-gray-700">
                    Good afternoon! I'm Sphera, your luxury travel concierge. How can I assist you today?
                  </div>
                </div>
              </div>
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-gray-900 text-white px-4 py-2 rounded-2xl text-sm max-w-[80%]">
                  I need a private jet from London to Nice next Friday
                </div>
              </div>
              {/* AI Response */}
              <div className="flex justify-start">
                <div className="max-w-[80%]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
                    <span className="text-[10px] text-gray-500">Sphera AI</span>
                  </div>
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl text-sm text-gray-700">
                    I found 12 available jets for London to Nice on Friday. Here are the top options...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4">
            What Sphera AI Can Do
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            From booking private jets to finding the perfect wine, Sphera AI handles all your luxury travel needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                <cap.icon className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{cap.title}</h3>
              <p className="text-sm text-gray-600">{cap.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
        <div className="bg-gray-900 rounded-2xl p-8 sm:p-12">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-light text-white mb-4">
              Why Choose Sphera AI
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Built on cutting-edge AI technology to deliver exceptional concierge experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10"
              >
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your travel style.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Explorer', price: 49, chats: '5 chats/month', messages: '10 messages per chat' },
            { name: 'Traveller', price: 99, chats: '10 chats/month', messages: '25 messages per chat', popular: true },
            { name: 'Elite', price: 399, chats: 'Unlimited chats', messages: 'Unlimited messages' }
          ].map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl p-6 border ${plan.popular ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200'}`}
            >
              {plan.popular && (
                <span className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded uppercase font-medium">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-medium text-gray-900 mt-3">{plan.name}</h3>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-light text-gray-900">${plan.price}</span>
                <span className="text-gray-500 text-sm">/month</span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500" />
                  {plan.chats}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500" />
                  {plan.messages}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500" />
                  All AI features
                </li>
              </ul>
              <button
                onClick={() => navigate('/subscriptions/plans')}
                className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${
                  plan.popular
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedFaq === faq.id ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedFaq === faq.id && (
                <div className="px-6 pb-4 text-sm text-gray-600">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-light text-white mb-4">
            Ready to Experience Sphera AI?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Start a conversation and discover how AI can transform your luxury travel experience.
          </p>
          <button
            onClick={() => navigate('/dashboard/chat')}
            className="bg-white text-gray-900 px-8 py-4 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Chat with Sphera AI
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default SpheraAI;
