// App.tsx - Fixed AppKit configuration
import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

// Import the CO2 Marketplace component
import Marketplace from '../../../thefinalwebapplicationpcx-main/src/services/Marketplace.tsx';

// Import the new unified booking flow instead of separate components
import UnifiedBookingFlow from '../../../thefinalwebapplicationpcx-main/src/components/UnifiedBookingFlow.tsx';

// Import Charter a Jet page
import CharterAJet from '../../../thefinalwebapplicationpcx-main/src/components/Landingpagenew/CharterAJet.jsx';

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

// Create a client
const queryClient = new QueryClient();

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
    <ErrorBoundary>
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

              {/* Charter a Jet Route */}
              <Route path="/charter-a-jet" element={<CharterAJet />} />

              {/* Service Routes */}
              <Route path="/services/private-jet-charter" element={<PrivateJetCharter />} />
              <Route path="/services/group-charter" element={<GroupCharter />} />
              <Route path="/services/helicopter-charter" element={<HelicopterCharter />} />
              <Route path="/services/evtol" element={<EVTOL />} />
              <Route path="/services/marketplace" element={<Marketplace />} />
              <Route path="/pages/eVtolpage" element={<EVTOLPage />} />
              <Route path="/luxury-cars" element={<LuxuryCars />} />

              {/* Web3 Routes */}
              <Route path="/web3/ico" element={<ICO />} />
              <Route path="/web3/nft-collection" element={<NFTCollection />} />
              <Route path="/web3/carbon-certificates" element={<CarbonCertificates />} />
              <Route path="/web3/asset-licensing" element={<DAODrivenTokenizedAssetLicensing />} />
              <Route path="/web3/jetcard" element={<JetCard />} />
              <Route path="/web3/ai-travel-agent" element={<AITravelAgent />} />
              <Route path="/tokenswap" element={<TokenSwapPage />} />
              <Route path="/crypto" element={<Crypto />} />

              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={
                <GoogleReCaptchaProvider reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY!}>
                  <Register />
                </GoogleReCaptchaProvider>
              } />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Legal Routes */}
              <Route path="/impressum" element={<Impressum />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsConditions />} />
              <Route path="/faq" element={<Faq />} />

              {/* Other Routes */}
              <Route path="/fixed-offers" element={<FixedOffers />} />
              <Route path="/empty-legs" element={<EmptyLegOffers />} />
              <Route path="/behind-the-scene" element={<BehindTheScene />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/partners" element={<Partners />} />
              <Route path="/partners-board" element={<PartnersBoard />} />
              <Route path="/blogPosts" element={<BlogPosts />} />
              <Route path="/services-map" element={<EnhancedServicesMap />} />
              <Route path="/travel-agent" element={<TravelDesignerPage />} />

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

              {/* Home Route with UnifiedBookingFlow */}
              <Route path="/" element={
                <div className="min-h-screen flex flex-col bg-gray-100">
                  {/* Header */}
                  <Header onShowDashboard={() => setShowDashboard(true)} />

                  {/* Main Content */}
                  <main className="flex-1 pt-20 sm:pt-24">
                    {/* Map Container with UnifiedBookingFlow */}
                    <div className="inset-x-1 sm:inset-x-2.5 top-20 sm:top-24 bottom-1 sm:bottom-2.5 bg-gray-100 shadow-lg sm:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden border border-gray-200/50">
                      {/* Map */}
                      {/* <div className="absolute inset-0">
                        <MapboxMap
                          key={`map-${resetMapKey}`}
                          origin={null}
                          destination={null}
                          isReturn={false}
                          stops={[]}
                          selectedDate=""
                          selectedTime="13:00"
                        />
                      </div> */}

                      {/* Unified Booking Flow - flows naturally with page content */}
                      <UnifiedBookingFlow />
                    </div>

                    {/* Spacer for content below fixed map */}
                    {/* <div className="h-[calc(100vh-28px)] sm:h-[calc(100vh-40px)]" /> */}
                  </main>

                  {/* Services Carousel */}
                  <div className="w-full">
                    <ServicesCarousel />
                  </div>

                  <footer className="relative z-10 bg-gray-100">
                    <Footer />
                  </footer>

                  {/* Chat Support */}
                  <ChatSupport />

                  {/* Modals */}
                  {showDashboard && (
                    <Dashboard
                      onClose={() => setShowDashboard(false)}
                      initialTab={dashboardView}
                    />
                  )}
                </div>
              } />
            </>
          )}
        </Routes>

        {!isAdminDomain && (
          <div className="fixed bottom-4 right-4 z-[100]">
            <CookieBanner />
          </div>
        )}
      </Suspense>

      {/* Logout Popup */}
      <LogoutPopupComponent />
    </ErrorBoundary>
  );
}

// Main App Component with proper provider hierarchy INCLUDING WAGMI
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <ThemeProvider>
          <AuthProvider>
            <MaintenanceProvider>
              <AppContent />
            </MaintenanceProvider>
          </AuthProvider>
        </ThemeProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}