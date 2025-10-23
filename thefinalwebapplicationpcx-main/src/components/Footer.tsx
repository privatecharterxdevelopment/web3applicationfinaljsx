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

  return (
    <footer className="bg-gray-50 text-gray-900 border-t border-gray-200">
      <div className="max-w-8xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4 letter-spacing-wide">{t('footer.services')}</h3>
                <ul className="space-y-2">
                  <li><Link to="/services/private-jet-charter" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light">{t('footer.privateJetCharter')}</Link></li>
                  <li><Link to="/services/group-charter" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light">{t('footer.groupCharter')}</Link></li>
                  <li><Link to="/services/helicopter-charter" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light">{t('footer.helicopterCharter')}</Link></li>
                  <li><Link to="/pages/eVtolpage" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light flex items-center gap-2"><Zap size={12} /> eVTOL Flights</Link></li>
                  <li><Link to="/fixed-offers" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light">{t('footer.fixedOffers')}</Link></li>
                  <li><Link to="/empty-legs" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light">{t('footer.emptyLegs')}</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4">Web3</h3>
                <ul className="space-y-2">
                  <li><Link to="/web3/ico" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light flex items-center gap-2"><Coins size={12} /> PVCX Token</Link></li>
                  <li><Link to="/web3/nft-collection" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light flex items-center gap-2"><Plane size={12} /> NFT Aviation</Link></li>
                  <li><Link to="/web3/asset-licensing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light flex items-center gap-2"><Shield size={12} /> Asset Licensing</Link></li>
                  <li><Link to="/web3/jetcard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light flex items-center gap-2"><CreditCard size={12} /> JetCard Packages</Link></li>
                  <li><Link to="/web3/carbon-certificates" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light flex items-center gap-2"><Leaf size={12} className="text-green-600" /> CO2 Certificates</Link></li>
                  <li><Link to="/services/marketplace" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light flex items-center gap-2"><ShoppingCart size={12} /> Marketplace</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4">Partners & Press</h3>
                <ul className="space-y-2">
                  <li><Link to="/partners-board" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light flex items-center gap-2"><Award size={12} /> Partners Board</Link></li>
                  <li><Link to="/partners" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light">Partner With Us</Link></li>
                  <li><Link to="/blogposts" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light flex items-center gap-2"><Newspaper size={12} /> Blog Posts</Link></li>
                  <li><a href="https://privatecharterx.blog" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light flex items-center gap-2"><Globe size={12} /> Press Center</a></li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4">{t('footer.quickLinks')}</h3>
                <ul className="space-y-2">
                  <li><Link to="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light">{t('footer.home')}</Link></li>
                  <li><Link to="/how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light">{t('footer.howItWorks')}</Link></li>
                  <li><Link to="/behind-the-scene" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light">{t('footer.about')}</Link></li>
                  <li><Link to="/faq" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light">FAQ</Link></li>
                  <li><Link to="/contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light">{t('footer.support')}</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Rest of footer stays the same */}
        <div className="border-t border-gray-200 pt-6">
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
              <Link to="/impressum" className="text-xs text-gray-500 hover:text-gray-900 transition-colors font-light">Impressum</Link>
              <Link to="/privacy-policy" className="text-xs text-gray-500 hover:text-gray-900 transition-colors font-light">{t('footer.privacyPolicy')}</Link>
              <Link to="/terms" className="text-xs text-gray-500 hover:text-gray-900 transition-colors font-light">{t('footer.termsOfService')}</Link>
              <Link to="/faq" className="text-xs text-gray-500 hover:text-gray-900 transition-colors font-light">FAQ</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
