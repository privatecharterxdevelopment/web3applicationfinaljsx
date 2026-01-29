// App.tsx - Fixed AppKit configuration
import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
// QueryClient is provided from main.tsx
// Auth0 import removed - using Supabase for authentication
import { ArrowRight, MapPin, Calendar, Users, Check } from 'lucide-react';

// ===== WAGMI/REOWN IMPORTS =====
import { WagmiProvider } from 'wagmi';
import { mainnet, base } from 'wagmi/chains';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

import Header from '../../components/Header.tsx';
import LoginNew from '../../pages/LoginNew.tsx';
import RegisterNew from '../../pages/RegisterNew.tsx';
import VerifyEmail from '../../pages/VerifyEmail.tsx';
// GoogleCalendarCallback removed - not used
import MapboxMap from '../../components/Map.tsx';
import WeatherWidget from '../../components/WeatherWidget.tsx';
import Logo from '../../components/Logo.tsx';
// Footer removed - not used (dashboard has its own footer)
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
import { NFTProvider } from '../../context/NFTContext';
// FavouritesProvider removed - not used
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
import AdminSPVFormations from '../../pages/admin/SPVFormations.tsx';
import AdminTokenization from '../../pages/admin/Tokenization.tsx';
import AdminChatMessages from '../../pages/admin/ChatMessages.tsx';
import AdminSubscriptions from '../../pages/admin/Subscriptions.tsx';
import AdminCardApplications from '../../pages/admin/CardApplications.tsx';
import AdminBookings from '../../pages/admin/Bookings.tsx';
import AdminEmptyLegs from '../../pages/admin/EmptyLegs.tsx';
import AdminEarnings from '../../pages/admin/Earnings.tsx';
import AdminNotifications from '../../pages/admin/Notifications.tsx';
import Faq from '../../components/faq.tsx';  // LOWERCASE faq.tsx

// Import pages (cleaned - legal pages now in dashboard)
import AdminOffers from '../../pages/AdminOffers.tsx';
import ResetPassword from '../../pages/ResetPassword.tsx';
import ForgotPassword from '../../pages/ForgotPassword.tsx';

// Import TokenSwap page
import TokenSwapPage from './TokenSwapPage';

// Import CryptoFund page (LOCAL TESTING ONLY - NOT FOR PRODUCTION)
import CryptoFund from '../../pages/CryptoFund';

// Landing Page Components removed - not used (dashboard only)

// Import booking pages (detail pages still needed for direct links)
import FlightBooking from '../../pages/FlightBooking';
import EmptyLegBooking from '../../pages/EmptyLegBooking';

// Import Asset Marketplace (Polymesh) pages
// Asset Marketplace - disabled (no license)
// import AssetMarketplace from '../../pages/AssetMarketplace';
// import AssetMarketplaceDetail from '../../pages/AssetMarketplaceDetail';

// Import your complete dashboard
import TokenizedAssetsGlassmorphic from './tokenized-assets-glassmorphic.jsx';
import ProjectPage from './ProjectPage.jsx';

// Import Launchpad page
import LaunchpadPageNew from './LaunchpadPageNew.jsx';

// CharterAJet removed - not used

// Import AI Chat standalone view
import AIChat from './AIChat';

// Import Detail pages
import EmptyLegDetail from './EmptyLegDetail.jsx';
import AdventureDetail from './AdventureDetail.jsx';
import LuxuryCarDetail from './LuxuryCarDetail.jsx';
import JetDetail from './JetDetail.jsx';
import HelicopterDetail from './HelicopterDetail.jsx';
import CO2CertificateDetail from './CO2CertificateDetail.jsx';
import HotelDetail from './HotelDetail.jsx';
import PaymentXPage from './PaymentXPage.jsx';

// Import SPV & RWA components
import MySPVs from '../../pages/MySPVs.tsx';
import SPVFormationFlow from '../../components/SPVFormation/SPVFormationFlow.jsx';
import TokenizeAssetFlow from './TokenizeAssetFlow.jsx';

// Import Chat Widget
import ChatWidget from './ChatWidget.jsx';

// Import the new unified booking flow instead of separate components
import UnifiedBookingFlow from '../../components/UnifiedBookingFlow.tsx';

// Import Partner components
import PartnerDashboard from '../../components/PartnerDashboard.tsx';

