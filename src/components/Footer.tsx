import React from 'react';
import { Twitter, Instagram, Globe, Mail, Coins, Plane, FileCheck, Zap, Leaf, MessageCircle, Shield, CreditCard, Award, Newspaper, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Footer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('user_role')
        .eq('id', user.id)
        .single();

      if (!error && userData) {
        setIsAdmin(userData.user_role === 'admin');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const handleDashboardLink = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/dashboard'); // Will trigger auth flow
    }
  };

  return (
    <footer className="bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-4">
            <img
              src="https://i.imgur.com/iu42DU1.png"
              alt="PrivateCharterX"
              className="h-16 w-auto object-contain mb-6"
            />
            <h2 className="text-lg font-light text-gray-900">{t('footer.tagline')}</h2>
            <p className="mt-2 text-sm text-gray-600 max-w-lg font-light leading-relaxed">{t('footer.description')}</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <a href="mailto:info@privatecharterx.com" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-light">
                <Mail size={16} />
                <span className="text-sm">{t('footer.emailUs')}</span>
              </a>
            </div>
            <div className="mt-6">
              <div className="flex space-x-4">
                <a href="https://x.com/privatecharterx" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors">
                  <Twitter size={18} />
                </a>
                <a href="https://www.instagram.com/privatecharterx" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors">
                  <Instagram size={18} />
                </a>
                <a href="https://privatecharterx.blog" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors">
                  <Globe size={18} />
                </a>
                <a href="https://t.me/privatecharterxOfficial" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors">
                  <MessageCircle size={18} />
                </a>
              </div>
            </div>

            {/* Mobile Apps - Coming Soon */}
            <div className="mt-8">
              <p className="text-xs text-gray-500 font-light mb-3">Mobile Apps Coming Soon</p>
              <div className="flex items-center gap-3">
                <img
                  src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/Google-Play-App-Store-PNG-Transparent-Image.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9Hb29nbGUtUGxheS1BcHAtU3RvcmUtUE5HLVRyYW5zcGFyZW50LUltYWdlLnBuZyIsImlhdCI6MTc1NzI1Njc0NSwiZXhwIjoxNzg4NzkyNzQ1fQ.rPIzwaEEIzkTNSEb764iXQKhcJfWuT9joDdcdtOyhac"
                  alt="Download on App Store and Google Play"
                  className="h-10 opacity-60 hover:opacity-80 transition-opacity cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-8">
              <div>
                <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4 letter-spacing-wide">Aviation Services</h3>
                <ul className="space-y-2">
                  <li><button onClick={handleDashboardLink} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light text-left">Private Jet Charter</button></li>
                  <li><button onClick={handleDashboardLink} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light text-left">Group Charter</button></li>
                  <li><button onClick={handleDashboardLink} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light text-left">Helicopter Charter</button></li>
                  <li><button onClick={handleDashboardLink} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light flex items-center gap-2 text-left"><Zap size={12} /> eVTOL Flights</button></li>
                  <li><button onClick={handleDashboardLink} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light text-left">Adventure Packages</button></li>
                  <li><button onClick={handleDashboardLink} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light text-left">Empty Legs</button></li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4">Web3 & Digital</h3>
                <ul className="space-y-2">
                  <li><button onClick={handleDashboardLink} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light text-left">Web3</button></li>
                  <li><button onClick={handleDashboardLink} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light text-left">PVCX Token</button></li>
                  <li><button onClick={handleDashboardLink} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light text-left">NFT Aviation</button></li>
                  <li><button onClick={handleDashboardLink} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light text-left">Asset Licensing</button></li>
                  <li><button onClick={handleDashboardLink} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light text-left">JetCard Packages</button></li>
                  <li><button onClick={handleDashboardLink} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light text-left">CO2 Certificates</button></li>
                  <li><button onClick={handleDashboardLink} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light text-left">Marketplace</button></li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4">Partners & Press</h3>
                <ul className="space-y-2">
                  <li><button onClick={handleDashboardLink} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light text-left">Partner With Us</button></li>
                  <li><button onClick={handleDashboardLink} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light text-left">Blog Posts</button></li>
                  <li><a href="https://privatecharterx.blog" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light">Press Center</a></li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li><Link to="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light">Home</Link></li>
                  <li><button onClick={handleDashboardLink} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light text-left">How It Works</button></li>
                  <li><button onClick={handleDashboardLink} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light text-left">About</button></li>
                  <li><button onClick={handleDashboardLink} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light text-left">FAQ</button></li>
                  <li><button onClick={handleDashboardLink} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light text-left">Support</button></li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4">Charter</h3>
                <ul className="space-y-2">
                  <li><Link to="/charter-a-jet" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light">Charter a Jet</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8">
          <div className="mt-6 text-left">
            <p className="text-xs text-gray-400 font-light leading-relaxed max-w-4xl">
              PrivateCharterX acts exclusively as a broker and intermediary for aviation, yachting, and luxury transportation services. We are not an operator and do not own, operate, or maintain any aircraft. We operate under applicable aviation brokerage regulations and maritime charter laws. We are committed to environmental responsibility and support CO2 offset programs and sustainable aviation initiatives to minimize the environmental impact of luxury transportation.
            </p>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center mt-6">
            <p className="text-xs text-gray-500 font-light">
              &copy; {new Date().getFullYear()} PrivateCharterX. {t('footer.allRightsReserved')}
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <button onClick={handleDashboardLink} className="text-xs text-gray-500 hover:text-gray-900 transition-colors font-light">Impressum</button>
              <button onClick={handleDashboardLink} className="text-xs text-gray-500 hover:text-gray-900 transition-colors font-light">{t('footer.privacyPolicy')}</button>
              <button onClick={handleDashboardLink} className="text-xs text-gray-500 hover:text-gray-900 transition-colors font-light">{t('footer.termsOfService')}</button>
              <button onClick={handleDashboardLink} className="text-xs text-gray-500 hover:text-gray-900 transition-colors font-light">FAQ</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
