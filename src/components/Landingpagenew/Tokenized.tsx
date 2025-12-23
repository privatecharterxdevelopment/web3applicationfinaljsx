import React, { useState } from 'react';
import LandingHeader from './LandingHeader';
import Footer from './Footer';
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
  Recycle,
  Activity
} from 'lucide-react';

interface TokenizedProps {
  setCurrentPage: (page: string) => void;
}

function Tokenized({ setCurrentPage }: TokenizedProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const handleGetStarted = () => {
    setCurrentPage('dashboard');
  };

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-4">
      <LandingHeader />

      {/* Hero Section */}
      <section className="px-4 sm:px-8 py-12 sm:py-16 max-w-7xl mx-auto mb-6 sm:mb-8">
        <div className="text-center">
          <div className="mb-6">
            <span className="bg-gray-900/80 backdrop-blur-sm text-white px-3 sm:px-4 py-2 rounded-full text-xs font-medium tracking-wide uppercase border border-gray-800">
              Real World Asset Tokenization
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 mb-4 sm:mb-6 leading-tight tracking-tight">
            Tokenize the world of<br />
            <span className="text-gray-500">luxury travel & sustainability</span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed px-4">
            Transform real-world luxury assets into digital tokens. From private jets and yachts to
            limousine fleets and helicopter operations — unlock fractional ownership, generate yield,
            and trade sustainability certificates on the blockchain.
          </p>
        </div>
      </section>

      {/* Apple-Style Cards Section */}
      <section className="px-4 sm:px-8 py-8 sm:py-12 max-w-7xl mx-auto">
        {/* Cards Grid - 4 Cards in Single Row (Apple Style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 - For Asset Owners */}
            <div
              onClick={() => toggleCard('owners')}
              className="group bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
            >
              <div className="p-6">
                <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">
                  For Asset Owners
                  <br />
                  <span className="text-gray-400 text-sm">Unlock Liquidity</span>
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">SEC Compliant</span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Global Access</span>
                </div>
                <div className={`w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 ${expandedCard === 'owners' ? 'rotate-45' : 'group-hover:rotate-90'}`}>
                  +
                </div>
                {/* Expandable Content */}
                <div className={`overflow-hidden transition-all duration-300 ${expandedCard === 'owners' ? 'max-h-64 mt-4 pt-4 border-t border-gray-100' : 'max-h-0'}`}>
                  <p className="text-gray-600 text-sm leading-snug mb-3">Transform your jets, yachts, and fleets into tradeable digital securities.</p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-gray-600" />
                      <span>Raise capital without selling</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-gray-600" />
                      <span>Maintain operational control</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Card 2 - For Investors */}
            <div
              onClick={() => toggleCard('investors')}
              className="group bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
            >
              <div className="p-6">
                <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">
                  For Investors
                  <br />
                  <span className="text-gray-400 text-sm">Fractional Ownership</span>
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">From $10'000</span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Passive Income</span>
                </div>
                <div className={`w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 ${expandedCard === 'investors' ? 'rotate-45' : 'group-hover:rotate-90'}`}>
                  +
                </div>
                {/* Expandable Content */}
                <div className={`overflow-hidden transition-all duration-300 ${expandedCard === 'investors' ? 'max-h-64 mt-4 pt-4 border-t border-gray-100' : 'max-h-0'}`}>
                  <p className="text-gray-600 text-sm leading-snug mb-3">Access luxury assets from $10'000 with 8-15% projected APY returns.</p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-gray-600" />
                      <span>Trade on secondary markets</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-gray-600" />
                      <span>Blockchain-verified ownership</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Card 3 - Blockchain Verified */}
            <div
              onClick={() => toggleCard('blockchain')}
              className="group bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
            >
              <div className="p-6">
                <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">
                  Blockchain Verified
                  <br />
                  <span className="text-gray-400 text-sm">100% Transparent</span>
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Smart Contracts</span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Audited</span>
                </div>
                <div className={`w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 ${expandedCard === 'blockchain' ? 'rotate-45' : 'group-hover:rotate-90'}`}>
                  +
                </div>
                {/* Expandable Content */}
                <div className={`overflow-hidden transition-all duration-300 ${expandedCard === 'blockchain' ? 'max-h-64 mt-4 pt-4 border-t border-gray-100' : 'max-h-0'}`}>
                  <p className="text-gray-600 text-sm leading-snug mb-3">Every transaction recorded on-chain with immutable ownership records.</p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-gray-600" />
                      <span>Base & Ethereum networks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-gray-600" />
                      <span>Real-time auditing</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Card 4 - Secondary Markets */}
            <div
              onClick={() => toggleCard('markets')}
              className="group bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
            >
              <div className="p-6">
                <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">
                  Secondary Markets
                  <br />
                  <span className="text-gray-400 text-sm">24/7 Trading</span>
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Liquid Exit</span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">No Lock-up</span>
                </div>
                <div className={`w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 ${expandedCard === 'markets' ? 'rotate-45' : 'group-hover:rotate-90'}`}>
                  +
                </div>
                {/* Expandable Content */}
                <div className={`overflow-hidden transition-all duration-300 ${expandedCard === 'markets' ? 'max-h-64 mt-4 pt-4 border-t border-gray-100' : 'max-h-0'}`}>
                  <p className="text-gray-600 text-sm leading-snug mb-3">Trade your tokens anytime on our integrated secondary marketplace.</p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-gray-600" />
                      <span>Instant liquidity</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-gray-600" />
                      <span>Price discovery</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        {/* 2 Wider Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Wide Card 1 - Complete Tokenization Process */}
          <div
            onClick={() => toggleCard('process')}
            className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-light text-gray-900 mb-2 leading-tight">
                    Complete Tokenization Process
                    <br />
                    <span className="text-gray-400 text-sm">From Asset to Token in Days</span>
                  </h3>
                  <p className="text-gray-600 text-sm leading-snug">
                    Our end-to-end tokenization framework handles everything — legal structure, smart contracts,
                    compliance, and distribution — so you can focus on your business.
                  </p>
                </div>
                <div className={`w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 flex-shrink-0 ml-4 ${expandedCard === 'process' ? 'rotate-45' : 'group-hover:rotate-90'}`}>
                  +
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">SPV Setup</span>
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Smart Contracts</span>
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Legal Framework</span>
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Distribution</span>
              </div>
              {/* Expandable Content */}
              <div className={`overflow-hidden transition-all duration-300 ${expandedCard === 'process' ? 'max-h-64 pt-4 border-t border-gray-100' : 'max-h-0'}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span>Asset valuation & due diligence</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span>Legal entity structuring</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span>Regulatory compliance</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span>Smart contract deployment</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span>Token minting & KYC</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span>Secondary market listing</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wide Card 2 - Yield Generation */}
          <div
            onClick={() => toggleCard('yield')}
            className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-light text-gray-900 mb-2 leading-tight">
                    Yield Generation & Returns
                    <br />
                    <span className="text-gray-400 text-sm">8-15% Projected APY</span>
                  </h3>
                  <p className="text-gray-600 text-sm leading-snug">
                    Earn passive income from real-world asset operations. Our tokenized assets generate
                    yield through charter operations, rentals, and appreciation.
                  </p>
                </div>
                <div className={`w-6 h-6 flex items-center justify-center text-gray-900 text-xl font-light transition-transform duration-300 flex-shrink-0 ml-4 ${expandedCard === 'yield' ? 'rotate-45' : 'group-hover:rotate-90'}`}>
                  +
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Charter Revenue</span>
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Rental Income</span>
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Asset Appreciation</span>
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Quarterly Dividends</span>
              </div>
              {/* Expandable Content */}
              <div className={`overflow-hidden transition-all duration-300 ${expandedCard === 'yield' ? 'max-h-64 pt-4 border-t border-gray-100' : 'max-h-0'}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span>Automated dividend distribution</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span>Real-time revenue tracking</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span>Transparent fee structure</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span>Historical performance data</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span>Portfolio diversification</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span>Tax-efficient structures</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 1 Bigger Card - Full Width */}
        <div className="mt-4">
          <div
            onClick={() => toggleCard('ecosystem')}
            className="group bg-gray-200/60 backdrop-blur-md border border-gray-300 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
          >
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="max-w-3xl">
                  <h3 className="text-xl sm:text-2xl font-light text-gray-900 leading-tight">
                    The Complete RWA Ecosystem
                    <br />
                    <span className="text-gray-600 text-base">From Private Jets to Carbon Credits — All on One Platform</span>
                  </h3>
                </div>
                <div className={`w-8 h-8 flex items-center justify-center text-gray-900 text-2xl font-light transition-transform duration-300 flex-shrink-0 ml-6 ${expandedCard === 'ecosystem' ? 'rotate-45' : 'group-hover:rotate-90'}`}>
                  +
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="bg-gray-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white border border-gray-800">Aviation</span>
                <span className="bg-gray-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white border border-gray-800">Maritime</span>
                <span className="bg-gray-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white border border-gray-800">Ground Transport</span>
                <span className="bg-gray-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white border border-gray-800">Carbon Credits</span>
                <span className="bg-gray-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white border border-gray-800">SAF</span>
                <span className="bg-gray-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white border border-gray-800">Real Estate</span>
              </div>
              {/* Expandable Content */}
              <div className={`overflow-hidden transition-all duration-300 ${expandedCard === 'ecosystem' ? 'max-h-[500px] pt-6 border-t border-gray-300' : 'max-h-0'}`}>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-6">
                  Privatecharterx's tokenization solutions brings together luxury travel assets, sustainability certificates,
                  and innovative mobility solutions. Whether you're tokenizing your fleet or investing in fractional
                  ownership, our ecosystem provides institutional-grade infrastructure with retail accessibility.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-gray-900 font-medium mb-3">For Asset Owners</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span>Unlock capital without selling</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span>Maintain operational control</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span>Global investor access</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-gray-900 font-medium mb-3">For Investors</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span>Start from $10'000 minimum</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span>Earn passive yields</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span>Trade on secondary markets</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-gray-900 font-medium mb-3">Platform Features</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span>Blockchain verified ownership</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span>Institutional custody</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span>Real-time reporting</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Asset Categories - Moved below RWA Ecosystem */}
      <section className="px-4 sm:px-8 pt-16 sm:pt-20 pb-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 leading-tight">
            Tokenizable Asset Categories<br />
            <span className="font-medium">Luxury Travel & Transportation Ecosystem</span>
          </h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-md text-left md:text-right leading-relaxed">
            From private aviation to luxury ground transportation, we tokenize the entire
            spectrum of premium travel assets for fractional ownership and yield generation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Aviation Assets */}
          <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer">
            <div className="w-full h-40 overflow-hidden">
              <img
                src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/tokenization-images/Whisk_3750a44ec051d509e9d4a7e31ebf8489dr.png"
                alt="Aviation Assets"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">Aviation Assets</h3>
              <p className="text-gray-600 text-sm leading-snug mb-3">
                Private jets, helicopters, eVTOLs, and aviation operators ready for tokenization.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Private jet fleets</span>
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Helicopter operations</span>
              </div>
            </div>
          </div>

          {/* Ground Transportation */}
          <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer">
            <div className="w-full h-40 overflow-hidden">
              <img
                src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/tokenization-images/Whisk_a36d4ca9db3e7489277401374f9f8db5dr.png"
                alt="Ground Transportation"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">Ground Transportation</h3>
              <p className="text-gray-600 text-sm leading-snug mb-3">
                Luxury car fleets, limousine services, and premium ground transportation companies.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Limousine companies</span>
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Luxury car fleets</span>
              </div>
            </div>
          </div>

          {/* Maritime Assets */}
          <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer">
            <div className="w-full h-40 overflow-hidden">
              <img
                src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/tokenization-images/Whisk_fb36353cc5e7e88939945cb4b6af252cdr.png"
                alt="Maritime Assets"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">Maritime Assets</h3>
              <p className="text-gray-600 text-sm leading-snug mb-3">
                Luxury yachts, charter operations, and maritime hospitality services.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Luxury yacht charters</span>
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Superyacht ownership</span>
              </div>
            </div>
          </div>

          {/* Hospitality & Experiences */}
          <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer">
            <div className="w-full h-40 overflow-hidden">
              <img
                src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/tokenization-images/Whisk_6c429fa1160c265a7da453ef3ab118fedr.png"
                alt="Hospitality & Experiences"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">Hospitality & Experiences</h3>
              <p className="text-gray-600 text-sm leading-snug mb-3">
                Luxury hotels, exclusive experiences, and premium hospitality services.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Luxury resort properties</span>
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Exclusive experiences</span>
              </div>
            </div>
          </div>

          {/* Real Estate */}
          <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer">
            <div className="w-full h-40 overflow-hidden">
              <img
                src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/tokenization-images/Whisk_2e43ce3d5799c1183784fed02bb80b67dr.png"
                alt="Travel Real Estate"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">Travel Real Estate</h3>
              <p className="text-gray-600 text-sm leading-snug mb-3">
                Airports, hangars, terminals, and travel-related real estate infrastructure.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Private hangars</span>
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Airport terminals</span>
              </div>
            </div>
          </div>

          {/* Technology & Innovation */}
          <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer">
            <div className="w-full h-40 overflow-hidden">
              <img
                src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/tokenization-images/Whisk_e206f96362f7c8f8aa7419000dd4a313dr.png"
                alt="Technology & Innovation"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-light text-gray-900 mb-3 leading-tight">Technology & Innovation</h3>
              <p className="text-gray-600 text-sm leading-snug mb-3">
                Travel tech companies, mobility platforms, and innovative transportation solutions.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Mobility platforms</span>
                <span className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700">Travel tech startups</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-8 py-16 sm:py-20 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-light text-gray-900 mb-4">How RWA Tokenization Benefits Global Economy</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          Real World Assets (RWA) are physical or tangible assets — such as private jets, real estate,
          luxury vehicles, carbon credits, and commodities — that are converted into digital tokens on the blockchain.
          RWA tokenization bridges traditional finance with decentralized technology, enabling fractional ownership,
          24/7 global trading, and unprecedented transparency.
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
      <Footer />

    </div>
  );
}

export default Tokenized;