// App.tsx - Fixed AppKit configuration
import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
// QueryClient is provided from main.tsx
import { useAuth0 } from '@auth0/auth0-react';
import { ArrowRight, MapPin, Calendar, Users, Check } from 'lucide-react';

// ===== WAGMI/REOWN IMPORTS =====
import { WagmiProvider } from 'wagmi';
import { mainnet, base } from 'wagmi/chains';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

import Header from '../../components/Header.tsx';
import LoginNew from '../../pages/LoginNew.tsx';
import RegisterNew from '../../pages/RegisterNew.tsx';
import VerifyEmail from '../../pages/VerifyEmail.tsx';
import GoogleCalendarCallback from '../GoogleCalendarCallback.jsx';
import MapboxMap from '../../components/Map.tsx';
import WeatherWidget from '../../components/WeatherWidget.tsx';
import Logo from '../../components/Logo.tsx';
import Footer from '../../components/Footer.tsx';
import NavigationMenu from '../../components/NavigationMenu.tsx';
import CookieBanner from '../../components/CookieBanner.tsx';
import ErrorBoundary from '../../components/ErrorBoundary.tsx';
import LoadingSpinner from '../../components/LoadingSpinner.tsx';
import ServicesCarousel from '../../components/ServicesCarousel.tsx';
import CheckoutPage from '../../components/CheckoutPage.tsx';
import type { Location, Weather, Stop, BookingDetails } from '../../types.ts';
import { AuthProvider, useAuth } from '../../context/AuthContext.tsx';
import { ThemeProvider } from '../../context/ThemeContext.tsx';
import { MaintenanceProvider, useMaintenance } from '../../context/MaintenanceContext.tsx';
import MaintenanceMode from '../../components/MaintenanceMode.tsx';
import ChatSupport from '../../components/ChatSupport.tsx';
import Dashboard from '../../components/Dashboard.tsx';
import AdminLayout from '../../pages/admin/Layout.tsx';
import AdminAnalytics from '../../pages/admin/Analytics.tsx';
import AdminUsers from '../../pages/admin/Users.tsx';
import AdminBookingRequests from '../../pages/admin/BookingRequests.tsx';
import AdminUserRequests from '../../pages/admin/UserRequests.tsx';
import AdminKYCVerification from '../../pages/admin/KYCVerification.tsx';
import AdminCO2Certificates from '../../pages/admin/CO2Certificates.tsx';
import AdminManagement from '../../pages/admin/Management.tsx';
import AdminNewsletter from '../../pages/admin/Newsletter.tsx';
import AdminPartners from '../../pages/admin/Partners.tsx';
import AdminTransactions from '../../pages/admin/Transactions.tsx';
import Faq from '../../components/faq.tsx';  // LOWERCASE faq.tsx

// Import pages
import FixedOffers from '../../pages/FixedOffers.tsx';
import EmptyLegOffers from '../../pages/EmptyLegOffers.tsx';
import AdminOffers from '../../pages/AdminOffers.tsx';
import BehindTheScene from '../../pages/BehindTheScene.tsx';
import HowItWorks from '../../pages/HowItWorks.tsx';
import Contact from '../../pages/Contact.tsx';
import Crypto from '../../pages/Crypto.tsx';
import GroupCharter from '../../pages/services/GroupCharter.tsx';
import HelicopterCharter from '../../pages/services/HelicopterCharter.tsx';
import PrivateJetCharter from '../../pages/services/PrivateJetCharter.tsx';
import PartnersBoard from '../../pages/services/PartnersBoard.tsx';
import EVTOL from '../../pages/services/EVTOL.tsx';
import EVTOLPage from '../../pages/eVtolpage.tsx';
import ICO from '../../pages/web3/ICO.tsx';
import NFTCollection from '../../pages/web3/NFTCollection.tsx';
import CarbonCertificates from '../../pages/web3/CarbonCertificates.tsx';
import DAODrivenTokenizedAssetLicensing from '../../pages/web3/DAODrivenTokenizedAssetLicensing.tsx';
import Impressum from '../../pages/Legal/Impressum.tsx';
import PrivacyPolicy from '../../pages/Legal/PrivacyPolicy.tsx';
import TermsConditions from '../../pages/Legal/TermsConditions.tsx';
import Partners from '../../pages/Partners.tsx';
import AITravelAgent from '../../pages/web3/AITravelAgent.tsx';
import LuxuryCars from '../../pages/LuxuryCars.tsx';
import BlogPosts from '../../pages/BlogPosts.tsx';
import ResetPassword from '../../pages/ResetPassword.tsx';
import JetCard from '../../pages/JetCard.tsx';
import EnhancedServicesMap from '../../components/EnhancedServicesMap.jsx';
import TravelDesignerPage from '../../components/TravelDesigner.tsx';

