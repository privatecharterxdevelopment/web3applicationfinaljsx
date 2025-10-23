import React, { useState } from 'react'; 
import { Search, X, Plane, ExternalLink, Briefcase, Crown, Car, Globe } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function NFTCollection() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Updated description emphasizing broker and leisure benefits
  const membershipDescription = "Experience the world's first tokenized multi-charter company built on Web3 technology. Perfect for brokers seeking 10% discounted offers and leisure travelers enjoying FREE empty leg flights, Mercedes ground transportation, and blockchain carbon certificates";
  
  // Shared transparent animation for all NFTs with fallback to logo
  const nftVideo = "https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivateCharterX_transparent-_3_.mp4";
  const fallbackImage = "https://sgfnbormqiqgvhdfwmhz.supabase.co/storage/v1/object/public/logos/PrivatecharterX_logo_vectorized.png";
  
  // Static NFT data for PrivateCharterX Membership NFTs - expanded collection
  const nfts = [
    {
      id: '1',
      name: 'PrivateCharterX Membership NFT #001',
      video: nftVideo,
      fallback: fallbackImage,
      price: '0.5 ETH'
    },
    {
      id: '2',
      name: 'PrivateCharterX Membership NFT #002',
      video: nftVideo,
      fallback: fallbackImage,
      price: '0.5 ETH'
    },
    {
      id: '3',
      name: 'PrivateCharterX Membership NFT #003',
      video: nftVideo,
      fallback: fallbackImage,
      price: '0.5 ETH'
    },
    {
      id: '4',
      name: 'PrivateCharterX Membership NFT #004',
      video: nftVideo,
      fallback: fallbackImage,
      price: '0.5 ETH'
    },
    {
      id: '5',
      name: 'PrivateCharterX Membership NFT #005',
      video: nftVideo,
      fallback: fallbackImage,
      price: '0.5 ETH'
    },
    {
      id: '6',
      name: 'PrivateCharterX Membership NFT #006',
      video: nftVideo,
      fallback: fallbackImage,
      price: '0.5 ETH'
    },
    {
      id: '7',
      name: 'PrivateCharterX Membership NFT #007',
      video: nftVideo,
      fallback: fallbackImage,
      price: '0.5 ETH'
    },
    {
      id: '8',
      name: 'PrivateCharterX Membership NFT #008',
      video: nftVideo,
      fallback: fallbackImage,
      price: '0.5 ETH'
    }
  ];

  const filteredNfts = nfts.filter(nft => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      nft.name.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 pt-[120px]">
        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Hero Section - matching carbon certificate style */}
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-4 tracking-tighter">
              Professional flight NFT memberships with blockchain verification and immediate benefits
            </h1>

            <p className="text-gray-500 text-center mb-8 max-w-3xl mx-auto font-light">
              {membershipDescription}. Our revolutionary NFT Memberships create a sustainable, rewarding travel ecosystem.
            </p>

            {/* Action Buttons - moved here after description */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <a
                href="https://opensea.io/0xbf673bf506bc8f10269e4a40c0658c7925be5c5e"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <span>Buy Collection on OpenSea</span>
                <ExternalLink size={18} />
              </a>
              <a
                href="mailto:nft@privatecharterx.com"
                className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
              >
                Email NFT Team
              </a>
            </div>
          </div>

          {/* Search */}
          <div className="mb-12">
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search NFT collection..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Compact NFT Carousel - matching carbon certificate card style */}
          <div className="mb-16">
            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes scroll {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .nft-carousel {
                  animation: scroll 25s linear infinite;
                }
                .nft-carousel:hover {
                  animation-play-state: paused;
                }
                .carousel-wrapper {
                  position: relative;
                  overflow: hidden;
                }
                .carousel-wrapper::before,
                .carousel-wrapper::after {
                  content: '';
                  position: absolute;
                  top: 0;
                  bottom: 0;
                  width: 80px;
                  z-index: 10;
                  pointer-events: none;
                }
                .carousel-wrapper::before {
                  left: 0;
                  background: linear-gradient(to right, rgb(249, 250, 251) 0%, rgba(249, 250, 251, 0.8) 50%, rgba(249, 250, 251, 0) 100%);
                }
                .carousel-wrapper::after {
                  right: 0;
                  background: linear-gradient(to left, rgb(249, 250, 251) 0%, rgba(249, 250, 251, 0.8) 50%, rgba(249, 250, 251, 0) 100%);
                }
                @media (max-width: 640px) {
                  .nft-carousel {
                    animation: scroll 15s linear infinite;
                  }
                  .carousel-wrapper::before,
                  .carousel-wrapper::after {
                    width: 40px;
                  }
                }
              `
            }} />
            
            <div className="carousel-wrapper">
              <div className="flex gap-4 nft-carousel">
                {[...filteredNfts, ...filteredNfts].map((nft, index) => (
                  <a
                    key={`${nft.id}-${index}`} 
                    href="https://opensea.io/0xbf673bf506bc8f10269e4a40c0658c7925be5c5e"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-64 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 group"
                  >
                    <div className="relative h-40 overflow-hidden bg-white">
                      <video 
                        src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivateCharterX_transparent-_3_.mp4"
                        poster={nft.fallback}
                        alt={nft.name} 
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        autoPlay
                        loop
                        muted
                        playsInline
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const img = document.createElement('img');
                          img.src = nft.fallback;
                          img.className = 'w-full h-full object-contain group-hover:scale-105 transition-transform duration-500';
                          img.alt = nft.name;
                          e.currentTarget.parentNode.appendChild(img);
                        }}
                      />
                      <div className="absolute top-3 right-3 bg-black text-white text-xs px-2 py-1 rounded-full font-medium">
                        {nft.price}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium mb-2 text-gray-900">{nft.name}</h3>
                      <div className="flex justify-between items-center">
                        <div className="text-lg font-light text-gray-900">
                          {nft.price}
                        </div>
                        <span className="text-xs bg-gray-900 text-white px-3 py-1 rounded-lg font-medium group-hover:bg-black transition-colors">
                          BUY NOW
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons - removed from here since moved above */}

          {/* Benefits Section - Single light grey card */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-16">
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-light text-black mb-2">Membership Benefits</h2>
              <p className="text-gray-500 font-light">Immediate value for brokers and leisure travelers</p>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Brokers Section */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Briefcase size={20} className="text-gray-700" />
                    </div>
                    <h3 className="text-lg font-medium text-black">For Brokers</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">10% Permanent Discount</h4>
                      <p className="text-sm text-gray-600">Get immediate 10% discount on all private jet bookings - maximize your profit margins.</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Priority Empty Leg Access</h4>
                      <p className="text-sm text-gray-600">First access to available empty leg flights before public listing - secure inventory instantly.</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Exclusive Network</h4>
                      <p className="text-sm text-gray-600">Join our private broker network with special rates and partnership opportunities.</p>
                    </div>
                  </div>
                </div>

                {/* Leisure Section */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Crown size={20} className="text-gray-700" />
                    </div>
                    <h3 className="text-lg font-medium text-black">For Leisure Travelers</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">FREE Empty Leg Flight</h4>
                      <p className="text-sm text-gray-600">Complimentary empty leg flight worth up to $5,000 - perfect for spontaneous luxury travel.</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">FREE Mercedes Transport</h4>
                      <p className="text-sm text-gray-600">Complimentary Mercedes ground transportation to/from airports with every booking.</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Carbon Certificates</h4>
                      <p className="text-sm text-gray-600">Verified carbon offset certificates stored permanently on blockchain for sustainable travel.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works - matching carbon certificate structure */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-16">
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-light text-black mb-2">How It Works</h2>
              <p className="text-gray-500 font-light">Simple 3-step process to get your benefits immediately</p>
            </div>

            <div className="p-8">
              <div className="space-y-6">
                {[
                  { 
                    step: '1', 
                    title: 'Buy Your NFT', 
                    desc: 'Purchase your PrivateCharterX Membership NFT on OpenSea for 0.5 ETH using your connected wallet.' 
                  },
                  { 
                    step: '2', 
                    title: 'Connect Wallet', 
                    desc: 'Connect your wallet containing the NFT to our website to verify ownership and unlock benefits.' 
                  },
                  { 
                    step: '3', 
                    title: 'Get Benefits Immediately', 
                    desc: 'Access all benefits instantly - discounts, free flights, Mercedes transport, and exclusive member privileges.' 
                  }
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-medium text-black mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-500">
                  Buy NFT → Connect wallet to website → Get benefits immediately
                </p>
              </div>
            </div>
          </div>

          {/* Understanding NFTs Section */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-light text-black mb-2">Understanding PrivateCharterX Membership NFTs</h2>
              <p className="text-gray-500 font-light">The world's first tokenized multi-charter company built on Web3 technology</p>
            </div>

            <div className="p-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-black mb-3">What Makes Our NFTs Special?</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    PrivateCharterX Membership NFTs represent the world's first tokenized multi-charter company built on Web3 technology. 
                    Unlike traditional NFTs that offer only digital collectible value, our membership tokens provide real-world utility 
                    with immediate financial benefits and exclusive aviation experiences.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Each NFT at just 0.5 ETH grants you access to a comprehensive ecosystem of private aviation benefits, 
                    sustainable travel solutions, and a thriving community of aviation enthusiasts, brokers, and luxury travelers.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-black mb-3">Revolutionary Web3 Aviation Technology</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Our blockchain-based platform transforms how private aviation operates. Every flight, carbon offset, 
                    and membership benefit is recorded permanently on the blockchain, ensuring transparency and authenticity. 
                    The integration of $Reward tokens creates an innovative economy where your travel activity generates value.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Smart contracts automatically execute benefits - from discounts to free flights - eliminating bureaucracy 
                    and ensuring instant access to your membership privileges.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-black mb-3">Sustainable Aviation Leadership</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Every PrivateCharterX NFT includes blockchain-verified carbon offset certificates, making you part of the 
                    sustainable aviation revolution. Our commitment to environmental responsibility enhances luxury through 
                    innovative green technologies and carbon-neutral flight programs, supporting the future of eco-conscious 
                    private aviation for generations to come.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
