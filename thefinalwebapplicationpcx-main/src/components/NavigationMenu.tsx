import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Film,
  FileText,
  Calendar
} from 'lucide-react';

export default function NavigationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const exploreItems = [
    {
      icon: <Sparkles size={20} />,
      title: "Explore Aviation Services",
      description: "Trending services to inspire you",
      href: "/services"
    },
    {
      icon: <TrendingUp size={20} />,
      title: "New & Noteworthy",
      description: "Up-and-coming flight options",
      href: "/new-services"
    },
    {
      icon: <Film size={20} />,
      title: "Featured Destinations",
      description: "Popular routes and destinations",
      href: "/destinations",
      hasArrow: true
    },
    {
      icon: <FileText size={20} />,
      title: "Blog",
      description: "Interviews, tutorials, and more",
      href: "/blogposts"
    },
    {
      icon: <Calendar size={20} />,
      title: "Special Offers",
      description: "Exclusive deals and packages",
      href: "/fixed-offers"
    }
  ];

  const categories = [
    { label: "Private Jets", href: "/services/private-jet-charter" },
    { label: "Group Charter", href: "/services/group-charter" },
    { label: "Helicopters", href: "/services/helicopter-charter" },
    { label: "eVTOL", href: "/pages/eVtolpage" },
    { label: "Empty Legs", href: "/empty-legs" },
    { label: "Web3 Services", href: "/web3/ico" },
    { label: "NFT Aviation", href: "/web3/nft-collection" },
    { label: "Marketplace", href: "/services/marketplace" }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 hover:text-black transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-200 rounded-lg hover:bg-gray-50"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-sm font-medium">Menu</span>
        <ChevronDown
          size={16}
          className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="dropdown-content absolute z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            top: '100%',
            marginTop: '0.75rem',
            width: '800px',
            maxWidth: '90vw'
          }}
        >
          <div className="flex">
            {/* Left Section - Explore */}
            <div className="flex-1 p-8 bg-white">
              <div className="space-y-1">
                {exploreItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleNavigation(item.href)}
                    className="group flex items-start w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="mr-4 mt-0.5 text-gray-400 group-hover:text-gray-600">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-black">
                          {item.title}
                        </h3>
                        {item.hasArrow && (
                          <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-600 transition-transform group-hover:translate-x-1" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="w-px bg-gray-100"></div>

            {/* Right Section - Browse Categories */}
            <div className="w-72 p-8 bg-gray-50/50">
              <h3 className="text-sm font-semibold text-gray-900 mb-5">Browse Categories</h3>
              <div className="space-y-3">
                {categories.map((category, index) => (
                  <button
                    key={index}
                    onClick={() => handleNavigation(category.href)}
                    className="block w-full text-left text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Links Bar */}
          <div className="border-t border-gray-100 px-8 py-4 bg-gray-50/30">
            <div className="flex items-center justify-between">
              <div className="flex space-x-6">
                <button
                  onClick={() => handleNavigation('/how-it-works')}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  How It Works
                </button>
                <button
                  onClick={() => handleNavigation('/behind-the-scene')}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  About Us
                </button>
                <button
                  onClick={() => handleNavigation('/partners')}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Partners
                </button>
                <button
                  onClick={() => handleNavigation('/faq')}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  FAQ
                </button>
                <button
                  onClick={() => handleNavigation('/contact')}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Contact
                </button>
              </div>
              <button
                onClick={() => handleNavigation('/web3/jetcard')}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                JetCard Membership →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
