// CO2CertificateDetail.jsx - CO2 Project Detail Page (matching EmptyLegDetail structure)
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Shield, Leaf, Globe, Award, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from 'wagmi';
import UserMenu from '../UserMenu';
import WalletMenu from '../WalletMenu';

// Real CO2 Projects from Marketplace
const realProjects = {
  '10250': {
    id: '10250',
    projectId: '10250',
    name: 'Solar Power Project',
    description: 'This Clean Development Mechanism (CDM) project involves a 5MW grid-connected solar photovoltaic power plant in Anantapur district, Andhra Pradesh, India. The project contributes to clean energy generation and helps reduce greenhouse gas emissions.',
    location: 'Anantapur, Andhra Pradesh',
    country: 'India',
    ngoName: 'Narasimha Swamy Solar Generations Pvt. Ltd.',
    verified: true,
    certificationStandard: 'CDM',
    pricePerTon: 5.00,
    minPurchase: 1,
    maxPurchase: 1000,
    availableTons: 35243,
    image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/co2%20projects/PEXELS_PHOTO_159397.jpeg',
    benefits: ['Clean Energy Generation', 'Employment Creation', 'Rural Electrification', 'Technology Transfer'],
    methodology: 'Solar Photovoltaic Power Generation',
    category: 'Renewable Energy',
    additionalInfo: {
      biodiversityImpact: 'Minimal land use with native vegetation preserved around solar panels',
      communityBenefit: 'Local employment opportunities and skill development programs',
      technologyUsed: '5MW crystalline silicon solar PV modules with grid-tied inverters'
    }
  },
  '6573': {
    id: '6573',
    projectId: '6573',
    name: 'Waste Management Program',
    description: 'Large-scale waste management and methane capture project in São Paulo, Brazil. Converts landfill gas into clean energy while reducing harmful emissions.',
    location: 'São Paulo',
    country: 'Brazil',
    ngoName: 'EcoSistemas Brasil',
    verified: true,
    certificationStandard: 'CDM',
    pricePerTon: 8.50,
    minPurchase: 1,
    maxPurchase: 500,
    availableTons: 12500,
    image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/co2%20projects/image%20(58).jpeg',
    benefits: ['Methane Capture', 'Clean Energy Production', 'Waste Reduction', 'Air Quality Improvement'],
    methodology: 'Landfill Gas Capture and Utilization',
    category: 'Carbon Offset',
    additionalInfo: {
      biodiversityImpact: 'Reduced pollution in surrounding ecosystems and waterways',
      communityBenefit: 'Improved sanitation and reduced health risks for local communities',
      technologyUsed: 'Advanced methane capture systems with energy generation capacity'
    }
  },
  '9165': {
    id: '9165',
    projectId: '9165',
    name: 'Wind Parks Initiative',
    description: 'Offshore wind energy project in the North Sea, contributing to Europe\'s renewable energy transition and climate goals.',
    location: 'North Sea',
    country: 'Germany',
    ngoName: 'WindKraft Europa GmbH',
    verified: true,
    certificationStandard: 'CDM',
    pricePerTon: 12.00,
    minPurchase: 5,
    maxPurchase: 2000,
    availableTons: 45000,
    image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/co2%20projects/image%20(57).jpeg',
    benefits: ['Renewable Energy', 'Grid Stability', 'Job Creation', 'Marine Protection Zones'],
    methodology: 'Offshore Wind Energy Generation',
    category: 'Renewable Energy',
    additionalInfo: {
      biodiversityImpact: 'Marine protected zones established, creating artificial reef habitats',
      communityBenefit: 'Clean energy for 150,000 households and coastal job creation',
      technologyUsed: '8MW offshore wind turbines with advanced monitoring systems'
    }
  },
  '10080': {
    id: '10080',
    projectId: '10080',
    name: 'Hydro Power Station',
    description: 'Run-of-river hydroelectric project in the Himalayas, providing clean energy while preserving river ecosystems.',
    location: 'Himachal Pradesh',
    country: 'India',
    ngoName: 'Himalayan Green Energy Ltd.',
    verified: true,
    certificationStandard: 'CDM',
    pricePerTon: 6.50,
    minPurchase: 1,
    maxPurchase: 1500,
    availableTons: 28000,
    image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/co2%20projects/image%20(56).jpeg',
    benefits: ['Clean Energy', 'Water Conservation', 'Local Development', 'Ecosystem Preservation'],
    methodology: 'Run-of-River Hydroelectric Power',
    category: 'Renewable Energy',
    additionalInfo: {
      biodiversityImpact: 'Fish passages maintained, minimal impact on river flow and wildlife',
      communityBenefit: 'Local infrastructure development and educational programs',
      technologyUsed: 'Low-impact turbines with environmental flow maintenance systems'
    }
  },
  '9078': {
    id: '9078',
    projectId: '9078',
    name: 'Biomass Energy Plant',
    description: 'Agricultural waste to energy conversion facility, reducing emissions while supporting local farmers.',
    location: 'Punjab',
    country: 'India',
    ngoName: 'BioEnergy India Pvt. Ltd.',
    verified: true,
    certificationStandard: 'CDM',
    pricePerTon: 7.00,
    minPurchase: 1,
    maxPurchase: 800,
    availableTons: 18500,
    image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/co2%20projects/image%20(59).jpeg',
    benefits: ['Waste Reduction', 'Rural Income', 'Clean Energy', 'Air Quality'],
    methodology: 'Biomass Power Generation',
    category: 'Carbon Offset',
    additionalInfo: {
      biodiversityImpact: 'Reduced open burning of crop residue, improving air quality',
      communityBenefit: 'Additional income for farmers through waste purchase programs',
      technologyUsed: 'Advanced biomass gasification with emission control systems'
    }
  },
  '7980': {
    id: '7980',
    projectId: '7980',
    name: 'Reforestation Program',
    description: 'Large-scale tropical reforestation and conservation project, restoring degraded lands and protecting biodiversity.',
    location: 'Amazon Basin',
    country: 'Brazil',
    ngoName: 'Amazon Conservation Alliance',
    verified: true,
    certificationStandard: 'CDM',
    pricePerTon: 15.00,
    minPurchase: 1,
    maxPurchase: 5000,
    availableTons: 75000,
    image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/co2%20projects/image%20(60).jpeg',
    benefits: ['Carbon Sequestration', 'Biodiversity Protection', 'Indigenous Support', 'Ecosystem Restoration'],
    methodology: 'Afforestation and Reforestation',
    category: 'Carbon Offset',
    additionalInfo: {
      biodiversityImpact: 'Critical habitat restoration for endangered species',
      communityBenefit: 'Support for indigenous communities and sustainable livelihoods',
      technologyUsed: 'Native species planting with long-term monitoring and protection'
    }
  }
};

