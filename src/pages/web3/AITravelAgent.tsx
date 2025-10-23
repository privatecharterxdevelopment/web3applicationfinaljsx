import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AITravelAgentChat from '../../components/AITravelAgentChat';
import { VoiceProvider } from '@humeai/voice-react';

interface TravelService {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  category: string;
}

export default function AITravelAgent() {
  const services: TravelService[] = [
    // Only showing two main categories as requested
    {
      id: '1',
      title: 'Private Jet Charter',
      description: 'Experience the ultimate in luxury air travel with our private jet charter services.',
      imageUrl: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2574&q=80',
      link: '/services/private-jet-charter',
      category: 'air'
    },
    {
      id: '3',
      title: 'Helicopter Charter',
      description: 'Reach your destination quickly and efficiently with our premium helicopter services.',
      imageUrl: 'https://sgfnbormqiqgvhdfwmhz.supabase.co/storage/v1/object/sign/helicopter/image-112-1024x683.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJoZWxpY29wdGVyL2ltYWdlLTExMi0xMDI0eDY4My5wbmciLCJpYXQiOjE3NDY0Njg2MzIsImV4cCI6MzA0MjQ2ODYzMn0.bQOoPWMGDAh8EeRCHYQFZMiBhkQ1RD9osvUpGVdoy9M',
      link: '/services/helicopter-charter',
      category: 'air'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 pt-[88px]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">AI Travel Agent</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Experience the future of luxury travel planning with our AI-powered travel agent. Ask about our services, get personalized recommendations, and book your next luxury journey with voice or text.
            </p>
          </div>

          {/* Chat Interface */}
          <div className="max-w-4xl mx-auto bg-transparent rounded-xl overflow-hidden">
            <VoiceProvider
              apiKey={import.meta.env.VITE_REACT_APP_HUME_API_KEY}
              apiSecret={import.meta.env.VITE_REACT_APP_HUME_API_SECRET}
            >
              <AITravelAgentChat />
            </VoiceProvider>
          </div>

          {/* Services Section */}
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-6 text-center">Our Luxury Services</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {services.map((service) => (
                <a 
                  key={service.id}
                  href={service.link}
                  className="bg-white/95 backdrop-blur-sm rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-100 group h-64"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img 
                      src={service.imageUrl} 
                      alt={service.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold mb-2">{service.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{service.description}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}