// Newsletter components removed - not used

// Import Payment Pages
import PaymentSuccessPage from '../../pages/PaymentSuccessPage.jsx';
import PaymentCancelPage from '../../pages/PaymentCancelPage.jsx';
import SubscriptionSuccessPage from '../../pages/SubscriptionSuccessPage.jsx';

// Import Admin CRM (old simple version)
import AdminCRM from '../../pages/AdminCRM';
// Import full CRM system
import CRMPage from '../../pages/CRMPage';

import { supabase } from '../../lib/supabase.ts';

// ===== WAGMI/REOWN CONFIGURATION =====
const projectId = 'a9111834382219cf7080a2d516cad517';

// FIXED: Simplified configuration
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [base, mainnet]
});

// FIXED: AppKit configuration with proper mobile wallet support
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [base, mainnet],
  defaultNetwork: base,
  metadata: {
    name: 'PrivateCharterX',
    description: 'Luxury Private Charter Platform',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://privatecharterx.com',
    icons: ['https://privatecharterx.com/favicon.ico']
  },
  features: {
    analytics: false,
    email: false,
    socials: [],
    // Enable EIP-6963 for better wallet detection
    // @ts-ignore - feature may exist
    eip6963: true
  },
  // Enable all wallet connection methods
  enableWalletConnect: true,
  enableInjected: true,
  enableCoinbase: true,
  // Featured wallets (mobile-friendly order)
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
    '19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927', // Ledger
  ],
  // Better mobile UX
  themeMode: 'light',
  themeVariables: {
    '--w3m-z-index': '99999'
  },
  // Allow all wallets on mobile (don't restrict)
  allowUnsupportedChain: false
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

// Redirect old /chat/:chatId to new /chat/:chatId (no change needed now)
function ChatRedirect() {
  const { chatId } = useParams();
  return <Navigate to={`/chat/${chatId}`} replace />;
}

// Page transition animations
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: 'easeInOut'
    }
  }
};

