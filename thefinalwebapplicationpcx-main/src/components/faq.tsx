import React, { useState } from 'react';
import {
  X, Search, ArrowRight, AlertTriangle, Mail, 
  Plane, CreditCard, Coins, Award, Globe, HelpCircle,
  Shield, FileText, AlertCircle
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

const Portal = ({ children }) => {
  return (
    <div>
      {children}
    </div>
  );
};

const Faq = () => {
  const [selectedFAQ, setSelectedFAQ] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const faqCategories = [
    {
      id: 'services',
      title: 'Services & Booking',
      subtitle: 'Charter services, booking process, and service delivery',
      icon: Plane,
      faqs: [
        {
          question: 'What services does PrivateCharterX offer?',
          answer: 'PCX provides comprehensive luxury travel services including private jet charter, empty-leg flights, helicopter and air taxi services, yacht charter, luxury vehicle rentals, airport transfers, concierge services, and fixed travel packages. We also offer digital services including NFT membership cards, carbon offset certificates, and $PVCX token ecosystem.'
        },
        {
          question: 'How does the booking process work?',
          answer: 'Service requests constitute binding offers by users. Contracts are formed upon PCX\'s written booking confirmation. All bookings require full passenger details, valid payment method, and are subject to aircraft and crew availability. We reserve the right to decline bookings at our discretion. Availability is confirmed within our standard processing time. The General Terms and Conditions (GTC) of PrivateCharterX are binding for all bookings and form an integral part of the contractual relationship between the Customer and PrivateCharterX.'
        },
        {
          question: 'What information do I need to provide when booking?',
          answer: 'You must provide: complete passenger manifest with full names as per travel documents, contact information for primary passenger, dietary requirements and special requests (minimum 48 hours prior), valid travel documents for all passengers, and emergency contact information.'
        },
        {
          question: 'Can I modify my booking after confirmation?',
          answer: 'Yes, modifications are possible subject to availability and additional costs. Passenger name changes require 24-hour notice and may incur fees. Route changes are subject to new pricing, and aircraft type changes depend on availability.'
        },
        {
          question: 'What are the age and capacity requirements?',
          answer: 'Primary booking party must be minimum 18 years old. Minors (under 18) must be accompanied by a parent/guardian or provide notarized consent. Pregnant passengers beyond 28 weeks require medical clearance, and passengers with medical conditions requiring special assistance must disclose at booking.'
        }
      ]
    },
    {
      id: 'payments',
      title: 'Payment Methods & Processing',
      subtitle: 'Fiat and cryptocurrency payment options',
      icon: CreditCard,
      faqs: [
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept multiple payment methods: Fiat currencies via Stripe (major credit/debit cards), Swiss online banking, SEPA transfers (1-3 business days), SWIFT wire transfers (3-5 business days). For cryptocurrencies: USDC, USDT (Tether), Ethereum (ETH), Bitcoin Lightning Network, $PVCX tokens, and additional ERC-20/BEP-20 tokens (5 business day verification).'
        },
        {
          question: 'How are payments processed and secured?',
          answer: 'Fiat payments provide instant confirmation via payment processor. Cryptocurrency requires 6 network confirmations. We use segregated client accounts with UBS AG (insured up to CHF 1,000,000), and multi-signature cold storage wallets for crypto with specialized insurance coverage and audited smart contracts.'
        },
        {
          question: 'What happens if payment fails?',
          answer: 'Payment failures may result in booking cancellation. Currency conversion occurs at prevailing market rates. We maintain escrow and custody arrangements to protect client funds throughout the transaction process.'
        },
        {
          question: 'What is the Treasury+ JetCard Program?',
          answer: 'The Treasury+ JetCard Program is an invitation-only program with minimum deposit of CHF 50,000 up to a maximum of CHF 1,000,000 and 13-month lock-up period. Projected yield is 0.2% to 3% per annum (not guaranteed). Available as NFT, physical card, or hybrid format. Capital is not guaranteed with potential for losses, and early withdrawal penalties may apply.'
        }
      ]
    },
    {
      id: 'cancellation',
      title: 'Cancellation & Refund Policies',
      subtitle: 'Cancellation timelines and compensation policies',
      icon: AlertCircle,
      faqs: [
        {
          question: 'What are the cancellation fees for private jets?',
          answer: 'Private jet cancellation fees: 72 hours before departure (10% fee), 48-72 hours (25% fee), 24-48 hours (50% fee), less than 24 hours (75% fee), no-show (100% forfeit).'
        },
        {
          question: 'What about helicopter and air taxi cancellations?',
          answer: 'Helicopter and air taxi cancellation fees: 48 hours (15% fee), 24-48 hours (40% fee), less than 24 hours (80% fee).'
        },
        {
          question: 'What happens with weather-related cancellations?',
          answer: 'Flight safety decisions are final and made by certified flight crew. Weather cancellations result in full refund or rebooking at no additional cost. Alternative arrangements are offered when possible.'
        },
        {
          question: 'What is covered under Force Majeure?',
          answer: 'Force majeure events include natural disasters, extreme weather, government restrictions, airport closures, air traffic control strikes, security threats, and aircraft technical emergencies. These result in full refund or rebooking without penalty.'
        },
        {
          question: 'What if PCX cancels my flight?',
          answer: 'PCX-initiated cancellations include: full refund plus 10% service credit for future bookings, alternative arrangements at equivalent or higher service level, and reimbursement of reasonable additional expenses up to CHF 3,000.'
        }
      ]
    },
    {
      id: 'tokens',
      title: '$PVCX Token Ecosystem',
      subtitle: 'Token accrual, utility, and compliance information',
      icon: Coins,
      faqs: [
        {
          question: 'How do I earn $PVCX tokens?',
          answer: 'Users receive 1.5 $PVCX tokens per kilometer flown, credited automatically to their designated wallet address upon successful completion of flight services contracted with PCX.'
        },
        {
          question: 'What can I use $PVCX tokens for?',
          answer: '$PVCX tokens can be used for: payment of services within the PCX ecosystem, trading on authorized cryptocurrency exchanges, access to premium features and benefits as defined in our Token Utility Framework, and staking rewards and governance participation (where applicable).'
        },
        {
          question: 'What are the compliance requirements for token holders?',
          answer: 'The $PVCX token is issued in compliance with Swiss FINMA guidelines and Anti-Money Laundering Act requirements. Identity verification is required for token accrual above CHF 5,000 annual value. Enhanced due diligence applies for high-value transactions.'
        },
        {
          question: 'What are the risks associated with $PVCX tokens?',
          answer: 'Investment risks include extreme price volatility and potential total loss of value, regulatory changes affecting token utility, smart contract vulnerabilities, market manipulation and liquidity risks, and no guarantee of exchange listings.'
        },
        {
          question: 'What is the technical infrastructure?',
          answer: '$PVCX tokens feature ERC-20 standard compliance on Ethereum mainnet, multi-signature wallet security protocols, regular smart contract audits by certified firms, and 24/7 blockchain monitoring and security systems.'
        },
        {
          question: 'What happens if I provide an incorrect wallet address?',
          answer: 'If a customer does not respond and provides a different wallet address than initially specified, PrivateCharterX is not liable for any loss of tokens. It is crucial that customers handle the sharing of their wallet address with care and ensure accuracy when providing this information.'
        }
      ]
    },
    {
      id: 'nft',
      title: 'NFT Membership Program',
      subtitle: 'Lifetime benefits and digital asset ownership',
      icon: Award,
      faqs: [
        {
          question: 'What benefits do NFT holders receive?',
          answer: 'PCX Membership NFT holders enjoy lifetime benefits including: one complimentary empty-leg flight from chosen Empty Legs (renewable upon cancellation), permanent discount of up to 10% on all private jet bookings, priority access to empty-leg flights before public release, complimentary luxury transfers within Switzerland (special international rates available), 24/7 priority support, early access to $PVCX token ecosystem, enhanced token rewards for every kilometer flown, and VIP invitations to exclusive events such as Formula 1 and yacht shows.'
        },
        {
          question: 'What are the technical specifications of the NFTs?',
          answer: 'Our NFTs feature ERC-721 standard compliance, immutable metadata stored on IPFS, 5% royalty structure on secondary sales, and compatibility with major NFT marketplaces.'
        },
        {
          question: 'Can I transfer or trade my NFT?',
          answer: 'Yes, NFTs are freely transferable subject to platform compliance. Secondary market trading is permitted on authorized platforms. Transfer restrictions may apply for regulatory compliance, and original purchaser verification may be required for certain benefits.'
        },
        {
          question: 'What are the risks of NFT ownership?',
          answer: 'NFT risks include value volatility and potential worthlessness, platform dependency risks, regulatory uncertainty regarding NFT classification, and technical risks including smart contract vulnerabilities.'
        }
      ]
    },
    {
      id: 'carbon',
      title: 'Carbon Offset Certificates',
      subtitle: 'Environmental impact mitigation and blockchain integration',
      icon: Globe,
      faqs: [
        {
          question: 'How do carbon offset certificates work?',
          answer: 'PCX facilitates voluntary carbon offset opportunities by enabling the creation of project-specific carbon offset certificates through officially recognized non-governmental organizations (NGOs). These certificates are available for any completed flight route, including flights operated by other charter companies. Users may select from the following arrangements:\n(a) No Carbon Offset: User opts out of carbon offset programs entirely.\n(b) 100% Owned Carbon Offset: User pays the full certificate costs and acquires complete legal and beneficial ownership of the certificate. These certificates are not transferable or tradeable.'
        },
        {
          question: 'Are CO2 certificates included with empty-leg flights?',
          answer: 'Yes, a CO2 certificate is included with every empty-leg flight offered by PrivatecharterX. Customers have the option of having this certificate minted as an NFT and recorded immutably on the blockchain.'
        },
        {
          question: 'What information is shown on blockchain CO2 certificates?',
          answer: 'To protect user privacy, only general, non-personalized information about the carbon offset project and the retirement transaction is recorded on the public blockchain. A detailed, personalized PDF certificate containing specific passenger, flight, and ownership details is sent directly to the customer\'s email address upon retirement of the offset.'
        },
        {
          question: 'How are emissions calculated?',
          answer: 'Carbon emissions are calculated using internationally accepted methodologies including ICAO Carbon Emissions Calculator standards and DEFRA conversion factors, adjusted for specific aircraft types, flight distances, and passenger load factors.'
        },
        {
          question: 'How does blockchain integration work?',
          answer: 'All carbon offset certificates are minted as NFTs and recorded on blockchain infrastructure, providing maximum transparency, complete traceability, tamper-proof authenticity, immutable ownership records, and real-time verification capabilities.'
        },
        {
          question: 'What happens after I purchase a certificate?',
          answer: 'Upon purchase of a 100% Owned Carbon Offset, the issuing NGO immediately and permanently retires the certificate in the relevant central registry (e.g., VCS, Gold Standard). This retirement is final and irrevocable, removing the certificate from circulation and making it non-transferable and non-tradeable, thus eliminating any possibility of double counting or greenwashing. A tamper-evident retirement record containing the registry URL and blockchain transaction ID is delivered to you via email within five (5) business days.'
        }
      ]
    },
    {
      id: 'safety',
      title: 'Safety & Security Protocols',
      subtitle: 'Aviation safety standards and operational procedures',
      icon: Shield,
      faqs: [
        {
          question: 'What are your operator requirements?',
          answer: 'PCX exclusively contracts with aviation operators who maintain all necessary certifications, including:\n• Valid Air Operator Certificates (AOC) from recognized aviation authorities (e.g., EASA, FAA)\n• Current operating licenses in good standing\n• Comprehensive aviation insurance coverage (minimum EUR 100 million per occurrence)\n• EASA Part-145 maintenance approvals or equivalent\n• IS-BAO (International Standard for Business Aircraft Operations) certification is preferred\n• Compliance with all applicable safety and operational regulations, including implemented Safety Management Systems (SMS)'
        },
        {
          question: 'What security screening is required?',
          answer: 'All passengers and baggage are subject to security screening. Prohibited items follow ICAO Annex 17 and local aviation authority regulations. We reserve the right to refuse carriage for security reasons and require advance notification for valuable items or special cargo.'
        },
        {
          question: 'What items are strictly prohibited?',
          answer: 'Strictly prohibited items include: explosives, flammable liquids (except limited personal care items), compressed gases, toxic substances, weapons and ammunition (except authorized personnel), radioactive materials, and lithium batteries above specified watt-hours.'
        },
        {
          question: 'What are the medical requirements?',
          answer: 'Passengers with contagious diseases may be refused carriage. In a medical emergency, the aircraft will divert to the nearest suitable airport. First aid equipment is available on all flights. Medical clearance is required for passengers beyond 28 weeks of pregnancy. Passengers requiring supplemental oxygen, medical equipment, or with conditions requiring special assistance must notify us at least 48 hours in advance.'
        },
        {
          question: 'Who has final authority on safety matters?',
          answer: 'The pilot-in-command has final authority on all safety matters, including the right to refuse takeoff or continue flight for safety reasons. Passenger compliance with crew instructions is mandatory. Disruptive behavior may result in flight diversion and legal action.'
        }
      ]
    },
    {
      id: 'data',
      title: 'Data Protection & Privacy',
      subtitle: 'Data collection, processing, and user rights',
      icon: FileText,
      faqs: [
        {
          question: 'What data do you collect and why?',
          answer: 'We process personal data based on several legal grounds under applicable data protection laws such as the GDPR, including: necessity for the performance of our contract with you (Article 6(1)(b)), compliance with legal obligations (Article 6(1)(c)), our legitimate interests (Article 6(1)(f)), and where specifically obtained, your consent (Article 6(1)(a)). Essential data collected includes identity information, contact details, travel documents, and payment information. Operational data includes flight preferences, dietary and accessibility requirements, emergency contact information, and communication records.'
        },
        {
          question: 'How is my data protected?',
          answer: 'We implement robust security measures including AES-256 encryption for data at rest, TLS 1.3 encryption for data in transit, multi-factor authentication, regular penetration testing, security audits, staff training, and incident response procedures.'
        },
        {
          question: 'Who do you share my data with?',
          answer: 'Data is shared with licensed aviation operators (necessary for service delivery), payment processors and financial institutions, regulatory authorities when legally required, and emergency services when necessary for safety. International transfers outside the EU/EEA are based on adequacy decisions or appropriate safeguards, such as Standard Contractual Clauses (SCCs). For transfers to countries without an adequacy decision, we rely on SCCs and, where required by applicable law, obtain your explicit consent.'
        },
        {
          question: 'How long do you retain my data?',
          answer: 'Transaction records: 10 years (Swiss tax law), Operational data: 3 years from last service, Marketing data: Until consent withdrawn, Blockchain data: Permanent and immutable, Security logs: 2 years.'
        },
        {
          question: 'What are my data rights?',
          answer: 'You have the right to access personal data, rectify inaccurate information, erase data (subject to legal retention requirements), restrict processing, data portability, object to processing based on legitimate interests, and withdraw consent (where applicable). Please note: Data recorded on a blockchain (e.g., for tokens or NFTs) is immutable by design, meaning the "right to erasure" may be technically impossible to fulfill for such specific data sets, as explained in our Terms and Conditions.'
        }
      ]
    },
    {
      id: 'legal',
      title: 'Legal & Compliance',
      subtitle: 'Terms, liability, and regulatory compliance',
      icon: AlertTriangle,
      faqs: [
        {
          question: 'What law governs these terms?',
          answer: 'Swiss law governs these Terms exclusively. The application of conflicts of law principles and the United Nations Convention on Contracts for the International Sale of Goods (CISG) are expressly excluded. Exclusive jurisdiction for any disputes lies with the Courts of Zurich, Switzerland. PCX may, however, seek injunctive relief in any competent jurisdiction. Consumer protection laws of the consumer\'s residence may apply where mandated by law. Services involving international flights are subject to applicable international conventions, including the Montreal Convention 1999 and the Warsaw Convention. Service of legal process must be made to our registered office in Switzerland.'
        },
        {
          question: 'What are the liability limitations?',
          answer: 'For international flights, Montreal Convention 1999 liability limits apply:\n• Death/injury: 128,821 SDR per passenger (unlimited if carrier negligence is proven)\n• Baggage: 1,288 SDR per passenger (approx. $1,800)\n• Delay: 5,346 SDR per passenger (approx. $7,200)\nFor domestic flights, national aviation liability rules apply. PCX\'s total aggregate liability shall not exceed the service fees paid for the specific service or a maximum of CHF 100,000 per incident for non-aviation services, whichever is lower. These limitations do not apply in cases of death or personal injury resulting from our gross negligence or wilful misconduct, fraud, data protection law violations, or where consumer protection rights cannot be limited by contract.'
        },
        {
          question: 'What are my consumer rights?',
          answer: 'EU consumers have a 14-day withdrawal period (cooling-off period) from the date of booking confirmation, during which you can cancel with no fees and receive a full refund. This right of withdrawal does not apply to contracts for services where performance has begun within the 14-day period with your express consent (e.g., a flight booked for immediate departure), or for customized/personalized services. You also have data subject rights under the GDPR, including the right to access, rectify, erase (subject to legal retention requirements), restrict processing, data portability, and to object to processing based on legitimate interests. Please note that data immutably recorded on a blockchain may affect the practical application of the \'right to erasure\'.'
        },
        {
          question: 'How do you handle complaints?',
          answer: 'Complaints can be submitted via email to legal@PrivatecharterX.com. As outlined in our Terms and Conditions (Section 17.1), written complaints are acknowledged within 2 business days. We aim to investigate and provide a resolution within a maximum of 30 calendar days. Our internal escalation process includes review by customer service, operations management, the legal/compliance department, and finally executive management for unresolved serious issues.'
        },
        {
          question: 'What is your dispute resolution process?',
          answer: 'Our process is designed for efficient resolution:\n1. Internal Complaint Procedure (as described in Q43).\n2. Mediation: We offer mediation through the Swiss Chamber of Commerce (venue: Zurich, English language).\n3. Arbitration: If unresolved, disputes may be referred to arbitration under the Swiss Rules of International Arbitration (venue: Zurich, English language). A single arbitrator is appointed for claims below CHF 1,000,000; three arbitrators are used for larger claims.\n4. EU ODR Platform: EU consumers have access to the European Online Dispute Resolution platform. We prefer individual dispute resolution. Where legally permissible, you agree to waive the right to participate in class actions or collective proceedings. Representative actions permitted under Swiss law remain available.'
        }
      ]
    },
    {
      id: 'web3',
      title: 'Web3 & Digital Assets',
      subtitle: 'Blockchain technology and digital asset services',
      icon: Coins,
      faqs: [
        {
          question: 'What Web3 services does PCX offer?',
          answer: 'PCX offers several Web3 services integrated into our travel ecosystem, as detailed in our Terms and Conditions: Membership cards in the form of tradable NFTs (Section 8), carbon offset certificates minted as NFTs (Section 9), the $PVCX token ecosystem (Section 7), and the Treasury+ JetCard Program available in NFT format (Section 10.5).'
        },
        {
          question: 'How does PCX ensure regulatory compliance for digital assets?',
          answer: 'PCX ensures compliance by adhering to Swiss financial regulations under the supervision of the Swiss Financial Market Supervisory Authority (FINMA). This includes implementing KYC/AML procedures (Section 7.5), conducting enhanced due diligence for high-value transactions, real-time sanctions screening (Section 16.3), and issuing the $PVCX token in compliance with FINMA guidelines and the Anti-Money Laundering Act (AMLA) requirements (Section 7.3).'
        },
        {
          question: 'What blockchain networks does PCX use?',
          answer: 'PCX primarily utilizes the Ethereum mainnet for its digital asset infrastructure, as specified in our Terms and Conditions. The $PVCX token is an ERC-20 standard token (Section 7.6), while membership NFTs and carbon offset certificates are issued under the ERC-721 standard (Sections 8.2, 9.7). All assets benefit from multi-signature security protocols, regular smart contract audits by certified firms, and 24/7 monitoring.'
        },
        {
          question: 'How does PCX handle the "right to be forgotten" with blockchain?',
          answer: 'As explained in Section 11.7 of our Terms and Conditions, blockchain transactions are immutable by design, meaning data cannot be altered or erased once confirmed. To reconcile this with data protection principles, PCX employs a strategy of personal data minimization on-chain. Personally identifiable information (PII) is stored off-chain wherever possible. We transparently explain this technical limitation and the practical implications for the \'right to erasure\' under regulations like the GDPR to our users before they engage with blockchain-based services.'
        },
        {
          question: 'What are the risks of PCX\'s digital assets?',
          answer: 'Engagement with digital assets involves inherent risks, which are disclosed in Sections 7.4 ($PVCX tokens) and 8.4 (NFTs) of our Terms and Conditions. These include but are not limited to: extreme price volatility and potential total loss of value, regulatory changes that could affect utility or tradability, smart contract vulnerabilities or bugs, platform dependency risks, market manipulation and liquidity risks, and no guarantee of continued exchange listings or trading venues. Users are strongly advised to understand these risks fully before participation.'
        }
      ]
    }
  ];

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  const FAQModal = ({ faq, onClose }) => {
    if (!faq) return null;
    return (
      <Portal>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-8 border-b border-gray-100">
              <h2 className="text-2xl font-light text-black pr-8">{faq.question}</h2>
              <button
                onClick={onClose}
                className="p-3 hover:bg-gray-50 rounded-full transition-colors flex-shrink-0"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto">
              <div className="prose max-w-none">
                <p className="text-gray-700 font-light leading-relaxed whitespace-pre-line">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Portal>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      {/* Main Content */}
      <main className="flex-1 pt-[88px]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-4 tracking-tighter">
              Frequently Asked Questions
            </h1>
            
            <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto font-light">
              Comprehensive answers about our services, policies, and procedures. 
              Find detailed information about booking, payments, cancellations, and more.
            </p>
            {/* Search */}
            <div className="max-w-md mx-auto mb-12">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-300 font-light"
                />
              </div>
            </div>
          </div>
          {/* FAQ Categories */}
          <div className="space-y-12">
            {filteredCategories.map((category) => (
              <div key={category.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-100">
                  <div className="flex items-center gap-4 mb-2">
                    <category.icon size={24} className="text-gray-400" />
                    <h2 className="text-2xl font-light text-black">{category.title}</h2>
                  </div>
                  <p className="text-gray-500 font-light">{category.subtitle}</p>
                </div>
                
                <div className="divide-y divide-gray-50">
                  {category.faqs.map((faq, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedFAQ(faq)}
                      className="w-full p-6 text-left hover:bg-gray-25 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-black group-hover:text-gray-700 transition-colors pr-4">
                          {faq.question}
                        </h3>
                        <ArrowRight size={16} className="text-gray-400 group-hover:text-black transition-colors flex-shrink-0" />
                      </div>
                      <p className="text-sm text-gray-500 font-light leading-relaxed mt-2 line-clamp-2">
                        {faq.answer.substring(0, 120)}...
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Contact Section */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 mt-16 text-center">
            <HelpCircle className="mx-auto mb-4 text-gray-400" size={32} />
            <h2 className="text-2xl font-light text-black mb-4">Still have questions?</h2>
            <p className="text-gray-500 font-light mb-8 max-w-md mx-auto">
              Our team is available to provide personalized assistance and detailed answers 
              to any specific questions about our services.
            </p>
            <a
              href="mailto:legal@PrivatecharterX.com"
              className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium"
            >
              <Mail size={18} />
              Contact Our Team
            </a>
          </div>
        </div>
      </main>
      <Footer />
      {/* FAQ Modal */}
      <FAQModal 
        faq={selectedFAQ} 
        onClose={() => setSelectedFAQ(null)} 
      />
    </div>
  );
};

export default Faq;
