import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import LandingHeader from './LandingHeader';
import Footer from './Footer';
import {
  Sparkles,
  Shield,
  Zap,
  Check,
  ArrowRight,
  Wallet,
  ChevronDown,
  ExternalLink,
  BadgeCheck,
  Gem,
  Lock,
  Star,
  Plus,
  X
} from 'lucide-react';

interface RWANFTProps {
  setCurrentPage: (page: string) => void;
}

// NFT Contract Details
const NFT_CONTRACT = '0xDF86Cf55BD2E58aaaC09160AaD0ed8673382B339';
const OPENSEA_URL = `https://opensea.io/collection/privatecharterx-membership`;
const NFT_VIDEO = 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivateCharterX_transparent-_3_.mp4';

function RWANFT({ setCurrentPage }: RWANFTProps) {
  const navigate = useNavigate();
  const { address: walletAddress, isConnected: isWalletConnected } = useAccount();
  const [expandedFaq, setExpandedFaq] = React.useState<string | null>(null);
  const [expandedBenefit, setExpandedBenefit] = React.useState<string | null>(null);

  const toggleFaq = (faqId: string) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  const toggleBenefit = (benefitId: string) => {
    setExpandedBenefit(expandedBenefit === benefitId ? null : benefitId);
  };

  const benefits = [
    {
      id: 'empty-leg',
      title: 'Free Empty Leg Flights',
      shortDesc: 'One free flight per year',
      fullDesc: 'Get one complimentary empty leg flight per year with a value of up to $1,500. Empty legs are one-way flights when aircraft reposition, offering significant savings on luxury private aviation.',
      highlight: 'Up to $1,500'
    },
    {
      id: 'jet-discount',
      title: '10% Off Private Jets',
      shortDesc: 'On all charter bookings',
      fullDesc: 'Enjoy an exclusive 10% discount on all private jet charter bookings. Whether you\'re flying light jets, midsize, or ultra-long-range aircraft, your NFT membership saves you thousands on every flight.',
      highlight: '10% Discount'
    },
    {
      id: 'ground-discount',
      title: '10% Off Ground Transport',
      shortDesc: 'Luxury cars & chauffeurs',
      fullDesc: 'Save 10% on all ground transportation including luxury car rentals (Ferrari, Lamborghini, Rolls-Royce), professional chauffeur services, and airport transfers worldwide.',
      highlight: '10% Discount'
    },
    {
      id: 'priority',
      title: 'Priority Booking',
      shortDesc: 'Skip the queue',
      fullDesc: 'Get VIP priority access on high-demand services during peak seasons. Your requests are processed first, ensuring you never miss out on limited availability flights or premium vehicles.',
      highlight: 'VIP Access'
    },
    {
      id: 'verified',
      title: 'Verified Member Status',
      shortDesc: 'On-chain verification',
      fullDesc: 'Your membership is verified on the blockchain through secure wallet signatures. No passwords, no accounts to hack - just cryptographic proof of your exclusive membership status.',
      highlight: 'On-Chain'
    },
    {
      id: 'perks',
      title: 'Exclusive Perks',
      shortDesc: 'Events & experiences',
      fullDesc: 'Access member-only events, NFT drops, exclusive experiences, and early access to new PrivateCharterX services. Connect with other high-net-worth individuals in our private community.',
      highlight: 'Members Only'
    }
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Purchase NFT',
      description: 'Buy your PrivateCharterX Membership NFT on OpenSea or through our platform'
    },
    {
      step: '02',
      title: 'Connect Wallet',
      description: 'Connect your wallet in the Sphera AI chat or dashboard to verify ownership'
    },
    {
      step: '03',
      title: 'Sign to Verify',
      description: 'Sign a message with your wallet to prove NFT ownership (no gas fees)'
    },
    {
      step: '04',
      title: 'Enjoy Benefits',
      description: 'Your discounts are automatically applied to all eligible bookings'
    }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Secure & Verified',
      description: 'On-chain verification through wallet signature - no private keys needed'
    },
    {
      icon: Zap,
      title: 'Instant Activation',
      description: 'Benefits activate immediately upon wallet verification'
    },
    {
      icon: Lock,
      title: 'Transferable',
      description: 'Sell or transfer your membership NFT at any time on secondary markets'
    },
    {
      icon: Star,
      title: 'Lifetime Access',
      description: 'No recurring fees - hold the NFT, keep the benefits forever'
    }
  ];

  const faqs = [
    {
      id: 'what-is',
      question: 'What is the PrivateCharterX RWA NFT?',
      answer: 'The PrivateCharterX RWA (Real World Asset) NFT is a blockchain-based membership pass that grants holders exclusive discounts and benefits on our luxury travel services. It represents real-world utility tied to private jet charters, ground transportation, and premium lifestyle services.'
    },
    {
      id: 'benefits',
      question: 'What benefits do NFT holders receive?',
      answer: 'NFT holders receive: 1 free empty leg flight per year (up to $1,500 value), 10% discount on all private jet bookings, 10% discount on luxury ground transportation, priority booking access, exclusive member events, and verified on-chain membership status.'
    },
    {
      id: 'how-verify',
      question: 'How do I verify my NFT ownership?',
      answer: 'Simply connect your wallet in the Sphera AI chat or dashboard. When making a booking, you\'ll be prompted to sign a message (gasless) to verify you own the NFT. Your discounts are then automatically applied.'
    },
    {
      id: 'which-wallet',
      question: 'Which wallets are supported?',
      answer: 'We support all major Web3 wallets including MetaMask, Coinbase Wallet, Rainbow, WalletConnect-compatible wallets, and more. Any wallet that holds your NFT on the Base network can be used for verification.'
    },
    {
      id: 'transfer',
      question: 'Can I sell or transfer my NFT?',
      answer: 'Yes! The NFT is fully transferable. You can sell it on OpenSea or transfer it to another wallet. The benefits transfer with the NFT to the new holder.'
    },
    {
      id: 'network',
      question: 'Which blockchain network is the NFT on?',
      answer: 'The PrivateCharterX Membership NFT is deployed on Base, an Ethereum L2 network built by Coinbase. Base offers fast, low-cost transactions while maintaining Ethereum security.'
    },
    {
      id: 'expiry',
      question: 'Do the benefits expire?',
      answer: 'No! Unlike traditional memberships, NFT membership benefits never expire. As long as you hold the NFT, you retain all benefits. The free empty leg benefit renews annually.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-4">
      <LandingHeader />

      {/* Hero Section - Clean, no dark background */}
      <section className="px-4 sm:px-8 py-8 sm:py-16 max-w-6xl mx-auto">
        {/* Header - Centered */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-xs font-medium tracking-wide uppercase mb-6">
            <Gem className="w-3.5 h-3.5" />
            Real World Asset NFT
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 mb-3">
            PrivateCharterX Membership NFT
          </h1>
          <p className="text-gray-600 text-sm md:text-base max-w-xl mx-auto font-light">
            Unlock free empty leg flights, charter discounts, ground transport savings, and a fully tradable on-chain membership.
          </p>
        </div>

        {/* NFT Preview Card with Video - Glassmorphic */}
        <div className="max-w-md mx-auto">
          <div
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(120, 120, 130, 0.15) 0%, rgba(80, 80, 90, 0.12) 50%, rgba(100, 100, 110, 0.18) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -1px 1px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.12)'
            }}
          >
            {/* Top edge highlight */}
            <div
              className="absolute top-0 left-0 right-0 h-[1px]"
              style={{
                background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.25) 30%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.25) 70%, rgba(255,255,255,0.05) 100%)'
              }}
            />
            {/* Left edge highlight */}
            <div
              className="absolute top-0 left-0 bottom-0 w-[1px]"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)'
              }}
            />
            {/* Bottom edge subtle highlight */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[1px]"
              style={{
                background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.02) 100%)'
              }}
            />
            {/* NFT Video */}
            <div className="aspect-square bg-gray-900/80 rounded-xl mb-4 overflow-hidden relative">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              >
                <source src={NFT_VIDEO} type="video/mp4" />
              </video>
              {/* Verified Badge */}
              <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1">
                <BadgeCheck size={12} />
                Verified
              </div>
            </div>

            {/* NFT Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Collection</p>
                  <p className="text-sm font-medium text-gray-900">PrivateCharterX Membership</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Network</p>
                  <p className="text-sm font-medium text-gray-900">Base</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-400/20">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Price</p>
                  <p className="text-lg font-medium text-gray-900">0.5 ETH</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Discounts</p>
                  <p className="text-lg font-medium text-green-600">10% Off</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="text-center mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={OPENSEA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium transition-all duration-200 hover:bg-gray-800"
          >
            <ExternalLink className="w-4 h-4" />
            View on OpenSea
          </a>
          {isWalletConnected && walletAddress ? (
            <div className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-medium border border-gray-200 bg-gray-50 text-gray-700">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="font-mono">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
            </div>
          ) : (
            <button
              onClick={() => navigate('/dashboard/web3')}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-medium transition-all duration-200 border border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </button>
          )}
        </div>

        {/* Contract Address */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Contract: <span className="font-mono text-gray-600">{NFT_CONTRACT.slice(0, 10)}...{NFT_CONTRACT.slice(-8)}</span>
          </p>
        </div>
      </section>

      {/* Benefits Section - Expandable Cards */}
      <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4">
            Exclusive Member Benefits
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Your NFT unlocks real-world discounts and perks across our entire luxury travel ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefits.map((benefit) => (
            <div
              key={benefit.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg"
            >
              <button
                onClick={() => toggleBenefit(benefit.id)}
                className="w-full p-5 text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-gray-900 mb-0.5">{benefit.title}</h3>
                    <p className="text-sm text-gray-500">{benefit.shortDesc}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded hidden sm:block">
                      {benefit.highlight}
                    </span>
                    <div className={`w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center transition-all ${expandedBenefit === benefit.id ? 'bg-gray-900 border-gray-900' : 'bg-white'}`}>
                      {expandedBenefit === benefit.id ? (
                        <X size={12} className="text-white" />
                      ) : (
                        <Plus size={12} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded Content */}
              {expandedBenefit === benefit.id && (
                <div className="px-5 pb-5 pt-0">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {benefit.fullDesc}
                  </p>
                  <span className="inline-block mt-3 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded sm:hidden">
                    {benefit.highlight}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Start enjoying your benefits in just a few simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {howItWorks.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 h-full">
                <span className="text-4xl font-light text-gray-200 mb-4 block">{step.step}</span>
                <h3 className="text-base font-medium text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
              {index < howItWorks.length - 1 && (
                <ArrowRight className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 text-gray-300 transform -translate-y-1/2" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-900 rounded-2xl p-5 text-white"
            >
              <feature.icon className="w-8 h-8 text-white/80 mb-4" />
              <h3 className="text-base font-medium mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Section - NFT vs Traditional Aviation Operators */}
      <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4">
            NFT vs Traditional Operator Memberships
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Compare our Web3 membership with traditional aviation operator programs like VistaJet, NetJets, and Wheels Up.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Feature</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-500">Traditional Operators</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-900 bg-gray-900 text-white">PrivateCharterX NFT</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Upfront Cost', traditional: '$50,000 - $500,000+', nft: '0.5 ETH (~$1,800)' },
                  { feature: 'Annual Fees', traditional: '$5,000 - $25,000/year', nft: 'None' },
                  { feature: 'Minimum Commitment', traditional: '25-50 flight hours', nft: 'No minimum' },
                  { feature: 'Transferable', traditional: false, nft: true },
                  { feature: 'Resale Value', traditional: false, nft: true },
                  { feature: 'Lock-in Period', traditional: '1-3 years', nft: 'None' },
                  { feature: 'Global Access', traditional: 'Network dependent', nft: 'Worldwide' },
                  { feature: 'Jet Discount', traditional: 'Fixed hourly rate', nft: '10% off market rates' },
                  { feature: 'Ground Transport', traditional: 'Separate program', nft: '10% discount included' },
                  { feature: 'Empty Leg Access', traditional: 'Limited / Extra cost', nft: '1 free/year + access' },
                  { feature: 'Ownership Proof', traditional: 'Paper contract', nft: 'Blockchain verified' },
                  { feature: 'Benefits Expiry', traditional: 'Contract term', nft: 'Never expires' },
                ].map((row, index) => (
                  <tr key={index} className="border-b border-gray-100 last:border-b-0">
                    <td className="py-4 px-6 text-gray-700">{row.feature}</td>
                    <td className="py-4 px-6 text-center">
                      {typeof row.traditional === 'boolean' ? (
                        row.traditional ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )
                      ) : (
                        <span className="text-gray-500">{row.traditional}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center bg-gray-50">
                      {typeof row.nft === 'boolean' ? (
                        row.nft ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )
                      ) : (
                        <span className="text-gray-900 font-medium">{row.nft}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          * Traditional operator data based on publicly available information from major jet card and membership programs.
        </p>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-8 py-12 sm:py-16 max-w-6xl mx-auto">
        <div
          className="rounded-3xl p-8 sm:p-12 relative overflow-hidden"
          style={{
            backgroundImage: 'url(https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/Privatecharterx_Banner.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Content - Left aligned */}
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-light text-white mb-4">
              Ready to Join?
            </h2>
            <p className="text-gray-300 max-w-xl mb-8">
              Get your PrivateCharterX Membership NFT and start saving on luxury travel today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={OPENSEA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-gray-900 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-gray-100"
              >
                <ExternalLink className="w-4 h-4" />
                Buy on OpenSea
              </a>
              <button
                onClick={() => navigate('/dashboard/chat?newChat=true')}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-medium transition-all duration-200 border border-white/30 hover:border-white/50 text-white hover:bg-white/10"
              >
                <Sparkles className="w-4 h-4" />
                Chat with Sphera AI
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedFaq === faq.id ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedFaq === faq.id && (
                <div className="px-6 pb-4 text-sm text-gray-600">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default RWANFT;
