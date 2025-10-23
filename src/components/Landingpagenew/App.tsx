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

import Header from '../../../thefinalwebapplicationpcx-main/src/components/Header.tsx';
import Login from '../../../thefinalwebapplicationpcx-main/src/pages/Login.tsx';
import Register from '../../../thefinalwebapplicationpcx-main/src/pages/Register.tsx';
import VerifyEmail from '../../../thefinalwebapplicationpcx-main/src/pages/VerifyEmail.tsx';
import GoogleCalendarCallback from '../GoogleCalendarCallback.jsx';
import MapboxMap from '../../../thefinalwebapplicationpcx-main/src/components/Map.tsx';
import WeatherWidget from '../../../thefinalwebapplicationpcx-main/src/components/WeatherWidget.tsx';
import Logo from '../../../thefinalwebapplicationpcx-main/src/components/Logo.tsx';
import Footer from '../../../thefinalwebapplicationpcx-main/src/components/Footer.tsx';
import NavigationMenu from '../../../thefinalwebapplicationpcx-main/src/components/NavigationMenu.tsx';
import CookieBanner from '../../../thefinalwebapplicationpcx-main/src/components/CookieBanner.tsx';
import ErrorBoundary from '../../../thefinalwebapplicationpcx-main/src/components/ErrorBoundary.tsx';
import LoadingSpinner from '../../../thefinalwebapplicationpcx-main/src/components/LoadingSpinner.tsx';
import ServicesCarousel from '../../../thefinalwebapplicationpcx-main/src/components/ServicesCarousel.tsx';
import CheckoutPage from '../../../thefinalwebapplicationpcx-main/src/components/CheckoutPage.tsx';
import type { Location, Weather, Stop, BookingDetails } from '../../../thefinalwebapplicationpcx-main/src/types.ts';
import { AuthProvider, useAuth } from '../../../thefinalwebapplicationpcx-main/src/context/AuthContext.tsx';
import { ThemeProvider } from '../../../thefinalwebapplicationpcx-main/src/context/ThemeContext.tsx';
import { MaintenanceProvider, useMaintenance } from '../../../thefinalwebapplicationpcx-main/src/context/MaintenanceContext.tsx';
import MaintenanceMode from '../../../thefinalwebapplicationpcx-main/src/components/MaintenanceMode.tsx';
import ChatSupport from '../../../thefinalwebapplicationpcx-main/src/components/ChatSupport.tsx';
import Dashboard from '../../../thefinalwebapplicationpcx-main/src/components/Dashboard.tsx';
import AdminLayout from '../../../thefinalwebapplicationpcx-main/src/pages/admin/Layout.tsx';
import AdminAnalytics from '../../../thefinalwebapplicationpcx-main/src/pages/admin/Analytics.tsx';
import AdminBookingRequests from '../../../thefinalwebapplicationpcx-main/src/pages/admin/BookingRequests.tsx';
import AdminUserRequests from '../../../thefinalwebapplicationpcx-main/src/pages/admin/UserRequests.tsx';
import AdminKYCVerification from '../../../thefinalwebapplicationpcx-main/src/pages/admin/KYCVerification.tsx';
import AdminCO2Certificates from '../../../thefinalwebapplicationpcx-main/src/pages/admin/CO2Certificates.tsx';
import AdminManagement from '../../../thefinalwebapplicationpcx-main/src/pages/admin/Management.tsx';
import Faq from '../../../thefinalwebapplicationpcx-main/src/components/faq.tsx';  // LOWERCASE faq.tsx

