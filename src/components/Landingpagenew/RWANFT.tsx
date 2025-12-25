import React from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from './LandingHeader';
import Footer from './Footer';
import {
  Sparkles,
  Plane,
  Car,
  Shield,
  Zap,
  Check,
  ArrowRight,
  Wallet,
  Gift,
  ChevronDown,
  ExternalLink,
  Users,
  Clock,
  Crown,
  Percent,
  Navigation,
  BadgeCheck,
  Gem,
  Lock,
  Star
} from 'lucide-react';

interface RWANFTProps {
  setCurrentPage: (page: string) => void;
}

// NFT Contract Details
const NFT_CONTRACT = '0xDF86Cf55BD2E58aaaC09160AaD0ed8673382B339';
const OPENSEA_URL = `https://opensea.io/collection/privatecharterx-membership`;
const NFT_IMAGE = 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/PrivatecharterX_logo_vectorized.glb.png';

function RWANFT({ setCurrentPage }: RWANFTProps) {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = React.useState<string | null>(null);

  const toggleFaq = (faqId: string) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  const benefits = [
    {
      icon: Plane,
      title: 'Free Empty Leg Flights',
      description: 'One free empty leg flight per year up to $1,500 value',
      highlight: 'Up to $1,500'
    },
    {
      icon: Percent,
      title: '10% Off Private Jets',
      description: 'Exclusive discount on all private jet charter bookings',
      highlight: '10% Discount'
    },
    {
      icon: Car,
      title: '10% Off Ground Transport',
      description: 'Save on luxury car rentals and chauffeur services',
      highlight: '10% Discount'
    },
    {
      icon: Crown,
      title: 'Priority Booking',
      description: 'Skip the queue with priority access to high-demand services',
      highlight: 'VIP Access'
    },
    {
      icon: BadgeCheck,
      title: 'Verified Member Status',
      description: 'Exclusive on-chain verification of your membership',
      highlight: 'On-Chain'
    },
    {
      icon: Gift,
      title: 'Exclusive Perks',
      description: 'Access to member-only events, drops, and experiences',
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
      answer: 'No! Unlike traditional subscriptions, NFT membership benefits never expire. As long as you hold the NFT, you retain all benefits. The free empty leg benefit renews annually.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-4">
      <LandingHeader />

      {/* Hero Section */}
      <section className="px-4 sm:px-8 py-8 sm:py-12 max-w-6xl mx-auto">
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 25%, #1a1a1a 50%, #0d0d0d 75%, #000000 100%)',
            minHeight: '600px'
          }}
        >
          {/* Subtle Pattern Overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)'
            }}
          />

          {/* Content */}
          <div className="relative px-6 sm:px-12 py-12 sm:py-16">
            {/* Header - Centered */}
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-xs font-medium tracking-wide uppercase mb-6 border border-white/20">
                <Gem className="w-3.5 h-3.5" />
                Real World Asset NFT
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-white mb-3">
                PrivateCharterX Membership NFT
              </h1>
              <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto font-light">
                Unlock exclusive discounts on private jets, luxury cars, and premium services with your on-chain membership.
              </p>
            </div>

            {/* NFT Preview Card */}
            <div className="max-w-md mx-auto">
              <div
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-white/10"
                style={{ backdropFilter: 'blur(20px)' }}
              >
                {/* NFT Image */}
                <div className="aspect-square bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl mb-4 flex items-center justify-center overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent" />
                  <img
                    src={NFT_IMAGE}
                    alt="PrivateCharterX NFT"
                    className="w-3/4 h-3/4 object-contain"
                  />
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
                      <p className="text-sm font-medium text-white">PrivateCharterX Membership</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Network</p>
                      <p className="text-sm font-medium text-white">Base</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Benefits Value</p>
                      <p className="text-lg font-medium text-green-400">$1,500+/year</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Discounts</p>
                      <p className="text-lg font-medium text-white">10% Off</p>
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
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-gray-900 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-gray-100"
              >
                <ExternalLink className="w-4 h-4" />
                View on OpenSea
              </a>
              <button
                onClick={() => navigate('/dashboard/web3')}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-medium transition-all duration-200 border border-white/30 hover:border-white/50 text-white hover:bg-white/10"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            </div>

            {/* Contract Address */}
            <div className="text-center mt-6">
              <p className="text-xs text-gray-500">
                Contract: <span className="font-mono text-gray-400">{NFT_CONTRACT.slice(0, 10)}...{NFT_CONTRACT.slice(-8)}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4">
            Exclusive Member Benefits
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Your NFT unlocks real-world discounts and perks across our entire luxury travel ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-lg">
                  {benefit.highlight}
                </span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-sm text-gray-600">{benefit.description}</p>
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

      {/* Comparison Section */}
      <section className="px-4 sm:px-8 py-12 sm:py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4">
            NFT vs Traditional Membership
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            See why blockchain-based membership is the future of luxury travel.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Feature</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-900">Traditional</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-900 bg-gray-900 text-white">NFT Membership</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Monthly Fees', traditional: '$99-999/mo', nft: 'One-time purchase' },
                  { feature: 'Transferable', traditional: false, nft: true },
                  { feature: 'Resale Value', traditional: false, nft: true },
                  { feature: 'On-Chain Verification', traditional: false, nft: true },
                  { feature: 'Expiration', traditional: 'Monthly renewal', nft: 'Never expires' },
                  { feature: 'Free Empty Leg', traditional: 'Elite only', nft: true },
                  { feature: 'Jet Discount', traditional: 'Up to 5%', nft: '10%' },
                  { feature: 'Ground Discount', traditional: 'Up to 5%', nft: '10%' },
                  { feature: 'Priority Access', traditional: 'Elite only', nft: true },
                  { feature: 'Exclusive Events', traditional: 'Elite only', nft: true },
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
                        <span className="text-gray-600">{row.traditional}</span>
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
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-8 py-12 sm:py-16 max-w-6xl mx-auto">
        <div className="bg-gray-900 rounded-3xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-light text-white mb-4">
            Ready to Join?
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-8">
            Get your PrivateCharterX Membership NFT and start saving on luxury travel today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