// Import TokenSwap page
import TokenSwapPage from './TokenSwapPage';

// Import Landing Page Components
import Homepage from './Homepage_new';
import Services from './Services';
import Technology from './Technology';
import Aviation from './Aviation';
import Tokenized from './Tokenized';

// Import your complete dashboard
import TokenizedAssets from './tokenized-assets.jsx';
import TokenizedAssetsGlassmorphic from './tokenized-assets-glassmorphic.jsx';
import ProjectPage from './ProjectPage.jsx';

// Import Charter a Jet page
import CharterAJet from './CharterAJet.jsx';

// Import AI Chat standalone view
import AIChat from './AIChat.jsx';

// Import Detail pages
import EmptyLegDetail from './EmptyLegDetail.jsx';
import AdventureDetail from './AdventureDetail.jsx';
import LuxuryCarDetail from './LuxuryCarDetail.jsx';
import JetDetail from './JetDetail.jsx';
import HelicopterDetail from './HelicopterDetail.jsx';
import CO2CertificateDetail from './CO2CertificateDetail.jsx';

// Import Chat Widget
import ChatWidget from './ChatWidget.jsx';

// Import the CO2 Marketplace component
import Marketplace from '../../services/Marketplace.tsx';

// Import the new unified booking flow instead of separate components
import UnifiedBookingFlow from '../../components/UnifiedBookingFlow.tsx';

// Import Partner components
import PartnerDashboard from '../../components/PartnerDashboard.tsx';

// Import Newsletter components
import NewsletterPreferences from '../../pages/NewsletterPreferences.tsx';
import NewsletterUnsubscribe from '../../pages/NewsletterUnsubscribe.tsx';

import { supabase } from '../../lib/supabase.ts';

// ===== WAGMI/REOWN CONFIGURATION =====
const projectId = 'a9111834382219cf7080a2d516cad517';

// FIXED: Simplified configuration
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [base, mainnet]
});

// FIXED: Cleaner AppKit configuration  
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [base, mainnet],
  defaultNetwork: base,
  metadata: {
    name: 'PrivateCharterX',
    description: 'Luxury Private Charter Platform',
    url: 'https://privatecharterx.com',
    icons: ['https://privatecharterx.com/favicon.ico']
  },
  features: {
    analytics: false,
    email: false,
    socials: []
  }
});


function LogoutPopupComponent() {
  const { user } = useAuth();

  return null;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}

