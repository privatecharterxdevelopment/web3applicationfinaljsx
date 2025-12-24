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
  const [assetCardTab, setAssetCardTab] = useState<'tokenomics' | 'details'>('tokenomics');
  const [assetType, setAssetType] = useState<'jet' | 'yacht'>('jet');

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

      {/* Example Tokenized Asset Card - Sphera AI Style */}
      <section className="px-4 sm:px-8 pb-12 max-w-7xl mx-auto">
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #dee2e6 50%, #ced4da 75%, #adb5bd 100%)'
          }}
        >
          {/* Pattern overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(0, 0, 0, 0.03) 0%, transparent 50%),
                               radial-gradient(circle at 80% 50%, rgba(0, 0, 0, 0.03) 0%, transparent 50%),
                               radial-gradient(circle at 40% 20%, rgba(0, 0, 0, 0.02) 0%, transparent 30%)`
            }}
          />

          <div className="relative px-6 sm:px-10 py-10 sm:py-14">
            {/* Header */}
            <div className="text-center mb-8">
              {/* Asset Type Switcher */}
              <div className="inline-flex gap-1 p-1 bg-white/60 rounded-full border border-gray-200/50" style={{ backdropFilter: 'blur(10px)' }}>
                <button
                  onClick={() => { setAssetType('jet'); setAssetCardTab('tokenomics'); }}
                  className={`px-5 py-2 text-[11px] font-light tracking-wide rounded-full transition-all flex items-center gap-2 ${
                    assetType === 'jet'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Plane size={13} />
                  Private Jet
                </button>
                <button
                  onClick={() => { setAssetType('yacht'); setAssetCardTab('tokenomics'); }}
                  className={`px-5 py-2 text-[11px] font-light tracking-wide rounded-full transition-all flex items-center gap-2 ${
                    assetType === 'yacht'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Anchor size={13} />
                  Yacht
                </button>
              </div>
            </div>

            {/* Floating Card with Glassmorphism */}
            <div
              className="bg-white/95 rounded-2xl overflow-hidden shadow-2xl border border-white/50 max-w-5xl mx-auto"
              style={{ backdropFilter: 'blur(20px)' }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Left Side - Image & Badge */}
                <div className="relative h-64 lg:h-auto min-h-[320px]">
                  <img
                    src={assetType === 'jet'
                      ? "https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/tokenization-images/Whisk_d27057e0071a05888b847b5b9559a9f3eg.png"
                      : "https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/tokenization-images/Whisk_c35b6e2a9c636d9916b49ddc61a97532dr.jpeg"
                    }
                    alt={assetType === 'jet' ? "Gulfstream G650ER Token" : "Sunseeker 95 Yacht Token"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <span
                      className="text-white px-3 py-1.5 rounded-full text-[11px] font-light tracking-wide flex items-center gap-1.5 border border-white/30"
                      style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)' }}
                    >
                      <Clock size={11} />
                      Soon on Marketplace
                    </span>
                    <span
                      className="text-white px-2.5 py-1.5 rounded-full text-[10px] font-light tracking-wide border border-white/30"
                      style={{ background: 'rgba(99, 102, 241, 0.4)', backdropFilter: 'blur(10px)' }}
                    >
                      Reg-D
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-[11px] text-white/60 uppercase tracking-widest font-light mb-1">
                      {assetType === 'jet' ? 'Security Token • Aviation' : 'Security Token • Maritime'}
                    </p>
                    <h3 className="text-2xl font-light tracking-tight">
                      {assetType === 'jet' ? 'Gulfstream G650ER' : 'Sunseeker 95 Yacht'}
                    </h3>
                    <p className="text-sm text-white/70 font-light mt-1">Fractional Ownership Token</p>
                  </div>
                </div>

                {/* Right Side - Details & Chart */}
                <div className="p-6 lg:p-8">
                  {/* Tab Switcher */}
                  <div className="flex gap-1 p-1 bg-gray-100/80 rounded-lg mb-6 border border-gray-200/50">
                    <button
                      onClick={() => setAssetCardTab('tokenomics')}
                      className={`flex-1 py-2 px-3 text-[11px] font-light tracking-wide rounded-md transition-all ${
                        assetCardTab === 'tokenomics'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Tokenomics
                    </button>
                    <button
                      onClick={() => setAssetCardTab('details')}
                      className={`flex-1 py-2 px-3 text-[11px] font-light tracking-wide rounded-md transition-all ${
                        assetCardTab === 'details'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Asset Details
                    </button>
                  </div>

                  {assetCardTab === 'tokenomics' ? (
                    <>
                      {/* Token Price & Change */}
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest mb-1">Token Price</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-medium text-gray-900">
                              {assetType === 'jet' ? '$1,250' : '€430'}
                            </span>
                            <span className="text-sm font-light text-green-600 flex items-center gap-0.5">
                              <TrendingUp size={14} />
                              {assetType === 'jet' ? '+12.4%' : '+4.9%'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 font-light mt-1">
                            {assetType === 'jet' ? 'Since launch (6 months)' : 'Since launch (3 months)'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest mb-1">APY</p>
                          <span className="text-2xl font-medium text-green-600">
                            {assetType === 'jet' ? '14.2%' : '9.6%'}
                          </span>
                        </div>
                      </div>

                      {/* Mini Chart */}
                      <div className="mb-6 p-4 bg-gray-50/80 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-light text-gray-500 tracking-wide">Token Performance</span>
                          <div className="flex gap-2">
                            <button className="text-[10px] px-2 py-1 rounded bg-gray-900 text-white">6M</button>
                            <button className="text-[10px] px-2 py-1 rounded text-gray-500 hover:bg-gray-200">1Y</button>
                            <button className="text-[10px] px-2 py-1 rounded text-gray-500 hover:bg-gray-200">ALL</button>
                          </div>
                        </div>
                        {/* SVG Chart */}
                        <div className="h-24 w-full">
                          <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="chartGradientJet" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                              </linearGradient>
                              <linearGradient id="chartGradientYacht" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            {/* Area fill */}
                            <path
                              d={assetType === 'jet'
                                ? "M0,80 L30,75 L60,70 L90,65 L120,60 L150,55 L180,45 L210,50 L240,40 L270,35 L300,30 L330,25 L360,20 L400,15 L400,100 L0,100 Z"
                                : "M0,82 L80,80 L160,78 L240,75 L320,72 L400,68 L400,100 L0,100 Z"
                              }
                              fill={assetType === 'jet' ? "url(#chartGradientJet)" : "url(#chartGradientYacht)"}
                            />
                            {/* Line */}
                            <path
                              d={assetType === 'jet'
                                ? "M0,80 L30,75 L60,70 L90,65 L120,60 L150,55 L180,45 L210,50 L240,40 L270,35 L300,30 L330,25 L360,20 L400,15"
                                : "M0,82 L80,80 L160,78 L240,75 L320,72 L400,68"
                              }
                              fill="none"
                              stroke={assetType === 'jet' ? "#22c55e" : "#6366f1"}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            {/* Current point */}
                            <circle cx="400" cy={assetType === 'jet' ? 15 : 68} r="4" fill={assetType === 'jet' ? "#22c55e" : "#6366f1"} />
                          </svg>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 mt-2">
                          <span>Jun</span>
                          <span>Jul</span>
                          <span>Aug</span>
                          <span>Sep</span>
                          <span>Oct</span>
                          <span>Nov</span>
                          <span>Dec</span>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center p-3 bg-gray-50/80 rounded-lg border border-gray-100">
                          <p className="text-[10px] text-gray-400 font-light uppercase tracking-wide mb-1">Total Value</p>
                          <p className="text-sm font-medium text-gray-900">
                            {assetType === 'jet' ? '$16M' : '€4.3M'}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-gray-50/80 rounded-lg border border-gray-100">
                          <p className="text-[10px] text-gray-400 font-light uppercase tracking-wide mb-1">Token Holders</p>
                          <p className="text-sm font-medium text-gray-900">
                            {assetType === 'jet' ? '847' : '156'}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-gray-50/80 rounded-lg border border-gray-100">
                          <p className="text-[10px] text-gray-400 font-light uppercase tracking-wide mb-1">Min. Investment</p>
                          <p className="text-sm font-medium text-gray-900">
                            {assetType === 'jet' ? '$10\'000' : '€10\'000'}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar - Tokens Sold */}
                      <div className="mb-4">
                        <div className="flex justify-between text-[11px] mb-2">
                          <span className="text-gray-400 font-light tracking-wide">Tokens Sold</span>
                          <span className="text-gray-700 font-medium">
                            {assetType === 'jet' ? '42,350 / 52,000 (81.4%)' : '3,910 / 10,000 (39.1%)'}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${assetType === 'jet' ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-blue-500 to-indigo-400'}`}
                            style={{ width: assetType === 'jet' ? '81.4%' : '39.1%' }}
                          />
                        </div>
                      </div>

                      {/* Disclaimer */}
                      <p className="text-[9px] text-gray-400 font-light leading-relaxed mb-4">
                        This is not financial advice. Past performance does not guarantee future results.
                        Securities offered through PrivatecharterX and its licensed SEC partner.
                        Investment involves risk including potential loss of principal.
                      </p>
                    </>
                  ) : (
                    <>
                      {/* Asset Details Tab */}
                      <div className="space-y-4">
                        {/* Asset Info Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-gray-50/80 rounded-lg border border-gray-100">
                            <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest mb-1">
                              {assetType === 'jet' ? 'Current Location' : 'Registration'}
                            </p>
                            <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                              <Globe size={14} className="text-gray-400" />
                              {assetType === 'jet' ? 'Asia' : 'Malta'}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50/80 rounded-lg border border-gray-100">
                            <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest mb-1">Home Base</p>
                            <p className="text-sm font-medium text-gray-900">
                              {assetType === 'jet' ? 'Asia Pacific' : 'Mediterranean'}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50/80 rounded-lg border border-gray-100">
                            <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest mb-1">
                              {assetType === 'jet' ? 'Total Flight Hours' : 'Engine Hours'}
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {assetType === 'jet' ? '2,847 hrs' : '1,240 hrs'}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50/80 rounded-lg border border-gray-100">
                            <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest mb-1">
                              {assetType === 'jet' ? 'Cycles' : 'Flag State'}
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {assetType === 'jet' ? '1,423' : 'Malta'}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50/80 rounded-lg border border-gray-100">
                            <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest mb-1">Year Built</p>
                            <p className="text-sm font-medium text-gray-900">
                              {assetType === 'jet' ? '2019' : '2018'}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50/80 rounded-lg border border-gray-100">
                            <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest mb-1">Last Inspection</p>
                            <p className="text-sm font-medium text-gray-900">
                              {assetType === 'jet' ? 'Nov 2024' : 'Oct 2024'}
                            </p>
                          </div>
                        </div>

                        {/* Charter Operator */}
                        <div
                          className="p-3 rounded-lg border border-white/30"
                          style={{ background: 'rgba(99, 102, 241, 0.08)', backdropFilter: 'blur(10px)' }}
                        >
                          <p className="text-[10px] text-indigo-500 font-light uppercase tracking-widest mb-1">
                            {assetType === 'jet' ? 'Charter Operator' : 'Charter Manager'}
                          </p>
                          <p className="text-sm font-medium text-gray-900">To be announced</p>
                          <p className="text-[11px] text-gray-500 font-light mt-1">
                            {assetType === 'jet'
                              ? 'Available for charter requests via platform'
                              : 'To be announced'
                            }
                          </p>
                        </div>

                        {/* Next Maintenance */}
                        <div
                          className="p-3 rounded-lg border border-white/30"
                          style={{ background: 'rgba(245, 158, 11, 0.08)', backdropFilter: 'blur(10px)' }}
                        >
                          <p className="text-[10px] text-amber-500 font-light uppercase tracking-widest mb-1">
                            {assetType === 'jet' ? 'Next Scheduled Maintenance' : 'Next Haul-Out'}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {assetType === 'jet' ? 'Q2 2025 - C-Check' : 'Q1 2026 - Annual Survey'}
                          </p>
                        </div>

                        {/* Specs Summary */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-lg font-medium text-gray-900">
                              {assetType === 'jet' ? '19' : '12'}
                            </p>
                            <p className="text-[10px] text-gray-400 font-light">
                              {assetType === 'jet' ? 'Passengers' : 'Guests'}
                            </p>
                          </div>
                          <div>
                            <p className="text-lg font-medium text-gray-900">
                              {assetType === 'jet' ? '7,500' : '95'}
                            </p>
                            <p className="text-[10px] text-gray-400 font-light">
                              {assetType === 'jet' ? 'Range (nm)' : 'Length (ft)'}
                            </p>
                          </div>
                          <div>
                            <p className="text-lg font-medium text-gray-900">
                              {assetType === 'jet' ? 'Mach 0.925' : '24 kts'}
                            </p>
                            <p className="text-[10px] text-gray-400 font-light">Max Speed</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* CTA Buttons - Glassmorphism style */}
                  <div className="flex gap-3 mt-4">
                    <a
                      href={`mailto:admin@privatecharterx.com?subject=Investment%20Inquiry%20-%20${assetType === 'jet' ? 'Gulfstream%20G650ER' : 'Sunseeker%2095%20Yacht'}%20Token`}
                      className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-[12px] font-light tracking-wide hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <Wallet size={15} />
                      Invest Now
                    </a>
                    <button
                      className="px-4 py-3 rounded-xl text-gray-600 transition-colors border border-gray-200/50"
                      style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(10px)' }}
                    >
                      <Info size={15} />
                    </button>
                  </div>

                  {/* Trust badges */}
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-4 border-t border-gray-100">
                    <span className="flex items-center gap-1.5 text-[10px] text-gray-400 font-light tracking-wide">
                      <Fingerprint size={11} className="text-gray-300" />
                      KYC Required
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-gray-400 font-light tracking-wide">
                      <Shield size={11} className="text-gray-300" />
                      SEC Partner
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-gray-400 font-light tracking-wide">
                      <Lock size={11} className="text-gray-300" />
                      Audited
                    </span>
                  </div>

                </div>
              </div>
            </div>
          </div>
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