// Wrapper component for page transitions
function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Main App Content Component (wrapped by AuthProvider)
function AppContent() {
  const { isMaintenanceMode } = useMaintenance();
  const { user } = useAuth();
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

  if (isMaintenanceMode) {
    return <MaintenanceMode />;
  }

  return (
    <div>
      <Suspense fallback={<LoadingSpinner />}>
        <ScrollToTop />
        <PageTransition>
        <Routes>
          {isAdminDomain ? (
            // Admin Routes
            <>
              <Route path="/" element={<Navigate to="/admin/analytics" replace />} />
              <Route path="/login" element={<Navigate to="/admin/analytics" replace />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/analytics" replace />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="earnings" element={<AdminEarnings />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="booking-requests" element={<AdminBookingRequests />} />
                <Route path="empty-legs" element={<AdminEmptyLegs />} />
                <Route path="user-requests" element={<AdminUserRequests />} />
                <Route path="kyc-verification" element={<AdminKYCVerification />} />
                <Route path="co2-certificates" element={<AdminCO2Certificates />} />
                <Route path="partners" element={<AdminPartners />} />
                <Route path="transactions" element={<AdminTransactions />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="subscriptions" element={<AdminSubscriptions />} />
                <Route path="card-applications" element={<AdminCardApplications />} />
                <Route path="spv-formations" element={<AdminSPVFormations />} />
                <Route path="tokenization" element={<AdminTokenization />} />
                <Route path="chat-messages" element={<AdminChatMessages />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="management" element={<AdminManagement />} />
                <Route path="newsletter" element={<AdminNewsletter />} />
              </Route>
              <Route path="/offers" element={<AdminOffers />} />
            </>
          ) : (
            // Main Site Routes - Clean URLs without /dashboard prefix
            <>
              {/* ===== HOMEPAGE ===== */}
              <Route path="/" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/home" element={<TokenizedAssetsGlassmorphic key="main" />} />

              {/* ===== MAIN SERVICE ROUTES (formerly /dashboard/*) ===== */}
              <Route path="/jets" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/helis" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/empty-legs" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/adventures" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/flights" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/flight-bids" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/ground-transport" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/luxury-cars" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/hotels" element={<TokenizedAssetsGlassmorphic key="main" />} />

              {/* ===== AI CHAT ROUTES ===== */}
              <Route path="/chat" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/chat/:chatId" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/ai-chat" element={<TokenizedAssetsGlassmorphic key="main" />} />

              {/* ===== USER ACCOUNT ROUTES ===== */}
              <Route path="/profile" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/settings" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/bookings" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/my-bookings" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/transactions" element={<TokenizedAssetsGlassmorphic key="main" />} />
              {/* calendar and favourites routes removed - features not used */}
              <Route path="/notifications" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/bids" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/messages" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/requests" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/my-requests" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/ai-requests" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/activities" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/chat-history" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/kyc-verification" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/referral" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/paymentx" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/debitcard" element={<TokenizedAssetsGlassmorphic key="main" />} />

              {/* ===== SUBSCRIPTIONS ===== */}
              <Route path="/subscriptions" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/subscriptions/plans" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/subscriptions/manage" element={<TokenizedAssetsGlassmorphic key="main" />} />

              {/* ===== WEB3/RWS ROUTES ===== */}
              <Route path="/rws" element={<TokenizedAssetsGlassmorphic key="main-rws" />} />
              <Route path="/rws/marketplace" element={<TokenizedAssetsGlassmorphic key="main-rws" />} />
              <Route path="/rws/tokenization" element={<TokenizedAssetsGlassmorphic key="main-rws" />} />
              <Route path="/rws/nft-marketplace" element={<TokenizedAssetsGlassmorphic key="main-rws" />} />
              <Route path="/rws/launchpad" element={<TokenizedAssetsGlassmorphic key="main-rws" />} />
              <Route path="/rws/pvcx-token" element={<TokenizedAssetsGlassmorphic key="main-rws" />} />
              <Route path="/rws/tokenize-asset" element={<TokenizedAssetsGlassmorphic key="main-rws" />} />
              <Route path="/rws/spv-formation" element={<TokenizedAssetsGlassmorphic key="main-rws" />} />
              <Route path="/rws/my-tokenized-assets" element={<TokenizedAssetsGlassmorphic key="main-rws" />} />
              <Route path="/rws/my-spvs" element={<TokenizedAssetsGlassmorphic key="main-rws" />} />
              <Route path="/my-launches" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/search-index" element={<TokenizedAssetsGlassmorphic key="main" />} />

              {/* ===== FAQS ===== */}
              <Route path="/faqs" element={<TokenizedAssetsGlassmorphic key="main" />} />

              {/* ===== CHECKOUT PAGE - CRITICAL FOR WEB3 PAYMENTS ===== */}
              <Route path="/checkout" element={<CheckoutPage />} />

              {/* ===== BOOKING ROUTES ===== */}
              <Route path="/book/flight/:offerId" element={<FlightBooking />} />
              <Route path="/book/empty-leg/:id" element={<EmptyLegBooking />} />

              {/* ===== DETAIL PAGES ===== */}
              <Route path="/empty-leg/:id" element={<EmptyLegDetail />} />
              <Route path="/adventure/:id" element={<AdventureDetail />} />
              <Route path="/luxury-car/:id" element={<LuxuryCarDetail />} />
              <Route path="/jet/:id" element={<JetDetail />} />
              <Route path="/helicopter/:id" element={<HelicopterDetail />} />
              <Route path="/co2-certificate/:id" element={<CO2CertificateDetail />} />
              <Route path="/hotel/:id" element={<HotelDetail />} />
              <Route path="/project/:projectId" element={<ProjectPage />} />

              {/* ===== LEGACY LANDING PAGE REDIRECTS ===== */}
              <Route path="/services" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/aviation" element={<Navigate to="/jets" replace />} />
              <Route path="/tokenized" element={<Navigate to="/rws" replace />} />
              <Route path="/sphera-ai" element={<Navigate to="/chat" replace />} />
              <Route path="/helpdesk" element={<Navigate to="/chat" replace />} />
              <Route path="/tokenswap" element={<TokenSwapPage />} />
              <Route path="/crypto-fund" element={<CryptoFund />} />

              {/* ===== LEGAL PAGES (within dashboard) ===== */}
              <Route path="/terms" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/privacy" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/imprint" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/cookies" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/partners" element={<TokenizedAssetsGlassmorphic key="main" />} />

              {/* ===== AUTH ROUTES ===== */}
              <Route path="/login" element={<LoginNew />} />
              <Route path="/register" element={<RegisterNew />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* Google calendar callback removed - not used */}

              {/* ===== CRM ADMIN ROUTES ===== */}
              <Route path="/crm" element={<CRMPage />} />
              <Route path="/crm-admin" element={<CRMPage />} />
              <Route path="/admin" element={<AdminCRM />} />

              {/* ===== PARTNER ROUTES ===== */}
              <Route path="/partner-dashboard" element={<PartnerDashboard />} />

              {/* Newsletter routes removed - not used */}

              {/* ===== PAYMENT ROUTES ===== */}
              <Route path="/payment/success" element={<PaymentSuccessPage />} />
              <Route path="/payment/cancel" element={<PaymentCancelPage />} />
              <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />

              {/* ===== LEGACY /dashboard/* REDIRECTS (SEO backwards compatibility) ===== */}
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/dashboard/home" element={<Navigate to="/home" replace />} />
              <Route path="/dashboard/jets" element={<Navigate to="/jets" replace />} />
              <Route path="/dashboard/helis" element={<Navigate to="/helis" replace />} />
              <Route path="/dashboard/empty-legs" element={<Navigate to="/empty-legs" replace />} />
              <Route path="/dashboard/adventures" element={<Navigate to="/adventures" replace />} />
              <Route path="/dashboard/flights" element={<Navigate to="/flights" replace />} />
              <Route path="/dashboard/flight-ops" element={<Navigate to="/flight-bids" replace />} />
              <Route path="/dashboard/ground-transport" element={<Navigate to="/ground-transport" replace />} />
              <Route path="/dashboard/luxury-cars" element={<Navigate to="/luxury-cars" replace />} />
              <Route path="/dashboard/hotels" element={<Navigate to="/hotels" replace />} />
              <Route path="/dashboard/chat" element={<Navigate to="/chat" replace />} />
              <Route path="/dashboard/chat/:chatId" element={<ChatRedirect />} />
              <Route path="/dashboard/ai-chat" element={<Navigate to="/ai-chat" replace />} />
              <Route path="/dashboard/profile" element={<Navigate to="/profile" replace />} />
              <Route path="/dashboard/settings" element={<Navigate to="/settings" replace />} />
              <Route path="/dashboard/bookings" element={<Navigate to="/bookings" replace />} />
              <Route path="/dashboard/my-bookings" element={<Navigate to="/my-bookings" replace />} />
              <Route path="/dashboard/transactions" element={<Navigate to="/transactions" replace />} />
              <Route path="/dashboard/calendar" element={<Navigate to="/home" replace />} />
              <Route path="/dashboard/favourites" element={<Navigate to="/home" replace />} />
              <Route path="/dashboard/notifications" element={<Navigate to="/notifications" replace />} />
              <Route path="/dashboard/bids" element={<Navigate to="/bids" replace />} />
              <Route path="/dashboard/messages" element={<Navigate to="/messages" replace />} />
              <Route path="/dashboard/requests" element={<Navigate to="/requests" replace />} />
              <Route path="/dashboard/my-requests" element={<Navigate to="/my-requests" replace />} />
              <Route path="/dashboard/ai-requests" element={<Navigate to="/ai-requests" replace />} />
              <Route path="/dashboard/activities" element={<Navigate to="/activities" replace />} />
              <Route path="/dashboard/chat-history" element={<Navigate to="/chat-history" replace />} />
              <Route path="/dashboard/kyc-verification" element={<Navigate to="/kyc-verification" replace />} />
              <Route path="/dashboard/referral" element={<Navigate to="/referral" replace />} />
              <Route path="/dashboard/subscriptions" element={<Navigate to="/subscriptions" replace />} />
              <Route path="/dashboard/subscriptions/plans" element={<Navigate to="/subscriptions/plans" replace />} />
              <Route path="/dashboard/subscriptions/manage" element={<Navigate to="/subscriptions/manage" replace />} />
              <Route path="/dashboard/my-launches" element={<Navigate to="/my-launches" replace />} />
              <Route path="/dashboard/search-index" element={<Navigate to="/search-index" replace />} />
              <Route path="/dashboard/success" element={<Navigate to="/subscription/success" replace />} />
              <Route path="/dashboard/transfer" element={<Navigate to="/ground-transport" replace />} />
              <Route path="/dashboard/services" element={<Navigate to="/services" replace />} />
              <Route path="/dashboard/helicopter" element={<Navigate to="/helis" replace />} />

              {/* Legacy /dashboard/web3/* redirects to /rws/* */}
              <Route path="/dashboard/web3" element={<Navigate to="/rws" replace />} />
              <Route path="/dashboard/web3/marketplace" element={<Navigate to="/rws/marketplace" replace />} />
              <Route path="/dashboard/web3/tokenization" element={<Navigate to="/rws/tokenization" replace />} />
              <Route path="/dashboard/web3/nft-marketplace" element={<Navigate to="/rws/nft-marketplace" replace />} />
              <Route path="/dashboard/web3/launchpad" element={<Navigate to="/rws/launchpad" replace />} />
              <Route path="/dashboard/web3/pvcx-token" element={<Navigate to="/rws/pvcx-token" replace />} />
              <Route path="/dashboard/web3/tokenize-asset" element={<Navigate to="/rws/tokenize-asset" replace />} />
              <Route path="/dashboard/web3/spv-formation" element={<Navigate to="/rws/spv-formation" replace />} />
              <Route path="/dashboard/web3/my-tokenized-assets" element={<Navigate to="/rws/my-tokenized-assets" replace />} />
              <Route path="/dashboard/web3/my-spvs" element={<Navigate to="/rws/my-spvs" replace />} />

              {/* Legacy dashboard routes */}
              <Route path="/dashboard/launchpad" element={<Navigate to="/rws/launchpad" replace />} />
              <Route path="/dashboard/nft-marketplace" element={<Navigate to="/rws/nft-marketplace" replace />} />
              <Route path="/dashboard/marketplace" element={<Navigate to="/rws/marketplace" replace />} />
              <Route path="/dashboard/pvcx-token" element={<Navigate to="/rws/pvcx-token" replace />} />
              <Route path="/dashboard/sto-utl" element={<Navigate to="/rws/launchpad" replace />} />
              <Route path="/dashboard/tokenization" element={<Navigate to="/rws/tokenization" replace />} />
              <Route path="/dashboard/my-tokenized-assets" element={<Navigate to="/rws/my-tokenized-assets" replace />} />
              <Route path="/dashboard/spv" element={<Navigate to="/rws/spv-formation" replace />} />
              <Route path="/dashboard/spv/create" element={<Navigate to="/rws/spv-formation" replace />} />
              <Route path="/dashboard/spv/my-spvs" element={<Navigate to="/rws/my-tokenized-assets" replace />} />
              <Route path="/dashboard/rwa" element={<Navigate to="/rws/tokenization" replace />} />
              <Route path="/dashboard/rwa/tokenize" element={<Navigate to="/rws/tokenize-asset" replace />} />
              <Route path="/dashboard/rwa/assets" element={<Navigate to="/rws/my-tokenized-assets" replace />} />

              {/* ===== OTHER LEGACY REDIRECTS ===== */}
              <Route path="/tokenized-assets" element={<Navigate to="/" replace />} />
              <Route path="/tokenized-assets/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/glas" element={<Navigate to="/" replace />} />
              <Route path="/user-overview" element={<Dashboard />} />
              <Route path="/flight-tickets" element={<Navigate to="/flights" replace />} />
              <Route path="/fixed-offers" element={<Navigate to="/adventures" replace />} />
              <Route path="/charter-a-jet" element={<Navigate to="/chat?query=I%20want%20to%20charter%20a%20private%20jet" replace />} />

              {/* SPV Routes - redirect to RWS */}
              <Route path="/spv" element={<Navigate to="/rws/spv-formation" replace />} />
              <Route path="/spv/create" element={<Navigate to="/rws/spv-formation" replace />} />
              <Route path="/spv/my-spvs" element={<Navigate to="/rws/my-tokenized-assets" replace />} />
              <Route path="/spv-formation" element={<Navigate to="/rws/spv-formation" replace />} />

              {/* RWA Routes - redirect to RWS */}
              <Route path="/rwa" element={<Navigate to="/rws/tokenization" replace />} />
              <Route path="/rwa/tokenize" element={<Navigate to="/rws/tokenize-asset" replace />} />
              <Route path="/rwa/assets" element={<Navigate to="/rws/my-tokenized-assets" replace />} />
              <Route path="/rwa/marketplace" element={<Navigate to="/rws/marketplace" replace />} />

              {/* Web3 Routes - redirect to RWS */}
              <Route path="/web3" element={<Navigate to="/rws" replace />} />
              <Route path="/web3/ico" element={<Navigate to="/rws/launchpad" replace />} />
              <Route path="/web3/nft" element={<Navigate to="/rws/nft-marketplace" replace />} />
              <Route path="/web3/nft-collection" element={<Navigate to="/rws/nft-marketplace" replace />} />
              <Route path="/web3/launchpad" element={<Navigate to="/rws/launchpad" replace />} />

              {/* ===== DEAD PAGE REDIRECTS - For old Google/Bing indexed pages ===== */}
              <Route path="/services/*" element={<Navigate to="/aviation" replace />} />
              <Route path="/privatecharterx-support" element={<Navigate to="/helpdesk" replace />} />
              <Route path="/support" element={<Navigate to="/helpdesk" replace />} />
              <Route path="/partners-board" element={<Navigate to="/partners" replace />} />
              {/* /partners route is defined above - no redirect needed */}
              <Route path="/web3/flight-tracker" element={<Navigate to="/home" replace />} />
              <Route path="/web3/tracker" element={<Navigate to="/home" replace />} />
              <Route path="/faq" element={<Navigate to="/faqs" replace />} />
              <Route path="/partner" element={<Navigate to="/home" replace />} />
              <Route path="/partner-with-us" element={<Navigate to="/home" replace />} />
              <Route path="/private-jet" element={<Navigate to="/aviation" replace />} />
              <Route path="/private-jet-charter" element={<Navigate to="/aviation" replace />} />
              <Route path="/evtol" element={<Navigate to="/aviation" replace />} />
              <Route path="/evtol-flights" element={<Navigate to="/aviation" replace />} />
              <Route path="/helicopter" element={<Navigate to="/aviation" replace />} />
              <Route path="/helicopter-charter" element={<Navigate to="/aviation" replace />} />
              <Route path="/yacht" element={<Navigate to="/home" replace />} />
              <Route path="/group-charter" element={<Navigate to="/aviation" replace />} />
              <Route path="/how-it-works" element={<Navigate to="/home" replace />} />
              <Route path="/about" element={<Navigate to="/home" replace />} />
              <Route path="/contact" element={<Navigate to="/helpdesk" replace />} />
              <Route path="/safety" element={<Navigate to="/aviation" replace />} />
              <Route path="/blog" element={<TokenizedAssetsGlassmorphic key="main" />} />
              <Route path="/news" element={<Navigate to="/home" replace />} />
              <Route path="/technology" element={<Navigate to="/home" replace />} />
              <Route path="/rwa-nft" element={<Navigate to="/tokenized" replace />} />
              <Route path="/membership" element={<Navigate to="/subscriptions" replace />} />
              <Route path="/jet-card" element={<Navigate to="/subscriptions" replace />} />
              <Route path="/visa" element={<Navigate to="/home" replace />} />
              <Route path="/ico" element={<Navigate to="/tokenized" replace />} />
              <Route path="/nft" element={<Navigate to="/tokenized" replace />} />
              <Route path="/dao" element={<Navigate to="/tokenized" replace />} />
              <Route path="/crypto" element={<Navigate to="/tokenized" replace />} />
              <Route path="/carbon" element={<Navigate to="/tokenized" replace />} />
              <Route path="/co2" element={<Navigate to="/tokenized" replace />} />
              <Route path="/marketplace" element={<Navigate to="/tokenized" replace />} />
              <Route path="/behind-the-scene" element={<Navigate to="/home" replace />} />
            </>
          )}
        </Routes>
        </PageTransition>

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
function AppWithAuth() {
  const { user } = useAuth();

  return (
    <MaintenanceProvider>
      <AppContent />
    </MaintenanceProvider>
  );
}

export default function App() {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <NFTProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppWithAuth />
          </AuthProvider>
        </ThemeProvider>
      </NFTProvider>
    </WagmiProvider>
  );
}
