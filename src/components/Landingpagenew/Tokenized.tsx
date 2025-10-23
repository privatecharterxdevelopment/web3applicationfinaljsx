import React from 'react';
import LandingHeader from './LandingHeader';
import {
  Plane,
  Shield,
  Coins,
  Clock,
  Globe,
  Star,
  Users,
  Zap,
  ChevronDown,
  ArrowRight,
  Check,
  Layers,
  Database,
  Code,
  Smartphone,
  Headphones,
  Award,
  Lock,
  Cpu,
  Network,
  Settings,
  FileText,
  Briefcase,
  Server,
  Key,
  Eye,
  Anchor,
  Car,
  Building,
  Gem,
  Wallet,
  Leaf,
  TrendingUp,
  DollarSign,
  BarChart3,
  PieChart,
  Info,
  Sparkles,
  Crown,
  Diamond,
  Banknote,
  Calculator,
  Scale,
  Gavel,
  BookOpen,
  Lightbulb,
  Rocket,
  Fingerprint,
  ShieldCheck,
  Vault,
  CreditCard,
  Receipt,
  Package,
  Truck,
  Ship,
  Home,
  Factory,
  TreePine,
  Wind,
  Zap as Lightning,
  Battery,
  Fuel,
  Recycle
} from 'lucide-react';

interface TokenizedProps {
  setCurrentPage: (page: string) => void;
}