// Import pages
import FixedOffers from '../../../thefinalwebapplicationpcx-main/src/pages/FixedOffers.tsx';
import EmptyLegOffers from '../../../thefinalwebapplicationpcx-main/src/pages/EmptyLegOffers.tsx';
import AdminOffers from '../../../thefinalwebapplicationpcx-main/src/pages/AdminOffers.tsx';
import BehindTheScene from '../../../thefinalwebapplicationpcx-main/src/pages/BehindTheScene.tsx';
import HowItWorks from '../../../thefinalwebapplicationpcx-main/src/pages/HowItWorks.tsx';
import Contact from '../../../thefinalwebapplicationpcx-main/src/pages/Contact.tsx';
import Crypto from '../../../thefinalwebapplicationpcx-main/src/pages/Crypto.tsx';
import GroupCharter from '../../../thefinalwebapplicationpcx-main/src/pages/services/GroupCharter.tsx';
import HelicopterCharter from '../../../thefinalwebapplicationpcx-main/src/pages/services/HelicopterCharter.tsx';
import PrivateJetCharter from '../../../thefinalwebapplicationpcx-main/src/pages/services/PrivateJetCharter.tsx';
import PartnersBoard from '../../../thefinalwebapplicationpcx-main/src/pages/services/PartnersBoard.tsx';
import EVTOL from '../../../thefinalwebapplicationpcx-main/src/pages/services/EVTOL.tsx';
import EVTOLPage from '../../../thefinalwebapplicationpcx-main/src/pages/eVtolpage.tsx';
import ICO from '../../../thefinalwebapplicationpcx-main/src/pages/web3/ICO.tsx';
import NFTCollection from '../../../thefinalwebapplicationpcx-main/src/pages/web3/NFTCollection.tsx';
import CarbonCertificates from '../../../thefinalwebapplicationpcx-main/src/pages/web3/CarbonCertificates.tsx';
import DAODrivenTokenizedAssetLicensing from '../../../thefinalwebapplicationpcx-main/src/pages/web3/DAODrivenTokenizedAssetLicensing.tsx';
import Impressum from '../../../thefinalwebapplicationpcx-main/src/pages/Legal/Impressum.tsx';
import PrivacyPolicy from '../../../thefinalwebapplicationpcx-main/src/pages/Legal/PrivacyPolicy.tsx';
import TermsConditions from '../../../thefinalwebapplicationpcx-main/src/pages/Legal/TermsConditions.tsx';
import Partners from '../../../thefinalwebapplicationpcx-main/src/pages/Partners.tsx';
import AITravelAgent from '../../../thefinalwebapplicationpcx-main/src/pages/web3/AITravelAgent.tsx';
import LuxuryCars from '../../../thefinalwebapplicationpcx-main/src/pages/LuxuryCars.tsx';
import BlogPosts from '../../../thefinalwebapplicationpcx-main/src/pages/BlogPosts.tsx';
import ResetPassword from '../../../thefinalwebapplicationpcx-main/src/pages/ResetPassword.tsx';
import JetCard from '../../../thefinalwebapplicationpcx-main/src/pages/JetCard.tsx';
import EnhancedServicesMap from '../../../thefinalwebapplicationpcx-main/src/components/EnhancedServicesMap.jsx';
import TravelDesignerPage from '../../../thefinalwebapplicationpcx-main/src/components/TravelDesigner.tsx';

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
import Marketplace from '../../../thefinalwebapplicationpcx-main/src/services/Marketplace.tsx';

// Import the new unified booking flow instead of separate components
import UnifiedBookingFlow from '../../../thefinalwebapplicationpcx-main/src/components/UnifiedBookingFlow.tsx';

import { supabase } from '../../../thefinalwebapplicationpcx-main/src/lib/supabase.ts';

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
                <Route path="booking-requests" element={<AdminBookingRequests />} />
                <Route path="user-requests" element={<AdminUserRequests />} />
                <Route path="kyc-verification" element={<AdminKYCVerification />} />
                <Route path="co2-certificates" element={<AdminCO2Certificates />} />
                <Route path="management" element={<AdminManagement />} />
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

              {/* Charter a Jet Route */}
              <Route path="/charter-a-jet" element={<CharterAJet />} />

              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={
                <GoogleReCaptchaProvider reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY!}>
                  <Register />
                </GoogleReCaptchaProvider>
              } />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* All other pages now integrated into dashboard */}

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/analytics" replace />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="booking-requests" element={<AdminBookingRequests />} />
                <Route path="user-requests" element={<AdminUserRequests />} />
                <Route path="kyc-verification" element={<AdminKYCVerification />} />
                <Route path="co2-certificates" element={<AdminCO2Certificates />} />
                <Route path="management" element={<AdminManagement />} />
              </Route>

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
      {!isAdminDomain && <ChatWidget />}

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
