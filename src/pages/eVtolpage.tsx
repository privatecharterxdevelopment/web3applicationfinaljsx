import React, { useState } from 'react';
import { ArrowLeft, Zap, Battery, Clock, Shield, MapPin, Users, Plane, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function EVTOLPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header with white background */}
      <div className="bg-white border-b border-gray-100">
        <Header />
      </div>
      
      {/* Hero Section - N26 Style */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-full mb-8 text-sm font-medium">
              <Zap size={16} />
              Coming Soon
            </div>
            
            <h1 className="text-6xl lg:text-7xl font-light text-gray-900 mb-8 tracking-tight leading-none">
              Urban flight,
              <br />
              <span className="text-emerald-500">reimagined</span>
            </h1>
            
            <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              PrivateCharterX will soon start offering eVTOL drone flights at various locations worldwide. 
              Zero emissions. Maximum efficiency.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-4xl font-light text-gray-900 mb-2">15min</div>
              <div className="text-gray-500 text-sm font-medium">Average flight time</div>
            </div>
            <div>
              <div className="text-4xl font-light text-gray-900 mb-2">0%</div>
              <div className="text-gray-500 text-sm font-medium">Carbon emissions</div>
            </div>
            <div>
              <div className="text-4xl font-light text-gray-900 mb-2">6</div>
              <div className="text-gray-500 text-sm font-medium">Launch cities 2025-26</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-light text-gray-900 mb-4">Built for the future</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Every aspect designed for safety, efficiency, and sustainability
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Zap size={20} className="text-emerald-500" />
              </div>
              <h3 className="font-medium text-gray-900 mb-3">Electric propulsion</h3>
              <p className="text-gray-500 text-sm leading-relaxed">100% battery powered with rapid charging capabilities</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Clock size={20} className="text-blue-500" />
              </div>
              <h3 className="font-medium text-gray-900 mb-3">Skip traffic</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Direct routes reducing travel time by up to 80%</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Shield size={20} className="text-purple-500" />
              </div>
              <h3 className="font-medium text-gray-900 mb-3">Autonomous safety</h3>
              <p className="text-gray-500 text-sm leading-relaxed">AI-powered systems with multiple redundancies</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Users size={20} className="text-orange-500" />
              </div>
              <h3 className="font-medium text-gray-900 mb-3">Premium experience</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Luxury interiors with panoramic city views</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dronecrafts - Ultra Modern Style */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-gray-900 mb-4">Dronecrafts</h2>
            <p className="text-gray-500">Engineered for urban air mobility</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Drone Model 1 - Urban */}
            <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-500">
              <div className="aspect-[4/3] bg-gradient-to-b from-gray-50 to-white relative flex items-center justify-center">
                {/* EHang drone image */}
                <img 
                  src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/EHang-26-fron-view-doors-open-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9FSGFuZy0yNi1mcm9uLXZpZXctZG9vcnMtb3Blbi1yZW1vdmViZy1wcmV2aWV3LnBuZyIsImlhdCI6MTc1NDEzNDM4MSwiZXhwIjoxNzg1NjcwMzgxfQ.asq0f_Oz9HS9A-fJLHpKGu1rw5TJfskrM5eWz_VWWI8"
                  alt="EHang 216-S eVTOL"
                  className="w-72 h-48 object-contain"
                />
                
                <div className="absolute top-6 left-6">
                  <div className="bg-gray-100 px-3 py-1.5 rounded-full">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Urban</span>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-light text-gray-900 mb-1">EH216-S</h3>
                    <p className="text-sm text-gray-500">Urban Commuter</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400 uppercase tracking-wide">Prices on request</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div>
                    <div className="text-xl font-light text-gray-900 mb-1">2</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Passengers</div>
                  </div>
                  <div>
                    <div className="text-xl font-light text-gray-900 mb-1">15km</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Range</div>
                  </div>
                  <div>
                    <div className="text-xl font-light text-gray-900 mb-1">8min</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Avg Time</div>
                  </div>
                </div>
                
                <div className="space-y-3 mb-8">
                  <div className="bg-gray-50 px-4 py-3 rounded-xl">
                    <span className="text-sm text-gray-600">Autonomous navigation system</span>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 rounded-xl">
                    <span className="text-sm text-gray-600">5-minute rapid charging</span>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 rounded-xl">
                    <span className="text-sm text-gray-600">Whisper-quiet operation</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drone Model 2 - Executive */}
            <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-500">
              <div className="aspect-[4/3] bg-gradient-to-b from-gray-50 to-white relative flex items-center justify-center">
                {/* Eve eVTOL image */}
                <img 
                  src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/big-evtol-new%20(1).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9iaWctZXZ0b2wtbmV3ICgxKS5wbmciLCJpYXQiOjE3NTQxMzQ5OTIsImV4cCI6MTc4NTY3MDk5Mn0.EbTtF4hMvyJDwkFZ0ckaK5_EC5WZDSf-UZBnEAZeJMI"
                  alt="Eve eVTOL"
                  className="w-80 h-52 object-contain"
                />
                
                <div className="absolute top-6 left-6">
                  <div className="bg-gray-100 px-3 py-1.5 rounded-full">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Executive</span>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-light text-gray-900 mb-1">Eve</h3>
                    <p className="text-sm text-gray-500">Executive Travel</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400 uppercase tracking-wide">Prices on request</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div>
                    <div className="text-xl font-light text-gray-900 mb-1">4</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Passengers</div>
                  </div>
                  <div>
                    <div className="text-xl font-light text-gray-900 mb-1">100km</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Range</div>
                  </div>
                  <div>
                    <div className="text-xl font-light text-gray-900 mb-1">60min</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Max Time</div>
                  </div>
                </div>
                
                <div className="space-y-3 mb-8">
                  <div className="bg-gray-50 px-4 py-3 rounded-xl">
                    <span className="text-sm text-gray-600">Lift + cruise configuration</span>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 rounded-xl">
                    <span className="text-sm text-gray-600">Eight independent rotors</span>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 rounded-xl">
                    <span className="text-sm text-gray-600">Embraer heritage design</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Launch Timeline - Real Vertiport Data */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-gray-900 mb-4">Launch timeline</h2>
            <p className="text-gray-500">Following global vertiport infrastructure development</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-gray-900">Dubai Vertiports</div>
                  <div className="text-sm text-gray-500">Airport, Palm Jumeirah, Downtown, Marina</div>
                </div>
              </div>
              <div className="text-sm text-gray-400 font-medium">Q4 2025</div>
            </div>
            
            <div className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-gray-900">China Infrastructure</div>
                  <div className="text-sm text-gray-500">Shenzhen's 1,200+ landing platforms program</div>
                </div>
              </div>
              <div className="text-sm text-gray-400 font-medium">Q1 2026</div>
            </div>
            
            <div className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-gray-900">US Municipal Airports</div>
                  <div className="text-sm text-gray-500">46 cities developing AAM programs</div>
                </div>
              </div>
              <div className="text-sm text-gray-400 font-medium">Q2 2026</div>
            </div>
            
            <div className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-gray-900">European Cities</div>
                  <div className="text-sm text-gray-500">London, Paris, Amsterdam infrastructure</div>
                </div>
              </div>
              <div className="text-sm text-gray-400 font-medium">Q3 2026</div>
            </div>
            
            <div className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-gray-900">Miami AAM Hub</div>
                  <div className="text-sm text-gray-500">Largest US UAM ecosystem development</div>
                </div>
              </div>
              <div className="text-sm text-gray-400 font-medium">Q4 2026</div>
            </div>
            
            <div className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-gray-900">Global Network</div>
                  <div className="text-sm text-gray-500">1,500+ vertiports planned worldwide</div>
                </div>
              </div>
              <div className="text-sm text-gray-400 font-medium">2027+</div>
            </div>
          </div>
          
          <div className="mt-12 p-6 bg-gray-50 rounded-2xl">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-2">Infrastructure Status</div>
              <div className="text-2xl font-light text-gray-900 mb-4">1,504 Vertiports</div>
              <div className="text-sm text-gray-500">Planned for construction globally by 2029</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-light text-gray-900 mb-8">Why eVTOL?</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <CheckCircle size={20} className="text-emerald-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">15-minute connections</h3>
                    <p className="text-gray-500 text-sm">Travel between key locations in a fraction of the time</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <CheckCircle size={20} className="text-emerald-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Zero emissions</h3>
                    <p className="text-gray-500 text-sm">Fully electric with no carbon footprint</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <CheckCircle size={20} className="text-emerald-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Predictable timing</h3>
                    <p className="text-gray-500 text-sm">No traffic delays or route changes</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <CheckCircle size={20} className="text-emerald-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Premium comfort</h3>
                    <p className="text-gray-500 text-sm">Spacious cabins with panoramic views</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                <Plane size={24} className="text-white" />
              </div>
              <h3 className="text-2xl font-light mb-4">Ready for takeoff?</h3>
              <p className="text-gray-300 mb-8 text-sm leading-relaxed">
                Be among the first to experience the future of urban transportation. 
                Get notified about exclusive early access and special launch pricing.
              </p>
              <a 
                href="mailto:admin@privatecharterx.com?subject=eVTOL Waitlist - Early Access&body=Hi PrivateCharterX Team,%0A%0AI'm interested in joining the eVTOL waitlist for early access to drone flights.%0A%0APlease keep me updated on:%0A- Launch timeline%0A- Special pricing%0A- Available routes%0A%0AThank you!"
                className="bg-white text-gray-900 px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors text-sm w-full inline-block text-center"
              >
                Get notified
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}