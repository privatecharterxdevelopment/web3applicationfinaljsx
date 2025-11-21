import { Link } from 'react-router-dom';
import { Twitter, Github, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-50 text-gray-900 rounded-t-3xl py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img
                src="/logo.svg"
                alt="DexRais Logo"
                className="w-10 h-10"
              />
              <span className="text-xl font-semibold text-gray-900">
                DexRais<span className="font-bold">.funds</span>
              </span>
            </div>
            <p className="text-gray-600 font-normal leading-relaxed">
              Decentralized fundraising for DAOs and Web3 projects on Base Chain.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/launchpad" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                  Launchpad
                </Link>
              </li>
              <li>
                <Link to="/create" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                  Create Campaign
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              <li>
                <a href="https://docs.dexrais.funds" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                  Documentation
                </a>
              </li>
              <li>
                <a href="https://github.com/privatecharterxdevelopment/dexrais.funds" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                  Smart Contracts
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                  Help Center
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">Community</h4>
            <div className="flex space-x-4">
              <a
                href="https://twitter.com/dexrais"
                className="w-11 h-11 bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-200 hover:border-gray-300 transition-colors text-gray-700 hover:text-gray-900"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://discord.gg/dexrais"
                className="w-11 h-11 bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-200 hover:border-gray-300 transition-colors text-gray-700 hover:text-gray-900"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/privatecharterxdevelopment/dexrais.funds"
                className="w-11 h-11 bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-200 hover:border-gray-300 transition-colors text-gray-700 hover:text-gray-900"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t-2 border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 font-medium text-sm">
            © 2025 DexRais.funds. All rights reserved.
          </p>

          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
