import React, { useState } from 'react';
import LandingHeader from './LandingHeader';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  MessageCircle,
  Clock,
  Shield,
  AlertTriangle,
  Info,
  Book,
  Users,
  Coins,
  Plane,
  Settings,
  Globe,
  FileText,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';

interface HelpdeskProps {
  setCurrentPage: (page: string) => void;
}

function Helpdesk({ setCurrentPage }: HelpdeskProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedFAQs, setExpandedFAQs] = useState<string[]>([]);

  const toggleFAQ = (id: string) => {
    setExpandedFAQs(prev => 
      prev.includes(id) 
        ? prev.filter(faqId => faqId !== id)
        : [...prev, id]
    );
  };

  const categories = [
    { id: 'all', label: 'All Topics', icon: Book },
    { id: 'getting-started', label: 'Getting Started', icon: Info },
    { id: 'aviation', label: 'Aviation Services', icon: Plane },
    { id: 'blockchain', label: 'Blockchain & Web3', icon: Coins },
    { id: 'legal', label: 'Legal & Disclaimer', icon: Shield },
    { id: 'payments', label: 'Payments & Crypto', icon: Settings },
    { id: 'account', label: 'Account & Security', icon: Users },
    { id: 'technical', label: 'Technical Support', icon: Settings }
  ];

  const faqs = [
    // Getting Started
    {
      id: 'gs-1',
      category: 'getting-started',
      question: 'What is PrivateCharterX?',
      answer: 'PrivateCharterX is a blockchain-powered private aviation platform that revolutionizes luxury travel through tokenization, transparent pricing, and decentralized ownership of aviation assets.'
    },
    {
      id: 'gs-2',
      category: 'getting-started',
      question: 'How do I get started with PrivateCharterX?',
      answer: 'Simply create an account, complete KYC/AML verification, and you can start booking flights, purchasing asset tokens, or joining our NFT membership program.'
    },
    {
      id: 'gs-3',
      category: 'getting-started',
      question: 'Do I need cryptocurrency to use your services?',
      answer: 'While we accept 30+ cryptocurrencies, you can also pay with traditional payment methods. Crypto payments often provide additional benefits and discounts.'
    },
    {
      id: 'gs-4',
      category: 'getting-started',
      question: 'What makes PrivateCharterX different from other charter services?',
      answer: 'We combine traditional aviation services with blockchain technology, offering tokenized asset ownership, NFT memberships, transparent pricing, and verifiable sustainability certificates.'
    },
    {
      id: 'gs-5',
      category: 'getting-started',
      question: 'Is PrivateCharterX available worldwide?',
      answer: 'We operate globally with access to 16,000+ aircraft worldwide. However, due to regulatory requirements, our services are not available in Switzerland and Liechtenstein.'
    },

    // Aviation Services
    {
      id: 'av-1',
      category: 'aviation',
      question: 'How many aircraft do you have access to?',
      answer: 'We have access to over 16,000 private jets, helicopters, and aircraft worldwide through our verified licensed partners and global network.'
    },
    {
      id: 'av-2',
      category: 'aviation',
      question: 'What types of aircraft can I book?',
      answer: 'We offer light jets, mid-size jets, heavy jets, ultra-long-range aircraft, helicopters, and upcoming eVTOL aircraft for various travel needs.'
    },
    {
      id: 'av-3',
      category: 'aviation',
      question: 'How far in advance should I book a flight?',
      answer: 'We recommend booking 24-48 hours in advance for best availability, though we can accommodate last-minute requests subject to aircraft availability.'
    },
    {
      id: 'av-4',
      category: 'aviation',
      question: 'What are empty leg flights?',
      answer: 'Empty legs are flights where aircraft return empty to their base or next destination. These offer significant savings of up to 75% off regular charter prices.'
    },
    {
      id: 'av-5',
      category: 'aviation',
      question: 'Do NFT holders get special benefits?',
      answer: 'Yes! NFT members receive 1 free empty leg flight, 10% discount on all charters, complimentary airport transfers, priority booking, and exclusive member events.'
    },
    {
      id: 'av-6',
      category: 'aviation',
      question: 'Can I cancel or modify my flight booking?',
      answer: 'Cancellation and modification policies vary by aircraft and timing. Generally, cancellations within 24 hours may incur fees. Contact our 24/7 concierge for assistance.'
    },
    {
      id: 'av-7',
      category: 'aviation',
      question: 'What is included in the flight price?',
      answer: 'Flight prices typically include aircraft rental, crew, fuel, standard catering, and ground handling. Additional services like premium catering or ground transportation may incur extra costs.'
    },
    {
      id: 'av-8',
      category: 'aviation',
      question: 'Do you provide 24/7 support?',
      answer: 'Yes, our aviation experts provide round-the-clock support for booking, flight changes, and any travel-related assistance.'
    },
    {
      id: 'av-9',
      category: 'aviation',
      question: 'What safety standards do you follow?',
      answer: 'All our partner operators meet or exceed international safety standards including IS-BAO, ARGUS, and Wyvern certifications. Safety is our top priority.'
    },
    {
      id: 'av-10',
      category: 'aviation',
      question: 'Can I bring pets on private flights?',
      answer: 'Yes, most private flights allow pets. Please inform us during booking about pet travel requirements and any necessary documentation.'
    },

    // Blockchain & Web3
    {
      id: 'bc-1',
      category: 'blockchain',
      question: 'How does blockchain technology enhance aviation?',
      answer: 'Blockchain provides transparent pricing, immutable flight records, secure payments, verifiable sustainability certificates, and enables fractional asset ownership.'
    },
    {
      id: 'bc-2',
      category: 'blockchain',
      question: 'What is asset tokenization?',
      answer: 'Asset tokenization converts real-world assets like private jets into digital tokens, enabling fractional ownership, easier trading, and transparent governance.'
    },
    {
      id: 'bc-3',
      category: 'blockchain',
      question: 'How do DAO governance systems work?',
      answer: 'DAO (Decentralized Autonomous Organization) allows token holders to vote on important decisions like fleet expansion, route additions, and operational changes.'
    },
    {
      id: 'bc-4',
      category: 'blockchain',
      question: 'What are CO2 and SAF certificates?',
      answer: 'These are blockchain-verified certificates showing carbon footprint and Sustainable Aviation Fuel usage for each flight, providing unprecedented transparency in environmental impact.'
    },
    {
      id: 'bc-5',
      category: 'blockchain',
      question: 'Can I trade my asset tokens?',
      answer: 'Yes, asset tokens can be traded on our marketplace or compatible DeFi platforms, providing liquidity for your aviation investments.'
    },
    {
      id: 'bc-6',
      category: 'blockchain',
      question: 'What blockchain networks do you use?',
      answer: 'We primarily use Ethereum mainnet with Polygon Layer 2 for scaling, and support cross-chain compatibility with other major networks.'
    },
    {
      id: 'bc-7',
      category: 'blockchain',
      question: 'How secure are smart contracts?',
      answer: 'All our smart contracts undergo rigorous third-party security audits and formal verification to ensure maximum security and reliability.'
    },
    {
      id: 'bc-8',
      category: 'blockchain',
      question: 'What is the PVCX token?',
      answer: 'PVCX is our utility token that provides governance rights, staking rewards, platform discounts, and access to exclusive features and services.'
    },
    {
      id: 'bc-9',
      category: 'blockchain',
      question: 'How do NFT memberships work?',
      answer: 'NFT memberships are limited edition tokens (100 pieces at 0.5 ETH each) that provide exclusive benefits including free flights, discounts, and priority access.'
    },
    {
      id: 'bc-10',
      category: 'blockchain',
      question: 'What is yield farming in aviation?',
      answer: 'Yield farming allows token holders to stake their aviation tokens and earn rewards from flight revenues and asset appreciation.'
    },

    // Legal & Compliance
    {
      id: 'lg-1',
      category: 'legal',
      question: 'Does PrivateCharterX hold digital assets directly?',
      answer: 'No, PrivateCharterX does not hold any digital assets directly. All digital assets are held through our verified licensed partners who maintain proper regulatory compliance.'
    },
    {
      id: 'lg-2',
      category: 'legal',
      question: 'What regulatory compliance do you maintain?',
      answer: 'We maintain SOC 2 Type II, ISO 27001, GDPR compliance, SEC registration, and work with licensed partners for asset custody and management.'
    },
    {
      id: 'lg-3',
      category: 'legal',
      question: 'Are you licensed to operate aircraft?',
      answer: 'We are aviation brokers working with licensed operators. We are building toward becoming direct operators in the future while maintaining full regulatory compliance.'
    },
    {
      id: 'lg-4',
      category: 'legal',
      question: 'What jurisdictions do you operate under?',
      answer: 'We operate under multiple jurisdictions depending on the service, with primary operations in regulatory-compliant regions excluding Switzerland and Liechtenstein.'
    },
    {
      id: 'lg-5',
      category: 'legal',
      question: 'How do you handle KYC/AML requirements?',
      answer: 'We implement comprehensive KYC/AML procedures including identity verification, source of funds checks, and ongoing monitoring in compliance with international standards.'
    },
    {
      id: 'lg-6',
      category: 'legal',
      question: 'What are the terms of service?',
      answer: 'Our terms of service outline user rights, responsibilities, service limitations, and legal frameworks. Please review them carefully before using our services.'
    },
    {
      id: 'lg-7',
      category: 'legal',
      question: 'How is user data protected?',
      answer: 'We use 256-bit encryption, decentralized identity management, and GDPR-compliant data handling practices to protect all user information.'
    },
    {
      id: 'lg-8',
      category: 'legal',
      question: 'What insurance coverage is provided?',
      answer: 'All flights are covered by comprehensive aviation insurance through our licensed operator partners, meeting or exceeding industry standards.'
    },
    {
      id: 'lg-9',
      category: 'legal',
      question: 'How are disputes resolved?',
      answer: 'Disputes are resolved through our internal resolution process first, followed by arbitration or mediation as outlined in our terms of service.'
    },
    {
      id: 'lg-10',
      category: 'legal',
      question: 'What happens if regulations change?',
      answer: 'We continuously monitor regulatory changes and adapt our services accordingly, always prioritizing compliance and user protection.'
    },

    // Payments & Crypto
    {
      id: 'py-1',
      category: 'payments',
      question: 'What cryptocurrencies do you accept?',
      answer: 'We accept over 30 cryptocurrencies including Bitcoin, Ethereum, USDC, USDT, and many other major tokens and stablecoins.'
    },
    {
      id: 'py-2',
      category: 'payments',
      question: 'Do you accept traditional payment methods?',
      answer: 'Yes, we accept credit cards, bank transfers, and other traditional payment methods alongside cryptocurrency payments.'
    },
    {
      id: 'py-3',
      category: 'payments',
      question: 'Are there benefits to paying with crypto?',
      answer: 'Crypto payments often provide faster processing, lower fees, additional discounts, and access to exclusive crypto-holder benefits.'
    },
    {
      id: 'py-4',
      category: 'payments',
      question: 'How are crypto payments processed?',
      answer: 'Crypto payments are processed through secure smart contracts with automatic conversion to required currencies for flight operations.'
    },
    {
      id: 'py-5',
      category: 'payments',
      question: 'What are the payment processing fees?',
      answer: 'Fees vary by payment method. Crypto payments typically have lower fees than traditional methods, with exact rates displayed during checkout.'
    },
    {
      id: 'py-6',
      category: 'payments',
      question: 'How quickly are payments processed?',
      answer: 'Crypto payments are typically confirmed within minutes, while traditional payments may take 1-3 business days depending on the method.'
    },
    {
      id: 'py-7',
      category: 'payments',
      question: 'Can I get refunds in cryptocurrency?',
      answer: 'Yes, refunds can be processed in the same cryptocurrency used for payment, subject to our refund policy and market conditions.'
    },
    {
      id: 'py-8',
      category: 'payments',
      question: 'Do you provide payment receipts?',
      answer: 'Yes, all payments receive detailed receipts with transaction hashes for crypto payments and traditional receipts for other methods.'
    },
    {
      id: 'py-9',
      category: 'payments',
      question: 'What wallets are compatible?',
      answer: 'We support MetaMask, WalletConnect, and all major Web3 wallets for seamless cryptocurrency transactions.'
    },
    {
      id: 'py-10',
      category: 'payments',
      question: 'Are payments secure?',
      answer: 'All payments use military-grade encryption, smart contract security, and multi-signature protocols for maximum security.'
    },

    // Account & Security
    {
      id: 'ac-1',
      category: 'account',
      question: 'How do I create an account?',
      answer: 'Click "Get Started," complete the registration form, verify your email, and complete KYC/AML verification to access all features.'
    },
    {
      id: 'ac-2',
      category: 'account',
      question: 'What is required for KYC verification?',
      answer: 'KYC requires government-issued ID, proof of address, and source of funds documentation for compliance with international regulations.'
    },
    {
      id: 'ac-3',
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'Use the "Forgot Password" link on the login page, enter your email, and follow the reset instructions sent to your registered email address.'
    },
    {
      id: 'ac-4',
      category: 'account',
      question: 'Can I change my account information?',
      answer: 'Yes, most account information can be updated in your profile settings. Some changes may require re-verification for security purposes.'
    },
    {
      id: 'ac-5',
      category: 'account',
      question: 'How is my account secured?',
      answer: 'Accounts use multi-factor authentication, encryption, decentralized identity management, and regular security monitoring.'
    },
    {
      id: 'ac-6',
      category: 'account',
      question: 'Can I delete my account?',
      answer: 'Yes, you can request account deletion through customer support. Note that some data may be retained for legal and compliance purposes.'
    },
    {
      id: 'ac-7',
      category: 'account',
      question: 'What if I suspect unauthorized access?',
      answer: 'Immediately contact our security team, change your password, and review your account activity. We provide 24/7 security support.'
    },
    {
      id: 'ac-8',
      category: 'account',
      question: 'How do I enable two-factor authentication?',
      answer: 'Go to Security Settings in your account, select 2FA setup, and follow the instructions to link your authenticator app or phone number.'
    },
    {
      id: 'ac-9',
      category: 'account',
      question: 'Can I have multiple accounts?',
      answer: 'Each person should maintain only one account for compliance purposes. Corporate accounts are available for business users.'
    },
    {
      id: 'ac-10',
      category: 'account',
      question: 'How do I upgrade my membership?',
      answer: 'Membership upgrades are available through NFT purchases or token holdings. Contact our team for personalized upgrade options.'
    },

    // Technical Support
    {
      id: 'ts-1',
      category: 'technical',
      question: 'What browsers are supported?',
      answer: 'We support all modern browsers including Chrome, Firefox, Safari, and Edge. For best experience, use the latest browser versions.'
    },
    {
      id: 'ts-2',
      category: 'technical',
      question: 'Why is the website loading slowly?',
      answer: 'Slow loading may be due to network issues, browser cache, or high traffic. Try clearing cache, using a different network, or contact support.'
    },
    {
      id: 'ts-3',
      category: 'technical',
      question: 'How do I connect my Web3 wallet?',
      answer: 'Click "Connect Wallet," select your wallet provider, and approve the connection. Ensure your wallet is unlocked and on the correct network.'
    },
    {
      id: 'ts-4',
      category: 'technical',
      question: 'What if my transaction fails?',
      answer: 'Failed transactions may be due to insufficient gas, network congestion, or wallet issues. Check your wallet and try again with higher gas fees.'
    },
    {
      id: 'ts-5',
      category: 'technical',
      question: 'How do I report a bug?',
      answer: 'Report bugs through our support system with detailed descriptions, screenshots, and steps to reproduce the issue for faster resolution.'
    },
    {
      id: 'ts-6',
      category: 'technical',
      question: 'Is there a mobile app?',
      answer: 'Currently, we offer a responsive web application optimized for mobile devices. A dedicated mobile app is in development.'
    },
    {
      id: 'ts-7',
      category: 'technical',
      question: 'What if I can\'t access my dashboard?',
      answer: 'Dashboard access issues may be due to login problems, browser issues, or account restrictions. Try logging out and back in, or contact support.'
    },
    {
      id: 'ts-8',
      category: 'technical',
      question: 'How do I update my notification preferences?',
      answer: 'Go to Account Settings > Notifications to customize email, SMS, and push notification preferences for different types of updates.'
    },
    {
      id: 'ts-9',
      category: 'technical',
      question: 'What are the system requirements?',
      answer: 'Any device with a modern browser and internet connection. For Web3 features, you\'ll need a compatible wallet extension or mobile wallet.'
    },
    {
      id: 'ts-10',
      category: 'technical',
      question: 'How do I clear my browser cache?',
      answer: 'In most browsers, press Ctrl+Shift+Delete (Cmd+Shift+Delete on Mac), select cache/cookies, and clear. This often resolves loading issues.'
    },

    // Additional comprehensive FAQs
    {
      id: 'gs-11',
      category: 'getting-started',
      question: 'What is the minimum investment for tokenized assets?',
      answer: 'Minimum investments vary by asset, typically starting from $1,000 for fractional ownership tokens. Check individual asset pages for specific requirements.'
    },
    {
      id: 'av-11',
      category: 'aviation',
      question: 'Do you offer helicopter tours?',
      answer: 'Yes, we provide helicopter charter services including scenic tours, city transfers, and access to remote locations through our partner network.'
    },
    {
      id: 'bc-11',
      category: 'blockchain',
      question: 'How do I participate in DAO voting?',
      answer: 'Token holders can participate in DAO governance by connecting their wallet, viewing active proposals, and casting votes based on their token holdings.'
    },
    {
      id: 'lg-11',
      category: 'legal',
      question: 'What happens to my tokens if PrivateCharterX ceases operations?',
      answer: 'Tokens are held by licensed partners, not directly by PrivateCharterX. Asset ownership and rights would transfer according to legal frameworks and partnership agreements.'
    },
    {
      id: 'py-11',
      category: 'payments',
      question: 'Can I pay partially with crypto and partially with fiat?',
      answer: 'Yes, we support mixed payment methods. You can combine cryptocurrency and traditional payments for a single transaction.'
    },
    {
      id: 'ac-11',
      category: 'account',
      question: 'How long does KYC verification take?',
      answer: 'KYC verification typically takes 24-48 hours for standard cases. Complex cases may take up to 5 business days for thorough review.'
    },
    {
      id: 'ts-11',
      category: 'technical',
      question: 'What network fees should I expect?',
      answer: 'Network fees vary by blockchain congestion. We display estimated fees before transactions and recommend optimal gas prices for timely processing.'
    },
    {
      id: 'gs-12',
      category: 'getting-started',
      question: 'Can I book flights without owning tokens?',
      answer: 'Yes, you can book flights with traditional payments. Token ownership provides additional benefits and discounts but is not required for basic services.'
    },
    {
      id: 'av-12',
      category: 'aviation',
      question: 'What is the difference between brokers and operators?',
      answer: 'Brokers arrange flights with licensed operators who own and operate aircraft. We are currently brokers building toward future operator capabilities.'
    },
    {
      id: 'bc-12',
      category: 'blockchain',
      question: 'How are asset valuations determined?',
      answer: 'Asset valuations use professional appraisals, market data, revenue projections, and oracle feeds to ensure accurate and transparent pricing.'
    },
    {
      id: 'lg-12',
      category: 'legal',
      question: 'Are there age restrictions for using the platform?',
      answer: 'Users must be 18 years or older to create accounts and use our services. Some jurisdictions may have higher age requirements.'
    },
    {
      id: 'lg-13',
      category: 'legal',
      question: 'Important Legal Disclaimer - Asset Custody',
      answer: 'PrivateCharterX does not hold any digital assets directly. All digital assets are held through our verified licensed partners who maintain proper regulatory compliance and custody standards.'
    },
    {
      id: 'lg-14',
      category: 'legal',
      question: 'Important Legal Disclaimer - Cryptocurrency Acceptance',
      answer: 'We accept over 30 different cryptocurrency tokens for payments and investments, processed through secure smart contracts and licensed financial partners.'
    },
    {
      id: 'lg-15',
      category: 'legal',
      question: 'Important Legal Disclaimer - Regulatory Compliance',
      answer: 'Our services operate under multiple jurisdictions with appropriate licenses and regulatory oversight. Services are not available in Switzerland and Liechtenstein due to regulatory requirements.'
    },
    {
      id: 'lg-16',
      category: 'legal',
      question: 'Important Legal Disclaimer - Investment Risks',
      answer: 'Tokenized assets and cryptocurrency investments carry inherent risks including market volatility, regulatory changes, and potential loss of value. Past performance does not guarantee future results.'
    },
    {
      id: 'lg-17',
      category: 'legal',
      question: 'Important Legal Disclaimer - Aviation Services',
      answer: 'We currently operate as aviation brokers working with licensed operators. We are building toward becoming direct operators while maintaining full regulatory compliance.'
    },
    {
      id: 'lg-18',
      category: 'legal',
      question: 'Important Legal Disclaimer - Professional Advice',
      answer: 'This platform does not provide financial, legal, or investment advice. Users should consult with qualified professionals before making investment decisions.'
    },
    {
      id: 'py-12',
      category: 'payments',
      question: 'Do you support DeFi protocols?',
      answer: 'Yes, we integrate with leading DeFi protocols for enhanced liquidity, yield farming, and advanced financial services.'
    },
    {
      id: 'ac-12',
      category: 'account',
      question: 'Can I transfer my account to someone else?',
      answer: 'Account transfers are not permitted due to KYC/AML requirements. Each person must maintain their own verified account.'
    },
    {
      id: 'ts-12',
      category: 'technical',
      question: 'How do I export my transaction history?',
      answer: 'Go to Account > Transaction History and use the export function to download your complete transaction records in various formats.'
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleEmailContact = () => {
    window.location.href = 'mailto:info@privatecharterx.com?subject=Helpdesk Support Request&body=Hello PrivateCharterX Support Team,%0D%0A%0D%0AI need assistance with:%0D%0A%0D%0APlease provide more details about my inquiry.%0D%0A%0D%0AThank you for your help.';
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-4">
      <LandingHeader showInfoButton={false} />

      <div className="max-w-7xl mx-auto bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
        {/* Hero Section */}
        <section className="px-4 sm:px-8 py-12 sm:py-16 max-w-6xl mx-auto text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-8 h-8 text-gray-700" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 mb-4 sm:mb-6 leading-tight">
            Help Center & Support
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
            Find answers to your questions about blockchain aviation, tokenized assets, 
            payments, and more. Our comprehensive knowledge base covers everything you need to know.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
            <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Quick Contact */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md mx-auto px-4">
            <button 
              onClick={() => setCurrentPage('dashboard')}
              className="bg-gray-900 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-md text-sm hover:bg-gray-800 transition-colors flex items-center justify-center"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </button>
          </div>
        </section>

        {/* Categories & FAQs */}
        <section className="px-4 sm:px-8 py-8 sm:py-12 max-w-6xl mx-auto">
          {/* Category Filter */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-6 sm:mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm transition-colors ${
                  activeCategory === category.id
                    ? 'bg-gray-900 text-white'
                    : category.id === 'blockchain' || category.id === 'tokenization' 
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <category.icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{category.label}</span>
                <span className="sm:hidden">{category.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {filteredFAQs.map((faq) => (
              <div key={faq.id} className="bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm sm:text-base font-medium text-gray-900 pr-4">{faq.question}</span>
                  {expandedFAQs.includes(faq.id) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {expandedFAQs.includes(faq.id) && (
                  <div className="px-4 sm:px-6 pb-3 sm:pb-4 border-t border-gray-200 bg-white">
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed pt-3 sm:pt-4">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredFAQs.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500">Try adjusting your search terms or browse different categories.</p>
            </div>
          )}
        </section>

        {/* Contact Section */}
        <section className="px-4 sm:px-8 py-12 sm:py-16 max-w-6xl mx-auto border-t border-gray-100">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-light text-gray-900 mb-4">Still Need Help?</h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
              Our support team is available 24/7 to assist you with any questions or issues.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 mb-4 text-xs sm:text-sm">Get detailed help via email</p>
              <button 
                onClick={() => setCurrentPage('dashboard')}
                className="text-gray-900 font-medium text-xs sm:text-sm hover:text-gray-700 transition-colors"
              >
                info@privatecharterx.com
              </button>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Live Chat</h3>
              <p className="text-gray-600 mb-4 text-xs sm:text-sm">Instant support via chat</p>
              <button className="text-gray-900 font-medium text-xs sm:text-sm hover:text-gray-700 transition-colors">
                <span onClick={() => setCurrentPage('dashboard')}>Start Chat</span>
              </button>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600 mb-4 text-xs sm:text-sm">Round-the-clock assistance</p>
              <span className="text-gray-900 font-medium text-xs sm:text-sm">Always Available</span>
            </div>
          </div>
        </section>
      </div>

    </div>
  );
}

export default Helpdesk;