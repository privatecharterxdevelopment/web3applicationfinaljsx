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
  Info
} from 'lucide-react';

interface ServicesProps {
  setCurrentPage: (page: string) => void;
}

function Services({ setCurrentPage }: ServicesProps) {
  const [expandedFaq, setExpandedFaq] = React.useState<string | null>(null);

  const toggleFaq = (faqId: string) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-4">
      <LandingHeader />

      {/* Hero Section - Direct on background, no white floating component */}
      <section className="px-4 sm:px-8 py-12 sm:py-24 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Content */}
          <div>
            <div className="mb-8">
              <span className="bg-gray-900 text-white px-4 py-2 rounded-full text-xs font-medium tracking-wide uppercase">
                Web3 Blockchain Infrastructure
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 mb-6 sm:mb-8 leading-tight tracking-tight">
              Build the future with<br />
              <span className="text-gray-400">decentralized technology</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed">
              From smart contracts to full-scale DeFi protocols, we provide comprehensive
              blockchain development services that power the next generation of Web3 applications.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className="bg-gray-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-md text-sm hover:bg-gray-800 transition-colors"
              >
                Start Your Project
              </button>
              <button
                onClick={() => setCurrentPage('dashboard')}
                className="border border-gray-300 text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-md text-sm hover:bg-gray-50 transition-colors"
              >
                View Portfolio
              </button>
            </div>
          </div>

          {/* Right side - Stats/Features */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Code className="w-6 h-6 text-gray-700" />
                </div>
                <span className="text-2xl font-light text-gray-900">500+</span>
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">Smart Contracts Deployed</h3>
              <p className="text-sm text-gray-500">Across multiple blockchain networks</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-700" />
                </div>
                <span className="text-2xl font-light text-gray-900">150+</span>
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">Projects Delivered</h3>
              <p className="text-sm text-gray-500">From startups to enterprise solutions</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-gray-700" />
                </div>
                <span className="text-2xl font-light text-gray-900">100%</span>
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">Security Audited</h3>
              <p className="text-sm text-gray-500">Every contract thoroughly tested</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Services - More detailed with descriptions */}
      <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-6 leading-tight">
            What Web3 Services Do We Provide?
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
            Comprehensive blockchain infrastructure and development services designed to power
            the next generation of decentralized applications and digital economies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer">
            {/* Header Image */}
            <div className="w-full h-32 bg-gray-100 border-b border-gray-200 flex items-center justify-center">
              <Code className="w-12 h-12 text-gray-500" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">
                Smart Contract Development
                <br />
                <span className="text-gray-400 text-sm">Solidity & Rust Experts</span>
              </h3>
              <p className="text-gray-600 text-sm leading-snug mb-3">
                Custom smart contracts built with Solidity, Rust, or other blockchain languages.
                We handle everything from simple token contracts to complex DeFi protocols with
                comprehensive testing and optimization.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                  ERC-20, ERC-721, ERC-1400 tokens
                </span>
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                  Multi-sig wallets
                </span>
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                  Governance contracts
                </span>
              </div>
              <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
                +
              </div>
            </div>
          </div>

          <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer">
            {/* Header Image */}
            <div className="w-full h-32 bg-gray-100 border-b border-gray-200 flex items-center justify-center">
              <Layers className="w-12 h-12 text-gray-500" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">
                DeFi Protocol Development
                <br />
                <span className="text-gray-400 text-sm">AMMs & Yield Farming</span>
              </h3>
              <p className="text-gray-600 text-sm leading-snug mb-3">
                Build sophisticated decentralized finance applications including DEXs, lending
                platforms, yield farming protocols, and automated market makers with advanced
                tokenomics and liquidity management.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                  Automated Market Makers (AMM)
                </span>
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                  Lending protocols
                </span>
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                  Yield farming strategies
                </span>
              </div>
              <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
                +
              </div>
            </div>
          </div>

          <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer">
            {/* Header Image */}
            <div className="w-full h-32 bg-gray-100 border-b border-gray-200 flex items-center justify-center">
              <Users className="w-12 h-12 text-gray-500" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">
                DAO & Governance Systems
                <br />
                <span className="text-gray-400 text-sm">Decentralized Organizations</span>
              </h3>
              <p className="text-gray-600 text-sm leading-snug mb-3">
                Create decentralized autonomous organizations with sophisticated governance
                mechanisms, voting systems, treasury management, and proposal execution
                frameworks for community-driven decision making.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                  Governance token design
                </span>
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                  Voting mechanisms
                </span>
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                  Treasury management
                </span>
              </div>
              <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
                +
              </div>
            </div>
          </div>

          <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer">
            {/* Header Image */}
            <div className="w-full h-32 bg-gray-100 border-b border-gray-200 flex items-center justify-center">
              <Network className="w-12 h-12 text-gray-500" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">
                Cross-Chain Solutions
                <br />
                <span className="text-gray-400 text-sm">Bridge Protocols</span>
              </h3>
              <p className="text-gray-600 text-sm leading-snug mb-3">
                Enable seamless interoperability between different blockchain networks with
                bridge protocols, cross-chain messaging, and multi-chain asset management
                for maximum flexibility and reach.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                  Asset bridge protocols
                </span>
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                  Cross-chain messaging
                </span>
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">
                  Multi-chain deployment
                </span>
              </div>
              <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
                +
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Grid - Additional Services */}
      <section className="px-8 py-12 max-w-6xl mx-auto">
        <div className="mb-8">
          <h3 className="text-2xl font-light text-gray-900 mb-4">Additional Blockchain Services</h3>
          <p className="text-gray-600">Specialized services to complete your Web3 ecosystem</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer p-6">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">Security Audits</h3>
            <p className="text-gray-600 text-sm leading-snug mb-4">Comprehensive smart contract security assessments and vulnerability testing.</p>
            <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
              +
            </div>
          </div>

          <div className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer p-6">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Database className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">IPFS Integration</h3>
            <p className="text-gray-600 text-sm leading-snug mb-4">Decentralized storage solutions for your dApp's data and media files.</p>
            <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
              +
            </div>
          </div>

          <div className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer p-6">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">Node Infrastructure</h3>
            <p className="text-gray-600 text-sm leading-snug mb-4">Managed blockchain nodes and RPC endpoints for reliable connectivity.</p>
            <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
              +
            </div>
          </div>

          <div className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer p-6">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Smartphone className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">Mobile dApp Development</h3>
            <p className="text-gray-600 text-sm leading-snug mb-4">Native mobile applications with Web3 wallet integration and blockchain connectivity.</p>
            <div className="w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 group-hover:rotate-90">
              +
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        {/* How Our Web3 Development Process Works - Timeline Map */}
        <section className="px-8 py-20 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-gray-900 mb-6 leading-tight">
              How Our Web3<br />
              <span className="font-medium">Development Process Works</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              From initial consultation to post-launch support, our proven methodology
              ensures successful Web3 project delivery.
            </p>
          </div>

          {/* Modern Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-medium mx-auto mb-4">
                01
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-3">Discovery & Strategy</h3>
              <p className="text-sm text-gray-500 mb-3 leading-relaxed">
                Requirements analysis and technical architecture design.
              </p>
              <span className="text-xs text-gray-400">1-2 weeks</span>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-medium mx-auto mb-4">
                02
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-3">Development & Testing</h3>
              <p className="text-sm text-gray-500 mb-3 leading-relaxed">
                Smart contract development with comprehensive testing.
              </p>
              <span className="text-xs text-gray-400">4-12 weeks</span>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-medium mx-auto mb-4">
                03
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-3">Security & Audit</h3>
              <p className="text-sm text-gray-500 mb-3 leading-relaxed">
                Thorough security audits and vulnerability assessments.
              </p>
              <span className="text-xs text-gray-400">1-3 weeks</span>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-medium mx-auto mb-4">
                04
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-3">Launch & Scale</h3>
              <p className="text-sm text-gray-500 mb-3 leading-relaxed">
                Mainnet deployment with ongoing monitoring and support.
              </p>
              <span className="text-xs text-gray-400">Ongoing</span>
            </div>
          </div>
        </section>
      </div>

      {/* Service Packages */}
      <section className="px-8 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-light text-gray-900 mb-4 leading-tight">
            Choose Your Development Package
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Flexible service packages designed to meet your Web3 development needs,
            from simple smart contracts to complex DeFi protocols.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter Tier */}
          <div className="bg-white border border-gray-100 rounded-xl p-8 hover:shadow-lg transition-shadow duration-300">
            <div className="text-center mb-8">
              <h3 className="text-xl font-medium text-gray-900 mb-2">Starter</h3>
              <p className="text-gray-400 text-sm mb-6">Perfect for simple projects</p>
              <div className="text-3xl font-light text-gray-900 mb-2">$5K - $15K</div>
              <p className="text-xs text-gray-400">One-time project fee</p>
            </div>
            <div className="space-y-4 mb-8">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-3" />
                <span className="text-sm text-gray-600">Basic smart contract</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-3" />
                <span className="text-sm text-gray-600">Token creation (ERC-20)</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-3" />
                <span className="text-sm text-gray-600">Basic security audit</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-3" />
                <span className="text-sm text-gray-600">Testnet deployment</span>
              </div>
            </div>
            <button className="w-full border border-gray-200 text-gray-700 py-3 rounded-md text-sm hover:bg-gray-50 transition-colors">
              <span onClick={() => setCurrentPage('dashboard')}>Get Started</span>
            </button>
          </div>

          {/* Professional Tier */}
          <div className="bg-gray-900 text-white rounded-xl p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-white text-gray-900 px-3 py-1 rounded-full text-xs font-medium">
              Most Popular
            </div>
            <div className="text-center mb-8">
              <h3 className="text-xl font-medium mb-2">Professional</h3>
              <p className="text-gray-400 text-sm mb-6">For complex dApps</p>
              <div className="text-3xl font-light mb-2">$25K - $75K</div>
              <p className="text-xs text-gray-400">Full development cycle</p>
            </div>
            <div className="space-y-4 mb-8">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-400 mr-3" />
                <span className="text-sm">Complex smart contracts</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-400 mr-3" />
                <span className="text-sm">Full dApp development</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-400 mr-3" />
                <span className="text-sm">Comprehensive audit</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-400 mr-3" />
                <span className="text-sm">Multi-chain deployment</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-400 mr-3" />
                <span className="text-sm">3 months support</span>
              </div>
            </div>
            <button className="w-full bg-white text-gray-900 py-3 rounded-md text-sm hover:bg-gray-100 transition-colors">
              <span onClick={() => setCurrentPage('dashboard')}>Start Project</span>
            </button>
          </div>

          {/* Enterprise Tier */}
          <div className="bg-white border border-gray-100 rounded-xl p-8 hover:shadow-lg transition-shadow duration-300">
            <div className="text-center mb-8">
              <h3 className="text-xl font-medium text-gray-900 mb-2">Enterprise</h3>
              <p className="text-gray-400 text-sm mb-6">Custom blockchain solutions</p>
              <div className="text-3xl font-light text-gray-900 mb-2">$100K+</div>
              <p className="text-xs text-gray-400">Tailored solutions</p>
            </div>
            <div className="space-y-4 mb-8">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-3" />
                <span className="text-sm text-gray-600">Custom blockchain</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-3" />
                <span className="text-sm text-gray-600">DeFi protocol development</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-3" />
                <span className="text-sm text-gray-600">Advanced security</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-3" />
                <span className="text-sm text-gray-600">Dedicated team</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-3" />
                <span className="text-sm text-gray-600">Ongoing support</span>
              </div>
            </div>
            <button className="w-full border border-gray-200 text-gray-700 py-3 rounded-md text-sm hover:bg-gray-50 transition-colors">
              <span onClick={() => setCurrentPage('dashboard')}>Contact Sales</span>
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-8 py-20 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light text-gray-900 mb-2">Web3 Development Questions?</h2>
          <h3 className="text-xl font-light text-gray-500">We Have Answers</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* FAQ 1 */}
          <div
            onClick={() => toggleFaq('faq1')}
            className="bg-white border border-gray-100 p-6 rounded-lg cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-light text-gray-900">What blockchain networks do you support?</h4>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedFaq === 'faq1' ? 'rotate-180' : ''}`} />
            </div>
            {expandedFaq === 'faq1' && (
              <p className="mt-3 text-xs text-gray-600 leading-relaxed">
                We support Ethereum, Polygon, Binance Smart Chain, Solana, Avalanche, and custom EVM-compatible networks.
              </p>
            )}
          </div>

          {/* FAQ 2 */}
          <div
            onClick={() => toggleFaq('faq2')}
            className="bg-white border border-gray-100 p-6 rounded-lg cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-light text-gray-900">How long does smart contract development take?</h4>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedFaq === 'faq2' ? 'rotate-180' : ''}`} />
            </div>
            {expandedFaq === 'faq2' && (
              <p className="mt-3 text-xs text-gray-600 leading-relaxed">
                Simple contracts take 2-4 weeks, while complex DeFi protocols can take 2-4 months including testing and audits.
              </p>
            )}
          </div>

          {/* FAQ 3 */}
          <div
            onClick={() => toggleFaq('faq3')}
            className="bg-white border border-gray-100 p-6 rounded-lg cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-light text-gray-900">Do you provide ongoing maintenance and support?</h4>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedFaq === 'faq3' ? 'rotate-180' : ''}`} />
            </div>
            {expandedFaq === 'faq3' && (
              <p className="mt-3 text-xs text-gray-600 leading-relaxed">
                Yes, all packages include post-launch support. Professional tier includes 3 months, Enterprise includes ongoing support.
              </p>
            )}
          </div>

          {/* FAQ 4 */}
          <div
            onClick={() => toggleFaq('faq4')}
            className="bg-white border border-gray-100 p-6 rounded-lg cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-light text-gray-900">What's included in a security audit?</h4>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedFaq === 'faq4' ? 'rotate-180' : ''}`} />
            </div>
            {expandedFaq === 'faq4' && (
              <p className="mt-3 text-xs text-gray-600 leading-relaxed">
                Comprehensive code review, vulnerability assessment, gas optimization analysis, and detailed security report with recommendations.
              </p>
            )}
          </div>

          {/* FAQ 5 */}
          <div
            onClick={() => toggleFaq('faq5')}
            className="bg-white border border-gray-100 p-6 rounded-lg cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-light text-gray-900">Can you integrate with existing systems?</h4>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedFaq === 'faq5' ? 'rotate-180' : ''}`} />
            </div>
            {expandedFaq === 'faq5' && (
              <p className="mt-3 text-xs text-gray-600 leading-relaxed">
                Absolutely. We can integrate blockchain functionality with your existing web2 infrastructure, databases, and APIs.
              </p>
            )}
          </div>

          {/* FAQ 6 */}
          <div
            onClick={() => toggleFaq('faq6')}
            className="bg-white border border-gray-100 p-6 rounded-lg cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-light text-gray-900">What are your development methodologies?</h4>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedFaq === 'faq6' ? 'rotate-180' : ''}`} />
            </div>
            {expandedFaq === 'faq6' && (
              <p className="mt-3 text-xs text-gray-600 leading-relaxed">
                We follow Agile development with sprint-based delivery, continuous testing, and regular client communication throughout the project.
              </p>
            )}
          </div>

          {/* FAQ 7 */}
          <div
            onClick={() => toggleFaq('faq7')}
            className="bg-white border border-gray-100 p-6 rounded-lg cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-light text-gray-900">Do you offer training for our team?</h4>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedFaq === 'faq7' ? 'rotate-180' : ''}`} />
            </div>
            {expandedFaq === 'faq7' && (
              <p className="mt-3 text-xs text-gray-600 leading-relaxed">
                Yes, we provide comprehensive training and documentation to help your team understand and maintain the blockchain solutions.
              </p>
            )}
          </div>

          {/* FAQ 8 */}
          <div
            onClick={() => toggleFaq('faq8')}
            className="bg-white border border-gray-100 p-6 rounded-lg cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-light text-gray-900">How do you handle regulatory compliance?</h4>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedFaq === 'faq8' ? 'rotate-180' : ''}`} />
            </div>
            {expandedFaq === 'faq8' && (
              <p className="mt-3 text-xs text-gray-600 leading-relaxed">
                We work with legal experts to ensure compliance with relevant regulations including KYC/AML, securities laws, and data protection.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-8 py-20 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-light text-gray-900 mb-4">Ready to Build the Future?</h2>
        <p className="text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
          Join the Web3 revolution with our expert blockchain development services.
          Let's build something amazing together.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="bg-gray-900 text-white px-8 py-3 rounded-md text-sm hover:bg-gray-800 transition-colors flex items-center justify-center"
          >
            Start Your Project
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
          <button
            onClick={() => setCurrentPage('dashboard')}
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
  )
}

export default Services;
