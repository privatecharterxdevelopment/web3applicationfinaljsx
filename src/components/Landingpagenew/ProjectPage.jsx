import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { Search, ShoppingBag, Settings, User, Shield } from 'lucide-react';

// Asset data structure
const assetsData = {
  'gulfstream-g650': {
    id: 'gulfstream-g650',
    name: 'Gulfstream G650 Elite',
    category: 'Aircraft',
    location: 'Miami, FL',
    images: [
      'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800',
      'https://images.unsplash.com/photo-1520637836862-4d197d17c50a?w=800',
      'https://images.unsplash.com/photo-1436262513933-a0b06755c784?w=800'
    ],
    totalTokenPrice: '12,500,000 USDT',
    tokenPrice: '1,250 USDT',
    totalTokens: 10000,
    availableTokens: 7500,
    grossYield: '8.5%',
    payPeriod: '2025-2030',
    description: 'The Gulfstream G650 Elite represents the pinnacle of private aviation luxury. This ultra-long-range business jet offers unparalleled comfort, speed, and efficiency for global travel.',
    advantages: [
      'Ultra-long range capability (7,000+ nautical miles)',
      'Maximum cruise speed of Mach 0.925',
      'Spacious cabin with premium amenities',
      'Advanced avionics and safety systems',
      'High resale value and market demand',
      'Professional charter management included'
    ],
    specifications: {
      'Range': '7,000 nautical miles',
      'Max Speed': 'Mach 0.925',
      'Cabin Length': '46.8 feet',
      'Cabin Width': '8.2 feet',
      'Passengers': '14-19',
      'Crew': '4',
      'Year': '2022',
      'Registration': 'N650PCX'
    },
    financials: {
      'Asset Value': '$75,000,000',
      'Annual Revenue': '$6,375,000',
      'Operating Costs': '$1,875,000',
      'Net Annual Yield': '$4,500,000',
      'Token Yield per Year': '$450',
      'Management Fee': '5%'
    },
    companyInfo: {
      name: 'Elite Aviation Holdings LLC',
      founded: '2018',
      headquarters: 'Miami, Florida',
      fleet: '12 Aircraft',
      certification: 'Part 135 Charter Operator',
      insurance: 'Fully insured up to $100M liability'
    },
    contractAddress: '0x1234567890123456789012345678901234567890',
    blockchain: 'Base Network'
  },
  'luxury-resort-aspen': {
    id: 'luxury-resort-aspen',
    name: 'Luxury Resort Aspen',
    category: 'Resort',
    location: 'Aspen, CO',
    images: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'
    ],
    totalTokenPrice: '5,200,000 USDT',
    tokenPrice: '520 USDT',
    totalTokens: 10000,
    availableTokens: 6200,
    vacationDays: '45 per year',
    vacationPeriod: '5 years',
    description: 'A premier luxury resort in the heart of Aspen, offering world-class amenities and exclusive access to one of the world\'s most sought-after ski destinations.',
    advantages: [
      'Prime Aspen location with ski-in/ski-out access',
      '45 guaranteed vacation days per year',
      'Luxury spa and wellness facilities',
      'Michelin-starred dining options',
      'Concierge and butler services',
      'Year-round activities and amenities'
    ],
    specifications: {
      'Resort Size': '25 acres',
      'Rooms': '150 luxury suites',
      'Restaurants': '3 fine dining',
      'Spa': '15,000 sq ft',
      'Pool': 'Heated outdoor infinity',
      'Ski Access': 'Direct slope access',
      'Built': '2019',
      'Renovated': '2023'
    },
    financials: {
      'Asset Value': '$26,000,000',
      'Annual Revenue': '$8,500,000',
      'Operating Costs': '$6,200,000',
      'Net Annual Yield': '$2,300,000',
      'Token Value per Year': '$230',
      'Management Fee': '8%'
    },
    companyInfo: {
      name: 'Alpine Luxury Resorts Inc.',
      founded: '2015',
      headquarters: 'Aspen, Colorado',
      properties: '8 Luxury Resorts',
      certification: 'Forbes 5-Star Rating',
      awards: 'World\'s Best Ski Resort 2023'
    },
    contractAddress: '0x2345678901234567890123456789012345678901',
    blockchain: 'Base Network'
  },
  'superyacht-azure': {
    id: 'superyacht-azure',
    name: 'Superyacht Azure',
    category: 'Yacht',
    location: 'Monaco',
    images: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
      'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
    ],
    totalTokenPrice: '8,750,000 USDT',
    tokenPrice: '875 USDT',
    totalTokens: 10000,
    availableTokens: 4300,
    grossYield: '12.3%',
    payPeriod: '2024-2029',
    description: 'A magnificent 180-foot superyacht offering the ultimate in luxury cruising. Azure features state-of-the-art amenities and provides exclusive access to the Mediterranean\'s most prestigious ports.',
    advantages: [
      '180-foot luxury superyacht',
      'Premium Mediterranean charter routes',
      'Professional crew of 12',
      'Helicopter landing pad',
      'Spa and wellness center onboard',
      'High-yield charter business'
    ],
    specifications: {
      'Length': '180 feet (55m)',
      'Beam': '32 feet (9.8m)',
      'Guests': '12 in 6 staterooms',
      'Crew': '12',
      'Speed': '15 knots cruise',
      'Range': '4,000 nautical miles',
      'Built': '2021',
      'Shipyard': 'Italian Excellence'
    },
    financials: {
      'Asset Value': '$45,000,000',
      'Annual Revenue': '$5,850,000',
      'Operating Costs': '$2,700,000',
      'Net Annual Yield': '$3,150,000',
      'Token Yield per Year': '$315',
      'Management Fee': '12%'
    },
    companyInfo: {
      name: 'Mediterranean Yacht Charters SA',
      founded: '2012',
      headquarters: 'Monaco',
      fleet: '25 Luxury Yachts',
      certification: 'MCA Compliant',
      awards: 'Best Charter Operator 2023'
    },
    contractAddress: '0x3456789012345678901234567890123456789012',
    blockchain: 'Base Network'
  },
  'manhattan-penthouse': {
    id: 'manhattan-penthouse',
    name: 'Manhattan Penthouse',
    category: 'Real Estate',
    location: 'New York, NY',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
    ],
    totalTokenPrice: '15,200,000 USDT',
    tokenPrice: '1,520 USDT',
    totalTokens: 10000,
    availableTokens: 5800,
    grossYield: '6.8%',
    payPeriod: '2025-2032',
    description: 'An exquisite Manhattan penthouse offering breathtaking views of Central Park and the NYC skyline. This premium real estate investment provides both luxury living and strong rental yields.',
    advantages: [
      'Prime Manhattan location',
      'Central Park views',
      'High-end luxury finishes',
      'Doorman and concierge services',
      'Strong rental market demand',
      'Appreciation potential'
    ],
    specifications: {
      'Size': '3,500 sq ft',
      'Bedrooms': '4',
      'Bathrooms': '3.5',
      'Terrace': '1,200 sq ft',
      'Floor': '42nd (Top)',
      'Building': 'The Manhattan Elite',
      'Built': '2020',
      'Amenities': 'Gym, Pool, Spa'
    },
    financials: {
      'Asset Value': '$76,000,000',
      'Annual Rental Income': '$6,080,000',
      'Operating Costs': '$3,420,000',
      'Net Annual Yield': '$2,660,000',
      'Token Yield per Year': '$266',
      'Management Fee': '6%'
    },
    companyInfo: {
      name: 'Prime Manhattan Properties LLC',
      founded: '2010',
      headquarters: 'New York, NY',
      portfolio: '$2.5B in assets',
      certification: 'Licensed Real Estate',
      rating: 'A+ Better Business Bureau'
    },
    contractAddress: '0x4567890123456789012345678901234567890123',
    blockchain: 'Base Network'
  },
  'ferrari-collection': {
    id: 'ferrari-collection',
    name: 'Ferrari Collection',
    category: 'Luxury Cars',
    location: 'Geneva, CH',
    images: [
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800',
      'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800'
    ],
    totalTokenPrice: '3,850,000 USDT',
    tokenPrice: '385 USDT',
    totalTokens: 10000,
    availableTokens: 7200,
    grossYield: '9.2%',
    payPeriod: '2024-2027',
    description: 'An exclusive collection of rare Ferrari supercars including limited edition models. This collection combines passion for automotive excellence with strong investment returns.',
    advantages: [
      'Rare and limited edition Ferraris',
      'Professional storage and maintenance',
      'Appreciation in collector value',
      'Rental income from exhibitions',
      'Insurance coverage included',
      'Expert curation and management'
    ],
    specifications: {
      'Collection Size': '15 vehicles',
      'Featured Models': 'LaFerrari, F40, Enzo',
      'Storage': 'Climate controlled',
      'Insurance': 'Full coverage',
      'Maintenance': 'Factory authorized',
      'Documentation': 'Complete provenance',
      'Condition': 'Museum quality',
      'Location': 'Geneva, Switzerland'
    },
    financials: {
      'Asset Value': '$19,250,000',
      'Annual Revenue': '$2,310,000',
      'Operating Costs': '$1,155,000',
      'Net Annual Yield': '$1,155,000',
      'Token Yield per Year': '$115.50',
      'Management Fee': '10%'
    },
    companyInfo: {
      name: 'Swiss Luxury Automotive SA',
      founded: '2016',
      headquarters: 'Geneva, Switzerland',
      collections: '5 Curated Collections',
      certification: 'Ferrari Certified',
      expertise: '50+ years combined'
    },
    contractAddress: '0x5678901234567890123456789012345678901234',
    blockchain: 'Base Network'
  },
  'private-island-resort': {
    id: 'private-island-resort',
    name: 'Private Island Resort',
    category: 'Resort',
    location: 'Maldives',
    images: [
      'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800',
      'https://images.unsplash.com/photo-1582882112116-67396eb2a6b2?w=800',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
    ],
    totalTokenPrice: '25,600,000 USDT',
    tokenPrice: '2,560 USDT',
    totalTokens: 10000,
    availableTokens: 3400,
    grossYield: '11.7%',
    payPeriod: '2025-2035',
    description: 'An exclusive private island resort in the Maldives offering unparalleled luxury and privacy. This tropical paradise provides the ultimate escape with world-class amenities.',
    advantages: [
      'Private island exclusivity',
      'Pristine tropical location',
      'Overwater villa accommodations',
      'World-class dive sites nearby',
      'Helicopter and seaplane access',
      'Ultra-high-end clientele'
    ],
    specifications: {
      'Island Size': '12 acres',
      'Villas': '20 overwater suites',
      'Beach': 'Private white sand',
      'Activities': 'Diving, spa, yacht',
      'Staff': '60 professionals',
      'Access': 'Seaplane/helicopter',
      'Opened': '2021',
      'Renovation': 'Annual updates'
    },
    financials: {
      'Asset Value': '$128,000,000',
      'Annual Revenue': '$18,500,000',
      'Operating Costs': '$11,200,000',
      'Net Annual Yield': '$7,300,000',
      'Token Yield per Year': '$730',
      'Management Fee': '15%'
    },
    companyInfo: {
      name: 'Tropical Paradise Resorts Ltd.',
      founded: '2008',
      headquarters: 'Maldives',
      properties: '3 Private Islands',
      certification: 'Leading Hotels of the World',
      awards: 'World\'s Best Private Island 2023'
    },
    contractAddress: '0x6789012345678901234567890123456789012345',
    blockchain: 'Base Network'
  }
};

const ProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const [asset, setAsset] = useState(null);
  const [activeTab, setActiveTab] = useState('properties');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [tokenAmount, setTokenAmount] = useState(1);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    const assetData = assetsData[projectId];
    if (assetData) {
      setAsset(assetData);
    } else {
      navigate('/tokenized-assets');
    }
  }, [projectId, navigate]);

  if (!asset) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading asset details...</p>
        </div>
      </div>
    );
  }

  const totalValue = (tokenAmount * parseFloat(asset.tokenPrice.replace(/[^0-9.]/g, ''))).toLocaleString();

  const handlePurchase = () => {
    if (!isConnected) {
      open();
      return;
    }
    setShowPurchaseModal(true);
  };

  const confirmPurchase = async () => {
    try {
      console.log(`Purchasing ${tokenAmount} tokens of ${asset.name}`);
      console.log(`Total cost: ${totalValue} USDT`);
      console.log(`Contract: ${asset.contractAddress}`);

      alert(`Success! You have purchased ${tokenAmount} tokens of ${asset.name} for ${totalValue} USDT. Transaction would be processed on ${asset.blockchain}.`);
      setShowPurchaseModal(false);
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['DM_Sans']">
      {/* Header - Same style as SaasDashboard */}
      <header className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-5 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_Logo_written-removebg-preview.png"
                alt="PrivateCharterX"
                className="h-8 w-auto"
              />
            </div>

            <div className="flex items-center space-x-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search assets"
                  className="w-64 pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 outline-none text-sm font-light placeholder-gray-400 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200 shadow-sm"
                />
              </div>

              {/* Verified Badge */}
              <button
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200"
                title="Verified"
              >
                <Shield size={16} />
              </button>

              {/* Basket Button */}
              <button
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200 relative"
                title="Basket"
              >
                <ShoppingBag size={16} />
              </button>

              {/* Wallet Connect */}
              <button
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200"
                title="Connect Wallet"
              >
                💰
              </button>

              {/* Settings Button */}
              <button
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200"
                title="Settings"
              >
                <Settings size={16} />
              </button>

              {/* Profile Button */}
              <button
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200"
                title="Profile"
              >
                <User size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation - Same as tokenized-assets */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex space-x-8">
            <button
              onClick={() => navigate('/tokenized-assets')}
              className="py-4 text-sm text-gray-600 border-b-2 border-transparent hover:text-black"
            >
              ← Back to Assets
            </button>
            <button className="py-4 text-sm text-black border-b-2 border-black">◈ Asset Details</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-5 py-6">
        {/* Asset Header Card - Same style as tokenized-assets cards */}
        <div className="bg-white rounded-lg border border-gray-300 mb-6">
          <div className="flex h-80">
            {/* Left side - Image */}
            <div className="w-2/5 bg-gray-100 relative">
              <img
                src={asset.images[selectedImageIndex]}
                alt={asset.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex space-x-1.5">
                <div className="bg-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  <span>{asset.location}</span>
                </div>
                <div className="bg-white px-2 py-1 rounded text-xs font-medium">⌂ {asset.category}</div>
              </div>

              {/* Image thumbnails */}
              <div className="absolute bottom-3 left-3 flex space-x-1.5">
                {asset.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-12 h-8 rounded overflow-hidden border ${
                      selectedImageIndex === index ? 'border-white border-2' : 'border-gray-300'
                    }`}
                  >
                    <img src={image} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right side - Asset info */}
            <div className="flex-1 p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">PCX</span>
                <div className="flex space-x-2">
                  <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">⎘</button>
                  <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">◉</button>
                </div>
              </div>

              <h1 className="text-2xl font-semibold mb-4">{asset.name}</h1>

              {/* Tab Navigation - Same style */}
              <div className="flex space-x-6 border-b border-gray-300 mb-5">
                <button
                  onClick={() => setActiveTab('properties')}
                  className={`pb-3 text-xs relative ${activeTab === 'properties' ? 'text-black' : 'text-gray-600'}`}
                >
                  Properties
                  {activeTab === 'properties' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('description')}
                  className={`pb-3 text-xs relative ${activeTab === 'description' ? 'text-black' : 'text-gray-600'}`}
                >
                  Description
                  {activeTab === 'description' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('financials')}
                  className={`pb-3 text-xs relative ${activeTab === 'financials' ? 'text-black' : 'text-gray-600'}`}
                >
                  Financials
                  {activeTab === 'financials' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('company')}
                  className={`pb-3 text-xs relative ${activeTab === 'company' ? 'text-black' : 'text-gray-600'}`}
                >
                  Company
                  {activeTab === 'company' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
              </div>

              {/* Key metrics - Same layout as cards */}
              <div className="flex justify-between mt-auto mb-5">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Total token price</span>
                  <span className="text-sm font-semibold text-black">{asset.totalTokenPrice}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">{asset.grossYield ? 'Gross yield avg.' : 'Available tokens'}</span>
                  <span className="text-sm font-semibold text-black">{asset.grossYield || asset.availableTokens.toLocaleString()}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">{asset.payPeriod ? 'Pay period' : 'Benefits'}</span>
                  <span className="text-sm font-semibold text-black">{asset.payPeriod || asset.vacationDays}</span>
                </div>
              </div>

              {/* Links - Same style */}
              <div className="flex space-x-4 pt-4 border-t border-gray-100 text-xs">
                <a href="#" className="text-gray-600 hover:text-black">View on polygonscan ↗</a>
                <a href="#" className="text-gray-600 hover:text-black">Legal statement ⚖</a>
              </div>
            </div>
          </div>
        </div>

        {/* Content and Purchase Section */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Content */}
          <div className="col-span-2">
            <div className="bg-white rounded-lg border border-gray-300 p-6">
              {activeTab === 'properties' && (
                <div>
                  <h3 className="text-base font-semibold mb-4">Asset Specifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(asset.specifications).map(([key, value]) => (
                      <div key={key} className="border-b border-gray-100 pb-2">
                        <div className="text-xs text-gray-500 font-medium">{key}</div>
                        <div className="text-sm font-semibold text-black">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'description' && (
                <div>
                  <h3 className="text-base font-semibold mb-4">Asset Description</h3>
                  <p className="text-sm text-gray-700 mb-6 leading-relaxed">{asset.description}</p>
                  <h4 className="text-sm font-semibold mb-3">Key Advantages</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {asset.advantages.map((advantage, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-green-500 text-xs mt-0.5">✓</span>
                        <span className="text-xs text-gray-700">{advantage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'financials' && (
                <div>
                  <h3 className="text-base font-semibold mb-4">Financial Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(asset.financials).map(([key, value]) => (
                      <div key={key} className="border-b border-gray-100 pb-2">
                        <div className="text-xs text-gray-500 font-medium">{key}</div>
                        <div className="text-sm font-semibold text-black">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'company' && (
                <div>
                  <h3 className="text-base font-semibold mb-4">Company Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(asset.companyInfo).map(([key, value]) => (
                      <div key={key} className="border-b border-gray-100 pb-2">
                        <div className="text-xs text-gray-500 font-medium capitalize">{key}</div>
                        <div className="text-sm font-semibold text-black">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Purchase Widget */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg border border-gray-300 p-5 sticky top-6">
              <h3 className="text-base font-semibold mb-4">Purchase Tokens</h3>

              {/* Token Information */}
              <div className="space-y-3 mb-5">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Token Price</span>
                  <span className="text-xs font-semibold text-black">{asset.tokenPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Available</span>
                  <span className="text-xs font-semibold text-green-600">{asset.availableTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Total Supply</span>
                  <span className="text-xs font-semibold text-black">{asset.totalTokens.toLocaleString()}</span>
                </div>
              </div>

              {/* Purchase Section */}
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-xs font-medium text-black mb-2">
                  Number of Tokens
                </label>
                <input
                  type="number"
                  min="1"
                  max={asset.availableTokens}
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:border-black"
                />

                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Total Cost:</span>
                    <span className="font-semibold text-black">{totalValue} USDT</span>
                  </div>
                </div>

                <button
                  onClick={handlePurchase}
                  className="w-full mt-4 bg-black text-white py-2.5 px-4 rounded text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  {isConnected ? 'Purchase Tokens' : 'Connect Wallet'}
                </button>

                {isConnected && (
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </div>
                )}
              </div>

              {/* Blockchain Info */}
              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex justify-between mb-1">
                  <span>Blockchain:</span>
                  <span className="text-black">{asset.blockchain}</span>
                </div>
                <div className="flex justify-between">
                  <span>Contract:</span>
                  <span className="text-black">{asset.contractAddress.slice(0, 8)}...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full border border-gray-300">
            <h3 className="text-base font-semibold mb-4">Confirm Token Purchase</h3>
            <div className="space-y-3 mb-5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Asset:</span>
                <span className="font-semibold">{asset.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tokens:</span>
                <span className="font-semibold">{tokenAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Cost:</span>
                <span className="font-semibold">{totalValue} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Network:</span>
                <span className="font-semibold">{asset.blockchain}</span>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchase}
                className="flex-1 px-4 py-2.5 bg-black text-white rounded text-sm hover:bg-gray-800"
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Divider Line */}
      <div className="border-t border-gray-200"></div>

      {/* Footer */}
      <footer className="bg-gray-50 px-4 sm:px-8 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Footer Content */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {/* Logo and Description */}
            <div className="col-span-2 sm:col-span-1 lg:col-span-1">
              <button onClick={() => navigate('/')} className="mb-4">
                <img
                  src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_Logo_written-removebg-preview.png"
                  alt="PrivateCharterX"
                  className="h-12 w-auto hover:opacity-80 transition-opacity"
                />
              </button>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Blockchain-powered private aviation platform revolutionizing luxury travel.
              </p>
            </div>

            {/* Aviation Services */}
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-3 sm:mb-4">Aviation Services</h4>
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={() => navigate('/services')}
                  className="block text-xs sm:text-sm text-gray-500 hover:text-gray-900 transition-colors text-left"
                >
                  Private Jet Charter
                </button>
                <button
                  onClick={() => navigate('/services')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Group Charter
                </button>
                <button
                  onClick={() => navigate('/aviation')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Helicopter Charter
                </button>
                <button
                  onClick={() => navigate('/aviation')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  eVTOL Flights
                </button>
                <button
                  onClick={() => navigate('/services')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Adventure Packages
                </button>
                <button
                  onClick={() => navigate('/services')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Empty Legs
                </button>
              </div>
            </div>

            {/* Web3 & Digital */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Web3 & Digital</h4>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/tokenized')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Web3
                </button>
                <button
                  onClick={() => navigate('/tokenized')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  PVCX Token
                </button>
                <button
                  onClick={() => navigate('/tokenized')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  NFT Aviation
                </button>
                <button
                  onClick={() => navigate('/tokenized')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Asset Licensing
                </button>
                <button
                  onClick={() => navigate('/tokenized')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  JetCard Packages
                </button>
                <button
                  onClick={() => navigate('/tokenized')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  CO2 Certificates
                </button>
                <button
                  onClick={() => navigate('/tokenized-assets')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Tokenized Assets
                </button>
              </div>
            </div>

            {/* Partners & Press */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Partners & Press</h4>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/services')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Partner With Us
                </button>
                <button
                  onClick={() => navigate('/services')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Blog Posts
                </button>
                <button
                  onClick={() => navigate('/services')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Press Center
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Quick Links</h4>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Home
                </button>
                <button
                  onClick={() => navigate('/services')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  How It Works
                </button>
                <button
                  onClick={() => navigate('/services')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Helpdesk
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProjectPage;