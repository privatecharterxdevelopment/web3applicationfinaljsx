import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link, useParams, useLocation } from 'react-router-dom';
import {
  Search, Shield, Bell, Heart, Home, Layers, FolderOpen, Plus,
  Plane, Zap, Mountain, Car, MapPin, Sparkles, Rocket,
  Leaf, Award, Settings, User, ChevronRight, ChevronDown, ChevronUp, ChevronLeft, X, LogOut, MessageSquare, MessageCircle,
  Users, Calendar, Package, Compass, ArrowLeft, ArrowRight, Wallet, History, Crown, Gift, LayoutDashboard, Clock,
  Mail, Phone, Globe, FileText, Edit3, Check, Loader2, Building2, Coins, Share2, Menu, ExternalLink, SlidersHorizontal, Info, CreditCard,
  ShoppingCart, Send, AlertCircle, Lock, Activity
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import IntelligentSearch from '../IntelligentSearch';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { web3Service } from '../../lib/web3';
import WalletMenu from '../WalletMenu';
import Dashboard from '../Dashboard';
import { createRequest } from '../../services/requests';
import LoginModal from '../LoginModalNew';
import RegisterModal from '../RegisterModalNew';
import ForgotPasswordModal from '../ForgotPasswordModal';
import { ToastContainer } from '../Toast';
import { useToast } from '../../hooks/useToast';
import SuccessNotification from '../SuccessNotification';
import UnifiedBookingFlow from '../../components/UnifiedBookingFlow';
import TokenizeAssetFlow from './TokenizeAssetFlow';
import SPVFormationFlow from '../SPVFormation/SPVFormationFlow_NEW';
import TokenSwap from './TokenSwap';
import AIChatNew from './AIChat/AIChatNew';
import ChatRequestsView from '../ChatRequestsView';
import CalendarView from '../Calendar/CalendarView';
import FavouritesView from '../Favourites/FavouritesView';
import MyRequestsView from '../MyRequestsView';
import MyBookingsView from '../MyBookingsView';
import MyActivityView from '../MyActivityView';
import SupportMessagesView from '../SupportMessagesView';
import MembershipCard from '../MembershipCard';
import ReferralCard from '../ReferralCard';
import SubscriptionManagement from '../SubscriptionManagement';
import ChatSupport from '../ChatSupport';
import ChatWidget from './ChatWidget';
import { chatService } from '../../services/chatService';
import { subscriptionService } from '../../services/subscriptionService';
import KYCForm from '../KYCForm';
import ProfileSettings from '../ProfileSettings';
import CryptoBalanceDashboard from './CryptoBalanceDashboard';
// import MarqetaCardDashboard from './MarqetaCardDashboard'; // Hidden - Marqeta integration pending
import STOUTLDashboard from './STOUTLDashboard';
import Marketplace from './Marketplace';
import P2PMarketplace from './P2PMarketplace';
import TokenizedAssetsShowcase from './TokenizedAssetsShowcase';
import CommunityPage from './CommunityPage';
import MyLaunches from './MyLaunches';
import { useNFT } from '../../context/NFTContext';
import NFTBenefitsModal from '../NFTBenefitsModal';
import CryptoPaymentModal from '../CryptoPaymentModal';
import { BuyWithCryptoButton, CryptoPaymentModal as NewCryptoPaymentModal } from '../Payment';
import LaunchpadPageNew from './LaunchpadPageNew';
import TransactionsPage from './TransactionsPage';
// NFTsPage removed - using NFTMarketplace instead
import NFTMarketplace from './NFTMarketplace';
import NotificationBell, { useNotificationCount } from '../NotificationBell';
import NotificationCenter from '../NotificationCenter';

import SearchIndexPage from '../SearchIndexPage';
import FavouriteButton from '../Favourites/FavouriteButton';
import ReferralPage from './ReferralPage';
import Subscriptionplans from './Subscriptionplans';
import AdminDashboardEnhanced from '../AdminDashboardEnhanced';
import TaxiConciergeView from '../TaxiConcierge/TaxiConciergeView';
import PVCXTokenView from '../PVCXTokenView';
import PartnerDashboard from '../PartnerDashboard';
import PartnerRegistrationModal from '../PartnerRegistrationModal';
import MyDAOs from './MyDAOs';
import EscrowPage from './EscrowPage';
import { airportsJsonService } from '../../services/airportsJsonService';
import { isNativeApp } from '../../utils/platform';
import { AppLoginModal, AppRegisterModal } from '../auth';
import HotelBookingView from '../Hotels/HotelBookingView';
import HotelsView from '../Hotels/HotelsView';
import { convertToUSD, initializeExchangeRates } from '../../services/currencyService';
import { generateSubscriptionConfirmationPDF, downloadPDF } from '../../services/pdfGeneratorService';
import AdventureBookingModal from '../AdventureBookingModal';
import FlightSearchDashboard from '../FlightSearchDashboard';
import { LiveSupportWidget, AdminSupportDashboard } from '../LiveSupportChat';

// Settings Page Component
const SettingsPage = ({ user, kycStatus, setKycStatus, setActiveCategory }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [profileData, setProfileData] = useState({});
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    bio: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postal_code: ''
  });

  useEffect(() => {
    if (user?.id) {
      // Run these in background without blocking - don't await
      fetchProfileData();
      sendWelcomeNotificationIfNeeded();
    }
  }, [user?.id]);

  const sendWelcomeNotificationIfNeeded = async () => {
    if (!user?.id) return;

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Notification query timeout')), 2000)
      );

      // Check if user already has a welcome notification
      const queryPromise = supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'welcome')
        .maybeSingle();

      const { data: existingNotification } = await Promise.race([queryPromise, timeoutPromise]);

      // If no welcome notification exists, create one (fire and forget)
      if (!existingNotification) {
        supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            type: 'welcome',
            title: 'Welcome to PrivateCharterX!',
            message: `Welcome aboard! You are now a member of PrivateCharterX, the premier platform for luxury travel and asset tokenization.

You have received 100 PVCX tokens as a welcome bonus! These tokens will soon be available on various exchanges.

Here's what you can do on our platform:

- Private Aviation: Book private jets, helicopters, and empty leg flights
- Luxury Yachts: Charter exclusive yachts worldwide
- Chauffeur Services: Premium limousine and concierge services
- Events & Sports: Access exclusive events and VIP experiences
- Asset Tokenization: Tokenize and invest in fractional luxury assets
- Token Marketplace: Trade utility and security tokens
- CO2/SAF Certificates: Offset your carbon footprint

Important: Please complete your KYC verification to unlock all features including wallet transactions and asset purchases.

If you have any questions, please contact us through our Ticket System in the Support section.

Happy travels!`,
            is_read: false,
            created_at: new Date().toISOString()
          })
          .then(() => console.log('Welcome notification sent to user:', user.id))
          .catch(err => console.error('Error inserting notification:', err));
      }
    } catch (error) {
      console.error('Error sending welcome notification (non-blocking):', error);
      // Don't block dashboard if notification fails
    }
  };

  const fetchProfileData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Add timeout to prevent hanging login
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile query timeout')), 3000)
      );

      const queryPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: profile, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (profile) {
        setProfileData(profile);
        setFormData(prev => ({
          ...prev,
          bio: profile.bio || '',
          phone: profile.phone || '',
          address: profile.address || '',
          city: profile.city || '',
          country: profile.country || '',
          postal_code: profile.postal_code || ''
        }));
      } else {
        // Create default profile in background - don't wait for it
        createDefaultProfile();
      }
    } catch (error) {
      console.error('Error fetching profile (non-blocking):', error);
      // Don't show error to user, fail gracefully
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultProfile = async () => {
    if (!user?.id) return;
    
    try {
      const defaultProfile = {
        user_id: user.id,
        bio: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        postal_code: '',
        kyc_status: 'not_started'
      };

      const { data: newProfile, error } = await supabase
        .from('user_profiles')
        .insert([defaultProfile])
        .select()
        .single();

      if (error) {
        console.error('Error creating default profile:', error);
      } else {
        setProfileData(newProfile);
        console.log('Default profile created for user:', user.id);
      }
    } catch (error) {
      console.error('Error in createDefaultProfile:', error);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      const profileUpdates = {
        bio: formData.bio || null,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        country: formData.country || null,
        postal_code: formData.postal_code || null,
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update(profileUpdates)
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      if (formData.first_name !== user?.first_name || formData.last_name !== user?.last_name) {
        const { error: userError } = await supabase
          .from('users')
          .update({ 
            first_name: formData.first_name,
            last_name: formData.last_name 
          })
          .eq('id', user.id);

        if (userError) throw userError;
      }

      setProfileData(prev => ({ ...prev, ...profileUpdates }));
      setIsEditing(false);
      
      setMessage({
        type: 'success',
        text: 'Profile updated successfully'
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update profile'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      bio: profileData.bio || '',
      phone: profileData.phone || '',
      address: profileData.address || '',
      city: profileData.city || '',
      country: profileData.country || '',
      postal_code: profileData.postal_code || ''
    });
    setIsEditing(false);
    setMessage(null);
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-20 h-20">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain"
            >
              <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/videoExport-2025-10-19@11-32-10.850-540x540@60fps.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">Settings</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-transparent border border-gray-600 text-gray-700 hover:text-gray-900 hover:border-gray-800 rounded-lg transition-all duration-200 backdrop-blur-xl text-xs font-medium"
          >
            <Edit3 size={14} />
            Edit Profile
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 text-gray-600 hover:text-black border border-gray-300 rounded-lg hover:border-gray-400 transition-all duration-200 backdrop-blur-xl bg-white/50 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-xl text-xs font-medium"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={14} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-3 rounded-lg backdrop-blur-xl border ${
          message.type === 'success' 
            ? 'bg-green-50/80 text-green-700 border-green-200' 
            : 'bg-red-50/80 text-red-700 border-red-200'
        } flex items-center gap-2`}>
          {message.type === 'success' ? (
            <Check size={16} className="flex-shrink-0" />
          ) : (
            <X size={16} className="flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/15 backdrop-blur-xl rounded-lg border border-gray-300/50 p-6">
            <div className="flex items-center gap-2 mb-6">
              <User size={18} className="text-gray-700" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Personal Information</h3>
            </div>

            {!isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">First Name</div>
                    <div className="text-sm text-gray-900 font-medium">{user?.first_name || 'Not set'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Last Name</div>
                    <div className="text-sm text-gray-900 font-medium">{user?.last_name || 'Not set'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Email Address</div>
                    <div className="text-sm text-gray-900 font-medium">{user?.email || 'Not set'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Phone Number</div>
                    <div className="text-sm text-gray-900 font-medium">{profileData.phone || 'Not set'}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">City</div>
                    <div className="text-sm text-gray-900 font-medium">{profileData.city || 'Not set'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Country</div>
                    <div className="text-sm text-gray-900 font-medium">{profileData.country || 'Not set'}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Address</div>
                  <div className="text-sm text-gray-900 font-medium">{profileData.address || 'Not set'}</div>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Bio</div>
                  <div className="text-sm text-gray-900 font-medium">{profileData.bio || 'Not set'}</div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">First Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 bg-white/20 backdrop-blur-xl border border-gray-300/50 rounded-lg focus:ring-1 focus:ring-black/20 focus:border-black/50 transition-all duration-200 text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Last Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 bg-white/20 backdrop-blur-xl border border-gray-300/50 rounded-lg focus:ring-1 focus:ring-black/20 focus:border-black/50 transition-all duration-200 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        className="w-full pl-9 pr-3 py-2 bg-gray-100/50 backdrop-blur-xl border border-gray-300/50 rounded-lg cursor-not-allowed text-sm"
                        disabled
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 bg-white/20 backdrop-blur-xl border border-gray-300/50 rounded-lg focus:ring-1 focus:ring-black/20 focus:border-black/50 transition-all duration-200 text-sm"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">City</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 bg-white/20 backdrop-blur-xl border border-gray-300/50 rounded-lg focus:ring-1 focus:ring-black/20 focus:border-black/50 transition-all duration-200 text-sm"
                        placeholder="Enter city"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Country</label>
                    <div className="relative">
                      <Globe size={16} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 bg-white/20 backdrop-blur-xl border border-gray-300/50 rounded-lg focus:ring-1 focus:ring-black/20 focus:border-black/50 transition-all duration-200 text-sm"
                        placeholder="Enter country"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Address</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-white/20 backdrop-blur-xl border border-gray-300/50 rounded-lg focus:ring-1 focus:ring-black/20 focus:border-black/50 transition-all duration-200 text-sm"
                      placeholder="Enter full address"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Bio (Optional)</label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-3 top-2.5 text-gray-400" />
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={3}
                      placeholder="Tell us about yourself..."
                      className="w-full pl-9 pr-3 py-2 bg-white/20 backdrop-blur-xl border border-gray-300/50 rounded-lg focus:ring-1 focus:ring-black/20 focus:border-black/50 transition-all duration-200 resize-none text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Account Status */}
          <div className="bg-white/15 backdrop-blur-xl rounded-lg border border-gray-300/50 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-gray-700" />
              <h3 className="text-sm font-semibold text-gray-900">Account Status</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/20 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">KYC Verification</div>
                  <div className="text-xs text-gray-600">Identity verification</div>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  kycStatus === 'approved' 
                    ? 'bg-green-100 text-green-700'
                    : kycStatus === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : kycStatus === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {kycStatus === 'approved' && '✓ Verified'}
                  {kycStatus === 'pending' && '⏳ Pending'}
                  {kycStatus === 'rejected' && '✗ Rejected'}
                  {kycStatus === 'not_started' && '! Required'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/15 backdrop-blur-xl rounded-lg border border-gray-300/50 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-2">
              <button
                onClick={() => setActiveCategory('dashboard')}
                className="w-full flex items-center gap-2 p-3 text-left hover:bg-white/20 rounded-lg transition-all duration-200 group"
              >
                <LayoutDashboard size={16} className="text-gray-600 group-hover:text-gray-900" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Dashboard</div>
                  <div className="text-xs text-gray-600">View your overview</div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setWebMode('web3');
                  setActiveCategory('nft-marketplace');
                }}
                className="w-full flex items-center gap-2 p-3 text-left hover:bg-white/20 rounded-lg transition-all duration-200 group"
              >
                <Wallet size={16} className="text-gray-600 group-hover:text-gray-900" />
                <div>
                  <div className="text-sm font-medium text-gray-900">NFT Marketplace</div>
                  <div className="text-xs text-gray-600">Buy & Sell NFTs</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Collapsible Contact Banner Component
const ContactBannerCollapsible = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-900">Still have questions?</span>
          <span className="text-xs text-gray-400">Get in touch with our team</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expandable Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 pb-5 pt-2 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Email */}
            <a
              href="mailto:info@privatecharterx.com"
              className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <Mail className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Email</div>
                <div className="text-sm font-medium text-gray-900">info@privatecharterx.com</div>
              </div>
            </a>

            {/* Phone */}
            <a
              href="tel:+41445869999"
              className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <Phone className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Phone</div>
                <div className="text-sm font-medium text-gray-900">+41 44 586 99 99</div>
              </div>
            </a>
          </div>

          {/* Locations */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3 h-3" />
                <span className="font-medium text-gray-700">Zurich</span>
              </div>
              <span className="text-gray-300">|</span>
              <span className="font-medium text-gray-700">Miami</span>
              <span className="text-gray-300">|</span>
              <span className="font-medium text-gray-700">London</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-400">Hong Kong <span className="text-[10px]">(coming soon)</span></span>
            </div>
            <p className="text-center text-[11px] text-gray-400 mt-3">
              Available Mon-Sun • Response within 24h
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Inline Helpdesk/FAQ Component - Monochromatic Design
const HelpdeskInlineView = ({ setActiveCategory }) => {
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('all');

  // Comprehensive FAQ topics organized by category
  const faqSections = {
    aviation: {
      title: 'Aviation Services',
      icon: Plane,
      topics: [
        {
          id: 'private-jets',
          title: 'How do I book a private jet?',
          answer: 'Navigate to the Charter section, enter your departure and destination airports, select your preferred dates, and choose from our network of 16,000+ aircraft across 150+ countries. Filter by aircraft type (Light, Midsize, Heavy, Ultra-long-range), seating capacity, and amenities. Submit your booking request and receive personalized quotes within minutes from verified operators.'
        },
        {
          id: 'empty-legs',
          title: 'What are Empty Leg flights?',
          answer: 'Empty leg flights are repositioning flights offered at up to 75% discount. When an aircraft needs to return to base or travel to its next charter location, these seats become available at significantly reduced rates. Browse real-time availability, set up route alerts, and book instantly. Departure times are typically flexible within a 2-hour window.'
        },
        {
          id: 'helicopters',
          title: 'Can I book helicopter transfers?',
          answer: 'Yes! We offer helicopter services for city-to-city transfers, event transport, VIP arrivals, and scenic tours. Perfect for short-range journeys, airport-to-city connections, or arriving at exclusive venues. Helipad permissions and landing arrangements are handled by our concierge team.'
        },
        {
          id: 'aircraft-types',
          title: 'What aircraft types are available?',
          answer: 'Our fleet includes: Light Jets (4-6 seats, 1,500nm range) for regional trips, Midsize Jets (6-8 seats, 2,500nm) for cross-country, Heavy Jets (10-16 seats, 4,000nm) for intercontinental, and Ultra-long-range (up to 7,500nm) for non-stop global travel. Each category includes various models from leading manufacturers.'
        },
        {
          id: 'booking-process',
          title: 'How does the booking process work?',
          answer: 'Submit a request with your route, dates, and preferences. Receive quotes from verified operators within minutes. Compare options by price, aircraft, and operator ratings. Confirm your booking with secure payment (crypto or fiat). Receive trip details, crew information, and concierge support throughout your journey.'
        }
      ]
    },
    tokenization: {
      title: 'Tokenization & RWA',
      icon: Coins,
      topics: [
        {
          id: 'what-is-tokenization',
          title: 'What is asset tokenization?',
          answer: 'Asset tokenization converts real-world aviation assets (aircraft, fleet shares, revenue rights) into blockchain tokens on Base network. Each token represents fractional ownership, enabling investors to own a piece of high-value assets starting from smaller amounts. Tokens are backed by legal documentation, smart contracts, and real asset valuations.'
        },
        {
          id: 'how-tokenization-works',
          title: 'How does the tokenization process work?',
          answer: 'Asset owners submit documentation (AOC, insurance, valuations). Our team verifies compliance and creates a legal structure. Smart contracts are deployed on Base blockchain. Tokens are minted representing ownership shares. Investors can purchase tokens during presale or on the secondary marketplace. Revenue is distributed proportionally to token holders.'
        },
        {
          id: 'rwa-marketplace',
          title: 'What is the RWA Marketplace?',
          answer: 'The Real World Asset (RWA) Marketplace allows trading of tokenized aviation assets. Browse available aircraft tokens, view performance metrics, dividend history, and asset details. Buy and sell fractional ownership on the secondary market with transparent pricing and instant settlement. All trades are recorded on-chain for full transparency.'
        },
        {
          id: 'token-benefits',
          title: 'What are the benefits of holding tokens?',
          answer: 'Token holders receive: proportional revenue share from charter operations, voting rights on asset management decisions, potential capital appreciation, liquidity through secondary market trading, transparent reporting on asset performance, and governance participation in the DAO managing the asset.'
        },
        {
          id: 'tokenization-requirements',
          title: 'What documents are required for tokenization?',
          answer: 'Required documentation includes: Air Operator Certificate (AOC), aircraft registration, insurance certificates, maintenance records, professional valuation report, ownership proof, and regulatory compliance documents. Our team guides you through the entire documentation process and legal structuring.'
        }
      ]
    },
    web3: {
      title: 'Web3 & Blockchain',
      icon: Shield,
      topics: [
        {
          id: 'escrow-service',
          title: 'What is PrivateCharterX Escrow?',
          answer: 'Our in-house escrow service at escrow.privatecharterx.com enables buyers to create automatic escrows in accordance with terms discussed with sellers. Fully on-chain and transparent, the escrow releases funds only when both parties confirm the transaction is complete. Supports multiple networks including Base, Ethereum, and Polygon.'
        },
        {
          id: 'smart-contracts',
          title: 'How are smart contracts used?',
          answer: 'Smart contracts automate: token distribution and vesting, revenue sharing to holders, escrow fund releases, NFT membership benefits, and CO2 certificate issuance. All contracts are audited and deployed on Base blockchain for low fees and fast transactions.'
        },
        {
          id: 'wallet-connection',
          title: 'How do I connect my wallet?',
          answer: 'Click "Connect" in the header and select your wallet: MetaMask, WalletConnect, Coinbase Wallet, or other WC-compatible wallets. Approve the connection request. Once connected, you can view balances, make payments, and interact with all Web3 features. Ensure you are on Base network for optimal experience.'
        },
        {
          id: 'token-swap',
          title: 'How does Token Swap work?',
          answer: 'Swap between cryptocurrencies directly on-platform using integrated DEX aggregators. Compare rates across liquidity pools, set slippage tolerance, and execute swaps with transparent gas estimation. Supports major tokens on Base network including ETH, USDC, and our native PCX token.'
        },
        {
          id: 'launchpad',
          title: 'What is the Token Launchpad?',
          answer: 'The Launchpad hosts presales for new tokenized aviation projects. Browse upcoming launches, review project documentation, participate in early investment rounds, and track your allocations. Features include: vesting schedules, KYC verification, funding goals, and post-launch liquidity provision.'
        }
      ]
    },
    payments: {
      title: 'Payments & Crypto',
      icon: CreditCard,
      topics: [
        {
          id: 'crypto-payments',
          title: 'How do crypto payments work?',
          answer: 'We accept 70+ cryptocurrencies via CoinGate integration including BTC, ETH, USDC, USDT, and PCX token. Select crypto at checkout, scan the QR code or copy the payment address, confirm in your wallet. Payments are processed instantly on-chain with automatic confirmation. 2.5% platform fee + 1% processing fee applies.'
        },
        {
          id: 'accepted-currencies',
          title: 'What cryptocurrencies are accepted?',
          answer: 'Major currencies: Bitcoin (BTC), Ethereum (ETH), USDC, USDT, DAI. Layer 2: Base ETH, Polygon MATIC, Arbitrum ETH. Platform token: PCX (PrivateCharterX token with 5% booking discount). Plus 60+ additional tokens through our payment processor. Fiat payments via credit card also available.'
        },
        {
          id: 'pcx-token',
          title: 'What is the PCX token?',
          answer: 'PCX is our native utility token on Base network. Benefits include: 5% discount on all bookings, staking rewards, governance voting rights, exclusive access to premium empty legs, priority booking, and reduced platform fees. Stake PCX to earn rewards and unlock higher membership tiers.'
        },
        {
          id: 'refunds',
          title: 'How do refunds work for crypto payments?',
          answer: 'Refunds are processed to your original wallet address in USDC stablecoin (to avoid volatility). Refund eligibility depends on booking terms and cancellation timing. Full refunds for cancellations 48+ hours before departure, partial refunds for later cancellations. Refunds typically process within 24-48 hours.'
        }
      ]
    },
    sustainability: {
      title: 'Sustainability',
      icon: Leaf,
      topics: [
        {
          id: 'co2-certificates',
          title: 'How do CO2 offset certificates work?',
          answer: 'Calculate your flight emissions using our carbon calculator. Purchase Verified Carbon Standard (VCS) certified offsets. Receive an NFT certificate proving your environmental contribution. Each certificate is permanently recorded on-chain and links to verified carbon reduction projects including reforestation, renewable energy, and methane capture.'
        },
        {
          id: 'carbon-calculation',
          title: 'How is carbon footprint calculated?',
          answer: 'We calculate emissions based on: aircraft type, fuel consumption rates, flight distance, passenger count, and operational factors. Our methodology follows ICAO standards and includes both direct emissions and lifecycle impacts. Results are displayed in tons of CO2 equivalent with recommended offset amounts.'
        },
        {
          id: 'offset-projects',
          title: 'What offset projects are supported?',
          answer: 'We partner with verified projects including: Amazon rainforest protection, wind farms in developing nations, methane capture from landfills, clean cookstove distribution, and ocean plastic collection. All projects are certified by Verra (VCS) or Gold Standard with transparent impact reporting.'
        }
      ]
    },
    account: {
      title: 'Account & Security',
      icon: Shield,
      topics: [
        {
          id: 'kyc-verification',
          title: 'Why is KYC verification required?',
          answer: 'KYC (Know Your Customer) is required for: aviation bookings (international security regulations), transactions over $3,000, tokenization participation, and DAO governance. Submit ID and proof of address through our secure Sumsub integration. Verification typically completes within 24-48 hours. Your data is encrypted and never shared.'
        },
        {
          id: 'account-security',
          title: 'How is my account secured?',
          answer: 'Multi-layer security includes: email verification, optional 2FA, session management, wallet signature verification for Web3 actions, encrypted data storage, and regular security audits. For high-value transactions, additional verification may be required. Never share your wallet seed phrase with anyone.'
        },
        {
          id: 'data-privacy',
          title: 'How is my data protected?',
          answer: 'We follow GDPR and Swiss data protection laws. Personal data is encrypted at rest and in transit. Blockchain transactions are pseudonymous. You can request data export or deletion anytime. We never sell personal data. Booking information is shared only with operators necessary for your trip.'
        }
      ]
    }
  };

  // Flatten all topics for search
  const allTopics = Object.entries(faqSections).flatMap(([sectionId, section]) =>
    section.topics.map(topic => ({ ...topic, sectionId, sectionTitle: section.title }))
  );

  // Filter topics based on search and active section
  const filteredTopics = allTopics.filter(topic => {
    const matchesSearch = !searchQuery ||
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection = activeSection === 'all' || topic.sectionId === activeSection;
    return matchesSearch && matchesSection;
  });

  return (
    <div className="min-h-full px-4 py-6">
      {/* Header Section */}
      <div className="max-w-5xl mx-auto mb-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        {/* Section Filters - No Icons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSection('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSection === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Topics
          </button>
          {Object.entries(faqSections).map(([id, section]) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeSection === id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Cards Grid - 2 Columns */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTopics.map((topic) => {
            const isExpanded = expandedTopic === topic.id;

            return (
              <div
                key={topic.id}
                onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                className={`bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200 ${
                  isExpanded ? 'md:col-span-2' : ''
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-gray-600" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{topic.sectionTitle}</span>
                          <h3 className="text-sm font-medium text-gray-900 mt-0.5">{topic.title}</h3>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 mt-1 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>

                      {/* Expanded Answer */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[500px] mt-3 opacity-100' : 'max-h-0 opacity-0'}`}
                      >
                        <div className="pt-3 border-t border-gray-100">
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {topic.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTopics.length === 0 && (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
            <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No questions found matching your search.</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveSection('all'); }}
              className="mt-3 text-xs text-gray-900 underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Platform Features Overview */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Platform Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-light text-gray-900">16,000+</div>
              <div className="text-xs text-gray-500 mt-1">Aircraft Worldwide</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-light text-gray-900">150+</div>
              <div className="text-xs text-gray-500 mt-1">Countries Covered</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-light text-gray-900">70+</div>
              <div className="text-xs text-gray-500 mt-1">Crypto Currencies</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-light text-gray-900">24/7</div>
              <div className="text-xs text-gray-500 mt-1">Concierge Support</div>
            </div>
          </div>

          {/* Key Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl">
              <Plane className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Private Aviation</h4>
                <p className="text-xs text-gray-500 mt-1">Charter jets, helicopters, empty legs with instant quotes</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl">
              <Coins className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Asset Tokenization</h4>
                <p className="text-xs text-gray-500 mt-1">Fractional ownership of aircraft on Base blockchain</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl">
              <Shield className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Blockchain Escrow</h4>
                <p className="text-xs text-gray-500 mt-1">In-house escrow service at escrow.privatecharterx.com</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl">
              <CreditCard className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Crypto Payments</h4>
                <p className="text-xs text-gray-500 mt-1">70+ cryptocurrencies accepted via CoinGate</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl">
              <Leaf className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">CO2 Certificates</h4>
                <p className="text-xs text-gray-500 mt-1">Verified carbon offsets as NFTs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Banner - Collapsible */}
      <div className="max-w-5xl mx-auto">
        <ContactBannerCollapsible />
      </div>
    </div>
  );
};

// RWA Banner Carousel - Animated switching between assets
const RWABannerCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const assets = [
    {
      symbol: '$GFSTR',
      name: 'Gulfstream G650 (2019)',
      description: 'Ultra-long-range private jet',
      apy: '14.2%',
      badge: 'PRIVATE SALE',
      badgeColor: 'bg-red-500',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/winery/GFSTRM_Token-removebg-preview%20(1).png'
    },
    {
      symbol: '$SS90',
      name: 'Sunseeker 90 Ocean',
      description: 'Luxury superyacht',
      apy: '9.6%',
      badge: 'PRIVATE SALE',
      badgeColor: 'bg-red-500',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/winery/SS90_token_tokenized_yacht-removebg-preview.png'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % assets.length);
    }, 10000); // Switch every 10 seconds
    return () => clearInterval(interval);
  }, [assets.length]);

  const currentAsset = assets[activeIndex];

  return (
    <a
      href="mailto:admin@privatecharterx.com?subject=RWA%20Investment%20Inquiry&body=I%20am%20interested%20in%20learning%20more%20about%20tokenized%20asset%20investments."
      className="block border rounded-xl p-3 min-h-[120px] border-gray-300/50 transition-all group relative overflow-hidden"
      style={{
        backgroundImage: 'url(https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/winery/Privatecharterx_Banner%20(4)%20(1).png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Token image - absolute positioned, large, cut off at bottom */}
      <img
        src={currentAsset.image}
        alt={currentAsset.name}
        className="absolute -right-28 md:right-4 -bottom-[115px] w-[300px] h-[300px] object-contain group-hover:scale-105 transition-all duration-700 ease-in-out pointer-events-none"
      />
      {/* Left: Text content */}
      <div className="relative z-10 pr-24 ml-1 transition-all duration-700 ease-in-out">
        <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-gray-200 text-gray-600 mb-1.5">
          {currentAsset.badge}
        </span>
        <h4 className="text-sm font-bold text-gray-900 mb-0.5">
          {currentAsset.symbol} <span className="font-medium text-gray-700">{currentAsset.name}</span>
        </h4>
        <p className="text-xs text-gray-600">{currentAsset.description} • APY {currentAsset.apy}</p>
      </div>
    </a>
  );
};

const TokenizedAssetsGlassmorphic = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { chatId: urlChatId } = useParams();
  const { isAuthenticated, user, profile, signOut, initializing, isAdmin } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  const notificationCount = useNotificationCount(user?.id);
  // Initialize showDashboard based on isAuthenticated to prevent mobile blank screen
  const [showDashboard, setShowDashboard] = useState(() => {
    // Check if there's a session in localStorage (faster than waiting for auth)
    const hasStoredSession = localStorage.getItem('sb-oubecmstqtzdnevyqavu-auth-token');
    return !!hasStoredSession;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [adventureSubmitting, setAdventureSubmitting] = useState(false);
  const [adventureSubmitSuccess, setAdventureSubmitSuccess] = useState(false);
  const [adventureStartDate, setAdventureStartDate] = useState('');
  const [adventureEndDate, setAdventureEndDate] = useState('');
  const [adventureGuests, setAdventureGuests] = useState(2);
  const [showCryptoPayment, setShowCryptoPayment] = useState(false);
  const [cryptoPaymentData, setCryptoPaymentData] = useState(null);
  const [luxuryCarSubmitting, setLuxuryCarSubmitting] = useState(false);
  const [luxuryCarSubmitSuccess, setLuxuryCarSubmitSuccess] = useState(false);
  const { isConnected, address } = useAccount();
  const { open } = useAppKit();
  const { hasNFT, nftDiscount, isCheckingNFT, checkNFTMembership, showNFTModal, closeNFTModal, nfts, usedBenefits } = useNFT();

  const [activeCategory, setActiveCategoryInternal] = useState('chat');
  const [dashboardView, setDashboardView] = useState('overview');
  const [pendingCategory, setPendingCategory] = useState(null);
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [showSubscriptionPopupDismissed, setShowSubscriptionPopupDismissed] = useState(false);
  const [promoSlideIndex, setPromoSlideIndex] = useState(0);

  // Charter a jet expandable fields state (same as homepage)
  const [showHomeCharterFields, setShowHomeCharterFields] = useState(false);
  const [homeDepartureInput, setHomeDepartureInput] = useState('');
  const [homeDestinationInput, setHomeDestinationInput] = useState('');
  const [homeDepartureAirport, setHomeDepartureAirport] = useState(null);
  const [homeDestinationAirport, setHomeDestinationAirport] = useState(null);
  const [homeShowDepartureDropdown, setHomeShowDepartureDropdown] = useState(false);
  const [homeShowDestinationDropdown, setHomeShowDestinationDropdown] = useState(false);
  const [homeDepartureAirports, setHomeDepartureAirports] = useState([]);
  const [homeDestinationAirports, setHomeDestinationAirports] = useState([]);
  const [homeIsLoadingDeparture, setHomeIsLoadingDeparture] = useState(false);
  const [homeIsLoadingDestination, setHomeIsLoadingDestination] = useState(false);
  const [showLiveSupportChat, setShowLiveSupportChat] = useState(false);

  // Map internal category names to URL paths
  const categoryToUrl = {
    // Home (landing page style)
    'home': '/dashboard/home',

    // Aviation & Transport
    'jets': '/dashboard/jets',
    'helicopter': '/dashboard/helicopter',
    'empty-legs': '/dashboard/empty-legs',
    'ground-transport': '/dashboard/ground-transport',
    'adventures': '/dashboard/adventures',
    'flights': '/dashboard/flights',
    'luxury-cars': '/dashboard/luxury-cars',
    'hotels': '/dashboard/hotels',
    'services': '/dashboard/services',

    // Web3 Routes (all under /dashboard/web3/)
    'spv-formation': '/dashboard/web3/spv-formation',
    'my-spvs': '/dashboard/web3/my-tokenized-assets',
    'tokenize-asset': '/dashboard/web3/tokenize-asset',
    'tokenization': '/dashboard/web3/tokenization',
    'my-tokenized-assets': '/dashboard/web3/my-tokenized-assets',
    'launchpad': '/dashboard/web3/launchpad',
    'nft-marketplace': '/dashboard/nft-marketplace',  // Moved to main dashboard
    'marketplace': '/dashboard/web3/marketplace',
    'pvcx-token': '/dashboard/web3/pvcx-token',

    // CO2/SAF
    'co2-saf': '/dashboard/co2-saf',
    'co2-certificates': '/dashboard/co2-certificates',

    // Legal Pages
    'terms': '/dashboard/terms',
    'privacy': '/dashboard/privacy',
    'imprint': '/dashboard/imprint',

    // Subscriptions
    'subscription-plans': '/dashboard/subscriptions/plans',
    'subscriptions': '/dashboard/subscriptions/manage',

    // User
    'my-activity': '/dashboard/activities',
    'requests': '/dashboard/requests',
    'ai-requests': '/dashboard/ai-requests',
    'bookings': '/dashboard/bookings',
    'my-bookings': '/dashboard/my-bookings',
    'transactions': '/dashboard/transactions',
    'calendar': '/dashboard/calendar',
    'favourites': '/dashboard/favourites',
    'notifications': '/dashboard/notifications',
    'settings': '/dashboard/settings',
    'kyc-verification': '/dashboard/kyc-verification',
    'referral': '/dashboard/referral',
    'my-launches': '/dashboard/my-launches',

    // Chat & Support
    'chat': '/dashboard/chat',
    'chat-history': '/dashboard/chat-history',
    'chat-support': '/faqs',
    'support-messages': '/dashboard/messages',

    // Other
    'search-index': '/dashboard/search-index',
    'overview': '/dashboard/home',
    'profile': '/dashboard/profile',
  };

  // Wrapper for setActiveCategory to prevent invalid values, add logging, and sync URL
  const setActiveCategory = useCallback((category, skipUrlUpdate = false) => {
    const validCategory = category || 'chat'; // Default to 'chat' if empty/null
    console.log('📍 Setting activeCategory:', validCategory, 'from:', category);
    setActiveCategoryInternal(validCategory);

    // Update URL to match the category (unless skipUrlUpdate is true)
    if (!skipUrlUpdate && categoryToUrl[validCategory]) {
      let newUrl = categoryToUrl[validCategory];

      // For 'overview' category, check if we're in Web3 mode
      if (validCategory === 'overview') {
        const isCurrentlyWeb3 = window.location.pathname.startsWith('/dashboard/web3');
        if (isCurrentlyWeb3) {
          newUrl = '/dashboard/web3';
        }
      }

      // Only update if different from current path to avoid unnecessary history entries
      if (window.location.pathname !== newUrl) {
        window.history.pushState({}, '', newUrl);
      }
    }
  }, []);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [expandedAIRequestId, setExpandedAIRequestId] = useState(null);
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [requestsPage, setRequestsPage] = useState(1);
  const REQUESTS_PER_PAGE = 9;
  const [showMobileCategoryMenu, setShowMobileCategoryMenu] = useState(false);
  const [bookingStep, setBookingStep] = useState(0);
  const [bookingVehicleType, setBookingVehicleType] = useState('private-jet');
  // Initial flight data from URL params (for charter booking from hero)
  const [initialFlightData, setInitialFlightData] = useState(null);

  // KYC Status state
  const [kycStatus, setKycStatus] = useState('not_started'); // 'not_started', 'pending', 'approved', 'rejected'

  // Weather state
  const [weatherData, setWeatherData] = useState({
    city: 'Loading...',
    temp: '--',
    condition: '🌤️',
    description: 'Loading...',
    high: '--',
    low: '--'
  });

  // Auth modal states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showPartnerRegisterModal, setShowPartnerRegisterModal] = useState(false);

  // Admin login modal state (for secret CRM admin access)
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [isSimpleAdminAuth, setIsSimpleAdminAuth] = useState(() => {
    return sessionStorage.getItem('pvcx_admin_authenticated') === 'true';
  });

  // Search and UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: '1', text: 'New empty leg available: Zurich to London', time: '5m ago', unread: true },
    { id: '2', text: 'Your booking request was confirmed', time: '1h ago', unread: true },
    { id: '3', text: 'New adventure offer in Dubai', time: '2h ago', unread: false }
  ]);
  const [favorites, setFavorites] = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  // Web Mode state
  const [webMode, setWebMode] = useState('rws'); // 'rws' or 'web3'
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Header collapse state
  const [headersCollapsed, setHeadersCollapsed] = useState(false);

  // Sidebar collapse state (click to toggle instead of hover)
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // AI Chat state
  const [showChatOverview, setShowChatOverview] = useState(false);
  const [activeChat, setActiveChatState] = useState('new'); // Default to 'new', not null
  // Wrapper to keep activeChatRef in sync (for URL sync effect that can't have activeChat in deps)
  const setActiveChat = (value) => {
    activeChatRef.current = value;
    setActiveChatState(value);
  };
  const [chatMessages, setChatMessages] = useState({});
  const [chatUsageCount, setChatUsageCount] = useState(0);
  const [chatLimit, setChatLimit] = useState(2); // Default for Explorer
  
  // User Requests state
  const [userRequests, setUserRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);


  // Bookings state (empty legs, adventures, CO2 certificates)
  const [userBookings, setUserBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // SPV state
  const [userSPVs, setUserSPVs] = useState([]);
  const [loadingSPVs, setLoadingSPVs] = useState(false);
  const [selectedSPV, setSelectedSPV] = useState(null);

  // Wallet Signatures state (NFT verifications)
  const [walletSignatures, setWalletSignatures] = useState([]);
  const [loadingSignatures, setLoadingSignatures] = useState(false);

  // Tokenization state
  const [userTokenizations, setUserTokenizations] = useState([]);
  const [loadingTokenizations, setLoadingTokenizations] = useState(false);
  const [selectedTokenization, setSelectedTokenization] = useState(null);

  // DAO state
  const [userDaos, setUserDaos] = useState([]);
  const [loadingDaos, setLoadingDaos] = useState(false);

  // Empty Legs state
  const [emptyLegs, setEmptyLegs] = useState([]);
  const [currentEmptyLegIndex, setCurrentEmptyLegIndex] = useState(0);
  const [loadingEmptyLegs, setLoadingEmptyLegs] = useState(false);

  // Aviation card animation state (helicopter/jet switching)
  const [currentAviationType, setCurrentAviationType] = useState(0); // 0 = helicopter, 1 = jet

  // Aviation card rotation effect (switch between helicopter and jet every 5 seconds)
  useEffect(() => {
    const aviationInterval = setInterval(() => {
      setCurrentAviationType((prev) => (prev === 0 ? 1 : 0));
    }, 5000); // Switch every 5 seconds

    return () => clearInterval(aviationInterval);
  }, []);

  // Promo banner rotation effect
  useEffect(() => {
    const promoInterval = setInterval(() => {
      setPromoSlideIndex((prev) => (prev + 1) % 8); // 8 slides
    }, 5000);
    return () => clearInterval(promoInterval);
  }, []);

  // Ongoing Booking state (Taxi/Concierge & Empty Legs)
  const [ongoingBooking, setOngoingBooking] = useState(null);
  const [bookingCountdown, setBookingCountdown] = useState('00:00');
  const [loadingBooking, setLoadingBooking] = useState(false);

  // PVCX Token Balance state
  const [pvcxBalance, setPvcxBalance] = useState(0);
  const [loadingPvcxBalance, setLoadingPvcxBalance] = useState(false);

  // Tokenized Assets state (for overview display)
  const [tokenizedAssets, setTokenizedAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Subscription state
  const [subscriptionTier, setSubscriptionTier] = useState('explorer');
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [currentMessage, setCurrentMessage] = useState('');

  // Cart state (shared with AIChat)
  const [cartItems, setCartItems] = useState([]);

  // Report/Support popup state
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [reportSubject, setReportSubject] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Speech Recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatHistoryExpanded, setChatHistoryExpanded] = useState(true); // Sidebar chat history collapsible
  const previousUserIdRef = useRef(null); // Track previous user to detect user changes
  const activeChatRef = useRef(null); // Track activeChat without triggering effect re-runs

  // Ref to store pending URL params when user needs to log in first
  const pendingUrlParamsRef = useRef(null);

  // Predefined suggestions
  const chatSuggestions = [
    { icon: '✈️', text: 'Private Jet to Monaco', prompt: 'I need a private jet to Monaco for 4 passengers' },
    { icon: '🚁', text: 'Helicopter Sightseeing Tour', prompt: 'I want a scenic helicopter tour for 2 people' },
    { icon: '🏖️', text: 'Luxury Weekend Package', prompt: 'Plan a luxury weekend getaway with jet, hotel, and activities' },
    { icon: '🛩️', text: 'Empty Leg Deals', prompt: 'Show me available empty leg flights this week' },
    { icon: '🚙', text: 'Chauffeur Service', prompt: 'I need a luxury car with chauffeur for 3 days' },
    { icon: '⛰️', text: 'Adventure Package', prompt: 'Create an adventure package with flights and activities' }
  ];

  // Web3 / NFT states
  const [userNFTs, setUserNFTs] = useState([]);
  const [userCO2Certificates, setUserCO2Certificates] = useState([]);
  const [isLoadingWeb3, setIsLoadingWeb3] = useState(false);

  // Jets state variables
  const [jetsData, setJetsData] = useState([]);
  const [isLoadingJets, setIsLoadingJets] = useState(false);
  const [jetsFilter, setJetsFilter] = useState('all');
  const [jetsSearch, setJetsSearch] = useState('');
  const [jetsMaxPrice, setJetsMaxPrice] = useState('');
  const [currentJetsPage, setCurrentJetsPage] = useState(1);
  const jetsPerPage = 6;
  const [selectedJet, setSelectedJet] = useState(null);
  const [showJetDetail, setShowJetDetail] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [jetsViewMode, setJetsViewMode] = useState('tabs'); // 'grid' or 'tabs'
  const [jetsFiltersVisible, setJetsFiltersVisible] = useState(false);
  const [jetPassengers, setJetPassengers] = useState(1);
  const [jetLuggage, setJetLuggage] = useState(0);
  const [jetHasPet, setJetHasPet] = useState(false);

  // Helicopters state variables
  const [helicoptersData, setHelicoptersData] = useState([]);
  const [isLoadingHelicopters, setIsLoadingHelicopters] = useState(false);
  const [helicoptersFilter, setHelicoptersFilter] = useState('all');
  const [helicoptersSearch, setHelicoptersSearch] = useState('');
  const [helicoptersLocation, setHelicoptersLocation] = useState('');
  const [helicoptersMaxPrice, setHelicoptersMaxPrice] = useState('');
  const [currentHelicoptersPage, setCurrentHelicoptersPage] = useState(1);
  const helicoptersPerPage = 6;
  const [helicoptersViewMode, setHelicoptersViewMode] = useState('tabs');
  const [helicoptersFiltersVisible, setHelicoptersFiltersVisible] = useState(false);
  const [selectedHelicopter, setSelectedHelicopter] = useState(null);
  const [showHelicopterDetail, setShowHelicopterDetail] = useState(false);
  const [currentHelicopterImageIndex, setCurrentHelicopterImageIndex] = useState(0);
  const [helicopterPassengers, setHelicopterPassengers] = useState(1);
  const [helicopterLuggage, setHelicopterLuggage] = useState(0);
  const [helicopterHasPet, setHelicopterHasPet] = useState(false);
  const [helicopterDuration, setHelicopterDuration] = useState(1);
  const [helicopterSpecialRequests, setHelicopterSpecialRequests] = useState('');
  const [helicopterSubmitting, setHelicopterSubmitting] = useState(false);
  const [helicopterSubmitSuccess, setHelicopterSubmitSuccess] = useState(false);

  // Helicopter departure/destination state
  const [helicopterDeparture, setHelicopterDeparture] = useState(null);
  const [helicopterDestination, setHelicopterDestination] = useState(null);
  const [helicopterDepartureInput, setHelicopterDepartureInput] = useState('');
  const [helicopterDestinationInput, setHelicopterDestinationInput] = useState('');
  const [helicopterDepartureResults, setHelicopterDepartureResults] = useState([]);
  const [helicopterDestinationResults, setHelicopterDestinationResults] = useState([]);
  const [showHelicopterDepartureDropdown, setShowHelicopterDepartureDropdown] = useState(false);
  const [showHelicopterDestinationDropdown, setShowHelicopterDestinationDropdown] = useState(false);
  const [isSearchingHelicopterDeparture, setIsSearchingHelicopterDeparture] = useState(false);
  const [isSearchingHelicopterDestination, setIsSearchingHelicopterDestination] = useState(false);

  // Empty Legs state variables
  const [emptyLegsData, setEmptyLegsData] = useState([]);
  const [isLoadingEmptyLegs, setIsLoadingEmptyLegs] = useState(false);
  const [emptyLegsFilter, setEmptyLegsFilter] = useState('all');
  const [emptyLegsLocation, setEmptyLegsLocation] = useState('');
  const [emptyLegsDate, setEmptyLegsDate] = useState('');
  const [emptyLegsMaxPrice, setEmptyLegsMaxPrice] = useState('');
  const [currentEmptyLegsPage, setCurrentEmptyLegsPage] = useState(1);
  const emptyLegsPerPage = 6;
  const [emptyLegsViewMode, setEmptyLegsViewMode] = useState('tabs');
  const [emptyLegsFiltersVisible, setEmptyLegsFiltersVisible] = useState(false);
  const [selectedEmptyLeg, setSelectedEmptyLeg] = useState(null);
  const [showEmptyLegDetail, setShowEmptyLegDetail] = useState(false);
  const [currentEmptyLegImageIndex, setCurrentEmptyLegImageIndex] = useState(0);
  const [emptyLegPassengers, setEmptyLegPassengers] = useState(1);
  const [emptyLegLuggage, setEmptyLegLuggage] = useState(0);
  const [emptyLegHasPet, setEmptyLegHasPet] = useState(false);
  const [showEmptyLegSuccess, setShowEmptyLegSuccess] = useState(false);
  const [showCryptoPaymentModal, setShowCryptoPaymentModal] = useState(false);
  const [cryptoPaymentService, setCryptoPaymentService] = useState(null);

  // Empty Leg Request Function
  const requestEmptyLegFlight = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!selectedEmptyLeg) return;

    try {
      const rawData = selectedEmptyLeg.rawData || selectedEmptyLeg;

      // Calculate price breakdown - use price_usd directly from database
      // VAT only (8.1%), no platform fee
      const basePrice = selectedEmptyLeg.priceUSD || rawData.price_in_usd || rawData.price_usd || 0;
      const vatPercent = 8.1; // Swiss VAT
      const vatAmount = Math.round(basePrice * (vatPercent / 100));
      const totalPrice = basePrice + vatAmount;

      console.log('🔥 SAVING EMPTY LEG REQUEST:', {
        userId: user.id,
        userEmail: user.email,
        type: 'empty_leg',
        passengers: emptyLegPassengers,
        luggage: emptyLegLuggage,
        hasPet: emptyLegHasPet,
        priceBreakdown: { basePrice, vatAmount, totalPrice }
      });

      // DIRECT INSERT - matching working EmptyLegModal.tsx pattern
      // INCLUDES ALL FIELDS needed for MyRequestsView display
      const { error: dbError } = await supabase
        .from('user_requests')
        .insert([{
          user_id: user.id,
          type: 'empty_leg',
          status: 'pending',
          client_email: user.email,
          data: {
            source: 'empty_leg_checkout',
            empty_leg_id: rawData.id,
            // Route info
            flight_route: `${rawData.from_city || rawData.from_iata} → ${rawData.to_city || rawData.to_iata}`,
            from_city: rawData.from_city,
            to_city: rawData.to_city,
            from: rawData.from_city || rawData.from_iata,
            to: rawData.to_city || rawData.to_iata,
            from_iata: rawData.from_iata,
            to_iata: rawData.to_iata,
            // Date/Time
            departure_date: rawData.departure_date,
            departure_time: rawData.departure_time,
            date: rawData.departure_date,
            time: rawData.departure_time,
            // Aircraft info
            aircraft_model: rawData.aircraft_model,
            aircraft_type: rawData.category || rawData.aircraft_type,
            aircraft: rawData.aircraft_model || rawData.category || rawData.aircraft_type,
            category: rawData.category,
            capacity: rawData.capacity || rawData.pax,
            available_seats: rawData.capacity || rawData.pax,
            // Title/name for display
            name: selectedEmptyLeg.name || `${rawData.from_city || rawData.from_iata} → ${rawData.to_city || rawData.to_iata}`,
            title: `Empty Leg: ${rawData.from_city || rawData.from_iata} → ${rawData.to_city || rawData.to_iata}`,
            // Price breakdown - VAT only, no platform fee
            base_price: basePrice,
            price: basePrice,
            price_usd: basePrice,
            vat_amount: vatAmount,
            vat_percent: vatPercent,
            total_price: totalPrice,
            total: totalPrice,
            original_price_gbp: rawData.price, // Store original GBP for reference
            original_price: basePrice,
            currency: 'USD',
            priceRange: `$${totalPrice.toLocaleString()}`,
            // Booking details
            passengers: emptyLegPassengers,
            pax: emptyLegPassengers,
            luggage: emptyLegLuggage,
            has_pet: emptyLegHasPet,
            // Image for display in My Requests
            image_url: rawData.image_url || rawData.aircraft_image || selectedEmptyLeg.primaryImage || selectedEmptyLeg.image,
            primaryImage: rawData.image_url || rawData.aircraft_image || selectedEmptyLeg.primaryImage,
            // Wallet info
            wallet_address: address && isConnected ? address : null,
            awaiting_payment: true
          }
        }]);

      if (dbError) throw dbError;

      console.log('✅ REQUEST SAVED SUCCESSFULLY');
      console.log('✅ Navigating to My Requests tab...');

      setShowEmptyLegSuccess(true);

      setTimeout(() => {
        setShowEmptyLegSuccess(false);
        setActiveCategory('requests'); // Go directly to My Requests tab!
      }, 2000);
    } catch (error) {
      console.error('❌ Request failed:', error);
      alert(`❌ Flight request failed!\n\nError: ${error.message}\n\nUser ID: ${user?.id}\nPlease screenshot this and report it.`);
    }
  };

  // Helicopter airport/location search functions
  const searchHelicopterDeparture = async (query) => {
    if (!query || query.length < 2) {
      setHelicopterDepartureResults([]);
      return;
    }
    setIsSearchingHelicopterDeparture(true);
    try {
      const results = await airportsJsonService.searchAirports(query);
      setHelicopterDepartureResults(results.slice(0, 8));
    } catch (error) {
      console.error('Error searching departure airports:', error);
      setHelicopterDepartureResults([]);
    } finally {
      setIsSearchingHelicopterDeparture(false);
    }
  };

  const searchHelicopterDestination = async (query) => {
    if (!query || query.length < 2) {
      setHelicopterDestinationResults([]);
      return;
    }
    setIsSearchingHelicopterDestination(true);
    try {
      const results = await airportsJsonService.searchAirports(query);
      setHelicopterDestinationResults(results.slice(0, 8));
    } catch (error) {
      console.error('Error searching destination airports:', error);
      setHelicopterDestinationResults([]);
    } finally {
      setIsSearchingHelicopterDestination(false);
    }
  };

  const selectHelicopterDeparture = (airport) => {
    setHelicopterDeparture(airport);
    setHelicopterDepartureInput(airport.name + (airport.code ? ` (${airport.code})` : ''));
    setShowHelicopterDepartureDropdown(false);
    setHelicopterDepartureResults([]);
  };

  const selectHelicopterDestination = (airport) => {
    setHelicopterDestination(airport);
    setHelicopterDestinationInput(airport.name + (airport.code ? ` (${airport.code})` : ''));
    setShowHelicopterDestinationDropdown(false);
    setHelicopterDestinationResults([]);
  };

  // Home Charter a Jet - Airport Search Functions (same as homepage FloatingSearchModal)
  const searchHomeDepartureAirports = async (query) => {
    if (!query || query.length < 2) {
      setHomeDepartureAirports([]);
      return;
    }
    setHomeIsLoadingDeparture(true);
    try {
      const results = await airportsJsonService.searchAirports(query);
      setHomeDepartureAirports(results.slice(0, 8));
    } catch (error) {
      console.error('Error searching departure airports:', error);
      setHomeDepartureAirports([]);
    } finally {
      setHomeIsLoadingDeparture(false);
    }
  };

  const searchHomeDestinationAirports = async (query) => {
    if (!query || query.length < 2) {
      setHomeDestinationAirports([]);
      return;
    }
    setHomeIsLoadingDestination(true);
    try {
      const results = await airportsJsonService.searchAirports(query);
      setHomeDestinationAirports(results.slice(0, 8));
    } catch (error) {
      console.error('Error searching destination airports:', error);
      setHomeDestinationAirports([]);
    } finally {
      setHomeIsLoadingDestination(false);
    }
  };

  const handleHomeDepartureSelect = (airport) => {
    setHomeDepartureAirport(airport);
    setHomeDepartureInput(`${airport.city} (${airport.code})`);
    setHomeShowDepartureDropdown(false);
  };

  const handleHomeDestinationSelect = (airport) => {
    setHomeDestinationAirport(airport);
    setHomeDestinationInput(`${airport.city} (${airport.code})`);
    setHomeShowDestinationDropdown(false);
  };

  // Handle charter jet submission - triggers AI chat with departure/destination
  const handleHomeCharterJetSubmit = () => {
    if (homeDepartureAirport && homeDestinationAirport) {
      const query = `I need a private jet from ${homeDepartureAirport.city} (${homeDepartureAirport.code}) to ${homeDestinationAirport.city} (${homeDestinationAirport.code})`;
      if (!user) {
        setShowLoginModal(true);
      } else {
        setAiChatQuery(query);
        setActiveChat('new');
        setActiveCategory('chat');
      }
    }
  };

  // Helicopter Charter Request Function
  const requestHelicopterCharter = async () => {
    if (!user) {
      alert('Please sign in to request a helicopter charter');
      return;
    }

    if (!selectedHelicopter) {
      alert('No helicopter selected');
      return;
    }

    setHelicopterSubmitting(true);

    try {
      const rawData = selectedHelicopter.rawData || {};

      // Calculate price breakdown
      const pricePerHour = rawData.price || rawData.price_per_hour || 0;
      const basePrice = Math.round(pricePerHour * helicopterDuration);
      const platformFeePercent = 2.5;
      const platformFee = Math.round(basePrice * (platformFeePercent / 100));
      const vatPercent = 8.1; // Swiss VAT
      const vatAmount = Math.round(basePrice * (vatPercent / 100));
      const totalPrice = basePrice + platformFee + vatAmount;

      const payload = {
        helicopter_id: rawData.id,
        helicopter_name: selectedHelicopter.name || rawData.name,
        helicopter_type: selectedHelicopter.type || rawData.type || rawData.category,
        aircraft: selectedHelicopter.name || rawData.name, // For unified extraction
        category: selectedHelicopter.type || rawData.type || rawData.category,
        capacity: selectedHelicopter.capacity || rawData.capacity,
        location: selectedHelicopter.location || rawData.location,
        price_per_hour: pricePerHour,
        currency: rawData.currency || 'USD',

        // Route/Location details
        departure: helicopterDeparture ? {
          name: helicopterDeparture.name,
          code: helicopterDeparture.code || null,
          city: helicopterDeparture.city || null,
          country: helicopterDeparture.country || null,
          lat: helicopterDeparture.lat || null,
          lng: helicopterDeparture.lng || null,
        } : (helicopterDepartureInput ? { custom_address: helicopterDepartureInput } : null),
        destination: helicopterDestination ? {
          name: helicopterDestination.name,
          code: helicopterDestination.code || null,
          city: helicopterDestination.city || null,
          country: helicopterDestination.country || null,
          lat: helicopterDestination.lat || null,
          lng: helicopterDestination.lng || null,
        } : (helicopterDestinationInput ? { custom_address: helicopterDestinationInput } : null),
        departure_display: helicopterDepartureInput || null,
        destination_display: helicopterDestinationInput || null,

        // Booking details
        passengers: helicopterPassengers,
        duration_hours: helicopterDuration,
        special_requests: helicopterSpecialRequests,

        // Full price breakdown
        base_price: basePrice,
        platform_fee: platformFee,
        platform_fee_percent: platformFeePercent,
        vat_amount: vatAmount,
        vat_percent: vatPercent,
        total_price: totalPrice,
        estimated_total: totalPrice, // Keep for backwards compatibility

        // Client info
        client_info: {
          user_id: user.id,
          email: user.email,
          name: user.name || user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        },

        // Metadata
        booking_source: 'glassmorphic_helicopter_detail',
        timestamp: new Date().toISOString(),
      };

      // Save to user_requests - triggers email notifications
      const { data: insertedData, error: dbError } = await supabase
        .from('user_requests')
        .insert([{
          user_id: user.id,
          type: 'helicopter_charter',
          status: 'pending',
          client_email: payload.client_info.email,
          data: payload
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      // Trigger email notification via edge function
      try {
        await supabase.functions.invoke('user-request-notifications', {
          body: { record: { id: insertedData.id } }
        });
      } catch (emailError) {
        console.error('Email notification error (non-blocking):', emailError);
      }

      setHelicopterSubmitSuccess(true);
      showToast('Helicopter charter request submitted successfully!', 'success');

      setTimeout(() => {
        setHelicopterSubmitSuccess(false);
        setShowHelicopterDetail(false);
        setHelicopterPassengers(1);
        setHelicopterDuration(1);
        setHelicopterSpecialRequests('');
        // Reset departure/destination
        setHelicopterDeparture(null);
        setHelicopterDestination(null);
        setHelicopterDepartureInput('');
        setHelicopterDestinationInput('');
        setActiveCategory('requests'); // Navigate to My Requests
      }, 2500);

    } catch (err) {
      console.error('Failed to submit helicopter charter request', err);
      alert('Failed to submit request. Please try again.');
    } finally {
      setHelicopterSubmitting(false);
    }
  };

  // Adventures state variables
  const [adventuresData, setAdventuresData] = useState([]);
  const [isLoadingAdventures, setIsLoadingAdventures] = useState(false);
  const [adventuresFilter, setAdventuresFilter] = useState('all');
  const [adventuresSearch, setAdventuresSearch] = useState('');
  // Split filters: dedicated states for package type and destination (fixes shared input bug)
  const [adventuresPackageType, setAdventuresPackageType] = useState('');
  const [adventuresDestination, setAdventuresDestination] = useState('');
  const [adventuresMaxPrice, setAdventuresMaxPrice] = useState('');
  const [currentAdventuresPage, setCurrentAdventuresPage] = useState(1);
  const adventuresPerPage = 6;

  // AI Chat query state (for search integration)
  const [aiChatQuery, setAiChatQuery] = useState('');
  const [aiAssistantMessage, setAiAssistantMessage] = useState(''); // Prefilled assistant message

  // Debug: Log when aiChatQuery changes
  useEffect(() => {
    console.log('🔍 aiChatQuery state changed:', aiChatQuery, 'activeCategory:', activeCategory, 'user.id:', user?.id);
  }, [aiChatQuery, activeCategory, user?.id]);
  const [adventuresViewMode, setAdventuresViewMode] = useState('tabs');
  const [adventuresFiltersVisible, setAdventuresFiltersVisible] = useState(false);
  const [selectedAdventure, setSelectedAdventure] = useState(null);
  const [showAdventureDetail, setShowAdventureDetail] = useState(false);
  const [currentAdventureImageIndex, setCurrentAdventureImageIndex] = useState(0);
  const [adventureDetailTab, setAdventureDetailTab] = useState('details'); // 'details' | 'itinerary' | 'pricing'
  // (state moved to top of component)

  // Luxury Cars state variables
  const [luxuryCarsData, setLuxuryCarsData] = useState([]);
  const [isLoadingLuxuryCars, setIsLoadingLuxuryCars] = useState(false);
  const [luxuryCarsFilter, setLuxuryCarsFilter] = useState('all');
  const [luxuryCarsBrand, setLuxuryCarsBrand] = useState('');
  const [luxuryCarsLocation, setLuxuryCarsLocation] = useState('');
  const [luxuryCarsMaxPrice, setLuxuryCarsMaxPrice] = useState('');
  const [currentLuxuryCarsPage, setCurrentLuxuryCarsPage] = useState(1);
  const luxuryCarsPerPage = 6;
  const [luxuryCarsViewMode, setLuxuryCarsViewMode] = useState('tabs');
  const [luxuryCarsFiltersVisible, setLuxuryCarsFiltersVisible] = useState(false);
  const [selectedLuxuryCar, setSelectedLuxuryCar] = useState(null);
  const [showLuxuryCarDetail, setShowLuxuryCarDetail] = useState(false);
  const [currentLuxuryCarImageIndex, setCurrentLuxuryCarImageIndex] = useState(0);
  const [luxuryCarDetailTab, setLuxuryCarDetailTab] = useState('details'); // 'details' | 'specs' | 'pricing'

  // CO2 Projects state variables
  const [selectedCO2Project, setSelectedCO2Project] = useState(null);
  const [showCO2ProjectDetail, setShowCO2ProjectDetail] = useState(false);
  const [currentCO2ProjectImageIndex, setCurrentCO2ProjectImageIndex] = useState(0);
  const [co2ActiveTab, setCO2ActiveTab] = useState('details');
  const [co2ViewMode, setCo2ViewMode] = useState('tabs');
  const [co2FiltersVisible, setCo2FiltersVisible] = useState(false);
  const [chatHistoryViewMode, setChatHistoryViewMode] = useState('grid');
  const [selectedChatForView, setSelectedChatForView] = useState(null);

  // Blog post state - now supports multiple posts with rotation
  const [blogPosts, setBlogPosts] = useState([]);
  const [currentBlogIndex, setCurrentBlogIndex] = useState(0);
  const [latestBlogPost, setLatestBlogPost] = useState(null);
  const [blogLoading, setBlogLoading] = useState(false);

  // Ethereum price state
  const [ethPrice, setEthPrice] = useState(null);
  const [ethLoading, setEthLoading] = useState(false);
  const [ethHistory, setEthHistory] = useState([]);

  // Assets data - static for now
  const allAssets = [
    {
      id: 'gulfstream-g650',
      name: 'Gulfstream G650ER',
      description: 'Ultra-Long Range Business Jet',
      apy: '8.7%',
      tokenPrice: '$1,250',
      maxHolders: '2,500',
      image: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800'
    },
    {
      id: 'luxury-limousine',
      name: 'Elite Limousine Fleet',
      description: 'Premium Ground Transportation',
      apy: '12.3%',
      tokenPrice: '$850',
      maxHolders: '5,000',
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800'
    },
    {
      id: 'helicopter-tours',
      name: 'Coastal Helicopter Tours',
      description: 'Tourism & Charter Operations',
      apy: '15.2%',
      tokenPrice: '$650',
      maxHolders: '3,000',
      image: 'https://images.unsplash.com/photo-1639089742630-ec968e4e8741?w=800'
    }
  ];

  // CO2 Projects Data
  const co2ProjectsData = [
    {
      id: '10250',
      projectId: '10250',
      name: 'Solar Power Project',
      description: 'This Clean Development Mechanism (CDM) project involves a 5MW grid-connected solar photovoltaic power plant in Anantapur district, Andhra Pradesh, India.',
      location: 'Anantapur, Andhra Pradesh',
      country: 'India',
      ngoName: 'Narasimha Swamy Solar Generations Pvt. Ltd.',
      verified: true,
      certificationStandard: 'CDM',
      pricePerTon: 5.00,
      minPurchase: 1,
      maxPurchase: 1000,
      availableTons: 35243,
      image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800',
      benefits: ['Clean Energy Generation', 'Employment Creation', 'Rural Electrification', 'Technology Transfer'],
      methodology: 'Solar Photovoltaic Power Generation',
      category: 'Renewable Energy',
      additionalInfo: {
        biodiversityImpact: 'Minimal land use with native vegetation preserved around solar panels',
        communityBenefit: 'Local employment opportunities and skill development programs',
        technologyUsed: '5MW crystalline silicon solar PV modules with grid-tied inverters'
      }
    },
    {
      id: '6573',
      projectId: '6573',
      name: 'Waste Management Program',
      description: 'Large-scale waste management and methane capture project in São Paulo, Brazil. Converts landfill gas into clean energy while reducing harmful emissions.',
      location: 'São Paulo',
      country: 'Brazil',
      ngoName: 'EcoSistemas Brasil',
      verified: true,
      certificationStandard: 'CDM',
      pricePerTon: 8.50,
      minPurchase: 1,
      maxPurchase: 500,
      availableTons: 12500,
      image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800',
      benefits: ['Methane Capture', 'Clean Energy Production', 'Waste Reduction', 'Air Quality Improvement'],
      methodology: 'Landfill Gas Capture and Utilization',
      category: 'Carbon Offset',
      additionalInfo: {
        biodiversityImpact: 'Reduced pollution in surrounding ecosystems and waterways',
        communityBenefit: 'Improved sanitation and reduced health risks for local communities',
        technologyUsed: 'Advanced methane capture systems with energy generation capacity'
      }
    },
    {
      id: '9165',
      projectId: '9165',
      name: 'Wind Parks Initiative',
      description: 'Offshore wind energy project in the North Sea, contributing to Europe\'s renewable energy transition and climate goals.',
      location: 'North Sea',
      country: 'Germany',
      ngoName: 'WindKraft Europa GmbH',
      verified: true,
      certificationStandard: 'CDM',
      pricePerTon: 12.00,
      minPurchase: 5,
      maxPurchase: 2000,
      availableTons: 45000,
      image: 'https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=800',
      benefits: ['Renewable Energy', 'Grid Stability', 'Job Creation', 'Marine Protection Zones'],
      methodology: 'Offshore Wind Energy Generation',
      category: 'Renewable Energy',
      additionalInfo: {
        biodiversityImpact: 'Marine protected zones established, creating artificial reef habitats',
        communityBenefit: 'Clean energy for 150,000 households and coastal job creation',
        technologyUsed: '8MW offshore wind turbines with advanced monitoring systems'
      }
    },
    {
      id: '10080',
      projectId: '10080',
      name: 'Hydro Power Station',
      description: 'Run-of-river hydroelectric project in the Himalayas, providing clean energy while preserving river ecosystems.',
      location: 'Himachal Pradesh',
      country: 'India',
      ngoName: 'Himalayan Green Energy Ltd.',
      verified: true,
      certificationStandard: 'CDM',
      pricePerTon: 6.50,
      minPurchase: 1,
      maxPurchase: 1500,
      availableTons: 28000,
      image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
      benefits: ['Clean Energy', 'Water Conservation', 'Local Development', 'Ecosystem Preservation'],
      methodology: 'Run-of-River Hydroelectric Power',
      category: 'Renewable Energy',
      additionalInfo: {
        biodiversityImpact: 'Fish passages maintained, minimal impact on river flow and wildlife',
        communityBenefit: 'Local infrastructure development and educational programs',
        technologyUsed: 'Low-impact turbines with environmental flow maintenance systems'
      }
    },
    {
      id: '9078',
      projectId: '9078',
      name: 'Biomass Energy Plant',
      description: 'Agricultural waste to energy conversion facility, reducing emissions while supporting local farmers.',
      location: 'Punjab',
      country: 'India',
      ngoName: 'BioEnergy India Pvt. Ltd.',
      verified: true,
      certificationStandard: 'CDM',
      pricePerTon: 7.00,
      minPurchase: 1,
      maxPurchase: 800,
      availableTons: 18500,
      image: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800',
      benefits: ['Waste Reduction', 'Rural Income', 'Clean Energy', 'Air Quality'],
      methodology: 'Biomass Power Generation',
      category: 'Carbon Offset',
      additionalInfo: {
        biodiversityImpact: 'Reduced open burning of crop residue, improving air quality',
        communityBenefit: 'Additional income for farmers through waste purchase programs',
        technologyUsed: 'Advanced biomass gasification with emission control systems'
      }
    },
    {
      id: '7980',
      projectId: '7980',
      name: 'Reforestation Program',
      description: 'Large-scale tropical reforestation and conservation project, restoring degraded lands and protecting biodiversity.',
      location: 'Amazon Basin',
      country: 'Brazil',
      ngoName: 'Amazon Conservation Alliance',
      verified: true,
      certificationStandard: 'CDM',
      pricePerTon: 15.00,
      minPurchase: 1,
      maxPurchase: 5000,
      availableTons: 75000,
      image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
      benefits: ['Carbon Sequestration', 'Biodiversity Protection', 'Indigenous Support', 'Ecosystem Restoration'],
      methodology: 'Afforestation and Reforestation',
      category: 'Carbon Offset',
      additionalInfo: {
        biodiversityImpact: 'Critical habitat restoration for endangered species',
        communityBenefit: 'Support for indigenous communities and sustainable livelihoods',
        technologyUsed: 'Native species planting with long-term monitoring and protection'
      }
    }
  ];

  // Check authentication on mount - Allow guest view for non-authenticated users
  useEffect(() => {
    if (!isAuthenticated && !initializing) {
      // Don't show login modal immediately - allow guest view
      setShowDashboard(true);
      // Set activeCategory to home for guest landing
      if (activeCategory !== 'home') {
        setActiveCategory('home', true);
      }
    }
  }, [isAuthenticated, initializing]);

  // Handle post-login navigation to pending category
  useEffect(() => {
    if (isAuthenticated && user && pendingCategory) {
      setActiveCategory(pendingCategory);
      setPendingCategory(null);
    }
  }, [isAuthenticated, user, pendingCategory]);

  // For native app mode, re-show login modal if needed
  // On web, allow guest view to remain visible
  useEffect(() => {
    const noModalsOpen = !showLoginModal && !showRegisterModal && !showForgotPasswordModal && !showPartnerRegisterModal;

    if (!isAuthenticated && !initializing && noModalsOpen) {
      // In native app, re-show the login modal instead of allowing guest view
      if (isNativeApp()) {
        setShowLoginModal(true);
      }
      // On web, allow guest view - no redirect
    }
  }, [isAuthenticated, initializing, showLoginModal, showRegisterModal, showForgotPasswordModal, showPartnerRegisterModal, navigate]);

  // Handle successful login/register - Show toast and animate dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      // Close all auth modals
      setShowLoginModal(false);
      setShowRegisterModal(false);
      setShowForgotPasswordModal(false);

      // Check if toast was already shown for this session
      const toastShownKey = `toast_shown_${user.id}`;
      const toastAlreadyShown = sessionStorage.getItem(toastShownKey);

      if (!toastAlreadyShown) {
        // Determine if returning user or new user based on created_at timestamp
        const createdAt = new Date(user.created_at);
        const now = new Date();
        const isNewUser = (now.getTime() - createdAt.getTime()) < 60000; // Within 1 minute = new registration
        const firstName = user.first_name || user.name || user.email?.split('@')[0] || 'User';

        // Show personalized toast
        const message = isNewUser
          ? `Welcome ${firstName}! You've received 100 PVCX tokens as a welcome bonus!`
          : `Welcome back, ${firstName}!`;

        showToast(message, 'success');

        // Mark toast as shown for this session
        sessionStorage.setItem(toastShownKey, 'true');
      }

      // Show dashboard IMMEDIATELY - no delay on mobile
      setShowDashboard(true);
    }
  }, [isAuthenticated, user]);

  // Clear toast flag on logout
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear all toast flags when user logs out
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('toast_shown_')) {
          sessionStorage.removeItem(key);
        }
      });
      setShowDashboard(false);
    }
  }, [isAuthenticated]);

  // Fallback: Ensure dashboard shows after login (especially important for mobile)
  // This prevents the dashboard from being stuck hidden if auth state loads slowly
  useEffect(() => {
    // If user is authenticated but dashboard is not showing, force it to show IMMEDIATELY
    if (isAuthenticated && user && !showDashboard) {
      // CRITICAL: No timeout on mobile - show immediately to prevent blank page
      setShowDashboard(true);
    }
  }, [isAuthenticated, user, showDashboard]);

  // Ensure activeCategory is valid after authentication - prevent blank page
  useEffect(() => {
    if (isAuthenticated && user && !activeCategory) {
      console.log('⚠️ activeCategory is empty, resetting to chat');
      setActiveCategory('chat');
    }
  }, [isAuthenticated, user, activeCategory, setActiveCategory]);

  // URL Sync: Handle /dashboard/chat and service category routes
  // Track the last processed path to avoid re-processing the same URL
  const lastProcessedPathRef = useRef('');

  useEffect(() => {
    const currentPath = location.pathname;
    const isOnChatRoute = currentPath.startsWith('/dashboard/chat');
    const isExactChatRoute = currentPath === '/dashboard/chat' || currentPath === '/dashboard/chat/';

    // Handle service category routes - map URL paths to internal activeCategory values
    const serviceRoutes = {
      // Base dashboard - goes to chat (overview hidden)
      '/dashboard': 'chat',

      // Home (landing page style)
      '/dashboard/home': 'home',

      // Aviation & Transport
      '/dashboard/jets': 'jets',
      '/dashboard/helis': 'helicopter',
      '/dashboard/helicopter': 'helicopter',
      '/dashboard/empty-legs': 'empty-legs',
      '/dashboard/ground-transport': 'ground-transport',
      '/dashboard/adventures': 'adventures',
      '/dashboard/flights': 'flights',
      '/dashboard/luxury-cars': 'luxury-cars',
      '/dashboard/hotels': 'hotels',
      '/dashboard/services': 'services',

      // SPV Routes
      '/dashboard/spv': 'spv-formation',
      '/dashboard/spv/create': 'spv-formation',
      '/dashboard/spv/my-spvs': 'my-spvs',

      // RWA (Real World Assets) Routes
      '/dashboard/rwa': 'overview',
      '/dashboard/rwa/tokenize': 'tokenization',
      '/dashboard/rwa/assets': 'my-tokenized-assets',
      '/dashboard/tokenization': 'tokenization',
      '/dashboard/my-tokenized-assets': 'my-tokenized-assets',

      // Web3 Routes (all under /dashboard/web3/ prefix)
      '/dashboard/web3': 'overview',
      '/dashboard/web3/marketplace': 'marketplace',
      '/dashboard/web3/tokenization': 'tokenization',
      '/dashboard/web3/tokenize-asset': 'tokenize-asset',
      '/dashboard/nft-marketplace': 'nft-marketplace',
      '/dashboard/web3/nft-marketplace': 'nft-marketplace',  // Legacy route support
      '/dashboard/web3/launchpad': 'launchpad',
      '/dashboard/web3/pvcx-token': 'pvcx-token',
      '/dashboard/web3/spv-formation': 'spv-formation',
      '/dashboard/web3/my-tokenized-assets': 'my-tokenized-assets',
      '/dashboard/web3/my-spvs': 'my-spvs',

      // CO2/SAF Routes
      '/dashboard/co2-saf': 'co2-saf',
      '/dashboard/co2-certificates': 'co2-certificates',

      // Legal Pages
      '/dashboard/terms': 'terms',
      '/dashboard/privacy': 'privacy',
      '/dashboard/imprint': 'imprint',

      // Subscriptions Routes
      '/dashboard/subscriptions/plans': 'subscription-plans',
      '/dashboard/subscriptions/manage': 'subscriptions',
      '/subscriptions/plans': 'subscription-plans',
      '/subscriptions/manage': 'subscriptions',

      // User Routes
      '/dashboard/activities': 'my-activity',
      '/dashboard/requests': 'requests',
      '/dashboard/ai-requests': 'ai-requests',
      '/dashboard/bookings': 'bookings',
      '/dashboard/my-bookings': 'my-bookings',
      '/dashboard/transactions': 'transactions',
      '/dashboard/calendar': 'calendar',
      '/dashboard/favourites': 'favourites',
      '/dashboard/notifications': 'notifications',
      '/dashboard/settings': 'settings',
      '/dashboard/kyc-verification': 'kyc-verification',
      '/dashboard/referral': 'referral',
      '/dashboard/my-launches': 'my-launches',

      // Support & Messages
      '/dashboard/messages': 'support-messages',

      // Other
      '/dashboard/search-index': 'search-index',
      '/faqs': 'chat-support',
      '/dashboard/chat-history': 'chat-history',
      '/dashboard/profile': 'profile'
    };

    // Detect Web3 mode from URL and set webMode accordingly
    const isWeb3Route = currentPath.startsWith('/dashboard/web3');
    if (isWeb3Route && webMode !== 'web3') {
      setWebMode('web3');
    } else if (currentPath.startsWith('/dashboard') && !isWeb3Route && webMode === 'web3') {
      // Switch back to RWS mode if on a non-web3 dashboard route
      setWebMode('rws');
    }

    // Check if current path matches any service route
    for (const [route, category] of Object.entries(serviceRoutes)) {
      if (currentPath === route || currentPath === route + '/') {
        // Special handling for profile - it uses dashboard category with profile dashboardView
        if (category === 'profile') {
          setActiveCategoryInternal('dashboard');
          setDashboardView('profile');
        } else {
          setActiveCategory(category, true); // skipUrlUpdate=true since URL already correct
        }
        setShowDashboard(true);
        return;
      }
    }

    // Skip if we've already processed this exact path
    if (lastProcessedPathRef.current === currentPath + location.search) return;

    // Handle /dashboard/chat (new chat) or /dashboard/chat/:chatId (specific chat)
    if (isOnChatRoute) {
      lastProcessedPathRef.current = currentPath + location.search;

      // Check for query parameter on chat route
      const params = new URLSearchParams(location.search);
      const query = params.get('query') || '';
      const assistantMessage = params.get('assistantMessage') || '';
      const login = params.get('login') === 'true';

      if (isExactChatRoute) {
        // /dashboard/chat - open new chat
        // Check if login is required
        if (login && !isAuthenticated) {
          // Store query and show login modal
          pendingUrlParamsRef.current = { query, assistantMessage, tab: 'chat', newChat: true };
          setShowLoginModal(true);
          console.log('🔐 Chat route requires login, showing modal');
        } else {
          // IMPORTANT: Set query FIRST, then category to ensure AIChat receives it on first render
          // Set query if present
          if (query) {
            console.log('📝 Setting aiChatQuery from URL:', query, 'user.id:', user?.id);
            setAiChatQuery(query);
          }
          // Set assistant message if present (for "Beat the Price" flow)
          if (assistantMessage) {
            setAiAssistantMessage(decodeURIComponent(assistantMessage));
          }
          // IMPORTANT: Only set activeChat to 'new' if we don't already have an active chat
          // This prevents resetting when user is already chatting and the URL sync runs
          // Only force 'new' if there's a query param (intentional new chat with prefilled message)
          // Use activeChatRef.current to get current value without adding to effect dependencies
          const currentActiveChat = activeChatRef.current;
          if (!currentActiveChat || currentActiveChat === 'new' || query || assistantMessage) {
            setActiveChat('new');
          }
          // Use setTimeout to ensure query state is set before switching category
          // This prevents AIChat from rendering with empty initialQuery
          setTimeout(() => {
            setActiveCategory('chat', true); // skipUrlUpdate=true since URL already correct
            console.log('🔗 Opening new chat from URL: /dashboard/chat', query ? `with query: ${query}` : '', assistantMessage ? 'with assistant message' : '');
          }, 0);
        }
        // Clean up URL params but keep the path
        // Delay cleanup to allow state to propagate before URL changes
        // The query will be fully cleared when AIChat calls onQueryProcessed
        if (query || assistantMessage || login) {
          setTimeout(() => {
            window.history.replaceState({}, '', '/dashboard/chat');
            lastProcessedPathRef.current = '/dashboard/chat'; // Update to cleaned path
          }, 100);
        }
      } else if (urlChatId) {
        // /dashboard/chat/:chatId - open specific chat
        const targetChatId = urlChatId === 'new' ? 'new' : urlChatId;
        setActiveChat(targetChatId);
        setActiveCategory('chat', true); // skipUrlUpdate=true since URL already correct
        console.log('🔗 Opening chat from URL:', urlChatId);
      }
    }
  }, [location.pathname, location.search, isAuthenticated, urlChatId]); // Re-run when URL or auth changes

  // When leaving chat view, redirect to dashboard (but don't sync activeChat to URL)
  // Only redirect if we're LEAVING chat (not arriving at chat route)
  const previousCategoryRef = useRef(activeCategory);

  useEffect(() => {
    const currentPath = location.pathname;
    const isOnChatRoute = currentPath.startsWith('/dashboard/chat');
    const wasInChat = previousCategoryRef.current === 'chat';

    // Only redirect if we were IN chat and are now leaving it
    // Don't redirect if we're arriving at a chat route (activeCategory will be updated by URL sync)
    if (wasInChat && activeCategory !== 'chat' && isOnChatRoute) {
      window.history.replaceState({}, '', '/dashboard');
    }

    previousCategoryRef.current = activeCategory;
  }, [activeCategory, navigate, location.pathname]);

  // Close mobile category menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMobileCategoryMenu && !event.target.closest('.mobile-category-menu-container')) {
        setShowMobileCategoryMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMobileCategoryMenu]);

  // Listen for navigation events from DashboardOverviewNew search
  useEffect(() => {
    const handleNavigate = (event) => {
      const { category } = event.detail;
      if (category) {
        setActiveCategory(category);
      }
    };

    window.addEventListener('navigate-to-category', handleNavigate);
    return () => window.removeEventListener('navigate-to-category', handleNavigate);
  }, []);

  // Close profile dropdown when clicking outside
  // Initialize blog sync on mount
  useEffect(() => {
    const initBlogSync = async () => {
      try {
        const { setupBlogSync } = await import('../../services/blogService');
        await setupBlogSync(60); // Sync every 60 minutes
        console.log('✅ Blog sync activated');
      } catch (error) {
        console.error('Error initializing blog sync:', error);
      }
    };

    initBlogSync();
  }, []);

  // Initialize notification processor for calendar reminders
  useEffect(() => {
    let processorInterval;

    const initNotificationProcessor = async () => {
      try {
        const { startNotificationProcessor } = await import('../../services/notificationProcessor');
        processorInterval = startNotificationProcessor();
        console.log('✅ Notification processor activated');
      } catch (error) {
        console.error('Error initializing notification processor:', error);
      }
    };

    initNotificationProcessor();

    // Cleanup on unmount
    return () => {
      if (processorInterval) {
        clearInterval(processorInterval);
      }
    };
  }, []);

  // Fetch user's KYC status with timeout to prevent login hang
  useEffect(() => {
    const fetchKycStatus = async () => {
      if (!user?.id) return;

      try {
        // Add timeout to prevent hanging login
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('KYC query timeout')), 3000)
        );

        const queryPromise = supabase
          .from('kyc_applications')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

        if (!error && data) {
          setKycStatus(data.status || 'not_started');
        } else {
          setKycStatus('not_started');
        }
      } catch (error) {
        console.error('Error fetching KYC status (non-blocking):', error);
        setKycStatus('not_started'); // Fail gracefully, don't block login
      }
    };

    // Don't await - run in background to avoid blocking login
    fetchKycStatus();
  }, [user?.id]);

  // Handle clicks outside settings dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSettings) {
        const settingsDropdown = event.target.closest('.settings-dropdown');
        const settingsButton = event.target.closest('.settings-button');
        if (!settingsDropdown && !settingsButton) {
          setShowSettings(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  // Listen for navigation events from child components
  useEffect(() => {
    const handleNavigateToCategory = (event) => {
      if (event.detail && event.detail.category) {
        setActiveCategory(event.detail.category);
      }
    };

    window.addEventListener('navigate-to-category', handleNavigateToCategory);
    return () => {
      window.removeEventListener('navigate-to-category', handleNavigateToCategory);
    };
  }, []);

  // Fetch weather based on user's IP
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Get user's location from IP
        const ipResponse = await fetch('https://ipapi.co/json/');
        const ipData = await ipResponse.json();
        const { city, latitude, longitude } = ipData;

        // Fetch weather using OpenWeatherMap API
        const apiKey = '82005d27a116c2880c8f0fcb866998a0'; // Free tier API key
        const weatherResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`
        );
        const weatherData = await weatherResponse.json();

        // Map weather condition to emoji
        const getWeatherEmoji = (condition) => {
          const id = condition;
          if (id >= 200 && id < 300) return '⛈️'; // Thunderstorm
          if (id >= 300 && id < 400) return '🌦️'; // Drizzle
          if (id >= 500 && id < 600) return '🌧️'; // Rain
          if (id >= 600 && id < 700) return '❄️'; // Snow
          if (id >= 700 && id < 800) return '🌫️'; // Atmosphere (fog, etc)
          if (id === 800) return '☀️'; // Clear
          if (id > 800) return '☁️'; // Clouds
          return '🌤️';
        };

        setWeatherData({
          city: city || weatherData.name,
          temp: Math.round(weatherData.main.temp),
          condition: getWeatherEmoji(weatherData.weather[0].id),
          description: weatherData.weather[0].main,
          high: Math.round(weatherData.main.temp_max),
          low: Math.round(weatherData.main.temp_min)
        });
      } catch (error) {
        console.error('Error fetching weather:', error);
        // Keep default values if fetch fails
      }
    };

    fetchWeather();
  }, []);

  // Fetch blog posts and rotate every 60 seconds
  // Fetches multiple posts and cycles through them
  useEffect(() => {
    const BLOG_CACHE_KEY = `blog_posts_cache_${webMode}`;
    const BLOG_VERSION_KEY = 'blog_cache_version';
    const CURRENT_VERSION = '3'; // Increment this to force cache clear
    const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache for posts list

    // Clear old cache if version changed
    const cachedVersion = localStorage.getItem(BLOG_VERSION_KEY);
    if (cachedVersion !== CURRENT_VERSION) {
      console.log('📰 Clearing old blog cache (version update)');
      localStorage.removeItem('blog_posts_cache_rws');
      localStorage.removeItem('blog_posts_cache_web3');
      localStorage.removeItem('blog_post_cache_rws');
      localStorage.removeItem('blog_post_cache_web3');
      localStorage.setItem(BLOG_VERSION_KEY, CURRENT_VERSION);
    }

    const fetchBlogPosts = async (forceRefresh = false) => {
      try {
        // Check cache first
        if (!forceRefresh) {
          const cached = localStorage.getItem(BLOG_CACHE_KEY);
          if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            const isValid = Date.now() - timestamp < CACHE_DURATION;
            if (isValid && data && data.length > 0) {
              console.log(`📰 Using cached blog posts for ${webMode} (${data.length} posts)`);
              setBlogPosts(data);
              setLatestBlogPost(data[0]);
              setBlogLoading(false);
              return;
            }
          }
        }

        setBlogLoading(true);
        console.log('📰 Fetching blog posts for', webMode);

        // Aviation category ID: 137, Web3 category ID: 131
        // Fetch 10 posts for rotation
        const categoryId = webMode === 'web3' ? '131' : '137';
        const response = await fetch(
          `https://www.privatecharterx.blog/wp-json/wp/v2/posts?_embed&per_page=10&orderby=date&order=desc&categories=${categoryId}&_=${Date.now()}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            cache: 'no-store',
          }
        );

        if (response.ok) {
          const posts = await response.json();
          if (posts && posts.length > 0) {
            const formattedPosts = posts.map(post => ({
              title: post.title.rendered.replace(/<[^>]*>/g, ''),
              link: `https://www.privatecharterx.blog/${post.slug}`,
              date: post.date,
              excerpt: post.excerpt?.rendered?.replace(/<[^>]*>/g, '').substring(0, 100) || '',
              featuredImage: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
            }));

            // Cache the results
            localStorage.setItem(BLOG_CACHE_KEY, JSON.stringify({
              data: formattedPosts,
              timestamp: Date.now(),
            }));

            setBlogPosts(formattedPosts);
            setLatestBlogPost(formattedPosts[0]);
            setCurrentBlogIndex(0);
            console.log(`✅ Fetched ${formattedPosts.length} blog posts for rotation`);
          }
        } else {
          console.log('❌ Blog fetch failed:', response.status);
        }
      } catch (error) {
        console.log('Failed to fetch blog posts:', error);
        // Try to use stale cache if fetch fails
        const cached = localStorage.getItem(BLOG_CACHE_KEY);
        if (cached) {
          const { data } = JSON.parse(cached);
          if (data && data.length > 0) {
            setBlogPosts(data);
            setLatestBlogPost(data[0]);
          }
        }
      } finally {
        setBlogLoading(false);
      }
    };

    fetchBlogPosts();

    // Refresh posts list every hour
    const refreshInterval = setInterval(() => {
      fetchBlogPosts(true);
    }, 60 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [webMode]);

  // Rotate through blog posts every 60 seconds
  useEffect(() => {
    if (blogPosts.length <= 1) return;

    const rotationInterval = setInterval(() => {
      setCurrentBlogIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % blogPosts.length;
        setLatestBlogPost(blogPosts[nextIndex]);
        console.log(`📰 Rotating to blog post ${nextIndex + 1}/${blogPosts.length}: ${blogPosts[nextIndex]?.title?.substring(0, 30)}...`);
        return nextIndex;
      });
    }, 60 * 1000); // Rotate every 60 seconds

    return () => clearInterval(rotationInterval);
  }, [blogPosts]);

  // Fetch Ethereum price and history from CoinGecko API
  useEffect(() => {
    const CACHE_KEY = 'eth_price_cache';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

    const fetchEthPrice = async () => {
      try {
        // Check cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const now = Date.now();
          if (now - timestamp < CACHE_DURATION) {
            // Use cached data if less than 5 minutes old
            setEthPrice(data.price);
            setEthHistory(data.history);
            setEthLoading(false);
            return;
          }
        }

        setEthLoading(true);

        // Fetch current price and 24h change
        const priceResponse = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true',
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'x-cg-demo-api-key': 'CG-Nz2RvZSfPKs9ocneTafuswhJ',
            },
          }
        );

        let priceData = null;
        let historyData = [];

        if (priceResponse.ok) {
          const result = await priceResponse.json();
          if (result && result.ethereum) {
            priceData = {
              price: result.ethereum.usd.toFixed(2),
              changePercent: result.ethereum.usd_24h_change.toFixed(2),
            };
            setEthPrice(priceData);
          }
        }

        // Fetch 24h chart data (last 1 day with hourly data)
        const chartResponse = await fetch(
          'https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=1',
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'x-cg-demo-api-key': 'CG-Nz2RvZSfPKs9ocneTafuswhJ',
            },
          }
        );

        if (chartResponse.ok) {
          const chartResult = await chartResponse.json();
          if (chartResult && chartResult.prices) {
            // Extract prices from the chart data [timestamp, price]
            historyData = chartResult.prices.map(item => item[1]);
            setEthHistory(historyData);
          }
        }

        // Cache the data
        if (priceData && historyData.length > 0) {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: { price: priceData, history: historyData },
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.log('Failed to fetch ETH data:', error);
      } finally {
        setEthLoading(false);
      }
    };

    fetchEthPrice();
    // Refresh every 5 minutes instead of 60 seconds to avoid rate limits
    const interval = setInterval(fetchEthPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch ongoing booking on mount and when user changes
  useEffect(() => {
    fetchOngoingBooking();
    fetchPVCXBalance();
  }, [user]);

  // Real-time subscription for PVCX balance updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('pvcx-balance-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pvcx_balance',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🪙 PVCX balance updated (dashboard):', payload);
          if (payload.new) {
            setPvcxBalance(parseFloat(payload.new.balance) || 0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Countdown timer for ongoing booking
  useEffect(() => {
    if (!ongoingBooking) {
      setBookingCountdown('00:00');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      let pickupTime;

      // Handle different booking types
      if (ongoingBooking.type === 'taxi_concierge') {
        // For taxi bookings
        const bookingData = ongoingBooking.data || {};
        if (bookingData.bookNow) {
          setBookingCountdown('Now');
          return;
        }

        // Combine pickup date and time
        const pickupDateStr = bookingData.pickupDate;
        const pickupTimeStr = bookingData.pickupTime;

        if (!pickupDateStr || !pickupTimeStr) {
          setBookingCountdown('TBA');
          return;
        }

        pickupTime = new Date(`${pickupDateStr}T${pickupTimeStr}`);
      } else if (ongoingBooking.type === 'empty_leg_booking') {
        // For empty leg bookings
        const departureDate = ongoingBooking.data?.departureDate || ongoingBooking.data?.departure_date;
        if (!departureDate) {
          setBookingCountdown('TBA');
          return;
        }
        pickupTime = new Date(departureDate);
      } else {
        setBookingCountdown('TBA');
        return;
      }

      const diff = pickupTime - now;

      if (diff <= 0) {
        setBookingCountdown('Starting');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setBookingCountdown(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    };

    updateCountdown(); // Update immediately
    const interval = setInterval(updateCountdown, 1000); // Update every second

    return () => clearInterval(interval);
  }, [ongoingBooking]);

  // Subscription success state (for subpage)
  const [successSubscriptionTier, setSuccessSubscriptionTier] = useState('');
  const [subscriptionPdfSent, setSubscriptionPdfSent] = useState(false);
  const [subscriptionPdfGenerating, setSubscriptionPdfGenerating] = useState(false);

  // Check for dashboard tab from user menu navigation
  useEffect(() => {
    const dashboardTab = sessionStorage.getItem('dashboardTab');
    if (dashboardTab) {
      setActiveCategory('dashboard');
      setDashboardView(dashboardTab);
      sessionStorage.removeItem('dashboardTab'); // Clear after using
    }
  }, []);

  // Check for subscription success from Stripe redirect
  // Supports both formats:
  // - New format: /dashboard?subscription=starter&success=true
  // - Legacy format: /dashboard?subscription=success&tier=starter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subscriptionParam = params.get('subscription');
    const successParam = params.get('success');
    const tierParam = params.get('tier');

    // New format: subscription=tier&success=true
    if (successParam === 'true' && subscriptionParam && subscriptionParam !== 'success' && subscriptionParam !== 'cancelled') {
      // Store the tier for the success page
      setSuccessSubscriptionTier(subscriptionParam);

      // Navigate to subscription success subpage
      setActiveCategory('subscription-success');

      // Clean up URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
    // Legacy format: subscription=success&tier=X
    else if (subscriptionParam === 'success') {
      setSuccessSubscriptionTier(tierParam || 'starter');
      setActiveCategory('subscription-success');
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    } else if (subscriptionParam === 'cancelled') {
      // Show cancelled notification
      showToast('info', 'Subscription checkout was cancelled. You can try again anytime.');

      // Navigate to plans page
      setActiveCategory('subscription-plans');

      // Clean up URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  // Generate and send subscription PDF when success page is shown
  useEffect(() => {
    const generateAndSendSubscriptionPdf = async () => {
      if (!successSubscriptionTier || !user?.id || subscriptionPdfSent || subscriptionPdfGenerating) return;

      setSubscriptionPdfGenerating(true);

      try {
        // Get plan details
        const planDetails = {
          starter: { name: 'Starter', price: 20, features: ['5 AI Conversations/month', '50 messages per conversation', 'Break the Price feature', 'Email Support'] },
          pro: { name: 'Professional', price: 40, features: ['20 AI Conversations/month', '100 messages per conversation', 'Break the Price feature', 'Priority Support', 'Dedicated Manager'] },
          elite: { name: 'Elite', price: 130, features: ['Unlimited AI Conversations', 'Unlimited messages per chat', 'Unlimited Break the Price', '24/7 Concierge Service'] }
        };

        const plan = planDetails[successSubscriptionTier] || planDetails.starter;

        // Create subscription data
        const subscriptionData = {
          id: `SUB-${Date.now()}`,
          tier: successSubscriptionTier,
          plan_name: plan.name,
          price: plan.price,
          currency: 'USD',
          billing_period: 'monthly',
          status: 'active',
          start_date: new Date().toISOString(),
          features: plan.features,
          user: {
            name: user?.name || user?.first_name || user?.email?.split('@')[0] || 'Valued Member',
            email: user?.email
          },
          payment_method: 'card' // Stripe payments are always card
        };

        // Generate PDF
        const pdfBlob = generateSubscriptionConfirmationPDF(subscriptionData);
        const filename = `PrivateCharterX_Subscription_${subscriptionData.tier.toUpperCase()}_${new Date().toISOString().split('T')[0]}.pdf`;

        // Auto-download PDF
        downloadPDF(pdfBlob, filename);

        // Send PDF via email using edge function
        if (user?.email) {
          try {
            // Convert blob to base64
            const reader = new FileReader();
            reader.readAsDataURL(pdfBlob);
            reader.onloadend = async () => {
              const base64data = reader.result.split(',')[1];

              await supabase.functions.invoke('send-subscription-email', {
                body: {
                  to: user.email,
                  subject: `Welcome to PrivateCharterX ${plan.name} - Subscription Confirmation`,
                  subscriptionData,
                  pdfBase64: base64data,
                  pdfFilename: filename
                }
              });

              console.log('📧 Subscription confirmation email sent');
            };
          } catch (emailError) {
            console.error('Failed to send subscription email:', emailError);
          }
        }

        setSubscriptionPdfSent(true);
        showToast('success', 'Subscription confirmation PDF downloaded');
      } catch (error) {
        console.error('Error generating subscription PDF:', error);
      } finally {
        setSubscriptionPdfGenerating(false);
      }
    };

    if (activeCategory === 'subscription-success' && successSubscriptionTier && user?.id) {
      generateAndSendSubscriptionPdf();
    }
  }, [activeCategory, successSubscriptionTier, user?.id, subscriptionPdfSent, subscriptionPdfGenerating]);

  // Process URL parameters using React Router's location (updates on navigation)
  // NOTE: /dashboard/chat routes are handled by the URL Sync Effect above
  useEffect(() => {
    // Wait for auth to initialize
    if (initializing) return;

    // Skip if on /dashboard/chat route - that's handled by URL Sync Effect
    if (location.pathname.startsWith('/dashboard/chat')) {
      console.log('🔎 URL Params Effect: Skipping - /dashboard/chat handled by URL Sync Effect');
      return;
    }

    const params = new URLSearchParams(location.search);
    const query = params.get('query') || '';
    const tab = params.get('tab') || '';
    const login = params.get('login') === 'true';
    const assistantMessage = params.get('assistantMessage') || '';
    const newChat = params.get('newChat') === 'true';
    // Departure/destination for private-jet booking
    const departureCode = params.get('departure') || '';
    const departureName = params.get('departureName') || '';
    const destinationCode = params.get('destination') || '';
    const destinationName = params.get('destinationName') || '';

    console.log('🔎 URL Params Effect:', {
      pathname: location.pathname,
      search: location.search,
      query,
      tab,
      isAuthenticated,
      initializing
    });

    // If there's a tab or query in the URL
    if (tab || query || assistantMessage || newChat) {
      let targetTab = tab || 'ai-chat'; // Default to ai-chat if there's a query
      const tabNeedsAuth = ['ai-chat', 'concierge', 'spv', 'tokenize', 'pvcx', 'escrow', 'profile', 'charter', 'private-jet'].includes(targetTab);

      // Map 'ai-chat' URL param to 'chat' internal category
      if (targetTab === 'ai-chat') {
        targetTab = 'chat';
      }

      if (isAuthenticated) {
        // User is authenticated - navigate directly
        console.log('🔗 Processing URL params - tab:', targetTab, 'query:', query, 'assistantMessage:', assistantMessage, 'newChat:', newChat);

        if (query) {
          setAiChatQuery(query);
        }
        if (assistantMessage) {
          setAiAssistantMessage(assistantMessage);
        }
        // If newChat=true and navigating to chat, set activeChat to 'new'
        if (newChat && targetTab === 'chat') {
          setActiveChat('new');
        }
        // Store initial flight data for private-jet booking
        if (targetTab === 'private-jet' && departureCode && destinationCode) {
          setInitialFlightData({
            departure: { code: departureCode, name: departureName },
            destination: { code: destinationCode, name: destinationName }
          });
        }
        // Special handling for profile - uses dashboard + dashboardView
        if (targetTab === 'profile') {
          setActiveCategoryInternal('dashboard');
          setDashboardView('profile');
          window.history.replaceState({}, '', '/dashboard/profile');
        } else {
          setActiveCategory(targetTab); // This will also update the URL
        }
        setShowDashboard(true);
        // URL is now updated by setActiveCategory, no need to navigate
      } else if (tabNeedsAuth && login) {
        // Tab needs auth and login=true was passed - store params and show login modal
        console.log('🔐 Showing login modal for protected tab:', targetTab);
        pendingUrlParamsRef.current = { query, tab: targetTab, assistantMessage, newChat, departureCode, departureName, destinationCode, destinationName };
        setShowLoginModal(true);

        // Clean up URL query params only
        navigate(location.pathname, { replace: true });
      } else if (!tabNeedsAuth) {
        // Tab doesn't need auth - navigate directly
        console.log('📍 Navigating to public tab:', targetTab);
        setActiveCategory(targetTab); // This will also update the URL
        setShowDashboard(true);
        // URL is now updated by setActiveCategory, no need to navigate
      }
    }
  }, [location.search, isAuthenticated, initializing, navigate]);

  // After successful login, process any pending URL params
  useEffect(() => {
    if (!initializing && isAuthenticated && pendingUrlParamsRef.current) {
      let { query, tab, assistantMessage, newChat, departureCode, departureName, destinationCode, destinationName } = pendingUrlParamsRef.current;
      console.log('✅ Post-login: Processing pending params - tab:', tab, 'query:', query, 'assistantMessage:', assistantMessage, 'newChat:', newChat, 'user.id:', user?.id);

      if (query) {
        setAiChatQuery(query);
      }
      if (assistantMessage) {
        setAiAssistantMessage(assistantMessage);
      }
      // Store initial flight data for private-jet booking
      if (tab === 'private-jet' && departureCode && destinationCode) {
        setInitialFlightData({
          departure: { code: departureCode, name: departureName },
          destination: { code: destinationCode, name: destinationName }
        });
      }
      // Map 'ai-chat' URL param to 'chat' internal category
      const targetTab = (tab === 'ai-chat' || !tab) ? 'chat' : tab;
      // If newChat=true and navigating to chat, set activeChat to 'new'
      if (newChat && targetTab === 'chat') {
        setActiveChat('new');
      }
      // Special handling for profile - uses dashboard + dashboardView
      if (targetTab === 'profile') {
        setActiveCategoryInternal('dashboard');
        setDashboardView('profile');
        window.history.replaceState({}, '', '/dashboard/profile');
        setShowDashboard(true);
        pendingUrlParamsRef.current = null;
      }
      // Use setTimeout to ensure query state is set before switching category
      // This prevents AIChat from rendering with empty initialQuery
      else if (query && targetTab === 'chat') {
        setTimeout(() => {
          setActiveCategory(targetTab);
          setShowDashboard(true);
          pendingUrlParamsRef.current = null; // Clear after processing
        }, 0);
      } else {
        setActiveCategory(targetTab);
        setShowDashboard(true);
        pendingUrlParamsRef.current = null; // Clear after processing
      }
    }
  }, [isAuthenticated, initializing]);

  // Check for admin route (/admin or /crm-admin)
  useEffect(() => {
    const checkAdminRoute = () => {
      const path = window.location.pathname;

      // Admin path: /admin or /crm-admin
      const isAdminRoute = path === '/admin' || path === '/crm-admin' || path.startsWith('/admin/');

      if (isAdminRoute) {
        // Check if already authenticated via simple admin auth (session storage)
        const adminAuth = sessionStorage.getItem('pvcx_admin_authenticated');
        if (adminAuth === 'true') {
          setIsSimpleAdminAuth(true);
          setActiveCategory('admin-dashboard');
        } else {
          // Show admin login modal
          setShowAdminLoginModal(true);
        }
      }
    };

    // Small delay to ensure component is mounted
    const timeoutId = setTimeout(checkAdminRoute, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Load NFTs and CO2 certificates when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      loadWeb3Data();
    }
  }, [isConnected, address]);

  const loadWeb3Data = async () => {
    if (!address) return;

    setIsLoadingWeb3(true);
    try {
      const [nfts, co2Certs] = await Promise.all([
        web3Service.getUserNFTs(address),
        web3Service.getUserCO2Certificates(address)
      ]);
      setUserNFTs(nfts);
      setUserCO2Certificates(co2Certs);
    } catch (error) {
      console.error('Error loading Web3 data:', error);
    } finally {
      setIsLoadingWeb3(false);
    }
  };

  // Fetch all user requests
  const fetchUserRequests = async () => {
    if (!user?.id) return;

    setLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from('user_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100); // Increased limit to show more requests

      if (error) throw error;
      setUserRequests(data || []);
    } catch (error) {
      console.error('Error fetching user requests:', error);
      setUserRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch user bookings from user_bookings table (empty legs, adventures, CO2 certificates)
  const fetchUserBookings = async () => {
    if (!user?.id) return;

    setLoadingBookings(true);
    try {
      const { data, error } = await supabase
        .from('user_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setUserBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Fetch user's DAOs (created and joined)
  const fetchUserDaos = async () => {
    if (!user?.id || !address) return;

    setLoadingDaos(true);
    try {
      const { data, error } = await supabase
        .from('daos')
        .select('*')
        .or(`creator_address.eq.${address},members.cs.{${address}}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserDaos(data || []);
    } catch (error) {
      console.error('Error fetching DAOs:', error);
      setUserDaos([]);
    } finally {
      setLoadingDaos(false);
    }
  };

  // Fetch user's SPV formations
  const fetchUserSPVs = async () => {
    if (!user?.id) return;

    setLoadingSPVs(true);
    try {
      const { data, error } = await supabase
        .from('user_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'spv_formation')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserSPVs(data || []);
    } catch (error) {
      console.error('Error fetching SPVs:', error);
      setUserSPVs([]);
    } finally {
      setLoadingSPVs(false);
    }
  };

  // Fetch wallet signatures from NFT verified requests
  const fetchWalletSignatures = async () => {
    if (!user?.id) return;

    setLoadingSignatures(true);
    try {
      // Fetch all requests with NFT flag, then filter for signatures client-side
      const { data, error } = await supabase
        .from('user_requests')
        .select('id, created_at, type, status, data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Extract signature data from requests that have NFT signatures
        const signatures = data
          .filter(req => req.data?.nft_signature && req.data?.has_nft)
          .map(req => ({
            id: req.id,
            request_id: req.id,
            request_type: req.type,
            request_status: req.status,
            wallet_address: req.data.nft_signature.wallet_address,
            signature: req.data.nft_signature.signature,
            message: req.data.nft_signature.message,
            signed_at: req.data.nft_signature.signed_at,
            verified: req.data.nft_signature.verified,
            request_total: req.data.total,
            created_at: req.created_at
          }));

        setWalletSignatures(signatures);
        console.log('✅ Loaded wallet signatures:', signatures.length);
      }
    } catch (error) {
      console.error('Error fetching wallet signatures:', error);
    } finally {
      setLoadingSignatures(false);
    }
  };

  // Fetch user's tokenization requests
  const fetchUserTokenizations = async () => {
    if (!user?.id) return;

    setLoadingTokenizations(true);
    try {
      const { data, error } = await supabase
        .from('tokenization_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserTokenizations(data || []);
    } catch (error) {
      console.error('Error fetching tokenizations:', error);
      setUserTokenizations([]);
    } finally {
      setLoadingTokenizations(false);
    }
  };

  // Fetch ongoing booking (Taxi/Concierge or Empty Leg)
  const fetchOngoingBooking = async () => {
    setLoadingBooking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingBooking(false);
        return;
      }

      console.log('🚕 Fetching ongoing bookings for user:', user.id);

      // Fetch upcoming taxi/concierge bookings or empty leg bookings
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('user_requests')
        .select('*')
        .eq('user_id', user.id)
        .in('type', ['taxi_concierge', 'empty_leg_booking'])
        .in('status', ['pending', 'confirmed', 'in_progress'])
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching ongoing booking:', error);
        setOngoingBooking(null);
      } else if (data && data.length > 0) {
        console.log('✅ Found ongoing booking:', data[0]);
        setOngoingBooking(data[0]);
      } else {
        console.log('ℹ️ No ongoing bookings found');
        setOngoingBooking(null);
      }
    } catch (error) {
      console.error('❌ Error fetching ongoing booking:', error);
      setOngoingBooking(null);
    } finally {
      setLoadingBooking(false);
    }
  };

  // Fetch PVCX balance
  const fetchPVCXBalance = async () => {
    setLoadingPvcxBalance(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingPvcxBalance(false);
        return;
      }

      const { data, error } = await supabase
        .from('pvcx_balance')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching PVCX balance:', error);
        setPvcxBalance(0);
      } else if (data) {
        setPvcxBalance(parseFloat(data.balance) || 0);
      } else {
        // No balance record yet
        setPvcxBalance(0);
      }
    } catch (error) {
      console.error('Error fetching PVCX balance:', error);
      setPvcxBalance(0);
    } finally {
      setLoadingPvcxBalance(false);
    }
  };

  // Fetch empty legs for rotating display
  const fetchEmptyLegs = async () => {
    setLoadingEmptyLegs(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('EmptyLegs_')
        .select('*')
        .gte('departure_date', today)
        .order('departure_date', { ascending: true })
        .limit(10); // Get 10 empty legs to rotate through

      if (error) {
        console.error('Supabase error fetching empty legs:', error);
        throw error;
      }

      console.log('Empty legs fetched:', data?.length || 0, 'offers');

      if (data && data.length > 0) {
        setEmptyLegs(data);
      } else {
        // If no future empty legs, try fetching any empty legs (for demo purposes)
        console.log('No future empty legs found, fetching all available...');
        const { data: allData, error: allError } = await supabase
          .from('EmptyLegs_')
          .select('*')
          .order('departure_date', { ascending: false })
          .limit(10);

        if (allError) {
          console.error('Error fetching all empty legs:', allError);
        } else {
          console.log('All empty legs fetched:', allData?.length || 0);
          setEmptyLegs(allData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching empty legs:', error);
      setEmptyLegs([]);
    } finally {
      setLoadingEmptyLegs(false);
    }
  };

  // Fetch marketplace tokenized assets for Web3 overview display
  const fetchTokenizedAssets = async () => {
    setLoadingAssets(true);
    try {
      // Fetch approved marketplace assets (not user's personal assets)
      const { data, error } = await supabase
        .from('user_requests')
        .select('*')
        .eq('type', 'tokenization')
        .in('status', ['approved_for_sto', 'live_on_marketplace'])
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      if (data && data.length > 0) {
        const assets = data.map(asset => ({
          id: asset.id,
          name: asset.data?.asset_name || asset.service_type || 'Asset',
          type: asset.data?.asset_type || 'Investment Asset',
          value: asset.estimated_cost || asset.data?.total_value || 0,
          change24h: (Math.random() * 20 - 10).toFixed(2), // Mock data for 24h change
          tokens: asset.data?.sold_tokens || 0,
          totalTokens: asset.data?.total_supply || 100,
          icon: asset.data?.asset_type?.toLowerCase().includes('jet') || asset.service_type?.includes('Jet') ? '✈️' :
                asset.data?.asset_type?.toLowerCase().includes('yacht') || asset.service_type?.includes('Yacht') ? '⛵' :
                asset.data?.asset_type?.toLowerCase().includes('real estate') || asset.service_type?.includes('Real Estate') ? '🏠' :
                asset.data?.asset_type?.toLowerCase().includes('art') || asset.service_type?.includes('Art') ? '🎨' :
                asset.data?.asset_type?.toLowerCase().includes('car') ? '🚗' : '💎'
        }));
        setTokenizedAssets(assets);
      } else {
        setTokenizedAssets([]);
      }
    } catch (error) {
      console.error('Error fetching marketplace assets:', error);
      setTokenizedAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  };

  // Load SPVs when viewing My SPVs page or on Web3 overview
  useEffect(() => {
    if ((activeCategory === 'my-spvs' || (activeCategory === 'overview' && webMode === 'web3')) && user?.id) {
      fetchUserSPVs();
    }
  }, [activeCategory, webMode, user?.id]);

  // Load Wallet Signatures (NFT verifications) on Web3 overview
  useEffect(() => {
    if ((activeCategory === 'overview' && webMode === 'web3') && user?.id) {
      fetchWalletSignatures();
    }
  }, [activeCategory, webMode, user?.id]);

  // Load tokenizations when viewing My Tokenized Assets page
  useEffect(() => {
    if (activeCategory === 'my-tokenized-assets' && user?.id) {
      fetchUserTokenizations();
    }
  }, [activeCategory, user?.id]);

  // Fetch chat history from database
  const fetchChatHistory = async (isUserChange = false) => {
    if (!user?.id) return;

    try {
      const result = await chatService.loadUserChats(user.id);
      if (result.success && result.chats) {
        // Transform database format to component format
        const formattedChats = result.chats.map(chat => ({
          id: chat.id,
          title: chat.title || 'New Conversation',
          date: new Date(chat.updated_at || chat.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          messages: chat.messages || [],
          created_at: chat.created_at,
          updated_at: chat.updated_at
        }));

        // If user changed, completely replace chat history (don't preserve old user's chats)
        if (isUserChange) {
          console.log('🔄 User changed, replacing chat history with new user data');
          setChatHistory(formattedChats);
        } else {
          // Merge with existing chats to preserve any newly created chats not yet in DB
          setChatHistory(prev => {
            // Get IDs of chats from database
            const dbChatIds = new Set(formattedChats.map(c => c.id));
            // Keep any local chats that aren't in the database yet (newly created)
            const localOnlyChats = prev.filter(c => !dbChatIds.has(c.id));
            // Combine: local-only chats first (most recent), then DB chats
            return [...localOnlyChats, ...formattedChats];
          });
        }
      } else if (isUserChange) {
        // User changed but no chats found - clear history
        console.log('🔄 User changed, clearing chat history (no chats found)');
        setChatHistory([]);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      if (isUserChange) {
        // On error with user change, clear history to prevent showing wrong user's chats
        setChatHistory([]);
      }
    }
  };

  // Load chat history on initial load and when user changes
  // Clear old user's chats when user changes to prevent data leakage
  useEffect(() => {
    const currentUserId = user?.id;
    const previousUserId = previousUserIdRef.current;

    // Detect user change (including logout -> login with different account)
    const isUserChange = previousUserId !== null && previousUserId !== currentUserId;

    if (isUserChange) {
      console.log('👤 User changed from', previousUserId, 'to', currentUserId);
      // Clear chat history immediately when user changes
      setChatHistory([]);
      setActiveChat('new'); // Reset to 'new', not null
    }

    // Update the ref
    previousUserIdRef.current = currentUserId;

    // Fetch new user's chats
    if (currentUserId) {
      fetchChatHistory(isUserChange);
    } else {
      // User logged out - clear everything
      setChatHistory([]);
      setActiveChat('new'); // Reset to 'new', not null
    }
  }, [user?.id]);

  // Load user requests for overview page and AI requests page
  useEffect(() => {
    if ((activeCategory === 'overview' || activeCategory === 'ai-requests' || activeCategory === 'requests') && user?.id) {
      fetchUserRequests();
    }
  }, [activeCategory, user?.id]);

  // Load subscription data when viewing subscriptions page
  useEffect(() => {
    if ((activeCategory === 'subscriptions' || activeCategory === 'overview') && user?.id) {
      fetchSubscriptionData();
    }
  }, [activeCategory, user?.id]);

  // Fetch subscription data
  const fetchSubscriptionData = async () => {
    if (!user?.id) return;
    try {
      const profile = await subscriptionService.getUserProfile(user.id);
      const stats = await subscriptionService.getChatStats(user.id);
      setSubscriptionTier(profile?.subscription_tier || null);
      setSubscriptionData({
        chatsUsed: stats?.chatsUsed || 0,
        chatsLimit: stats?.chatsLimit,
        chatsRemaining: stats?.chatsRemaining,
        unlimited: stats?.unlimited || false,
        chatsResetDate: profile?.chats_reset_date,
        currentPeriodEnd: profile?.current_period_end,
        status: profile?.subscription_status || 'active'
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      // Set defaults on error
      setSubscriptionTier('explorer');
      setSubscriptionData({
        chatsUsed: 0,
        chatsLimit: 2,
        chatsRemaining: 2,
        unlimited: false
      });
    }
  };


  // Load user bookings for overview page
  useEffect(() => {
    if (activeCategory === 'overview' && user?.id) {
      fetchUserBookings();
    }
  }, [activeCategory, user?.id]);

  // Load user DAOs for Web3 overview page
  useEffect(() => {
    if (activeCategory === 'overview' && webMode === 'web3' && user?.id && address) {
      fetchUserDaos();
    }
  }, [activeCategory, webMode, user?.id, address]);

  // Fetch marketplace tokenized assets on mount (for Web3 overview display)
  useEffect(() => {
    fetchTokenizedAssets();
  }, []);

  // Fetch user tokenizations when in web3 mode (for home page display)
  useEffect(() => {
    if (webMode === 'web3' && user?.id) {
      fetchUserTokenizations();
    }
  }, [webMode, user?.id]);

  // Fetch empty legs on mount and set up rotation
  useEffect(() => {
    fetchEmptyLegs();

    // Rotate empty legs every 5 minutes (300000ms)
    const rotationInterval = setInterval(() => {
      setCurrentEmptyLegIndex((prevIndex) => {
        if (emptyLegs.length === 0) return 0;
        return (prevIndex + 1) % emptyLegs.length;
      });
    }, 300000); // 5 minutes

    return () => clearInterval(rotationInterval);
  }, [emptyLegs.length]);

  // Fetch jets from Supabase
  useEffect(() => {
    const loadJets = async () => {
      if (activeCategory !== 'jets') return;

      setIsLoadingJets(true);
      try {
        let query = supabase
          .from('jets')
          .select('*')
          .order('aircraft_model', { ascending: true });

        if (jetsFilter !== 'all') {
          query = query.eq('aircraft_category', jetsFilter);
        }

        if (jetsSearch) {
          query = query.or(`aircraft_model.ilike.%${jetsSearch}%,manufacturer.ilike.%${jetsSearch}%`);
        }

        const { data, error } = await query;

        if (error) {
          setJetsData([]);
        } else {
          const transformedData = (data || []).map(jet => {
            const images = [];
            if (jet.image_url) images.push(jet.image_url);
            if (jet.image_url_1) images.push(jet.image_url_1);
            if (jet.image_url_2) images.push(jet.image_url_2);
            if (jet.image_url_3) images.push(jet.image_url_3);
            if (jet.image_url_4) images.push(jet.image_url_4);
            if (jet.image_url_5) images.push(jet.image_url_5);

            return {
              id: jet.id,
              name: jet.aircraft_model || jet.title,
              location: jet.manufacturer,
              category: jet.aircraft_category,
              totalPrice: jet.price_range || 'Request Quote',
              capacity: `${jet.capacity} pax`,
              range: jet.range,
              image: images[0] || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800',
              images: images,
              isJet: true,
              rawData: jet
            };
          });

          setJetsData(transformedData);
        }
      } catch (error) {
        setJetsData([]);
      } finally {
        setIsLoadingJets(false);
      }
    };

    loadJets();
    setCurrentJetsPage(1); // Reset to first page when filters change
  }, [activeCategory, jetsFilter, jetsSearch, jetsMaxPrice]);

  // Fetch helicopters from Supabase
  useEffect(() => {
    const loadHelicopters = async () => {
      if (activeCategory !== 'helicopter') return;

      setIsLoadingHelicopters(true);
      try {
        let query = supabase
          .from('helicopter_charters')
          .select('*')
          .order('created_at', { ascending: false });

        if (helicoptersFilter !== 'all') {
          query = query.eq('category', helicoptersFilter);
        }

        if (helicoptersSearch) {
          query = query.or(`name.ilike.%${helicoptersSearch}%,type.ilike.%${helicoptersSearch}%`);
        }

        if (helicoptersLocation) {
          query = query.ilike('location', `%${helicoptersLocation}%`);
        }

        if (helicoptersMaxPrice) {
          query = query.lte('price', parseFloat(helicoptersMaxPrice));
        }

        const { data, error } = await query;

        if (error) {
          setHelicoptersData([]);
        } else {
          const transformedData = (data || []).map(heli => {
            const images = [];
            if (heli.image_url) images.push(heli.image_url);
            if (heli.image_url_main) images.push(heli.image_url_main);
            if (heli.image_url_secondary) images.push(heli.image_url_secondary);
            if (heli.image_url_1) images.push(heli.image_url_1);
            if (heli.image_url_2) images.push(heli.image_url_2);
            if (heli.image_url_3) images.push(heli.image_url_3);
            if (heli.image_url_4) images.push(heli.image_url_4);
            if (heli.image_url_5) images.push(heli.image_url_5);

            return {
              id: heli.id,
              name: heli.name || 'Helicopter',
              location: heli.location || 'Global',
              category: heli.type ? heli.type.substring(0, 50) + '...' : 'Helicopter Charter',
              totalPrice: heli.price ? `$${Math.round(convertToUSD(parseFloat(heli.price), 'EUR')).toLocaleString()}/hr` : 'Request Quote',
              capacity: `${heli.capacity || 'N/A'} pax`,
              availability: heli.status === 'available' ? 'On-demand' : 'Contact us',
              image: images[0] || 'https://images.unsplash.com/photo-1639089742630-ec968e4e8741?w=800',
              images: images,
              isHelicopter: true,
              range: heli.range ? `${heli.range} km` : 'N/A',
              speed: heli.speed ? `${heli.speed} km/h` : 'N/A',
              rawData: heli
            };
          });

          setHelicoptersData(transformedData);
        }
      } catch (error) {
        setHelicoptersData([]);
      } finally {
        setIsLoadingHelicopters(false);
      }
    };

    loadHelicopters();
    setCurrentHelicoptersPage(1);
  }, [activeCategory, helicoptersFilter, helicoptersSearch, helicoptersLocation, helicoptersMaxPrice]);

  // Fetch empty legs from Supabase
  useEffect(() => {
    const fetchEmptyLegs = async () => {
      if (activeCategory !== 'empty-legs') return;

      setIsLoadingEmptyLegs(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        let query = supabase
          .from('EmptyLegs_')
          .select('*')
          .gte('departure_date', emptyLegsDate || today)
          .order('departure_date', { ascending: true });

        if (emptyLegsFilter !== 'all') {
          if (emptyLegsFilter === 'europe') {
            query = query.or('from_continent.eq.Europe,to_continent.eq.Europe');
          } else if (emptyLegsFilter === 'usa') {
            query = query.or('from_continent.eq.North America,to_continent.eq.North America');
          } else if (emptyLegsFilter === 'asia') {
            query = query.or('from_continent.eq.Asia,to_continent.eq.Asia');
          } else if (emptyLegsFilter === 'africa') {
            query = query.or('from_continent.eq.Africa,to_continent.eq.Africa');
          }
        }

        if (emptyLegsLocation) {
          const locationSearch = emptyLegsLocation.toUpperCase();
          query = query.or(`from_city.ilike.%${emptyLegsLocation}%,to_city.ilike.%${emptyLegsLocation}%,from_iata.ilike.%${locationSearch}%,to_iata.ilike.%${locationSearch}%`);
        }

        if (emptyLegsMaxPrice) {
          query = query.lte('price', parseFloat(emptyLegsMaxPrice));
        }

        const { data, error } = await query;

        if (error) {
          setEmptyLegsData([]);
        } else {
          const transformedData = (data || []).map(leg => {
            // Use price_usd directly from database (no conversion needed)
            const priceUSD = leg.price_usd || leg.price_in_usd || leg.price || 0;
            return {
              id: leg.id,
              name: `${leg.from_iata || leg.from_city?.substring(0, 3).toUpperCase() || 'DEP'} → ${leg.to_iata || leg.to_city?.substring(0, 3).toUpperCase() || 'ARR'}`,
              subtitle: `${leg.from_city || leg.from} → ${leg.to_city || leg.to}`,
              location: `${leg.from_iata} → ${leg.to_iata}`,
              category: leg.aircraft_type || leg.category,
              totalPrice: priceUSD ? `$${priceUSD.toLocaleString()}` : 'N/A',
              priceUSD: priceUSD, // USD price for calculations
              currency: 'USD',
              capacity: `${leg.capacity || leg.pax || 'N/A'} pax`,
              departureDate: new Date(leg.departure_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              image: leg.image_url || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800',
              isEmptyLeg: true,
              isFreeWithNFT: priceUSD && priceUSD < 1900,
              rawPrice: leg.price, // Original GBP price
              rawData: leg
            };
          });
          setEmptyLegsData(transformedData);
        }
      } catch (error) {
        setEmptyLegsData([]);
      } finally {
        setIsLoadingEmptyLegs(false);
      }
    };

    fetchEmptyLegs();
    setCurrentEmptyLegsPage(1);
  }, [activeCategory, emptyLegsFilter, emptyLegsLocation, emptyLegsDate, emptyLegsMaxPrice]);

  // Fetch adventures when category is active
  useEffect(() => {
    if (activeCategory === 'adventures') {
      fetchAdventures();
      setCurrentAdventuresPage(1);
    }
  }, [activeCategory, adventuresFilter, adventuresSearch, adventuresPackageType, adventuresDestination, adventuresMaxPrice]);

  // Fetch luxury cars when category is active
  useEffect(() => {
    if (activeCategory === 'luxury-cars') {
      fetchLuxuryCars();
      setCurrentLuxuryCarsPage(1);
    }
  }, [activeCategory, luxuryCarsFilter, luxuryCarsBrand, luxuryCarsLocation, luxuryCarsMaxPrice]);

  // Initialize Speech Recognition
  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setCurrentMessage(transcript);
        setIsRecording(false);
        stopAudioVisualization();
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        stopAudioVisualization();
      };

      recognition.onend = () => {
        setIsRecording(false);
        stopAudioVisualization();
      };

      recognitionRef.current = recognition;
    }

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopAudioVisualization();
    };
  }, []);

  // Simplified audio visualization (no heavy processing to prevent lag)
  const startAudioVisualization = async () => {
    // Simple animation without audio processing
    setAudioLevel(50);
  };

  const stopAudioVisualization = () => {
    setAudioLevel(0);
  };

  // Speech recognition handlers
  const startRecording = async () => {
    if (recognitionRef.current && !isRecording) {
      try {
        await startAudioVisualization();
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        stopAudioVisualization();
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      stopAudioVisualization();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleLogout = useCallback(async () => {
    console.log('User logging out...');
    try {
      await signOut();
      showToast('Successfully logged out', 'success');
      setShowDashboard(false);
      setActiveCategory('home');
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Error logging out', 'error');
    }
  }, [signOut, showToast]);

  const handleShowDashboard = useCallback(() => {
    console.log('🚀 Opening dashboard...');
    setActiveCategory('dashboard');
    setDashboardView('overview');
  }, []);

  // Fetch adventures data
  const fetchAdventures = async () => {
    setIsLoadingAdventures(true);
    try {
      let query = supabase
        .from('fixed_offers')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply region filter (text-based matching on destination/origin)
      if (adventuresFilter !== 'all') {
        if (adventuresFilter === 'europe') {
          // European countries/cities
          query = query.or('destination.ilike.%Switzerland%,destination.ilike.%France%,destination.ilike.%Italy%,destination.ilike.%Spain%,destination.ilike.%Germany%,destination.ilike.%Austria%,destination.ilike.%UK%,destination.ilike.%Greece%,destination.ilike.%Portugal%,destination.ilike.%Netherlands%,destination.ilike.%Monaco%,destination.ilike.%Zurich%,destination.ilike.%Paris%,destination.ilike.%London%,destination.ilike.%Rome%,destination.ilike.%Milan%,destination.ilike.%Barcelona%,destination.ilike.%Madrid%,destination.ilike.%Vienna%,destination.ilike.%Amsterdam%,destination.ilike.%Munich%,destination.ilike.%Berlin%,origin.ilike.%Switzerland%,origin.ilike.%France%,origin.ilike.%Italy%,origin.ilike.%Spain%,origin.ilike.%Germany%');
        } else if (adventuresFilter === 'usa') {
          // USA cities/states
          query = query.or('destination.ilike.%USA%,destination.ilike.%United States%,destination.ilike.%New York%,destination.ilike.%Los Angeles%,destination.ilike.%Miami%,destination.ilike.%Las Vegas%,destination.ilike.%California%,destination.ilike.%Florida%,destination.ilike.%Texas%,destination.ilike.%Hawaii%,destination.ilike.%Chicago%,destination.ilike.%San Francisco%,destination.ilike.%Boston%,destination.ilike.%Seattle%,origin.ilike.%USA%,origin.ilike.%United States%,origin.ilike.%New York%,origin.ilike.%Los Angeles%,origin.ilike.%Miami%');
        } else if (adventuresFilter === 'asia') {
          // Asian countries/cities
          query = query.or('destination.ilike.%Japan%,destination.ilike.%Thailand%,destination.ilike.%Singapore%,destination.ilike.%Indonesia%,destination.ilike.%Bali%,destination.ilike.%Vietnam%,destination.ilike.%China%,destination.ilike.%Hong Kong%,destination.ilike.%Maldives%,destination.ilike.%Dubai%,destination.ilike.%UAE%,destination.ilike.%India%,destination.ilike.%Sri Lanka%,destination.ilike.%Malaysia%,destination.ilike.%Philippines%,destination.ilike.%Tokyo%,destination.ilike.%Bangkok%,origin.ilike.%Japan%,origin.ilike.%Thailand%,origin.ilike.%Singapore%');
        } else if (adventuresFilter === 'africa') {
          // African countries/cities
          query = query.or('destination.ilike.%Africa%,destination.ilike.%Kenya%,destination.ilike.%Tanzania%,destination.ilike.%South Africa%,destination.ilike.%Morocco%,destination.ilike.%Egypt%,destination.ilike.%Seychelles%,destination.ilike.%Mauritius%,destination.ilike.%Safari%,destination.ilike.%Cape Town%,destination.ilike.%Zanzibar%,destination.ilike.%Nairobi%,origin.ilike.%Africa%,origin.ilike.%Kenya%,origin.ilike.%Tanzania%,origin.ilike.%South Africa%');
        }
      }

      // Apply search filter (free text)
      if (adventuresSearch) {
        query = query.or(`title.ilike.%${adventuresSearch}%,destination.ilike.%${adventuresSearch}%,origin.ilike.%${adventuresSearch}%`);
      }

      // Apply package type filter
      if (adventuresPackageType) {
        query = query.ilike('package_type', `%${adventuresPackageType}%`);
      }

      // Apply destination filter
      if (adventuresDestination) {
        query = query.ilike('destination', `%${adventuresDestination}%`);
      }

      // Apply price filter
      if (adventuresMaxPrice) {
        query = query.lte('price', parseFloat(adventuresMaxPrice));
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching adventures:', error);
        setAdventuresData([]);
      } else {
        const transformedData = (data || []).map(offer => {
          // Convert EUR price to USD
          const priceUSD = offer.price ? Math.round(convertToUSD(offer.price, 'EUR')) : 0;
          return {
            id: offer.id,
            name: offer.title,
            location: offer.destination || offer.origin,
            category: offer.package_type || 'Adventure',
            totalPrice: offer.price_on_request ? 'On Request' : (priceUSD ? `$${priceUSD.toLocaleString()}` : 'N/A'),
            priceUSD: priceUSD, // USD price for calculations
            yield: offer.duration || 'Flexible',
            period: offer.difficulty_level || 'All levels',
            image: offer.image_url || 'https://auth.privatecharterx.com/storage/v1/object/sign/moreVideos/Whisk_7da17c1fb12a69698224a40c29f3815feg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb3JlVmlkZW9zL1doaXNrXzdkYTE3YzFmYjEyYTY5Njk4MjI0YTQwYzI5ZjM4MTVmZWcucG5nIiwiaWF0IjoxNzY4NzcxMTkwLCJleHAiOjE4MDAzMDcxOTB9.wtWrpjsjr2AcFpiuYGNLdGSuuJMsdvVeLERPZN2Nz7c',
            isAdventure: true,
            rawPrice: offer.price, // Original EUR price
            isFreeWithNFT: priceUSD && priceUSD < 1900,
            rawData: offer
          };
        });
        setAdventuresData(transformedData);
      }
    } catch (error) {
      console.error('Error fetching adventures:', error);
      setAdventuresData([]);
    } finally {
      setIsLoadingAdventures(false);
    }
  };

  // Fetch luxury cars data (RPC with fallback)
  const fetchLuxuryCars = async () => {
    setIsLoadingLuxuryCars(true);
    try {
      // Prefer RPC for RLS-friendly filtered fetch
      const { data: rpcData, error: rpcError } = await supabase.rpc('fetch_luxury_cars', {
        search_term: luxuryCarsBrand ? luxuryCarsBrand : null,
        car_type: luxuryCarsFilter !== 'all' ? luxuryCarsFilter : null,
        min_price: null,
        max_price: luxuryCarsMaxPrice ? parseInt(luxuryCarsMaxPrice, 10) : null,
        location: luxuryCarsLocation ? luxuryCarsLocation : null,
        limit_val: 60,
        offset_val: 0,
        sort_by: 'price_per_day',
        sort_order: 'asc'
      });

      let rows = Array.isArray(rpcData) ? rpcData : [];

      // Fallback to direct select if RPC fails or returns empty
      if (rpcError || rows.length === 0) {
        console.warn('RPC fetch_luxury_cars failed or returned empty, falling back to direct table select', rpcError?.message);
        let query = supabase
          .from('luxury_cars')
          .select('*')
          .order('created_at', { ascending: false });

        if (luxuryCarsFilter !== 'all') {
          query = query.eq('type', luxuryCarsFilter);
        }
        if (luxuryCarsBrand) {
          query = query.ilike('brand', `%${luxuryCarsBrand}%`);
        }
        if (luxuryCarsLocation) {
          query = query.ilike('location', `%${luxuryCarsLocation}%`);
        }
        if (luxuryCarsMaxPrice) {
          query = query.lte('price_per_day', parseFloat(luxuryCarsMaxPrice));
        }

        const { data, error } = await query;
        if (error) {
          console.error('Error fetching luxury cars (fallback):', error);
          rows = [];
        } else {
          rows = data || [];
        }
      }

      const transformedData = (rows || []).map((car) => {
        // Try multiple image fields just in case
        const image = car.image_url || car.image || (Array.isArray(car.images) && car.images[0]) || 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800';
        return {
          id: car.id,
          name: `${car.brand ?? ''} ${car.model ?? ''}`.trim() || car.name || 'Luxury Car',
          location: car.location,
          category: car.type || 'Luxury Car',
          totalPrice: car.price_per_day ? `$${Math.round(convertToUSD(Number(car.price_per_day), 'EUR')).toLocaleString()}/day` : 'On Request',
          yield: car.price_per_hour ? `$${Math.round(convertToUSD(Number(car.price_per_hour), 'EUR')).toLocaleString()}/hr` : 'On Request',
          period: car.price_per_week ? `$${Math.round(convertToUSD(Number(car.price_per_week), 'EUR')).toLocaleString()}/wk` : 'TO BE DISCUSSED',
          image,
          isLuxuryCar: true,
          rawPrice: car.price_per_day ?? null,
          isFreeWithNFT: false,
          rawData: car
        };
      });
      setLuxuryCarsData(transformedData);
    } catch (error) {
      console.error('Error fetching luxury cars:', error);
      setLuxuryCarsData([]);
    } finally {
      setIsLoadingLuxuryCars(false);
    }
  };

  const handleWalletConnect = useCallback(() => {
    console.log('💳 Wallet connect requested');
  }, []);

  // Handle report/support submission
  const handleSubmitReport = async () => {
    if (!reportMessage.trim() || !reportSubject.trim()) {
      showToast('Please fill in both subject and message', 'error');
      return;
    }

    setIsSubmittingReport(true);
    try {
      const { error } = await supabase.from('support_requests').insert({
        user_id: user?.id || null,
        user_email: user?.email || 'anonymous',
        subject: reportSubject.trim(),
        message: reportMessage.trim(),
        status: 'pending',
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      showToast('Support request submitted successfully!', 'success');
      setShowReportPopup(false);
      setReportSubject('');
      setReportMessage('');
    } catch (error) {
      console.error('Error submitting report:', error);
      showToast('Failed to submit request. Please try again.', 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Handle Web Mode switching with transition
  const [targetMode, setTargetMode] = useState(null);

  const handleWebModeSwitch = (mode) => {
    if (mode === webMode) return;

    setTargetMode(mode);
    setIsTransitioning(true);

    // Show loading screen with transition: 1200ms total
    setTimeout(() => {
      setWebMode(mode);
      // Reset to default page for each mode
      if (mode === 'web3') {
        setActiveCategory('chat');
        navigate('/dashboard/web3');
      } else {
        setActiveCategory('chat');
        navigate('/dashboard');
      }
      setTimeout(() => {
        setIsTransitioning(false);
        setTargetMode(null);
      }, 600);
    }, 600);
  };

  const handleJetClick = (jet) => {
    setSelectedJet(jet);
    setShowJetDetail(true);
    setActiveTab('details');
    setCurrentImageIndex(0);
  };

  const getAllJetImages = () => {
    if (!selectedJet) return [];
    const images = [];
    if (selectedJet.rawData?.image_url) images.push(selectedJet.rawData.image_url);
    if (selectedJet.rawData?.image_url_1) images.push(selectedJet.rawData.image_url_1);
    if (selectedJet.rawData?.image_url_2) images.push(selectedJet.rawData.image_url_2);
    if (selectedJet.rawData?.image_url_3) images.push(selectedJet.rawData.image_url_3);
    if (selectedJet.rawData?.image_url_4) images.push(selectedJet.rawData.image_url_4);
    if (selectedJet.rawData?.image_url_5) images.push(selectedJet.rawData.image_url_5);
    return images;
  };

  const handlePrevImage = () => {
    const images = getAllJetImages();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    const images = getAllJetImages();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // RWS Category menu - for Real World Services
  // Note: externalLink removed from empty-legs to keep it within dashboard on mobile
  const rwsCategoryMenu = [
    { id: 'services', label: 'Services', icon: Layers, category: 'services' },
    { id: 'jets', label: 'Jets', icon: Plane, category: 'jets' },
    { id: 'helicopter', label: 'Helis', icon: Zap, category: 'helicopter' },
    { id: 'empty-legs', label: 'Empty Legs', icon: MapPin, category: 'empty-legs' },
    { id: 'adventures', label: 'Adventures', icon: Mountain, category: 'adventures' },
    { id: 'flights', label: 'Flights', icon: Plane, category: 'flights' }
    // { id: 'card', label: 'Card', icon: CreditCard, category: 'card' }, // Hidden - Marqeta integration pending
    // { id: 'hotels', label: 'Hotels', icon: Building2, category: 'hotels' }, // DISABLED - LiteAPI hotels temporarily removed
    // { id: 'assets', label: 'Events & Sports', icon: Calendar, category: 'assets' }, // Hidden for MVP
    // { id: 'luxury-cars', label: 'Luxury Cars', icon: Car, category: 'luxury-cars' }, // Hidden - now integrated into Ground Transport
    // { id: 'ground-transport', label: 'Ground Transport', icon: Car, category: 'ground-transport' } // Hidden for now
    // { id: 'tailored-services', label: 'AI Travel Designer', icon: Compass, category: 'chat' },
    // { id: 'co2-saf', label: 'CO₂/SAF', icon: Leaf, category: 'co2-saf' } // Hidden for now
  ];

  // Web3 Category menu - for Crypto/Blockchain services
  const web3CategoryMenu = [
    // { id: 'assets', label: 'My DeFi Assets', icon: Sparkles, category: 'assets' }, // Hidden for MVP
    { id: 'marketplace', label: 'Marketplace', icon: Package, category: 'marketplace' },
    { id: 'tokenization', label: 'Tokenization', icon: Coins, category: 'tokenization' },
    // { id: 'p2p-trading', label: 'P2P', icon: Share2, category: 'p2p-trading' }, // Hidden for MVP
    // { id: 'swap', label: 'Swap', icon: ArrowLeft, category: 'swap' }, // Hidden - not needed for now
    // { id: 'dao', label: 'DAOs', icon: Users, category: 'dao' }, // Hidden for MVP
    // { id: 'escrow', label: 'Escrow', icon: Shield, category: 'escrow' }, // Coming Soon
    { id: 'nft-marketplace', label: 'NFT Marketplace', icon: Shield, category: 'nft-marketplace' },
    { id: 'launchpad', label: 'Launchpad', icon: Zap, category: 'launchpad' }
  ];

  // Active category menu based on webMode
  const categoryMenu = webMode === 'rws' ? rwsCategoryMenu : web3CategoryMenu;

  // Partner menu - for partner-specific navigation
  const partnerMenuBase = [
    // { id: 'overview', label: 'Dashboard', icon: Home, category: 'overview' }, // Hidden - overview page disabled
    { id: 'my-services', label: 'My Services', icon: Package, category: 'my-services' },
    { id: 'bookings', label: 'Booking Requests', icon: FolderOpen, category: 'partner-bookings' },
    { id: 'earnings', label: 'Earnings', icon: Award, category: 'partner-earnings' },
    { id: 'profile', label: 'Profile', icon: User, category: 'dashboard', dashboardTab: 'profile' },
    // { id: 'chat-support', label: 'Chat Support', icon: MessageSquare, category: 'chat-support' }, // Hidden - using footer chat widget instead
    { id: 'settings', label: 'Settings', icon: Settings, category: 'settings' }
  ];

  // User menu - for sidebar navigation (dashboard-related items)
  const userMenuBase = [
    { id: 'home', label: 'Home', icon: Home, category: 'home' },
    // { id: 'overview', label: 'Overview', icon: LayoutDashboard, category: 'overview' }, // Hidden - overview page disabled
    { id: 'profile', label: 'Profile', icon: User, category: 'dashboard', dashboardTab: 'profile', rwsOnly: true },
    // { id: 'calendar', label: 'Calendar', icon: Calendar, category: 'calendar' }, // Hidden - not needed for now
    // UNIFIED: Single "My Activity" tab replaces My Bookings + My Requests
    { id: 'activity', label: 'My Activity', icon: Activity, category: 'my-activity', rwsOnly: true },
    // My Bookings - Adventures and Commercial Flights
    { id: 'bookings', label: 'My Bookings', icon: CreditCard, category: 'bookings', rwsOnly: true },
    // { id: 'requests', label: 'My Requests', icon: FolderOpen, category: 'requests' },
    {
      id: 'subscriptions',
      label: 'Subscriptions',
      icon: Crown,
      category: 'subscriptions',
      rwsOnly: true,
      submenu: [
        { id: 'subscription-overview', label: 'Manage Plan', icon: Crown, category: 'subscriptions' },
        { id: 'subscription-plans', label: 'Plans & Pricing', icon: CreditCard, category: 'subscription-plans' }
      ]
    },
    // { id: 'my-launches', label: 'My Launches', icon: Rocket, category: 'my-launches', web3Only: true }, // Hidden - not needed for now
    // { id: 'chat-requests', label: 'Chat Requests', icon: MessageSquare, category: 'chat-requests' },
    // { id: 'referral', label: 'Referral Program', icon: Gift, category: 'referral' },
    // { id: 'transactions', label: 'Transactions', icon: Award, category: 'transactions', web3Only: true }, // Hidden - not needed for now
    // { id: 'tokenized-assets', label: 'My DeFi Assets', icon: Sparkles, category: 'assets', web3Only: true }, // Hidden for MVP
    { id: 'pvcx-token', label: '$PVCX Token', icon: Coins, category: 'pvcx-token', web3Only: true },
    {
      id: 'tokenize-asset',
      label: 'Tokenize Asset',
      icon: Sparkles,
      category: 'tokenization',
      web3Only: true,
      submenu: [
        { id: 'my-tokenized-assets', label: 'My Tokenized Assets', icon: FolderOpen, category: 'my-tokenized-assets' },
        { id: 'create-tokenization', label: 'Tokenize Asset', icon: Plus, category: 'tokenization' }
      ]
    },
    // SPV Formation - Hidden for now
    // {
    //   id: 'spv-formation',
    //   label: 'SPV Formation',
    //   icon: Building2,
    //   category: 'spv-formation',
    //   submenu: [
    //     { id: 'my-spvs', label: 'My SPVs', icon: FolderOpen, category: 'my-spvs' },
    //     { id: 'create-spv', label: 'Create SPV', icon: Plus, category: 'spv-formation' }
    //   ]
    // },
    // { id: 'co2-certificates', label: 'CO2 Certificates', icon: Leaf, category: 'co2-certificates' }, // Hidden for now
    // { id: 'chat-support', label: 'Chat Support', icon: MessageSquare, category: 'chat-support' }, // Hidden - using footer chat widget instead
    { id: 'support-messages', label: 'Messages', icon: MessageCircle, category: 'support-messages', rwsOnly: true },
    { id: 'nft-marketplace', label: 'NFT Marketplace', icon: Shield, category: 'nft-marketplace' },
    // Admin only
    { id: 'live-support-admin', label: 'Live Support', icon: MessageCircle, category: 'live-support-admin', adminOnly: true }
  ];

  // Filter menu based on user role and webMode
  const userMenu = user?.user_role === 'partner'
    ? partnerMenuBase
    : userMenuBase.filter(item => {
        if (item.rwsOnly && webMode !== 'rws') return false;
        if (item.web3Only && webMode !== 'web3') return false;
        if (item.adminOnly && !isAdmin) return false;
        return true;
      });

  const recentActivities = [
    { id: 1, title: 'Gulfstream G650 Charter', time: '23 hours' },
    { id: 2, title: 'Empty Leg Zurich-London', time: '2 days ago' },
    { id: 3, title: 'CO2 Certificate Purchase', time: '3 weeks ago' }
  ];

  // Show PrivateCharterX logo animation while auth is initializing
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-20 h-20">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain"
          >
            <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/videoExport-2025-10-19@11-32-10.850-540x540@60fps.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    );
  }

  // Debug log for render - helps identify blank page issues
  console.log('🎯 Dashboard render:', {
    activeCategory,
    isAuthenticated,
    hasUser: !!user,
    userRole: user?.user_role,
    webMode,
    isTransitioning
  });

  // Check if on admin route
  const isOnAdminRoute = window.location.pathname === '/admin' || window.location.pathname === '/crm-admin' || window.location.pathname.startsWith('/admin/');

  // Don't render dashboard content until authenticated
  // MOBILE FIX: If authenticated (even without showDashboard flag), show dashboard immediately
  // This prevents the blank screen flash on mobile devices
  // EXCEPTION: Admin routes should always render to show login modal
  // EXCEPTION: Home/overview page should be accessible to guests
  const isOnHomePage = window.location.pathname === '/dashboard/home' || window.location.pathname === '/dashboard' || activeCategory === 'home';
  if (!isAuthenticated && !isOnAdminRoute && !isSimpleAdminAuth && !isOnHomePage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          {/* Only show logo animation if not showing any auth modal */}
          {!showLoginModal && !showRegisterModal && !showForgotPasswordModal && !showPartnerRegisterModal && (
            <div className="flex flex-col items-center gap-4">
              {/* PrivateCharterX Logo Animation - Same as transition */}
              <div className="w-20 h-20">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                >
                  <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/videoExport-2025-10-19@11-32-10.850-540x540@60fps.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          )}
        </div>
        {/* Login modal - Use app-specific modal for native apps */}
        {showLoginModal && (
          isNativeApp() ? (
            <AppLoginModal
              onClose={() => setShowLoginModal(false)}
              onSwitchToRegister={() => {
                setShowLoginModal(false);
                setShowRegisterModal(true);
              }}
              onSuccess={() => setShowLoginModal(false)}
              onForgotPassword={() => {
                setShowLoginModal(false);
                setShowForgotPasswordModal(true);
              }}
            />
          ) : (
            <LoginModal
              onClose={() => setShowLoginModal(false)}
              onSwitchToRegister={() => {
                setShowLoginModal(false);
                setShowRegisterModal(true);
              }}
              onSwitchToPartnerRegister={() => {
                setShowLoginModal(false);
                setShowPartnerRegisterModal(true);
              }}
              onSuccess={() => setShowLoginModal(false)}
              onSwitchToForgotPassword={() => {
                setShowLoginModal(false);
                setShowForgotPasswordModal(true);
              }}
            />
          )
        )}
        {/* Register modal - Use app-specific modal for native apps */}
        {showRegisterModal && (
          isNativeApp() ? (
            <AppRegisterModal
              onClose={() => setShowRegisterModal(false)}
              onSwitchToLogin={() => {
                setShowRegisterModal(false);
                setShowLoginModal(true);
              }}
              onSuccess={() => setShowRegisterModal(false)}
            />
          ) : (
            <RegisterModal
              onClose={() => setShowRegisterModal(false)}
              onSwitchToLogin={() => {
                setShowRegisterModal(false);
                setShowLoginModal(true);
              }}
              onSwitchToPartnerRegister={() => {
                setShowRegisterModal(false);
                setShowPartnerRegisterModal(true);
              }}
              onSuccess={() => setShowRegisterModal(false)}
            />
          )
        )}
        {showForgotPasswordModal && (
          <ForgotPasswordModal
            onClose={() => setShowForgotPasswordModal(false)}
            onBackToLogin={() => {
              setShowForgotPasswordModal(false);
              setShowLoginModal(true);
            }}
          />
        )}
        {showPartnerRegisterModal && (
          <PartnerRegistrationModal
            isOpen={showPartnerRegisterModal}
            onClose={() => setShowPartnerRegisterModal(false)}
            onSuccess={() => {
              setShowPartnerRegisterModal(false);
              showToast('Partner registration successful! Please wait for verification.', 'success');
            }}
          />
        )}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  // Promo banner slides - category ads
  const promoSlides = [
    {
      id: 'trustpilot',
      category: null,
      title: 'Trusted by Travelers',
      subtitle: 'Rated Excellent on Trustpilot',
      rating: '4.8',
      image: null
    },
    {
      id: 'commercial',
      category: 'flights',
      title: 'Flight Tickets',
      subtitle: 'Swiss, Lufthansa & 900+ Airlines',
      image: 'https://auth.privatecharterx.com/storage/v1/object/public/tokenized%20assets%20banner/csm_07-Optimization-and-Simulation-Project-2-Picture-01-Swiss_3ff1479ece.webp'
    },
    {
      id: 'jets',
      category: 'jets',
      title: 'Private Jets',
      subtitle: 'Charter your private flight',
      image: 'https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_a5109b014ee92cba42f48bfebce4fd92eg.png'
    },
    {
      id: 'emptylegs',
      category: 'empty-legs',
      title: 'Empty Legs',
      subtitle: 'Save up to 75% on private jets',
      image: 'https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_8eaf61762669635badd48e59c304b6c3eg.png'
    },
    {
      id: 'adventures',
      category: 'adventures',
      title: 'Adventures',
      subtitle: 'Curated luxury experiences worldwide',
      image: 'https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_fb14380acaf092090044512c11a681a1eg.png'
    },
    {
      id: 'nft',
      category: 'nft-membership',
      title: 'NFT Membership',
      subtitle: 'Exclusive benefits & rewards',
      image: 'https://auth.privatecharterx.com/storage/v1/object/public/logos/Whisk_iwzzu2nzizyzmmn50szjzgotutn1qtllfwnh1so.png'
    },
    {
      id: 'transfer',
      category: 'ground-transport',
      title: 'Airport Transfer',
      subtitle: 'Luxury chauffeur services',
      image: 'https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_60417b0dd969afb83c44f8733d7156eaeg.png'
    },
    {
      id: 'concierge',
      category: 'concierge',
      title: 'Concierge',
      subtitle: '24/7 personal assistance',
      image: 'https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_bf9f83710232184b8f94a95270a5a4beeg.png'
    }
  ];

  // Inline page footer with promo banner (banner only shows on chat/home page)
  const PageFooter = ({ showBanner = false }) => (
    <div className="mt-8 w-full max-w-2xl mx-auto">
      {/* Promo Banner - Only on home/chat page */}
      {showBanner && (
        <div
          onClick={() => promoSlides[promoSlideIndex].category && setActiveCategory(promoSlides[promoSlideIndex].category)}
          className={`relative h-16 rounded-xl mb-4 overflow-hidden ${promoSlides[promoSlideIndex].category ? 'cursor-pointer' : ''}`}
        >
          {promoSlides.map((slide, index) => (
            <div
              key={slide.id}
              className="absolute inset-0 transition-all duration-700 ease-in-out"
              style={{
                opacity: index === promoSlideIndex ? 1 : 0,
                transform: index === promoSlideIndex ? 'translateX(0)' : index < promoSlideIndex ? 'translateX(-100%)' : 'translateX(100%)'
              }}
            >
              {/* Background */}
              {slide.image ? (
                <>
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${slide.image})` }} />
                  <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-transparent" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl" />
              )}

              {/* Content */}
              <div className="absolute inset-0 flex items-center px-4">
                {slide.rating ? (
                  // Trustpilot slide
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map((star) => (
                        <svg key={star} className="w-4 h-4 text-[#00b67a]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{slide.title}</h4>
                      <p className="text-[11px] text-gray-500">{slide.subtitle} · {slide.rating}/5</p>
                    </div>
                  </div>
                ) : (
                  // Category slide
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{slide.title}</h4>
                    <p className="text-[11px] text-gray-500">{slide.subtitle}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

        </div>
      )}

      {/* Footer Links */}
      <div className="text-center text-[9px] text-gray-300">
        <button onClick={() => setActiveCategory('terms')} className="hover:text-gray-500">Terms</button>
        <span className="mx-1.5">·</span>
        <button onClick={() => setActiveCategory('privacy')} className="hover:text-gray-500">Privacy</button>
        <span className="mx-1.5">·</span>
        <button onClick={() => setActiveCategory('imprint')} className="hover:text-gray-500">Imprint</button>
        <span className="mx-1.5">·</span>
        <span>PrivateCharterX LLC · Miami, FL</span>
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] font-['DM_Sans'] relative overflow-hidden">
      {/* Background - Animated Video for both RWS and Web3 */}
      <video
        autoPlay
        loop
        muted
        playsInline
        controls={false}
        disablePictureInPicture
        preload="auto"
        webkit-playsinline="true"
        x5-playsinline="true"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      >
        <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/istockphoto-1733442081-640_adpp_is.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9pc3RvY2twaG90by0xNzMzNDQyMDgxLTY0MF9hZHBwX2lzLm1wNCIsImlhdCI6MTc1OTUyMDc5MCwiZXhwIjoxNzkxMDU2NzkwfQ.P5Hr5zLzhYdk5sjvXuPs1clfrt4nLZhKDhbF0gvH5Ss" type="video/mp4" />
      </video>


      {/* Main Container - Fullscreen Glassmorphic Dashboard */}
      <div className="relative z-10 flex h-full items-center justify-center p-0">
        {/* COMPLETE FULLSCREEN GLASSMORPHIC CONTAINER - Sidebar + Content als ein Stück */}
        <div className={`relative flex w-full h-full rounded-none shadow-2xl border-0 overflow-hidden ${
          webMode === 'web3'
            ? 'bg-white/30 backdrop-blur-3xl lg:border-white/40'
            : 'bg-white/80 backdrop-blur-3xl lg:border-gray-200/80'
        }`} style={{ backdropFilter: webMode === 'web3' ? 'blur(60px) saturate(120%)' : 'blur(40px) saturate(180%)' }}>

          {/* Mobile Backdrop - Transparent, no overlay */}
          {isMobileMenuOpen && (
            <div
              className="lg:hidden fixed inset-0 z-30"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          {/* Glassmorphic Sidebar - EXPANDABLE ON CLICK, Mobile Fullscreen */}
          <aside className={`border-r flex flex-col py-4 transition-all duration-300 ease-in-out overflow-hidden z-40 relative ${
            webMode === 'web3'
              ? 'border-white/30'
              : 'bg-white/70 border-gray-200/70'
          } ${
            isMobileMenuOpen
              ? 'fixed inset-0 w-full h-full'
              : `hidden lg:flex lg:relative ${sidebarExpanded ? 'lg:w-60' : 'lg:w-16'}`
          }`} style={webMode === 'web3' ? { backgroundColor: '#efefef' } : { backdropFilter: 'blur(20px) saturate(180%)' }}>

          {/* Mobile Close Button - Top Right */}
          {isMobileMenuOpen && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all z-50"
            >
              <X size={20} className="text-gray-600" />
            </button>
          )}

          {/* Logo - Click to go to Home */}
          <div className={`mb-6 transition-all duration-300 ${isMobileMenuOpen || sidebarExpanded ? 'px-4' : 'px-2'}`}>
            <div
              onClick={() => {
                // Navigate to Home page
                setActiveCategory('home');
                // Close mobile menu if open
                if (isMobileMenuOpen) {
                  setIsMobileMenuOpen(false);
                }
              }}
              className={`flex items-center justify-center overflow-hidden cursor-pointer ${isMobileMenuOpen || sidebarExpanded ? 'w-auto' : 'w-12 h-12'}`}>
              {webMode === 'web3' ? (
                <>
                  {/* Animated logo when collapsed - Web3.0 only */}
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className={`h-12 w-12 object-contain ${isMobileMenuOpen || sidebarExpanded ? 'hidden' : 'block'}`}
                  >
                    <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/videoExport-2025-10-19@14-08-49.871-540x540@60fps.mp4" type="video/mp4" />
                  </video>
                  {/* Full logo when expanded or mobile open */}
                  <img
                    src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_Logo_written-removebg-preview.png"
                    alt="PrivateCharterX"
                    className={`h-12 w-auto object-contain ${isMobileMenuOpen || sidebarExpanded ? 'block' : 'hidden'}`}
                  />
                </>
              ) : (
                <>
                  {/* Static X icon when collapsed - RWS mode */}
                  <img
                    src="https://i.imgur.com/iu42DU1.png"
                    alt="PrivateCharterX"
                    className={`h-12 w-12 object-contain ${isMobileMenuOpen || sidebarExpanded ? 'hidden' : 'block'}`}
                  />
                  {/* Full logo when expanded or mobile open */}
                  <img
                    src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_Logo_written-removebg-preview.png"
                    alt="PrivateCharterX"
                    className={`h-12 w-auto object-contain ${isMobileMenuOpen || sidebarExpanded ? 'block' : 'hidden'}`}
                  />
                </>
              )}
            </div>
          </div>

          {/* AI Chat Section - New Chat + History */}
          <div className={`mb-4 transition-all duration-300 ${isMobileMenuOpen || sidebarExpanded ? 'px-4' : 'px-2'}`}>
            <div className={`border rounded-lg p-2 transition-all duration-300 backdrop-blur-xl ${
              webMode === 'web3'
                ? 'bg-white/20 border-gray-300/50'
                : 'bg-gray-100/80 border-gray-300/60'
            }`}>
              <button
                onClick={() => {
                  // If sidebar is collapsed, expand it first
                  if (!sidebarExpanded && !isMobileMenuOpen) {
                    setSidebarExpanded(true);
                    return;
                  }
                  // Start a new chat - update state first, then URL cosmetically
                  setActiveCategory('chat');
                  setActiveChat('new'); // Reset to new chat screen directly
                  // Update URL without triggering navigation/reload
                  window.history.pushState({}, '', '/dashboard/chat');
                  // Close mobile menu after selection
                  if (isMobileMenuOpen) {
                    setIsMobileMenuOpen(false);
                  }
                }}
                className={`w-full h-8 rounded-md flex items-center border transition-all duration-300 mb-2 backdrop-blur-xl ${
                  isMobileMenuOpen || sidebarExpanded ? 'justify-start gap-2 px-3' : 'justify-center'
                } ${
                  webMode === 'web3'
                    ? 'bg-white/30 hover:bg-white/40 text-gray-900 border-gray-300/50'
                    : 'bg-white/70 hover:bg-white/90 text-gray-800 border-gray-300/50'
                }`}
                title="New Chat"
              >
                <Plus size={14} />
                <span className={`text-xs font-medium whitespace-nowrap ${isMobileMenuOpen || sidebarExpanded ? 'inline-block' : 'hidden'}`}>New Chat</span>
              </button>

              {/* History button with collapse toggle */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    // If sidebar is collapsed, expand it first
                    if (!sidebarExpanded && !isMobileMenuOpen) {
                      setSidebarExpanded(true);
                      return;
                    }
                    setActiveCategory('chat-history');
                    // Close mobile menu after selection
                    if (isMobileMenuOpen) {
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  className={`flex-1 h-7 flex items-center rounded-md transition-all duration-300 backdrop-blur-xl ${
                    isMobileMenuOpen || sidebarExpanded ? 'justify-start gap-2 px-2' : 'justify-center'
                  } ${
                    webMode === 'web3'
                      ? activeCategory === 'chat-history'
                        ? 'bg-white/30 text-gray-900'
                        : 'text-gray-800 hover:bg-white/20'
                      : activeCategory === 'chat-history'
                        ? 'bg-white/60 text-gray-900'
                        : 'text-gray-600 hover:bg-white/40'
                  }`}
                  title="Chat History"
                >
                  <History size={12} className="flex-shrink-0" />
                  <span className={`text-xs font-medium ${isMobileMenuOpen || sidebarExpanded ? 'inline-block' : 'hidden'}`}>History</span>
                </button>
                {/* Collapse/Expand toggle for chat history - only show when sidebar expanded and has chats */}
                {(isMobileMenuOpen || sidebarExpanded) && chatHistory.length > 0 && (
                  <button
                    onClick={() => setChatHistoryExpanded(!chatHistoryExpanded)}
                    className={`h-7 w-7 flex items-center justify-center rounded-md transition-all duration-300 ${
                      webMode === 'web3'
                        ? 'text-gray-600 hover:bg-white/20'
                        : 'text-gray-500 hover:bg-white/40'
                    }`}
                    title={chatHistoryExpanded ? 'Collapse recent chats' : 'Expand recent chats'}
                  >
                    <ChevronDown
                      size={12}
                      className={`transition-transform duration-200 ${chatHistoryExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                )}
              </div>

              {/* Latest 4 Chats - Collapsible */}
              {(isMobileMenuOpen || sidebarExpanded) && chatHistory.length > 0 && chatHistoryExpanded && (
                <div className="mt-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                  {chatHistory.slice(0, 4).map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => {
                        setActiveChat(chat.id);
                        setActiveCategory('chat');
                        window.history.pushState({}, '', `/dashboard/chat/${chat.id}`);
                        if (isMobileMenuOpen) {
                          setIsMobileMenuOpen(false);
                        }
                      }}
                      className={`w-full h-7 flex items-center gap-2 px-2 rounded-md transition-all duration-300 text-left ${
                        activeChat === chat.id
                          ? webMode === 'web3'
                            ? 'bg-white/30 text-gray-900'
                            : 'bg-white/60 text-gray-900'
                          : webMode === 'web3'
                            ? 'text-gray-700 hover:bg-white/20'
                            : 'text-gray-600 hover:bg-white/40'
                      }`}
                      title={chat.title}
                    >
                      <MessageSquare size={10} className="flex-shrink-0 opacity-60" />
                      <span className="text-[11px] truncate flex-1">{chat.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Menu - Expandable (USER MENU ONLY) */}
          <nav className={`flex-1 overflow-y-auto space-y-2 transition-all duration-300 ${isMobileMenuOpen || sidebarExpanded ? 'px-4' : 'px-2'}`}>
            {userMenu.map((item) => {
              const isActive = item.dashboardTab
                ? (activeCategory === item.category && dashboardView === item.dashboardTab)
                : (activeCategory === item.category);

              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isExpanded = expandedMenus[item.id];

              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      // If sidebar is collapsed, expand it first
                      if (!sidebarExpanded && !isMobileMenuOpen) {
                        setSidebarExpanded(true);
                        return;
                      }

                      if (hasSubmenu) {
                        setExpandedMenus(prev => ({
                          ...prev,
                          [item.id]: !prev[item.id]
                        }));
                      } else {
                        // Special handling for profile which uses dashboard + dashboardView
                        if (item.dashboardTab === 'profile') {
                          setActiveCategoryInternal('dashboard');
                          setDashboardView('profile');
                          window.history.pushState({}, '', '/dashboard/profile');
                        } else {
                          setActiveCategory(item.category);
                          if (item.dashboardTab) {
                            setDashboardView(item.dashboardTab);
                          }
                        }
                        // Close mobile menu after selection
                        if (isMobileMenuOpen) {
                          setIsMobileMenuOpen(false);
                        }
                      }
                    }}
                    className={`h-8 flex items-center rounded-lg transition-all duration-300 ${
                      isMobileMenuOpen || sidebarExpanded ? 'w-full justify-between gap-2 px-2' : 'w-10 justify-center'
                    } ${
                      webMode === 'web3'
                        ? isActive || isExpanded
                          ? 'text-gray-900'
                          : 'text-gray-800 hover:bg-white/20'
                        : isActive || isExpanded
                        ? 'text-gray-800'
                        : 'text-gray-600 hover:bg-white/10'
                    }`}
                    title={item.label}
                  >
                    <div className="flex items-center gap-2">
                      {(isActive || isExpanded) && (isMobileMenuOpen || sidebarExpanded) && (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                      <item.icon size={12} className="flex-shrink-0" />
                      <span className={`text-xs whitespace-nowrap ${isMobileMenuOpen || sidebarExpanded ? 'inline-block' : 'hidden'}`}>{item.label}</span>
                    </div>
                    {hasSubmenu && (
                      <ChevronDown
                        size={10}
                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} ${isMobileMenuOpen || sidebarExpanded ? 'inline-block' : 'hidden'}`}
                      />
                    )}
                  </button>

                  {/* Submenu */}
                  {hasSubmenu && isExpanded && (
                    <div className={`ml-4 mt-1 space-y-1 pl-2 border-l border-white/20 ${isMobileMenuOpen || sidebarExpanded ? 'block' : 'hidden'}`}>
                      {item.submenu.map((subItem) => {
                        const isSubActive = activeCategory === subItem.category;
                        return (
                          <button
                            key={subItem.id}
                            onClick={() => {
                              setActiveCategory(subItem.category);
                              // Close mobile menu after selection
                              if (isMobileMenuOpen) {
                                setIsMobileMenuOpen(false);
                              }
                            }}
                            className={`w-full h-7 flex items-center gap-2 px-2 rounded-lg transition-all duration-300 text-xs ${
                              webMode === 'web3'
                                ? isSubActive
                                  ? 'text-gray-900'
                                  : 'text-gray-700 hover:bg-white/10'
                                : isSubActive
                                ? 'text-gray-800'
                                : 'text-gray-600 hover:bg-white/5'
                            }`}
                            title={subItem.label}
                          >
                            {isSubActive && <span className="text-gray-400 text-xs">-</span>}
                            <subItem.icon size={10} className="flex-shrink-0" />
                            <span className="whitespace-nowrap">{subItem.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* MOBILE ONLY: RWS Services Section */}
            {isMobileMenuOpen && user?.user_role !== 'partner' && (
              <div className="mt-6 pt-4 border-t border-gray-200/50">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 px-2">RWA Services</p>
                {rwsCategoryMenu.map((item) => {
                  const isActive = activeCategory === item.category;
                  // Map category to URL path
                  const categoryToPath = {
                    'jets': '/dashboard/jets',
                    'helicopter': '/dashboard/helis',
                    'empty-legs': '/dashboard/empty-legs',
                    'ground-transport': '/dashboard/ground-transport',
                    'adventures': '/dashboard/adventures'
                  };
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveCategory(item.category);
                        setShowJetDetail(false);
                        setIsMobileMenuOpen(false);
                        // Update URL to match category
                        if (categoryToPath[item.category]) {
                          navigate(categoryToPath[item.category]);
                        }
                        // Handle external links
                        if (item.externalLink) {
                          window.location.href = item.externalLink;
                        }
                      }}
                      className={`w-full h-8 flex items-center gap-2 px-2 rounded-lg transition-all duration-300 text-xs ${
                        isActive
                          ? 'bg-black text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon size={12} className="flex-shrink-0" />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* MOBILE ONLY: Web3.0 Services Section */}
            {isMobileMenuOpen && user?.user_role !== 'partner' && (
              <div className="mt-4 pt-4 border-t border-gray-200/50">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 px-2">Web3.0 Services</p>
                {web3CategoryMenu.map((item) => {
                  const isActive = activeCategory === item.category;
                  const web3CategoryToPath = {
                    'marketplace': '/dashboard/web3/marketplace',
                    'tokenization': '/dashboard/web3/tokenization',
                    'nft-marketplace': '/dashboard/nft-marketplace',
                    'launchpad': '/dashboard/web3/launchpad'
                  };
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        // Switch to web3 mode if not already
                        if (webMode !== 'web3') {
                          handleWebModeSwitch('web3');
                        } else {
                          // Already in web3 mode, just navigate
                          setActiveCategory(item.category);
                          setShowJetDetail(false);
                          if (web3CategoryToPath[item.category]) {
                            navigate(web3CategoryToPath[item.category]);
                          }
                        }
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full h-8 flex items-center gap-2 px-2 rounded-lg transition-all duration-300 text-xs ${
                        isActive && webMode === 'web3'
                          ? 'bg-black text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon size={12} className="flex-shrink-0" />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </nav>

          {/* Sidebar Toggle Button - Above the border line */}
          <div className={`hidden lg:block transition-all duration-300 mt-auto mb-2 ${isMobileMenuOpen || sidebarExpanded ? 'px-4' : 'px-2'}`}>
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className={`h-8 flex items-center rounded-lg transition-all duration-300 hover:bg-white/10 ${
                isMobileMenuOpen || sidebarExpanded ? 'w-full justify-between gap-2 px-2' : 'w-10 justify-center'
              }`}
              title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <div className="flex items-center gap-2">
                <ChevronRight size={14} className={`text-gray-500 transition-transform duration-300 flex-shrink-0 ${sidebarExpanded ? 'rotate-180' : ''}`} />
                <span className={`text-xs text-gray-600 whitespace-nowrap ${isMobileMenuOpen || sidebarExpanded ? 'inline-block' : 'hidden'}`}>
                  {sidebarExpanded ? 'Collapse' : 'Expand'}
                </span>
              </div>
            </button>
          </div>

          {/* Bottom Section - PVCX Balance */}
          <div className="pt-4 border-t border-gray-600/30 transition-all duration-300">
            {/* PVCX Balance Widget */}
            <div className={`transition-all duration-300 ${isMobileMenuOpen || sidebarExpanded ? 'px-4' : 'px-2'}`}>
              <button
                onClick={() => {
                  if (webMode === 'rws') {
                    handleWebModeSwitch('web3');
                  } else {
                    setActiveCategory('pvcx-token');
                  }
                  // Close mobile menu after selection
                  if (isMobileMenuOpen) {
                    setIsMobileMenuOpen(false);
                  }
                }}
                className={`h-10 flex items-center hover:bg-white/5 transition-all duration-300 ${
                  isMobileMenuOpen || sidebarExpanded ? 'w-full rounded-lg justify-start gap-2 px-2 bg-white/10' : 'w-10 rounded-full justify-center'
                }`}
                title={webMode === 'rws' ? 'Switch to Web3.0 for $PVCX Token' : '$PVCX Token Balance'}
              >
                <img
                  src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/PaymentIcons/Title-removebg-preview.png"
                  alt="PVCX"
                  className="w-10 h-10 object-contain flex-shrink-0"
                />
                <div className={`items-center gap-1 ${isMobileMenuOpen || sidebarExpanded ? 'flex' : 'hidden'}`}>
                  <span className="text-xs font-semibold text-gray-900">
                    {loadingPvcxBalance ? '...' : pvcxBalance.toFixed(3)}
                  </span>
                  <span className="text-xs text-gray-600">$PVCX</span>
                </div>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area - PART OF SAME CONTAINER */}
        <main className={`flex-1 overflow-y-auto flex flex-col ${webMode === 'web3' ? 'bg-white/10' : ''}`}>
          {/* FIXED TOP BAR - Category menu links on left, icons and switcher on right */}
          <div className={`sticky top-0 z-50 bg-transparent px-2 sm:px-4 lg:px-8 flex justify-between items-center py-3 sm:py-4 pr-2 sm:pr-4 lg:pr-6 ${
            activeCategory === 'chat' ? 'hidden' : ''
          }`}>
            {/* MOBILE ONLY: Sidebar Toggle in header row - Categories moved to sidebar */}
            <div className="md:hidden flex items-center gap-1.5 ml-2">
              {/* Sidebar Toggle Button (Menu) */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center justify-center w-8 h-8 bg-white/80 rounded-lg border border-gray-200/50 hover:bg-white transition-all duration-200"
                title="Open menu"
              >
                <Menu size={16} strokeWidth={2.5} className="text-gray-700" />
              </button>
            </div>

            {/* LEFT: Category Menu Links (collapsible, NO ICONS) - HIDDEN ON MOBILE */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3 overflow-x-auto">
              {/* COLLAPSIBLE CATEGORY BUTTONS - RWS mode - NO ICONS */}
              {!headersCollapsed && webMode === 'rws' && user?.user_role !== 'partner' && (
                <>
                  {rwsCategoryMenu.map((item) => {
                    const isActive = activeCategory === item.category;
                    // Map category to URL path
                    const categoryToPath = {
                      'jets': '/dashboard/jets',
                      'helicopter': '/dashboard/helis',
                      'empty-legs': '/dashboard/empty-legs',
                      'ground-transport': '/dashboard/ground-transport',
                      'adventures': '/dashboard/adventures'
                    };
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveCategory(item.category);
                          setShowJetDetail(false);
                          // Update URL to match category
                          if (categoryToPath[item.category]) {
                            navigate(categoryToPath[item.category]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                          isActive
                            ? 'bg-black text-white'
                            : 'text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </>
              )}

              {/* COLLAPSIBLE CATEGORY BUTTONS - Web3 mode - NO ICONS */}
              {!headersCollapsed && webMode === 'web3' && user?.user_role !== 'partner' && (
                <>
                  {web3CategoryMenu
                    .filter(item => item.id !== 'assets')
                    .map((item) => {
                      const isActive = activeCategory === item.category;
                      const web3CategoryToPath = {
                        'marketplace': '/dashboard/web3/marketplace',
                        'tokenization': '/dashboard/web3/tokenization',
                        'nft-marketplace': '/dashboard/nft-marketplace',
                        'launchpad': '/dashboard/web3/launchpad'
                      };
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveCategory(item.category);
                            setShowJetDetail(false);
                            if (web3CategoryToPath[item.category]) {
                              navigate(web3CategoryToPath[item.category]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                            isActive
                              ? 'bg-black text-white'
                              : 'text-gray-700 hover:text-gray-900'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                </>
              )}
            </div>

            {/* RIGHT: Plus Icon + Icons + Switcher */}
            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 ml-auto">
              {/* Plus Icon - Thinner with short separator - DESKTOP ONLY */}
              <button
                onClick={() => setHeadersCollapsed(!headersCollapsed)}
                className="hidden md:flex group items-center justify-center transition-all duration-300 hover:scale-110 mr-1"
                title={headersCollapsed ? "Show menu" : "Hide menu"}
              >
                <Plus
                  size={22}
                  strokeWidth={1.5}
                  className="transition-all duration-300 text-gray-800 group-hover:rotate-90"
                />
              </button>

              {/* Short separator line - DESKTOP ONLY */}
              {/* Favorites Icon - Hidden for MVP */}
              {/* {webMode !== 'web3' && (
                <>
                  <div className="hidden md:block w-px h-4 bg-gray-300"></div>
                  <button
                    onClick={() => setActiveCategory('favourites')}
                    className="relative flex items-center justify-center transition-all duration-200"
                    title="Favourites"
                  >
                    <Heart size={16} className={activeCategory === 'favourites' ? 'fill-red-500 text-red-500' : 'text-gray-700'} />
                    {favorites.length > 0 && (
                      <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-[8px] text-white font-medium">{favorites.length}</span>
                      </div>
                    )}
                  </button>
                </>
              )} */}

              {/* Notifications Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative flex items-center justify-center transition-all duration-200"
                >
                  <Bell size={16} className="text-gray-700" />
                  {notificationCount > 0 && (
                    <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-[8px] text-white font-medium">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    </div>
                  )}
                </button>
                <NotificationBell
                  isOpen={showNotifications}
                  setIsOpen={setShowNotifications}
                  onNavigate={(url) => {
                    if (url.startsWith('/')) {
                      const category = url.split('/')[1];
                      setActiveCategory(category || 'chat');
                    }
                  }}
                  onViewAll={() => {
                    setActiveCategory('notifications');
                    setShowNotifications(false);
                  }}
                />
              </div>

              {/* Info Icon - Links to Helpdesk */}
              <button
                onClick={() => setActiveCategory('chat-support')}
                className="flex items-center justify-center transition-all duration-200"
                title="Helpdesk"
              >
                <Info size={16} className="text-gray-700" />
              </button>

              {/* Mail Icon - Opens email to bookings */}
              <a
                href="mailto:bookings@privatecharterx.com"
                className="flex items-center justify-center transition-all duration-200"
                title="Contact Bookings"
              >
                <Mail size={16} className="text-gray-700" />
              </a>

              {/* User Profile Icon */}
              <button
                onClick={() => {
                  setActiveCategoryInternal('dashboard');
                  setDashboardView('profile');
                  window.history.pushState({}, '', '/dashboard/profile');
                }}
                className="flex items-center justify-center transition-all duration-200"
              >
                <User size={16} className="text-gray-700" />
              </button>

              {/* Connect Wallet Button - Compact on mobile */}
              <button
                onClick={() => open()}
                className="px-2 sm:px-4 py-1.5 bg-black text-white rounded-xl text-xs font-medium hover:bg-gray-800 transition-all duration-200 flex items-center gap-1 sm:gap-2"
              >
                <Wallet size={14} />
                {isConnected ? (
                  <span className="hidden sm:inline">{address.slice(0, 6)}...{address.slice(-4)}</span>
                ) : (
                  <span className="hidden sm:inline">Connect</span>
                )}
              </button>

              {/* Web Mode Switcher - Hidden (no longer needed) */}
              {/* <div className="flex items-center gap-0.5 sm:gap-1 border rounded-xl p-0.5 bg-white/20 backdrop-blur-md border-gray-200/30">
                <button
                  onClick={() => handleWebModeSwitch('rws')}
                  disabled={isTransitioning}
                  className={`px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-medium transition-all duration-300 ${
                    webMode === 'rws'
                      ? 'bg-black text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  } ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  RWS
                </button>
                <button
                  onClick={() => handleWebModeSwitch('web3')}
                  disabled={isTransitioning}
                  className={`px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-medium transition-all duration-300 ${
                    webMode === 'web3'
                      ? 'bg-black text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  } ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="hidden sm:inline">Web 3.0</span>
                  <span className="sm:hidden">W3</span>
                </button>
              </div> */}
            </div>
          </div>

          {/* CONTENT AREA */}
          <div className={`flex-1 ${activeCategory === 'chat' ? 'overflow-hidden' : 'overflow-y-auto'} ${
            activeCategory === 'chat' ? 'p-0' :
            activeCategory === 'ground-transport' ? 'p-0 pt-4 sm:pt-4' :
            'px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-8'
          }`}>

          {/* Transition Loader - Video Animation */}
          {isTransitioning && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-md">
              <div className="w-20 h-20">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                >
                  <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/videoExport-2025-10-19@11-32-10.850-540x540@60fps.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          )}

          {/* Dashboard Main View */}
            {!isTransitioning && activeCategory === 'dashboard' && dashboardView === 'overview' && (
              <div className="w-full h-full overflow-y-auto">
                <DashboardOverviewNew user={user} locationData={locationData} weatherData={weatherData} recentRequests={recentRequests} onChatSubmit={onChatSubmit} />
              </div>
            )}
            {!isTransitioning && activeCategory === 'dashboard' && dashboardView !== 'profile' && dashboardView !== 'overview' && (
              <div className="w-full h-full overflow-y-auto">
                <style>{`
                  .dashboard-wrapper-glass {
                    font-family: 'DM Sans', sans-serif !important;
                    height: auto !important;
                    min-height: 100%;
                    overflow: visible !important;
                  }
                  .dashboard-wrapper-glass aside,
                  .dashboard-wrapper-glass header {
                    display: none !important;
                  }
                  .dashboard-wrapper-glass main {
                    width: 100% !important;
                    max-width: 100% !important;
                    padding: 1rem !important;
                    background: transparent !important;
                    overflow: visible !important;
                    height: auto !important;
                  }
                  /* Make all white boxes transparent with grey borders */
                  .dashboard-wrapper-glass .bg-white,
                  .dashboard-wrapper-glass [class*="bg-white"] {
                    background: transparent !important;
                    border: 1px solid rgba(156, 163, 175, 0.3) !important;
                    border-radius: 0.5rem !important;
                    box-shadow: none !important;
                  }
                  /* Hide page titles inside dashboard */
                  .dashboard-wrapper-glass h1,
                  .dashboard-wrapper-glass h2.text-2xl,
                  .dashboard-wrapper-glass h2.text-3xl {
                    display: none !important;
                  }
                  .dashboard-wrapper-glass p.text-gray-600:first-of-type,
                  .dashboard-wrapper-glass p.text-gray-500:first-of-type {
                    display: none !important;
                  }
                  /* Remove ALL internal scrollbars and make content compact */
                  .dashboard-wrapper-glass * {
                    overflow: visible !important;
                  }
                  .dashboard-wrapper-glass [class*="overflow-"],
                  .dashboard-wrapper-glass [class*="h-screen"],
                  .dashboard-wrapper-glass [class*="min-h-screen"] {
                    overflow: visible !important;
                    height: auto !important;
                    min-height: auto !important;
                  }
                  /* Reduce padding and margins for compact layout */
                  .dashboard-wrapper-glass [class*="p-8"],
                  .dashboard-wrapper-glass [class*="py-8"],
                  .dashboard-wrapper-glass [class*="px-8"] {
                    padding: 0.75rem !important;
                  }
                  .dashboard-wrapper-glass [class*="p-6"],
                  .dashboard-wrapper-glass [class*="py-6"],
                  .dashboard-wrapper-glass [class*="px-6"] {
                    padding: 0.5rem !important;
                  }
                  .dashboard-wrapper-glass [class*="gap-8"] {
                    gap: 1rem !important;
                  }
                  .dashboard-wrapper-glass [class*="gap-6"] {
                    gap: 0.75rem !important;
                  }
                `}</style>
                <div className="dashboard-wrapper-glass">
                  <Dashboard initialTab={dashboardView} />
                </div>
              </div>
            )}

          {/* Profile Settings View */}
          {!isTransitioning && activeCategory === 'dashboard' && dashboardView === 'profiles' && (
            <div className="w-full h-full overflow-y-auto">
              <style>{`
                .profile-settings-glass {
                  font-family: 'DM Sans', sans-serif !important;
                }
                /* Make all white boxes transparent with grey borders */
                .profile-settings-glass .bg-white,
                .profile-settings-glass [class*="bg-white"] {
                  background: rgba(255, 255, 255, 0.15) !important;
                  border: 1px solid rgba(156, 163, 175, 0.4) !important;
                  border-radius: 0.75rem !important;
                  backdrop-filter: blur(12px) saturate(180%) !important;
                  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
                }
                /* Style form inputs for glassmorphic design */
                .profile-settings-glass input,
                .profile-settings-glass textarea,
                .profile-settings-glass select {
                  background: rgba(255, 255, 255, 0.1) !important;
                  border: 1px solid rgba(156, 163, 175, 0.3) !important;
                  backdrop-filter: blur(10px) !important;
                  border-radius: 0.5rem !important;
                  transition: all 0.2s ease !important;
                }
                .profile-settings-glass input:focus,
                .profile-settings-glass textarea:focus,
                .profile-settings-glass select:focus {
                  background: rgba(255, 255, 255, 0.2) !important;
                  border-color: rgba(59, 130, 246, 0.6) !important;
                  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
                  outline: none !important;
                }
                /* Style buttons */
                .profile-settings-glass button {
                  backdrop-filter: blur(10px) !important;
                  transition: all 0.2s ease !important;
                }
                .profile-settings-glass button:hover {
                  transform: translateY(-1px) !important;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
                }
                /* Style the main container */
                .profile-settings-glass > div {
                  background: transparent !important;
                }
                /* Style success/error messages */
                .profile-settings-glass .bg-green-50 {
                  background: rgba(34, 197, 94, 0.1) !important;
                  border: 1px solid rgba(34, 197, 94, 0.3) !important;
                  backdrop-filter: blur(10px) !important;
                }
                .profile-settings-glass .bg-red-50 {
                  background: rgba(239, 68, 68, 0.1) !important;
                  border: 1px solid rgba(239, 68, 68, 0.3) !important;
                  backdrop-filter: blur(10px) !important;
                }
              `}</style>
              <div className="profile-settings-glass">
                <ProfileSettings />
              </div>
            </div>
          )}

          {/* Profile Overview View - Crypto Balance Dashboard */}
          {!isTransitioning && activeCategory === 'dashboard' && dashboardView === 'profile' && (
            <div className="w-full h-full overflow-y-auto">
              <CryptoBalanceDashboard setActiveCategory={setActiveCategory} onLogout={handleLogout} />
            </div>
          )}

          {/* LEGACY: My Requests View - Redirect to My Activity */}
          {!isTransitioning && activeCategory === 'requests' && (
            <div className="w-full h-full overflow-y-auto">
              <MyActivityView user={user} />
            </div>
          )}

          {/* OLD My Requests View - DEPRECATED, keeping for reference */}
          {!isTransitioning && activeCategory === 'requests-old-deprecated' && (
            <div className="h-full overflow-y-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">My Requests</h1>
                    <p className="text-xs text-gray-400 mt-0.5">All service requests and inquiries</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveCategory('ai-requests')}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-all flex items-center gap-1.5"
                    >
                      <Sparkles size={14} />
                      AI Requests
                    </button>
                  </div>
                </div>

                {/* Stats - Minimal Inline */}
                {(() => {
                  const allRequests = userRequests.filter(r =>
                    r.type !== 'ai_chat_bulk' &&
                    r.type !== 'custom_request' &&
                    !r.data?.source?.toLowerCase?.()?.includes?.('ai') &&
                    !r.data?.source?.toLowerCase?.()?.includes?.('sphera') &&
                    r.data?.source !== 'ai_chat'
                  );
                  const pendingCount = allRequests.filter(r => r.status === 'pending' || !r.status).length;
                  const completedCount = allRequests.filter(r => r.status === 'completed').length;

                  return (
                    <div className="flex items-center gap-6 mt-4 text-sm">
                      <div>
                        <span className="text-gray-400">Total</span>
                        <span className="ml-2 font-medium text-gray-900">{allRequests.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Pending</span>
                        <span className="ml-2 font-medium text-gray-900">{pendingCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Completed</span>
                        <span className="ml-2 font-medium text-gray-900">{completedCount}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Requests List */}
              <div className="px-6 py-4">
                {(() => {
                  const allRequests = userRequests.filter(r =>
                    r.type !== 'ai_chat_bulk' &&
                    r.type !== 'custom_request' &&
                    !r.data?.source?.toLowerCase?.()?.includes?.('ai') &&
                    !r.data?.source?.toLowerCase?.()?.includes?.('sphera') &&
                    r.data?.source !== 'ai_chat'
                  );

                  if (loadingRequests) {
                    return (
                      <div className="flex items-center justify-center py-16">
                        <div className="w-20 h-20">
                          <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-contain"
                          >
                            <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/videoExport-2025-10-19@11-32-10.850-540x540@60fps.mp4" type="video/mp4" />
                          </video>
                        </div>
                      </div>
                    );
                  }

                  if (allRequests.length === 0) {
                    return (
                      <div className="text-center py-16">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <FolderOpen size={20} className="text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 mb-4">No requests yet</p>
                        <button
                          onClick={() => setActiveCategory('jets')}
                          className="px-4 py-2 bg-white/60 text-gray-700 text-sm rounded-lg hover:bg-white/80 transition-all inline-flex items-center gap-2 border border-gray-200/50"
                          style={{ backdropFilter: 'blur(8px)' }}
                        >
                          <Plane size={14} className="text-gray-500" />
                          Browse Services
                        </button>
                      </div>
                    );
                  }

                  const totalPages = Math.ceil(allRequests.length / REQUESTS_PER_PAGE);
                  const paginatedRequests = allRequests.slice(
                    (requestsPage - 1) * REQUESTS_PER_PAGE,
                    requestsPage * REQUESTS_PER_PAGE
                  );

                  return (
                    <div className="space-y-2">
                      {/* Pagination Info */}
                      {allRequests.length > REQUESTS_PER_PAGE && (
                        <div className="text-xs text-gray-400 pb-2">
                          Showing {Math.min((requestsPage - 1) * REQUESTS_PER_PAGE + 1, allRequests.length)}-{Math.min(requestsPage * REQUESTS_PER_PAGE, allRequests.length)} of {allRequests.length}
                        </div>
                      )}

                      {paginatedRequests.map((request) => {
                        const isExpanded = expandedRequestId === request.id;
                        const d = request.data || {};

                        // Extract normalized data from various field names
                        const fromLocation = d.from || d.from_city || d.pickupLocation || d.departure_display || d.origin || (d.departure?.name);
                        const toLocation = d.to || d.to_city || d.dropoffLocation || d.destination_display || d.destination || (d.destination?.name);
                        const fromIata = d.from_iata || d.departure?.code;
                        const toIata = d.to_iata || d.destination?.code;
                        const flightRoute = d.flight_route || (fromLocation && toLocation ? `${fromLocation} → ${toLocation}` : null);
                        const aircraft = d.aircraft || d.aircraft_model || d.aircraft_type || d.helicopter_name || d.helicopter_type || d.carName;
                        const manufacturer = d.manufacturer;
                        const category = d.category || d.type || d.package_type;
                        const departureDate = d.departure_date || d.pickupDate || d.date || d.start_date || d.preferred_date;
                        const departureTime = d.departure_time || d.pickupTime;
                        const passengers = d.passengers || d.capacity || d.guests;
                        const durationHours = d.duration_hours || d.flight_duration || d.duration;
                        const totalPrice = d.total_price || d.price || d.base_price || d.estimated_price || d.estimated_total || d.priceMin;
                        // Extras/Addons
                        const luggage = d.luggage;
                        const hasPet = d.has_pet;
                        const hasNFT = d.has_nft;
                        const nftDiscount = d.nft_discount;
                        const range = d.range;
                        const hourlyRate = d.hourly_rate || d.price_per_hour;
                        const location = d.location;
                        const preferredPayment = d.preferred_payment;
                        const specialRequests = d.special_requests;
                        // NFT Free Flight check
                        const isNFTFreeFlight = request.type === 'nft_free_flight' || d.is_free === true;
                        // SPV Formation check
                        const isSPVFormation = request.type === 'spv_formation';
                        // SPV specific fields (form uses camelCase)
                        const spvCompanyName = d.companyName || d.company_name;
                        const spvJurisdiction = d.jurisdiction;
                        const spvBusinessActivity = d.businessActivity || d.business_activity;
                        const spvTier = d.selectedTier;
                        const spvDirectors = d.numberOfDirectors || d.directors?.length;
                        const spvShareholders = d.numberOfShareholders || d.shareholders?.length;
                        const spvJurisdictionDetails = d.jurisdictionDetails;

                        const requestTitle = request.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Request';
                        const getTypeIcon = (type) => {
                          if (type?.includes('jet') || type?.includes('aircraft')) return '✈️';
                          if (type?.includes('helicopter')) return '🚁';
                          if (type?.includes('yacht')) return '🛥️';
                          if (type?.includes('car') || type?.includes('vehicle') || type?.includes('luxury_car')) return '🚗';
                          if (type?.includes('taxi') || type?.includes('transfer') || type?.includes('ground')) return '🚐';
                          if (type?.includes('empty') || type?.includes('leg')) return '🛩️';
                          if (type?.includes('adventure')) return '🏔️';
                          if (type?.includes('spv')) return '🏢';
                          return '📋';
                        };

                        return (
                          <div
                            key={request.id}
                            className={`rounded-xl overflow-hidden transition-all ${
                              isNFTFreeFlight
                                ? 'bg-green-50 border-2 border-green-400 ring-2 ring-green-100'
                                : 'bg-white border border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            {/* NFT Free Flight Badge */}
                            {isNFTFreeFlight && (
                              <div className="bg-green-500 text-white px-3 py-1 text-xs font-semibold flex items-center gap-1.5">
                                <span>🎁</span>
                                <span>NFT Free Flight Redemption</span>
                              </div>
                            )}
                            {/* Main Row */}
                            <div
                              className="px-4 py-3 flex items-center gap-4 cursor-pointer"
                              onClick={() => setExpandedRequestId(isExpanded ? null : request.id)}
                            >
                              {/* Icon */}
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                                isNFTFreeFlight ? 'bg-green-200' : 'bg-gray-100'
                              }`}>
                                {isNFTFreeFlight ? '🎁' : getTypeIcon(request.type)}
                              </div>

                              {/* Title & Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={`text-sm font-medium truncate ${isNFTFreeFlight ? 'text-green-800' : 'text-gray-900'}`}>
                                    {isNFTFreeFlight ? 'Free Empty Leg' : requestTitle}
                                  </p>
                                  {isNFTFreeFlight && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-600 text-white">
                                      FREE
                                    </span>
                                  )}
                                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                                    request.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                    request.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                                    request.status === 'cancelled' ? 'bg-gray-50 text-gray-400' :
                                    'bg-amber-50 text-amber-600'
                                  }`}>
                                    {request.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Pending'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                                  <span>
                                    {new Date(request.created_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </span>
                                  {isSPVFormation && spvJurisdiction && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate">{spvJurisdiction}</span>
                                      {spvCompanyName && (
                                        <>
                                          <span>•</span>
                                          <span className="truncate">{spvCompanyName}</span>
                                        </>
                                      )}
                                    </>
                                  )}
                                  {!isSPVFormation && flightRoute && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate">{flightRoute}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Price if available */}
                              {(totalPrice || isNFTFreeFlight) && (
                                <div className="text-right flex-shrink-0">
                                  {isNFTFreeFlight ? (
                                    <p className="text-sm font-bold text-green-600">FREE</p>
                                  ) : (
                                    <p className="text-sm font-semibold text-gray-900">
                                      ${typeof totalPrice === 'number' ? totalPrice.toLocaleString() : totalPrice}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Expand Icon */}
                              <ChevronDown
                                size={16}
                                className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="px-4 pb-4 pt-2 border-t border-gray-50">
                                {/* SPV Formation Details */}
                                {isSPVFormation && (
                                  <>
                                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                      <p className="text-[10px] text-gray-400 uppercase mb-2">Company Information</p>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <p className="text-[10px] text-gray-400">Company Name</p>
                                          <p className="text-sm font-medium text-gray-900">{spvCompanyName || 'Not specified'}</p>
                                        </div>
                                        <div>
                                          <p className="text-[10px] text-gray-400">Jurisdiction</p>
                                          <p className="text-sm font-medium text-gray-900">{spvJurisdiction || 'Not specified'}</p>
                                        </div>
                                        <div>
                                          <p className="text-[10px] text-gray-400">Business Activity</p>
                                          <p className="text-sm font-medium text-gray-900">{spvBusinessActivity || 'Not specified'}</p>
                                        </div>
                                        <div>
                                          <p className="text-[10px] text-gray-400">Service Tier</p>
                                          <p className="text-sm font-medium text-gray-900 capitalize">{spvTier || 'Standard'}</p>
                                        </div>
                                      </div>
                                    </div>
                                    {spvJurisdictionDetails && (
                                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                        <p className="text-[10px] text-gray-400 uppercase mb-2">Jurisdiction Details</p>
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <p className="text-[10px] text-gray-400">Tax Rate</p>
                                            <p className="text-sm font-medium text-gray-900">{spvJurisdictionDetails.tax || 'N/A'}</p>
                                          </div>
                                          <div>
                                            <p className="text-[10px] text-gray-400">Formation Duration</p>
                                            <p className="text-sm font-medium text-gray-900">{spvJurisdictionDetails.duration || 'N/A'}</p>
                                          </div>
                                        </div>
                                        {spvJurisdictionDetails.description && (
                                          <div className="mt-2">
                                            <p className="text-[10px] text-gray-400">Description</p>
                                            <p className="text-xs text-gray-600">{spvJurisdictionDetails.description}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      {spvDirectors && (
                                        <div className="px-2 py-1 bg-gray-50 rounded text-xs text-gray-600 flex items-center gap-1">
                                          <Users size={10} className="text-gray-400" />
                                          {spvDirectors} Director{spvDirectors > 1 ? 's' : ''}
                                        </div>
                                      )}
                                      {spvShareholders && (
                                        <div className="px-2 py-1 bg-gray-50 rounded text-xs text-gray-600 flex items-center gap-1">
                                          <Users size={10} className="text-gray-400" />
                                          {spvShareholders} Shareholder{spvShareholders > 1 ? 's' : ''}
                                        </div>
                                      )}
                                      {d.needsNomineeDirector && (
                                        <span className="px-2 py-1 bg-blue-50 rounded text-xs text-blue-700">Nominee Director</span>
                                      )}
                                      {d.needsNomineeShareholder && (
                                        <span className="px-2 py-1 bg-blue-50 rounded text-xs text-blue-700">Nominee Shareholder</span>
                                      )}
                                      {d.needsBankAccountGuarantee && (
                                        <span className="px-2 py-1 bg-blue-50 rounded text-xs text-blue-700">Bank Account</span>
                                      )}
                                      {d.needsExpressService && (
                                        <span className="px-2 py-1 bg-amber-50 rounded text-xs text-amber-700">Express Service</span>
                                      )}
                                    </div>
                                  </>
                                )}

                                {/* Route Display - Full Locations with IATA */}
                                {!isSPVFormation && (fromLocation || toLocation) && (
                                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="text-[10px] text-gray-400 uppercase mb-0.5">Departure</p>
                                        <p className="text-sm font-medium text-gray-900">{fromLocation || 'N/A'}</p>
                                        {fromIata && <p className="text-xs text-gray-500">{fromIata}</p>}
                                      </div>
                                      <div className="px-3">
                                        <div className="w-8 h-[1px] bg-gray-300 relative">
                                          <Plane size={12} className="absolute -top-[6px] left-1/2 -translate-x-1/2 text-gray-400" />
                                        </div>
                                      </div>
                                      <div className="flex-1 text-right">
                                        <p className="text-[10px] text-gray-400 uppercase mb-0.5">Arrival</p>
                                        <p className="text-sm font-medium text-gray-900">{toLocation || 'N/A'}</p>
                                        {toIata && <p className="text-xs text-gray-500">{toIata}</p>}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Aircraft/Vehicle Info */}
                                {!isSPVFormation && (aircraft || manufacturer || category) && (
                                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                    <p className="text-[10px] text-gray-400 uppercase mb-1">Aircraft / Vehicle</p>
                                    <p className="text-sm font-medium text-gray-900">
                                      {manufacturer && `${manufacturer} `}{aircraft || 'N/A'}
                                    </p>
                                    {category && <p className="text-xs text-gray-500">{category}</p>}
                                    {range && <p className="text-xs text-gray-500">Range: {range}</p>}
                                    {hourlyRate && <p className="text-xs text-gray-500">Rate: ${hourlyRate.toLocaleString()}/hr</p>}
                                  </div>
                                )}

                                {/* Quick Info Badges */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {departureDate && (
                                    <div className="px-2 py-1 bg-gray-50 rounded text-xs text-gray-600 flex items-center gap-1">
                                      <Calendar size={10} className="text-gray-400" />
                                      {departureDate === 'Now' ? 'Now' : new Date(departureDate).toLocaleDateString()}
                                      {departureTime && departureTime !== 'Now' && ` ${departureTime}`}
                                    </div>
                                  )}
                                  {passengers && (
                                    <div className="px-2 py-1 bg-gray-50 rounded text-xs text-gray-600 flex items-center gap-1">
                                      <Users size={10} className="text-gray-400" />
                                      {passengers} {request.type?.includes('helicopter') ? 'hours' : 'pax'}
                                    </div>
                                  )}
                                  {durationHours && (
                                    <div className="px-2 py-1 bg-gray-50 rounded text-xs text-gray-600 flex items-center gap-1">
                                      <Clock size={10} className="text-gray-400" />
                                      {durationHours} hours
                                    </div>
                                  )}
                                  {location && (
                                    <div className="px-2 py-1 bg-gray-50 rounded text-xs text-gray-600 flex items-center gap-1">
                                      <MapPin size={10} className="text-gray-400" />
                                      {location}
                                    </div>
                                  )}
                                </div>

                                {/* Addons/Extras */}
                                {(luggage || hasPet || hasNFT || nftDiscount || preferredPayment) && (
                                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                    <p className="text-[10px] text-gray-400 uppercase mb-2">Extras & Preferences</p>
                                    <div className="flex flex-wrap gap-2">
                                      {luggage > 0 && (
                                        <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700">
                                          🧳 {luggage} luggage
                                        </span>
                                      )}
                                      {hasPet && (
                                        <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700">
                                          🐾 Pet included
                                        </span>
                                      )}
                                      {hasNFT && (
                                        <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700">
                                          💎 NFT Holder
                                        </span>
                                      )}
                                      {nftDiscount > 0 && (
                                        <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700">
                                          -{nftDiscount}% NFT Discount
                                        </span>
                                      )}
                                      {preferredPayment && (
                                        <span className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                                          💳 {preferredPayment === 'crypto' ? 'Crypto' : preferredPayment === 'bank_transfer' ? 'Bank Transfer' : preferredPayment === 'credit_card' ? 'Credit Card' : preferredPayment}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Special Requests */}
                                {specialRequests && (
                                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                    <p className="text-[10px] text-gray-400 uppercase mb-1">Special Requests</p>
                                    <p className="text-xs text-gray-700">{specialRequests}</p>
                                  </div>
                                )}

                                {/* Price Breakdown - Light Grey Monochromatic */}
                                {(d.base_price || d.platform_fee || d.vat_amount) && (
                                  <div className="bg-gray-100 rounded-lg p-3 mb-3">
                                    <p className="text-[10px] text-gray-500 uppercase mb-2">Price Breakdown</p>
                                    <div className="space-y-1 text-xs">
                                      {d.base_price > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Base Price</span>
                                          <span className="text-gray-800">${d.base_price.toLocaleString()}</span>
                                        </div>
                                      )}
                                      {d.platform_fee > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Platform Fee ({d.platform_fee_percent || 2.5}%)</span>
                                          <span className="text-gray-800">+${d.platform_fee.toLocaleString()}</span>
                                        </div>
                                      )}
                                      {d.vat_amount > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">VAT ({d.vat_percent || 8.1}% CH)</span>
                                          <span className="text-gray-800">+${d.vat_amount.toLocaleString()}</span>
                                        </div>
                                      )}
                                      {d.total_price > 0 && (
                                        <div className="flex justify-between pt-2 border-t border-gray-300">
                                          <span className="text-gray-700 font-medium">Total</span>
                                          <span className="text-gray-900 font-bold">${d.total_price.toLocaleString()}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Notes/Details */}
                                {(d.notes || d.extraNotes || d.special_requests) && (
                                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                    <p className="text-[10px] text-gray-400 uppercase mb-1">Notes</p>
                                    <p className="text-xs text-gray-700">{d.notes || d.extraNotes || d.special_requests}</p>
                                  </div>
                                )}

                                {/* Admin Notes */}
                                {request.admin_notes && (
                                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                                    <p className="text-[10px] text-blue-600 uppercase mb-1">Admin Response</p>
                                    <p className="text-xs text-blue-800">{request.admin_notes}</p>
                                  </div>
                                )}

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-2">
                                  <span className="text-[10px] text-gray-300 font-mono">{request.id?.slice(0, 8)}</span>
                                  <span className="text-[10px] text-gray-400">
                                    {new Date(request.created_at).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Pagination Controls */}
                      {allRequests.length > REQUESTS_PER_PAGE && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                          <button
                            onClick={() => setRequestsPage(p => Math.max(1, p - 1))}
                            disabled={requestsPage === 1}
                            className="px-2.5 py-1 text-xs font-medium rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            Prev
                          </button>
                          <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .slice(0, 5)
                              .map(page => (
                                <button
                                  key={page}
                                  onClick={() => setRequestsPage(page)}
                                  className={`w-6 h-6 text-xs font-medium rounded transition-colors ${
                                    requestsPage === page
                                      ? 'bg-gray-900 text-white'
                                      : 'hover:bg-gray-100 text-gray-500'
                                  }`}
                                >
                                  {page}
                                </button>
                              ))}
                          </div>
                          <button
                            onClick={() => setRequestsPage(p => Math.min(totalPages, p + 1))}
                            disabled={requestsPage >= totalPages}
                            className="px-2.5 py-1 text-xs font-medium rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* LEGACY: AI Requests View - Redirect to My Activity */}
          {!isTransitioning && activeCategory === 'ai-requests' && (
            <div className="w-full h-full overflow-y-auto">
              <MyActivityView user={user} initialFilter="ai" />
            </div>
          )}

          {/* UNIFIED: My Activity View - All bookings, requests, and orders in one place */}
          {!isTransitioning && activeCategory === 'my-activity' && (
            <div className="w-full h-full overflow-y-auto">
              <MyActivityView user={user} />
            </div>
          )}

          {/* My Bookings View - Adventures and Commercial Flights */}
          {!isTransitioning && activeCategory === 'bookings' && (
            <div className="w-full h-full overflow-y-auto">
              <MyBookingsView user={user} />
            </div>
          )}

          {/* Support Messages View */}
          {!isTransitioning && activeCategory === 'support-messages' && (
            <div className="w-full h-full">
              <SupportMessagesView />
            </div>
          )}

          {/* Transactions View */}
          {!isTransitioning && activeCategory === 'transactions' && (
            <div className="w-full h-full overflow-y-auto">
              <TransactionsPage />
            </div>
          )}

          {/* Calendar View */}
          {!isTransitioning && activeCategory === 'calendar' && (
            <div className="w-full h-full overflow-y-auto">
              <CalendarView user={user} />
            </div>
          )}

          {/* Favourites View */}
          {!isTransitioning && activeCategory === 'favourites' && (
            <div className="w-full h-full overflow-y-auto">
              <FavouritesView user={user} onAddToCalendar={(favourite) => {
                // Add to calendar functionality
                setActiveCategory('calendar');
              }} />
            </div>
          )}

          {/* Search Index Page */}
          {!isTransitioning && activeCategory === 'search-index' && (
            <div className="w-full h-full overflow-y-auto">
              <SearchIndexPage
                query={searchQuery}
                onNavigate={(category) => setActiveCategory(category)}
                onSelectItem={(category, item) => {
                  // Navigate to the specific item's detail page
                  if (category === 'jets') {
                    setSelectedJet(item);
                    setShowJetDetail(true);
                    setActiveCategory('jets');
                  } else if (category === 'emptyLegs') {
                    setActiveCategory('empty-legs');
                  } else if (category === 'helicopters') {
                    setActiveCategory('helicopter');
                  } else if (category === 'luxuryCars') {
                    setSelectedLuxuryCar(item);
                    setShowLuxuryCarDetail(true);
                    setActiveCategory('luxury-cars');
                  } else if (category === 'adventures') {
                    setActiveCategory('adventures');
                  } else if (category === 'events') {
                    setActiveCategory('assets'); // Events & Sports
                  } else if (category === 'co2Certificates') {
                    setActiveCategory('co2-saf');
                  }
                }}
              />
            </div>
          )}

          {/* Chat Requests View */}
          {!isTransitioning && activeCategory === 'chat-requests' && (
            <div className="w-full h-full overflow-y-auto">
              <ChatRequestsView userId={user?.id} user={user} />
            </div>
          )}

          {/* Subscription Management View - Legacy (redirects to new) */}
          {!isTransitioning && activeCategory === 'subscription' && (
            <div className="w-full h-full overflow-y-auto">
              <Subscriptionplans onClose={() => setActiveCategory('chat')} />
            </div>
          )}

          {/* Subscriptions Manage Plan View */}
          {!isTransitioning && activeCategory === 'subscriptions' && (
            <div className="w-full h-full overflow-y-auto">
              <SubscriptionManagement onNavigateToPlans={() => setActiveCategory('subscription-plans')} />
            </div>
          )}

          {/* Subscription Plans & Pricing View */}
          {!isTransitioning && activeCategory === 'subscription-plans' && (
            <div className="w-full h-full overflow-y-auto">
              <Subscriptionplans onClose={() => setActiveCategory('subscriptions')} />
            </div>
          )}

          {/* Subscription Success View - After Stripe Checkout */}
          {!isTransitioning && activeCategory === 'subscription-success' && (
            <div className="w-full h-full overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 py-12">
                {/* Success Card */}
                <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-8 text-center">
                  {/* Success Icon */}
                  <div className="w-20 h-20 bg-white/70 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200/50" style={{ backdropFilter: 'blur(8px)' }}>
                    <Check size={40} className="text-emerald-500" />
                  </div>

                  {/* Title */}
                  <h1 className="text-3xl font-light text-gray-900 mb-3">
                    Subscription Activated
                  </h1>

                  {/* Subtitle */}
                  <p className="text-gray-500 mb-8">
                    Welcome to the <span className="font-medium capitalize">{successSubscriptionTier}</span> plan.
                    Your AI Chat and premium features are now unlocked.
                  </p>

                  {/* Benefits Card */}
                  <div className="bg-gray-50/80 rounded-xl p-6 mb-8 text-left border border-gray-100">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Your Benefits</h3>
                    <ul className="space-y-4">
                      <li className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-white/60 rounded-full flex items-center justify-center flex-shrink-0 border border-gray-200/50">
                          <MessageSquare size={16} className="text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {successSubscriptionTier === 'elite' ? 'Unlimited' : successSubscriptionTier === 'traveller' ? '10' : '5'} AI Conversations
                          </div>
                          <div className="text-sm text-gray-500">Per month, resets automatically</div>
                        </div>
                      </li>
                      <li className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-white/60 rounded-full flex items-center justify-center flex-shrink-0 border border-gray-200/50">
                          <Zap size={16} className="text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {successSubscriptionTier === 'explorer' ? 'Basic Services' : 'Break the Price'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {successSubscriptionTier === 'explorer' ? 'Empty legs, restaurants, ground transport' : 'Submit quotes for better pricing'}
                          </div>
                        </div>
                      </li>
                      <li className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-white/60 rounded-full flex items-center justify-center flex-shrink-0 border border-gray-200/50">
                          <Crown size={16} className="text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {successSubscriptionTier === 'elite' ? '24/7 Phone Support' : successSubscriptionTier === 'traveller' ? 'Priority Support' : 'Email Support'}
                          </div>
                          <div className="text-sm text-gray-500">Dedicated assistance when you need it</div>
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* PDF Confirmation Notice */}
                  <div className="bg-white/60 rounded-xl p-4 mb-6 text-left border border-gray-200/50" style={{ backdropFilter: 'blur(8px)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/70 rounded-full flex items-center justify-center flex-shrink-0 border border-gray-200/50">
                        <FileText size={16} className="text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">Confirmation PDF</div>
                        <div className="text-xs text-gray-500">
                          {subscriptionPdfGenerating
                            ? 'Generating your confirmation...'
                            : subscriptionPdfSent
                            ? 'Downloaded & sent to your email'
                            : 'Your confirmation is being prepared'}
                        </div>
                      </div>
                      {subscriptionPdfSent && (
                        <button
                          onClick={() => {
                            const planDetails = {
                              explorer: { name: 'Explorer', price: 99, features: ['5 AI Conversations/month', '10 messages per conversation', 'Break the Price feature', 'Email Support'] },
                              traveller: { name: 'Traveller', price: 199, features: ['10 AI Conversations/month', '25 messages per conversation', 'Break the Price feature', 'Priority Support', 'Dedicated Manager'] },
                              elite: { name: 'Elite Club', price: 999, features: ['Unlimited AI Conversations', 'Unlimited messages per chat', 'Unlimited Break the Price', '24/7 Concierge Service'] }
                            };
                            const plan = planDetails[successSubscriptionTier] || planDetails.explorer;
                            const subscriptionData = {
                              id: `SUB-${Date.now()}`,
                              tier: successSubscriptionTier,
                              plan_name: plan.name,
                              price: plan.price,
                              currency: 'USD',
                              billing_period: 'monthly',
                              status: 'active',
                              start_date: new Date().toISOString(),
                              features: plan.features,
                              user: {
                                name: user?.name || user?.first_name || user?.email?.split('@')[0] || 'Valued Member',
                                email: user?.email
                              },
                              payment_method: 'card'
                            };
                            const pdfBlob = generateSubscriptionConfirmationPDF(subscriptionData);
                            const filename = `PrivateCharterX_Subscription_${successSubscriptionTier.toUpperCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
                            downloadPDF(pdfBlob, filename);
                          }}
                          className="px-3 py-1.5 text-xs font-medium bg-white/60 text-gray-700 rounded-lg hover:bg-white/80 transition-colors border border-gray-200/50"
                          style={{ backdropFilter: 'blur(8px)' }}
                        >
                          Download Again
                        </button>
                      )}
                      {subscriptionPdfGenerating && (
                        <Loader2 size={18} className="text-gray-600 animate-spin" />
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => setActiveCategory('subscriptions')}
                      className="flex-1 px-6 py-3 bg-white/60 text-gray-700 rounded-xl hover:bg-white/80 transition-colors font-medium border border-gray-200/50"
                      style={{ backdropFilter: 'blur(8px)' }}
                    >
                      Manage Plan
                    </button>
                    <button
                      onClick={() => setActiveCategory('ai-chat')}
                      className="flex-1 px-6 py-3 bg-white/60 text-gray-700 rounded-xl hover:bg-white/80 transition-colors font-medium flex items-center justify-center gap-2 border border-gray-200/50"
                      style={{ backdropFilter: 'blur(8px)' }}
                    >
                      <Sparkles size={18} className="text-gray-500" />
                      Start AI Chat
                    </button>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveCategory('chat')}
                    className="p-4 bg-white/30 backdrop-blur-sm border border-gray-200/50 rounded-xl hover:bg-white/50 transition-colors text-left"
                  >
                    <Home size={20} className="text-gray-600 mb-2" />
                    <div className="font-medium text-gray-900">Dashboard</div>
                    <div className="text-xs text-gray-500">Return to overview</div>
                  </button>
                  <button
                    onClick={() => setActiveCategory('my-requests')}
                    className="p-4 bg-white/30 backdrop-blur-sm border border-gray-200/50 rounded-xl hover:bg-white/50 transition-colors text-left"
                  >
                    <History size={20} className="text-gray-600 mb-2" />
                    <div className="font-medium text-gray-900">My Requests</div>
                    <div className="text-xs text-gray-500">View your bookings</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Referral Program View */}
          {!isTransitioning && activeCategory === 'referral' && (
            <div className="w-full h-full overflow-y-auto">
              <ReferralPage 
                referralCode={user?.referral_code || 'SPHERA2025'}
                successfulReferrals={user?.successful_referrals || 0}
                totalChatsEarned={(user?.successful_referrals || 0) * 2}
                userName={user?.name || user?.email?.split('@')[0] || 'Guest'}
              />
            </div>
          )}

          {/* CO2 Certificates View */}
          {!isTransitioning && activeCategory === 'co2-certificates' && (
            <div className="w-full h-full overflow-y-auto">
              <style>{`
                .dashboard-wrapper-glass {
                  font-family: 'DM Sans', sans-serif !important;
                  height: auto !important;
                  min-height: 100%;
                  overflow: visible !important;
                }
                .dashboard-wrapper-glass aside,
                .dashboard-wrapper-glass header {
                  display: none !important;
                }
                .dashboard-wrapper-glass main {
                  width: 100% !important;
                  max-width: 100% !important;
                  padding: 1rem !important;
                  background: transparent !important;
                  overflow: visible !important;
                  height: auto !important;
                }
                .dashboard-wrapper-glass .bg-white,
                .dashboard-wrapper-glass [class*="bg-white"] {
                  background: transparent !important;
                  border: 1px solid rgba(156, 163, 175, 0.3) !important;
                  border-radius: 0.5rem !important;
                  box-shadow: none !important;
                }
                .dashboard-wrapper-glass h1,
                .dashboard-wrapper-glass h2.text-2xl,
                .dashboard-wrapper-glass h2.text-3xl {
                  display: none !important;
                }
                .dashboard-wrapper-glass p.text-gray-600:first-of-type,
                .dashboard-wrapper-glass p.text-gray-500:first-of-type {
                  display: none !important;
                }
                .dashboard-wrapper-glass * {
                  overflow: visible !important;
                }
                .dashboard-wrapper-glass [class*="overflow-"],
                .dashboard-wrapper-glass [class*="h-screen"],
                .dashboard-wrapper-glass [class*="min-h-screen"] {
                  overflow: visible !important;
                  height: auto !important;
                  min-height: auto !important;
                }
                .dashboard-wrapper-glass [class*="p-8"],
                .dashboard-wrapper-glass [class*="py-8"],
                .dashboard-wrapper-glass [class*="px-8"] {
                  padding: 0.75rem !important;
                }
                .dashboard-wrapper-glass [class*="p-6"],
                .dashboard-wrapper-glass [class*="py-6"],
                .dashboard-wrapper-glass [class*="px-6"] {
                  padding: 0.5rem !important;
                }
                .dashboard-wrapper-glass [class*="gap-8"] {
                  gap: 1rem !important;
                }
                .dashboard-wrapper-glass [class*="gap-6"] {
                  gap: 0.75rem !important;
                }
              `}</style>
              <div className="dashboard-wrapper-glass">
                <Dashboard initialTab="co2-certificates" />
              </div>
            </div>
          )}

          {/* FAQ / Helpdesk View */}
          {!isTransitioning && activeCategory === 'chat-support' && (
            <div className="w-full h-full overflow-y-auto">
              <HelpdeskInlineView setActiveCategory={setActiveCategory} />
            </div>
          )}

          {/* NFT Marketplace View */}
          {!isTransitioning && activeCategory === 'nft-marketplace' && (
            <NFTMarketplace
              onCreateNFT={() => {
                setActiveCategory('tokenization');
              }}
            />
          )}

          {/* Live Support Admin Dashboard */}
          {!isTransitioning && activeCategory === 'live-support-admin' && isAdmin && (
            <div className="w-full h-full">
              <AdminSupportDashboard onBack={() => setActiveCategory('chat')} />
            </div>
          )}

          {/* KYC Verification View */}
          {!isTransitioning && activeCategory === 'kyc-verification' && (
            <div className="w-full h-full overflow-y-auto p-6">
              <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-lg border border-gray-300 overflow-hidden mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setActiveCategory('chat')}
                        className="w-8 h-8 border border-gray-300 bg-white rounded flex items-center justify-center text-sm hover:bg-gray-50"
                      >
                        ←
                      </button>
                      <div>
                        <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">KYC VERIFICATION</span>
                        <h1 className="text-2xl font-semibold text-gray-900 mt-2">Complete Your Verification</h1>
                        <p className="text-sm text-gray-600 mt-1">Required for all users to access platform features</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/35 rounded-lg border border-gray-300/50 p-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                  <KYCForm 
                    onBack={() => setActiveCategory('chat')}
                    onComplete={() => setActiveCategory('chat')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Settings Page */}
          {!isTransitioning && activeCategory === 'settings' && (
            <div className="w-full flex-1 flex flex-col">
              <SettingsPage
                user={user}
                kycStatus={kycStatus}
                setKycStatus={setKycStatus}
                setActiveCategory={setActiveCategory}
              />
              <PageFooter />
            </div>
          )}

          {/* Admin Dashboard */}
          {!isTransitioning && activeCategory === 'admin-dashboard' && (
            <div className="w-full flex-1 flex flex-col">
              <AdminDashboardEnhanced user={user} />
            </div>
          )}

          {/* Home Section - Landing page style with search and category badges */}
          {!isTransitioning && activeCategory === 'home' && (
            <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col px-4 md:px-0">
              <div className="flex flex-col items-center justify-center min-h-[60vh] mt-20">
                {/* Greeting - Same style as Overview */}
                <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-2">
                  Good {(() => {
                    const hour = new Date().getHours();
                    if (hour < 12) return 'morning';
                    if (hour < 18) return 'afternoon';
                    return 'evening';
                  })()}{user ? <span className="text-gray-400">, {user?.first_name || user?.name || 'there'}</span> : ''}
                </h1>
                <p className="text-gray-500 text-base mb-8">
                  Your Private Aviation Concierge
                </p>

                {/* Search Input - Same style as Homepage FloatingSearchModal */}
                <div className="w-full max-w-2xl">
                  <div className="bg-gray-100 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-gray-200">
                    <div className="relative flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-2.5 sm:py-3 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200 focus-within:bg-white focus-within:border-gray-300 transition-all duration-100">
                      {/* Command Icon */}
                      <span className="text-gray-400 text-xs sm:text-sm font-light flex-shrink-0">⌘</span>

                      {/* Input */}
                      <input
                        type="text"
                        value={homeSearchQuery || ''}
                        onChange={(e) => setHomeSearchQuery(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            if (!user) {
                              setShowLoginModal(true);
                            } else {
                              setAiChatQuery(homeSearchQuery || '');
                              setActiveChat('new');
                              setActiveCategory('chat');
                            }
                          }
                        }}
                        placeholder="Where would you like to fly?"
                        className="flex-1 bg-transparent border-none outline-none text-[16px] sm:text-[18px] text-gray-800 font-light tracking-tight placeholder-gray-400"
                      />

                      {/* Send Button */}
                      <button
                        onClick={() => {
                          if (!user) {
                            setShowLoginModal(true);
                          } else {
                            setAiChatQuery(homeSearchQuery || '');
                            setActiveChat('new');
                            setActiveCategory('chat');
                          }
                        }}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-gray-900 text-white flex items-center justify-center transition-all duration-100 hover:bg-black active:scale-95"
                      >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M5 12h14"/>
                          <path d="m12 5 7 7-7 7"/>
                        </svg>
                      </button>
                    </div>

                    {/* Category Badges - Same navigation as Homepage */}
                    <div className="flex gap-1.5 sm:gap-2 mt-2.5 sm:mt-3 items-center overflow-x-auto">
                      {/* Flight Tickets */}
                      <div
                        onClick={() => navigate('/flights')}
                        className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 cursor-pointer select-none border border-gray-300/25 rounded-full transition-all duration-100 hover:border-gray-300/40 hover:bg-white/10 active:scale-95 flex-shrink-0"
                      >
                        <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-gray-900 text-base sm:text-xl font-light">+</div>
                        <span className="text-[11px] sm:text-xs text-gray-700 font-medium tracking-wide whitespace-nowrap">flight tickets</span>
                      </div>

                      {/* Adventures */}
                      <div
                        onClick={() => navigate('/adventures')}
                        className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 cursor-pointer select-none border border-gray-300/25 rounded-full transition-all duration-100 hover:border-gray-300/40 hover:bg-white/10 active:scale-95 flex-shrink-0"
                      >
                        <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-gray-900 text-base sm:text-xl font-light">+</div>
                        <span className="text-[11px] sm:text-xs text-gray-700 font-medium tracking-wide whitespace-nowrap">adventures</span>
                      </div>

                      {/* Charter a Jet - Expandable */}
                      <div
                        onClick={() => setShowHomeCharterFields(!showHomeCharterFields)}
                        className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 cursor-pointer select-none border border-gray-300/25 rounded-full transition-all duration-100 hover:border-gray-300/40 hover:bg-white/10 active:scale-95 flex-shrink-0"
                      >
                        <div className={`w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-gray-900 text-base sm:text-xl font-light transition-transform duration-150 ${showHomeCharterFields ? 'rotate-45' : ''}`}>+</div>
                        <span className="text-[11px] sm:text-xs text-gray-700 font-medium tracking-wide whitespace-nowrap">charter a jet</span>
                      </div>

                      {/* Empty Legs */}
                      <div
                        onClick={() => setActiveCategory('empty-legs')}
                        className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 cursor-pointer select-none border border-gray-300/25 rounded-full transition-all duration-100 hover:border-gray-300/40 hover:bg-white/10 active:scale-95 flex-shrink-0"
                      >
                        <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-gray-900 text-base sm:text-xl font-light">+</div>
                        <span className="text-[11px] sm:text-xs text-gray-700 font-medium tracking-wide whitespace-nowrap">empty legs</span>
                      </div>

                      {/* Helicopters */}
                      <div
                        onClick={() => setActiveCategory('helicopter')}
                        className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 cursor-pointer select-none border border-gray-300/25 rounded-full transition-all duration-100 hover:border-gray-300/40 hover:bg-white/10 active:scale-95 flex-shrink-0"
                      >
                        <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-gray-900 text-base sm:text-xl font-light">+</div>
                        <span className="text-[11px] sm:text-xs text-gray-700 font-medium tracking-wide whitespace-nowrap">helicopters</span>
                      </div>
                    </div>

                    {/* Charter Fields - Expandable (same as homepage) */}
                    <div className={`transition-all duration-150 ${showHomeCharterFields ? 'max-h-[300px] opacity-100 mt-2 sm:mt-3' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                      <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                        {/* Departure Input with Dropdown */}
                        <div className="w-full sm:flex-1 relative">
                          <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-gray-400 focus-within:bg-white transition-all">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="3" />
                              <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                            </svg>
                            <input
                              type="text"
                              value={homeDepartureInput}
                              onChange={(e) => {
                                setHomeDepartureInput(e.target.value);
                                searchHomeDepartureAirports(e.target.value);
                                if (homeDepartureAirport && e.target.value !== `${homeDepartureAirport.city} (${homeDepartureAirport.code})`) {
                                  setHomeDepartureAirport(null);
                                }
                              }}
                              onFocus={() => {
                                setHomeShowDepartureDropdown(true);
                                searchHomeDepartureAirports(homeDepartureInput || '');
                              }}
                              onBlur={() => setTimeout(() => setHomeShowDepartureDropdown(false), 200)}
                              placeholder="From (city/airport)"
                              className="flex-1 bg-transparent border-none outline-none text-[14px] sm:text-[13px] text-gray-800 placeholder-gray-400 min-w-0"
                            />
                            {homeDepartureAirport && (
                              <button
                                onClick={() => { setHomeDepartureAirport(null); setHomeDepartureInput(''); }}
                                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                          {/* Departure Dropdown */}
                          {homeShowDepartureDropdown && showHomeCharterFields && (
                            <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                              {homeIsLoadingDeparture ? (
                                <div className="px-3 py-2 text-center text-gray-500 text-xs">Searching...</div>
                              ) : homeDepartureAirports.length > 0 ? (
                                homeDepartureAirports.map(airport => (
                                  <button
                                    key={airport.code}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleHomeDepartureSelect(airport)}
                                    className="w-full px-3 py-2.5 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0"
                                  >
                                    <div className="font-medium text-gray-900 text-sm truncate">{airport.name}</div>
                                    <div className="text-xs text-gray-400 truncate">{airport.code} • {airport.city}, {airport.country}</div>
                                  </button>
                                ))
                              ) : homeDepartureInput.length >= 2 ? (
                                <div className="px-3 py-2 text-center text-gray-500 text-xs">No airports found</div>
                              ) : (
                                <div className="px-3 py-2 text-center text-gray-400 text-xs">Type to search airports</div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Destination Input with Dropdown */}
                        <div className="w-full sm:flex-1 relative">
                          <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-gray-400 focus-within:bg-white transition-all">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <input
                              type="text"
                              value={homeDestinationInput}
                              onChange={(e) => {
                                setHomeDestinationInput(e.target.value);
                                searchHomeDestinationAirports(e.target.value);
                                if (homeDestinationAirport && e.target.value !== `${homeDestinationAirport.city} (${homeDestinationAirport.code})`) {
                                  setHomeDestinationAirport(null);
                                }
                              }}
                              onFocus={() => {
                                setHomeShowDestinationDropdown(true);
                                searchHomeDestinationAirports(homeDestinationInput || '');
                              }}
                              onBlur={() => setTimeout(() => setHomeShowDestinationDropdown(false), 200)}
                              placeholder="To (city/airport)"
                              className="flex-1 bg-transparent border-none outline-none text-[14px] sm:text-[13px] text-gray-800 placeholder-gray-400 min-w-0"
                            />
                            {homeDestinationAirport && (
                              <button
                                onClick={() => { setHomeDestinationAirport(null); setHomeDestinationInput(''); }}
                                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                          {/* Destination Dropdown */}
                          {homeShowDestinationDropdown && showHomeCharterFields && (
                            <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                              {homeIsLoadingDestination ? (
                                <div className="px-3 py-2 text-center text-gray-500 text-xs">Searching...</div>
                              ) : homeDestinationAirports.length > 0 ? (
                                homeDestinationAirports.map(airport => (
                                  <button
                                    key={airport.code}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleHomeDestinationSelect(airport)}
                                    className="w-full px-3 py-2.5 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0"
                                  >
                                    <div className="font-medium text-gray-900 text-sm truncate">{airport.name}</div>
                                    <div className="text-xs text-gray-400 truncate">{airport.code} • {airport.city}, {airport.country}</div>
                                  </button>
                                ))
                              ) : homeDestinationInput.length >= 2 ? (
                                <div className="px-3 py-2 text-center text-gray-500 text-xs">No airports found</div>
                              ) : (
                                <div className="px-3 py-2 text-center text-gray-400 text-xs">Type to search airports</div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Search Button */}
                        <button
                          onClick={handleHomeCharterJetSubmit}
                          disabled={!homeDepartureAirport || !homeDestinationAirport}
                          className="w-full sm:w-auto px-5 py-2.5 bg-gray-900 text-white rounded-xl text-[14px] sm:text-xs font-medium transition-all duration-100 hover:bg-black active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M5 12h14m-7-7 7 7-7 7" />
                          </svg>
                          Search Jets
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Disclaimer */}
                <p className="mt-6 text-[10px] text-gray-400 text-center max-w-md">
                  This is an AI assistant. We monitor all bookings and requests, but AI can make mistakes. Please verify important details.
                </p>
              </div>
              <PageFooter />
            </div>
          )}

          {/* Partner Dashboard - Show for partner users */}
          {!isTransitioning && activeCategory === 'overview' && user?.user_role === 'partner' && (
            <PartnerDashboard user={user} onNavigate={setActiveCategory} />
          )}


          {/* Tokenize Asset Flow */}
          {!isTransitioning && activeCategory === 'tokenization' && (
            <TokenizeAssetFlow onBack={(destination) => setActiveCategory(destination || 'chat')} user={user} />
          )}

          {/* My Tokenized Assets View */}
          {!isTransitioning && activeCategory === 'my-tokenized-assets' && (
            <div className="w-full h-full overflow-y-auto p-8">
              <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900 tracking-tighter mb-2 font-['DM_Sans']">My Tokenized Assets</h1>
                  <p className="text-gray-600">View and manage your tokenization requests</p>
                </div>

                {/* Tokenization List */}
                {loadingTokenizations ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-20 h-20">
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-contain"
                      >
                        <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/videoExport-2025-10-19@11-32-10.850-540x540@60fps.mp4" type="video/mp4" />
                      </video>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* User's Tokenizations */}
                    {userTokenizations.map((token) => {
                      const statusColors = {
                        'draft': 'bg-gray-100 text-gray-700',
                        'submitted': 'bg-yellow-100 text-yellow-700',
                        'approved': 'bg-green-100 text-green-700',
                        'rejected': 'bg-red-100 text-red-700',
                        'cancelled': 'bg-gray-100 text-gray-600'
                      };

                      return (
                        <div key={token.id} className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                              {token.logo_url ? (
                                <img src={token.logo_url} alt={token.asset_name} className="w-full h-full object-cover" />
                              ) : (
                                <img src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/PrivatecharterX_logo_vectorized.glb.png" alt="PCX" className="w-8 h-8 object-contain" />
                              )}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[token.status] || 'bg-gray-100 text-gray-700'}`}>
                              {token.status || 'draft'}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {token.asset_name || 'Untitled Asset'}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">
                            {token.token_type === 'security' ? 'STO (Security Token)' : token.token_type === 'utility' ? 'UTO (Utility Token)' : 'Token'}
                          </p>
                          {token.token_symbol && (
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                ${token.token_symbol}
                              </span>
                              {token.total_supply && (
                                <span className="text-xs text-gray-500">
                                  Supply: {token.total_supply.toLocaleString()}
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mb-4">
                            {token.status === 'draft' ? 'Last saved' : token.status === 'submitted' ? 'Submitted' : 'Updated'}: {new Date(token.updated_at).toLocaleDateString()}
                          </p>
                          {/* Timeline for Approved Tokenizations */}
                          {token.status === 'approved' && token.marketplace_launch_at && (
                            <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="text-xs font-semibold text-green-900 mb-2 flex items-center gap-1">
                                <Clock size={12} />
                                Launch Timeline
                              </div>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-green-700">Approved</span>
                                  <span className="text-green-900 font-medium">{new Date(token.approved_at).toLocaleDateString()}</span>
                                </div>
                                {token.waitlist_opens_at && (
                                  <div className="flex justify-between">
                                    <span className="text-green-700">Waitlist Opens</span>
                                    <span className="text-green-900 font-medium">{new Date(token.waitlist_opens_at).toLocaleDateString()}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-green-700">Launch Date</span>
                                  <span className="text-green-900 font-bold">{new Date(token.marketplace_launch_at).toLocaleDateString()}</span>
                                </div>
                                <div className="mt-2 pt-2 border-t border-green-300">
                                  <div className="text-xs text-green-700">
                                    {token.token_type === 'utility' ? '🎯 14-day timeline to NFT marketplace' : '⏱️ Estimated 14-30 days depending on partner approvals'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="pt-4 border-t border-gray-200">
                            <button
                              onClick={() => {
                                if (token.status === 'draft') {
                                  // TODO: Load draft and open tokenization flow for editing
                                  console.log('Continue editing draft:', token.id);
                                } else {
                                  // Open detail view modal
                                  setSelectedTokenization(token);
                                }
                              }}
                              className="text-sm text-gray-900 hover:text-black font-medium flex items-center gap-1"
                            >
                              {token.status === 'draft' ? 'Continue Editing' : 'View Details'}
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Create New Button */}
                    <button
                      onClick={() => setActiveCategory('tokenization')}
                      className="bg-white/60 backdrop-blur-xl border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-gray-400 hover:bg-white/80 transition-all flex flex-col items-center justify-center min-h-[200px] group"
                    >
                      <div className="w-12 h-12 bg-gray-100 group-hover:bg-gray-200 rounded-lg flex items-center justify-center mb-3 transition-colors">
                        <Plus size={24} className="text-gray-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">Tokenize New Asset</p>
                      <p className="text-xs text-gray-500 mt-1">Start tokenization process</p>
                    </button>

                    {/* Empty State */}
                    {userTokenizations.length === 0 && (
                      <div className="col-span-full text-center py-12">
                        <Sparkles size={48} className="text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-1">No tokenized assets yet</p>
                        <p className="text-xs text-gray-500">Click "Tokenize New Asset" to get started</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tokenization Detail Modal */}
          {selectedTokenization && (
            <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                        {selectedTokenization.logo_url ? (
                          <img src={selectedTokenization.logo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <img src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/PrivatecharterX_logo_vectorized.glb.png" alt="PCX" className="w-8 h-8 object-contain" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-lg font-light text-gray-900 font-['DM_Sans']">
                          {selectedTokenization.asset_name || 'Untitled Asset'}
                        </h2>
                        {selectedTokenization.token_symbol && (
                          <span className="text-xs font-light text-gray-500 font-['DM_Sans']">${selectedTokenization.token_symbol}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTokenization(null)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X size={18} className="text-gray-400" />
                    </button>
                  </div>

                  {/* Status & Date */}
                  <div className="flex items-center gap-3 mt-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 font-['DM_Sans']">
                      {selectedTokenization.status === 'submitted' ? 'Pending' :
                       selectedTokenization.status === 'approved' ? 'Approved' :
                       selectedTokenization.status === 'processing' ? 'Processing' :
                       selectedTokenization.status === 'rejected' ? 'Declined' :
                       selectedTokenization.status?.charAt(0).toUpperCase() + selectedTokenization.status?.slice(1) || 'Draft'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-['DM_Sans']">
                      Submitted {new Date(selectedTokenization.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
                  {/* Asset Information */}
                  <div className="mb-6">
                    <h3 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider font-['DM_Sans']">
                      Asset Information
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="bg-white/50 border border-gray-100 p-3 rounded-xl">
                        <p className="text-[10px] text-gray-400 mb-1 font-['DM_Sans']">Asset Value</p>
                        <p className="text-xs font-light text-gray-700 font-['DM_Sans']">{selectedTokenization.estimated_value ? `$${Number(selectedTokenization.estimated_value).toLocaleString()}` : '-'}</p>
                      </div>
                      <div className="bg-white/50 border border-gray-100 p-3 rounded-xl">
                        <p className="text-[10px] text-gray-400 mb-1 font-['DM_Sans']">Location</p>
                        <p className="text-xs font-light text-gray-700 font-['DM_Sans']">{selectedTokenization.location || '-'}</p>
                      </div>
                      <div className="bg-white/50 border border-gray-100 p-3 rounded-xl">
                        <p className="text-[10px] text-gray-400 mb-1 font-['DM_Sans']">Token Symbol</p>
                        <p className="text-xs font-light text-gray-700 font-mono font-['DM_Sans']">{selectedTokenization.token_symbol ? `$${selectedTokenization.token_symbol}` : '-'}</p>
                      </div>
                    </div>
                    <div className="mt-3 bg-white/50 border border-gray-100 p-4 rounded-xl">
                      <p className="text-[10px] text-gray-400 mb-2 font-['DM_Sans']">Description</p>
                      <p className="text-xs font-light text-gray-600 whitespace-pre-wrap font-['DM_Sans']">{selectedTokenization.description || '-'}</p>
                    </div>
                  </div>

                  {/* Token Configuration */}
                  <div className="mb-6">
                    <h3 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider font-['DM_Sans']">
                      Token Configuration
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/50 border border-gray-100 p-3 rounded-xl">
                        <p className="text-[10px] text-gray-400 mb-1 font-['DM_Sans']">Token Type</p>
                        <p className="text-xs font-light text-gray-700 font-['DM_Sans']">
                          {selectedTokenization.token_type === 'utility' ? 'UTO (Utility)' :
                           selectedTokenization.token_type === 'security' ? 'STO (Security)' : '-'}
                        </p>
                      </div>
                      <div className="bg-white/50 border border-gray-100 p-3 rounded-xl">
                        <p className="text-[10px] text-gray-400 mb-1 font-['DM_Sans']">Status</p>
                        <p className="text-xs font-light text-gray-700 capitalize font-['DM_Sans']">{selectedTokenization.status || 'pending'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Wallet Information */}
                  {(selectedTokenization.issuer_wallet_address || selectedTokenization.wallet_address) && (
                    <div className="mb-6">
                      <h3 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider font-['DM_Sans']">
                        Wallet Information
                      </h3>
                      <div className="bg-white/50 border border-gray-100 p-4 rounded-xl">
                        <p className="text-[10px] text-gray-400 mb-1 font-['DM_Sans']">Issuer Wallet Address</p>
                        <p className="text-xs font-mono font-light text-gray-600 break-all">
                          {selectedTokenization.issuer_wallet_address || selectedTokenization.wallet_address || 'Not specified yet'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Asset Images */}
                  {selectedTokenization.form_data?.images && selectedTokenization.form_data.images.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider font-['DM_Sans']">
                        Asset Images
                      </h3>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                        {selectedTokenization.form_data.images.map((img, idx) => (
                          <a
                            key={idx}
                            href={img.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-square rounded-xl overflow-hidden border border-gray-100 hover:border-gray-300 transition-colors"
                          >
                            <img src={img.url} alt={img.name || `Asset image ${idx + 1}`} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {selectedTokenization.form_data && (
                    <div className="mb-6">
                      <h3 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider font-['DM_Sans']">
                        Legal Documents
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedTokenization.form_data.prospectus?.url && (
                          <a
                            href={selectedTokenization.form_data.prospectus.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white/50 rounded-xl hover:bg-white/70 transition-colors border border-gray-100"
                          >
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <FileText size={14} className="text-gray-500" />
                            </div>
                            <div>
                              <p className="text-xs font-light text-gray-700 font-['DM_Sans']">Prospectus</p>
                              <p className="text-[10px] text-gray-400 font-['DM_Sans']">{selectedTokenization.form_data.prospectus.name || 'View document'}</p>
                            </div>
                          </a>
                        )}
                        {selectedTokenization.form_data.legalOpinion?.url && (
                          <a
                            href={selectedTokenization.form_data.legalOpinion.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white/50 rounded-xl hover:bg-white/70 transition-colors border border-gray-100"
                          >
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <FileText size={14} className="text-gray-500" />
                            </div>
                            <div>
                              <p className="text-xs font-light text-gray-700 font-['DM_Sans']">Legal Opinion</p>
                              <p className="text-[10px] text-gray-400 font-['DM_Sans']">{selectedTokenization.form_data.legalOpinion.name || 'View document'}</p>
                            </div>
                          </a>
                        )}
                        {selectedTokenization.form_data.ownershipProof?.url && (
                          <a
                            href={selectedTokenization.form_data.ownershipProof.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white/50 rounded-xl hover:bg-white/70 transition-colors border border-gray-100"
                          >
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <FileText size={14} className="text-gray-500" />
                            </div>
                            <div>
                              <p className="text-xs font-light text-gray-700 font-['DM_Sans']">Ownership Proof</p>
                              <p className="text-[10px] text-gray-400 font-['DM_Sans']">{selectedTokenization.form_data.ownershipProof.name || 'View document'}</p>
                            </div>
                          </a>
                        )}
                        {selectedTokenization.form_data.insurance?.url && (
                          <a
                            href={selectedTokenization.form_data.insurance.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white/50 rounded-xl hover:bg-white/70 transition-colors border border-gray-100"
                          >
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Shield size={14} className="text-gray-500" />
                            </div>
                            <div>
                              <p className="text-xs font-light text-gray-700 font-['DM_Sans']">Insurance</p>
                              <p className="text-[10px] text-gray-400 font-['DM_Sans']">{selectedTokenization.form_data.insurance.name || 'View document'}</p>
                            </div>
                          </a>
                        )}
                        {!selectedTokenization.form_data.prospectus?.url &&
                         !selectedTokenization.form_data.legalOpinion?.url &&
                         !selectedTokenization.form_data.ownershipProof?.url &&
                         !selectedTokenization.form_data.insurance?.url && (
                          <div className="col-span-2 text-center py-6 bg-white/50 rounded-xl border border-gray-100 text-gray-400">
                            <FileText size={24} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-xs font-light font-['DM_Sans']">No documents uploaded</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timeline for Approved */}
                  {selectedTokenization.status === 'approved' && selectedTokenization.marketplace_launch_at && (
                    <div className="bg-white/50 rounded-xl p-4 border border-gray-100">
                      <h3 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider font-['DM_Sans']">
                        Launch Timeline
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs font-light text-gray-500 font-['DM_Sans']">Approved</span>
                          <span className="text-xs font-light text-gray-700 font-['DM_Sans']">{new Date(selectedTokenization.approved_at).toLocaleDateString()}</span>
                        </div>
                        {selectedTokenization.waitlist_opens_at && (
                          <div className="flex justify-between">
                            <span className="text-xs font-light text-gray-500 font-['DM_Sans']">Waitlist Opens</span>
                            <span className="text-xs font-light text-gray-700 font-['DM_Sans']">{new Date(selectedTokenization.waitlist_opens_at).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-xs font-light text-gray-500 font-['DM_Sans']">Launch Date</span>
                          <span className="text-xs font-light text-gray-700 font-['DM_Sans']">{new Date(selectedTokenization.marketplace_launch_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-gray-200/50 flex justify-end">
                  <button
                    onClick={() => setSelectedTokenization(null)}
                    className="px-5 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors font-['DM_Sans']"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SPV Formation Flow */}
          {!isTransitioning && activeCategory === 'spv-formation' && (
            <div className="w-full h-full overflow-y-auto">
              <SPVFormationFlow onBack={() => setActiveCategory('chat')} />
            </div>
          )}

          {/* My SPVs View */}
          {!isTransitioning && activeCategory === 'my-spvs' && !selectedSPV && (
            <div className="w-full h-full overflow-y-auto p-8">
              <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                  <h1 className="text-3xl font-light text-gray-900 mb-2">My SPVs</h1>
                  <p className="text-gray-600">View and manage your SPV formations</p>
                </div>

                {/* SPV List */}
                {loadingSPVs ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-20 h-20">
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-contain"
                      >
                        <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/videoExport-2025-10-19@11-32-10.850-540x540@60fps.mp4" type="video/mp4" />
                      </video>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* User's SPVs */}
                    {userSPVs.map((spv) => {
                      const statusColors = {
                        'pending': 'bg-yellow-100 text-yellow-700',
                        'in_progress': 'bg-blue-100 text-blue-700',
                        'completed': 'bg-green-100 text-green-700',
                        'rejected': 'bg-red-100 text-red-700'
                      };

                      // Extract data from the spv.data JSON field
                      // Note: formData uses camelCase (companyName, businessActivity)
                      const spvData = spv.data || {};
                      const jurisdictionFlag = spvData.jurisdiction_flag || spvData.jurisdictionFlag || '🏢';
                      const companyName = spvData.companyName || spvData.company_name || spv.service_type || 'SPV Formation';
                      const jurisdiction = spvData.jurisdiction || '';
                      const businessActivity = spvData.businessActivity || spvData.business_activity || '';

                      return (
                        <div key={spv.id} className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
                              {jurisdictionFlag}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[spv.status] || 'bg-gray-100 text-gray-700'}`}>
                              {spv.status || 'pending'}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {companyName}
                          </h3>
                          {jurisdiction && (
                            <p className="text-sm text-gray-600 mb-1">
                              {jurisdiction} {businessActivity ? `• ${businessActivity}` : ''}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mb-3">
                            Requested: {new Date(spv.created_at).toLocaleDateString()}
                          </p>
                          {spv.estimated_cost && (
                            <p className="text-sm font-medium text-gray-900 mb-3">
                              Est. Cost: ${parseFloat(spv.estimated_cost).toLocaleString()}
                            </p>
                          )}
                          <div className="pt-4 border-t border-gray-200">
                            <button
                              onClick={() => setSelectedSPV(spv)}
                              className="text-sm text-gray-900 hover:text-black font-medium flex items-center gap-1"
                            >
                              View Details
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Create New Button */}
                    <button
                      onClick={() => setActiveCategory('spv-formation')}
                      className="bg-white/60 backdrop-blur-xl border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-gray-400 hover:bg-white/80 transition-all flex flex-col items-center justify-center min-h-[200px] group"
                    >
                      <div className="w-12 h-12 bg-gray-100 group-hover:bg-gray-200 rounded-lg flex items-center justify-center mb-3 transition-colors">
                        <Plus size={24} className="text-gray-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">Create New SPV</p>
                      <p className="text-xs text-gray-500 mt-1">Start a new formation</p>
                    </button>

                    {/* Empty State */}
                    {userSPVs.length === 0 && (
                      <div className="col-span-full text-center py-12">
                        <Building2 size={48} className="text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-1">No SPV formations yet</p>
                        <p className="text-xs text-gray-500">Click "Create New SPV" to get started</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* SPV Detail Page */}
          {!isTransitioning && activeCategory === 'my-spvs' && selectedSPV && (
            <div className="w-full h-full overflow-y-auto p-8">
              <div className="max-w-3xl mx-auto">
                {(() => {
                  const spvData = selectedSPV.data || {};
                  const statusColors = {
                    'pending': 'bg-yellow-100 text-yellow-700',
                    'in_progress': 'bg-blue-100 text-blue-700',
                    'completed': 'bg-green-100 text-green-700',
                    'rejected': 'bg-red-100 text-red-700'
                  };

                  return (
                    <>
                      {/* Back Button */}
                      <button
                        onClick={() => setSelectedSPV(null)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                      >
                        <ArrowLeft size={16} />
                        Back to My SPVs
                      </button>

                      {/* Header Card */}
                      <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl p-6 mb-6">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-4xl">
                            {spvData.jurisdictionFlag || spvData.jurisdiction_flag || '🏢'}
                          </div>
                          <div className="flex-1">
                            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                              {spvData.companyName || spvData.company_name || selectedSPV.service_type || 'SPV Formation'}
                            </h1>
                            <p className="text-sm text-gray-600 mb-2">{spvData.jurisdiction || ''}</p>
                            <span className={`inline-block text-xs px-3 py-1 rounded-full ${statusColors[selectedSPV.status] || 'bg-gray-100 text-gray-700'}`}>
                              {selectedSPV.status || 'pending'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Company Information */}
                      <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500 mb-1">Company Name</p>
                            <p className="text-sm font-medium text-gray-900">{spvData.companyName || spvData.company_name || 'N/A'}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500 mb-1">Business Activity</p>
                            <p className="text-sm font-medium text-gray-900">{spvData.businessActivity || spvData.business_activity || 'N/A'}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500 mb-1">Number of Directors</p>
                            <p className="text-sm font-medium text-gray-900">{spvData.numberOfDirectors || spvData.number_of_directors || 'N/A'}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500 mb-1">Number of Shareholders</p>
                            <p className="text-sm font-medium text-gray-900">{spvData.numberOfShareholders || spvData.number_of_shareholders || (spvData.shareholders?.length) || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Jurisdiction Details */}
                      <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Jurisdiction Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500 mb-1">Jurisdiction</p>
                            <p className="text-sm font-medium text-gray-900">{spvData.jurisdiction || spvData.jurisdictionDetails?.name || 'N/A'}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500 mb-1">Tax Rate</p>
                            <p className="text-sm font-medium text-gray-900">{spvData.jurisdictionDetails?.tax || spvData.jurisdiction_tax_rate || 'N/A'}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500 mb-1">Formation Duration</p>
                            <p className="text-sm font-medium text-gray-900">{spvData.jurisdictionDetails?.duration || spvData.jurisdiction_duration || 'N/A'}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500 mb-1">Description</p>
                            <p className="text-sm font-medium text-gray-900">
                              {spvData.jurisdictionDetails?.description || spvData.jurisdiction_description || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Selected Tier & Services */}
                      <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Package</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-gray-600">Service Tier</span>
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {spvData.selectedTier || 'Standard'}
                            </span>
                          </div>
                          {spvData.needsNomineeDirector && (
                            <div className="flex justify-between items-center py-2">
                              <span className="text-sm text-gray-600">Nominee Director</span>
                              <span className="text-sm font-medium text-green-600">✓ Included</span>
                            </div>
                          )}
                          {spvData.needsNomineeShareholder && (
                            <div className="flex justify-between items-center py-2">
                              <span className="text-sm text-gray-600">Nominee Shareholder</span>
                              <span className="text-sm font-medium text-green-600">✓ Included</span>
                            </div>
                          )}
                          {spvData.needsBankAccountGuarantee && (
                            <div className="flex justify-between items-center py-2">
                              <span className="text-sm text-gray-600">Bank Account Guarantee</span>
                              <span className="text-sm font-medium text-green-600">✓ Included</span>
                            </div>
                          )}
                          {spvData.needsAccounting && (
                            <div className="flex justify-between items-center py-2">
                              <span className="text-sm text-gray-600">Accounting & Bookkeeping</span>
                              <span className="text-sm font-medium text-green-600">✓ Included</span>
                            </div>
                          )}
                          {spvData.needsExpressService && (
                            <div className="flex justify-between items-center py-2">
                              <span className="text-sm text-gray-600">Express Service</span>
                              <span className="text-sm font-medium text-green-600">✓ Included</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center py-3 border-t border-gray-200">
                            <span className="text-base font-semibold text-gray-900">Estimated Cost</span>
                            <span className="text-xl font-bold text-gray-900">
                              {selectedSPV.estimated_cost ? `$${parseFloat(selectedSPV.estimated_cost).toLocaleString()}` : 'Quote pending'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 text-center">
                            Final pricing will be provided after legal review
                          </p>
                        </div>
                      </div>

                      {/* Contact Information */}
                      {(spvData.contactEmail || spvData.contact_email || spvData.contactPhone || spvData.contact_phone) && (
                        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl p-6 mb-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                          <div className="grid grid-cols-2 gap-4">
                            {(spvData.contactEmail || spvData.contact_email) && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs text-gray-500 mb-1">Email</p>
                                <p className="text-sm font-medium text-gray-900">{spvData.contactEmail || spvData.contact_email}</p>
                              </div>
                            )}
                            {(spvData.contactPhone || spvData.contact_phone) && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs text-gray-500 mb-1">Phone</p>
                                <p className="text-sm font-medium text-gray-900">{spvData.contactPhone || spvData.contact_phone}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Tokenization Plans */}
                      {(spvData.planningToTokenizeAssets || spvData.planning_to_tokenize) && (
                        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl p-6 mb-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tokenization Plans</h3>
                          <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                              Planning to tokenize: <span className="font-medium">{(spvData.tokenizeAssetTypes || []).join(', ') || spvData.asset_type || 'Assets'}</span>
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Request Info */}
                      <div className="text-center text-xs text-gray-500 mt-6">
                        <span>Request ID: {selectedSPV.id?.slice(0, 8)}...</span>
                        <span className="mx-2">•</span>
                        <span>Submitted: {new Date(selectedSPV.created_at).toLocaleDateString()}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* My Bookings View */}
          {!isTransitioning && activeCategory === 'my-bookings' && (
            <div className="w-full h-full overflow-y-auto p-8">
              <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                  <button
                    onClick={() => setActiveCategory('chat')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                  <h1 className="text-3xl font-light text-gray-900 mb-2">My Bookings</h1>
                  <p className="text-gray-600">View your flight bookings, adventures, and CO2 certificates</p>
                </div>

                {/* Bookings List */}
                {loadingBookings ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-20 h-20">
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-contain"
                      >
                        <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/videoExport-2025-10-19@11-32-10.850-540x540@60fps.mp4" type="video/mp4" />
                      </video>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* User's Bookings */}
                    {userBookings.map((booking) => {
                      const statusColors = {
                        'pending': 'bg-yellow-100 text-yellow-700',
                        'paid': 'bg-green-100 text-green-700',
                        'confirmed': 'bg-blue-100 text-blue-700',
                        'completed': 'bg-green-100 text-green-700',
                        'cancelled': 'bg-red-100 text-red-700',
                        'refunded': 'bg-gray-100 text-gray-700'
                      };

                      const typeIcons = {
                        'empty_leg': <Plane size={24} className="text-white" />,
                        'adventure_package': <Mountain size={24} className="text-white" />,
                        'co2_certificate': <Leaf size={24} className="text-white" />
                      };

                      const typeColors = {
                        'empty_leg': 'from-black to-gray-800',
                        'adventure_package': 'from-emerald-500 to-emerald-600',
                        'co2_certificate': 'from-green-500 to-green-600'
                      };

                      const typeLabels = {
                        'empty_leg': 'Empty Leg Flight',
                        'adventure_package': 'Adventure Package',
                        'co2_certificate': 'CO2 Certificate'
                      };

                      return (
                        <div key={booking.id} className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all">
                          {/* Image or Gradient Header */}
                          {booking.service_image_url ? (
                            <div className="h-32 bg-cover bg-center relative" style={{ backgroundImage: `url(${booking.service_image_url})` }}>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <span className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-full ${statusColors[booking.payment_status] || 'bg-gray-100 text-gray-700'}`}>
                                {booking.payment_status || 'pending'}
                              </span>
                            </div>
                          ) : (
                            <div className={`h-32 bg-gradient-to-br ${typeColors[booking.booking_type] || 'from-gray-500 to-gray-600'} flex items-center justify-center relative`}>
                              {typeIcons[booking.booking_type] || <Plane size={32} className="text-white/50" />}
                              <span className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-full ${statusColors[booking.payment_status] || 'bg-gray-100 text-gray-700'}`}>
                                {booking.payment_status || 'pending'}
                              </span>
                            </div>
                          )}

                          <div className="p-4">
                            <p className="text-xs text-gray-500 mb-1">{typeLabels[booking.booking_type] || 'Booking'}</p>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                              {booking.service_title || `${booking.origin || ''} → ${booking.destination || ''}`}
                            </h3>

                            {/* Route info for flights */}
                            {booking.origin && booking.destination && (
                              <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                                <MapPin size={14} />
                                {booking.origin} → {booking.destination}
                              </p>
                            )}

                            {/* Date */}
                            {booking.departure_date && (
                              <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                                <Calendar size={14} />
                                {new Date(booking.departure_date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            )}

                            {/* Price */}
                            <p className="text-xl font-bold text-gray-900 mb-3">
                              {booking.currency || 'USD'} {parseFloat(booking.total_amount || 0).toLocaleString()}
                            </p>

                            <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                Booked: {new Date(booking.created_at).toLocaleDateString()}
                              </span>
                              {booking.coingate_payment_url && booking.payment_status === 'pending' && (
                                <a
                                  href={booking.coingate_payment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-black hover:text-gray-700 font-medium flex items-center gap-1"
                                >
                                  Complete Payment
                                  <ChevronRight size={14} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Empty State */}
                    {userBookings.length === 0 && (
                      <div className="col-span-full text-center py-12">
                        <Plane size={48} className="text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-1">No bookings yet</p>
                        <p className="text-xs text-gray-500 mb-4">Browse empty legs and adventures to make your first booking</p>
                        <button
                          onClick={() => setActiveCategory('chat')}
                          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all text-sm"
                        >
                          Browse Services
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* My Launches View */}
          {!isTransitioning && activeCategory === 'my-launches' && (
            <div className="w-full h-full overflow-y-auto">
              <MyLaunches />
            </div>
          )}

          {/* Launchpad - Coming Soon */}
          {!isTransitioning && activeCategory === 'launchpad' && (
            <div className="w-full h-full overflow-y-auto flex items-center justify-center">
              <div className="text-center p-8">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900 tracking-tighter mb-2 font-['DM_Sans']">Launchpad</h2>
                <p className="text-gray-500 mb-4">Token launches and IDO platform</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
                  <Rocket size={16} />
                  Launching Q1 / 2026
                </div>
              </div>
            </div>
          )}

          {/* DAOs */}
          {!isTransitioning && activeCategory === 'dao' && (
            <div className="w-full h-full overflow-y-auto">
              <MyDAOs />
            </div>
          )}

          {/* Escrow */}
          {!isTransitioning && activeCategory === 'escrow' && (
            <div className="w-full h-full overflow-y-auto">
              <EscrowPage />
            </div>
          )}

          {/* STO/UTL Dashboard */}
          {!isTransitioning && activeCategory === 'sto-utl' && (
            <div className="w-full h-full overflow-y-auto">
              <STOUTLDashboard />
            </div>
          )}

          {/* Marketplace - Coming Soon */}
          {!isTransitioning && activeCategory === 'marketplace' && (
            <div className="w-full h-full overflow-y-auto flex items-center justify-center">
              <div className="text-center p-8">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900 tracking-tighter mb-2 font-['DM_Sans']">Marketplace</h2>
                <p className="text-gray-500 mb-4">Trade tokenized assets and collectibles</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
                  <Rocket size={16} />
                  Launching Q1 / 2026
                </div>
              </div>
            </div>
          )}

          {/* PVCX Token Page */}
          {!isTransitioning && activeCategory === 'pvcx-token' && (
            <div className="w-full h-full overflow-y-auto">
              <PVCXTokenView user={user} onNavigate={(category) => setActiveCategory(category)} />
            </div>
          )}

          {/* P2P Trading */}
          {!isTransitioning && activeCategory === 'p2p-trading' && (
            <div className="w-full h-full overflow-y-auto">
              <P2PMarketplace />
            </div>
          )}

          {/* Notifications Page */}
          {!isTransitioning && activeCategory === 'notifications' && (
            <div className="w-full h-full overflow-y-auto p-8">
              <NotificationCenter />
            </div>
          )}

          {/* Other Category Views */}
          {!isTransitioning && activeCategory === 'private-jet' && (
            <div className="w-full flex-1 flex flex-col">
              <div className="w-full max-w-7xl mx-auto">
                <UnifiedBookingFlow
                  onStepChange={setBookingStep}
                  initialVehicleType={bookingVehicleType}
                  initialFlightData={initialFlightData}
                  onFlightDataUsed={() => setInitialFlightData(null)}
                />
              </div>
            </div>
          )}

          {/* Tokenized Assets View */}
          {!isTransitioning && activeCategory === 'assets' && (
            <div className="w-full flex-1 flex flex-col">
              <TokenizedAssetsShowcase />
            </div>
          )}

          {/* Taxi/Concierge View */}
          {!isTransitioning && activeCategory === 'ground-transport' && (
            <div className="w-full h-full pt-4 md:pt-6">
              <TaxiConciergeView
                onRequestSubmit={(data) => {
                  console.log('Taxi request submitted:', data);
                  // You can add request handling here
                }}
              />
              <PageFooter />
            </div>
          )}

          {/* Jets View */}
          {!isTransitioning && activeCategory === 'jets' && (
            <div className="w-full flex-1 flex flex-col">

              {!showJetDetail && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 gap-3 pt-4 md:pt-6">
                <h2 className="text-xl md:text-3xl lg:text-4xl font-light text-gray-900 tracking-tighter">Private Jets</h2>

                <div className="flex items-center gap-2 md:gap-3">
                  {/* Charter a Jet Button - Opens AI Chat */}
                  <button
                    onClick={() => {
                      const query = encodeURIComponent('I want to charter a private jet');
                      navigate(`/dashboard/chat?query=${query}`);
                    }}
                    className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-200 text-gray-700 rounded-lg text-[10px] md:text-sm font-medium hover:bg-gray-300 transition-colors"
                  >
                    Charter a Jet
                  </button>
                </div>
              </div>
              )}

              {/* Back button when showing jet detail */}
              {showJetDetail && (
                <button
                  onClick={() => setShowJetDetail(false)}
                  className="mb-4 flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <span>←</span>
                  <span>Back to Jets</span>
                </button>
              )}


              {/* Loading State */}
              {!showJetDetail && isLoadingJets && (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 rounded-xl aspect-[4/3] mb-2 sm:mb-3"></div>
                      <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                      <div className="bg-gray-200 h-3 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              )}

              {/* Jets Grid View - Airbnb Style (same as Adventures) */}
              {!showJetDetail && !isLoadingJets && (
                <>
                  {/* Results count */}
                  <p className="text-sm text-gray-500 mb-4">
                    {jetsData.length} jet{jetsData.length !== 1 ? 's' : ''} available
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                    {jetsData.map((jet) => (
                      <div
                        key={jet.id}
                        onClick={() => handleJetClick(jet)}
                        className="group cursor-pointer active:scale-[0.98] transition-transform"
                      >
                        {/* Image */}
                        <div className="relative aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden mb-2 sm:mb-3">
                          {jet.image ? (
                            <img
                              src={jet.image}
                              alt={jet.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <Plane size={32} className="text-gray-300" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                            <span className="bg-gray-900 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium">
                              {jet.category || 'Private Jet'}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div>
                          <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                            {jet.name}
                          </h3>

                          <div className="flex items-center gap-2 text-gray-500 text-xs sm:text-sm mb-1">
                            <span className="flex items-center gap-1">
                              <Users size={10} className="flex-shrink-0" />
                              {jet.capacity}
                            </span>
                            <span>•</span>
                            <span className="line-clamp-1">{jet.range}</span>
                          </div>

                          <p className="text-xs sm:text-sm">
                            <span className="font-semibold text-gray-900">
                              {jet.totalPrice || 'On Request'}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* No Results */}
                  {jetsData.length === 0 && (
                    <div className="text-center py-12 sm:py-16">
                      <Plane size={48} className="mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No jets found</h3>
                      <p className="text-gray-500">Check back later for available aircraft</p>
                    </div>
                  )}
                </>
              )}

              {/* Jet Detail View - Modern Monochromatic Layout (EXACTLY like Empty Legs) */}
              {showJetDetail && selectedJet && (() => {
                const jetImages = getAllJetImages();
                const currentImage = jetImages[currentImageIndex] || selectedJet.image;
                return (
                  <div className="w-full">
                    {/* Compact Header Card */}
                    <div className="bg-white rounded-xl border border-gray-100 mb-4 overflow-hidden shadow-sm">
                      {/* Image - Full width with gallery */}
                      <div className="relative h-40 md:h-52 bg-gray-100">
                        <img
                          src={currentImage}
                          alt={selectedJet.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Gallery Navigation */}
                        {jetImages.length > 1 && (
                          <>
                            <button
                              onClick={handlePrevImage}
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-black w-8 h-8 rounded-full flex items-center justify-center shadow-lg text-sm transition-all"
                            >←</button>
                            <button
                              onClick={handleNextImage}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-black w-8 h-8 rounded-full flex items-center justify-center shadow-lg text-sm transition-all"
                            >→</button>
                            <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-xs">
                              {currentImageIndex + 1} / {jetImages.length}
                            </div>
                          </>
                        )}
                        {/* Minimal badges */}
                        <div className="absolute top-3 left-3 flex gap-1.5">
                          <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-medium border border-emerald-200">Available</span>
                          <span className="bg-gray-900 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">Private Jet</span>
                        </div>
                      </div>

                      {/* Flight Info - Compact */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Plane size={14} className="text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <h1 className="text-sm font-medium text-gray-900">{selectedJet.name}</h1>
                            <p className="text-xs text-gray-500">{selectedJet.location} · {selectedJet.category}</p>
                          </div>
                        </div>

                        {/* Key Metrics Row */}
                        <div className="flex items-center gap-4 pt-3 border-t border-gray-50">
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Category</p>
                            <p className="text-sm font-medium text-gray-900">{selectedJet.category}</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Capacity</p>
                            <p className="text-sm font-medium text-gray-900">{selectedJet.capacity}</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Price</p>
                            <p className="text-sm font-semibold text-gray-900">{selectedJet.totalPrice}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Aircraft Details Card */}
                      <div className="md:col-span-2 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <h2 className="text-sm font-medium text-gray-900 mb-4">Aircraft Details</h2>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="py-2 border-b border-gray-50">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Model</p>
                            <p className="text-sm text-gray-900">{selectedJet.name}</p>
                          </div>
                          <div className="py-2 border-b border-gray-50">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Manufacturer</p>
                            <p className="text-sm text-gray-900">{selectedJet.location}</p>
                          </div>
                          <div className="py-2 border-b border-gray-50">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Category</p>
                            <p className="text-sm text-gray-900">{selectedJet.category}</p>
                          </div>
                          <div className="py-2 border-b border-gray-50">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Capacity</p>
                            <p className="text-sm text-gray-900">{selectedJet.capacity}</p>
                          </div>
                          <div className="py-2 border-b border-gray-50">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Range</p>
                            <p className="text-sm text-gray-900">{selectedJet.range}</p>
                          </div>
                          <div className="py-2 border-b border-gray-50">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Price Range</p>
                            <p className="text-sm text-gray-900">{selectedJet.totalPrice}</p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Request Quote Sidebar - Minimal like Empty Legs */}
                      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <h2 className="text-sm font-medium text-gray-900 mb-4">Request a Quote</h2>

                        {/* Price Summary */}
                        <div className="p-3 bg-gray-50 rounded-lg mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Price Range</span>
                            <span className="text-lg font-semibold text-gray-900">{selectedJet.totalPrice}</span>
                          </div>
                        </div>

                        {/* Booking Inputs - Compact like Empty Legs */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between py-2 border-b border-gray-50">
                            <span className="text-xs text-gray-600">Passengers</span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setJetPassengers(Math.max(1, jetPassengers - 1))}
                                className="w-6 h-6 rounded-full border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 text-xs flex items-center justify-center"
                              >−</button>
                              <span className="text-sm font-medium text-gray-900 w-4 text-center">{jetPassengers}</span>
                              <button
                                onClick={() => setJetPassengers(Math.min(parseInt(selectedJet.capacity) || 14, jetPassengers + 1))}
                                className="w-6 h-6 rounded-full border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 text-xs flex items-center justify-center"
                              >+</button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-gray-50">
                            <span className="text-xs text-gray-600">Luggage</span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setJetLuggage(Math.max(0, jetLuggage - 1))}
                                className="w-6 h-6 rounded-full border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 text-xs flex items-center justify-center"
                              >−</button>
                              <span className="text-sm font-medium text-gray-900 w-4 text-center">{jetLuggage}</span>
                              <button
                                onClick={() => setJetLuggage(jetLuggage + 1)}
                                className="w-6 h-6 rounded-full border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 text-xs flex items-center justify-center"
                              >+</button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-xs text-gray-600">Pet onboard</span>
                            <button
                              onClick={() => setJetHasPet(!jetHasPet)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                jetHasPet
                                  ? 'bg-gray-900 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {jetHasPet ? 'Yes' : 'No'}
                            </button>
                          </div>
                        </div>

                        {/* Action Button - Opens AI Chat */}
                        <button
                          onClick={() => {
                            const query = encodeURIComponent(`I want to charter a private jet: ${selectedJet?.name || 'private jet'}`);
                            navigate(`/dashboard/chat?query=${query}`);
                          }}
                          className="w-full bg-gray-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                          Get a Quote
                        </button>

                        <p className="text-[10px] text-gray-400 text-center mt-3">
                          No commitment · Free quote within 2 hours
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* No Results */}
              {!showJetDetail && !isLoadingJets && jetsData.length === 0 && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-sm text-gray-600">No jets found matching your criteria.</div>
                </div>
              )}
              <PageFooter />
            </div>
          )}

          {/* Helicopter View */}
          {!isTransitioning && activeCategory === 'helicopter' && (
            <div className="w-full flex-1 flex flex-col">

              {!showHelicopterDetail && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 gap-3 pt-4 md:pt-6">
                <h2 className="text-xl md:text-3xl lg:text-4xl font-light text-gray-900 tracking-tighter">Helicopter Charters</h2>

                <div className="flex items-center gap-2 md:gap-3">
                  {/* Charter a Heli Button - Opens AI Chat */}
                  <button
                    onClick={() => {
                      const query = encodeURIComponent('I want to charter a helicopter');
                      navigate(`/dashboard/chat?query=${query}`);
                    }}
                    className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-200 text-gray-700 rounded-lg text-[10px] md:text-sm font-medium hover:bg-gray-300 transition-colors"
                  >
                    Charter a Heli
                  </button>
                </div>
              </div>
              )}

              {/* Back button when showing helicopter detail */}
              {showHelicopterDetail && (
                <button
                  onClick={() => {
                    setShowHelicopterDetail(false);
                    setSelectedHelicopter(null);
                    setCurrentHelicopterImageIndex(0);
                  }}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6 transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span className="text-sm font-medium">Back to Helicopters</span>
                </button>
              )}

              {/* Loading State */}
              {isLoadingHelicopters && !showHelicopterDetail && (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 rounded-xl aspect-[4/3] mb-2 sm:mb-3"></div>
                      <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                      <div className="bg-gray-200 h-3 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              )}

              {/* Helicopters Grid View - Airbnb Style (same as Adventures) */}
              {!isLoadingHelicopters && !showHelicopterDetail && (
                <>
                  {/* Results count */}
                  <p className="text-sm text-gray-500 mb-4">
                    {helicoptersData.length} helicopter{helicoptersData.length !== 1 ? 's' : ''} available
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                    {helicoptersData.map((heli) => (
                      <div
                        key={heli.id}
                        onClick={() => {
                          setSelectedHelicopter(heli);
                          setShowHelicopterDetail(true);
                          setCurrentHelicopterImageIndex(0);
                        }}
                        className="group cursor-pointer active:scale-[0.98] transition-transform"
                      >
                        {/* Image */}
                        <div className="relative aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden mb-2 sm:mb-3">
                          {heli.image ? (
                            <img
                              src={heli.image}
                              alt={heli.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <Zap size={32} className="text-gray-300" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                            <span className="bg-gray-900 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium">
                              Helicopter
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div>
                          <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                            {heli.name}
                          </h3>

                          <div className="flex items-center gap-2 text-gray-500 text-xs sm:text-sm mb-1">
                            <span className="flex items-center gap-1">
                              <Users size={10} className="flex-shrink-0" />
                              {heli.capacity}
                            </span>
                            <span>•</span>
                            <span className="line-clamp-1">{heli.range}</span>
                          </div>

                          <p className="text-xs sm:text-sm">
                            <span className="font-semibold text-gray-900">
                              {heli.totalPrice || 'On Request'}
                            </span>
                            <span className="text-gray-500 font-normal">/hr</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* No Results */}
                  {helicoptersData.length === 0 && (
                    <div className="text-center py-12 sm:py-16">
                      <Zap size={48} className="mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No helicopters found</h3>
                      <p className="text-gray-500">Check back later for available aircraft</p>
                    </div>
                  )}
                </>
              )}

              {/* Helicopter Detail View - Modern Monochromatic Layout (EXACTLY like Empty Legs) */}
              {showHelicopterDetail && selectedHelicopter && (() => {
                const rawData = selectedHelicopter.rawData || {};
                // Get all helicopter images for gallery
                const heliImages = [];
                if (selectedHelicopter.image) heliImages.push(selectedHelicopter.image);
                if (rawData.images && Array.isArray(rawData.images)) {
                  rawData.images.forEach(img => {
                    if (img && !heliImages.includes(img)) heliImages.push(img);
                  });
                }
                if (rawData.image_url && !heliImages.includes(rawData.image_url)) heliImages.push(rawData.image_url);
                const currentHeliImage = heliImages[currentHelicopterImageIndex] || selectedHelicopter.image;

                return (
                  <div className="w-full">
                    {/* Compact Header Card */}
                    <div className="bg-white rounded-xl border border-gray-100 mb-4 overflow-hidden shadow-sm">
                      {/* Image - Full width with gallery */}
                      <div className="relative h-40 md:h-52 bg-gray-100">
                        <img
                          src={currentHeliImage}
                          alt={selectedHelicopter.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Gallery Navigation */}
                        {heliImages.length > 1 && (
                          <>
                            <button
                              onClick={() => setCurrentHelicopterImageIndex(prev => prev === 0 ? heliImages.length - 1 : prev - 1)}
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-black w-8 h-8 rounded-full flex items-center justify-center shadow-lg text-sm transition-all"
                            >←</button>
                            <button
                              onClick={() => setCurrentHelicopterImageIndex(prev => prev === heliImages.length - 1 ? 0 : prev + 1)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-black w-8 h-8 rounded-full flex items-center justify-center shadow-lg text-sm transition-all"
                            >→</button>
                            <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-xs">
                              {currentHelicopterImageIndex + 1} / {heliImages.length}
                            </div>
                          </>
                        )}
                        {/* Minimal badges */}
                        <div className="absolute top-3 left-3 flex gap-1.5">
                          <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-medium border border-emerald-200">Available</span>
                          <span className="bg-gray-900 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">Helicopter</span>
                        </div>
                      </div>

                      {/* Helicopter Info - Compact */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-base">
                            🚁
                          </div>
                          <div className="flex-1">
                            <h1 className="text-sm font-medium text-gray-900">{selectedHelicopter.name}</h1>
                            <p className="text-xs text-gray-500">{selectedHelicopter.location || 'Global'} · {selectedHelicopter.category}</p>
                          </div>
                        </div>

                        {/* Key Metrics Row */}
                        <div className="flex items-center gap-4 pt-3 border-t border-gray-50">
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Category</p>
                            <p className="text-sm font-medium text-gray-900">{selectedHelicopter.category}</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Capacity</p>
                            <p className="text-sm font-medium text-gray-900">{selectedHelicopter.capacity}</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Rate</p>
                            <p className="text-sm font-semibold text-gray-900">{selectedHelicopter.totalPrice}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Helicopter Details Card */}
                      <div className="md:col-span-2 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <h2 className="text-sm font-medium text-gray-900 mb-4">Helicopter Details</h2>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="py-2 border-b border-gray-50">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Model</p>
                            <p className="text-sm text-gray-900">{selectedHelicopter.name}</p>
                          </div>
                          <div className="py-2 border-b border-gray-50">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Status</p>
                            <p className="text-sm text-gray-900">Available</p>
                          </div>
                          <div className="py-2 border-b border-gray-50">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Base Location</p>
                            <p className="text-sm text-gray-900">{rawData.base_location || selectedHelicopter.location || 'Multiple locations'}</p>
                          </div>
                          <div className="py-2 border-b border-gray-50">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Capacity</p>
                            <p className="text-sm text-gray-900">{rawData.capacity || selectedHelicopter.capacity}</p>
                          </div>
                          <div className="py-2 border-b border-gray-50">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Range</p>
                            <p className="text-sm text-gray-900">{rawData.range || selectedHelicopter.range || 'N/A'}</p>
                          </div>
                          <div className="py-2 border-b border-gray-50">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Cruise Speed</p>
                            <p className="text-sm text-gray-900">{rawData.cruise_speed || selectedHelicopter.speed || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Request Quote Sidebar - Minimal like Empty Legs */}
                      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <h2 className="text-sm font-medium text-gray-900 mb-4">Request a Quote</h2>

                        {/* Price Summary */}
                        <div className="p-3 bg-gray-50 rounded-lg mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Hourly Rate</span>
                            <span className="text-lg font-semibold text-gray-900">{selectedHelicopter.totalPrice}</span>
                          </div>
                        </div>

                        {/* Booking Inputs - Compact like Empty Legs */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between py-2 border-b border-gray-50">
                            <span className="text-xs text-gray-600">Passengers</span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setHelicopterPassengers(Math.max(1, helicopterPassengers - 1))}
                                className="w-6 h-6 rounded-full border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 text-xs flex items-center justify-center"
                              >−</button>
                              <span className="text-sm font-medium text-gray-900 w-4 text-center">{helicopterPassengers}</span>
                              <button
                                onClick={() => setHelicopterPassengers(Math.min(parseInt(selectedHelicopter?.capacity) || 10, helicopterPassengers + 1))}
                                className="w-6 h-6 rounded-full border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 text-xs flex items-center justify-center"
                              >+</button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-gray-50">
                            <span className="text-xs text-gray-600">Luggage</span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setHelicopterLuggage(Math.max(0, helicopterLuggage - 1))}
                                className="w-6 h-6 rounded-full border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 text-xs flex items-center justify-center"
                              >−</button>
                              <span className="text-sm font-medium text-gray-900 w-4 text-center">{helicopterLuggage}</span>
                              <button
                                onClick={() => setHelicopterLuggage(helicopterLuggage + 1)}
                                className="w-6 h-6 rounded-full border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 text-xs flex items-center justify-center"
                              >+</button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-xs text-gray-600">Pet onboard</span>
                            <button
                              onClick={() => setHelicopterHasPet(!helicopterHasPet)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                helicopterHasPet
                                  ? 'bg-gray-900 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {helicopterHasPet ? 'Yes' : 'No'}
                            </button>
                          </div>
                        </div>

                        {/* Action Button - Opens AI Chat */}
                        <button
                          onClick={() => {
                            const query = encodeURIComponent(`I want to charter a helicopter: ${selectedHelicopter?.name || 'helicopter'}`);
                            navigate(`/dashboard/chat?query=${query}`);
                          }}
                          className="w-full bg-gray-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                          Get a Quote
                        </button>

                        <p className="text-[10px] text-gray-400 text-center mt-3">
                          No commitment · Free quote within 2 hours
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* No Results */}
              {!isLoadingHelicopters && !showHelicopterDetail && helicoptersData.length === 0 && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-sm text-gray-600">No helicopters found matching your criteria.</div>
                </div>
              )}
              <PageFooter />
            </div>
          )}

          {/* Empty Legs View */}
          {!isTransitioning && activeCategory === 'empty-legs' && (
            <div className="w-full flex-1 flex flex-col">

              {!showEmptyLegDetail && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 gap-3 pt-4 md:pt-6">
                <h2 className="text-xl md:text-3xl lg:text-4xl font-light text-gray-900 tracking-tighter">Empty Legs</h2>

                <div className="flex items-center gap-2 md:gap-3">
                  {/* Filter Toggle Button */}
                  <button
                    onClick={() => setEmptyLegsFiltersVisible(!emptyLegsFiltersVisible)}
                    className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-medium transition-all backdrop-blur-xl border ${
                      emptyLegsFiltersVisible
                        ? 'bg-gray-800 text-white border-gray-800'
                        : 'bg-gray-100/60 text-gray-700 border-gray-300/50 hover:bg-gray-200/60'
                    }`}
                    style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                  >
                    <SlidersHorizontal size={12} />
                    <span>Filters</span>
                  </button>
                </div>
              </div>
              )}

              {/* Back button when showing empty leg detail */}
              {showEmptyLegDetail && (
                <button
                  onClick={() => {
                    setShowEmptyLegDetail(false);
                    setSelectedEmptyLeg(null);
                    setCurrentEmptyLegImageIndex(0);
                  }}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6 transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span className="text-sm font-medium">Back to Empty Legs</span>
                </button>
              )}

              {/* Filters - Glassmorphic - Mobile Optimized */}
              {!showEmptyLegDetail && emptyLegsFiltersVisible && (
                <div className="bg-gray-100/60 rounded-lg border border-gray-300/50 p-3 md:p-5 mb-4 md:mb-6 backdrop-blur-xl transition-all duration-300" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                  <div>
                    <label className="block text-[10px] md:text-xs font-medium text-gray-800 mb-1 md:mb-2">IATA / Location</label>
                    <input
                      type="text"
                      placeholder="e.g. LHR, NCE, Paris"
                      value={emptyLegsLocation}
                      onChange={(e) => setEmptyLegsLocation(e.target.value)}
                      className="w-full px-2 md:px-3 py-2 md:py-2.5 bg-white/35 border border-gray-300/50 rounded-lg md:rounded-xl text-xs md:text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] md:text-xs font-medium text-gray-800 mb-1 md:mb-2">Date</label>
                    <input
                      type="date"
                      value={emptyLegsDate}
                      onChange={(e) => setEmptyLegsDate(e.target.value)}
                      className="w-full px-2 md:px-3 py-2 md:py-2.5 bg-white/35 border border-gray-300/50 rounded-lg md:rounded-xl text-xs md:text-sm text-gray-700 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] md:text-xs font-medium text-gray-800 mb-1 md:mb-2">Max Price</label>
                    <input
                      type="number"
                      placeholder="$5000"
                      value={emptyLegsMaxPrice}
                      onChange={(e) => setEmptyLegsMaxPrice(e.target.value)}
                      className="w-full px-2 md:px-3 py-2 md:py-2.5 bg-white/35 border border-gray-300/50 rounded-lg md:rounded-xl text-xs md:text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setEmptyLegsLocation('');
                        setEmptyLegsDate('');
                        setEmptyLegsMaxPrice('');
                      }}
                      className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-white/35 hover:bg-white/40 border border-gray-300/50 text-gray-700 rounded-lg md:rounded-xl text-xs md:text-sm transition-all"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                </div>
              )}

              {/* Loading State */}
              {isLoadingEmptyLegs && !showEmptyLegDetail && (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 rounded-xl aspect-[4/3] mb-2 sm:mb-3"></div>
                      <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                      <div className="bg-gray-200 h-3 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty Legs Grid View - Airbnb Style (same as Adventures) */}
              {!isLoadingEmptyLegs && !showEmptyLegDetail && (
                <>
                  {/* Results count */}
                  <p className="text-sm text-gray-500 mb-4">
                    {emptyLegsData.length} empty leg{emptyLegsData.length !== 1 ? 's' : ''} available
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                    {emptyLegsData.map((leg) => (
                      <div
                        key={leg.id}
                        onClick={() => {
                          setSelectedEmptyLeg(leg);
                          setShowEmptyLegDetail(true);
                          setCurrentEmptyLegImageIndex(0);
                          setEmptyLegPassengers(1);
                          setEmptyLegLuggage(0);
                          setEmptyLegHasPet(false);
                        }}
                        className="group cursor-pointer active:scale-[0.98] transition-transform"
                      >
                        {/* Image */}
                        <div className="relative aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden mb-2 sm:mb-3">
                          {leg.image ? (
                            <img
                              src={leg.image}
                              alt={leg.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <Plane size={32} className="text-gray-300" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-wrap gap-1">
                            <span className="bg-gray-900 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium">
                              {leg.location}
                            </span>
                            {leg.rawData?.price && leg.rawData.price <= 1500 && (
                              <span className="bg-green-500 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium">
                                FREE with NFT
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div>
                          <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                            {leg.name}
                          </h3>

                          <div className="flex items-center gap-1 text-gray-500 text-xs sm:text-sm mb-1">
                            <Calendar size={10} className="flex-shrink-0" />
                            <span>{leg.departureDate}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users size={10} />
                              {leg.capacity}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm">
                            <span className="font-semibold text-gray-900">
                              {leg.totalPrice || 'On Request'}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* No Results */}
                  {emptyLegsData.length === 0 && (
                    <div className="text-center py-12 sm:py-16">
                      <Plane size={48} className="mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No empty legs found</h3>
                      <p className="text-gray-500 mb-4">Try adjusting your filters</p>
                      <button
                        onClick={() => {
                          setEmptyLegsLocation('');
                          setEmptyLegsDate('');
                          setEmptyLegsMaxPrice('');
                        }}
                        className="text-gray-900 underline text-sm"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Empty Leg Detail View - Modern Monochromatic Layout */}
              {showEmptyLegDetail && selectedEmptyLeg && (() => {
                const rawData = selectedEmptyLeg.rawData || {};
                return (
                  <div className="w-full">
                    {/* Compact Header Card */}
                    <div className="bg-white rounded-xl border border-gray-100 mb-4 overflow-hidden shadow-sm">
                      {/* Image - Smaller on desktop */}
                      <div className="relative h-40 md:h-52 bg-gray-100">
                        <img
                          src={selectedEmptyLeg.image}
                          alt={selectedEmptyLeg.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Minimal badges */}
                        <div className="absolute top-3 left-3 flex gap-1.5">
                          <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-medium border border-emerald-200">Available</span>
                          <span className="bg-gray-900 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">Empty Leg</span>
                        </div>
                      </div>

                      {/* Flight Info - Compact */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Plane size={14} className="text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <h1 className="text-sm font-medium text-gray-900">{selectedEmptyLeg.name}</h1>
                            <p className="text-xs text-gray-500">{rawData.from_city || 'Departure'} → {rawData.to_city || 'Arrival'}</p>
                          </div>
                        </div>

                        {/* Key Metrics Row */}
                        <div className="flex items-center gap-4 pt-3 border-t border-gray-50">
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Date</p>
                            <p className="text-sm font-medium text-gray-900">{selectedEmptyLeg.departureDate}</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Capacity</p>
                            <p className="text-sm font-medium text-gray-900">{rawData.capacity || rawData.pax || 'N/A'} pax</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Price</p>
                            <p className="text-sm font-semibold text-gray-900">{selectedEmptyLeg.totalPrice}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Flight Details Card */}
                      <div className="md:col-span-2 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <h2 className="text-sm font-medium text-gray-900 mb-4">Flight Details</h2>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="py-2 border-b border-gray-50">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">From</p>
                            <p className="text-sm text-gray-900">{rawData.from_city || 'TBD'} ({rawData.from_iata || '-'})</p>
                          </div>
                          <div className="py-2 border-b border-gray-50">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">To</p>
                            <p className="text-sm text-gray-900">{rawData.to_city || 'TBD'} ({rawData.to_iata || '-'})</p>
                          </div>
                          <div className="py-2 border-b border-gray-50">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Date</p>
                            <p className="text-sm text-gray-900">{selectedEmptyLeg.departureDate}</p>
                          </div>
                          <div className="py-2 border-b border-gray-50">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Time</p>
                            <p className="text-sm text-gray-900">Flexible</p>
                          </div>
                          <div className="py-2 border-b border-gray-50">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Aircraft</p>
                            <p className="text-sm text-gray-900">{rawData.aircraft_model || rawData.aircraft_type || rawData.category || 'Private Jet'}</p>
                            {rawData.aircraft_model && rawData.category && (
                              <p className="text-xs text-gray-500">{rawData.category}</p>
                            )}
                          </div>
                          <div className="py-2 border-b border-gray-50">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Passengers</p>
                            <p className="text-sm text-gray-900">{rawData.capacity || rawData.pax || 'N/A'}</p>
                          </div>
                        </div>

                        {/* CO2 - Minimal */}
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-2">
                            <Leaf size={14} className="text-emerald-500" />
                            <p className="text-xs text-gray-700">
                              <span className="font-medium">CO₂ Certificate included</span>
                              <span className="text-gray-500"> · Classic or blockchain-verified</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Book This Flight Sidebar - Minimal */}
                      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <h2 className="text-sm font-medium text-gray-900 mb-4">Book This Flight</h2>

                        {/* Price Summary */}
                        <div className="p-3 bg-gray-50 rounded-lg mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Total Price</span>
                            <span className="text-lg font-semibold text-gray-900">{selectedEmptyLeg.totalPrice}</span>
                          </div>
                        </div>

                        {/* Booking Inputs - Compact */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between py-2 border-b border-gray-50">
                            <span className="text-xs text-gray-600">Passengers</span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setEmptyLegPassengers(Math.max(1, emptyLegPassengers - 1))}
                                className="w-6 h-6 rounded-full border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 text-xs flex items-center justify-center"
                              >−</button>
                              <span className="text-sm font-medium text-gray-900 w-4 text-center">{emptyLegPassengers}</span>
                              <button
                                onClick={() => setEmptyLegPassengers(Math.min(rawData.capacity || rawData.pax || 14, emptyLegPassengers + 1))}
                                className="w-6 h-6 rounded-full border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 text-xs flex items-center justify-center"
                              >+</button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-gray-50">
                            <span className="text-xs text-gray-600">Luggage</span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setEmptyLegLuggage(Math.max(0, emptyLegLuggage - 1))}
                                className="w-6 h-6 rounded-full border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 text-xs flex items-center justify-center"
                              >−</button>
                              <span className="text-sm font-medium text-gray-900 w-4 text-center">{emptyLegLuggage}</span>
                              <button
                                onClick={() => setEmptyLegLuggage(Math.min((rawData.capacity || rawData.pax || 14) * 2, emptyLegLuggage + 1))}
                                className="w-6 h-6 rounded-full border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 text-xs flex items-center justify-center"
                              >+</button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-xs text-gray-600">Pet onboard</span>
                            <button
                              onClick={() => setEmptyLegHasPet(!emptyLegHasPet)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                emptyLegHasPet
                                  ? 'bg-gray-900 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {emptyLegHasPet ? 'Yes' : 'No'}
                            </button>
                          </div>
                        </div>

                        {/* Price Breakdown - Base + VAT only */}
                        {(() => {
                          const priceUSD = selectedEmptyLeg?.priceUSD || 0;
                          const vatAmount = Math.round(priceUSD * 0.081); // 8.1% Swiss VAT
                          const totalWithVAT = priceUSD + vatAmount;
                          return (
                            <div className="space-y-2 mb-4 pt-3 border-t border-gray-100">
                              {priceUSD > 0 ? (
                                <>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Base Price</span>
                                    <span className="text-gray-900">${priceUSD.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">VAT (8.1%)</span>
                                    <span className="text-gray-900">${vatAmount.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                                    <span className="font-medium text-gray-900">Total</span>
                                    <span className="font-semibold text-gray-900">${totalWithVAT.toLocaleString()}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Price</span>
                                    <span className="text-gray-900">{selectedEmptyLeg.totalPrice}</span>
                                  </div>
                                  <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                                    <span className="font-medium text-gray-900">Total</span>
                                    <span className="font-semibold text-gray-900">{selectedEmptyLeg.totalPrice}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })()}

                        {/* Action Buttons - Clean */}
                        <BuyWithCryptoButton
                          serviceType="empty_leg"
                          serviceId={selectedEmptyLeg?.rawData?.id || selectedEmptyLeg?.id}
                          serviceTitle={selectedEmptyLeg?.name || `${selectedEmptyLeg?.rawData?.from_iata || selectedEmptyLeg?.rawData?.from_city || 'DEP'} → ${selectedEmptyLeg?.rawData?.to_iata || selectedEmptyLeg?.rawData?.to_city || 'ARR'}`}
                          serviceDescription={selectedEmptyLeg?.category || selectedEmptyLeg?.rawData?.aircraft_type || 'Empty Leg Flight'}
                          price={selectedEmptyLeg?.priceUSD || 0}
                          currency="USD"
                          imageUrl={selectedEmptyLeg?.image}
                          origin={selectedEmptyLeg?.rawData?.from_iata || selectedEmptyLeg?.rawData?.from_city}
                          destination={selectedEmptyLeg?.rawData?.to_iata || selectedEmptyLeg?.rawData?.to_city}
                          aircraft={selectedEmptyLeg?.category || selectedEmptyLeg?.rawData?.aircraft_type}
                          departureDate={selectedEmptyLeg?.rawData?.departure_date}
                          passengers={selectedEmptyLeg?.rawData?.max_passengers || selectedEmptyLeg?.rawData?.capacity}
                          rawData={{
                            ...selectedEmptyLeg?.rawData,
                            // Pre-calculate total with VAT for consistency
                            price_usd: selectedEmptyLeg?.priceUSD || 0,
                            totalWithFee: Math.round((selectedEmptyLeg?.priceUSD || 0) * 1.081)
                          }}
                          user={user}
                          variant="gradient"
                          className="mb-3"
                          onShowLoginModal={() => setShowLoginModal(true)}
                        />

                        {/* Request Flight - Secondary */}
                        <button
                          onClick={requestEmptyLegFlight}
                          className="w-full py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-3"
                        >
                          Request Flight
                        </button>

                        {/* NFT Check - Minimal */}
                        <button
                          onClick={checkNFTMembership}
                          disabled={isCheckingNFT}
                          className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {isCheckingNFT ? 'Checking...' : 'Check NFT benefits'}
                        </button>
                      </div>
                    </div>

                    {/* Help - Minimal Footer */}
                    <div className="mt-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-gray-400" />
                          <span className="text-xs text-gray-500">Need help?</span>
                        </div>
                        <a href="mailto:bookings@privatecharterx.com" className="text-xs font-medium text-gray-900 hover:underline">
                          Contact us
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* No Results */}
              {!isLoadingEmptyLegs && !showEmptyLegDetail && emptyLegsData.length === 0 && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-sm text-gray-600">No empty legs found matching your criteria.</div>
                </div>
              )}
              <PageFooter />
            </div>
          )}

          {/* HOTELS SECTION */}
          {!isTransitioning && activeCategory === 'hotels' && (
            <div className="w-full flex-1 flex flex-col">
              <HotelsView onBack={() => setActiveCategory('jets')} />
            </div>
          )}

          {/* ADVENTURES SECTION - Airbnb Style */}
          {!isTransitioning && activeCategory === 'adventures' && (
            <div className="w-full h-full overflow-y-auto flex flex-col">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 gap-3 pt-4 md:pt-6">
                <h2 className="text-xl md:text-3xl lg:text-4xl font-light text-gray-900 tracking-tighter">Adventures</h2>
              </div>

              {/* Region Filter Pills + Search */}
              <div className="flex items-center justify-between gap-4 pb-4 mb-4">
                {/* Location Badges */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'europe', label: 'Europe' },
                    { id: 'usa', label: 'USA' },
                    { id: 'asia', label: 'Asia' },
                    { id: 'africa', label: 'Africa' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setAdventuresFilter(cat.id)}
                      className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                        adventuresFilter === cat.id
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Search Input - Right side */}
                <div className="relative flex-shrink-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    value={adventuresSearch}
                    onChange={(e) => setAdventuresSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-40 pl-9 pr-3 py-2 bg-gray-100 border-none rounded-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all"
                  />
                </div>
              </div>

              {/* Results count */}
              <p className="text-sm text-gray-500 mb-4">
                {adventuresData.length} adventure{adventuresData.length !== 1 ? 's' : ''} available
              </p>

              {/* Loading State */}
              {isLoadingAdventures && (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 rounded-xl aspect-[4/3] mb-2 sm:mb-3"></div>
                      <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                      <div className="bg-gray-200 h-3 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              )}

              {/* Adventures Grid - Airbnb Style */}
              {!isLoadingAdventures && adventuresData.length > 0 && (
                <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  {adventuresData.map((adventure) => (
                    <div
                      key={adventure.id}
                      onClick={() => setSelectedAdventure(adventure)}
                      className="group cursor-pointer active:scale-[0.98] transition-transform"
                    >
                      {/* Image */}
                      <div className="relative aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden mb-2 sm:mb-3">
                        <img
                          src={adventure.image || 'https://auth.privatecharterx.com/storage/v1/object/sign/moreVideos/Whisk_7da17c1fb12a69698224a40c29f3815feg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb3JlVmlkZW9zL1doaXNrXzdkYTE3YzFmYjEyYTY5Njk4MjI0YTQwYzI5ZjM4MTVmZWcucG5nIiwiaWF0IjoxNzY4NzcxMTkwLCJleHAiOjE4MDAzMDcxOTB9.wtWrpjsjr2AcFpiuYGNLdGSuuJMsdvVeLERPZN2Nz7c'}
                          alt={adventure.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        {adventure.isFreeWithNFT && (
                          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                            <span className="bg-green-500 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium">
                              FREE with NFT
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div>
                        <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                          {adventure.name}
                        </h3>

                        <div className="flex items-center gap-1 text-gray-500 text-xs sm:text-sm mb-1">
                          <MapPin size={10} className="flex-shrink-0" />
                          <span className="line-clamp-1">
                            {adventure.location || 'Exclusive Location'}
                          </span>
                        </div>

                        <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500 mb-2">
                          {adventure.yield && (
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {adventure.yield}
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm">
                          <span className="font-semibold text-gray-900">
                            {adventure.totalPrice || 'On Request'}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                </>
              )}

              {/* No Results */}
              {!isLoadingAdventures && adventuresData.length === 0 && (
                <div className="text-center py-12 sm:py-16">
                  <Plane size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No adventures found</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your filters</p>
                  <button
                    onClick={() => setAdventuresFilter('all')}
                    className="text-gray-900 underline text-sm"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
              <PageFooter />
            </div>
          )}

          {/* FLIGHTS SECTION */}
          {!isTransitioning && activeCategory === 'flights' && (
            <div className="w-full flex-1 flex flex-col">
              <FlightSearchDashboard onShowLoginModal={() => setShowLoginModal(true)} />
              <PageFooter />
            </div>
          )}

          {/* CARD DASHBOARD - Marqeta Card Management - Hidden pending integration
          {!isTransitioning && activeCategory === 'card' && (
            <MarqetaCardDashboard setActiveCategory={setActiveCategory} />
          )}
          */}

          {/* SERVICES SECTION - Neobanking Style Overview */}
          {!isTransitioning && activeCategory === 'services' && (
            <div className="w-full flex-1 flex flex-col px-4 md:px-8 max-w-6xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter mb-2">Services</h1>
                <p className="text-gray-500 text-base">Explore our full range of luxury travel services</p>
              </div>

              {/* Services Grid - Bigger Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

                {/* Commercial Flights - Wide Card */}
                <div className="col-span-2 group rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 bg-gray-100 border border-gray-200 h-[300px] flex flex-col cursor-pointer" onClick={() => setActiveCategory('flights')}>
                  <div className="relative h-[50%] overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: 'url(https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_e82354997b9109c97864b1fcd5f56776dr.png)' }}
                    />
                  </div>
                  <div className="flex-1 p-4 bg-gray-100 flex flex-col">
                    <h3 className="text-lg font-light mb-1 tracking-tight">
                      <span className="text-gray-900">Commercial</span> <span className="text-gray-500">Flights</span>
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">Swiss, Lufthansa & 900+ airlines</p>
                    <div className="flex gap-2 mb-3">
                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">900+ Airlines</span>
                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">Crypto Pay</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setAiChatQuery('commercial flights'); setActiveCategory('chat'); }}
                      className="mt-auto w-fit px-4 py-2 bg-gray-900 rounded-full text-xs text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <Sparkles size={14} />
                      Explore by AI
                    </button>
                  </div>
                </div>

                {/* Private Jets */}
                <div className="group rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 bg-gray-100 border border-gray-200 h-[300px] flex flex-col cursor-pointer" onClick={() => setActiveCategory('jets')}>
                  <div className="relative h-[50%] overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: 'url(https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_a5109b014ee92cba42f48bfebce4fd92eg.png)' }}
                    />
                  </div>
                  <div className="flex-1 p-4 bg-gray-100 flex flex-col">
                    <h3 className="text-base font-light mb-1 tracking-tight">
                      <span className="text-gray-900">Private</span> <span className="text-gray-500">Jets</span>
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">16,000+ aircraft worldwide</p>
                    <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs w-fit mb-3">24/7 Service</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setAiChatQuery('private jet charter'); setActiveCategory('chat'); }}
                      className="mt-auto w-fit px-4 py-2 bg-gray-900 rounded-full text-xs text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <Sparkles size={14} />
                      Explore by AI
                    </button>
                  </div>
                </div>

                {/* Empty Legs */}
                <div className="group rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 bg-gray-100 border border-gray-200 h-[300px] flex flex-col cursor-pointer" onClick={() => setActiveCategory('empty-legs')}>
                  <div className="relative h-[50%] overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: 'url(https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_8eaf61762669635badd48e59c304b6c3eg.png)' }}
                    />
                  </div>
                  <div className="flex-1 p-4 bg-gray-100 flex flex-col">
                    <h3 className="text-base font-light mb-1 tracking-tight">
                      <span className="text-gray-900">Empty</span> <span className="text-gray-500">Legs</span>
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">Save up to 75% on private jets</p>
                    <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium w-fit mb-3">Up to 75% Off</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setAiChatQuery('empty leg flights'); setActiveCategory('chat'); }}
                      className="mt-auto w-fit px-4 py-2 bg-gray-900 rounded-full text-xs text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <Sparkles size={14} />
                      Explore by AI
                    </button>
                  </div>
                </div>

                {/* Yachts - with video */}
                <div className="group rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 bg-gray-100 border border-gray-200 h-[300px] flex flex-col">
                  <div className="relative h-[50%] overflow-hidden cursor-pointer" onClick={() => {
                    setAiChatQuery('yacht charter');
                    setActiveCategory('chat');
                  }}>
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    >
                      <source src="https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/4920651-uhd_4096_2160_25fps.mp4" type="video/mp4" />
                    </video>
                  </div>
                  <div className="flex-1 p-4 bg-gray-100 flex flex-col">
                    <h3 className="text-base font-light mb-1 tracking-tight">
                      <span className="text-gray-900">Yacht</span> <span className="text-gray-500">Charter</span>
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">Luxury yachts worldwide</p>
                    <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs w-fit mb-3">Mediterranean</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setAiChatQuery('yacht charter'); setActiveCategory('chat'); }}
                      className="mt-auto w-fit px-4 py-2 bg-gray-900 rounded-full text-xs text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <Sparkles size={14} />
                      Explore by AI
                    </button>
                  </div>
                </div>

                {/* Ground Transport */}
                <div className="group rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 bg-gray-100 border border-gray-200 h-[300px] flex flex-col cursor-pointer" onClick={() => setActiveCategory('ground-transport')}>
                  <div className="relative h-[50%] overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: 'url(https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_60417b0dd969afb83c44f8733d7156eaeg.png)', backgroundPosition: 'center -20px', backgroundSize: '110%' }}
                    />
                  </div>
                  <div className="flex-1 p-4 bg-gray-100 flex flex-col">
                    <h3 className="text-base font-light mb-1 tracking-tight">
                      <span className="text-gray-900">Ground</span> <span className="text-gray-500">Transport</span>
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">Chauffeur & airport transfers</p>
                    <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs w-fit mb-3">24/7</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setAiChatQuery('airport transfer'); setActiveCategory('chat'); }}
                      className="mt-auto w-fit px-4 py-2 bg-gray-900 rounded-full text-xs text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <Sparkles size={14} />
                      Explore by AI
                    </button>
                  </div>
                </div>

                {/* Adventures - Wide Card - NO AI button */}
                <div className="col-span-2 group rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 bg-gray-100 border border-gray-200 h-[300px] flex flex-col cursor-pointer" onClick={() => setActiveCategory('adventures')}>
                  <div className="relative h-[50%] overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: 'url(https://auth.privatecharterx.com/storage/v1/object/sign/moreVideos/Whisk_7da17c1fb12a69698224a40c29f3815feg.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb3JlVmlkZW9zL1doaXNrXzdkYTE3YzFmYjEyYTY5Njk4MjI0YTQwYzI5ZjM4MTVmZWcucG5nIiwiaWF0IjoxNzY4NzcxMTkwLCJleHAiOjE4MDAzMDcxOTB9.wtWrpjsjr2AcFpiuYGNLdGSuuJMsdvVeLERPZN2Nz7c)' }}
                    />
                  </div>
                  <div className="flex-1 p-4 bg-gray-100 flex flex-col">
                    <h3 className="text-lg font-light mb-1 tracking-tight">
                      <span className="text-gray-900">Adventure</span> <span className="text-gray-500">Packages</span>
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">Curated luxury experiences worldwide</p>
                    <div className="flex gap-2 mb-3">
                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">All-Inclusive</span>
                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">Curated</span>
                    </div>
                    <span className="mt-auto text-sm text-gray-500">Click to explore packages →</span>
                  </div>
                </div>

                {/* Helicopters */}
                <div className="group rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 bg-gray-100 border border-gray-200 h-[300px] flex flex-col cursor-pointer" onClick={() => setActiveCategory('helicopter')}>
                  <div className="relative h-[50%] overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: 'url(https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_bf9f83710232184b8f94a95270a5a4beeg.png)' }}
                    />
                  </div>
                  <div className="flex-1 p-4 bg-gray-100 flex flex-col">
                    <h3 className="text-base font-light mb-1 tracking-tight">
                      <span className="text-gray-900">Heli</span><span className="text-gray-500">copters</span>
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">City transfers & scenic tours</p>
                    <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs w-fit mb-3">Short Range</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setAiChatQuery('helicopter charter'); setActiveCategory('chat'); }}
                      className="mt-auto w-fit px-4 py-2 bg-gray-900 rounded-full text-xs text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <Sparkles size={14} />
                      Explore by AI
                    </button>
                  </div>
                </div>

                {/* NFT Membership */}
                <div className="group rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 bg-gray-100 border border-gray-200 h-[300px] flex flex-col cursor-pointer" onClick={() => setActiveCategory('nft-membership')}>
                  <div className="relative h-[50%] overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: 'url(https://auth.privatecharterx.com/storage/v1/object/public/logos/Whisk_iwzzu2nzizyzmmn50szjzgotutn1qtllfwnh1so.png)' }}
                    />
                  </div>
                  <div className="flex-1 p-4 bg-gray-100 flex flex-col">
                    <h3 className="text-base font-light mb-1 tracking-tight">
                      <span className="text-gray-900">NFT</span> <span className="text-gray-500">Membership</span>
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">Exclusive benefits & rewards</p>
                    <div className="flex gap-2 mb-3">
                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">10% Off</span>
                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">Free Empty Leg</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setAiChatQuery('NFT membership benefits'); setActiveCategory('chat'); }}
                      className="mt-auto w-fit px-4 py-2 bg-gray-900 rounded-full text-xs text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <Sparkles size={14} />
                      Explore by AI
                    </button>
                  </div>
                </div>

                {/* MEDEVAC - Keep Get a Quote */}
                <div className="group rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 bg-gray-100 border border-gray-200 h-[300px] flex flex-col">
                  <div className="relative h-[50%] overflow-hidden cursor-pointer" onClick={() => {
                    setAiChatQuery('medevac medical evacuation');
                    setActiveCategory('chat');
                  }}>
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: 'url(https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_298998b167301be944d4ff7fb3bc74e5eg.png)' }}
                    />
                  </div>
                  <div className="flex-1 p-4 bg-gray-100 flex flex-col">
                    <h3 className="text-base font-light mb-1 tracking-tight">
                      <span className="text-gray-900">MED</span><span className="text-gray-500">EVAC</span>
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">Medical evacuation & air ambulance</p>
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium w-fit mb-3">24/7 Emergency</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setAiChatQuery('medevac medical evacuation'); setActiveCategory('chat'); }}
                      className="mt-auto w-fit px-4 py-2 bg-gray-900 rounded-full text-xs text-white hover:bg-gray-800 transition-colors"
                    >
                      Get a Quote
                    </button>
                  </div>
                </div>

                {/* Concierge - with video */}
                <div className="group rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 bg-gray-100 border border-gray-200 h-[300px] flex flex-col cursor-pointer" onClick={() => setActiveCategory('concierge')}>
                  <div className="relative h-[50%] overflow-hidden">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    >
                      <source src="https://auth.privatecharterx.com/storage/v1/object/sign/moreVideos/9519379-uhd_4096_2160_25fps.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb3JlVmlkZW9zLzk1MTkzNzktdWhkXzQwOTZfMjE2MF8yNWZwcy5tcDQiLCJpYXQiOjE3Njg3NjQ1MTMsImV4cCI6Njg2MDAzODIyNjIxMTN9.McSTtByO71Gqk7WP54ONfI5n-5QNvHAoMqBVJ8Z6N9Q" type="video/mp4" />
                    </video>
                  </div>
                  <div className="flex-1 p-4 bg-gray-100 flex flex-col">
                    <h3 className="text-base font-light mb-1 tracking-tight">
                      <span className="text-gray-900">Con</span><span className="text-gray-500">cierge</span>
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">24/7 personal assistance</p>
                    <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs w-fit mb-3">VIP Service</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setAiChatQuery('concierge service'); setActiveCategory('chat'); }}
                      className="mt-auto w-fit px-4 py-2 bg-gray-900 rounded-full text-xs text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <Sparkles size={14} />
                      Explore by AI
                    </button>
                  </div>
                </div>

                {/* Group Charter - Full Width Horizontal Card */}
                <div className="col-span-2 lg:col-span-4 group rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 bg-gray-100 border border-gray-200 h-[200px] flex">
                  <div className="relative w-2/5 overflow-hidden cursor-pointer" onClick={() => {
                    setAiChatQuery('group charter');
                    setActiveCategory('chat');
                  }}>
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: 'url(https://auth.privatecharterx.com/storage/v1/object/public/uber%20imgs/Whisk_a03676b0c23fce485f841fbe26bcc9ffeg%20%281%29.png)' }}
                    />
                  </div>
                  <div className="flex-1 p-5 bg-gray-100 flex flex-col justify-center">
                    <h3 className="text-xl font-light mb-1 tracking-tight">
                      <span className="text-gray-900">Group</span> <span className="text-gray-500">Charter</span>
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 max-w-md">
                      Tailored solutions for corporate events, sports teams, and large groups.
                    </p>
                    <div className="flex gap-2 mb-3">
                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">10+ Passengers</span>
                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">Corporate</span>
                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">Events</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setAiChatQuery('group charter'); setActiveCategory('chat'); }}
                      className="w-fit px-4 py-2 bg-gray-900 rounded-full text-xs text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <Sparkles size={14} />
                      Explore by AI
                    </button>
                  </div>
                </div>

              </div>

              {/* Simple Footer Links - No Promo Banner */}
              <div className="mt-8 mb-4 text-center text-[9px] text-gray-300">
                <button onClick={() => setActiveCategory('terms')} className="hover:text-gray-500">Terms</button>
                <span className="mx-1.5">·</span>
                <button onClick={() => setActiveCategory('privacy')} className="hover:text-gray-500">Privacy</button>
                <span className="mx-1.5">·</span>
                <button onClick={() => setActiveCategory('imprint')} className="hover:text-gray-500">Imprint</button>
                <span className="mx-1.5">·</span>
                <span>PrivateCharterX LLC · Miami, FL</span>
              </div>
            </div>
          )}

          {/* ADVENTURE BOOKING MODAL */}
          {selectedAdventure && selectedAdventure.rawData && (
            <AdventureBookingModal
              isOpen={!!selectedAdventure}
              onClose={() => setSelectedAdventure(null)}
              adventure={selectedAdventure.rawData}
              onShowLoginModal={() => setShowLoginModal(true)}
            />
          )}

          {/* LUXURY CARS SECTION */}
          {!isTransitioning && activeCategory === 'luxury-cars' && (
            <div className="w-full flex-1 flex flex-col">

              {/* Luxury Cars Header with View Switcher */}
              {!showLuxuryCarDetail && (
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">Luxury Cars</h2>
                  <div className="flex items-center gap-3">
                    {/* Filter Toggle Button */}
                    <button
                      onClick={() => setLuxuryCarsFiltersVisible(!luxuryCarsFiltersVisible)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all backdrop-blur-xl border ${
                        luxuryCarsFiltersVisible
                          ? 'bg-gray-800 text-white border-gray-800'
                          : 'bg-gray-100/60 text-gray-700 border-gray-300/50 hover:bg-gray-200/60'
                      }`}
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      <SlidersHorizontal size={14} />
                      <span>Filters</span>
                    </button>

                    {/* View Mode Switcher */}
                    <div className="flex items-center gap-1 bg-gray-100/60 border border-gray-300/50 rounded-lg p-1 backdrop-blur-xl" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                      <button
                        onClick={() => setLuxuryCarsViewMode('grid')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                          luxuryCarsViewMode === 'grid'
                            ? 'bg-gray-800 text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Grid
                      </button>
                      <button
                        onClick={() => setLuxuryCarsViewMode('tabs')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                          luxuryCarsViewMode === 'tabs'
                            ? 'bg-gray-800 text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Tabs
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Luxury Cars Filters */}
              {!showLuxuryCarDetail && luxuryCarsFiltersVisible && (
                <div className="bg-gray-100/60 rounded-lg border border-gray-300/50 p-5 mb-6 backdrop-blur-xl transition-all duration-300" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-800 mb-2">Car Type</label>
                      <select
                        value={luxuryCarsFilter}
                        onChange={(e) => setLuxuryCarsFilter(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300/50 rounded-lg bg-white/60 text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                        style={{ backdropFilter: 'blur(10px) saturate(150%)' }}
                      >
                        <option value="all">All Types</option>
                        <option value="Supercar">Supercar</option>
                        <option value="SUV">SUV</option>
                        <option value="Convertible">Convertible</option>
                        <option value="Luxury Coupe">Luxury Coupe</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-800 mb-2">Brand</label>
                      <input
                        type="text"
                        placeholder="e.g. Mercedes, BMW"
                        value={luxuryCarsBrand}
                        onChange={(e) => setLuxuryCarsBrand(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300/50 rounded-lg bg-white/60 text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                        style={{ backdropFilter: 'blur(10px) saturate(150%)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-800 mb-2">Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Monaco, Dubai"
                        value={luxuryCarsLocation}
                        onChange={(e) => setLuxuryCarsLocation(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300/50 rounded-lg bg-white/60 text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                        style={{ backdropFilter: 'blur(10px) saturate(150%)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-800 mb-2">Max Price/Day ($)</label>
                      <input
                        type="number"
                        placeholder="e.g. 1000"
                        value={luxuryCarsMaxPrice}
                        onChange={(e) => setLuxuryCarsMaxPrice(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300/50 rounded-lg bg-white/60 text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                        style={{ backdropFilter: 'blur(10px) saturate(150%)' }}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setLuxuryCarsBrand('');
                          setLuxuryCarsLocation('');
                          setLuxuryCarsMaxPrice('');
                          setLuxuryCarsFilter('all');
                        }}
                        className="w-full px-4 py-2.5 bg-gray-100/60 text-gray-700 rounded-lg text-sm hover:bg-gray-200/60 transition-all"
                        style={{ backdropFilter: 'blur(10px) saturate(150%)' }}
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isLoadingLuxuryCars && (
                <div className="flex justify-center items-center py-12">
                  <div className="w-20 h-20">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                    >
                      <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/videoExport-2025-10-19@11-32-10.850-540x540@60fps.mp4" type="video/mp4" />
                    </video>
                  </div>
                </div>
              )}

              {/* Luxury Cars Grid View */}
              {!isLoadingLuxuryCars && !showLuxuryCarDetail && luxuryCarsViewMode === 'grid' && (
                <>
                <div className="grid grid-cols-2 gap-5">
                  {luxuryCarsData
                    .slice((currentLuxuryCarsPage - 1) * luxuryCarsPerPage, currentLuxuryCarsPage * luxuryCarsPerPage)
                    .map((car) => (
                    <div
                      key={car.id}
                      onClick={() => {
                        setSelectedLuxuryCar(car);
                        setShowLuxuryCarDetail(true);
                        setCurrentLuxuryCarImageIndex(0);
                      }}
                      className="bg-white/35 hover:bg-white/40 rounded-xl flex h-64 hover:shadow-lg transition-all cursor-pointer border border-gray-300/50"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      <div className="w-2/5 bg-white/10 relative flex-shrink-0 rounded-l-xl overflow-hidden">
                        {car.image && (
                          <img
                            src={car.image}
                            alt={car.name}
                            className="w-full h-64 object-cover"
                          />
                        )}
                        <div className="absolute top-3 left-3 flex flex-col space-y-1.5">
                          <div className="flex space-x-1.5">
                            <div className="bg-white/90 px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                              <span>{car.location}</span>
                            </div>
                            <div className="bg-white/90 px-2 py-1 rounded text-xs font-medium">◆ {car.category}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">PCX CARS</span>
                        </div>
                        <h3 className="text-base font-semibold text-gray-800 mb-4 line-clamp-2 overflow-hidden">{car.name}</h3>
                        <div className="flex space-x-6 border-b border-gray-600/30 mb-5">
                          <button className="pb-3 text-xs relative text-gray-800">
                            Properties
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800"></div>
                          </button>
                          <button className="pb-3 text-xs text-gray-600">Description</button>
                        </div>

                        <div className="flex justify-between mt-auto mb-5">
                          <div className="flex flex-col space-y-1">
                            <span className="text-xs text-gray-600">Price/Day</span>
                            <span className="text-sm font-semibold text-gray-800">{car.totalPrice}</span>
                          </div>
                          <div className="flex flex-col space-y-1">
                            <span className="text-xs text-gray-600">Price/Hour</span>
                            <span className="text-sm font-semibold text-gray-800">{car.yield}</span>
                          </div>
                          <div className="flex flex-col space-y-1">
                            <span className="text-xs text-gray-600">Price/Week</span>
                            <span className="text-sm font-semibold text-gray-800">{car.period}</span>
                          </div>
                        </div>

                        <div className="flex space-x-4 pt-4 border-t border-gray-600/30 text-xs">
                          <a href="#" className="text-gray-600 hover:text-gray-800">See details ↗</a>
                          <a href="#" className="text-gray-600 hover:text-gray-800">Specifications ⚖</a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {luxuryCarsData.length > luxuryCarsPerPage && (
                  <div className="flex justify-center items-center mt-8 gap-2">
                    <button
                      onClick={() => setCurrentLuxuryCarsPage(prev => Math.max(1, prev - 1))}
                      disabled={currentLuxuryCarsPage === 1}
                      className="px-4 py-2 bg-white/35 hover:bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      Previous
                    </button>

                    {(() => {
                      const totalPages = Math.ceil(luxuryCarsData.length / luxuryCarsPerPage);
                      const pages = [];

                      if (totalPages <= 5) {
                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                      } else {
                        pages.push(1);
                        if (currentLuxuryCarsPage > 3) pages.push('...');

                        for (let i = Math.max(2, currentLuxuryCarsPage - 1); i <= Math.min(totalPages - 1, currentLuxuryCarsPage + 1); i++) {
                          if (!pages.includes(i)) pages.push(i);
                        }

                        if (currentLuxuryCarsPage < totalPages - 2) pages.push('...');
                        if (!pages.includes(totalPages)) pages.push(totalPages);
                      }

                      return pages.map((page, idx) =>
                        page === '...' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setCurrentLuxuryCarsPage(page)}
                            className={`w-10 h-10 rounded-lg text-sm transition-all ${
                              currentLuxuryCarsPage === page
                                ? 'bg-gray-800 text-white'
                                : 'bg-white/35 hover:bg-white/40 border border-gray-300/50 text-gray-700'
                            }`}
                            style={currentLuxuryCarsPage !== page ? { backdropFilter: 'blur(20px) saturate(180%)' } : {}}
                          >
                            {page}
                          </button>
                        )
                      );
                    })()}

                    <button
                      onClick={() => setCurrentLuxuryCarsPage(prev => Math.min(Math.ceil(luxuryCarsData.length / luxuryCarsPerPage), prev + 1))}
                      disabled={currentLuxuryCarsPage === Math.ceil(luxuryCarsData.length / luxuryCarsPerPage)}
                      className="px-4 py-2 bg-white/35 hover:bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      Next
                    </button>
                  </div>
                )}
                </>
              )}

              {/* Luxury Cars Tabs View */}
              {!isLoadingLuxuryCars && !showLuxuryCarDetail && luxuryCarsViewMode === 'tabs' && (
                <div className="w-full space-y-2">
                  {luxuryCarsData
                    .slice((currentLuxuryCarsPage - 1) * luxuryCarsPerPage, currentLuxuryCarsPage * luxuryCarsPerPage)
                    .map((car) => (
                    <div
                      key={car.id}
                      className="bg-white/35 hover:bg-white/40 rounded-lg transition-all cursor-pointer border border-gray-300/50"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                      onClick={() => {
                        setSelectedLuxuryCar(car);
                        setShowLuxuryCarDetail(true);
                        setCurrentLuxuryCarImageIndex(0);
                      }}
                    >
                      <div className="flex items-center p-4 gap-4">
                        {/* Image */}
                        <div className="w-20 h-20 flex-shrink-0 rounded overflow-hidden">
                          <img src={car.image} alt={car.name} className="w-full h-full object-cover" />
                        </div>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-800">{car.name}</h3>
                          <p className="text-xs text-gray-600">{car.category}</p>
                        </div>

                        {/* Location */}
                        <div className="text-center px-4">
                          <div className="text-sm font-light text-gray-800">{car.location}</div>
                          <div className="text-[10px] text-gray-600">Location</div>
                        </div>

                        {/* Price/Day */}
                        <div className="text-center px-4">
                          <div className="text-sm font-light text-gray-800">{car.totalPrice}</div>
                          <div className="text-[10px] text-gray-600">Price/Day</div>
                        </div>

                        {/* Price/Hour */}
                        <div className="text-center px-4">
                          <div className="text-sm font-light text-gray-800">{car.yield}</div>
                          <div className="text-[10px] text-gray-600">Price/Hour</div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2 flex-shrink-0">
                          <button className="px-4 py-2 bg-gray-800 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-all">
                            View Details
                          </button>
                          <button className="px-4 py-2 bg-white/20 border border-gray-300/50 text-gray-800 rounded-lg text-xs font-medium hover:bg-white/30 transition-all">
                            Read More
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {luxuryCarsData.length > luxuryCarsPerPage && (
                    <div className="flex justify-center items-center mt-8 gap-2">
                      <button
                        onClick={() => setCurrentLuxuryCarsPage(prev => Math.max(1, prev - 1))}
                        disabled={currentLuxuryCarsPage === 1}
                        className="px-4 py-2 bg-white/35 hover:bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                      >
                        Previous
                      </button>

                      {(() => {
                        const totalPages = Math.ceil(luxuryCarsData.length / luxuryCarsPerPage);
                        const pages = [];

                        if (totalPages <= 5) {
                          for (let i = 1; i <= totalPages; i++) pages.push(i);
                        } else {
                          pages.push(1);
                          if (currentLuxuryCarsPage > 3) pages.push('...');

                          for (let i = Math.max(2, currentLuxuryCarsPage - 1); i <= Math.min(totalPages - 1, currentLuxuryCarsPage + 1); i++) {
                            if (!pages.includes(i)) pages.push(i);
                          }

                          if (currentLuxuryCarsPage < totalPages - 2) pages.push('...');
                          if (!pages.includes(totalPages)) pages.push(totalPages);
                        }

                        return pages.map((page, idx) =>
                          page === '...' ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => setCurrentLuxuryCarsPage(page)}
                              className={`w-10 h-10 rounded-lg text-sm transition-all ${
                                currentLuxuryCarsPage === page
                                  ? 'bg-gray-800 text-white'
                                  : 'bg-white/35 hover:bg-white/40 border border-gray-300/50 text-gray-700'
                              }`}
                              style={currentLuxuryCarsPage !== page ? { backdropFilter: 'blur(20px) saturate(180%)' } : {}}
                            >
                              {page}
                            </button>
                          )
                        );
                      })()}

                      <button
                        onClick={() => setCurrentLuxuryCarsPage(prev => Math.min(Math.ceil(luxuryCarsData.length / luxuryCarsPerPage), prev + 1))}
                        disabled={currentLuxuryCarsPage === Math.ceil(luxuryCarsData.length / luxuryCarsPerPage)}
                        className="px-4 py-2 bg-white/35 hover:bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Luxury Car Detail View - Full Layout */}
              {showLuxuryCarDetail && selectedLuxuryCar && (() => {
                const car = selectedLuxuryCar.rawData || {};
                const priceDayLabel = car.price_per_day ? `$${Math.round(convertToUSD(car.price_per_day, 'EUR')).toLocaleString()}/day` : 'On Request';
                const priceHourLabel = car.price_per_hour ? `$${Math.round(convertToUSD(car.price_per_hour, 'EUR')).toLocaleString()}/hr` : 'On Request';
                const priceWeekLabel = car.price_per_week ? `$${Math.round(convertToUSD(car.price_per_week, 'EUR')).toLocaleString()}/wk` : 'On Request';
                return (
                  <div className="w-full max-w-7xl">
                    {/* Header Section with Image and Main Info */}
                    <div className="bg-white/35 rounded-lg border border-gray-300/50 mb-6 overflow-hidden" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                      <div className="grid grid-cols-2 gap-0">
                        {/* Left: Hero Image */}
                        <div className="relative h-96">
                          <img
                            src={selectedLuxuryCar.image}
                            alt={selectedLuxuryCar.name}
                            className="w-full h-full object-cover"
                          />
                          {/* Badges on Image */}
                          <div className="absolute top-4 left-4 flex gap-2">
                            <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-gray-800">● Available</span>
                            <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-medium">🚗 Luxury Car</span>
                          </div>
                        </div>

                        {/* Overlay Back Button on image for quick access */}
                        <button
                          onClick={() => {
                            setShowLuxuryCarDetail(false);
                            setSelectedLuxuryCar(null);
                            setCurrentLuxuryCarImageIndex(0);
                            setLuxuryCarDetailTab('details');
                          }}
                          className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-800 border border-gray-300 rounded-full px-3 py-1 text-xs font-medium shadow-sm"
                        >
                          ← Back
                        </button>

                        {/* Right: Car Info */}
                        <div className="flex-1 p-5 flex flex-col">
                          <div className="flex items-center justify-between mb-3">
                            <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">PCX CARS</span>
                          </div>

                          <h1 className="text-2xl font-semibold mb-2 text-gray-900">{selectedLuxuryCar.name}</h1>
                          <p className="text-sm text-gray-600 mb-4">{car.location || selectedLuxuryCar.location}</p>

                          {/* Tabs */}
                          <div className="flex space-x-6 border-b border-gray-300/50 mb-4">
                            {[
                              { key: 'details', label: 'Details' },
                              { key: 'specs', label: 'Specifications' },
                              { key: 'pricing', label: 'Pricing' },
                            ].map(tab => (
                              <button
                                key={tab.key}
                                onClick={() => setLuxuryCarDetailTab(tab.key)}
                                className={`pb-3 text-sm font-medium transition-colors ${
                                  luxuryCarDetailTab === tab.key ? 'text-gray-800 border-b-2 border-gray-800' : 'text-gray-600 hover:text-gray-800'
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          {/* Key Info Grid */}
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Price/Day</p>
                              <p className="text-base font-semibold text-gray-800">{priceDayLabel}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Seats</p>
                              <p className="text-base font-semibold text-gray-800">{car.seats || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Transmission</p>
                              <p className="text-base font-semibold text-gray-800">{car.transmission || '—'}</p>
                            </div>
                          </div>

                          {/* Links */}
                          <div className="flex space-x-4 text-xs mt-auto">
                            <a href="#" className="text-gray-600 hover:text-gray-800">Terms & Conditions ⚖</a>
                            <a href="#" className="text-gray-600 hover:text-gray-800">Contact concierge ↗</a>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Section: Car Details + Booking */}
                    <div className="grid grid-cols-3 gap-6">
                      {/* Left: Car Details (tabbed content) */}
                      <div className="col-span-2 bg-white/35 rounded-lg border border-gray-300/50 p-6 max-h-[600px] overflow-y-auto" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                        {luxuryCarDetailTab === 'details' && (
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Car Details</h2>
                            {car.description && (
                              <p className="text-sm text-gray-700 mb-6 whitespace-pre-line">{car.description}</p>
                            )}
                            <div className="grid grid-cols-2 gap-6 mb-6">
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Brand</p>
                                <p className="text-sm font-semibold text-gray-800">{car.brand || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Model</p>
                                <p className="text-sm font-semibold text-gray-800">{car.model || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Year</p>
                                <p className="text-sm font-semibold text-gray-800">{car.year || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Type</p>
                                <p className="text-sm font-semibold text-gray-800">{car.type || selectedLuxuryCar.category || 'Luxury Car'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Fuel</p>
                                <p className="text-sm font-semibold text-gray-800">{car.fuel_type || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Transmission</p>
                                <p className="text-sm font-semibold text-gray-800">{car.transmission || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Seats</p>
                                <p className="text-sm font-semibold text-gray-800">{car.seats || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Location</p>
                                <p className="text-sm font-semibold text-gray-800">{car.location || selectedLuxuryCar.location || '-'}</p>
                              </div>
                            </div>
                            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-6">
                              <div className="flex items-start gap-3 mb-3">
                                <span className="text-2xl">🌿</span>
                                <div>
                                  <h3 className="text-base font-bold text-green-900 mb-2">Sustainability Option</h3>
                                  <p className="text-sm text-green-800 mb-3">Offset your trip's carbon footprint with classic certification or blockchain-verified NFT certificate at checkout.</p>
                                  <div className="flex items-start gap-2">
                                    <span className="text-green-600">✓</span>
                                    <p className="text-sm text-green-900">
                                      <span className="font-semibold">Certificate choice:</span> Classic PDF or on-chain NFT certificate available.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* PVCX REWARDS Box for Luxury Cars */}
                            <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-6">
                              <div className="flex items-start gap-3">
                                <Coins className="text-blue-600 w-8 h-8" />
                                <div className="flex-1">
                                  <h3 className="text-base font-bold text-blue-900 mb-2">$PVCX Token Rewards</h3>
                                  <p className="text-sm text-blue-800 mb-3">Earn PVCX tokens based on distance traveled during your rental!</p>
                                  <div className="bg-white/50 rounded-lg p-4">
                                    <div className="text-center">
                                      <p className="text-xs text-blue-700 mb-2">Reward Rate</p>
                                      <p className="text-2xl font-bold text-blue-900 mb-2">
                                        <span className="text-lg">1.5</span> <span className="text-sm text-blue-700">$PVCX</span> <span className="text-base text-blue-700">per km</span>
                                      </p>
                                      <div className="border-t border-blue-200 mt-3 pt-3">
                                        <p className="text-xs text-blue-600">
                                          Example: 100 km drive = 150 $PVCX tokens
                                        </p>
                                        <p className="text-xs text-blue-600 mt-1">
                                          Track your distance and claim rewards after rental
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {luxuryCarDetailTab === 'specs' && (
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h2>
                            <p className="text-sm text-gray-700">Detailed specs coming soon. Our team will confirm exact configuration upon request.</p>
                          </div>
                        )}
                        {luxuryCarDetailTab === 'pricing' && (
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
                            <p className="text-sm text-gray-700 mb-2">Price/Day: {priceDayLabel}</p>
                            <p className="text-sm text-gray-700 mb-2">Price/Hour: {priceHourLabel}</p>
                            <p className="text-sm text-gray-700">Price/Week: {priceWeekLabel}</p>
                          </div>
                        )}
                      </div>

                      {/* Right: Book This Car Sidebar */}
                      <div className="bg-white/35 rounded-lg border border-gray-300/50 p-6 max-h-[600px] overflow-y-auto" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Book This Car</h2>

                        <div className="space-y-3 mb-6">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Price/Day</p>
                            <p className="text-xl font-semibold text-gray-800">{priceDayLabel}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Location</p>
                            <p className="text-sm font-semibold text-gray-800">{car.location || selectedLuxuryCar.location || 'TBD'}</p>
                          </div>
                          {car.seats && (
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Seats</p>
                              <p className="text-sm font-semibold text-gray-800">{car.seats}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-3 gap-3 pt-2">
                            <div>
                              <p className="text-[10px] text-gray-600 mb-1">Price/Hour</p>
                              <p className="text-sm font-semibold text-gray-800">{priceHourLabel}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-600 mb-1">Price/Week</p>
                              <p className="text-sm font-semibold text-gray-800">{priceWeekLabel}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-600 mb-1">Transmission</p>
                              <p className="text-sm font-semibold text-gray-800">{car.transmission || '—'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-gray-300/50 pt-6 mb-6">
                          <h3 className="text-sm font-semibold text-gray-900 mb-4">Booking Details</h3>
                          <div className="space-y-2 mb-4 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Base Price:</span>
                              <span className="font-bold text-gray-900">{priceDayLabel}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                              <span>Total:</span>
                              <span>{priceDayLabel}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          className={`w-full py-3 rounded-lg font-bold transition-all mb-4 ${luxuryCarSubmitting ? 'bg-gray-600 text-white cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}
                          disabled={luxuryCarSubmitting}
                          onClick={async () => {
                            if (!user) {
                              alert('Please log in to submit a request.');
                              return;
                            }

                            try {
                              setLuxuryCarSubmitting(true);

                              // Calculate price breakdown (use daily rate as base)
                              const basePrice = car.price_per_day || car.price_per_hour || 0;
                              const platformFeePercent = 2.5;
                              const platformFee = Math.round(basePrice * (platformFeePercent / 100));
                              const vatPercent = 8.1; // Swiss VAT
                              const vatAmount = Math.round(basePrice * (vatPercent / 100));
                              const totalPrice = basePrice + platformFee + vatAmount;

                              const payload = {
                                car_id: car.id,
                                brand: car.brand,
                                model: car.model,
                                carName: car.brand && car.model ? `${car.brand} ${car.model}` : (car.brand || car.model || 'Luxury Car'),
                                aircraft: car.brand && car.model ? `${car.brand} ${car.model}` : (car.brand || car.model || 'Luxury Car'), // For unified extraction
                                manufacturer: car.brand,
                                category: car.type || selectedLuxuryCar.category || 'Luxury Car',
                                type: car.type || selectedLuxuryCar.category || 'Luxury Car',
                                location: car.location || selectedLuxuryCar.location,
                                year: car.year,
                                transmission: car.transmission,
                                fuel_type: car.fuel_type,
                                seats: car.seats,
                                currency: 'USD',
                                price_per_day: car.price_per_day ?? null,
                                price_per_hour: car.price_per_hour ?? null,
                                price_per_week: car.price_per_week ?? null,
                                // Full price breakdown
                                base_price: basePrice,
                                platform_fee: platformFee,
                                platform_fee_percent: platformFeePercent,
                                vat_amount: vatAmount,
                                vat_percent: vatPercent,
                                total_price: totalPrice,
                                image_url: car.image_url || selectedLuxuryCar.image,
                                description: car.description,
                                client_info: {
                                  user_id: user.id,
                                  email: user.email,
                                },
                                booking_source: 'glassmorphic_luxury_cars_detail',
                                timestamp: new Date().toISOString(),
                              };

                              // DIRECT INSERT - matching working pattern
                              const { error: dbError } = await supabase
                                .from('user_requests')
                                .insert([{
                                  user_id: user.id,
                                  type: 'luxury_car_rental',
                                  status: 'pending',
                                  data: payload
                                }]);

                              if (dbError) throw dbError;
                              setLuxuryCarSubmitSuccess(true);
                              setTimeout(() => {
                                setLuxuryCarSubmitSuccess(false);
                                setActiveCategory('requests'); // Navigate to My Requests
                              }, 2500);
                            } catch (err) {
                              console.error('Failed to submit luxury car request', err);
                              alert('Failed to submit request. Please try again.');
                            } finally {
                              setLuxuryCarSubmitting(false);
                            }
                          }}
                        >
                          {luxuryCarSubmitting ? 'Submitting...' : luxuryCarSubmitSuccess ? 'Request Sent ✓' : 'Request Quote'}
                        </button>

                        <button
                          onClick={checkNFTMembership}
                          disabled={isCheckingNFT}
                          className="block w-full text-center text-sm text-blue-600 hover:underline"
                        >
                          {isCheckingNFT ? 'Checking...' : 'Check NFT Membership for Perks'}
                        </button>

                        {address && (
                          <p className="text-xs text-gray-500 text-center mt-4">{address.slice(0, 6)}...{address.slice(-4)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* No Results */}
              {!isLoadingLuxuryCars && !showLuxuryCarDetail && luxuryCarsData.length === 0 && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-sm text-gray-600">No luxury cars found matching your criteria.</div>
                </div>
              )}
              <PageFooter />
            </div>
          )}

          {/* AI CHAT VIEW */}
          {!isTransitioning && activeCategory === 'chat' && (
            <AIChatNew
              user={user}
              showChatOverview={showChatOverview}
              setShowChatOverview={setShowChatOverview}
              activeChat={activeChat}
              setActiveChat={setActiveChat}
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
              initialQuery={aiChatQuery}
              onQueryProcessed={() => {
                console.log('📭 onQueryProcessed called, clearing aiChatQuery');
                setAiChatQuery('');
              }}
              initialAssistantMessage={aiAssistantMessage}
              onAssistantMessageProcessed={() => setAiAssistantMessage('')}
              cartItems={cartItems}
              setCartItems={setCartItems}
            />
          )}

          {/* CHAT HISTORY VIEW */}
          {!isTransitioning && activeCategory === 'chat-history' && (
            <div className="p-6 md:p-8">
              {/* View Mode Tabs Only */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-1 bg-gray-100/60 border border-gray-300/50 rounded-lg p-1 backdrop-blur-xl">
                  <button
                    onClick={() => setChatHistoryViewMode('grid')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      chatHistoryViewMode === 'grid'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setChatHistoryViewMode('list')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      chatHistoryViewMode === 'list'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    List
                  </button>
                </div>
                <button
                  onClick={() => setActiveCategory('ai-requests')}
                  className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all flex items-center gap-1.5"
                >
                  <Sparkles size={14} />
                  AI Requests
                </button>
              </div>

              {/* Chat List */}
              {chatHistory.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                  <p className="text-sm text-gray-600 mb-6">Start a new chat to begin talking with Sphera</p>
                  <button
                    onClick={() => {
                      setActiveChat('new');
                      setActiveCategory('chat');
                      window.history.pushState({}, '', '/dashboard/chat');
                    }}
                    className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all inline-flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Start New Chat
                  </button>
                </div>
              ) : selectedChatForView ? (
                /* Conversation Detail View */
                <div className="bg-white/30 backdrop-blur-xl border border-gray-300/50 rounded-2xl overflow-hidden">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedChatForView(null)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                      >
                        <ArrowLeft size={20} className="text-gray-600" />
                      </button>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedChatForView.title}</h3>
                        <p className="text-xs text-gray-500">{selectedChatForView.date} • {selectedChatForView.messages?.length || 0} messages</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveChat(selectedChatForView.id);
                        setActiveCategory('chat');
                        setSelectedChatForView(null);
                        window.history.pushState({}, '', `/dashboard/chat/${selectedChatForView.id}`);
                      }}
                      className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2"
                    >
                      <MessageSquare size={14} />
                      Continue Chat
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
                    {selectedChatForView.messages?.length > 0 ? (
                      selectedChatForView.messages.map((msg, idx) => {
                        // Handle search results messages (role === 'results' or has tabs)
                        if (msg.role === 'results' || msg.tabs) {
                          const tabs = msg.tabs;
                          if (tabs && Array.isArray(tabs)) {
                            const totalItems = tabs.reduce((sum, tab) => sum + (tab.items?.length || 0), 0);
                            return (
                              <div key={idx} className="flex justify-start">
                                <div className="max-w-[90%]">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-gray-500">Sphera AI</span>
                                  </div>
                                  <div className="px-4 py-3 rounded-2xl text-sm bg-blue-50 text-gray-800 border border-blue-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Search size={14} className="text-blue-600" />
                                      <span className="font-medium text-blue-800">Search Results</span>
                                    </div>
                                    <p className="text-gray-700 mb-2">Found {totalItems} options:</p>
                                    <div className="space-y-1">
                                      {tabs.map((tab, tabIdx) => (
                                        <div key={tabIdx} className="text-xs text-gray-600">
                                          • {tab.title}: {tab.items?.length || 0} {tab.items?.length === 1 ? 'result' : 'results'}
                                          {tab.items?.slice(0, 2).map((item, itemIdx) => (
                                            <div key={itemIdx} className="ml-3 text-gray-500">
                                              - {item.from_city || item.departure_city || item.name} → {item.to_city || item.arrival_city || item.destination}
                                              {item.price_usd && ` ($${item.price_usd.toLocaleString()})`}
                                            </div>
                                          ))}
                                          {tab.items?.length > 2 && (
                                            <div className="ml-3 text-gray-400">...and {tab.items.length - 2} more</div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        }

                        // Handle raw JSON content that starts with {"tabs"
                        if (typeof msg.content === 'string' && msg.content.startsWith('{"tabs"')) {
                          try {
                            const parsed = JSON.parse(msg.content);
                            if (parsed.tabs) {
                              const totalItems = parsed.tabs.reduce((sum, tab) => sum + (tab.items?.length || 0), 0);
                              return (
                                <div key={idx} className="flex justify-start">
                                  <div className="max-w-[90%]">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-medium text-gray-500">Sphera AI</span>
                                    </div>
                                    <div className="px-4 py-3 rounded-2xl text-sm bg-blue-50 text-gray-800 border border-blue-200">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Search size={14} className="text-blue-600" />
                                        <span className="font-medium text-blue-800">Search Results</span>
                                      </div>
                                      <p className="text-gray-700 mb-2">Found {totalItems} options:</p>
                                      <div className="space-y-1">
                                        {parsed.tabs.map((tab, tabIdx) => (
                                          <div key={tabIdx} className="text-xs text-gray-600">
                                            • {tab.title}: {tab.items?.length || 0} {tab.items?.length === 1 ? 'result' : 'results'}
                                            {tab.items?.slice(0, 2).map((item, itemIdx) => (
                                              <div key={itemIdx} className="ml-3 text-gray-500">
                                                - {item.from_city || item.departure_city || item.name} → {item.to_city || item.arrival_city || item.destination}
                                                {item.price_usd && ` ($${item.price_usd.toLocaleString()})`}
                                              </div>
                                            ))}
                                            {tab.items?.length > 2 && (
                                              <div className="ml-3 text-gray-400">...and {tab.items.length - 2} more</div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          } catch (e) {
                            // Not valid JSON, will render as text below
                          }
                        }

                        // Regular text messages
                        return (
                          <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-medium ${msg.role === 'user' ? 'text-gray-700' : 'text-gray-500'}`}>
                                  {msg.role === 'user' ? 'You' : 'Sphera AI'}
                                </span>
                              </div>
                              <div
                                className={`px-4 py-3 rounded-2xl text-sm ${
                                  msg.role === 'user'
                                    ? 'bg-black text-white'
                                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                                }`}
                              >
                                <p className="whitespace-pre-line">{msg.content}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center text-gray-500 py-8">No messages in this conversation</p>
                    )}
                  </div>
                </div>
              ) : chatHistoryViewMode === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {chatHistory.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedChatForView(chat)}
                      className="bg-white/30 backdrop-blur-xl border border-gray-300/50 rounded-2xl p-6 cursor-pointer hover:shadow-lg hover:border-gray-400/50 transition-all group"
                    >
                      {/* Chat Info */}
                      <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                        {chat.title}
                      </h3>
                      <p className="text-xs text-gray-600 mb-3">{chat.date}</p>

                      {/* Message Count */}
                      <div className="flex items-center gap-2 text-xs text-gray-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {chat.messages?.length || 0} {(chat.messages?.length || 0) === 1 ? 'message' : 'messages'}
                      </div>

                      {/* Preview last message */}
                      {chat.messages?.length > 0 && (
                        <p className="text-xs text-gray-600 mt-3 line-clamp-2">
                          {chat.messages[chat.messages.length - 1]?.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="space-y-3">
                  {chatHistory.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedChatForView(chat)}
                      className="bg-white/30 backdrop-blur-xl border border-gray-300/50 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:border-gray-400/50 transition-all flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {chat.title}
                          </h3>
                          <span className="text-xs text-gray-500 whitespace-nowrap">{chat.date}</span>
                        </div>
                        {chat.messages?.length > 0 && (
                          <p className="text-xs text-gray-600 truncate">
                            {chat.messages[chat.messages.length - 1]?.content}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          {chat.messages?.length || 0}
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer Actions */}
              {chatHistory.length > 0 && (
                <div className="mt-8 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Total: {chatHistory.length} {chatHistory.length === 1 ? 'conversation' : 'conversations'}
                  </p>
                  <button
                    onClick={() => {
                      setActiveChat('new');
                      setActiveCategory('chat');
                      window.history.pushState({}, '', '/dashboard/chat');
                    }}
                    className="px-6 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-all inline-flex items-center gap-2"
                  >
                    <Plus size={16} />
                    New Chat
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Swap Section */}
          {!isTransitioning && activeCategory === 'swap' && (
            <TokenSwap />
          )}

          {/* Terms & Conditions Page - Full Content */}
          {!isTransitioning && activeCategory === 'terms' && (
            <div className="w-full flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter mb-6">Terms & Conditions</h1>
                <p className="text-xs text-gray-400 mb-8">Last Updated: December 2024 | Version: 2.4</p>

                <div className="space-y-6 text-sm text-gray-600">
                  {/* Section 1 */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">1. Scope and Agreement</h2>
                    <p className="leading-relaxed">By accessing, using, or registering on the PrivateCharterX (PCX) platform, you agree to be legally bound by these Terms and Conditions. These Terms govern all services provided by PCX, a US company registered in Miami, Florida, to you, the User.</p>
                  </div>

                  {/* Section 2 */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">2. Our Services</h2>
                    <p className="leading-relaxed mb-2">PCX provides a comprehensive luxury travel ecosystem. Our services include:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-gray-500">
                      <li>Private Jet, Helicopter, and Air Taxi Charter</li>
                      <li>Yacht Charter (Q1 2026)</li>
                      <li>Luxury Ground Transportation & Limousine Services</li>
                      <li>AI-Powered Concierge Services (Sphera AI)</li>
                      <li>Fixed Travel Packages</li>
                      <li>Digital Assets: Membership NFTs, $PVCX Token ecosystem, and Carbon Offset Certificates</li>
                      <li>Asset Tokenization and SPV Formation Services</li>
                    </ul>
                  </div>

                  {/* Section 3 - AI Services */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">3. AI Services (Sphera AI)</h2>
                    <p className="leading-relaxed mb-2">Our platform utilizes Sphera AI, an artificial intelligence assistant, to enhance your experience:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-gray-500">
                      <li>AI provides recommendations and estimates based on available data, which may not always be accurate</li>
                      <li>All pricing shown by AI are estimates until confirmed by our operations team</li>
                      <li>AI-generated bookings require human verification before becoming binding contracts</li>
                      <li>You retain the right to request human assistance at any point in the booking process</li>
                      <li>PCX is not liable for errors in AI-generated information or recommendations</li>
                    </ul>
                  </div>

                  {/* Section 4 */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">4. Booking and Confirmation</h2>
                    <p className="leading-relaxed">A contract is formed only upon PCX's written booking confirmation. All bookings require full passenger details and a valid payment method. PCX reserves the right to decline any booking at its sole discretion.</p>
                  </div>

                  {/* Section 5 - Cancellation */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">5. Cancellation, Changes & No-Show Policy</h2>

                    <h3 className="text-sm font-medium text-gray-700 mt-3 mb-2">5.1. Changes by PCX</h3>
                    <p className="leading-relaxed mb-2">We may modify schedules due to operational, safety, or weather reasons:</p>
                    <div className="overflow-x-auto mb-3">
                      <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-gray-700 font-medium">Change Type</th>
                            <th className="px-3 py-2 text-left text-gray-700 font-medium">Compensation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          <tr><td className="px-3 py-2 text-gray-600">Change ≤2 hours</td><td className="px-3 py-2 text-gray-600">No compensation</td></tr>
                          <tr><td className="px-3 py-2 text-gray-600">Change 2-6 hours</td><td className="px-3 py-2 text-gray-600">25% service fee refund or alternative</td></tr>
                          <tr><td className="px-3 py-2 text-gray-600">Change &gt;6 hours</td><td className="px-3 py-2 text-gray-600">50% service fee refund or rebooking</td></tr>
                          <tr><td className="px-3 py-2 text-gray-600">Same-day cancellation</td><td className="px-3 py-2 text-gray-600">100% refund or priority rebooking</td></tr>
                        </tbody>
                      </table>
                    </div>

                    <h3 className="text-sm font-medium text-gray-700 mt-4 mb-2">5.2. Private Jet Charter - Cancellation Fees</h3>
                    <div className="overflow-x-auto mb-3">
                      <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-gray-700 font-medium">Notice Period</th>
                            <th className="px-3 py-2 text-left text-gray-700 font-medium">Cancellation Fee</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          <tr><td className="px-3 py-2 text-gray-600">&gt;7 days before departure</td><td className="px-3 py-2 text-gray-600">5% of total booking</td></tr>
                          <tr><td className="px-3 py-2 text-gray-600">72h - 7 days</td><td className="px-3 py-2 text-gray-600">10% of total booking</td></tr>
                          <tr><td className="px-3 py-2 text-gray-600">48h - 72h</td><td className="px-3 py-2 text-gray-600">25% of total booking</td></tr>
                          <tr><td className="px-3 py-2 text-gray-600">24h - 48h</td><td className="px-3 py-2 text-gray-600">50% of total booking</td></tr>
                          <tr><td className="px-3 py-2 text-gray-600">&lt;24h before departure</td><td className="px-3 py-2 text-gray-600">75% of total booking</td></tr>
                          <tr className="bg-red-50"><td className="px-3 py-2 text-red-700 font-medium">No-Show</td><td className="px-3 py-2 text-red-700 font-medium">100% of total booking</td></tr>
                        </tbody>
                      </table>
                    </div>

                    <h3 className="text-sm font-medium text-gray-700 mt-4 mb-2">5.3. Helicopter Charter - Cancellation Fees</h3>
                    <div className="overflow-x-auto mb-3">
                      <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-gray-700 font-medium">Notice Period</th>
                            <th className="px-3 py-2 text-left text-gray-700 font-medium">Cancellation Fee</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          <tr><td className="px-3 py-2 text-gray-600">&gt;48 hours</td><td className="px-3 py-2 text-gray-600">15% of total booking</td></tr>
                          <tr><td className="px-3 py-2 text-gray-600">24h - 48h</td><td className="px-3 py-2 text-gray-600">40% of total booking</td></tr>
                          <tr><td className="px-3 py-2 text-gray-600">&lt;24h before departure</td><td className="px-3 py-2 text-gray-600">80% of total booking</td></tr>
                          <tr className="bg-red-50"><td className="px-3 py-2 text-red-700 font-medium">No-Show</td><td className="px-3 py-2 text-red-700 font-medium">100% of total booking</td></tr>
                        </tbody>
                      </table>
                    </div>

                    <h3 className="text-sm font-medium text-gray-700 mt-4 mb-2">5.4. Ground Transport - Cancellation Fees</h3>
                    <div className="overflow-x-auto mb-3">
                      <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-gray-700 font-medium">Notice Period</th>
                            <th className="px-3 py-2 text-left text-gray-700 font-medium">Cancellation Fee</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          <tr><td className="px-3 py-2 text-gray-600">&gt;24 hours</td><td className="px-3 py-2 text-gray-600">Free cancellation</td></tr>
                          <tr><td className="px-3 py-2 text-gray-600">12h - 24h</td><td className="px-3 py-2 text-gray-600">25% of total booking</td></tr>
                          <tr><td className="px-3 py-2 text-gray-600">&lt;12h before pickup</td><td className="px-3 py-2 text-gray-600">50% of total booking</td></tr>
                          <tr className="bg-red-50"><td className="px-3 py-2 text-red-700 font-medium">No-Show</td><td className="px-3 py-2 text-red-700 font-medium">100% of total booking</td></tr>
                        </tbody>
                      </table>
                    </div>

                    <h3 className="text-sm font-medium text-gray-700 mt-4 mb-2">5.5. Special Conditions</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-gray-500">
                      <li><strong>Empty Leg Flights:</strong> Non-refundable under any circumstances</li>
                      <li><strong>Weather/Force Majeure:</strong> Full refund or free rebooking</li>
                      <li><strong>Medical Emergency:</strong> Rebooking without fee (with documentation)</li>
                    </ul>
                  </div>

                  {/* Section 6 */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">6. Safety and Security</h2>
                    <p className="leading-relaxed">The pilot-in-command has final authority on all safety decisions. All passengers and baggage are subject to security screening. Passengers must comply with all crew instructions. Disruptive behavior may result in flight diversion and legal action.</p>
                  </div>

                  {/* Section 7 */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">7. Luggage</h2>
                    <p className="leading-relaxed">Standard weight allowances apply (e.g., Light Jet: 50kg, Heavy Jet: 200kg). Liability for lost or damaged baggage is limited by the Montreal Convention 1999 (~$1,700 per passenger). Valuable items should be declared and insured separately.</p>
                  </div>

                  {/* Section 8 - GDPR */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">8. Data Protection & GDPR Compliance</h2>
                    <p className="leading-relaxed mb-2">PCX is fully committed to compliance with the General Data Protection Regulation (GDPR/DSGVO) and other applicable data protection laws.</p>

                    <h3 className="text-sm font-medium text-gray-700 mt-3 mb-2">8.1. Your Rights under GDPR</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-gray-500">
                      <li><strong>Right of Access:</strong> Request a copy of your personal data</li>
                      <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                      <li><strong>Right to Erasure:</strong> Request deletion of your data ("Right to be Forgotten")</li>
                      <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                      <li><strong>Right to Data Portability:</strong> Receive your data in a structured format</li>
                      <li><strong>Right to Object:</strong> Object to processing, including automated decision-making</li>
                    </ul>

                    <h3 className="text-sm font-medium text-gray-700 mt-3 mb-2">8.2. Legal Basis for Processing</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-gray-500">
                      <li>Contract performance (booking and service delivery)</li>
                      <li>Legal obligations (aviation regulations, tax laws)</li>
                      <li>Legitimate interests (fraud prevention, service improvement)</li>
                      <li>Consent (marketing communications, AI personalization)</li>
                    </ul>

                    <h3 className="text-sm font-medium text-gray-700 mt-3 mb-2">8.3. Data Retention</h3>
                    <p className="leading-relaxed">Booking records: 7 years (legal requirement). AI chat history: 2 years. Marketing data: Until consent withdrawal.</p>

                    <h3 className="text-sm font-medium text-gray-700 mt-3 mb-2">8.4. Data Protection Officer</h3>
                    <p className="leading-relaxed">Contact: <a href="mailto:dpo@privatecharterx.com" className="text-gray-900 hover:underline">dpo@privatecharterx.com</a></p>
                  </div>

                  {/* Section 9 - Sensitive Documents */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">9. Transmission of Sensitive Documents</h2>
                    <p className="leading-relaxed mb-2">For bookings requiring identity verification, visa assistance, or KYC compliance, you may need to submit sensitive documents (passports, IDs, proof of address).</p>

                    <h3 className="text-sm font-medium text-gray-700 mt-3 mb-2">9.1. Standard Transmission</h3>
                    <p className="leading-relaxed mb-2">Unless you explicitly request otherwise, all documents are transmitted via PCX's standard encrypted channels:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-gray-500">
                      <li>End-to-end encryption (TLS 1.3/AES-256)</li>
                      <li>Secure cloud storage with access controls</li>
                      <li>Automatic deletion after 90 days (unless legally required to retain)</li>
                    </ul>

                    <h3 className="text-sm font-medium text-gray-700 mt-3 mb-2">9.2. Alternative Transmission Methods</h3>
                    <p className="leading-relaxed mb-2">Upon your explicit written request, documents may be transmitted via:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-gray-500">
                      <li>Unencrypted email (at your own risk)</li>
                      <li>Third-party secure file sharing services</li>
                      <li>Physical mail or courier</li>
                    </ul>

                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mt-3">
                      <p className="text-amber-800 text-xs">
                        <strong>Important:</strong> PCX is not liable for data breaches or loss resulting from transmission methods explicitly requested by you that deviate from our standard encrypted procedures.
                      </p>
                    </div>
                  </div>

                  {/* Section 10 */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">10. $PVCX Token Ecosystem</h2>
                    <p className="leading-relaxed">Users earn 1.5 $PVCX tokens per kilometer flown on completed flights. Tokens can be used for payments within the PCX ecosystem and traded on authorized exchanges.</p>
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mt-2">
                      <p className="text-amber-800 text-xs">
                        <strong>Investment Warning:</strong> $PVCX tokens are subject to extreme price volatility and regulatory risks. PCX is not responsible for financial gains or losses.
                      </p>
                    </div>
                  </div>

                  {/* Section 11 - Subscription Plans */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">11. Subscription Plans</h2>
                    <p className="leading-relaxed mb-2">PCX offers tiered subscription plans with varying benefits:</p>

                    <h3 className="text-sm font-medium text-gray-700 mt-3 mb-2">11.1. Available Tiers</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-gray-500">
                      <li><strong>Explorer ($99/month):</strong> 5 AI conversations, 10 messages per chat, email support</li>
                      <li><strong>Traveller ($199/month):</strong> 10 AI conversations, 25 messages per chat, priority support, dedicated manager</li>
                      <li><strong>Elite Club ($999/month):</strong> Unlimited AI conversations, unlimited messages, 24/7 phone support, 2 complimentary airport transfers per month</li>
                    </ul>

                    <h3 className="text-sm font-medium text-gray-700 mt-3 mb-2">11.2. Elite Club - Airport Transfer Benefit</h3>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-gray-600 text-xs leading-relaxed">
                        Elite Club members receive <strong>2 complimentary airport transfers per month</strong>. Important clarifications:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-500 text-xs ml-2 mt-2">
                        <li><strong>1 vehicle = 1 transfer:</strong> Each transfer covers one vehicle, regardless of passenger count</li>
                        <li><strong>2 vehicles = 2 transfers:</strong> If you require 2 vehicles for a single trip, this counts as 2 of your monthly transfers</li>
                        <li>Unused transfers do not roll over to the following month</li>
                        <li>Additional transfers beyond the monthly allowance are charged at standard rates</li>
                      </ul>
                    </div>

                    <h3 className="text-sm font-medium text-gray-700 mt-3 mb-2">11.3. Subscription Terms</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-gray-500">
                      <li>Subscriptions are billed monthly and auto-renew until cancelled</li>
                      <li>Cancel anytime; access continues until the end of the billing period</li>
                      <li>No refunds for partial months</li>
                      <li>Benefits reset at the start of each billing cycle</li>
                    </ul>
                  </div>

                  {/* Section 12 */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">12. Membership NFT Program</h2>
                    <p className="leading-relaxed mb-2">Holders of a PCX Membership NFT are entitled to perpetual benefits:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-gray-500">
                      <li>One Free (renewable) Empty Leg Flight</li>
                      <li>Up to 10% permanent discount on Private Jet bookings</li>
                      <li>Priority access to Empty Leg flights</li>
                      <li>Complimentary limousine transfers</li>
                      <li>24/7 Priority Support</li>
                    </ul>
                  </div>

                  {/* Section 13 */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">13. Payment Terms</h2>
                    <p className="leading-relaxed"><strong>Accepted Methods:</strong> Major credit/debit cards (via Stripe), bank transfers (SEPA, SWIFT), and cryptocurrencies (USDC, USDT, ETH, BTC, $PVCX).</p>
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mt-2">
                      <p className="text-amber-800 text-xs">
                        <strong>Volatility Warning:</strong> PCX is not responsible for gains/losses due to cryptocurrency price fluctuations between payment initiation and confirmation.
                      </p>
                    </div>
                  </div>

                  {/* Section 14 */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">14. Liability</h2>
                    <p className="leading-relaxed">For international flights, liability is governed by the Montreal Convention 1999. PCX's total aggregate liability is limited to the service fees paid for the specific service, with a maximum of $100,000 per incident for non-aviation services. PCX guarantees service performance to Users regardless of Operator performance.</p>
                  </div>

                  {/* Section 15 */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">15. Governing Law and Jurisdiction</h2>
                    <p className="leading-relaxed">These Terms are governed by the laws of the State of Florida, United States. The courts of Miami-Dade County, Florida have exclusive jurisdiction. For EU residents, you may also bring claims in your country of residence under applicable consumer protection laws.</p>
                  </div>

                  {/* Section 16 */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">16. Contact Information</h2>
                    <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-xs">
                      <p className="text-gray-600">General: <a href="mailto:info@privatecharterx.com" className="text-gray-900 hover:underline">info@privatecharterx.com</a></p>
                      <p className="text-gray-600">Support: <a href="mailto:support@privatecharterx.com" className="text-gray-900 hover:underline">support@privatecharterx.com</a></p>
                      <p className="text-gray-600">Data Protection: <a href="mailto:dpo@privatecharterx.com" className="text-gray-900 hover:underline">dpo@privatecharterx.com</a></p>
                      <p className="text-gray-600">Address: 1000 Brickell Ave., Suite 715, Miami, FL 33131, United States</p>
                    </div>
                  </div>

                  {/* Acknowledgment */}
                  <div className="bg-gray-900 text-white p-4 rounded-xl">
                    <h3 className="font-medium mb-2 text-sm">Acknowledgment</h3>
                    <p className="text-gray-300 text-xs">
                      By accessing or using PCX services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                    </p>
                  </div>
                </div>
                <PageFooter />
              </div>
            </div>
          )}

          {/* Privacy Policy Page - Full Content */}
          {!isTransitioning && activeCategory === 'privacy' && (
            <div className="w-full flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter mb-6">Privacy Policy</h1>
                <p className="text-xs text-gray-400 mb-8">Last Updated: December 2024</p>

                <div className="space-y-6 text-sm text-gray-600">
                  <p className="leading-relaxed">
                    PrivateCharterX is committed to protecting your privacy and ensuring the security of your personal information.
                    This Privacy Policy outlines how we collect, use, disclose, and safeguard your data in compliance with applicable laws,
                    including the General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), and other relevant regulations.
                  </p>

                  {/* Section 1 */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">1. Information We Collect</h2>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Personal Information</h3>
                    <p className="leading-relaxed mb-2">We may collect personal information from you, including but not limited to:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-gray-500">
                      <li>Name and identity documents</li>
                      <li>Contact information (email, phone number, address)</li>
                      <li>Payment and billing information</li>
                      <li>Travel preferences and booking history</li>
                      <li>IP address, browser, and device information</li>
                      <li>Wallet addresses for Web3/blockchain transactions</li>
                      <li>Information provided through forms, surveys, or chat interactions</li>
                    </ul>
                  </div>

                  {/* Section 2 - AI Usage */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">2. AI Services & Data Processing</h2>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Sphera AI Assistant</h3>
                    <p className="leading-relaxed mb-2">
                      Our platform includes Sphera AI, an artificial intelligence assistant powered by advanced language models. When using Sphera AI:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-gray-500">
                      <li>Your chat conversations are processed to provide personalized travel assistance</li>
                      <li>Conversations may be stored to improve service quality and maintain booking context</li>
                      <li>AI-generated recommendations are based on your stated preferences and travel requirements</li>
                      <li>We do not use your personal conversations to train external AI models</li>
                      <li>You can request deletion of your chat history at any time</li>
                    </ul>
                    <h3 className="text-sm font-medium text-gray-700 mt-3 mb-2">AI Decision-Making</h3>
                    <p className="leading-relaxed">
                      Sphera AI assists with flight searches, pricing estimates, and booking recommendations. All significant decisions
                      (booking confirmations, payments) require human confirmation. You have the right to request human review of any
                      AI-assisted decision that significantly affects you.
                    </p>
                  </div>

                  {/* Section 3 */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">3. How We Use Your Information</h2>
                    <p className="leading-relaxed mb-2">We use your personal information for the following purposes:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-gray-500">
                      <li>To provide and manage charter booking services</li>
                      <li>To process payments and manage transactions</li>
                      <li>To personalize your experience through AI-powered recommendations</li>
                      <li>To communicate booking confirmations and travel updates</li>
                      <li>To improve our platform, services, and AI capabilities</li>
                      <li>To send promotional materials (with your consent)</li>
                      <li>To comply with legal, regulatory, and aviation requirements</li>
                      <li>To facilitate Web3 services including NFT membership and tokenization</li>
                    </ul>
                  </div>

                  {/* Section 4 */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">4. Data Protection & Security</h2>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">GDPR Compliance</h3>
                    <p className="leading-relaxed mb-2">
                      We adhere to the principles of the GDPR, ensuring that your personal data is processed lawfully, fairly, and transparently.
                      We implement appropriate technical and organizational measures to protect your data from unauthorized access, disclosure,
                      alteration, or destruction.
                    </p>
                    <h3 className="text-sm font-medium text-gray-700 mt-3 mb-2">CCPA Compliance</h3>
                    <p className="leading-relaxed mb-2">
                      For users in California, we comply with the CCPA, providing you with the right to know, delete, and opt-out of the sale
                      of your personal information.
                    </p>
                    <h3 className="text-sm font-medium text-gray-700 mt-3 mb-2">Blockchain & Web3</h3>
                    <p className="leading-relaxed">
                      Transactions recorded on public blockchains (e.g., NFT purchases, token transfers) are immutable and publicly visible
                      by design. We cannot delete or modify on-chain data. Wallet addresses are pseudonymous but may be linked to your
                      identity through our platform records.
                    </p>
                  </div>

                  {/* Section 5 */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">5. Data Retention</h2>
                    <p className="leading-relaxed">
                      We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy,
                      unless a longer retention period is required by law. Booking records may be retained for up to 7 years for regulatory
                      compliance. AI chat history is retained for 2 years unless you request earlier deletion.
                    </p>
                  </div>

                  {/* Section 6 */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">6. Your Rights</h2>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Under GDPR, you have the right to:</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-gray-500">
                      <li>Access your personal data</li>
                      <li>Request rectification or erasure of your personal data</li>
                      <li>Object to the processing of your personal data</li>
                      <li>Request restriction of processing</li>
                      <li>Data portability</li>
                      <li>Object to automated decision-making, including AI profiling</li>
                      <li>Lodge a complaint with a supervisory authority</li>
                    </ul>
                    <h3 className="text-sm font-medium text-gray-700 mt-3 mb-2">Under CCPA, you have the right to:</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-gray-500">
                      <li>Know what personal information we collect about you</li>
                      <li>Request deletion of your personal information</li>
                      <li>Opt-out of the sale of your personal information</li>
                      <li>Non-discrimination for exercising your privacy rights</li>
                    </ul>
                  </div>

                  {/* Section 7 */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">7. Cookies & Tracking</h2>
                    <p className="leading-relaxed mb-2">
                      We use cookies and similar technologies to enhance your browsing experience, analyze site traffic, and personalize content.
                      You can manage your cookie preferences through your browser settings. Essential cookies are required for the platform to function.
                      Analytics and marketing cookies are optional and can be disabled.
                    </p>
                    <h3 className="text-sm font-medium text-gray-700 mt-3 mb-2">Microsoft Clarity</h3>
                    <p className="leading-relaxed">
                      We use Microsoft Clarity to understand how users interact with our website. Clarity captures anonymized session recordings
                      and heatmaps to help us improve user experience. This data includes mouse movements, clicks, and scroll behavior, but does
                      not collect personal information such as passwords or payment details.
                    </p>
                  </div>

                  {/* Section 8 */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">8. Third-Party Services</h2>
                    <p className="leading-relaxed">
                      We may share your data with trusted third parties including charter operators, payment processors, identity verification
                      services, and cloud infrastructure providers. All third parties are contractually bound to protect your data and use it
                      only for specified purposes.
                    </p>
                  </div>

                  {/* Section 9 */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">9. Contact Us</h2>
                    <p className="leading-relaxed mb-2">
                      If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information,
                      please contact us:
                    </p>
                    <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-xs">
                      <p className="text-gray-600">Email: <a href="mailto:privacy@privatecharterx.com" className="text-gray-900 hover:underline">privacy@privatecharterx.com</a></p>
                      <p className="text-gray-600">Data Protection Officer: <a href="mailto:dpo@privatecharterx.com" className="text-gray-900 hover:underline">dpo@privatecharterx.com</a></p>
                      <p className="text-gray-600">Address: 1000 Brickell Ave., Suite 715, Miami, FL 33131, United States</p>
                    </div>
                  </div>

                  {/* Section 10 */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">10. Changes to This Policy</h2>
                    <p className="leading-relaxed">
                      We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational,
                      or regulatory reasons. Any changes will be posted on this page with an updated effective date. We recommend reviewing
                      this policy periodically. Continued use of our services after changes constitutes acceptance of the updated policy.
                    </p>
                  </div>
                </div>
                <PageFooter />
              </div>
            </div>
          )}

          {/* Imprint Page - Full Content */}
          {!isTransitioning && activeCategory === 'imprint' && (
            <div className="w-full flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter mb-6">Imprint</h1>
                <p className="text-xs text-gray-400 mb-8">Legal Notice & Company Information</p>

                {/* Company Information */}
                <div className="space-y-6 mb-8">
                  <h2 className="text-base font-medium text-gray-900">Company Information</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* US Headquarters */}
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">US Headquarters</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        PrivateCharterX LLC<br />
                        1000 Brickell Ave., Suite 715<br />
                        Miami, FL 33131<br />
                        United States of America
                      </p>
                      <p className="text-xs text-gray-400 mt-2">Registration Nr: L24000299516</p>
                    </div>

                    {/* Swiss Branch */}
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Swiss Branch</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Bahnhofstrasse 10<br />
                        8001 Zurich<br />
                        Switzerland
                      </p>
                      <p className="text-xs text-gray-400 mt-2 italic">Operational address for business activities</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 text-sm text-gray-600">
                  {/* Contact */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">Contact</h2>
                    <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm">
                      <p className="text-gray-600">Email: <a href="mailto:info@privatecharterx.com" className="text-gray-900 hover:underline">info@privatecharterx.com</a></p>
                      <p className="text-gray-600">Phone: <a href="tel:+442045920778" className="text-gray-900 hover:underline">+44 20 4592 0778</a></p>
                      <p className="text-gray-600">Website: <a href="https://privatecharterx.com" className="text-gray-900 hover:underline">privatecharterx.com</a></p>
                    </div>
                  </div>

                  {/* Management */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">Management</h2>
                    <p className="leading-relaxed"><strong>Managing Director:</strong> Lorenzo Vanza</p>
                  </div>

                  {/* Registration */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">Registration</h2>
                    <div className="space-y-1">
                      <p><strong>Register Court:</strong> Miami-Dade County, Florida</p>
                      <p><strong>Registration Number:</strong> L24000299516</p>
                      <p><strong>Date of Registration:</strong> September 10, 2023</p>
                    </div>
                  </div>

                  {/* Responsible for Content */}
                  <div>
                    <h2 className="text-base font-medium text-gray-900 mb-2">Responsible for Content</h2>
                    <p className="leading-relaxed">
                      According to § 55 Abs. 2 RStV:<br />
                      PrivateCharterX LLC<br />
                      1000 Brickell Ave., Suite 715<br />
                      Miami, FL 33131, USA
                    </p>
                  </div>

                  {/* Disclaimer */}
                  <div className="pt-4 border-t border-gray-100">
                    <h2 className="text-base font-medium text-gray-900 mb-4">Disclaimer</h2>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Liability for Contents</h3>
                        <p className="leading-relaxed">
                          The contents of our pages were created with great care. However, we cannot guarantee the correctness,
                          completeness, and up-to-dateness of the contents. As a service provider, we are responsible for our own
                          content on these pages under general law. However, we are not obligated to monitor transmitted or stored
                          third-party information or to investigate circumstances that indicate illegal activity.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Liability for Links</h3>
                        <p className="leading-relaxed">
                          Our offer contains links to external websites of third parties, over whose contents we have no influence.
                          Therefore, we cannot assume any liability for these external contents. The respective provider or operator
                          of the pages is always responsible for the contents of the linked pages.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Copyright</h3>
                        <p className="leading-relaxed">
                          The content and works on these pages created by the site operators are subject to copyright law.
                          Duplication, processing, distribution and any form of commercialization of such material beyond the
                          scope of the copyright law require prior written consent of the respective author or creator.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">AI-Generated Content</h3>
                        <p className="leading-relaxed">
                          Our platform utilizes artificial intelligence (Sphera AI) to assist users. AI-generated recommendations,
                          estimates, and content are provided for informational purposes only and should not be considered as
                          professional advice. Users should verify all information independently before making decisions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <PageFooter />
              </div>
            </div>
          )}

          {/* CO2/SAF Marketplace View */}
          {!isTransitioning && activeCategory === 'co2-saf' && !showCO2ProjectDetail && (
            <div className="w-full flex-1 flex flex-col">

              {/* Header with Title */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">CO₂ Offset & SAF Projects</h2>

                <div className="flex items-center gap-3">
                  {/* Filter Toggle Button */}
                  <button
                    onClick={() => setCo2FiltersVisible(!co2FiltersVisible)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all backdrop-blur-xl border ${
                      co2FiltersVisible
                        ? 'bg-gray-800 text-white border-gray-800'
                        : 'bg-gray-100/60 text-gray-700 border-gray-300/50 hover:bg-gray-200/60'
                    }`}
                    style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                  >
                    <SlidersHorizontal size={14} />
                    <span>Filters</span>
                  </button>

                  {/* View Mode Switcher */}
                  <div className="flex items-center gap-1 bg-gray-100/60 border border-gray-300/50 rounded-lg p-1 backdrop-blur-xl" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                    <button
                      onClick={() => setCo2ViewMode('grid')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        co2ViewMode === 'grid'
                          ? 'bg-gray-800 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setCo2ViewMode('tabs')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        co2ViewMode === 'tabs'
                          ? 'bg-gray-800 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Tabs
                    </button>
                  </div>
                </div>
              </div>

              {/* CO2 Filters - Collapsible */}
              {co2FiltersVisible && (
                <div className="bg-gray-100/60 rounded-lg border border-gray-300/50 p-5 mb-6 backdrop-blur-xl transition-all duration-300" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-800 mb-2">Project Type</label>
                      <select
                        className="w-full px-3 py-2.5 bg-white/35 border border-gray-300/50 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                        style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                      >
                        <option value="all">All Types</option>
                        <option value="renewable">Renewable Energy</option>
                        <option value="forestry">Forestry</option>
                        <option value="saf">SAF Production</option>
                        <option value="direct-capture">Direct Air Capture</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-800 mb-2">Location</label>
                      <input
                        type="text"
                        placeholder="e.g. India, Brazil"
                        className="w-full px-3 py-2.5 bg-white/35 border border-gray-300/50 rounded-xl text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                        style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-800 mb-2">Standard</label>
                      <select
                        className="w-full px-3 py-2.5 bg-white/35 border border-gray-300/50 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                        style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                      >
                        <option value="all">All Standards</option>
                        <option value="vcs">VCS</option>
                        <option value="gold">Gold Standard</option>
                        <option value="cdm">CDM</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-800 mb-2">Max Price/Ton ($)</label>
                      <input
                        type="number"
                        placeholder="e.g. 50"
                        className="w-full px-3 py-2.5 bg-white/35 border border-gray-300/50 rounded-xl text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                        style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        className="w-full px-4 py-2.5 bg-gray-100/60 text-gray-700 rounded-lg text-sm hover:bg-gray-200/60 transition-all"
                        style={{ backdropFilter: 'blur(10px) saturate(150%)' }}
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CO2 Projects - Grid View */}
              {co2ViewMode === 'grid' && (
              <div className="grid grid-cols-3 gap-5">
                {co2ProjectsData.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => {
                      setSelectedCO2Project(project);
                      setShowCO2ProjectDetail(true);
                      setCurrentCO2ProjectImageIndex(0);
                      setCO2ActiveTab('details');
                    }}
                    className="bg-white/35 hover:bg-white/40 rounded-xl flex flex-col hover:shadow-lg transition-all cursor-pointer border border-gray-300/50"
                    style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                  >
                    <div className="bg-white/10 relative h-48 rounded-t-xl overflow-hidden">
                      <img
                        src={project.image}
                        alt={project.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 flex flex-col space-y-1.5">
                        <div className="flex space-x-1.5">
                          <div className="bg-white/90 px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            <span>Verified</span>
                          </div>
                          <div className="bg-white/90 px-2 py-1 rounded text-xs font-medium text-gray-800 backdrop-blur-sm">
                            {project.certificationStandard}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">PCX</span>
                        <div className="flex space-x-2">
                        </div>
                      </div>

                      <h3 className="text-base font-semibold text-gray-800 mb-2 line-clamp-2 overflow-hidden">{project.name}</h3>
                      <p className="text-xs text-gray-600 mb-4">{project.location}, {project.country}</p>

                      <div className="flex space-x-6 border-b border-gray-600/30 mb-5">
                        <button className="pb-3 text-xs relative text-gray-800">
                          Properties
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800"></div>
                        </button>
                        <button className="pb-3 text-xs text-gray-600">Description</button>
                      </div>

                      <div className="flex justify-between mt-auto mb-5">
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs text-gray-600">Price/Ton</span>
                          <span className="text-sm font-semibold text-gray-800">${project.pricePerTon.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs text-gray-600">Available</span>
                          <span className="text-sm font-semibold text-gray-800">{project.availableTons.toLocaleString()} tons</span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs text-gray-600">Type</span>
                          <span className="text-sm font-semibold text-gray-800">{project.category}</span>
                        </div>
                      </div>

                      <div className="flex space-x-4 pt-4 border-t border-gray-600/30 text-xs">
                        <a href="#" className="text-gray-600 hover:text-gray-800">Project docs ↗</a>
                        <a href="#" className="text-gray-600 hover:text-gray-800">Verification ⚖</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}

              {/* CO2 Projects - Tabs View */}
              {co2ViewMode === 'tabs' && (
              <div className="space-y-4">
                {co2ProjectsData.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => {
                      setSelectedCO2Project(project);
                      setShowCO2ProjectDetail(true);
                      setCurrentCO2ProjectImageIndex(0);
                      setCO2ActiveTab('details');
                    }}
                    className="bg-white/35 hover:bg-white/40 rounded-xl flex h-48 hover:shadow-lg transition-all cursor-pointer border border-gray-300/50"
                    style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                  >
                    <div className="w-1/3 relative rounded-l-xl overflow-hidden">
                      <img
                        src={project.image}
                        alt={project.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 flex flex-col space-y-1.5">
                        <div className="flex space-x-1.5">
                          <div className="bg-white/90 px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            <span>Verified</span>
                          </div>
                          <div className="bg-white/90 px-2 py-1 rounded text-xs font-medium text-gray-800 backdrop-blur-sm">
                            {project.certificationStandard}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 p-5 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">PCX</span>
                        <span className="text-xs text-gray-600">{project.location}, {project.country}</span>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{project.name}</h3>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs text-gray-600">Price/Ton</span>
                          <span className="text-sm font-semibold text-gray-800">${project.pricePerTon.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs text-gray-600">Available</span>
                          <span className="text-sm font-semibold text-gray-800">{project.availableTons.toLocaleString()} tons</span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs text-gray-600">Type</span>
                          <span className="text-sm font-semibold text-gray-800">{project.category}</span>
                        </div>
                      </div>

                      <div className="flex space-x-4 mt-auto text-xs">
                        <a href="#" className="text-gray-600 hover:text-gray-800">Project docs ↗</a>
                        <a href="#" className="text-gray-600 hover:text-gray-800">Verification ⚖</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {/* CO2 Project Detail View */}
          {!isTransitioning && activeCategory === 'co2-saf' && showCO2ProjectDetail && selectedCO2Project && (
            <div className="w-full flex-1 flex flex-col">
              {/* Back Button */}
              <button
                onClick={() => setShowCO2ProjectDetail(false)}
                className="flex items-center gap-2 text-gray-800 hover:text-black mb-6 text-sm font-medium"
              >
                <span>←</span> Back to Projects
              </button>

              {/* Project Detail Card */}
              <div className="bg-white/35 rounded-xl border border-gray-300/50 mb-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                <div className="flex h-80">
                  {/* Left side - Project Image */}
                  <div className="w-2/5 relative">
                    <img
                      src={selectedCO2Project.image}
                      alt={selectedCO2Project.name}
                      className="w-full h-full object-cover rounded-l-xl"
                    />
                    <div className="absolute top-3 left-3 flex space-x-1.5">
                      <div className="bg-white/90 px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        <span>Verified</span>
                      </div>
                      <div className="bg-white/90 px-2 py-1 rounded text-xs font-medium">{selectedCO2Project.certificationStandard}</div>
                    </div>
                  </div>

                  {/* Right side - Project info */}
                  <div className="flex-1 p-5 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">PCX</span>
                      <div className="flex space-x-2">
                      </div>
                    </div>

                    <h1 className="text-2xl font-semibold mb-4 text-gray-900">{selectedCO2Project.name}</h1>
                    <p className="text-sm text-gray-600 mb-4">{selectedCO2Project.location}, {selectedCO2Project.country}</p>

                    {/* Tab Navigation */}
                    <div className="flex space-x-6 border-b border-gray-300 mb-5">
                      <button
                        onClick={() => setCO2ActiveTab('details')}
                        className={`pb-3 text-xs relative ${co2ActiveTab === 'details' ? 'text-black' : 'text-gray-600'}`}
                      >
                        Project Details
                        {co2ActiveTab === 'details' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                      </button>
                      <button
                        onClick={() => setCO2ActiveTab('impact')}
                        className={`pb-3 text-xs relative ${co2ActiveTab === 'impact' ? 'text-black' : 'text-gray-600'}`}
                      >
                        Impact & Benefits
                        {co2ActiveTab === 'impact' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                      </button>
                      <button
                        onClick={() => setCO2ActiveTab('provider')}
                        className={`pb-3 text-xs relative ${co2ActiveTab === 'provider' ? 'text-black' : 'text-gray-600'}`}
                      >
                        Provider
                        {co2ActiveTab === 'provider' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                      </button>
                    </div>

                    {/* Key metrics */}
                    <div className="flex justify-between mt-auto mb-5">
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs text-gray-500">Price per Ton</span>
                        <span className="text-sm font-semibold text-black">${selectedCO2Project.pricePerTon.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs text-gray-500">Available</span>
                        <span className="text-sm font-semibold text-black">{selectedCO2Project.availableTons.toLocaleString()} tons</span>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs text-gray-500">Standard</span>
                        <span className="text-sm font-semibold text-black">{selectedCO2Project.certificationStandard}</span>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="flex space-x-4 pt-4 border-t border-gray-100 text-xs">
                      <button className="text-gray-600 hover:text-black">Project Documentation ↗</button>
                      <button className="text-gray-600 hover:text-black">Verification Report ⚖</button>
                    </div>

                    {/* Purchase CO2 Certificate Button */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <BuyWithCryptoButton
                        serviceType="co2_certificate"
                        serviceId={selectedCO2Project.id}
                        serviceTitle={selectedCO2Project.name}
                        serviceDescription={`${selectedCO2Project.minPurchase} ton CO2 offset - ${selectedCO2Project.certificationStandard}`}
                        price={selectedCO2Project.pricePerTon * selectedCO2Project.minPurchase}
                        currency="USD"
                        imageUrl={selectedCO2Project.image}
                        user={user}
                        variant="gradient"
                      />
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Min. {selectedCO2Project.minPurchase} ton{selectedCO2Project.minPurchase > 1 ? 's' : ''} • Earn 1.5% in $PVCX rewards
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Section Based on Active Tab */}
              <div className="bg-white/35 rounded-xl border border-gray-300/50 p-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                {co2ActiveTab === 'details' && (
                  <div>
                    <h3 className="text-base font-semibold mb-4">Project Details</h3>
                    <p className="text-xs text-gray-700 leading-relaxed mb-6">{selectedCO2Project.description}</p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="border-b border-gray-100 pb-2">
                        <div className="text-xs text-gray-500 font-medium">Project ID</div>
                        <div className="text-sm font-semibold text-black">{selectedCO2Project.projectId}</div>
                      </div>
                      <div className="border-b border-gray-100 pb-2">
                        <div className="text-xs text-gray-500 font-medium">Location</div>
                        <div className="text-sm font-semibold text-black">{selectedCO2Project.location}, {selectedCO2Project.country}</div>
                      </div>
                      <div className="border-b border-gray-100 pb-2">
                        <div className="text-xs text-gray-500 font-medium">Methodology</div>
                        <div className="text-sm font-semibold text-black">{selectedCO2Project.methodology}</div>
                      </div>
                      <div className="border-b border-gray-100 pb-2">
                        <div className="text-xs text-gray-500 font-medium">Certification</div>
                        <div className="text-sm font-semibold text-black">{selectedCO2Project.certificationStandard}</div>
                      </div>
                      <div className="border-b border-gray-100 pb-2">
                        <div className="text-xs text-gray-500 font-medium">Min Purchase</div>
                        <div className="text-sm font-semibold text-black">{selectedCO2Project.minPurchase} ton{selectedCO2Project.minPurchase > 1 ? 's' : ''}</div>
                      </div>
                      <div className="border-b border-gray-100 pb-2">
                        <div className="text-xs text-gray-500 font-medium">Max Purchase</div>
                        <div className="text-sm font-semibold text-black">{selectedCO2Project.maxPurchase} tons</div>
                      </div>
                    </div>
                  </div>
                )}

                {co2ActiveTab === 'impact' && (
                  <div>
                    <h3 className="text-base font-semibold mb-4">Environmental Impact & Benefits</h3>
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold mb-3">Key Benefits</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedCO2Project.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <span className="text-green-600 mt-0.5">✓</span>
                            <span className="text-xs text-gray-700">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mt-6">
                      <div className="border border-gray-200 rounded-lg p-4 bg-blue-50/30">
                        <h5 className="text-xs font-semibold text-black mb-2">Biodiversity Impact</h5>
                        <p className="text-xs text-gray-700">{selectedCO2Project.additionalInfo.biodiversityImpact}</p>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4 bg-purple-50/30">
                        <h5 className="text-xs font-semibold text-black mb-2">Community Benefit</h5>
                        <p className="text-xs text-gray-700">{selectedCO2Project.additionalInfo.communityBenefit}</p>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4 bg-orange-50/30">
                        <h5 className="text-xs font-semibold text-black mb-2">Technology Used</h5>
                        <p className="text-xs text-gray-700">{selectedCO2Project.additionalInfo.technologyUsed}</p>
                      </div>
                    </div>
                  </div>
                )}

                {co2ActiveTab === 'provider' && (
                  <div>
                    <h3 className="text-base font-semibold mb-4">Provider Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border-b border-gray-100 pb-2">
                        <div className="text-xs text-gray-500 font-medium">NGO Provider</div>
                        <div className="text-sm font-semibold text-black">{selectedCO2Project.ngoName}</div>
                      </div>
                      <div className="border-b border-gray-100 pb-2">
                        <div className="text-xs text-gray-500 font-medium">Certification</div>
                        <div className="text-sm font-semibold text-black">{selectedCO2Project.certificationStandard} Verified</div>
                      </div>
                      <div className="border-b border-gray-100 pb-2">
                        <div className="text-xs text-gray-500 font-medium">Location</div>
                        <div className="text-sm font-semibold text-black">{selectedCO2Project.country}</div>
                      </div>
                      <div className="border-b border-gray-100 pb-2">
                        <div className="text-xs text-gray-500 font-medium">Verified Status</div>
                        <div className="text-sm font-semibold text-green-600">✓ Verified Provider</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


          </div>
        </main>
      </div>
      </div>

      {/* Modals - Use app-specific modals for native apps */}
      {showLoginModal && (
        isNativeApp() ? (
          <AppLoginModal
            onClose={() => setShowLoginModal(false)}
            onSwitchToRegister={() => {
              setShowLoginModal(false);
              setShowRegisterModal(true);
            }}
            onSuccess={() => setShowLoginModal(false)}
            onForgotPassword={() => {
              setShowLoginModal(false);
              setShowForgotPasswordModal(true);
            }}
          />
        ) : (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onSwitchToRegister={() => {
              setShowLoginModal(false);
              setShowRegisterModal(true);
            }}
            onSwitchToPartnerRegister={() => {
              setShowLoginModal(false);
              setShowPartnerRegisterModal(true);
            }}
            onSuccess={() => setShowLoginModal(false)}
            onSwitchToForgotPassword={() => {
              setShowLoginModal(false);
              setShowForgotPasswordModal(true);
            }}
          />
        )
      )}
      {showRegisterModal && (
        isNativeApp() ? (
          <AppRegisterModal
            onClose={() => setShowRegisterModal(false)}
            onSwitchToLogin={() => {
              setShowRegisterModal(false);
              setShowLoginModal(true);
            }}
            onSuccess={() => setShowRegisterModal(false)}
          />
        ) : (
          <RegisterModal
            onClose={() => setShowRegisterModal(false)}
            onSwitchToLogin={() => {
              setShowRegisterModal(false);
              setShowLoginModal(true);
            }}
            onSwitchToPartnerRegister={() => {
              setShowRegisterModal(false);
              setShowPartnerRegisterModal(true);
            }}
            onSuccess={() => setShowRegisterModal(false)}
          />
        )
      )}

      {showForgotPasswordModal && (
        <ForgotPasswordModal
          onClose={() => setShowForgotPasswordModal(false)}
          onBackToLogin={() => {
            setShowForgotPasswordModal(false);
            setShowLoginModal(true);
          }}
        />
      )}

      {showPartnerRegisterModal && (
        <PartnerRegistrationModal
          isOpen={showPartnerRegisterModal}
          onClose={() => setShowPartnerRegisterModal(false)}
          onSuccess={() => {
            setShowPartnerRegisterModal(false);
            // Optionally show success message
            showToast('Partner registration successful! Please wait for verification.', 'success');
          }}
        />
      )}

      {/* Admin Login Modal - for secret CRM admin access */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
              <p className="text-gray-500 mt-2">Enter your admin credentials to continue</p>
            </div>

            {/* Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target;
                const email = form.adminEmail.value;
                const password = form.adminPassword.value;
                const errorEl = document.getElementById('adminLoginError');
                const submitBtn = form.querySelector('button[type="submit"]');

                // Admin credentials (same as /admin panel)
                const ADMIN_EMAIL = atob('YnVpb2x1Y2VHdWxmc3RyZWFtZzcwMDMzODhAZ2dtYWlsLmNvbQ==');
                const ADMIN_PASSWORD = atob('QXVmZGVtYmVzdGVud2VnMyVhdWZkZW1iZXN0ZW53ZWc2NiUu');

                submitBtn.disabled = true;
                submitBtn.innerHTML = '<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Verifying...';

                // Simulate brief loading
                await new Promise(resolve => setTimeout(resolve, 500));

                if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
                  // Store admin auth in session storage
                  sessionStorage.setItem('pvcx_admin_authenticated', 'true');
                  sessionStorage.setItem('pvcx_admin_email', email);
                  setIsSimpleAdminAuth(true);
                  setShowAdminLoginModal(false);
                  setActiveCategory('admin-dashboard');
                  // Clean URL
                  window.history.replaceState({}, document.title, window.location.pathname.replace('/x8833gulfstream66admin', ''));
                } else {
                  errorEl.textContent = 'Invalid admin credentials';
                  errorEl.classList.remove('hidden');
                  submitBtn.disabled = false;
                  submitBtn.innerHTML = 'Access Admin Panel';
                }
              }}
              className="space-y-5"
            >
              {/* Error Message */}
              <div id="adminLoginError" className="hidden p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"></div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Email
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  placeholder="admin@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="adminPassword"
                  placeholder="Enter admin password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Access Admin Panel
              </button>
            </form>

            {/* Close button */}
            <button
              onClick={() => setShowAdminLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            {/* Footer */}
            <p className="text-center text-xs text-gray-400 mt-6">
              PrivateCharterX CRM Admin Panel
            </p>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Report/Support Popup Modal */}
      {showReportPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">Report Issue / Support</h3>
              </div>
              <button
                onClick={() => setShowReportPopup(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={reportSubject}
                  onChange={(e) => setReportSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                  placeholder="Describe your issue or support request in detail..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm resize-none"
                />
              </div>
              {user?.email && (
                <p className="text-xs text-gray-500">
                  We'll respond to: <span className="font-medium">{user.email}</span>
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t border-gray-100">
              <button
                onClick={() => setShowReportPopup(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={isSubmittingReport || !reportSubject.trim() || !reportMessage.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmittingReport ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification for Empty Leg Requests */}
      <SuccessNotification
        show={showEmptyLegSuccess}
        onClose={() => setShowEmptyLegSuccess(false)}
        title="Flight Request Submitted!"
        message="Your empty leg flight request has been saved. We'll contact you soon!"
      />

      {/* NFT Benefits Modal */}
      <NFTBenefitsModal
        isOpen={showNFTModal}
        onClose={closeNFTModal}
        nft={nfts[0] || null}
        hasNFT={hasNFT}
        usedBenefits={usedBenefits}
      />

      {/* Crypto Payment Modal */}
      {cryptoPaymentData && (
        <CryptoPaymentModal
          isOpen={showCryptoPayment}
          onClose={() => {
            setShowCryptoPayment(false);
            setCryptoPaymentData(null);
          }}
          amount={cryptoPaymentData.amount}
          currency={cryptoPaymentData.currency}
          title={cryptoPaymentData.title}
          description={cryptoPaymentData.description}
          orderId={cryptoPaymentData.orderId}
          userEmail={cryptoPaymentData.userEmail}
          userId={cryptoPaymentData.userId}
          serviceType={cryptoPaymentData.serviceType}
          serviceId={cryptoPaymentData.serviceId}
          onSuccess={async (transactionData) => {
            try {
              // Save crypto transaction to database
              const { error: transactionError } = await supabase
                .from('crypto_transactions')
                .insert([{
                  user_id: user.id,
                  coingate_order_id: transactionData.coingate_order_id,
                  order_id: transactionData.order_id,
                  amount: transactionData.amount,
                  currency: transactionData.currency,
                  crypto_currency: transactionData.crypto_currency,
                  status: transactionData.status,
                  payment_url: transactionData.payment_url,
                  created_at: transactionData.created_at,
                }]);

              if (transactionError) {
                console.error('Error saving crypto transaction:', transactionError);
              }

              // Save adventure request as PAID
              const { error: requestError } = await supabase
                .from('user_requests')
                .insert([{
                  user_id: user.id,
                  type: 'adventure_package',
                  status: 'paid',
                  payment_status: 'paid',
                  payment_method: 'crypto',
                  crypto_currency: transactionData.crypto_currency,
                  crypto_transaction_id: transactionData.order_id,
                  data: {
                    ...cryptoPaymentData.adventureData,
                    booking_source: 'glassmorphic_adventures_crypto',
                    timestamp: new Date().toISOString(),
                    payment_info: {
                      coingate_order_id: transactionData.coingate_order_id,
                      payment_url: transactionData.payment_url,
                      crypto_currency: transactionData.crypto_currency,
                    },
                    client_info: {
                      user_id: user.id,
                      email: user.email,
                    },
                  }
                }]);

              if (requestError) {
                console.error('Error saving adventure request:', requestError);
                alert('Payment initiated but failed to save request. Please contact support with order ID: ' + transactionData.order_id);
              } else {
                showToast('Payment initiated! Complete payment in the new window.', 'success');
                setTimeout(() => {
                  setShowCryptoPayment(false);
                  setCryptoPaymentData(null);
                  setActiveCategory('requests'); // Navigate to My Requests
                }, 2000);
              }
            } catch (err) {
              console.error('Error handling crypto payment success:', err);
              alert('Payment initiated but failed to save. Please contact support with order ID: ' + transactionData.order_id);
            }
          }}
        />
      )}

      {/* "Need support?" Banner - Bottom Right - Glassmorphic */}
      {!showSubscriptionPopupDismissed && user && !showLiveSupportChat && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className="rounded-2xl overflow-hidden relative"
            style={{
              width: '260px',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowSubscriptionPopupDismissed(true)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="p-5">
              <p className="text-sm text-gray-700 leading-relaxed mb-4 pr-4">
                Need support?
              </p>

              {/* CTA Button */}
              <button
                onClick={() => setShowLiveSupportChat(true)}
                className="w-full py-2.5 px-4 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  background: 'rgba(0, 0, 0, 0.05)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  color: '#374151'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                }}
              >
                <span>Chat with us</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Contact link */}
              <p className="text-[11px] text-gray-500 text-center mt-3">
                Or email us at{' '}
                <a
                  href="mailto:bookings@privatecharterx.com"
                  className="text-gray-700 hover:text-gray-900 underline"
                >
                  bookings@privatecharterx.com
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Live Support Chat Window */}
      <LiveSupportWidget isOpen={showLiveSupportChat} onClose={() => setShowLiveSupportChat(false)} />
    </div>
  );
};

export default TokenizedAssetsGlassmorphic;

