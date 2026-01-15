import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomepageFooter() {
  const navigate = useNavigate();

  return (
    <footer className="bg-gray-50 border-t border-gray-200" style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 300 }}>
      {/* Main Footer Content */}
      <div className="px-4 sm:px-8 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Two-part layout: Brand left, Menus right */}
          <div className="flex flex-col lg:flex-row lg:gap-16">

            {/* Brand Section - Left */}
            <div className="mb-10 lg:mb-0 lg:w-72 flex-shrink-0">
              {/* Logo */}
              <img
                src="https://i.ibb.co/DPF5g3Sk/iu42DU1.png"
                alt="PrivateCharterX"
                className="h-10 object-contain mb-4"
              />
              {/* Description */}
              <p className="text-sm text-gray-500 font-light leading-relaxed mb-4">
                Blockchain-powered private aviation platform. Book jets, helicopters & flights with crypto.
              </p>

              {/* Trustpilot */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5">
                  {[1,2,3,4].map(i => (
                    <svg key={i} className="w-4 h-4" viewBox="0 0 24 24" fill="#00B67A">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                  ))}
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#DDD">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                </div>
                <span className="text-xs text-gray-500">Trustpilot</span>
              </div>

              {/* Accepted Crypto */}
              <div className="mb-5">
                <p className="text-xs text-gray-400 mb-2">We accept</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 bg-gray-100 rounded-md text-xs text-gray-600 font-medium">BTC</span>
                  <span className="px-2.5 py-1 bg-gray-100 rounded-md text-xs text-gray-600 font-medium">ETH</span>
                  <span className="px-2.5 py-1 bg-gray-100 rounded-md text-xs text-gray-600 font-medium">USDC</span>
                  <span className="px-2.5 py-1 bg-gray-100 rounded-md text-xs text-gray-600 font-medium">USDT</span>
                </div>
              </div>

              {/* Social Icons */}
              <div className="flex gap-2.5">
                <a href="https://x.com/PrivatecharterX" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="https://www.linkedin.com/company/privatecharterx" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="https://www.tiktok.com/@privatecharterx" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
                <a href="https://opensea.io/collection/privatecharterx-membership-card" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.629 0 12 0ZM5.92 12.403l.051-.081 3.123-4.884a.107.107 0 0 1 .187.014c.52 1.169.972 2.623.76 3.528-.088.372-.335.876-.614 1.342a2.405 2.405 0 0 1-.117.199.106.106 0 0 1-.09.045H6.013a.106.106 0 0 1-.091-.163Zm13.914 1.68a.109.109 0 0 1-.065.101c-.243.103-1.07.485-1.414.962-.878 1.222-1.548 2.97-3.048 2.97H9.053a4.019 4.019 0 0 1-4.013-4.028v-.072c0-.058.048-.106.108-.106h3.485c.07 0 .12.063.115.132-.026.226.017.459.125.67.206.42.636.682 1.099.682h1.726v-1.347H9.99a.11.11 0 0 1-.089-.173l.063-.09c.16-.231.391-.586.621-.992.156-.274.308-.566.43-.86.024-.052.043-.107.065-.16.033-.094.067-.182.091-.269a4.57 4.57 0 0 0 .065-.223c.057-.25.081-.514.081-.787 0-.108-.004-.221-.014-.327-.005-.117-.02-.235-.034-.352a3.415 3.415 0 0 0-.048-.312 6.494 6.494 0 0 0-.098-.468l-.014-.06c-.03-.108-.056-.21-.09-.317a11.824 11.824 0 0 0-.328-.972 5.212 5.212 0 0 0-.142-.355c-.072-.178-.146-.339-.213-.49a3.564 3.564 0 0 1-.094-.197 4.658 4.658 0 0 0-.103-.213c-.024-.053-.053-.104-.072-.152l-.211-.388c-.029-.053.019-.118.077-.101l1.32.357h.01l.173.05.192.054.07.019v-.783c0-.379.302-.686.679-.686a.66.66 0 0 1 .477.202.69.69 0 0 1 .2.484V6.65l.141.039c.01.005.022.01.031.017.034.024.084.062.147.11.05.038.103.086.165.137a10.351 10.351 0 0 1 .574.504c.214.199.454.432.684.691.065.074.127.146.192.226.062.079.132.156.19.232.079.104.16.212.235.324.033.053.074.108.105.161.096.142.178.288.257.435.034.067.067.141.096.213.089.197.159.396.202.598a.65.65 0 0 1 .024.169v.015c.007.074.01.149.003.224a1.813 1.813 0 0 1-.091.481 2.149 2.149 0 0 1-.127.325c-.034.082-.074.16-.113.243a2.872 2.872 0 0 1-.338.513 1.12 1.12 0 0 1-.113.149c-.036.046-.076.091-.112.141-.058.072-.117.149-.185.215l-.24.267c-.03.036-.07.072-.104.108l-.203.219a.105.105 0 0 1-.074.03h-1.05v1.348h1.323c.295 0 .576-.104.804-.298.075-.065.439-.381.875-.851a.094.094 0 0 1 .058-.03l3.83-1.106a.11.11 0 0 1 .137.103v.773Z"/>
                  </svg>
                </a>
                <a href="mailto:bookings@privatecharterx.com" className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Menu Columns - Right */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-8">
              {/* Services */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Services</h4>
                <div className="space-y-3">
                  <button onClick={() => navigate('/dashboard/chat?query=private+jet')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    Private Jets
                  </button>
                  <button onClick={() => navigate('/dashboard/chat?query=helicopter')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    Helicopters
                  </button>
                  <button onClick={() => navigate('/dashboard/empty-legs')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    Empty Legs
                  </button>
                  <button onClick={() => navigate('/dashboard/ground-transport')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    Ground Transport
                  </button>
                  <button onClick={() => navigate('/adventures')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    Adventures
                  </button>
                  <button onClick={() => navigate('/flight-tickets')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    Flight Tickets
                  </button>
                </div>
              </div>

              {/* Web3 */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Web3</h4>
                <div className="space-y-3">
                  <button onClick={() => navigate('/tokenized')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    Tokenization
                  </button>
                  <button onClick={() => navigate('/rwa-nft')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    NFT Membership
                  </button>
                  <button onClick={() => navigate('/dashboard/web3/pvcx-token')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    PVCX Token
                  </button>
                  <button onClick={() => navigate('/dashboard/web3/launchpad')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    Launchpad
                  </button>
                  <button onClick={() => navigate('/dashboard/web3/marketplace')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    Marketplace
                  </button>
                </div>
              </div>

              {/* Pages */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Pages</h4>
                <div className="space-y-3">
                  <button onClick={() => navigate('/services')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    Services
                  </button>
                  <button onClick={() => navigate('/aviation')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    Aviation
                  </button>
                  <button onClick={() => navigate('/sphera-ai')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    Sphera AI
                  </button>
                  <button onClick={() => navigate('/tokenized')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    RWA Tokenization
                  </button>
                  <button onClick={() => navigate('/rwa-nft')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    RWA NFT
                  </button>
                </div>
              </div>

              {/* Support */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Support</h4>
                <div className="space-y-3">
                  <button onClick={() => navigate('/faqs')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    FAQ
                  </button>
                  <button onClick={() => navigate('/helpdesk')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    Help Center
                  </button>
                  <button onClick={() => navigate('/dashboard/subscriptions/plans')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    Subscriptions
                  </button>
                  <button onClick={() => navigate('/dashboard/requests')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    My Requests
                  </button>
                  <button onClick={() => navigate('/dashboard/bookings')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    My Bookings
                  </button>
                </div>
              </div>

              {/* Legal */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Legal</h4>
                <div className="space-y-3">
                  <button onClick={() => navigate('/terms')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    Terms of Service
                  </button>
                  <button onClick={() => navigate('/privacy')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    Privacy Policy
                  </button>
                  <button onClick={() => navigate('/cookies')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    Cookie Policy
                  </button>
                  <button onClick={() => navigate('/imprint')} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors text-left">
                    Imprint
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Charter Inquiries Section */}
      <div className="border-t border-gray-200 bg-white">
        <div className="px-4 sm:px-8 py-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs text-gray-500 text-center font-light">
              Charter Inquiries & Bookings · <a href="mailto:bookings@privatecharterx.com" className="text-gray-700 hover:text-gray-900 transition-colors">bookings@privatecharterx.com</a> · Available 24/7
            </p>
          </div>
        </div>
      </div>

      {/* Company Info Bar */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="px-4 sm:px-8 py-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs text-gray-500 text-center font-light">
              © 2025 PrivateCharterX LLC · 1000 Brickell Ave. 715 · 33131 Miami, Florida · United States of America · Registration Nr L24000299516
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