function Tokenized({ setCurrentPage }: TokenizedProps) {
  const handleGetStarted = () => {
    setCurrentPage('dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-4">
      <LandingHeader />

      {/* Hero Section - Direct on background, no white floating component */}
      <section className="px-4 sm:px-8 py-12 sm:py-24 max-w-6xl mx-auto">
        <div className="text-center">
          <div className="mb-8">
            <span className="bg-gray-900 text-white px-4 py-2 rounded-full text-xs font-medium tracking-wide uppercase">
              Asset Tokenization Ecosystem
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 mb-6 sm:mb-8 leading-tight tracking-tight">
            Tokenize the world of<br />
            <span className="font-medium">luxury travel & sustainability</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-12 leading-relaxed max-w-4xl mx-auto">
            Transform real-world luxury assets into digital tokens. From private jets and yachts to 
            limousine fleets and helicopter operations - unlock fractional ownership, generate yield, 
            and trade sustainability certificates on the blockchain.
          </p>
          
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-lg sm:text-2xl font-light text-gray-900 mb-2">$2.8B+</div>
              <h3 className="text-base font-medium text-gray-900 mb-2">Assets Under Management</h3>
              <p className="text-xs sm:text-sm text-gray-500">Total tokenized value</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-2xl font-light text-gray-900 mb-2">847</div>
              <h3 className="text-base font-medium text-gray-900 mb-2">Tokenized Assets</h3>
              <p className="text-sm text-gray-500">Across all categories</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-2xl font-light text-gray-900 mb-2">12.4%</div>
              <h3 className="text-base font-medium text-gray-900 mb-2">Average APY</h3>
              <p className="text-sm text-gray-500">Annual percentage yield</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-2xl font-light text-gray-900 mb-2">45,000+</div>
              <h3 className="text-base font-medium text-gray-900 mb-2">Token Holders</h3>
              <p className="text-sm text-gray-500">Global investor community</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <button 
              onClick={handleGetStarted}
              className="bg-gray-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-md text-sm hover:bg-gray-800 transition-colors"
            >
              Start Tokenization Process
            </button>
            <button 
              onClick={handleGetStarted}
              className="border border-gray-300 text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-md text-sm hover:bg-gray-50 transition-colors"
            >
              Browse Tokenized Assets
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
        {/* Blockchain Certificates Section */}
        <section className="px-8 py-20 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-gray-900 mb-6 leading-tight">
              Blockchain Sustainability Certificates<br />
              <span className="font-medium">CO2 & SAF Verification on Chain</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Revolutionary blockchain-based certification system for carbon emissions and 
              Sustainable Aviation Fuel usage. Immutable, transparent, and tradeable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* CO2 Certificates */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-200">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Leaf className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-4">CO2 Certificates</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Blockchain-verified carbon emission certificates for every flight. Track, offset, 
                and trade carbon credits with full transparency and immutable records.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-3" />
                  <span className="text-sm text-gray-700">Real-time emission tracking</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-3" />
                  <span className="text-sm text-gray-700">Automatic offset calculations</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-3" />
                  <span className="text-sm text-gray-700">Tradeable carbon credits</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-3" />
                  <span className="text-sm text-gray-700">Regulatory compliance</span>
                </div>
              </div>
              <button 
                onClick={() => setCurrentPage('helpdesk')}
                className="bg-green-600 text-white px-6 py-3 rounded-md text-sm hover:bg-green-700 transition-colors"
              >
                Generate CO2 Certificate
              </button>
            </div>

            {/* SAF Certificates */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-2xl border border-blue-200">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Fuel className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-4">SAF Certificates</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Sustainable Aviation Fuel usage verification through blockchain technology. 
                Prove your commitment to sustainable aviation with immutable SAF certificates.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-blue-600 mr-3" />
                  <span className="text-sm text-gray-700">SAF usage verification</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-blue-600 mr-3" />
                  <span className="text-sm text-gray-700">Supply chain transparency</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-blue-600 mr-3" />
                  <span className="text-sm text-gray-700">Sustainability scoring</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-blue-600 mr-3" />
                  <span className="text-sm text-gray-700">Premium market access</span>
                </div>
              </div>
              <button 
                onClick={() => setCurrentPage('helpdesk')}
                className="bg-blue-600 text-white px-6 py-3 rounded-md text-sm hover:bg-blue-700 transition-colors"
              >
                Verify SAF Usage
              </button>
            </div>
          </div>

          {/* Certificate Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-light text-gray-900 mb-2">156,847</div>
              <p className="text-sm text-gray-500">CO2 Certificates Issued</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-light text-gray-900 mb-2">89,234</div>
              <p className="text-sm text-gray-500">SAF Certificates Generated</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-light text-gray-900 mb-2">2.4M</div>
              <p className="text-sm text-gray-500">Tons CO2 Offset</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-light text-gray-900 mb-2">67%</div>
              <p className="text-sm text-gray-500">Flights with SAF</p>
            </div>
          </div>
        </section>

        {/* Tokenization Process */}
        <section className="px-8 py-20 max-w-6xl mx-auto border-t border-gray-100">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-gray-900 mb-6 leading-tight">
              Complete Tokenization Process<br />
              <span className="font-medium">From Asset to Token in 6 Steps</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our comprehensive tokenization framework transforms luxury travel assets into 
              digital securities with full regulatory compliance and institutional-grade custody.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center text-lg font-medium mx-auto mb-6">
                1
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Initial Consultation</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Asset evaluation, tokenization strategy, regulatory assessment, and market analysis 
                to determine optimal token structure and investment potential.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                  Asset valuation
                </div>
                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                  Legal review
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center text-lg font-medium mx-auto mb-6">
                2
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">SPV Setup & Structure</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Special Purpose Vehicle creation, asset allocation framework, governance structure, 
                and regulatory compliance setup for institutional-grade tokenization.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                  Legal entity
                </div>
                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                  Asset custody
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center text-lg font-medium mx-auto mb-6">
                3
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Smart Contract Development</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Custom smart contract creation on Ethereum or Base, with options for ERC-20 utility 
                tokens, ERC-1400 security tokens, or hybrid tokenomics models.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                  ERC-20/1400
                </div>
                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                  Multi-chain
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center text-lg font-medium mx-auto mb-6">
                4
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Token Minting & Distribution</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Professional token minting process with institutional custody, KYC/AML compliance, 
                and secure distribution to qualified investors through our platform.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                  KYC/AML
                </div>
                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                  Secure minting
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center text-lg font-medium mx-auto mb-6">
                5
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Custody & Vault Management</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Institutional-grade custody through our trusted partners, secure vault storage, 
                insurance coverage, and professional asset management services.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                  Institutional custody
                </div>
                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                  Insurance
                </div>
              </div>
            </div>

            {/* Step 6 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center text-lg font-medium mx-auto mb-6">
                6
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Trading & Yield Generation</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Secondary market trading, yield distribution, governance participation, and ongoing 
                asset management with transparent reporting and blockchain verification.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                  Secondary trading
                </div>
                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                  Yield distribution
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Asset Categories */}
        <section className="px-8 py-20 max-w-6xl mx-auto border-t border-gray-100">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-gray-900 mb-6 leading-tight">
              Tokenizable Asset Categories<br />
              <span className="font-medium">Luxury Travel & Transportation Ecosystem</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From private aviation to luxury ground transportation, we tokenize the entire 
              spectrum of premium travel assets for fractional ownership and yield generation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Aviation Assets */}
            <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden">
              {/* Header Image */}
              <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl mb-6 flex items-center justify-center">
                <Plane className="w-12 h-12 text-gray-500" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Aviation Assets</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Private jets, helicopters, eVTOLs, and aviation operators ready for tokenization.
                </p>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    Private jet fleets
                  </div>
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    Helicopter operations
                  </div>
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    eVTOL manufacturers
                  </div>
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    Charter operators
                  </div>
                </div>
              </div>
            </div>

            {/* Ground Transportation */}
            <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden">
              {/* Header Image */}
              <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl mb-6 flex items-center justify-center">
                <Car className="w-12 h-12 text-gray-500" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Ground Transportation</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Luxury car fleets, limousine services, and premium ground transportation companies.
                </p>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    Limousine companies
                  </div>
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    Luxury car fleets
                  </div>
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    Chauffeur services
                  </div>
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    Executive transport
                  </div>
                </div>
              </div>
            </div>

            {/* Maritime Assets */}
            <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden">
              {/* Header Image */}
              <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl mb-6 flex items-center justify-center">
                <Anchor className="w-12 h-12 text-gray-500" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Maritime Assets</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Luxury yachts, charter operations, and maritime hospitality services.
                </p>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    Luxury yacht charters
                  </div>
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    Superyacht ownership
                  </div>
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    Marina operations
                  </div>
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    Maritime services
                  </div>
                </div>
              </div>
            </div>

            {/* Hospitality & Experiences */}
            <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden">
              {/* Header Image */}
              <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl mb-6 flex items-center justify-center">
                <Crown className="w-12 h-12 text-gray-500" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Hospitality & Experiences</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Luxury hotels, exclusive experiences, and premium hospitality services.
                </p>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    Luxury resort properties
                  </div>
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    Exclusive experiences
                  </div>
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    Concierge services
                  </div>
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    VIP memberships
                  </div>
                </div>
              </div>
            </div>

            {/* Real Estate */}
            <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden">
              {/* Header Image */}
              <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl mb-6 flex items-center justify-center">
                <Building className="w-12 h-12 text-gray-500" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Travel Real Estate</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Airports, hangars, terminals, and travel-related real estate infrastructure.
                </p>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    Private hangars
                  </div>
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    Airport terminals
                  </div>
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    FBO facilities
                  </div>
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    Travel hubs
                  </div>
                </div>
              </div>
            </div>

            {/* Technology & Innovation */}
            <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden">
              {/* Header Image */}
              <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl mb-6 flex items-center justify-center">
                <Rocket className="w-12 h-12 text-gray-500" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Technology & Innovation</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Travel tech companies, mobility platforms, and innovative transportation solutions.
                </p>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    Mobility platforms
                  </div>
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    Travel tech startups
                  </div>
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    Innovation projects
                  </div>
                  <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    Future mobility
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Upcoming Tokenized Assets */}
      <section className="px-8 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-light text-gray-900 mb-6 leading-tight">
            Upcoming Tokenized Assets<br />
            <span className="font-medium">Future Investment Opportunities</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Explore upcoming tokenization opportunities across luxury travel assets with 
            projected yields, transparent metrics, and institutional-grade management.
          </p>
        </div>

        <div className="space-y-8">
          {/* Private Jet Example */}
          <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {/* Asset Image */}
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mr-6">
                    <div className="text-center">
                      <Plane className="w-8 h-8 text-gray-500 mx-auto mb-1" />
                      <span className="text-xs text-gray-400">Image</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-gray-900">Gulfstream G650ER</h3>
                    <p className="text-sm text-gray-500">Ultra-Long Range Business Jet</p>
                  </div>
                </div>
                
                {/* Metrics Row */}
                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <div className="text-2xl font-light text-gray-900 mb-1">8.7%</div>
                    <p className="text-sm text-gray-500">Projected APY</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-gray-900 mb-1">$1,250</div>
                    <p className="text-sm text-gray-500">Token Price</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-gray-900 mb-1">2,500</div>
                    <p className="text-sm text-gray-500">Max Holders</p>
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setCurrentPage('helpdesk')}
                      className="bg-gray-900 text-white px-6 py-3 rounded-md text-sm hover:bg-gray-800 transition-colors"
                    >
                      Join Waitlist
                    </button>
                    <button className="border border-gray-200 text-gray-700 px-6 py-3 rounded-md text-sm hover:bg-gray-50 transition-colors">
                      Read More
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Expandable Details */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    <span>Asset Details & Investment Information</span>
                    <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Aircraft Specifications</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Range:</span>
                            <span>7,500 nautical miles</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Max Passengers:</span>
                            <span>19</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Max Speed:</span>
                            <span>Mach 0.925</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Year:</span>
                            <span>2019</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Investment Details</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Total Asset Value:</span>
                            <span>$65,000,000</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Token Supply:</span>
                            <span>52,000 tokens</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Min Investment:</span>
                            <span>$1,250 (1 token)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Expected Launch:</span>
                            <span>Q2 2024</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>

          {/* Luxury Car Fleet */}
          <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {/* Asset Image */}
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mr-6">
                    <div className="text-center">
                      <Car className="w-8 h-8 text-gray-500 mx-auto mb-1" />
                      <span className="text-xs text-gray-400">Image</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-gray-900">Elite Limousine Fleet</h3>
                    <p className="text-sm text-gray-500">Premium Ground Transportation</p>
                  </div>
                </div>
                
                {/* Metrics Row */}
                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <div className="text-2xl font-light text-gray-900 mb-1">12.3%</div>
                    <p className="text-sm text-gray-500">Projected APY</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-gray-900 mb-1">$850</div>
                    <p className="text-sm text-gray-500">Token Price</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-gray-900 mb-1">5,000</div>
                    <p className="text-sm text-gray-500">Max Holders</p>
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setCurrentPage('helpdesk')}
                      className="bg-gray-900 text-white px-6 py-3 rounded-md text-sm hover:bg-gray-800 transition-colors"
                    >
                      Join Waitlist
                    </button>
                    <button className="border border-gray-200 text-gray-700 px-6 py-3 rounded-md text-sm hover:bg-gray-50 transition-colors">
                      Read More
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Expandable Details */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    <span>Fleet Details & Investment Information</span>
                    <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Fleet Specifications</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Fleet Size:</span>
                            <span>50 vehicles</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Vehicle Types:</span>
                            <span>Luxury sedans, SUVs</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Service Areas:</span>
                            <span>5 major cities</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Average Age:</span>
                            <span>2.5 years</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Investment Details</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Total Fleet Value:</span>
                            <span>$12,500,000</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Token Supply:</span>
                            <span>14,706 tokens</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Min Investment:</span>
                            <span>$850 (1 token)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Expected Launch:</span>
                            <span>Q3 2024</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>

          {/* Helicopter Operation */}
          <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {/* Asset Image */}
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mr-6">
                    <div className="text-center">
                      <Settings className="w-8 h-8 text-gray-500 mx-auto mb-1" />
                      <span className="text-xs text-gray-400">Image</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-gray-900">Coastal Helicopter Tours</h3>
                    <p className="text-sm text-gray-500">Tourism & Charter Operations</p>
                  </div>
                </div>
                
                {/* Metrics Row */}
                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <div className="text-2xl font-light text-gray-900 mb-1">15.2%</div>
                    <p className="text-sm text-gray-500">Projected APY</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-gray-900 mb-1">$650</div>
                    <p className="text-sm text-gray-500">Token Price</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-gray-900 mb-1">3,000</div>
                    <p className="text-sm text-gray-500">Max Holders</p>
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setCurrentPage('helpdesk')}
                      className="bg-gray-900 text-white px-6 py-3 rounded-md text-sm hover:bg-gray-800 transition-colors"
                    >
                      Join Waitlist
                    </button>
                    <button className="border border-gray-200 text-gray-700 px-6 py-3 rounded-md text-sm hover:bg-gray-50 transition-colors">
                      Read More
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Expandable Details */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    <span>Operation Details & Investment Information</span>
                    <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Operation Specifications</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Fleet Size:</span>
                            <span>8 helicopters</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Service Type:</span>
                            <span>Tourism & Charter</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Operating Locations:</span>
                            <span>3 coastal cities</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Annual Flights:</span>
                            <span>2,400+</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Investment Details</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Total Operation Value:</span>
                            <span>$8,200,000</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Token Supply:</span>
                            <span>12,615 tokens</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Min Investment:</span>
                            <span>$650 (1 token)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Expected Launch:</span>
                            <span>Q4 2024</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>

          {/* eVTOL Future Mobility */}
          <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {/* Asset Image */}
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mr-6">
                    <div className="text-center">
                      <Zap className="w-8 h-8 text-gray-500 mx-auto mb-1" />
                      <span className="text-xs text-gray-400">Image</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-gray-900">Urban eVTOL Network</h3>
                    <p className="text-sm text-gray-500">Future Urban Air Mobility</p>
                  </div>
                </div>
                
                {/* Metrics Row */}
                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <div className="text-2xl font-light text-gray-900 mb-1">TBD</div>
                    <p className="text-sm text-gray-500">Projected Yield</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-gray-900 mb-1">$2,100</div>
                    <p className="text-sm text-gray-500">Token Price</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-gray-900 mb-1">10,000</div>
                    <p className="text-sm text-gray-500">Max Holders</p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setCurrentPage('dashboard')}
                      className="bg-gray-900 text-white px-6 py-3 rounded-md text-sm hover:bg-gray-800 transition-colors"
                    >
                      Get Started
                    </button>
                    <button
                      onClick={() => setCurrentPage('helpdesk')}
                      className="border border-gray-200 text-gray-700 px-6 py-3 rounded-md text-sm hover:bg-gray-50 transition-colors"
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Expandable Details */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    <span>Future Mobility Details & Investment Information</span>
                    <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Network Specifications</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Vehicle Type:</span>
                            <span>Electric VTOL</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Passenger Capacity:</span>
                            <span>4 passengers</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Range:</span>
                            <span>60 miles</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Target Cities:</span>
                            <span>10 urban areas</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Investment Details</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Total Network Value:</span>
                            <span>$45,000,000</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Token Supply:</span>
                            <span>21,429 tokens</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Min Investment:</span>
                            <span>$2,100 (1 token)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Expected Launch:</span>
                            <span>2025-2026</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-8 py-20 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-light text-gray-900 mb-4">Ready to Tokenize Your Assets?</h2>
        <p className="text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
          Join the future of asset ownership with blockchain-powered tokenization. 
          From consultation to trading, we handle the entire process.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <button 
            onClick={handleGetStarted}
            className="bg-gray-900 text-white px-8 py-3 rounded-md text-sm hover:bg-gray-800 transition-colors flex items-center justify-center"
          >
            Start Tokenization
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
          <button 
            onClick={handleGetStarted}
            className="border border-gray-200 text-gray-700 px-8 py-3 rounded-md text-sm hover:bg-gray-50 transition-colors"
          >
            Schedule Consultation
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 px-8 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Logo and Description */}
            <div className="lg:col-span-1">
              <img src="/PRIVATECHARTER__18_-removebg-preview.png" alt="PrivateCharterX" className="h-16 w-auto mb-4" />
              <p className="text-sm text-gray-500 leading-relaxed">
                Blockchain-powered private aviation platform revolutionizing luxury travel.
              </p>
            </div>

            {/* Aviation Services */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Aviation Services</h4>
              <div className="space-y-3">
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Private Jet Charter
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Group Charter
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Helicopter Charter
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  eVTOL Flights
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Adventure Packages
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
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
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Web3
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  PVCX Token
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  NFT Aviation
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Asset Licensing
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  JetCard Packages
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  CO2 Certificates
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Marketplace
                </button>
              </div>
            </div>

            {/* Partners & Press */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Partners & Press</h4>
              <div className="space-y-3">
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Partner With Us
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Blog Posts
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
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
                  onClick={() => setCurrentPage('home')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Home
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  How It Works
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  About
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  FAQ
                </button>
                <button 
                  onClick={() => setCurrentPage('helpdesk')}
                  className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Support
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-400 mb-4 md:mb-0">©2023-2025 PrivateCharterX. All rights reserved.</p>
            <div className="flex space-x-6">
              <button 
                onClick={() => setCurrentPage('helpdesk')}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Privacy
              </button>
              <button 
                onClick={() => setCurrentPage('helpdesk')}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Terms
              </button>
              <button 
                onClick={() => setCurrentPage('helpdesk')}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Support
              </button>
              <button 
                onClick={() => setCurrentPage('helpdesk')}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Helpdesk
              </button>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default Tokenized;