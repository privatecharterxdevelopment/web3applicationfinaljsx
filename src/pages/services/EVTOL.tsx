import React from 'react';
import { ArrowRight, Check, Battery, Zap, Leaf } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageNavigation from '../../components/PageNavigation';

export default function EVTOL() {
  const navigationItems = [
    { id: 'features', label: 'Features' },
    { id: 'fleet', label: 'Our Fleet' },
    { id: 'locations', label: 'Locations' },
    { id: 'request-form', label: 'Request Info' },
    { id: 'faq', label: 'FAQ' }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <PageNavigation items={navigationItems} />

      <main className="flex-1 pt-[88px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">eVTOL Air Mobility</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The future of urban air mobility is here. Experience our expanding fleet of electric Vertical Take-Off and Landing (eVTOL) aircraft in Asia.
            </p>
          </div>

          {/* Features Section */}
          <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 scroll-mt-32">
            <div className="bg-gray-50 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-4">
                <Leaf size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Eco-Friendly</h3>
              <p className="text-base text-gray-600">
                Our eVTOL fleet produces zero direct emissions, significantly reducing the environmental impact of urban air travel.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start gap-2">
                  <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Zero carbon emissions during flight</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Significantly reduced noise pollution</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-4">
                <Battery size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Advanced Technology</h3>
              <p className="text-base text-gray-600">
                Cutting-edge electric propulsion systems and autonomous flight capabilities for safe, efficient urban air mobility.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start gap-2">
                  <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Electric propulsion with redundant systems</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Advanced flight control systems</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-4">
                <Zap size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Urban Mobility</h3>
              <p className="text-base text-gray-600">
                Revolutionizing urban transportation with point-to-point travel above congested streets in major Asian cities.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start gap-2">
                  <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Dedicated vertiports in urban centers</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Seamless integration with ground transportation</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Fleet Section */}
          <div id="fleet" className="mb-16 scroll-mt-32">
            <h2 className="text-3xl font-bold mb-8 text-center">expected eVTOL Fleet</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-100">
                <div className="h-48 overflow-hidden">
                  <img 
                    src="https://sgfnbormqiqgvhdfwmhz.supabase.co/storage/v1/object/sign/evtol/Urban-air-Mobility.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJldnRvbC9VcmJhbi1haXItTW9iaWxpdHkucG5nIiwiaWF0IjoxNzQ2NDY4Mzk0LCJleHAiOjE0NzA2NDY4Mzk0fQ.9QW29ShEWBXFXOliahfYHS_0ppbXM6mIJzY6esE-xmg" 
                    alt="Urban Air Mobility eVTOL" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">Urban Air Mobility eVTOL</h3>
                  <p className="text-base text-gray-600 mb-4">
                    Designed for short-range urban trips with vertical takeoff and landing capabilities.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Capacity</span>
                      <span className="font-medium">2-4 passengers</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Range</span>
                      <span className="font-medium">50-100 km</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Speed</span>
                      <span className="font-medium">150-200 km/h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Charging Time</span>
                      <span className="font-medium">20-30 minutes</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-100">
                <div className="h-48 overflow-hidden">
                  <img 
                    src="https://sgfnbormqiqgvhdfwmhz.supabase.co/storage/v1/object/sign/evtol/HON-AB_urban-air-mobility-uam-concept-image-evtol-parked-city.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJldnRvbC9IT04tQUJfdXJiYW4tYWlyLW1vYmlsaXR5LXVhbS1jb25jZXB0LWltYWdlLWV2dG9sLXBhcmtlZC1jaXR5LmpwZyIsImlhdCI6MTc0NjQ2ODMwNSwiZXhwIjoxNDcwNjQ2ODMwNX0.9ieMptO9MeKIIk1bEKdrYeJ1hJwNo8u2wZcJfE4v5eg" 
                    alt="Regional Air Mobility eVTOL" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">Regional Air Mobility eVTOL</h3>
                  <p className="text-base text-gray-600 mb-4">
                    Extended range for intercity travel with enhanced comfort and amenities.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Capacity</span>
                      <span className="font-medium">4-6 passengers</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Range</span>
                      <span className="font-medium">100-250 km</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Speed</span>
                      <span className="font-medium">200-300 km/h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Charging Time</span>
                      <span className="font-medium">30-45 minutes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Locations Section */}
          <div id="locations" className="mb-16 scroll-mt-32">
            <h2 className="text-3xl font-bold mb-8 text-center">Our Asian Network</h2>
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-6">
                <p className="text-gray-600 mb-6 text-center">
                  We're expanding our eVTOL operations across major Asian cities, with current and planned vertiport locations in:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h3 className="font-bold text-lg mb-2">Thailand</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">Bangkok (Active)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">Phuket (Coming Q3 2025)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">Chiang Mai (Coming Q4 2025)</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h3 className="font-bold text-lg mb-2">Hong Kong</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">Central (Active)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">Kowloon (Coming Q2 2025)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">New Territories (Planned)</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h3 className="font-bold text-lg mb-2">China</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">Shanghai (Coming Q1 2025)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">Shenzhen (Coming Q2 2025)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">Beijing (Planned)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Request Form */}
          <div id="request-form" className="mb-16 scroll-mt-32">
            <div className="bg-gray-50 rounded-3xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-8 lg:p-12">
                  <h2 className="text-3xl font-bold mb-4">Request Information</h2>
                  <p className="text-base text-gray-600 mb-8">
                    Interested in our eVTOL services in Asia? Contact us for more information about our operations, investment opportunities, or partnership inquiries.
                  </p>
                  
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Inquiry Type
                      </label>
                      <select
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      >
                        <option value="">Select an option</option>
                        <option value="service">Service Information</option>
                        <option value="investment">Investment Opportunity</option>
                        <option value="partnership">Partnership Inquiry</option>
                        <option value="media">Media Inquiry</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location of Interest
                      </label>
                      <select
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      >
                        <option value="">Select a location</option>
                        <option value="thailand">Thailand</option>
                        <option value="emirates">Emirates</option>
                        <option value="hongkong">Hong Kong</option>
                        <option value="china">China</option>
                        <option value="all">All Locations</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message
                      </label>
                      <textarea
                        rows={4}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                        placeholder="Please provide details about your inquiry..."
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    >
                      Submit Inquiry
                    </button>
                  </form>
                </div>
                
                <div className="hidden lg:block relative">
                  <img 
                    src="https://sgfnbormqiqgvhdfwmhz.supabase.co/storage/v1/object/sign/evtol/Urban-air-Mobility.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJldnRvbC9VcmJhbi1haXItTW9iaWxpdHkucG5nIiwiaWF0IjoxNzQ2NDY4Mzk0LCJleHAiOjE0NzA2NDY4Mzk0fQ.9QW29ShEWBXFXOliahfYHS_0ppbXM6mIJzY6esE-xmg" 
                    alt="eVTOL Aircraft" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div id="faq" className="mb-16 scroll-mt-32">
            <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <details className="group">
                  <summary className="flex items-center justify-between p-4 cursor-pointer">
                    <h3 className="font-medium">What is an eVTOL aircraft?</h3>
                    <span className="transition-transform group-open:rotate-180">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </summary>
                  <div className="p-4 pt-0 text-base text-gray-600">
                    eVTOL stands for "electric Vertical Take-Off and Landing." These aircraft combine the vertical takeoff and landing capabilities of helicopters with the efficiency and range of fixed-wing aircraft, all powered by electric propulsion systems. They're designed to provide urban air mobility solutions that are quieter, cleaner, and more efficient than traditional helicopters.
                  </div>
                </details>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <details className="group">
                  <summary className="flex items-center justify-between p-4 cursor-pointer">
                    <h3 className="font-medium">When will eVTOL services be available?</h3>
                    <span className="transition-transform group-open:rotate-180">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </summary>
                  <div className="p-4 pt-0 text-base text-gray-600">
                    We currently have active eVTOL operations in Bangkok and Hong Kong, with plans to expand to additional cities throughout 2025. Our expansion timeline is subject to local regulatory approvals and infrastructure development. We're working closely with aviation authorities and local governments to accelerate the deployment of our eVTOL network across Asia.
                  </div>
                </details>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <details className="group">
                  <summary className="flex items-center justify-between p-4 cursor-pointer">
                    <h3 className="font-medium">How safe are eVTOL aircraft?</h3>
                    <span className="transition-transform group-open:rotate-180">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </summary>
                  <div className="p-4 pt-0 text-base text-gray-600">
                    Safety is our top priority. Our eVTOL aircraft are designed with multiple redundant systems, including distributed electric propulsion that allows for safe operation even if some motors fail. They undergo rigorous testing and certification processes with aviation authorities. Additionally, our pilots receive specialized training for eVTOL operations, and we maintain strict maintenance protocols to ensure the highest safety standards.
                  </div>
                </details>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <details className="group">
                  <summary className="flex items-center justify-between p-4 cursor-pointer">
                    <h3 className="font-medium">What are the environmental benefits of eVTOL aircraft?</h3>
                    <span className="transition-transform group-open:rotate-180">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </summary>
                  <div className="p-4 pt-0 text-base text-gray-600">
                    eVTOL aircraft offer significant environmental advantages over traditional aircraft and ground transportation. They produce zero direct emissions during flight, generate significantly less noise than helicopters (up to 70% quieter), and are highly energy-efficient. We power our charging infrastructure with renewable energy sources wherever possible, further reducing the overall carbon footprint of our operations.
                  </div>
                </details>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-black text-white p-12 rounded-2xl text-center">
            <h2 className="text-3xl font-bold mb-4">Join the Future of Urban Air Mobility</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Be among the first to experience the revolutionary eVTOL technology that's transforming urban transportation in Asia.
            </p>
            <a 
              href="#request-form" 
              className="inline-block bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Get More Information
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}