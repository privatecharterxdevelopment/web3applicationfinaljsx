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
  Info
} from 'lucide-react';

interface TechnologyProps {
  setCurrentPage: (page: string) => void;
}

function Technology({ setCurrentPage }: TechnologyProps) {

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-4">
      <LandingHeader />

      {/* Hero Section - Direct on background, no white floating component */}
      <section className="px-4 sm:px-8 py-12 sm:py-24 max-w-6xl mx-auto">
        {/* Centered Layout with Tech Metrics Below */}
        <div className="text-center">
          <div className="mb-8">
            <span className="bg-gray-900 text-white px-4 py-2 rounded-full text-xs font-medium tracking-wide uppercase">
              Blockchain Aviation Technology
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 mb-6 sm:mb-8 leading-tight tracking-tight max-w-4xl mx-auto">
            The foundation of<br />
            <span className="font-medium">future mobility</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-12 leading-relaxed max-w-3xl mx-auto px-4">
            Leveraging cutting-edge Web3 and blockchain technologies to revolutionize 
            private aviation, luxury asset management, and decentralized ownership. 
            Built for security, transparency, and innovation.
          </p>
          
          {/* Tech Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Server className="w-6 h-6 text-gray-700" />
              </div>
              <div className="text-xl sm:text-2xl font-light text-gray-900 mb-2">99.9%</div>
              <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2">Network Uptime</h3>
              <p className="text-xs sm:text-sm text-gray-500">Decentralized infrastructure reliability</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-gray-700" />
              </div>
              <div className="text-2xl font-light text-gray-900 mb-2">256-bit</div>
              <h3 className="text-base font-medium text-gray-900 mb-2">Encryption Standard</h3>
              <p className="text-sm text-gray-500">Military-grade security protocols</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-gray-700" />
              </div>
              <div className="text-2xl font-light text-gray-900 mb-2">&lt;2s</div>
              <h3 className="text-base font-medium text-gray-900 mb-2">Transaction Speed</h3>
              <p className="text-sm text-gray-500">Average blockchain confirmation time</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <button 
              onClick={() => setCurrentPage('dashboard')}
              className="bg-gray-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-md text-sm hover:bg-gray-800 transition-colors"
            >
              Explore Documentation
            </button>
            <button 
              onClick={() => setCurrentPage('dashboard')}
              className="border border-gray-300 text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-md text-sm hover:bg-gray-50 transition-colors"
            >
              View Architecture
            </button>
          </div>
        </div>
      </section>

      {/* Core Blockchain Stack */}
      <section className="px-8 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-light text-gray-900 mb-6 leading-tight">
            Core Blockchain Stack<br />
            <span className="font-medium">Powering Decentralized Operations</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Our technology stack enables secure tokenization and management of luxury assets 
            including private jets, eVTOLs, helicopters, yachts, boats, luxury cars, and hangars.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
            {/* Header Image */}
            <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-6 flex items-center justify-center">
              <Network className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Blockchain Protocols</h3>
            <p className="text-gray-600 mb-4 leading-relaxed text-sm">
              Built on Ethereum mainnet with Polygon Layer 2 scaling solutions for fast, 
              cost-effective transactions. Multi-chain architecture ensures maximum 
              compatibility and future-proofing.
            </p>
            <div className="flex flex-wrap gap-2">
              <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                Ethereum mainnet
              </div>
              <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                Polygon Layer 2
              </div>
              <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                Cross-chain bridges
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
            {/* Header Image */}
            <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-6 flex items-center justify-center">
              <Code className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Smart Contract Languages</h3>
            <p className="text-gray-600 mb-4 leading-relaxed text-sm">
              Advanced smart contracts developed in Solidity with Rust components for 
              high-performance operations. Comprehensive testing and formal verification 
              ensure bulletproof security.
            </p>
            <div className="flex flex-wrap gap-2">
              <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                Solidity contracts
              </div>
              <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                Rust optimization
              </div>
              <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                Formal verification
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
            {/* Header Image */}
            <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-6 flex items-center justify-center">
              <Coins className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Token Standards</h3>
            <p className="text-gray-600 mb-4 leading-relaxed text-sm">
              Multi-standard token architecture supporting utility tokens, NFT memberships, 
              and security tokens for fractional asset ownership. Each standard optimized 
              for specific use cases and regulatory compliance.
            </p>
            <div className="flex flex-wrap gap-2">
              <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                ERC-20 utility tokens
              </div>
              <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                ERC-721 NFT memberships
              </div>
              <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                ERC-1400 security tokens
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
            {/* Header Image */}
            <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-6 flex items-center justify-center">
              <Database className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Oracle Integration</h3>
            <p className="text-gray-600 mb-4 leading-relaxed text-sm">
              Real-world data integration through Chainlink oracles for flight tracking, 
              weather conditions, asset valuations, and market pricing. Ensures accurate 
              on-chain representation of off-chain events.
            </p>
            <div className="flex flex-wrap gap-2">
              <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                Chainlink oracles
              </div>
              <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                Flight data feeds
              </div>
              <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                Asset valuations
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NFT Membership Program */}
      <section className="px-8 py-20 max-w-6xl mx-auto">
        <div className="bg-gray-900 rounded-2xl p-12 text-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
          
          <div className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center mb-6">
                  <Gem className="w-8 h-8 text-white mr-3" />
                  <span className="bg-white/10 text-white px-4 py-2 rounded-full text-xs font-medium tracking-wide uppercase">
                    Exclusive NFT Membership
                  </span>
                </div>
                <h2 className="text-3xl font-light mb-6 leading-tight">
                  Premium Access<br />
                  <span className="font-medium">Tokenized Benefits</span>
                </h2>
                <p className="text-gray-300 mb-8 leading-relaxed">
                  Own a piece of the future with our limited NFT membership program. 
                  Each token grants exclusive access to premium services and significant savings.
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-sm">1 free empty leg flight redemption</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-sm">10% discount on all jet charters & empty legs</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-sm">Complimentary airport transfers</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-sm">Priority booking access</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-sm">Exclusive member events</span>
                  </div>
                </div>

                <button className="bg-white text-gray-900 px-8 py-4 rounded-md text-sm hover:bg-gray-100 transition-colors">
                  <span onClick={() => setCurrentPage('dashboard')}>Mint Your NFT</span>
                </button>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Limited Edition</h3>
                  <p className="text-gray-300 text-sm">Exclusive membership collection</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-sm text-gray-300">Price</span>
                    <span className="text-lg font-medium">0.5 ETH</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-sm text-gray-300">Total Supply</span>
                    <span className="text-lg font-medium">100 pieces</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-sm text-gray-300">Remaining</span>
                    <span className="text-lg font-medium text-green-400">87 available</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm text-gray-300">Blockchain</span>
                    <span className="text-sm">Ethereum</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
        {/* Decentralized Infrastructure */}
        <section className="px-8 py-20 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-gray-900 mb-6 leading-tight">
              Decentralized Infrastructure<br />
              <span className="font-medium">Built for Resilience and Transparency</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our infrastructure ensures decentralization, security, and uptime for all 
              tokenized assets and blockchain operations across our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Database className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Decentralized Storage</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Critical asset data, flight manifests, and ownership documents stored 
                securely and immutably using IPFS and Arweave protocols.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                  IPFS storage
                </div>
                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                  Arweave backup
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Server className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Node Infrastructure</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Managed blockchain nodes and RPC endpoints ensure reliable network 
                access and transaction processing with 99.9% uptime guarantee.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                  Managed nodes
                </div>
                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                  Load balancing
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Layers className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Scaling Solutions</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Layer 2 scaling with optimistic rollups and ZK-proofs for enhanced 
                privacy, reduced costs, and faster transaction processing.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                  Optimistic rollups
                </div>
                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                  ZK-proofs
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Asset Tokenization Technology */}
        <section className="px-8 py-20 max-w-6xl mx-auto border-t border-gray-100">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-gray-900 mb-6 leading-tight">
              Asset Tokenization<br />
              <span className="font-medium">Technology Stack</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Advanced tokenization protocols for fractional ownership of luxury assets 
              with full regulatory compliance and transparent governance.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Plane className="w-6 h-6 text-gray-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Private Jets</h4>
              <p className="text-xs text-gray-500">Fractional ownership</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-gray-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">eVTOLs</h4>
              <p className="text-xs text-gray-500">Future mobility</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Settings className="w-6 h-6 text-gray-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Helicopters</h4>
              <p className="text-xs text-gray-500">Rotorcraft assets</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Anchor className="w-6 h-6 text-gray-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Yachts</h4>
              <p className="text-xs text-gray-500">Maritime luxury</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Car className="w-6 h-6 text-gray-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Luxury Cars</h4>
              <p className="text-xs text-gray-500">Premium vehicles</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Car className="w-6 h-6 text-gray-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Luxury Cars</h4>
              <p className="text-xs text-gray-500">Premium vehicles</p>
            </div>
          </div>
        </section>

        {/* Security & Compliance */}
        <section className="px-8 py-20 max-w-6xl mx-auto border-t border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-light text-gray-900 mb-6 leading-tight">
                Security & Compliance<br />
                <span className="font-medium">Our Unwavering Commitment</span>
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Military-grade security measures and comprehensive regulatory compliance 
                ensure the highest standards of protection for all tokenized assets and user data.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-gray-700 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Smart Contract Audits</h4>
                    <p className="text-sm text-gray-500">Regular third-party security audits by leading blockchain security firms</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Lock className="w-5 h-5 text-gray-700 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Advanced Encryption</h4>
                    <p className="text-sm text-gray-500">256-bit AES encryption with elliptic curve cryptography for maximum security</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Users className="w-5 h-5 text-gray-700 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Identity Management</h4>
                    <p className="text-sm text-gray-500">Decentralized identity (DID) integrated with KYC/AML compliance protocols</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Eye className="w-5 h-5 text-gray-700 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Privacy Protection</h4>
                    <p className="text-sm text-gray-500">Zero-knowledge proofs for enhanced privacy without compromising transparency</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Security Certifications</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">SOC 2 Type II</span>
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">ISO 27001</span>
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">GDPR Compliant</span>
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">SEC Registered</span>
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-gray-600">Multi-sig Security</span>
                  <Check className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Development & Innovation Timeline */}
        <section className="px-8 py-20 max-w-6xl mx-auto border-t border-gray-100">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-gray-900 mb-6 leading-tight">
              Development & Innovation<br />
              <span className="font-medium">Building the Future, Today</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Our development philosophy and future-oriented approach to blockchain 
              innovation in the luxury asset and aviation industry.
            </p>
          </div>

          {/* Modern Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-medium mx-auto mb-4">
                Q1
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-3">Platform Launch</h3>
              <p className="text-sm text-gray-500 mb-3 leading-relaxed">
                Core tokenization platform with NFT membership program.
              </p>
              <span className="text-xs text-gray-400">2024</span>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-medium mx-auto mb-4">
                Q2
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-3">Multi-Chain Expansion</h3>
              <p className="text-sm text-gray-500 mb-3 leading-relaxed">
                Cross-chain compatibility and Layer 2 scaling solutions.
              </p>
              <span className="text-xs text-gray-400">2024</span>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-medium mx-auto mb-4">
                Q3
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-3">AI Integration</h3>
              <p className="text-sm text-gray-500 mb-3 leading-relaxed">
                Machine learning for asset valuation and market predictions.
              </p>
              <span className="text-xs text-gray-400">2024</span>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-medium mx-auto mb-4">
                Q4
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-3">Global Expansion</h3>
              <p className="text-sm text-gray-500 mb-3 leading-relaxed">
                International regulatory compliance and market expansion.
              </p>
              <span className="text-xs text-gray-400">2024</span>
            </div>
          </div>
        </section>
      </div>

      {/* Interoperability & Ecosystem */}
      <section className="px-8 py-12 max-w-6xl mx-auto">
        <div className="mb-8">
          <h3 className="text-2xl font-light text-gray-900 mb-4">Interoperability & Ecosystem</h3>
          <p className="text-gray-600">Connecting with the broader Web3 world through strategic integrations</p>
        </div>
        <div className="relative overflow-hidden">
          <div className="flex animate-pulse">
            <div className="min-w-80 bg-white border border-gray-200 rounded-xl p-6 mr-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <Network className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Cross-Chain Bridges</h3>
              <p className="text-sm text-gray-500">Seamless asset movement between Ethereum, Polygon, and other networks.</p>
            </div>

            <div className="min-w-80 bg-white border border-gray-200 rounded-xl p-6 mr-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <Code className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Developer APIs</h3>
              <p className="text-sm text-gray-500">Comprehensive APIs for third-party integrations and custom applications.</p>
            </div>

            <div className="min-w-80 bg-white border border-gray-200 rounded-xl p-6 mr-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <Wallet className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Wallet Compatibility</h3>
              <p className="text-sm text-gray-500">Support for MetaMask, WalletConnect, and all major Web3 wallets.</p>
            </div>

            <div className="min-w-80 bg-white border border-gray-200 rounded-xl p-6 mr-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">DeFi Integrations</h3>
              <p className="text-sm text-gray-500">Native integration with leading DeFi protocols for enhanced liquidity.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-8 py-20 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-light text-gray-900 mb-4">Ready to Explore Our Technology?</h2>
        <p className="text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
          Dive deeper into our technical documentation, explore our APIs, or join our 
          developer community to build the future of tokenized luxury assets.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <button 
            onClick={() => setCurrentPage('dashboard')}
            className="bg-gray-900 text-white px-8 py-3 rounded-md text-sm hover:bg-gray-800 transition-colors flex items-center justify-center"
          >
            View Documentation
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
          <button 
            onClick={() => setCurrentPage('dashboard')}
            className="border border-gray-200 text-gray-700 px-8 py-3 rounded-md text-sm hover:bg-gray-50 transition-colors"
          >
            Join Developer Community
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

export default Technology;