export default function CO2CertificateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { isConnected, address } = useAccount();

  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [quantity, setQuantity] = useState(1);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseStep, setPurchaseStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = useCallback(() => {
    console.log('User logged out');
  }, []);

  const handleShowDashboard = useCallback(() => {
    console.log('🚀 Opening dashboard...');
    window.location.href = '/dashboard';
  }, []);

  const handleWalletConnect = useCallback(() => {
    console.log('💳 Wallet connect requested');
  }, []);

  useEffect(() => {
    if (id && realProjects[id]) {
      setProject(realProjects[id]);
      // Set quantity to min purchase amount
      setQuantity(realProjects[id].minPurchase);
    } else {
      navigate('/tokenized-assets');
    }
  }, [id, navigate]);

  if (!project) return null;

  const totalPrice = quantity * project.pricePerTon;

  const handlePurchase = () => {
    setShowPurchaseModal(true);
    setPurchaseStep(1);
  };

  const handleConfirmPurchase = () => {
    const emailBody = `
CO2 Certificate Purchase Request

Project: ${project.name}
Project ID: ${project.projectId}
NGO Provider: ${project.ngoName}
Location: ${project.location}, ${project.country}

Quantity: ${quantity} tons
Price per Ton: $${project.pricePerTon.toFixed(2)}
Total Price: $${totalPrice.toFixed(2)}

Payment Method: ${paymentMethod}

Certification Standard: ${project.certificationStandard}
    `.trim();

    window.location.href = `mailto:info@privatecharterx.com?subject=CO2 Certificate Purchase - ${project.projectId}&body=${encodeURIComponent(emailBody)}`;
    setShowPurchaseModal(false);
    setPurchaseStep(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['DM_Sans']">
      {/* Header - EXACT COPY from EmptyLegDetail */}
      <header className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-5 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/')}>
                <img
                  src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_Logo_written-removebg-preview.png"
                  alt="PrivateCharterX"
                  className="h-8 w-auto"
                />
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search CO2 certificates"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 outline-none text-sm font-light placeholder-gray-400 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all duration-200 shadow-sm"
                />
              </div>

              <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm border border-gray-200" title="Verified">
                <Shield size={16} />
              </button>

              {/* User Menu with Dropdown and Dashboard Access */}
              <div className="relative">
                <UserMenu onLogout={handleLogout} onShowDashboard={handleShowDashboard} />
                {/* Green indicator when authenticated - positioned over the UserMenu */}
                {isAuthenticated && (
                  <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white pointer-events-none z-10"></div>
                )}
              </div>

              {/* Wallet Menu with Dropdown and Connection Status Lamp */}
              <div className="relative">
                <WalletMenu onConnect={handleWalletConnect} iconOnly={true} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex space-x-8">
            <button
              onClick={() => navigate('/tokenized-assets')}
              className="py-4 text-sm text-gray-600 border-b-2 border-transparent hover:text-black"
            >
              ← Back to CO2/SAF
            </button>
            <button className="py-4 text-sm text-black border-b-2 border-black">◇ CO2 Certificate Details</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-5 py-6">
        {/* Project Header Card */}
        <div className="bg-white rounded-lg border border-gray-300 mb-6">
          <div className="flex h-80">
            {/* Left side - Project Image */}
            <div className="w-2/5 relative">
              <img
                src={project.image}
                alt={project.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800';
                }}
              />
              <div className="absolute top-3 left-3 flex space-x-1.5">
                <div className="bg-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  <span>Verified</span>
                </div>
                <div className="bg-white px-2 py-1 rounded text-xs font-medium">{project.certificationStandard}</div>
              </div>
            </div>

            {/* Right side - Project info */}
            <div className="flex-1 p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">PCX</span>
                <div className="flex space-x-2">
                  <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">⎘</button>
                  <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">◉</button>
                </div>
              </div>

              <h1 className="text-2xl font-semibold mb-4">{project.name}</h1>
              <p className="text-sm text-gray-600 mb-4">
                {project.location}, {project.country}
              </p>

              {/* Tab Navigation */}
              <div className="flex space-x-6 border-b border-gray-300 mb-5">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-3 text-xs relative ${activeTab === 'details' ? 'text-black' : 'text-gray-600'}`}
                >
                  Project Details
                  {activeTab === 'details' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('impact')}
                  className={`pb-3 text-xs relative ${activeTab === 'impact' ? 'text-black' : 'text-gray-600'}`}
                >
                  Impact & Benefits
                  {activeTab === 'impact' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('provider')}
                  className={`pb-3 text-xs relative ${activeTab === 'provider' ? 'text-black' : 'text-gray-600'}`}
                >
                  Provider
                  {activeTab === 'provider' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                </button>
              </div>

              {/* Key metrics */}
              <div className="flex justify-between mt-auto mb-5">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Price per Ton</span>
                  <span className="text-sm font-semibold text-black">${project.pricePerTon.toFixed(2)}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Available</span>
                  <span className="text-sm font-semibold text-black">{project.availableTons.toLocaleString()} tons</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500">Standard</span>
                  <span className="text-sm font-semibold text-black">{project.certificationStandard}</span>
                </div>
              </div>

              {/* Links */}
              <div className="flex space-x-4 pt-4 border-t border-gray-100 text-xs">
                <button className="text-gray-600 hover:text-black">Project Documentation ↗</button>
                <button className="text-gray-600 hover:text-black">Verification Report ⚖</button>
              </div>
            </div>
          </div>
        </div>

        {/* Content and Booking Section */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Content */}
          <div className="col-span-2">
            <div className="bg-white rounded-lg border border-gray-300 p-6">
              {activeTab === 'details' && (
                <div>
                  <h3 className="text-base font-semibold mb-4">Project Details</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Project ID</div>
                      <div className="text-sm font-semibold text-black">{project.projectId}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Location</div>
                      <div className="text-sm font-semibold text-black">{project.location}, {project.country}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Methodology</div>
                      <div className="text-sm font-semibold text-black">{project.methodology}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Certification</div>
                      <div className="text-sm font-semibold text-black">{project.certificationStandard}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Min Purchase</div>
                      <div className="text-sm font-semibold text-black">{project.minPurchase} ton{project.minPurchase > 1 ? 's' : ''}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Max Purchase</div>
                      <div className="text-sm font-semibold text-black">{project.maxPurchase} tons</div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-sm font-semibold mb-3">Project Description</h4>
                    <p className="text-xs text-gray-700 leading-relaxed">{project.description}</p>
                  </div>

                  <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Leaf className="w-5 h-5 text-green-600" />
                      <h4 className="text-sm font-bold text-green-900">Verified Carbon Credits</h4>
                    </div>
                    <p className="text-xs text-gray-700">
                      All carbon credits are {project.certificationStandard} certified and verified by independent third parties.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'impact' && (
                <div>
                  <h3 className="text-base font-semibold mb-4">Environmental Impact & Benefits</h3>

                  <div className="mb-6">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-green-600" />
                      Key Benefits
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {project.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span className="text-xs text-gray-700">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 mt-6">
                    <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-4 h-4 text-blue-600" />
                        <h5 className="text-xs font-semibold text-black">Biodiversity Impact</h5>
                      </div>
                      <p className="text-xs text-gray-700">{project.additionalInfo.biodiversityImpact}</p>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4 bg-purple-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <h5 className="text-xs font-semibold text-black">Community Benefit</h5>
                      </div>
                      <p className="text-xs text-gray-700">{project.additionalInfo.communityBenefit}</p>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4 bg-orange-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-orange-600" />
                        <h5 className="text-xs font-semibold text-black">Technology Used</h5>
                      </div>
                      <p className="text-xs text-gray-700">{project.additionalInfo.technologyUsed}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'provider' && (
                <div>
                  <h3 className="text-base font-semibold mb-4">Provider Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">NGO Provider</div>
                      <div className="text-sm font-semibold text-black">{project.ngoName}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Certification</div>
                      <div className="text-sm font-semibold text-black">{project.certificationStandard} Verified</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Location</div>
                      <div className="text-sm font-semibold text-black">{project.country}</div>
                    </div>
                    <div className="border-b border-gray-100 pb-2">
                      <div className="text-xs text-gray-500 font-medium">Verified Status</div>
                      <div className="text-sm font-semibold text-green-600">✓ Verified Provider</div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-600 text-sm mt-0.5">ℹ</span>
                      <div>
                        <div className="text-xs font-semibold text-black mb-1">Provider Verification</div>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          All NGO providers are verified by PrivateCharterX and meet international carbon credit standards.
                          Projects undergo regular third-party audits to ensure compliance and impact verification.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Purchase Widget */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg border border-gray-300 p-5 sticky top-6">
              <h3 className="text-base font-semibold mb-4">Purchase Certificate</h3>

              {/* Project Summary */}
              <div className="space-y-3 mb-5">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Price per Ton</span>
                  <span className="text-xs font-semibold text-black">${project.pricePerTon.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Available</span>
                  <span className="text-xs font-semibold text-black">{project.availableTons.toLocaleString()} tons</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Certification</span>
                  <span className="text-xs font-semibold text-black">{project.certificationStandard}</span>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mb-5 pb-4 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-black mb-4">Quantity (tons)</h4>
                <div className="flex items-center justify-between border border-gray-300 rounded px-3 py-2">
                  <button
                    onClick={() => setQuantity(Math.max(project.minPurchase, quantity - 1))}
                    className="text-gray-600 hover:text-black w-8 h-8 flex items-center justify-center text-lg"
                  >
                    -
                  </button>
                  <span className="text-base font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(project.maxPurchase, quantity + 1))}
                    className="text-gray-600 hover:text-black w-8 h-8 flex items-center justify-center text-lg"
                  >
                    +
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Min: {project.minPurchase} ton{project.minPurchase > 1 ? 's' : ''} | Max: {project.maxPurchase} tons
                </div>
              </div>

              {/* Total Price */}
              <div className="p-3 bg-gray-50 rounded mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Quantity:</span>
                  <span className="font-semibold text-black">{quantity} ton{quantity > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Price per Ton:</span>
                  <span className="font-semibold text-black">${project.pricePerTon.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 mt-2">
                  <span className="text-black">Total:</span>
                  <span className="text-black">${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Purchase Button */}
              <button
                onClick={handlePurchase}
                className="w-full bg-black text-white py-3 px-4 rounded text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Purchase Certificate
              </button>

              {/* Additional Info */}
              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex items-start space-x-2 mb-2">
                  <span className="text-green-500">✓</span>
                  <span>Instant certificate delivery</span>
                </div>
                <div className="flex items-start space-x-2 mb-2">
                  <span className="text-green-500">✓</span>
                  <span>{project.certificationStandard} verified credits</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Blockchain option available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {purchaseStep === 1 && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-thin text-black">Purchase Overview</h2>
                  <button
                    onClick={() => setShowPurchaseModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-gray-500 text-xl">×</span>
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Project</span>
                    <span className="text-sm font-semibold text-black">{project.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Quantity</span>
                    <span className="text-sm font-semibold text-black">{quantity} ton{quantity > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Price per Ton</span>
                    <span className="text-sm font-semibold text-black">${project.pricePerTon.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-3 bg-gray-50 rounded-lg px-3">
                    <span className="text-base font-bold text-black">Total</span>
                    <span className="text-base font-bold text-black">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setPurchaseStep(2)}
                  className="w-full bg-black text-white py-3 px-4 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {purchaseStep === 2 && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-thin text-black">Payment Method</h2>
                  <button
                    onClick={() => setShowPurchaseModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-gray-500 text-xl">×</span>
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => setPaymentMethod('Bank Transfer')}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'Bank Transfer'
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-semibold text-black">Bank Transfer</div>
                    <div className="text-xs text-gray-600 mt-1">Traditional wire transfer</div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('Crypto')}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'Crypto'
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-semibold text-black">Cryptocurrency</div>
                    <div className="text-xs text-gray-600 mt-1">Pay with USDT, USDC, ETH</div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('Credit Card')}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'Credit Card'
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-semibold text-black">Credit Card</div>
                    <div className="text-xs text-gray-600 mt-1">Visa, Mastercard, Amex</div>
                  </button>
                </div>

                <button
                  onClick={handleConfirmPurchase}
                  disabled={!paymentMethod}
                  className="w-full bg-black text-white py-3 px-4 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Confirm Purchase
                </button>

                <button
                  onClick={() => setPurchaseStep(1)}
                  className="w-full mt-3 text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
