import React, { useState } from 'react';
import { 
  ArrowRight, Check, Shield, Users, Globe, AlertTriangle, ChevronRight, ChevronDown,
  X, Mail, Plane, Clock, CheckCircle, Building2, Coins, Timer, FileText,
  TrendingUp, Navigation, Compass, MapPin, Calendar, Eye, EyeOff, Cloud, Mountain,
  Phone, Search, Star, Zap, AlertCircle, Crown, Award, Briefcase, Sparkles, Headphones,
  Gem, Palette, Camera, Video, Gift, Trophy, Lock, Unlock, Car
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const NFTCollection: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const nftTiers = [
    {
      id: 'flight-nft',
      name: 'Flight NFT Collection',
      price: '0.5 ETH',
      supply: '1000 NFTs',
      popular: true,
      features: [
        'Digital flight certificate ownership',
        '10% discount on all future bookings',
        'FREE empty leg flight (up to $5,000 value)',
        'FREE Mercedes ground transportation',
        'Carbon certificate stored on blockchain',
        'Priority empty leg access for resellers',
        'Exclusive broker network membership',
        'Monthly flight reports & analytics',
        'Transferable ownership rights'
      ],
      highlight: 'Available Now',
      videoUrl: '/api/placeholder/400/300',
      openseaUrl: 'https://opensea.io/collection/privatecharterx-flight-nfts'
    }
  ];

  const brokerBenefits = [
    {
      title: '10% Discounted Offers',
      description: 'Get immediate 10% discount on all private jet bookings - maximize your profit margins and offer competitive rates to clients.',
      icon: <Briefcase size={24} />
    },
    {
      title: 'Priority Empty Leg Access',
      description: 'First access to available empty leg flights before public listing - secure inventory for your clients instantly.',
      icon: <Zap size={24} />
    },
    {
      title: 'Exclusive Broker Network',
      description: 'Join our private network with special rates, inventory sharing, and partnership opportunities with other brokers.',
      icon: <Users size={24} />
    }
  ];

  const leisureBenefits = [
    {
      title: 'FREE Empty Leg Flight',
      description: '🌟 Enjoy one complimentary empty leg flight worth up to $5,000 - perfect for spontaneous luxury travel.',
      icon: <Plane size={24} />,
      highlight: true
    },
    {
      title: 'FREE Mercedes Ground Transportation',
      description: 'Complimentary Mercedes S-Class or E-Class ground transportation to/from airports with every booking.',
      icon: <Car size={24} />
    },
    {
      title: 'Carbon Certificate on Blockchain',
      description: 'Verified carbon offset certificates stored permanently on blockchain, proving your commitment to sustainable travel.',
      icon: <Globe size={24} />
    },
    {
      title: 'Exclusive Member Events',
      description: 'Access to private aviation events, luxury experiences, and networking opportunities with fellow NFT holders.',
      icon: <Crown size={24} />
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header onShowDashboard={() => {}} />

      <main className="flex-1 pt-[88px]">
        {/* Hero Section with Cards - WHITE BACKGROUND */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-blue-100 border border-green-200 px-4 py-2 rounded-full text-sm font-light mb-8">
                <Gem size={16} className="text-green-600" />
                Available Now on OpenSea
              </div>
              
              <h1 className="text-4xl md:text-6xl font-extralight mb-6 tracking-tight text-black">
                Flight NFT Collection
              </h1>
              <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
                Own exclusive flight NFTs with immediate benefits. Brokers get instant 10% discounts, leisure travelers enjoy FREE empty leg flights, Mercedes ground transportation, and much more!
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <style dangerouslySetInnerHTML={{
                __html: `
                  @keyframes glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(0, 0, 0, 0.1), 0 0 40px rgba(0, 0, 0, 0.05); }
                    50% { box-shadow: 0 0 30px rgba(0, 0, 0, 0.15), 0 0 50px rgba(0, 0, 0, 0.1); }
                  }
                  .glow-effect {
                    animation: glow 2s ease-in-out infinite;
                  }
                  @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                  }
                  .float-animation {
                    animation: float 3s ease-in-out infinite;
                  }
                  .video-container {
                    position: relative;
                    width: 100%;
                    height: 200px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    overflow: hidden;
                    margin-bottom: 20px;
                  }
                  .video-overlay {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: white;
                    text-align: center;
                  }
                  .pulse-animation {
                    animation: pulse 2s infinite;
                  }
                  @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.7; }
                    100% { opacity: 1; }
                  }
                `
              }} />
              
              {/* Single NFT Collection Card */}
              <div className="max-w-2xl mx-auto mb-12">
                <div 
                  className="relative bg-white border-2 border-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] glow-effect shadow-lg"
                >
                  <div className="absolute top-0 left-0 right-0 bg-green-600 text-white text-center py-2 text-xs font-medium uppercase tracking-wider">
                    {nftTiers[0].highlight}
                  </div>
                  
                  <div className="p-8 pt-12">
                    <div className="text-center mb-6">
                      {/* Video/Image Animation Container */}
                      <div className="video-container mb-6" style={{
                        height: '200px', 
                        maxWidth: '400px', 
                        margin: '0 auto',
                        backgroundImage: 'url(https://sgfnbormqiqgvhdfwmhz.supabase.co/storage/v1/object/public/logos/PrivatecharterX_logo_vectorized.png)',
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center'
                      }}>
                        <div className="video-overlay" style={{backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '20px'}}>
                          <Video size={32} className="mx-auto mb-2 pulse-animation" />
                          <div className="text-sm font-medium">NFT Preview</div>
                          <div className="text-xs opacity-80">Animated Flight Journey</div>
                        </div>
                      </div>
                      
                      <h3 className="text-3xl font-medium text-black mb-3">{nftTiers[0].name}</h3>
                      <div className="text-4xl font-light text-black mb-2">{nftTiers[0].price}</div>
                      <div className="text-lg text-gray-600 mb-6">{nftTiers[0].supply}</div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {nftTiers[0].features.map((feature, idx) => (
                        <div key={idx} className={`flex items-start gap-3 ${feature.includes('FREE empty leg') ? 'bg-yellow-50 border border-yellow-200 rounded-lg p-3 -m-1' : ''}`}>
                          <Check size={14} className={`${feature.includes('FREE empty leg') ? 'text-orange-600' : 'text-green-600'} flex-shrink-0 mt-0.5`} />
                          <span className={`text-sm font-light ${feature.includes('FREE empty leg') ? 'text-orange-800 font-medium' : 'text-gray-700'}`}>
                            {feature.includes('FREE empty leg') && <span className="inline-block mr-1">🌟</span>}
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <a
                        href={nftTiers[0].openseaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        Buy on OpenSea
                        <ArrowRight size={18} />
                      </a>
                      <button
                        onClick={() => setShowModal(true)}
                        className="border border-gray-300 text-gray-700 px-8 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                      >
                        Connect Wallet
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-600 text-sm font-light mb-6">
                  Buy your NFT → Connect wallet to website → Get benefits immediately
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Target Audiences */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-light text-black mb-4">Perfect For Brokers & Leisure Travelers</h2>
              <p className="text-gray-600 font-light max-w-3xl mx-auto">
                Whether you're a broker looking for discounted offers or a leisure traveler seeking luxury benefits - this NFT delivers immediate value
              </p>
            </div>

            {/* Brokers Section */}
            <div className="mb-16">
              <h3 className="text-2xl font-light text-black mb-8 text-center">🏢 Brokers: Get Your Discounted Offers Now</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {brokerBenefits.map((benefit, index) => (
                  <div 
                    key={index} 
                    className="bg-white rounded-2xl p-6 hover:shadow-sm transition-all duration-300 border border-gray-100 float-animation"
                    style={{animationDelay: `${index * 0.2}s`}}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-blue-600">{benefit.icon}</div>
                      <h4 className="text-lg font-medium text-black">{benefit.title}</h4>
                    </div>
                    <p className="text-gray-600 font-light text-sm leading-relaxed">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Leisure Section */}
            <div>
              <h3 className="text-2xl font-light text-black mb-8 text-center">✈️ Leisure: Enjoy Multiple Premium Benefits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {leisureBenefits.map((benefit, index) => (
                  <div 
                    key={index} 
                    className={`${benefit.highlight ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 shadow-lg' : 'bg-white border border-gray-100'} rounded-2xl p-6 hover:shadow-sm transition-all duration-300 float-animation`}
                    style={{animationDelay: `${index * 0.2}s`}}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`${benefit.highlight ? 'text-orange-600' : 'text-green-600'}`}>{benefit.icon}</div>
                      <h4 className={`text-lg font-medium ${benefit.highlight ? 'text-orange-800' : 'text-black'}`}>
                        {benefit.highlight && <span className="inline-block mr-2">⭐</span>}
                        {benefit.title}
                      </h4>
                    </div>
                    <p className={`font-light text-sm leading-relaxed ${benefit.highlight ? 'text-orange-700' : 'text-gray-600'}`}>
                      {benefit.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-light text-black mb-4">How It Works</h2>
              <p className="text-gray-600 font-light max-w-2xl mx-auto">
                Simple 3-step process to get your benefits immediately
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[
                { title: '1. Grab Your NFT', desc: 'Purchase your Flight NFT on OpenSea for 0.5 ETH using your connected wallet' },
                { title: '2. Connect Wallet to Website', desc: 'Connect your wallet containing the NFT to our website to verify ownership' },
                { title: '3. Get Benefits Immediately', desc: 'Access all benefits instantly - discounts, free flights, Mercedes transport, and more!' }
              ].map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-black text-white rounded-xl flex items-center justify-center text-2xl font-medium mb-6 mx-auto">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-medium text-black mb-3">{step.title}</h3>
                  <p className="text-gray-600 font-light text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://opensea.io/collection/privatecharterx-flight-nfts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black text-white px-10 py-4 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-lg"
                >
                  Buy NFT on OpenSea
                  <ArrowRight size={20} />
                </a>
                <a 
                  href="mailto:nft@privatecharterx.com"
                  className="border border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Mail size={18} />
                  Questions? Email Us
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Wallet Connect Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-light text-black">Connect Your Wallet</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-50 rounded-full transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 text-center">
              <div className="mb-6">
                <Gem size={48} className="text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600 font-light leading-relaxed">
                  Connect your wallet containing the Flight NFT to access all your exclusive benefits immediately.
                </p>
              </div>

              <div className="space-y-3">
                <button className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium">
                  Connect MetaMask
                </button>
                <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                  WalletConnect
                </button>
                <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                  Coinbase Wallet
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Your wallet must contain a Flight NFT to access member benefits
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTCollection;
