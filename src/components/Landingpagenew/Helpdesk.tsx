import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from './LandingHeader';
import Footer from './Footer';
import {
  Search,
  Mail,
  MessageCircle,
  Clock,
  Shield,
  Users,
  Coins,
  Plane,
  Settings,
  Car,
  Headphones,
  Anchor,
  TrendingUp,
  Leaf,
  Repeat,
  BarChart3,
  Lock,
  FileText,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Award,
  Rocket
} from 'lucide-react';

interface HelpdeskProps {
  setCurrentPage: (page: string) => void;
}

interface HelpTopic {
  id: string;
  title: string;
  icon: any;
  iconColor: string;
  description: string;
  details: string[];
  tags: string[];
}

function Helpdesk({ setCurrentPage }: HelpdeskProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  // Comprehensive help topics covering ALL platform features
  const helpTopics: HelpTopic[] = [
    {
      id: 'private-jets',
      title: 'Private Jet Charter',
      icon: Plane,
      iconColor: 'text-sky-600',
      description: 'Book private jets from our global network of 16,000+ aircraft across 150+ countries.',
      details: [
        'Browse available jets by category (Light, Midsize, Heavy, Ultra-long-range)',
        'Real-time availability and instant booking',
        'Transparent pricing with no hidden fees',
        'Safety certifications and operator vetting',
        'Custom flight planning and catering',
        'Pet-friendly and special requirements'
      ],
      tags: ['Booking', 'Fleet', 'Safety', 'Pricing']
    },
    {
      id: 'empty-legs',
      title: 'Empty Leg Flights',
      icon: TrendingUp,
      iconColor: 'text-emerald-600',
      description: 'Save up to 75% on empty leg flights - repositioning flights offered at discounted rates.',
      details: [
        'Browse real-time empty leg availability',
        'Automatic alerts for your preferred routes',
        'Flexible departure times (typically ±2 hours)',
        'Same luxury experience at fraction of the cost',
        'Book instantly or request modifications',
        'Understand empty leg terms and conditions'
      ],
      tags: ['Savings', 'Availability', 'Alerts', 'Flexibility']
    },
    {
      id: 'helicopters',
      title: 'Helicopter Services',
      icon: Repeat,
      iconColor: 'text-purple-600',
      description: 'Short-range helicopter transfers for city connections, events, and scenic tours.',
      details: [
        'City-to-city helicopter transfers',
        'Event transport and VIP arrivals',
        'Scenic tours and photography flights',
        'Helipad access and landing permissions',
        'Multi-leg helicopter journeys',
        'Emergency medical transfers (subject to availability)'
      ],
      tags: ['Transfers', 'Events', 'Tours', 'Landing']
    },
    {
      id: 'yachts',
      title: 'Yacht Charter & Adventures',
      icon: Anchor,
      iconColor: 'text-blue-600',
      description: 'Luxury yacht charters and curated adventure packages in premium destinations worldwide.',
      details: [
        'Motor yachts, sailing yachts, and catamarans',
        'Mediterranean, Caribbean, and exotic destinations',
        'Crewed charters with captain and chef',
        'Adventure packages: diving, fishing, island hopping',
        'Multi-day itineraries and custom routes',
        'Yacht specifications and crew requirements'
      ],
      tags: ['Luxury', 'Destinations', 'Crew', 'Adventures']
    },
    {
      id: 'ground-transport',
      title: 'Ground Transportation',
      icon: Car,
      iconColor: 'text-green-600',
      description: 'Seamless luxury ground transportation with chauffeur services and airport transfers.',
      details: [
        'Airport pickup and drop-off coordination',
        'Luxury sedan, SUV, and van options',
        'Professional chauffeurs with local knowledge',
        'Door-to-door service integration',
        'Multi-city ground arrangements',
        'Event transportation and group transfers'
      ],
      tags: ['Airport', 'Chauffeur', 'Luxury Cars', 'Coordination']
    },
    {
      id: 'tokenization',
      title: 'Asset Tokenization',
      icon: Coins,
      iconColor: 'text-purple-600',
      description: 'Transform aviation assets into blockchain tokens for fractional ownership and transparent trading.',
      details: [
        'What is asset tokenization and how it works',
        'Legal framework and regulatory compliance',
        'Smart contract deployment on Base blockchain',
        'Fractional ownership structure and benefits',
        'Secondary market trading opportunities',
        'Dividend distribution and governance rights',
        'Required documentation (AOC, insurance, valuation)'
      ],
      tags: ['Blockchain', 'Fractional', 'Smart Contracts', 'Compliance']
    },
    {
      id: 'daos',
      title: 'DAO Creation & Management',
      icon: Users,
      iconColor: 'text-indigo-600',
      description: 'Create and manage Decentralized Autonomous Organizations for collective asset governance.',
      details: [
        'DAO structure and governance models',
        'Aragon & Safe integration for DAO deployment',
        'Voting mechanisms and proposal systems',
        'Treasury management and multi-signature security',
        'Member onboarding and role assignments',
        'DAO legal wrappers and tax considerations',
        'Token-based voting vs reputation-based voting'
      ],
      tags: ['Governance', 'Aragon', 'Voting', 'Treasury']
    },
    {
      id: 'launchpad',
      title: 'Token Launchpad',
      icon: Rocket,
      iconColor: 'text-orange-600',
      description: 'Launch your tokenized aviation project with built-in marketing, fundraising, and investor tools.',
      details: [
        'Create presale campaigns for your token',
        'Set funding goals, token price, and vesting schedules',
        'KYC/AML verification for investors',
        'Marketing tools and project visibility',
        'Investor dashboard and reporting',
        'Liquidity pool creation after launch',
        'Claim management and token distribution'
      ],
      tags: ['Presale', 'Fundraising', 'KYC', 'Distribution']
    },
    {
      id: 'escrow',
      title: 'Safe Escrow Accounts',
      icon: Lock,
      iconColor: 'text-gray-700',
      description: 'Multi-signature escrow wallets powered by Safe Global for secure transactions.',
      details: [
        'How Safe multi-signature wallets work',
        'Creating escrow accounts (Classic 1.5% or Managed 2.5%)',
        'Adding co-signers and setting thresholds',
        'Transaction approval workflow',
        'Fee structures and dispute resolution',
        'Network support (Ethereum, Base, Polygon, Arbitrum)',
        'Smart contract audit and security'
      ],
      tags: ['Multi-sig', 'Safe', 'Security', 'Escrow']
    },
    {
      id: 'token-swap',
      title: 'Token Swap & Exchange',
      icon: Repeat,
      iconColor: 'text-cyan-600',
      description: 'Swap between cryptocurrencies and tokens directly on our platform.',
      details: [
        'Supported tokens and trading pairs',
        'Slippage tolerance and price impact',
        'Liquidity pools and automated market makers',
        'Gas fee estimation and optimization',
        'Transaction monitoring and status',
        'Wallet connection requirements',
        'Cross-chain swaps and bridge integration'
      ],
      tags: ['DeFi', 'Liquidity', 'Trading', 'Cross-chain']
    },
    {
      id: 'co2-certificates',
      title: 'CO2 Offset Certificates',
      icon: Leaf,
      iconColor: 'text-green-600',
      description: 'Purchase verified carbon offset certificates to neutralize your travel emissions.',
      details: [
        'How carbon offsets work in aviation',
        'Verified Carbon Standard (VCS) certification',
        'Calculate your flight emissions',
        'Purchase and retirement of carbon credits',
        'NFT-based certificate of offset',
        'Project transparency and impact reporting',
        'Corporate carbon offset programs'
      ],
      tags: ['Sustainability', 'NFT', 'Verified', 'Impact']
    },
    {
      id: 'nft-membership',
      title: 'NFT Membership Cards',
      icon: Award,
      iconColor: 'text-pink-600',
      description: 'Exclusive membership tiers with NFT-based access to premium benefits and discounts.',
      details: [
        'Membership tiers: Standard, Gold, Platinum, Diamond',
        'Discount structures and booking priority',
        'NFT minting and wallet storage',
        'Transferability and secondary market',
        'Staking benefits and reward programs',
        'Exclusive events and partner perks',
        'How to upgrade your membership'
      ],
      tags: ['Benefits', 'Discounts', 'Exclusive', 'Tiers']
    },
    {
      id: 'wallet-crypto',
      title: 'Wallet & Crypto Payments',
      icon: CreditCard,
      iconColor: 'text-yellow-600',
      description: 'Connect your Web3 wallet and pay with cryptocurrency for all services.',
      details: [
        'Supported wallets (MetaMask, WalletConnect, Coinbase)',
        'Accepted cryptocurrencies (ETH, USDC, PCX token)',
        'Network selection (Base, Ethereum, Polygon)',
        'Transaction confirmations and receipts',
        'Gas fee explanations and optimization',
        'Wallet security best practices',
        'Fiat on-ramp integration'
      ],
      tags: ['MetaMask', 'USDC', 'ETH', 'Gas Fees']
    },
    {
      id: 'kyc-verification',
      title: 'KYC & Account Verification',
      icon: Shield,
      iconColor: 'text-red-600',
      description: 'Complete identity verification to access all platform features and higher transaction limits.',
      details: [
        'Why KYC is required for aviation services',
        'Document requirements (ID, proof of address)',
        'Verification timeline and status tracking',
        'Privacy and data protection measures',
        'Institutional KYC for corporate accounts',
        'Re-verification and document updates',
        'Appeal rejected verifications'
      ],
      tags: ['Identity', 'Compliance', 'Privacy', 'Corporate']
    },
    {
      id: 'partners',
      title: 'Find a Partner',
      icon: Users,
      iconColor: 'text-blue-600',
      description: 'Connect with verified operators, service providers, and blockchain partners in our network.',
      details: [
        'Browse licensed aviation operators',
        'Filter by region, aircraft type, and services',
        'Partner vetting and certification process',
        'Service provider categories and ratings',
        'Technology partners and integrations',
        'Partnership opportunities for operators',
        'Request direct introductions'
      ],
      tags: ['Network', 'Operators', 'Verified', 'Integration']
    },
    {
      id: 'booking-requests',
      title: 'Booking Requests & Quotes',
      icon: FileText,
      iconColor: 'text-amber-600',
      description: 'Submit custom booking requests and receive personalized quotes from operators.',
      details: [
        'How to submit a booking request',
        'Required information for accurate quotes',
        'Quote comparison and operator selection',
        'Negotiation and custom requirements',
        'Booking confirmations and contracts',
        'Modify or cancel requests',
        'Track request status in dashboard'
      ],
      tags: ['Quotes', 'Custom', 'Comparison', 'Status']
    },
    {
      id: 'ai-concierge',
      title: 'AI Travel Concierge',
      icon: Sparkles,
      iconColor: 'text-violet-600',
      description: 'Chat with our AI assistant to search flights, get recommendations, and book services.',
      details: [
        'Natural language search for flights and services',
        'Personalized recommendations based on preferences',
        'Multi-leg journey planning',
        'Real-time availability and pricing',
        'Booking assistance and modifications',
        'Travel tips and destination information',
        'Integration with your booking history'
      ],
      tags: ['AI', 'Search', 'Recommendations', 'Chat']
    },
    {
      id: 'marketplace',
      title: 'RWA Marketplace',
      icon: BarChart3,
      iconColor: 'text-teal-600',
      description: 'Trade Real World Asset (RWA) tokens representing fractional ownership in aviation assets.',
      details: [
        'Browse tokenized aircraft and assets',
        'Buy and sell fractional ownership shares',
        'Real-time market pricing and liquidity',
        'Dividend distributions from asset revenue',
        'Asset performance and financial reports',
        'Secondary market trading rules',
        'Regulatory compliance for trading'
      ],
      tags: ['Trading', 'RWA', 'Fractional', 'Dividends']
    },
    {
      id: 'portfolio',
      title: 'Portfolio & Dashboard',
      icon: TrendingUp,
      iconColor: 'text-slate-600',
      description: 'Track your crypto balances, tokenized assets, bookings, and platform activity.',
      details: [
        'Real-time crypto wallet balance tracking',
        'Tokenized asset portfolio valuation',
        'Booking history and upcoming trips',
        'DAO participation and voting power',
        'Launchpad investments and claims',
        'Transaction history across all services',
        'Export reports for tax purposes'
      ],
      tags: ['Balance', 'Assets', 'History', 'Reports']
    },
    {
      id: 'technical-support',
      title: 'Technical Support',
      icon: Settings,
      iconColor: 'text-orange-600',
      description: 'Get help with platform issues, wallet connections, smart contracts, and technical errors.',
      details: [
        'Troubleshoot wallet connection issues',
        'Transaction failed or pending',
        'Smart contract interaction errors',
        'Browser compatibility and extensions',
        'Mobile app support',
        'Clear cache and reset app state',
        'Report bugs and technical issues'
      ],
      tags: ['Troubleshooting', 'Errors', 'Bugs', 'Browser']
    }
  ];

  // Filter topics based on search query
  const filteredTopics = helpTopics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-white">
      <LandingHeader showInfoButton={false} />

      {/* Hero Section - Same style as Aviation page */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-6 tracking-tighter">
            Help Center
          </h1>

          <p className="text-xl text-gray-500 mb-8 max-w-3xl mx-auto font-light leading-relaxed">
            Comprehensive documentation covering all PrivateCharterX services - from booking private jets
            to tokenizing aviation assets and managing DAOs.
          </p>

          {/* Search Bar - Centered */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
            />
          </div>
        </div>
      </div>

      {/* FAQ Topics Section */}
      <section className="px-4 sm:px-8 py-4 sm:py-8 max-w-6xl mx-auto">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTopics.map((topic) => {
            const isExpanded = expandedTopic === topic.id;

            return (
              <div
                key={topic.id}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer"
                onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Content */}
                    <div className="flex-1">
                      <h4 className="text-base font-light text-gray-900 mb-1">{topic.title}</h4>
                      {!isExpanded && (
                        <p className="text-sm text-gray-600 font-light leading-relaxed">{topic.description}</p>
                      )}
                    </div>

                    {/* Expand Icon */}
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>

                  {/* Expanded Details */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[800px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
                  >
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 font-light leading-relaxed mb-4">{topic.description}</p>

                      <h5 className="text-sm font-medium text-gray-900 mb-3">What you'll learn:</h5>
                      <ul className="space-y-2 mb-4">
                        {topic.details.map((detail, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                            <span className="font-light">{detail}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {topic.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-gray-200 px-2 py-1 rounded-full text-xs text-gray-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTopics.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No topics found matching your search.</p>
          </div>
        )}
      </section>

      {/* Contact Support Section - Light Grey */}
      <section className="bg-gray-50 px-4 sm:px-8 py-12 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              Still Need Help?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Can't find what you're looking for? Our support team is available 24/7 to assist you.
            </p>
          </div>

          <div className="flex justify-center">
            {/* Email Support */}
            <div className="bg-white rounded-xl p-6 text-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow max-w-sm w-full">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-gray-700" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 text-sm mb-4">Get detailed help via email</p>
              <a
                href="mailto:info@privatecharterx.com"
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <Mail className="w-4 h-4" />
                info@privatecharterx.com
              </a>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm">
              For urgent matters, please contact us directly. Response times may vary based on inquiry complexity.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Helpdesk;