// Main App Content Component (wrapped by AuthProvider)
function AppContent() {
  const { isLoading } = useAuth0();
  const { isMaintenanceMode } = useMaintenance();
  const navigate = useNavigate();
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardView, setDashboardView] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [resetMapKey, setResetMapKey] = useState(0); // For resetting map rotation

  const [fixedOffers, setFixedOffers] = useState<any[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

  // Scroll detection for header transparency
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch adventure packages from database
  useEffect(() => {
    const fetchFixedOffers = async () => {
      try {
        setLoadingOffers(true);
        const { data, error } = await supabase
          .from('fixed_offers')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setFixedOffers(data || []);
      } catch (error) {
        console.error('Error fetching adventure packages:', error);
        setFixedOffers([]);
      } finally {
        setLoadingOffers(false);
      }
    };

    fetchFixedOffers();
  }, []);

  // Check if we're on admin subdomain
  const isAdminDomain = window.location.hostname.startsWith('admin.');

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isMaintenanceMode) {
    return <MaintenanceMode />;
  }

  return (
    <div>
      <Suspense fallback={<LoadingSpinner />}>
        <ScrollToTop />
        <Routes>
          {isAdminDomain ? (
            // Admin Routes
            <>
              <Route path="/" element={<Navigate to="/admin/analytics" replace />} />
              <Route path="/login" element={<Navigate to="/admin/analytics" replace />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/analytics" replace />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="booking-requests" element={<AdminBookingRequests />} />
                <Route path="user-requests" element={<AdminUserRequests />} />
                <Route path="kyc-verification" element={<AdminKYCVerification />} />
                <Route path="co2-certificates" element={<AdminCO2Certificates />} />
                <Route path="partners" element={<AdminPartners />} />
                <Route path="transactions" element={<AdminTransactions />} />
                <Route path="management" element={<AdminManagement />} />
                <Route path="newsletter" element={<AdminNewsletter />} />
              </Route>
              <Route path="/offers" element={<AdminOffers />} />
            </>
          ) : (
            // Main Site Routes
            <>
              {/* CHECKOUT PAGE ROUTE - CRITICAL FOR WEB3 PAYMENTS */}
              <Route path="/checkout" element={<CheckoutPage />} />

              {/* Google Calendar OAuth Callback */}
              <Route path="/auth/google/callback" element={<GoogleCalendarCallback />} />

              {/* Landing Page Routes */}
              <Route path="/services" element={<Services setCurrentPage={() => {}} />} />
              <Route path="/technology" element={<Technology setCurrentPage={() => {}} />} />
              <Route path="/aviation" element={<Aviation setCurrentPage={() => {}} />} />
              <Route path="/tokenized" element={<Tokenized setCurrentPage={() => {}} />} />
              <Route path="/tokenswap" element={<TokenSwapPage />} />

              {/* Dashboard Route - Glassmorphic Dashboard */}
              <Route path="/dashboard" element={<TokenizedAssetsGlassmorphic />} />

              {/* Tokenized Assets Route */}
              <Route path="/tokenized-assets" element={<TokenizedAssets />} />

              {/* Glassmorphic Version */}
              <Route path="/glas" element={<TokenizedAssetsGlassmorphic />} />

              {/* AI Chat direct route */}
              <Route path="/chat" element={<AIChat />} />

              {/* Individual Project Pages */}
              <Route path="/project/:projectId" element={<ProjectPage />} />

              {/* Detail Pages */}
              <Route path="/empty-leg/:id" element={<EmptyLegDetail />} />
              <Route path="/adventure/:id" element={<AdventureDetail />} />
              <Route path="/luxury-car/:id" element={<LuxuryCarDetail />} />
              <Route path="/jet/:id" element={<JetDetail />} />
              <Route path="/helicopter/:id" element={<HelicopterDetail />} />
              <Route path="/co2-certificate/:id" element={<CO2CertificateDetail />} />

              {/* User Dashboard Route */}
              <Route path="/tokenized-assets/dashboard" element={<Dashboard />} />

              {/* Partner Dashboard Route */}
              <Route path="/partner-dashboard" element={<PartnerDashboard />} />

              {/* Charter a Jet Route */}
              <Route path="/charter-a-jet" element={<CharterAJet />} />

              {/* Auth Routes */}
              <Route path="/login" element={<LoginNew />} />
              <Route path="/register" element={<RegisterNew />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* All other pages now integrated into dashboard */}

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/analytics" replace />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="booking-requests" element={<AdminBookingRequests />} />
                <Route path="user-requests" element={<AdminUserRequests />} />
                <Route path="kyc-verification" element={<AdminKYCVerification />} />
                <Route path="co2-certificates" element={<AdminCO2Certificates />} />
                <Route path="partners" element={<AdminPartners />} />
                <Route path="transactions" element={<AdminTransactions />} />
                <Route path="management" element={<AdminManagement />} />
                <Route path="newsletter" element={<AdminNewsletter />} />
              </Route>

              {/* Newsletter Routes */}
              <Route path="/newsletter/preferences" element={<NewsletterPreferences />} />
              <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribe />} />

              {/* Home Route - New Landing Page */}
              <Route path="/" element={<Homepage />} />
            </>
          )}
        </Routes>

        {!isAdminDomain && (
          <div className="fixed bottom-4 right-4 z-[100]">
            <CookieBanner />
          </div>
        )}
      </Suspense>

      {/* Chat Widget - Visible on all pages */}
      {/* {!isAdminDomain && <ChatWidget />} */}

      {/* Logout Popup */}
      <LogoutPopupComponent />
    </div>
  );
}

// Main App Component with proper provider hierarchy INCLUDING WAGMI
export default function App() {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <ThemeProvider>
        <AuthProvider>
          <MaintenanceProvider>
            <AppContent />
          </MaintenanceProvider>
        </AuthProvider>
      </ThemeProvider>
    </WagmiProvider>
  );
}
