import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link, useParams, useLocation } from 'react-router-dom';
import {
  Search, Shield, Bell, Heart, Home, Layers, FolderOpen, Plus,
  Plane, Zap, Mountain, Car, MapPin, Sparkles, Rocket,
  Leaf, Award, Settings, User, ChevronRight, ChevronDown, ChevronUp, ChevronLeft, X, LogOut, MessageSquare, MessageCircle,
  Users, Calendar, Package, Compass, ArrowLeft, Wallet, History, Crown, Gift, LayoutDashboard, Clock,
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
        <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">Settings</h2>
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
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
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
      apy: '12.8%',
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
      href="/tokenized"
      className="block border rounded-xl p-3 min-h-[120px] bg-white/40 hover:bg-white/50 border-gray-300/50 transition-all group relative overflow-hidden"
      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
    >
      {/* Token image - absolute positioned, large, cut off at bottom */}
      <img
        src={currentAsset.image}
        alt={currentAsset.name}
        className="absolute right-4 -bottom-[115px] w-[300px] h-[300px] object-contain group-hover:scale-105 transition-all duration-700 ease-in-out pointer-events-none"
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
  const { isAuthenticated, user, profile, signOut, initializing } = useAuth();
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

  const [activeCategory, setActiveCategoryInternal] = useState('overview');
  const [dashboardView, setDashboardView] = useState('overview');

  // Map internal category names to URL paths
  const categoryToUrl = {
    // Aviation & Transport
    'jets': '/dashboard/jets',
    'helicopter': '/dashboard/helicopter',
    'empty-legs': '/dashboard/empty-legs',
    'ground-transport': '/dashboard/ground-transport',
    'adventures': '/dashboard/adventures',
    'luxury-cars': '/dashboard/luxury-cars',
    'hotels': '/dashboard/hotels',

    // Web3 Routes (all under /dashboard/web3/)
    'spv-formation': '/dashboard/web3/spv-formation',
    'my-spvs': '/dashboard/web3/my-tokenized-assets',
    'tokenize-asset': '/dashboard/web3/tokenize-asset',
    'tokenization': '/dashboard/web3/tokenization',
    'my-tokenized-assets': '/dashboard/web3/my-tokenized-assets',
    'launchpad': '/dashboard/web3/launchpad',
    'nft-marketplace': '/dashboard/web3/nft-marketplace',
    'marketplace': '/dashboard/web3/marketplace',
    'pvcx-token': '/dashboard/web3/pvcx-token',

    // CO2/SAF
    'co2-saf': '/dashboard/co2-saf',
    'co2-certificates': '/dashboard/co2-certificates',

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

    // Chat
    'chat': '/dashboard/chat',
    'chat-history': '/dashboard/chat-history',
    'chat-support': '/faqs',

    // Other
    'search-index': '/dashboard/search-index',
    'overview': '/dashboard',
    'profile': '/dashboard/profile',
  };

  // Wrapper for setActiveCategory to prevent invalid values, add logging, and sync URL
  const setActiveCategory = useCallback((category, skipUrlUpdate = false) => {
    const validCategory = category || 'overview'; // Default to 'overview' if empty/null
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
      alert('Please sign in to request a flight');
      navigate('/login');
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

  // Check authentication on mount - ONLY show login if auth is initialized
  useEffect(() => {
    if (!isAuthenticated && !initializing) {
      setShowLoginModal(true);
      setShowDashboard(false);
    }
  }, [isAuthenticated, initializing]);

  // Redirect to homepage if user closes all auth modals without logging in
  // This prevents the app from hanging on a blank loading screen
  // Note: In native app mode, we keep showing the login modal instead of redirecting
  useEffect(() => {
    const noModalsOpen = !showLoginModal && !showRegisterModal && !showForgotPasswordModal && !showPartnerRegisterModal;

    if (!isAuthenticated && !initializing && noModalsOpen) {
      // In native app, re-show the login modal instead of redirecting
      if (isNativeApp()) {
        setShowLoginModal(true);
      } else {
        // On web, redirect to homepage after a delay
        const redirectTimer = setTimeout(() => {
          navigate('/');
        }, 500);
        return () => clearTimeout(redirectTimer);
      }
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
      console.log('⚠️ activeCategory is empty, resetting to overview');
      setActiveCategory('overview');
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
      // Base dashboard - goes to overview
      '/dashboard': 'overview',

      // Aviation & Transport
      '/dashboard/jets': 'jets',
      '/dashboard/helis': 'helicopter',
      '/dashboard/helicopter': 'helicopter',
      '/dashboard/empty-legs': 'empty-legs',
      '/dashboard/ground-transport': 'ground-transport',
      '/dashboard/adventures': 'adventures',
      '/dashboard/luxury-cars': 'luxury-cars',
      '/dashboard/hotels': 'hotels',

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
      '/dashboard/web3/nft-marketplace': 'nft-marketplace',
      '/dashboard/web3/launchpad': 'launchpad',
      '/dashboard/web3/pvcx-token': 'pvcx-token',
      '/dashboard/web3/spv-formation': 'spv-formation',
      '/dashboard/web3/my-tokenized-assets': 'my-tokenized-assets',
      '/dashboard/web3/my-spvs': 'my-spvs',

      // CO2/SAF Routes
      '/dashboard/co2-saf': 'co2-saf',
      '/dashboard/co2-certificates': 'co2-certificates',

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
      setSubscriptionTier(profile?.subscription_tier || 'explorer');
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

      // Apply region filter
      if (adventuresFilter !== 'all') {
        if (adventuresFilter === 'europe') {
          query = query.or('destination_continent.eq.Europe,origin_continent.eq.Europe');
        } else if (adventuresFilter === 'usa') {
          query = query.or('destination_continent.eq.North America,origin_continent.eq.North America');
        } else if (adventuresFilter === 'asia') {
          query = query.or('destination_continent.eq.Asia,origin_continent.eq.Asia');
        } else if (adventuresFilter === 'africa') {
          query = query.or('destination_continent.eq.Africa,origin_continent.eq.Africa');
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
            image: offer.image_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
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
        setActiveCategory('overview');
        navigate('/dashboard/web3');
      } else {
        setActiveCategory('overview');
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
    { id: 'jets', label: 'Jets', icon: Plane, category: 'jets' },
    { id: 'helicopter', label: 'Helis', icon: Zap, category: 'helicopter' },
    { id: 'empty-legs', label: 'Empty Legs', icon: MapPin, category: 'empty-legs' },
    // { id: 'hotels', label: 'Hotels', icon: Building2, category: 'hotels' }, // DISABLED - LiteAPI hotels temporarily removed
    // { id: 'adventures', label: 'Adventures', icon: Mountain, category: 'adventures' }, // Hidden - Adventures only available via AI Chat
    // { id: 'assets', label: 'Events & Sports', icon: Calendar, category: 'assets' }, // Hidden for MVP
    // { id: 'luxury-cars', label: 'Luxury Cars', icon: Car, category: 'luxury-cars' }, // Hidden - now integrated into Ground Transport
    { id: 'ground-transport', label: 'Ground Transport', icon: Car, category: 'ground-transport' }
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
    { id: 'overview', label: 'Dashboard', icon: Home, category: 'overview' },
    { id: 'my-services', label: 'My Services', icon: Package, category: 'my-services' },
    { id: 'bookings', label: 'Booking Requests', icon: FolderOpen, category: 'partner-bookings' },
    { id: 'earnings', label: 'Earnings', icon: Award, category: 'partner-earnings' },
    { id: 'profile', label: 'Profile', icon: User, category: 'dashboard', dashboardTab: 'profile' },
    // { id: 'chat-support', label: 'Chat Support', icon: MessageSquare, category: 'chat-support' }, // Hidden - using footer chat widget instead
    { id: 'settings', label: 'Settings', icon: Settings, category: 'settings' }
  ];

  // User menu - for sidebar navigation (dashboard-related items)
  const userMenuBase = [
    { id: 'overview', label: 'Overview', icon: Home, category: 'overview' },
    { id: 'profile', label: 'Profile', icon: User, category: 'dashboard', dashboardTab: 'profile', rwsOnly: true },
    // { id: 'calendar', label: 'Calendar', icon: Calendar, category: 'calendar' }, // Hidden - not needed for now
    // UNIFIED: Single "My Activity" tab replaces My Bookings + My Requests
    { id: 'activity', label: 'My Activity', icon: Activity, category: 'my-activity', rwsOnly: true },
    // OLD ITEMS (kept for backwards compatibility, redirect to my-activity)
    // { id: 'bookings', label: 'My Bookings', icon: CreditCard, category: 'bookings' },
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
    {
      id: 'spv-formation',
      label: 'SPV Formation',
      icon: Building2,
      category: 'spv-formation',
      submenu: [
        { id: 'my-spvs', label: 'My SPVs', icon: FolderOpen, category: 'my-spvs' },
        { id: 'create-spv', label: 'Create SPV', icon: Plus, category: 'spv-formation' }
      ]
    },
    // { id: 'co2-certificates', label: 'CO2 Certificates', icon: Leaf, category: 'co2-certificates' }, // Hidden for now
    // { id: 'chat-support', label: 'Chat Support', icon: MessageSquare, category: 'chat-support' }, // Hidden - using footer chat widget instead
    { id: 'nft-marketplace', label: 'NFT Marketplace', icon: Shield, category: 'nft-marketplace', web3Only: true }
  ];

  // Filter menu based on user role and webMode
  const userMenu = user?.user_role === 'partner'
    ? partnerMenuBase
    : userMenuBase.filter(item => {
        if (item.rwsOnly && webMode !== 'rws') return false;
        if (item.web3Only && webMode !== 'web3') return false;
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
  if (!isAuthenticated && !isOnAdminRoute && !isSimpleAdminAuth) {
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

  return (
    <div className="h-[100dvh] font-['DM_Sans'] relative overflow-hidden">
      {/* Background - Animated Video for both RWS and Web3 */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/istockphoto-1733442081-640_adpp_is.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9pc3RvY2twaG90by0xNzMzNDQyMDgxLTY0MF9hZHBwX2lzLm1wNCIsImlhdCI6MTc1OTUyMDc5MCwiZXhwIjoxNzkxMDU2NzkwfQ.P5Hr5zLzhYdk5sjvXuPs1clfrt4nLZhKDhbF0gvH5Ss" type="video/mp4" />
      </video>


      {/* Main Container - Centered Floating Glassmorphic Dashboard */}
      <div className="relative z-10 flex h-full items-center justify-center p-0 lg:p-8">
        {/* COMPLETE FLOATING GLASSMORPHIC CONTAINER - Sidebar + Content als ein Stück */}
        <div className={`relative flex w-full max-w-7xl h-full lg:h-[90vh] rounded-none lg:rounded-3xl shadow-2xl border-0 lg:border overflow-hidden lg:transition-all lg:duration-700 lg:ease-out opacity-100 scale-100 ${
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

          {/* Logo */}
          <div className={`mb-6 transition-all duration-300 ${isMobileMenuOpen || sidebarExpanded ? 'px-4' : 'px-2'}`}>
            <div
              onClick={() => {
                if (!sidebarExpanded && !isMobileMenuOpen) {
                  setSidebarExpanded(true);
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
                    'ground-transport': '/dashboard/ground-transport'
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
                    'nft-marketplace': '/dashboard/web3/nft-marketplace',
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
                      'ground-transport': '/dashboard/ground-transport'
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
                        'nft-marketplace': '/dashboard/web3/nft-marketplace',
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
                      setActiveCategory(category || 'overview');
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

              {/* Web Mode Switcher - Compact on mobile */}
              <div className="flex items-center gap-0.5 sm:gap-1 border rounded-xl p-0.5 bg-white/20 backdrop-blur-md border-gray-200/30">
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
              </div>
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

          {/* LEGACY: My Bookings View - Redirect to My Activity */}
          {!isTransitioning && activeCategory === 'bookings' && (
            <div className="w-full h-full overflow-y-auto">
              <MyActivityView user={user} />
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
                    onClick={() => setActiveCategory('overview')}
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

          {/* KYC Verification View */}
          {!isTransitioning && activeCategory === 'kyc-verification' && (
            <div className="w-full h-full overflow-y-auto p-6">
              <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-lg border border-gray-300 overflow-hidden mb-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setActiveCategory('overview')}
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
                    onBack={() => setActiveCategory('overview')}
                    onComplete={() => setActiveCategory('overview')}
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
            </div>
          )}

          {/* Admin Dashboard */}
          {!isTransitioning && activeCategory === 'admin-dashboard' && (
            <div className="w-full flex-1 flex flex-col">
              <AdminDashboardEnhanced user={user} />
            </div>
          )}

          {/* Partner Dashboard - Show for partner users */}
          {!isTransitioning && activeCategory === 'overview' && user?.user_role === 'partner' && (
            <PartnerDashboard user={user} onNavigate={setActiveCategory} />
          )}

          {/* Overview Section (Chat Interface) - Show for regular users */}
          {!isTransitioning && activeCategory === 'overview' && user?.user_role !== 'partner' && (
            <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col px-4 md:px-0">
              {/* Spacer - Both modes need space from header */}
              <div className={webMode === 'rws' ? 'mt-20 mb-2' : 'mt-16 mb-2'}></div>
              <div className="flex-1 flex flex-col">
                {/* RWS Mode Only: Search Input & Quick Action Buttons */}
                {webMode === 'rws' && (
                  <>
                    {/* Greeting */}
                    <div className="mb-6 text-left">
                      <h1 className="text-3xl font-light text-gray-900">
                        Good {(() => {
                          const hour = new Date().getHours();
                          if (hour < 12) return 'morning';
                          if (hour < 18) return 'afternoon';
                          return 'evening';
                        })()}, <span className="text-gray-400">{user?.first_name || user?.name || 'there'}</span>
                      </h1>
                    </div>

                    {/* Intelligent Search with Autocomplete */}
                    <div className="mb-8">
                      <IntelligentSearch
                        webMode={webMode}
                        onSearch={(item, openIndexPage) => {
                          // Handle search selection
                          if (item.action === 'search-index' || openIndexPage) {
                            // Open search index page with query
                            setSearchQuery(item.query || item.label);
                            setActiveCategory('search-index');
                          } else if (item.action.startsWith('search:')) {
                            const query = item.action.replace('search:', '');
                            setSearchQuery(query);
                            // Navigate to appropriate category based on search
                            const category = item.category?.toLowerCase();
                            if (category?.includes('jet')) {
                              setActiveCategory('jets');
                            } else if (category?.includes('empty')) {
                              setActiveCategory('empty-legs');
                            } else if (category?.includes('adventure')) {
                              setActiveCategory('adventures');
                            } else if (category?.includes('car')) {
                              setActiveCategory('luxury-cars');
                            } else if (category?.includes('helicopter')) {
                              setActiveCategory('helicopter');
                            }
                          } else if (item.action === 'chat' || item.action === 'ai-chat') {
                            // Navigate to AI Chat with query
                            // Don't set activeChat here - let AIChat.jsx handle chat creation
                            const queryText = item.query || item.label || '';
                            setAiChatQuery(queryText);
                            setActiveCategory('chat');
                          } else {
                            // Navigate to category
                            setActiveCategory(item.action);
                          }
                        }}
                        onOpenAIChat={(query) => {
                          // Navigate to AI Chat with the query
                          // Don't set activeChat here - let AIChat.jsx handle chat creation
                          // to avoid race condition where activeChat points to non-existent chat
                          setAiChatQuery(query);
                          setActiveCategory('chat');
                        }}
                        placeholder="I need a..."
                      />
                    </div>

                  </>
                )}

              {/* Back button when showing luxury car detail */}
              {showLuxuryCarDetail && (
                <button
                  onClick={() => {
                    setShowLuxuryCarDetail(false);
                    setSelectedLuxuryCar(null);
                    setCurrentLuxuryCarImageIndex(0);
                    setLuxuryCarDetailTab('details');
                  }}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6 transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span className="text-sm font-medium">Back to Luxury Cars</span>
                </button>
              )}

                {/* Recent Cards Section - Different for RWS vs Web3 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <ChevronRight size={12} className={webMode === 'web3' ? 'text-gray-700' : 'text-gray-400'} />
                      <h3 className={`text-xs font-medium ${webMode === 'web3' ? 'text-gray-800' : 'text-gray-600'}`}>
                        {webMode === 'web3' ? 'web3 dashboard' : 'Your recent chats'}
                      </h3>
                    </div>
                    {webMode === 'web3' && (
                      <a
                        href="/dashboard/web3/marketplace"
                        className="text-[10px] text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        View all →
                      </a>
                    )}
                  </div>

                  {/* RWA Investment Banner - Web3 Mode Only - Animated Carousel */}
                  {webMode === 'web3' && (
                    <RWABannerCarousel />
                  )}

                  {/* Row 1: Empty Legs + Aviation (2 cards) - RWS Mode Only */}
                  {webMode === 'rws' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {/* RWS Mode - Show recent chats/empty legs */}
                    {webMode === 'rws' && (
                      <>
                        {/* Empty Legs Card (rotating every 5 minutes) */}
                        <button
                          onClick={() => setActiveCategory('empty-legs')}
                          className="border rounded-xl p-3 text-left transition-all group bg-white/35 hover:bg-white/40 border-gray-300/50"
                          style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                        >
                          <div className="mb-2">
                            <span className="text-[10px] font-bold font-['DM_Sans'] text-gray-500 uppercase tracking-wider">Empty Legs</span>
                          </div>
                          {loadingEmptyLegs ? (
                            <>
                              <h4 className="text-xs font-medium mb-0.5 font-['DM_Sans'] text-gray-800">Loading...</h4>
                              <p className="text-[10px] font-['DM_Sans'] text-gray-600">Fetching offers</p>
                            </>
                          ) : emptyLegs.length > 0 ? (
                            <>
                              <h4 className="text-xs font-medium mb-0.5 font-['DM_Sans'] text-gray-800">
                                {emptyLegs[currentEmptyLegIndex].from_city || emptyLegs[currentEmptyLegIndex].from} → {emptyLegs[currentEmptyLegIndex].to_city || emptyLegs[currentEmptyLegIndex].to}
                              </h4>
                              <p className="text-[10px] font-['DM_Sans'] text-gray-600">
                                ${emptyLegs[currentEmptyLegIndex].price?.toLocaleString() || 'N/A'} • {new Date(emptyLegs[currentEmptyLegIndex].departure_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            </>
                          ) : (
                            <>
                              <h4 className="text-xs font-medium mb-0.5 font-['DM_Sans'] text-gray-800">No Offers</h4>
                              <p className="text-[10px] font-['DM_Sans'] text-gray-600">Check back soon</p>
                            </>
                          )}
                        </button>

                        {/* Charter Aviation Card (Helicopter/Jet) - Opens AI Chat */}
                        <button
                          onClick={() => {
                            // Open AI Chat with prefilled message based on current aviation type
                            const queryText = currentAviationType === 0 ? 'I want to charter a helicopter' : 'I want to charter a private jet';
                            // Set state directly to ensure it's picked up immediately
                            setAiChatQuery(queryText);
                            setActiveChat('new');
                            setActiveCategory('chat');
                            // Update URL cosmetically
                            window.history.pushState({}, '', `/dashboard/chat?query=${encodeURIComponent(queryText)}`);
                          }}
                          className="border rounded-xl p-3 text-left transition-all group bg-white/35 hover:bg-white/40 border-gray-300/50 relative overflow-hidden"
                          style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="mb-2 md:mb-2">
                                <span className="text-[10px] font-bold font-['DM_Sans'] text-gray-500 uppercase tracking-wider">Aviation</span>
                              </div>
                              {/* Mobile: Simple title only */}
                              <div className="md:hidden">
                                <h4 className="text-xs font-medium font-['DM_Sans'] text-gray-800">Private Charter</h4>
                              </div>
                              {/* Desktop: Animated helicopter/jet titles */}
                              <div className="hidden md:block relative h-[32px] overflow-hidden">
                                <h4
                                  className="text-xs font-medium mb-0.5 font-['DM_Sans'] text-gray-800 absolute inset-0 transition-all duration-700 ease-in-out"
                                  style={{
                                    opacity: currentAviationType === 0 ? 1 : 0,
                                    transform: currentAviationType === 0 ? 'translateY(0)' : 'translateY(-100%)'
                                  }}
                                >
                                  Charter a Helicopter
                                </h4>
                                <h4
                                  className="text-xs font-medium mb-0.5 font-['DM_Sans'] text-gray-800 absolute inset-0 transition-all duration-700 ease-in-out"
                                  style={{
                                    opacity: currentAviationType === 1 ? 1 : 0,
                                    transform: currentAviationType === 1 ? 'translateY(0)' : 'translateY(100%)'
                                  }}
                                >
                                  Charter a Jet
                                </h4>
                              </div>
                              <p className="hidden md:block text-[10px] font-['DM_Sans'] text-gray-600">
                                Book your private flight
                              </p>
                            </div>
                            {/* Hide image on mobile */}
                            <div className="hidden md:block flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden relative">
                              {/* Helicopter Image */}
                              <img
                                src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/%20%20(3).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi8gICgzKS5wbmciLCJpYXQiOjE3NjA5NjIwMDcsImV4cCI6MTc5MjQ5ODAwN30.7yFk178KYOXi874bcWv4v8JBczbebcQFgpfDV0MH_MI"
                                alt="Helicopter"
                                className="w-full h-full object-contain absolute inset-0 transition-all duration-700 ease-in-out group-hover:scale-110"
                                style={{
                                  opacity: currentAviationType === 0 ? 1 : 0,
                                  transform: currentAviationType === 0 ? 'scale(1)' : 'scale(0.8)'
                                }}
                              />
                              {/* Jet Image */}
                              <img
                                src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/pngtree-sleek-private-jet-in-flight-ready-for-business-travel-png-image_20073193.png"
                                alt="Private Jet"
                                className="w-full h-full object-contain absolute inset-0 transition-all duration-700 ease-in-out group-hover:scale-110"
                                style={{
                                  opacity: currentAviationType === 1 ? 1 : 0,
                                  transform: currentAviationType === 1 ? 'scale(1)' : 'scale(0.8)'
                                }}
                              />
                            </div>
                          </div>
                        </button>

                        {/* My Requests Card - Hidden on mobile, shown on desktop in row 1 */}
                        <button
                          onClick={() => setActiveCategory('requests')}
                          className="hidden md:block border rounded-xl p-3 text-left transition-all group bg-white/35 hover:bg-white/40 border-gray-300/50"
                          style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[10px] font-bold font-['DM_Sans'] text-gray-500 uppercase tracking-wider">
                              My Requests
                            </span>
                            {!loadingRequests && userRequests.length > 0 && (
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium font-['DM_Sans'] ${
                                userRequests[0].status === 'confirmed'
                                  ? 'bg-green-100 text-green-700'
                                  : userRequests[0].status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {userRequests[0].status}
                              </span>
                            )}
                          </div>
                          {loadingRequests ? (
                            <>
                              <h4 className="text-xs font-medium mb-0.5 font-['DM_Sans'] text-gray-800">Loading...</h4>
                              <p className="text-[10px] font-['DM_Sans'] text-gray-600">Checking requests</p>
                            </>
                          ) : userRequests.length > 0 ? (
                            <>
                              <h4 className="text-xs font-medium mb-0.5 font-['DM_Sans'] text-gray-800 line-clamp-1">
                                {userRequests.length} Active Request{userRequests.length > 1 ? 's' : ''}
                              </h4>
                              <p className="text-[10px] font-['DM_Sans'] text-gray-600">
                                Latest: {new Date(userRequests[0].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            </>
                          ) : (
                            <>
                              <h4 className="text-xs font-medium mb-0.5 font-['DM_Sans'] text-gray-800">No Active Requests</h4>
                              <p className="text-[10px] font-['DM_Sans'] text-gray-600">Start booking services</p>
                            </>
                          )}
                        </button>
                      </>
                    )}

                  </div>
                  )}

                  {/* Row 2: My Bookings + My Requests (mobile) / My Bookings + Blog (desktop) */}
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {/* Card - Bookings Card */}
                    <button
                      onClick={() => {
                        setActiveCategory('bookings');
                      }}
                      className="border rounded-xl p-3 md:p-4 bg-white/35 hover:bg-white/40 border-gray-300/50 transition-all text-left"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      <h4 className={`text-xs font-semibold mb-1 font-['DM_Sans'] ${webMode === 'web3' ? 'text-gray-900' : 'text-gray-800'}`}>
                        My Bookings
                      </h4>
                      <p className={`text-2xl font-semibold font-['DM_Sans'] ${webMode === 'web3' ? 'text-gray-900' : 'text-gray-800'}`}>
                        {loadingBookings ? '...' : userBookings.length}
                      </p>
                      <p className={`text-[10px] font-['DM_Sans'] text-gray-600`}>
                        {userBookings.length === 0 ? 'Book your first flight' : 'Flights, Adventures & CO2'}
                      </p>
                    </button>

                    {/* My Requests Card - Shown on mobile only in row 2 */}
                    <button
                      onClick={() => setActiveCategory('requests')}
                      className="md:hidden border rounded-xl p-3 text-left transition-all group bg-white/35 hover:bg-white/40 border-gray-300/50"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold font-['DM_Sans'] text-gray-500 uppercase tracking-wider">
                          My Requests
                        </span>
                        {!loadingRequests && userRequests.length > 0 && (
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium font-['DM_Sans'] ${
                            userRequests[0].status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : userRequests[0].status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {userRequests[0].status}
                          </span>
                        )}
                      </div>
                      {loadingRequests ? (
                        <>
                          <h4 className="text-xs font-medium mb-0.5 font-['DM_Sans'] text-gray-800">Loading...</h4>
                          <p className="text-[10px] font-['DM_Sans'] text-gray-600">Checking requests</p>
                        </>
                      ) : userRequests.length > 0 ? (
                        <>
                          <h4 className="text-xs font-medium mb-0.5 font-['DM_Sans'] text-gray-800 line-clamp-1">
                            {userRequests.length} Active Request{userRequests.length > 1 ? 's' : ''}
                          </h4>
                          <p className="text-[10px] font-['DM_Sans'] text-gray-600">
                            Latest: {new Date(userRequests[0].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </>
                      ) : (
                        <>
                          <h4 className="text-xs font-medium mb-0.5 font-['DM_Sans'] text-gray-800">No Active Requests</h4>
                          <p className="text-[10px] font-['DM_Sans'] text-gray-600">Start booking services</p>
                        </>
                      )}
                    </button>

                    {/* News Card - Hidden on mobile, shown on desktop */}
                    <a
                      href={latestBlogPost?.link || 'https://www.privatecharterx.blog'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden md:block border rounded-xl p-4 transition-all cursor-pointer bg-white/35 hover:bg-white/40 border-gray-300/50"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <img
                          src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/PrivatecharterX_logo_vectorized.glb.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9Qcml2YXRlY2hhcnRlclhfbG9nb192ZWN0b3JpemVkLmdsYi5wbmciLCJpYXQiOjE3NTk1Mzc3MjcsImV4cCI6MzYwNDUzNTQ0MTI3fQ.jYHe7MUj65rwO8cVL3Ocwgwd3ZJRMr5w1wR9xcaDtVk"
                          alt="PrivateCharterX"
                          className="w-6 h-6 object-contain flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-xs font-semibold mb-1 line-clamp-2 font-['DM_Sans'] ${
                            webMode === 'web3' ? 'text-gray-900' : 'text-gray-800'
                          }`}>
                            {blogLoading ? 'Loading...' : (latestBlogPost?.title || 'Latest from PrivateCharterX Blog')}
                          </h4>
                          <p className={`text-[10px] line-clamp-2 font-['DM_Sans'] ${
                            webMode === 'web3' ? 'text-gray-600' : 'text-gray-600'
                          }`}>
                            {latestBlogPost ? 'Click to read more →' : 'Discover new sustainable aviation fuels and CO2 offset programs...'}
                          </p>
                        </div>
                      </div>
                      <p className={`text-[10px] font-['DM_Sans'] ${webMode === 'web3' ? 'text-gray-500' : 'text-gray-500'}`}>
                        {latestBlogPost ? new Date(latestBlogPost.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '2 hours ago'}
                      </p>
                    </a>
                  </div>

                  {/* Row 3: Blog post (mobile only - full width) */}
                  <div className="mt-4 md:hidden">
                    <a
                      href={latestBlogPost?.link || 'https://www.privatecharterx.blog'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block border rounded-xl p-3 transition-all cursor-pointer bg-white/35 hover:bg-white/40 border-gray-300/50"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <img
                          src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/PrivatecharterX_logo_vectorized.glb.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9Qcml2YXRlY2hhcnRlclhfbG9nb192ZWN0b3JpemVkLmdsYi5wbmciLCJpYXQiOjE3NTk1Mzc3MjcsImV4cCI6MzYwNDUzNTQ0MTI3fQ.jYHe7MUj65rwO8cVL3Ocwgwd3ZJRMr5w1wR9xcaDtVk"
                          alt="PrivateCharterX"
                          className="w-6 h-6 object-contain flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-xs font-semibold mb-1 line-clamp-2 font-['DM_Sans'] ${
                            webMode === 'web3' ? 'text-gray-900' : 'text-gray-800'
                          }`}>
                            {blogLoading ? 'Loading...' : (latestBlogPost?.title || 'Latest from PrivateCharterX Blog')}
                          </h4>
                          <p className={`text-[10px] line-clamp-2 font-['DM_Sans'] ${
                            webMode === 'web3' ? 'text-gray-600' : 'text-gray-600'
                          }`}>
                            {latestBlogPost ? 'Click to read more →' : 'Discover new sustainable aviation fuels and CO2 offset programs...'}
                          </p>
                        </div>
                      </div>
                      <p className={`text-[10px] font-['DM_Sans'] ${webMode === 'web3' ? 'text-gray-500' : 'text-gray-500'}`}>
                        {latestBlogPost ? new Date(latestBlogPost.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '2 hours ago'}
                      </p>
                    </a>
                  </div>

                  {/* Third Row - Additional Cards (Web3 Mode Only) */}
                  {webMode === 'web3' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {/* Card #9 - NFT Marketplace */}
                      <button
                        onClick={() => setActiveCategory('nft-marketplace')}
                        className="border rounded-xl p-3 text-left transition-all group bg-white/35 hover:bg-white/40 border-gray-300/50"
                        style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                      >
                        <h4 className="text-xs font-medium mb-0.5 font-['DM_Sans'] text-gray-900 truncate">
                          NFT Marketplace
                        </h4>
                        <p className="text-[10px] font-['DM_Sans'] text-gray-600 mb-1">
                          Buy & Sell NFTs
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium text-gray-900">
                            Browse
                          </span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                            Explore
                          </span>
                        </div>
                      </button>

                      {/* Card #10 - PVCX Tokens */}
                      <button
                        onClick={() => setActiveCategory('pvcx-token')}
                        className="border rounded-xl p-3 text-left transition-all group bg-white/35 hover:bg-white/40 border-gray-300/50"
                        style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                      >
                        <h4 className="text-xs font-medium mb-0.5 font-['DM_Sans'] text-gray-900 truncate">
                          PVCX Tokens
                        </h4>
                        <p className="text-[10px] font-['DM_Sans'] text-gray-600 mb-1">
                          Your Balance
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium text-gray-900">
                            {loadingPvcxBalance ? '...' : `${pvcxBalance.toFixed(3)} $PVCX`}
                          </span>
                        </div>
                      </button>

                      {/* Card #11 - Wallet Signatures (NFT Verifications) */}
                      <button
                        onClick={() => {/* Could navigate to signatures view if desired */}}
                        className="hidden md:block border rounded-xl p-3 text-left transition-all group bg-white/35 hover:bg-white/40 border-gray-300/50"
                        style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                      >
                        <h4 className="text-xs font-medium mb-0.5 font-['DM_Sans'] text-gray-900 truncate">
                          Wallet Signatures
                        </h4>
                        <p className="text-[10px] font-['DM_Sans'] text-gray-600 mb-1">NFT verifications</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium text-gray-900">
                            {loadingSignatures ? '...' : `${walletSignatures.length} signed`}
                          </span>
                          {walletSignatures.length > 0 && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                              Verified
                            </span>
                          )}
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tokenize Asset Flow */}
          {!isTransitioning && activeCategory === 'tokenization' && (
            <TokenizeAssetFlow onBack={(destination) => setActiveCategory(destination || 'overview')} user={user} />
          )}

          {/* My Tokenized Assets View */}
          {!isTransitioning && activeCategory === 'my-tokenized-assets' && (
            <div className="w-full h-full overflow-y-auto p-8">
              <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                  <h1 className="text-3xl font-light text-gray-900 mb-2">My Tokenized Assets</h1>
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
              <SPVFormationFlow onBack={() => setActiveCategory('overview')} />
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
                    onClick={() => setActiveCategory('overview')}
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
                          onClick={() => setActiveCategory('overview')}
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
                <div className="w-24 h-24 mx-auto mb-6">
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
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Launchpad</h2>
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
                <div className="w-24 h-24 mx-auto mb-6">
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
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Marketplace</h2>
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
            </div>
          )}

          {/* Jets View */}
          {!isTransitioning && activeCategory === 'jets' && (
            <div className="w-full flex-1 flex flex-col">

              {!showJetDetail && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 gap-3 pt-4 md:pt-6">
                <h2 className="text-xl md:text-3xl lg:text-4xl font-light text-gray-900 tracking-tighter">Private Jets</h2>

                <div className="flex items-center gap-2 md:gap-3">
                  {/* Filter Toggle Button */}
                  <button
                    onClick={() => setJetsFiltersVisible(!jetsFiltersVisible)}
                    className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-medium transition-all backdrop-blur-xl border ${
                      jetsFiltersVisible
                        ? 'bg-gray-800 text-white border-gray-800'
                        : 'bg-gray-100/60 text-gray-700 border-gray-300/50 hover:bg-gray-200/60'
                    }`}
                    style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                  >
                    <SlidersHorizontal size={12} />
                    <span>Filters</span>
                  </button>

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

              {/* Filters - Glassmorphic - Mobile Optimized */}
              {!showJetDetail && jetsFiltersVisible && (
                <div className="bg-gray-100/60 rounded-lg border border-gray-300/50 p-3 md:p-5 mb-4 md:mb-6 backdrop-blur-xl transition-all duration-300" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
                  <div>
                    <label className="block text-[10px] md:text-xs font-medium text-gray-800 mb-1 md:mb-2">Category</label>
                    <select
                      value={jetsFilter}
                      onChange={(e) => setJetsFilter(e.target.value)}
                      className="w-full px-2 md:px-3 py-2 md:py-2.5 bg-white/35 border border-gray-300/50 rounded-lg md:rounded-xl text-xs md:text-sm text-gray-700 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      <option value="all">All Categories</option>
                      <option value="Light Jet">Light Jet</option>
                      <option value="Midsize Jet">Midsize Jet</option>
                      <option value="Heavy Jet">Heavy Jet</option>
                      <option value="Ultra Long Range">Ultra Long Range</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] md:text-xs font-medium text-gray-800 mb-1 md:mb-2">Manufacturer</label>
                    <input
                      type="text"
                      placeholder="e.g. Gulfstream"
                      value={jetsSearch}
                      onChange={(e) => setJetsSearch(e.target.value)}
                      className="w-full px-2 md:px-3 py-2 md:py-2.5 bg-white/35 border border-gray-300/50 rounded-lg md:rounded-xl text-xs md:text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] md:text-xs font-medium text-gray-800 mb-1 md:mb-2">Model</label>
                    <input
                      type="text"
                      placeholder="e.g. G650"
                      value={jetsSearch}
                      onChange={(e) => setJetsSearch(e.target.value)}
                      className="w-full px-2 md:px-3 py-2 md:py-2.5 bg-white/35 border border-gray-300/50 rounded-lg md:rounded-xl text-xs md:text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] md:text-xs font-medium text-gray-800 mb-1 md:mb-2">Max Price</label>
                    <input
                      type="text"
                      placeholder="$50,000"
                      value={jetsMaxPrice}
                      onChange={(e) => setJetsMaxPrice(e.target.value)}
                      className="w-full px-2 md:px-3 py-2 md:py-2.5 bg-white/35 border border-gray-300/50 rounded-lg md:rounded-xl text-xs md:text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1 flex items-end">
                    <button
                      onClick={() => {
                        setJetsSearch('');
                        setJetsMaxPrice('');
                        setJetsFilter('all');
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
              {!showJetDetail && isLoadingJets && (
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

              {/* Jets List View */}
              {!showJetDetail && !isLoadingJets && (
                <div className="w-full space-y-2">
                  {jetsData
                    .slice((currentJetsPage - 1) * jetsPerPage, currentJetsPage * jetsPerPage)
                    .map((jet) => (
                    <div
                      key={jet.id}
                      className="bg-white/35 hover:bg-white/40 rounded-lg border border-gray-300/50 overflow-hidden transition-all cursor-pointer"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                      onClick={() => handleJetClick(jet)}
                    >
                      {/* Mobile Layout */}
                      <div className="md:hidden p-3">
                        <div className="flex gap-3">
                          <div className="w-20 h-20 bg-gray-100/50 rounded-lg flex-shrink-0 overflow-hidden">
                            {jet.image ? (
                              <img src={jet.image} alt={jet.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Plane size={24} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-800 line-clamp-1">{jet.name}</h3>
                            <p className="text-[10px] text-gray-500 mb-2 line-clamp-1">{jet.category}</p>
                            <div className="flex gap-3 text-[10px]">
                              <div>
                                <span className="text-gray-500">Capacity: </span>
                                <span className="font-medium text-gray-800">{jet.capacity}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Range: </span>
                                <span className="font-medium text-gray-800">{jet.range}</span>
                              </div>
                            </div>
                            <div className="text-xs font-semibold text-gray-800 mt-1">{jet.totalPrice}</div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden md:flex items-center p-4 gap-4">
                        <div className="w-16 h-16 bg-gray-100/50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {jet.image ? (
                            <img src={jet.image} alt={jet.name} className="w-full h-full object-cover" />
                          ) : (
                            <Plane size={24} className="text-gray-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-800">{jet.name}</h3>
                          <p className="text-xs text-gray-600">{jet.category}</p>
                        </div>

                        <div className="text-center px-4">
                          <div className="text-sm font-light text-gray-800">{jet.capacity}</div>
                          <div className="text-[10px] text-gray-600">Capacity</div>
                        </div>

                        <div className="text-center px-4">
                          <div className="text-sm font-light text-gray-800">{jet.totalPrice}</div>
                          <div className="text-[10px] text-gray-600">Price Range</div>
                        </div>

                        <div className="text-center px-4">
                          <div className="text-sm font-light text-gray-800">{jet.range}</div>
                          <div className="text-[10px] text-gray-600">Range</div>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJetClick(jet);
                            }}
                            className="px-4 py-2 bg-gray-800 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-all"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {jetsData.length > jetsPerPage && (
                    <div className="flex justify-center items-center mt-8 gap-2">
                      <button
                        onClick={() => setCurrentJetsPage(prev => Math.max(1, prev - 1))}
                        disabled={currentJetsPage === 1}
                        className="px-4 py-2 bg-white/35 hover:bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                      >
                        Previous
                      </button>

                      {(() => {
                        const totalPages = Math.ceil(jetsData.length / jetsPerPage);
                        const pages = [];

                        if (totalPages <= 5) {
                          for (let i = 1; i <= totalPages; i++) pages.push(i);
                        } else {
                          pages.push(1);
                          if (currentJetsPage > 3) pages.push('...');

                          for (let i = Math.max(2, currentJetsPage - 1); i <= Math.min(totalPages - 1, currentJetsPage + 1); i++) {
                            if (!pages.includes(i)) pages.push(i);
                          }

                          if (currentJetsPage < totalPages - 2) pages.push('...');
                          if (!pages.includes(totalPages)) pages.push(totalPages);
                        }

                        return pages.map((page, idx) =>
                          page === '...' ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => setCurrentJetsPage(page)}
                              className={`w-10 h-10 rounded-lg text-sm transition-all ${
                                currentJetsPage === page
                                  ? 'bg-gray-800 text-white'
                                  : 'bg-white/35 hover:bg-white/40 border border-gray-300/50 text-gray-700'
                              }`}
                              style={currentJetsPage !== page ? { backdropFilter: 'blur(20px) saturate(180%)' } : {}}
                            >
                              {page}
                            </button>
                          )
                        );
                      })()}

                      <button
                        onClick={() => setCurrentJetsPage(prev => Math.min(Math.ceil(jetsData.length / jetsPerPage), prev + 1))}
                        disabled={currentJetsPage === Math.ceil(jetsData.length / jetsPerPage)}
                        className="px-4 py-2 bg-white/35 hover:bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
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
            </div>
          )}

          {/* Helicopter View */}
          {!isTransitioning && activeCategory === 'helicopter' && (
            <div className="w-full flex-1 flex flex-col">

              {!showHelicopterDetail && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 gap-3 pt-4 md:pt-6">
                <h2 className="text-xl md:text-3xl lg:text-4xl font-light text-gray-900 tracking-tighter">Helicopter Charters</h2>

                <div className="flex items-center gap-2 md:gap-3">
                  {/* Filter Toggle Button */}
                  <button
                    onClick={() => setHelicoptersFiltersVisible(!helicoptersFiltersVisible)}
                    className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-medium transition-all backdrop-blur-xl border ${
                      helicoptersFiltersVisible
                        ? 'bg-gray-800 text-white border-gray-800'
                        : 'bg-gray-100/60 text-gray-700 border-gray-300/50 hover:bg-gray-200/60'
                    }`}
                    style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                  >
                    <SlidersHorizontal size={12} />
                    <span>Filters</span>
                  </button>

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

              {/* Filters - Glassmorphic - Mobile Optimized */}
              {!showHelicopterDetail && helicoptersFiltersVisible && (
                <div className="bg-gray-100/60 rounded-lg border border-gray-300/50 p-3 md:p-5 mb-4 md:mb-6 backdrop-blur-xl transition-all duration-300" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
                  <div>
                    <label className="block text-[10px] md:text-xs font-medium text-gray-800 mb-1 md:mb-2">Category</label>
                    <select
                      value={helicoptersFilter}
                      onChange={(e) => setHelicoptersFilter(e.target.value)}
                      className="w-full px-2 md:px-3 py-2 md:py-2.5 bg-white/35 border border-gray-300/50 rounded-lg md:rounded-xl text-xs md:text-sm text-gray-700 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      <option value="all">All Categories</option>
                      <option value="Twin Engine">Twin Engine</option>
                      <option value="Luxury">Luxury</option>
                      <option value="Light">Light</option>
                      <option value="Medium">Medium</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] md:text-xs font-medium text-gray-800 mb-1 md:mb-2">Model</label>
                    <input
                      type="text"
                      placeholder="e.g. H135"
                      value={helicoptersSearch}
                      onChange={(e) => setHelicoptersSearch(e.target.value)}
                      className="w-full px-2 md:px-3 py-2 md:py-2.5 bg-white/35 border border-gray-300/50 rounded-lg md:rounded-xl text-xs md:text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] md:text-xs font-medium text-gray-800 mb-1 md:mb-2">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Monaco"
                      value={helicoptersLocation}
                      onChange={(e) => setHelicoptersLocation(e.target.value)}
                      className="w-full px-2 md:px-3 py-2 md:py-2.5 bg-white/35 border border-gray-300/50 rounded-lg md:rounded-xl text-xs md:text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] md:text-xs font-medium text-gray-800 mb-1 md:mb-2">Max Price ($)</label>
                    <input
                      type="number"
                      placeholder="$8000"
                      value={helicoptersMaxPrice}
                      onChange={(e) => setHelicoptersMaxPrice(e.target.value)}
                      className="w-full px-2 md:px-3 py-2 md:py-2.5 bg-white/35 border border-gray-300/50 rounded-lg md:rounded-xl text-xs md:text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1 flex items-end">
                    <button
                      onClick={() => {
                        setHelicoptersSearch('');
                        setHelicoptersLocation('');
                        setHelicoptersMaxPrice('');
                        setHelicoptersFilter('all');
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
              {isLoadingHelicopters && !showHelicopterDetail && (
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

              {/* Helicopters List View */}
              {!isLoadingHelicopters && !showHelicopterDetail && (
                <div className="w-full space-y-2">
                  {helicoptersData
                    .slice((currentHelicoptersPage - 1) * helicoptersPerPage, currentHelicoptersPage * helicoptersPerPage)
                    .map((heli) => (
                    <div
                      key={heli.id}
                      onClick={() => {
                        setSelectedHelicopter(heli);
                        setShowHelicopterDetail(true);
                        setCurrentHelicopterImageIndex(0);
                      }}
                      className="bg-white/35 hover:bg-white/40 rounded-lg border border-gray-300/50 overflow-hidden transition-all cursor-pointer"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      {/* Mobile Layout */}
                      <div className="md:hidden p-3">
                        <div className="flex gap-3">
                          <div className="w-20 h-20 bg-gray-100/50 rounded-lg flex-shrink-0 overflow-hidden">
                            {heli.image ? (
                              <img src={heli.image} alt={heli.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Zap size={24} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-800 line-clamp-1">{heli.name}</h3>
                            <p className="text-[10px] text-gray-500 mb-2 line-clamp-1">{heli.category?.substring(0, 30)}</p>
                            <div className="flex gap-3 text-[10px]">
                              <div>
                                <span className="text-gray-500">Capacity: </span>
                                <span className="font-medium text-gray-800">{heli.capacity}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Range: </span>
                                <span className="font-medium text-gray-800">{heli.range}</span>
                              </div>
                            </div>
                            <div className="text-xs font-semibold text-gray-800 mt-1">{heli.totalPrice}/hr</div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden md:flex items-center p-4 gap-4">
                        <div className="w-16 h-16 bg-gray-100/50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {heli.image ? (
                            <img src={heli.image} alt={heli.name} className="w-full h-full object-cover" />
                          ) : (
                            <Zap size={24} className="text-gray-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-800">{heli.name}</h3>
                          <p className="text-xs text-gray-600">{heli.category?.substring(0, 50)}</p>
                        </div>

                        <div className="text-center px-4">
                          <div className="text-sm font-light text-gray-800">{heli.totalPrice}</div>
                          <div className="text-[10px] text-gray-600">Price/Hour</div>
                        </div>

                        <div className="text-center px-4">
                          <div className="text-sm font-light text-gray-800">{heli.capacity}</div>
                          <div className="text-[10px] text-gray-600">Capacity</div>
                        </div>

                        <div className="text-center px-4">
                          <div className="text-sm font-light text-gray-800">{heli.range}</div>
                          <div className="text-[10px] text-gray-600">Range</div>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          <button className="px-4 py-2 bg-gray-800 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-all">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {helicoptersData.length > helicoptersPerPage && (
                    <div className="flex justify-center items-center mt-8 gap-2">
                      <button
                        onClick={() => setCurrentHelicoptersPage(prev => Math.max(1, prev - 1))}
                        disabled={currentHelicoptersPage === 1}
                        className="px-4 py-2 bg-white/35 hover:bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                      >
                        Previous
                      </button>

                      {(() => {
                        const totalPages = Math.ceil(helicoptersData.length / helicoptersPerPage);
                        const pages = [];

                        if (totalPages <= 5) {
                          for (let i = 1; i <= totalPages; i++) pages.push(i);
                        } else {
                          pages.push(1);
                          if (currentHelicoptersPage > 3) pages.push('...');

                          for (let i = Math.max(2, currentHelicoptersPage - 1); i <= Math.min(totalPages - 1, currentHelicoptersPage + 1); i++) {
                            if (!pages.includes(i)) pages.push(i);
                          }

                          if (currentHelicoptersPage < totalPages - 2) pages.push('...');
                          if (!pages.includes(totalPages)) pages.push(totalPages);
                        }

                        return pages.map((page, idx) =>
                          page === '...' ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => setCurrentHelicoptersPage(page)}
                              className={`w-10 h-10 rounded-lg text-sm transition-all ${
                                currentHelicoptersPage === page
                                  ? 'bg-gray-800 text-white'
                                  : 'bg-white/35 hover:bg-white/40 border border-gray-300/50 text-gray-700'
                              }`}
                              style={currentHelicoptersPage !== page ? { backdropFilter: 'blur(20px) saturate(180%)' } : {}}
                            >
                              {page}
                            </button>
                          )
                        );
                      })()}

                      <button
                        onClick={() => setCurrentHelicoptersPage(prev => Math.min(Math.ceil(helicoptersData.length / helicoptersPerPage), prev + 1))}
                        disabled={currentHelicoptersPage === Math.ceil(helicoptersData.length / helicoptersPerPage)}
                        className="px-4 py-2 bg-white/35 hover:bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
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

                  {/* View Mode Switcher - Compact on mobile */}
                  <div className="flex items-center gap-0.5 md:gap-1 bg-gray-100/60 border border-gray-300/50 rounded-lg p-0.5 md:p-1 backdrop-blur-xl" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                    <button
                      onClick={() => setEmptyLegsViewMode('grid')}
                      className={`px-2 md:px-3 py-1 md:py-1.5 rounded text-[10px] md:text-xs font-medium transition-all ${
                        emptyLegsViewMode === 'grid'
                          ? 'bg-gray-800 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setEmptyLegsViewMode('tabs')}
                      className={`px-2 md:px-3 py-1 md:py-1.5 rounded text-[10px] md:text-xs font-medium transition-all ${
                        emptyLegsViewMode === 'tabs'
                          ? 'bg-gray-800 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      List
                    </button>
                  </div>
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

              {/* Grid View - Respects viewMode on all devices */}
              {!isLoadingEmptyLegs && !showEmptyLegDetail && emptyLegsViewMode === 'grid' && (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
                  {emptyLegsData
                    .slice((currentEmptyLegsPage - 1) * emptyLegsPerPage, currentEmptyLegsPage * emptyLegsPerPage)
                    .map((leg) => (
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
                      className={`bg-white/35 hover:bg-white/40 rounded-xl overflow-hidden hover:shadow-lg cursor-pointer ${
                        leg.rawData?.price && leg.rawData.price <= 1500
                          ? 'pulse-green-glow'
                          : 'border border-gray-300/50'
                      }`}
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      {/* Mobile: Vertical stacked layout */}
                      <div className="md:hidden">
                        {/* Image on top */}
                        <div className="relative h-36 bg-white/10">
                          {leg.image && (
                            <img
                              src={leg.image}
                              alt={leg.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                            <div className="bg-white/90 px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 backdrop-blur-sm">
                              <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                              <span className="text-gray-800">{leg.location}</span>
                            </div>
                            {leg.rawData?.price && leg.rawData.price <= 1500 && (
                              <div className="bg-green-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold backdrop-blur-sm animate-pulse">
                                FREE with NFT
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Content below */}
                        <div className="p-3">
                          <h3 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-1">{leg.name}</h3>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="text-center bg-gray-100/50 rounded-lg py-1.5">
                              <span className="text-[10px] text-gray-500 block">Price</span>
                              <span className="text-xs font-semibold text-gray-800">{leg.totalPrice}</span>
                            </div>
                            <div className="text-center bg-gray-100/50 rounded-lg py-1.5">
                              <span className="text-[10px] text-gray-500 block">Capacity</span>
                              <span className="text-xs font-semibold text-gray-800">{leg.capacity}</span>
                            </div>
                            <div className="text-center bg-gray-100/50 rounded-lg py-1.5">
                              <span className="text-[10px] text-gray-500 block">Date</span>
                              <span className="text-xs font-semibold text-gray-800">{leg.departureDate}</span>
                            </div>
                          </div>
                          <button className="w-full py-2 bg-gray-800 text-white rounded-lg text-xs font-medium">
                            View Details
                          </button>
                        </div>
                      </div>

                      {/* Desktop: Horizontal layout */}
                      <div className="hidden md:flex h-64">
                        <div className="w-2/5 bg-white/10 relative flex-shrink-0 rounded-l-xl overflow-hidden">
                          {leg.image && (
                            <img
                              src={leg.image}
                              alt={leg.name}
                              className="w-full h-64 object-cover"
                            />
                          )}
                          <div className="absolute top-3 left-3 flex flex-col space-y-1.5">
                            <div className="flex space-x-1.5">
                              <div className="bg-white/90 px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 backdrop-blur-sm">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                <span className="text-gray-800">{leg.location}</span>
                              </div>
                              {leg.rawData?.price && leg.rawData.price <= 1500 && (
                                <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold backdrop-blur-sm animate-pulse">
                                  {leg.rawData.price <= 1500 ? 'FREE with NFT' : 'HOT DEAL'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 p-5 flex flex-col">
                          <div className="flex items-center justify-between mb-3">
                            {leg.rawData?.is_partner_offer ? (
                              <div className="flex items-center gap-2">
                                <img
                                  src={leg.rawData.partner_logo_url || 'https://via.placeholder.com/80x24/000/fff?text=Partner'}
                                  alt={leg.rawData.partner_name || 'Partner'}
                                  className="h-6 w-auto object-contain rounded"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/80x24/000/fff?text=Partner';
                                  }}
                                />
                              </div>
                            ) : (
                              <img
                                src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_logo_vectorized.glb.png"
                                alt="PrivateCharterX"
                                className="h-6 w-auto object-contain"
                              />
                            )}
                          </div>
                          <h3 className="text-base font-semibold text-gray-800 mb-4 line-clamp-2 overflow-hidden">{leg.name}</h3>
                          <div className="flex space-x-6 border-b border-gray-600/30 mb-5">
                            <button className="pb-3 text-xs relative text-gray-800">
                              Details
                              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800"></div>
                            </button>
                          </div>

                          <div className="flex justify-between mt-auto mb-3">
                            <div className="flex flex-col space-y-1">
                              <span className="text-xs text-gray-600">Price</span>
                              <span className="text-sm font-semibold text-gray-800">{leg.totalPrice}</span>
                              {leg.rawData?.distance_km && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Coins size={12} className="text-blue-600" />
                                  <span className="text-xs font-medium text-blue-600">
                                    {(leg.rawData.distance_km * 1.5).toFixed(0)} $PVCX
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col space-y-1">
                              <span className="text-xs text-gray-600">Capacity</span>
                              <span className="text-sm font-semibold text-gray-800">{leg.capacity}</span>
                            </div>
                            <div className="flex flex-col space-y-1">
                              <span className="text-xs text-gray-600">Departure</span>
                              <span className="text-sm font-semibold text-gray-800">{leg.departureDate}</span>
                            </div>
                          </div>

                          <div className="flex space-x-4 pt-4 border-t border-gray-600/30 text-xs">
                            <a href="#" className="text-gray-600 hover:text-gray-800">Book now ↗</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {emptyLegsData.length > emptyLegsPerPage && (
                  <div className="flex justify-center items-center mt-8 gap-2">
                    <button
                      onClick={() => setCurrentEmptyLegsPage(prev => Math.max(1, prev - 1))}
                      disabled={currentEmptyLegsPage === 1}
                      className="px-4 py-2 bg-white/35 hover:bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      Previous
                    </button>

                    {(() => {
                      const totalPages = Math.ceil(emptyLegsData.length / emptyLegsPerPage);
                      const pages = [];

                      if (totalPages <= 5) {
                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                      } else {
                        pages.push(1);
                        if (currentEmptyLegsPage > 3) pages.push('...');

                        for (let i = Math.max(2, currentEmptyLegsPage - 1); i <= Math.min(totalPages - 1, currentEmptyLegsPage + 1); i++) {
                          if (!pages.includes(i)) pages.push(i);
                        }

                        if (currentEmptyLegsPage < totalPages - 2) pages.push('...');
                        if (!pages.includes(totalPages)) pages.push(totalPages);
                      }

                      return pages.map((page, idx) =>
                        page === '...' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setCurrentEmptyLegsPage(page)}
                            className={`w-10 h-10 rounded-lg text-sm transition-all ${
                              currentEmptyLegsPage === page
                                ? 'bg-gray-800 text-white'
                                : 'bg-white/35 hover:bg-white/40 border border-gray-300/50 text-gray-700'
                            }`}
                            style={currentEmptyLegsPage !== page ? { backdropFilter: 'blur(20px) saturate(180%)' } : {}}
                          >
                            {page}
                          </button>
                        )
                      );
                    })()}

                    <button
                      onClick={() => setCurrentEmptyLegsPage(prev => Math.min(Math.ceil(emptyLegsData.length / emptyLegsPerPage), prev + 1))}
                      disabled={currentEmptyLegsPage === Math.ceil(emptyLegsData.length / emptyLegsPerPage)}
                      className="px-4 py-2 bg-white/35 hover:bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      Next
                    </button>
                  </div>
                )}
                </>
              )}

              {/* Tabs/List View - Respects viewMode on all devices */}
              {!isLoadingEmptyLegs && !showEmptyLegDetail && emptyLegsViewMode === 'tabs' && (
                <div className="w-full space-y-2">
                  {emptyLegsData
                    .slice((currentEmptyLegsPage - 1) * emptyLegsPerPage, currentEmptyLegsPage * emptyLegsPerPage)
                    .map((leg) => (
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
                      className={`bg-white/35 hover:bg-white/40 rounded-lg overflow-hidden cursor-pointer ${
                        leg.rawData?.price && leg.rawData.price <= 1500
                          ? 'pulse-green-glow'
                          : 'border border-gray-300/50'
                      }`}
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      {/* Mobile: Compact card layout */}
                      <div className="md:hidden p-3">
                        <div className="flex gap-3 mb-3">
                          {/* Small Image */}
                          <div className="w-16 h-16 bg-gray-100/50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {leg.image ? (
                              <img src={leg.image} alt={leg.name} className="w-full h-full object-cover" />
                            ) : (
                              <MapPin size={20} className="text-gray-400" />
                            )}
                          </div>
                          {/* Route Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 flex-wrap">
                              <h3 className="text-sm font-semibold text-gray-800 truncate">{leg.name}</h3>
                              {leg.rawData?.price && leg.rawData.price <= 1500 && (
                                <span className="bg-green-500 text-white px-1.5 py-0.5 rounded text-[9px] font-bold animate-pulse">FREE</span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 mb-0.5">{leg.subtitle}</p>
                            <p className="text-[10px] text-gray-600 mb-1">{leg.category}</p>
                            <div className="text-xs font-medium text-gray-800">{leg.totalPrice}</div>
                          </div>
                        </div>
                        {/* Info Row */}
                        <div className="flex items-center justify-between text-[10px] text-gray-600 mb-3">
                          <span>📅 {leg.departureDate}</span>
                          <span>👥 {leg.capacity}</span>
                        </div>
                        {/* Action Button */}
                        <button className="w-full py-2 bg-gray-800 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-all">
                          View Details
                        </button>
                      </div>

                      {/* Desktop: Original horizontal layout */}
                      <div className="hidden md:flex items-center p-4 gap-4">
                        {/* Icon/Image */}
                        <div className="w-16 h-16 bg-gray-100/50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {leg.image ? (
                            <img src={leg.image} alt={leg.name} className="w-full h-full object-cover" />
                          ) : (
                            <MapPin size={24} className="text-gray-400" />
                          )}
                        </div>

                        {/* Route Name */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-gray-800">{leg.name}</h3>
                            {leg.rawData?.price && leg.rawData.price <= 1500 && (
                              <span className="bg-green-500 text-white px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">FREE with NFT</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{leg.subtitle}</p>
                          <p className="text-xs text-gray-600">{leg.category}</p>
                        </div>

                        {/* Departure Date */}
                        <div className="text-center px-4">
                          <div className="text-sm font-light text-gray-800">{leg.departureDate}</div>
                          <div className="text-[10px] text-gray-600">Departure</div>
                        </div>

                        {/* Price */}
                        <div className="text-center px-4">
                          <div className="text-sm font-light text-gray-800">{leg.totalPrice}</div>
                          <div className="text-[10px] text-gray-600">Total Price</div>
                        </div>

                        {/* Capacity */}
                        <div className="text-center px-4">
                          <div className="text-sm font-light text-gray-800">{leg.capacity}</div>
                          <div className="text-[10px] text-gray-600">Capacity</div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2 flex-shrink-0">
                          <button className="px-4 py-2 bg-gray-800 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-all">
                            Book Now
                          </button>
                          <button className="px-4 py-2 bg-white/20 border border-gray-300/50 text-gray-800 rounded-lg text-xs font-medium hover:bg-white/30 transition-all">
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {emptyLegsData.length > emptyLegsPerPage && (
                    <div className="flex justify-center items-center mt-8 gap-2">
                      <button
                        onClick={() => setCurrentEmptyLegsPage(prev => Math.max(1, prev - 1))}
                        disabled={currentEmptyLegsPage === 1}
                        className="px-4 py-2 bg-white/35 hover:bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                      >
                        Previous
                      </button>

                      {(() => {
                        const totalPages = Math.ceil(emptyLegsData.length / emptyLegsPerPage);
                        const pages = [];

                        if (totalPages <= 5) {
                          for (let i = 1; i <= totalPages; i++) pages.push(i);
                        } else {
                          pages.push(1);
                          if (currentEmptyLegsPage > 3) pages.push('...');

                          for (let i = Math.max(2, currentEmptyLegsPage - 1); i <= Math.min(totalPages - 1, currentEmptyLegsPage + 1); i++) {
                            if (!pages.includes(i)) pages.push(i);
                          }

                          if (currentEmptyLegsPage < totalPages - 2) pages.push('...');
                          if (!pages.includes(totalPages)) pages.push(totalPages);
                        }

                        return pages.map((page, idx) =>
                          page === '...' ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => setCurrentEmptyLegsPage(page)}
                              className={`w-10 h-10 rounded-lg text-sm transition-all ${
                                currentEmptyLegsPage === page
                                  ? 'bg-gray-800 text-white'
                                  : 'bg-white/35 hover:bg-white/40 border border-gray-300/50 text-gray-700'
                              }`}
                              style={currentEmptyLegsPage !== page ? { backdropFilter: 'blur(20px) saturate(180%)' } : {}}
                            >
                              {page}
                            </button>
                          )
                        );
                      })()}

                      <button
                        onClick={() => setCurrentEmptyLegsPage(prev => Math.min(Math.ceil(emptyLegsData.length / emptyLegsPerPage), prev + 1))}
                        disabled={currentEmptyLegsPage === Math.ceil(emptyLegsData.length / emptyLegsPerPage)}
                        className="px-4 py-2 bg-white/35 hover:bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
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
            </div>
          )}

          {/* HOTELS SECTION */}
          {!isTransitioning && activeCategory === 'hotels' && (
            <div className="w-full flex-1 flex flex-col">
              <HotelsView onBack={() => setActiveCategory('jets')} />
            </div>
          )}

          {/* ADVENTURES SECTION */}
          {!isTransitioning && activeCategory === 'adventures' && (
            <div className="w-full flex-1 flex flex-col">
              {/* Pulsing green border animation for NFT free offers */}
              <style>{`
                @keyframes pulse-green-glow {
                  0%, 100% {
                    box-shadow: 0 0 15px rgba(74, 222, 128, 0.5), 0 0 30px rgba(74, 222, 128, 0.3);
                    border-color: rgb(74, 222, 128);
                  }
                  50% {
                    box-shadow: 0 0 30px rgba(74, 222, 128, 0.8), 0 0 60px rgba(74, 222, 128, 0.5);
                    border-color: rgb(34, 197, 94);
                  }
                }
              `}</style>

              {/* Adventures Header with View Switcher - Mobile Optimized */}
              {!showAdventureDetail && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 gap-3">
                <h2 className="text-xl md:text-3xl lg:text-4xl font-light text-gray-900 tracking-tighter">Adventures</h2>
                <div className="flex items-center gap-2 md:gap-3">
                  {/* Filter Toggle Button */}
                  <button
                    onClick={() => setAdventuresFiltersVisible(!adventuresFiltersVisible)}
                    className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-medium transition-all backdrop-blur-xl border ${
                      adventuresFiltersVisible
                        ? 'bg-gray-800 text-white border-gray-800'
                        : 'bg-gray-100/60 text-gray-700 border-gray-300/50 hover:bg-gray-200/60'
                    }`}
                    style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                  >
                    <SlidersHorizontal size={12} />
                    <span>Filters</span>
                  </button>

                  {/* View Mode Switcher - Hidden on mobile, force grid on mobile */}
                  <div className="hidden md:flex items-center gap-1 bg-gray-100/60 border border-gray-300/50 rounded-lg p-1 backdrop-blur-xl" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                    <button
                      onClick={() => setAdventuresViewMode('grid')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        adventuresViewMode === 'grid'
                          ? 'bg-gray-800 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setAdventuresViewMode('tabs')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        adventuresViewMode === 'tabs'
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

              {/* Back button when showing adventure detail */}
              {showAdventureDetail && (
                <button
                  onClick={() => {
                    setShowAdventureDetail(false);
                    setSelectedAdventure(null);
                    setCurrentAdventureImageIndex(0);
                    setAdventureDetailTab('details');
                  }}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6 transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span className="text-sm font-medium">Back to Adventures</span>
                </button>
              )}

              {/* Adventures Filters - Mobile Optimized */}
              {!showAdventureDetail && adventuresFiltersVisible && (
                <div className="bg-gray-100/60 rounded-lg border border-gray-300/50 p-3 md:p-5 mb-4 md:mb-6 backdrop-blur-xl transition-all duration-300" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
                    <div>
                      <label className="block text-[10px] md:text-xs font-medium text-gray-800 mb-1 md:mb-2">Region</label>
                      <select
                        value={adventuresFilter}
                        onChange={(e) => setAdventuresFilter(e.target.value)}
                        className="w-full px-2 md:px-3 py-2 md:py-2.5 border border-gray-300/50 rounded-lg bg-white/60 text-xs md:text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                        style={{ backdropFilter: 'blur(10px) saturate(150%)' }}
                      >
                        <option value="all">All Regions</option>
                        <option value="europe">Europe</option>
                        <option value="usa">North America</option>
                        <option value="asia">Asia</option>
                        <option value="africa">Africa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs font-medium text-gray-800 mb-1 md:mb-2">Type</label>
                      <input
                        type="text"
                        placeholder="e.g. Safari"
                        value={adventuresPackageType}
                        onChange={(e) => setAdventuresPackageType(e.target.value)}
                        className="w-full px-2 md:px-3 py-2 md:py-2.5 border border-gray-300/50 rounded-lg bg-white/60 text-xs md:text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                        style={{ backdropFilter: 'blur(10px) saturate(150%)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs font-medium text-gray-800 mb-1 md:mb-2">Destination</label>
                      <input
                        type="text"
                        placeholder="e.g. Dubai"
                        value={adventuresDestination}
                        onChange={(e) => setAdventuresDestination(e.target.value)}
                        className="w-full px-2 md:px-3 py-2 md:py-2.5 border border-gray-300/50 rounded-lg bg-white/60 text-xs md:text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                        style={{ backdropFilter: 'blur(10px) saturate(150%)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs font-medium text-gray-800 mb-1 md:mb-2">Max Price</label>
                      <input
                        type="number"
                        placeholder="$50000"
                        value={adventuresMaxPrice}
                        onChange={(e) => setAdventuresMaxPrice(e.target.value)}
                        className="w-full px-2 md:px-3 py-2 md:py-2.5 border border-gray-300/50 rounded-lg bg-white/60 text-xs md:text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                        style={{ backdropFilter: 'blur(10px) saturate(150%)' }}
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1 flex items-end">
                      <button
                        onClick={() => {
                          setAdventuresSearch('');
                          setAdventuresPackageType('');
                          setAdventuresDestination('');
                          setAdventuresMaxPrice('');
                          setAdventuresFilter('all');
                        }}
                        className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-gray-100/60 text-gray-700 rounded-lg text-xs md:text-sm hover:bg-gray-200/60 transition-all"
                        style={{ backdropFilter: 'blur(10px) saturate(150%)' }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isLoadingAdventures && (
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

              {/* Adventures Grid View - Mobile Optimized with Vertical Cards */}
              {!isLoadingAdventures && !showAdventureDetail && (adventuresViewMode === 'grid' || window.innerWidth < 768) && (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
                  {adventuresData
                    .slice((currentAdventuresPage - 1) * adventuresPerPage, currentAdventuresPage * adventuresPerPage)
                    .map((adventure) => (
                    <div
                      key={adventure.id}
                      onClick={() => {
                        setSelectedAdventure(adventure);
                        setShowAdventureDetail(true);
                        setCurrentAdventureImageIndex(0);
                      }}
                      className={`bg-white/35 hover:bg-white/40 rounded-xl overflow-hidden hover:shadow-lg cursor-pointer ${
                        adventure.isFreeWithNFT
                          ? 'pulse-green-glow'
                          : 'border border-gray-300/50'
                      }`}
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      {/* Mobile: Vertical stacked layout */}
                      <div className="md:hidden">
                        {/* Image on top */}
                        <div className="relative h-36 bg-white/10">
                          {adventure.image && (
                            <img
                              src={adventure.image}
                              alt={adventure.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                            <div className="bg-white/90 px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 backdrop-blur-sm">
                              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                              <span className="text-gray-800">{adventure.location}</span>
                            </div>
                            {adventure.isFreeWithNFT && (
                              <div className="bg-green-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold backdrop-blur-sm animate-pulse">
                                FREE with NFT
                              </div>
                            )}
                          </div>
                          <FavouriteButton
                            item={{
                              id: adventure.id,
                              type: 'adventure',
                              name: adventure.name,
                              location: adventure.location,
                              image: adventure.image,
                              category: adventure.category,
                              price: adventure.totalPrice,
                              metadata: {
                                isFreeWithNFT: adventure.isFreeWithNFT,
                                description: adventure.description
                              }
                            }}
                            variant="floating"
                            size={16}
                          />
                        </div>
                        {/* Content below */}
                        <div className="p-3">
                          <h3 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-1">{adventure.name}</h3>
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="text-center bg-gray-100/50 rounded-lg py-1.5">
                              <span className="text-[10px] text-gray-500 block">Price</span>
                              <span className="text-xs font-semibold text-gray-800">{adventure.totalPrice}</span>
                            </div>
                            <div className="text-center bg-gray-100/50 rounded-lg py-1.5">
                              <span className="text-[10px] text-gray-500 block">Duration</span>
                              <span className="text-xs font-semibold text-gray-800">{adventure.yield}</span>
                            </div>
                          </div>
                          <button className="w-full py-2 bg-gray-800 text-white rounded-lg text-xs font-medium">
                            View Details
                          </button>
                        </div>
                      </div>

                      {/* Desktop: Horizontal layout */}
                      <div className="hidden md:flex h-64">
                        <div className="w-2/5 bg-white/10 relative flex-shrink-0 rounded-l-xl overflow-hidden">
                          {adventure.image && (
                            <img
                              src={adventure.image}
                              alt={adventure.name}
                              className="w-full h-64 object-cover"
                            />
                          )}
                          <div className="absolute top-3 left-3 flex flex-col space-y-1.5">
                            <div className="flex space-x-1.5">
                              <div className="bg-white/90 px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                <span>{adventure.location}</span>
                              </div>
                              <div className="bg-white/90 px-2 py-1 rounded text-xs font-medium">⌂ {adventure.category}</div>
                            </div>
                            {adventure.isFreeWithNFT && (
                              <div className="bg-green-500 text-white px-3 py-1.5 rounded text-xs font-bold shadow-lg animate-pulse">
                                FREE with NFT
                              </div>
                            )}
                          </div>
                          <FavouriteButton
                            item={{
                              id: adventure.id,
                              type: 'adventure',
                              name: adventure.name,
                              location: adventure.location,
                              image: adventure.image,
                              category: adventure.category,
                              price: adventure.totalPrice,
                              metadata: {
                                isFreeWithNFT: adventure.isFreeWithNFT,
                                description: adventure.description
                              }
                            }}
                            variant="floating"
                            size={18}
                          />
                        </div>
                        <div className="flex-1 p-5 flex flex-col">
                          <div className="flex items-center justify-between mb-3">
                            {adventure.rawData?.is_partner_offer ? (
                              <div className="flex items-center gap-2">
                                <img
                                  src={adventure.rawData.partner_logo_url || 'https://via.placeholder.com/80x24/000/fff?text=Partner'}
                                  alt={adventure.rawData.partner_name || 'Partner'}
                                  className="h-6 w-auto object-contain rounded"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/80x24/000/fff?text=Partner';
                                  }}
                                />
                              </div>
                            ) : (
                              <img
                                src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_logo_vectorized.glb.png"
                                alt="PrivateCharterX"
                                className="h-6 w-auto object-contain"
                              />
                            )}
                          </div>
                          <h3 className="text-base font-semibold text-gray-800 mb-4 line-clamp-2 overflow-hidden">{adventure.name}</h3>
                          <div className="flex space-x-6 border-b border-gray-600/30 mb-5">
                            <button className="pb-3 text-xs relative text-gray-800">
                              Properties
                              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800"></div>
                            </button>
                            <button className="pb-3 text-xs text-gray-600">Description</button>
                          </div>

                          <div className="flex justify-between mt-auto mb-5">
                            <div className="flex flex-col space-y-1">
                              <span className="text-xs text-gray-600">Price</span>
                              <span className="text-sm font-semibold text-gray-800">{adventure.totalPrice}</span>
                            </div>
                            <div className="flex flex-col space-y-1">
                              <span className="text-xs text-gray-600">Duration</span>
                              <span className="text-sm font-semibold text-gray-800">{adventure.yield}</span>
                            </div>
                          </div>

                          <div className="flex space-x-4 pt-4 border-t border-gray-600/30 text-xs">
                            <a href="#" className="text-gray-600 hover:text-gray-800">See details ↗</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {adventuresData.length > adventuresPerPage && (
                  <div className="flex justify-center items-center mt-8 gap-2">
                    <button
                      onClick={() => setCurrentAdventuresPage(prev => Math.max(1, prev - 1))}
                      disabled={currentAdventuresPage === 1}
                      className="px-4 py-2 bg-white/35 hover:bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      Previous
                    </button>

                    {(() => {
                      const totalPages = Math.ceil(adventuresData.length / adventuresPerPage);
                      const pages = [];

                      if (totalPages <= 5) {
                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                      } else {
                        pages.push(1);
                        if (currentAdventuresPage > 3) pages.push('...');

                        for (let i = Math.max(2, currentAdventuresPage - 1); i <= Math.min(totalPages - 1, currentAdventuresPage + 1); i++) {
                          if (!pages.includes(i)) pages.push(i);
                        }

                        if (currentAdventuresPage < totalPages - 2) pages.push('...');
                        if (!pages.includes(totalPages)) pages.push(totalPages);
                      }

                      return pages.map((page, idx) =>
                        page === '...' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setCurrentAdventuresPage(page)}
                            className={`w-10 h-10 rounded-lg text-sm transition-all ${
                              currentAdventuresPage === page
                                ? 'bg-gray-800 text-white'
                                : 'bg-white/35 hover:bg-white/40 border border-gray-300/50 text-gray-700'
                            }`}
                            style={currentAdventuresPage !== page ? { backdropFilter: 'blur(20px) saturate(180%)' } : {}}
                          >
                            {page}
                          </button>
                        )
                      );
                    })()}

                    <button
                      onClick={() => setCurrentAdventuresPage(prev => Math.min(Math.ceil(adventuresData.length / adventuresPerPage), prev + 1))}
                      disabled={currentAdventuresPage === Math.ceil(adventuresData.length / adventuresPerPage)}
                      className="px-4 py-2 bg-white/35 hover:bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      Next
                    </button>
                  </div>
                )}
                </>
              )}

              {/* Adventures Tabs View */}
              {!isLoadingAdventures && !showAdventureDetail && adventuresViewMode === 'tabs' && (
                <div className="w-full space-y-2">
                  {adventuresData
                    .slice((currentAdventuresPage - 1) * adventuresPerPage, currentAdventuresPage * adventuresPerPage)
                    .map((adventure) => (
                    <div
                      key={adventure.id}
                      className={`bg-white/35 hover:bg-white/40 rounded-lg transition-all cursor-pointer border ${
                        adventure.isFreeWithNFT
                          ? 'border-2 border-green-400'
                          : 'border-gray-300/50'
                      }`}
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                      onClick={() => {
                        setSelectedAdventure(adventure);
                        setShowAdventureDetail(true);
                        setCurrentAdventureImageIndex(0);
                      }}
                    >
                      <div className="flex items-center p-4 gap-4">
                        {/* Image */}
                        <div className="w-20 h-20 flex-shrink-0 rounded overflow-hidden">
                          <img src={adventure.image} alt={adventure.name} className="w-full h-full object-cover" />
                        </div>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-800">{adventure.name}</h3>
                          <p className="text-xs text-gray-600">{adventure.category}</p>
                        </div>

                        {/* Location */}
                        <div className="text-center px-4">
                          <div className="text-sm font-light text-gray-800">{adventure.location}</div>
                          <div className="text-[10px] text-gray-600">Location</div>
                        </div>

                        {/* Price */}
                        <div className="text-center px-4">
                          <div className="text-sm font-light text-gray-800">{adventure.totalPrice}</div>
                          <div className="text-[10px] text-gray-600">Price</div>
                        </div>

                        {/* Duration */}
                        <div className="text-center px-4">
                          <div className="text-sm font-light text-gray-800">{adventure.yield}</div>
                          <div className="text-[10px] text-gray-600">Duration</div>
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
                  {adventuresData.length > adventuresPerPage && (
                    <div className="flex justify-center items-center mt-8 gap-2">
                      <button
                        onClick={() => setCurrentAdventuresPage(prev => Math.max(1, prev - 1))}
                        disabled={currentAdventuresPage === 1}
                        className="px-4 py-2 bg-white/35 hover:bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                      >
                        Previous
                      </button>

                      {(() => {
                        const totalPages = Math.ceil(adventuresData.length / adventuresPerPage);
                        const pages = [];

                        if (totalPages <= 5) {
                          for (let i = 1; i <= totalPages; i++) pages.push(i);
                        } else {
                          pages.push(1);
                          if (currentAdventuresPage > 3) pages.push('...');

                          for (let i = Math.max(2, currentAdventuresPage - 1); i <= Math.min(totalPages - 1, currentAdventuresPage + 1); i++) {
                            if (!pages.includes(i)) pages.push(i);
                          }

                          if (currentAdventuresPage < totalPages - 2) pages.push('...');
                          if (!pages.includes(totalPages)) pages.push(totalPages);
                        }

                        return pages.map((page, idx) =>
                          page === '...' ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => setCurrentAdventuresPage(page)}
                              className={`w-10 h-10 rounded-lg text-sm transition-all ${
                                currentAdventuresPage === page
                                  ? 'bg-gray-800 text-white'
                                  : 'bg-white/35 hover:bg-white/40 border border-gray-300/50 text-gray-700'
                              }`}
                              style={currentAdventuresPage !== page ? { backdropFilter: 'blur(20px) saturate(180%)' } : {}}
                            >
                              {page}
                            </button>
                          )
                        );
                      })()}

                      <button
                        onClick={() => setCurrentAdventuresPage(prev => Math.min(Math.ceil(adventuresData.length / adventuresPerPage), prev + 1))}
                        disabled={currentAdventuresPage === Math.ceil(adventuresData.length / adventuresPerPage)}
                        className="px-4 py-2 bg-white/35 hover:bg-white/40 border border-gray-300/50 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Adventure Detail View - Full Layout */}
              {showAdventureDetail && selectedAdventure && (() => {
                const rawData = selectedAdventure.rawData || {};
                const priceLabel = rawData.price_on_request ? 'On Request' : (selectedAdventure.totalPrice || 'On Request');
                return (
                  <div className="w-full max-w-7xl">
                    {/* Header Section with Image and Main Info */}
                    <div className="bg-white/35 rounded-lg border border-gray-300/50 mb-6 overflow-hidden" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                      <div className="grid grid-cols-2 gap-0">
                        {/* Left: Hero Image */}
                        <div className="relative h-96">
                          <img
                            src={selectedAdventure.image}
                            alt={selectedAdventure.name}
                            className="w-full h-full object-cover"
                          />
                          {/* Badges on Image */}
                          <div className="absolute top-4 left-4 flex gap-2">
                            <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-gray-800">● Available</span>
                            <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">⛰ Adventure</span>
                          </div>
                        </div>

                        {/* Right: Package Info */}
                        <div className="flex-1 p-5 flex flex-col">
                          <div className="flex items-center justify-between mb-3">
                            {selectedAdventure.rawData?.is_partner_offer ? (
                              <div className="flex items-center gap-2">
                                <img
                                  src={selectedAdventure.rawData.partner_logo_url || 'https://via.placeholder.com/120x30/000/fff?text=Partner'}
                                  alt={selectedAdventure.rawData.partner_name || 'Partner'}
                                  className="h-7 w-auto object-contain rounded"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/120x30/000/fff?text=Partner';
                                  }}
                                />
                              </div>
                            ) : (
                              <img
                                src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_logo_vectorized.glb.png"
                                alt="PrivateCharterX"
                                className="h-7 w-auto object-contain"
                              />
                            )}
                          </div>

                          <h1 className="text-2xl font-semibold mb-2 text-gray-900">{selectedAdventure.name}</h1>
                          <p className="text-sm text-gray-600 mb-4">{rawData.destination || selectedAdventure.location}</p>

                          {/* Tabs */}
                          <div className="flex space-x-6 border-b border-gray-300/50 mb-4">
                            {[
                              { key: 'details', label: 'Details' },
                              { key: 'itinerary', label: 'Itinerary' },
                              { key: 'pricing', label: 'Pricing' },
                            ].map(tab => (
                              <button
                                key={tab.key}
                                onClick={() => setAdventureDetailTab(tab.key)}
                                className={`pb-3 text-sm font-medium transition-colors ${
                                  adventureDetailTab === tab.key ? 'text-gray-800 border-b-2 border-gray-800' : 'text-gray-600 hover:text-gray-800'
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          {/* Key Info Grid */}
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Duration</p>
                              <p className="text-base font-semibold text-gray-800">{rawData.duration || selectedAdventure.yield || 'Flexible'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Difficulty</p>
                              <p className="text-base font-semibold text-gray-800">{rawData.difficulty_level || selectedAdventure.period || 'All levels'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Price</p>
                              <p className="text-base font-semibold text-gray-800">{priceLabel}</p>
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

                    {/* Bottom Section: Package Details + Booking */}
                    <div className="grid grid-cols-3 gap-6">
                      {/* Left: Package Details (tabbed content) */}
                      <div className="col-span-2 bg-white/35 rounded-lg border border-gray-300/50 p-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                        {adventureDetailTab === 'details' && (
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Package Details</h2>
                            {rawData.description && (
                              <p className="text-sm text-gray-700 mb-6 whitespace-pre-line">{rawData.description}</p>
                            )}
                            <div className="grid grid-cols-2 gap-6 mb-6">
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Destination</p>
                                <p className="text-sm font-semibold text-gray-800">{rawData.destination || 'TBD'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Origin</p>
                                <p className="text-sm font-semibold text-gray-800">{rawData.origin || 'Various'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Package Type</p>
                                <p className="text-sm font-semibold text-gray-800">{rawData.package_type || 'Adventure'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Guests</p>
                                <p className="text-sm font-semibold text-gray-800">{rawData.passengers || 'Flexible'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Duration</p>
                                <p className="text-sm font-semibold text-gray-800">{rawData.duration || selectedAdventure.yield || 'Flexible'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Difficulty</p>
                                <p className="text-sm font-semibold text-gray-800">{rawData.difficulty_level || selectedAdventure.period || 'All levels'}</p>
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
                          </div>
                        )}

                        {adventureDetailTab === 'itinerary' && (
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Itinerary</h2>
                            <p className="text-sm text-gray-700">Detailed itinerary coming soon. Our concierge will tailor your schedule based on your preferences.</p>
                          </div>
                        )}

                        {adventureDetailTab === 'pricing' && (
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
                            <p className="text-sm text-gray-700 mb-2">Base price: {priceLabel}</p>
                            <p className="text-sm text-gray-700">Final pricing depends on guest count, dates, and optional add-ons. Submit a request to receive a personalized quote.</p>
                          </div>
                        )}
                      </div>

                      {/* Right: Book This Adventure Sidebar */}
                      <div className="bg-white/35 rounded-lg border border-gray-300/50 p-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Book This Adventure</h2>

                        <div className="space-y-3 mb-6">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Base Price</p>
                            <p className="text-xl font-semibold text-gray-800">{priceLabel}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Destination</p>
                            <p className="text-sm font-semibold text-gray-800">{rawData.destination || selectedAdventure.location || 'TBD'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Duration</p>
                            <p className="text-sm font-semibold text-gray-800">{rawData.duration || selectedAdventure.yield || 'Flexible'}</p>
                          </div>
                          {rawData.passengers && (
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Guests</p>
                              <p className="text-sm font-semibold text-gray-800">{rawData.passengers}</p>
                            </div>
                          )}
                        </div>

                        <div className="border-t border-gray-300/50 pt-6 mb-6">
                          <h3 className="text-sm font-semibold text-gray-900 mb-4">Booking Details</h3>

                          {/* Date Range Picker */}
                          <div className="mb-4 space-y-3">
                            <div>
                              <label className="text-xs text-gray-600 block mb-2">Start Date</label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                <input
                                  type="date"
                                  value={adventureStartDate}
                                  onChange={(e) => setAdventureStartDate(e.target.value)}
                                  min={new Date().toISOString().split('T')[0]}
                                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 block mb-2">End Date</label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                <input
                                  type="date"
                                  value={adventureEndDate}
                                  onChange={(e) => setAdventureEndDate(e.target.value)}
                                  min={adventureStartDate || new Date().toISOString().split('T')[0]}
                                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div>
                              <p className="text-xs text-gray-600 mb-2">Guests</p>
                              <div className="flex items-center justify-between border border-gray-300 rounded px-2 py-1">
                                <button
                                  onClick={() => setAdventureGuests(Math.max(1, adventureGuests - 1))}
                                  className="text-gray-600 hover:text-gray-900"
                                >−</button>
                                <span className="text-sm font-medium">{adventureGuests}</span>
                                <button
                                  onClick={() => setAdventureGuests(adventureGuests + 1)}
                                  className="text-gray-600 hover:text-gray-900"
                                >+</button>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-2">Rooms</p>
                              <div className="flex items-center justify-between border border-gray-300 rounded px-2 py-1">
                                <button className="text-gray-600 hover:text-gray-900">−</button>
                                <span className="text-sm font-medium">1</span>
                                <button className="text-gray-600 hover:text-gray-900">+</button>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-2">Extras</p>
                              <div className="flex items-center justify-center border border-gray-300 rounded px-2 py-1">
                                <span className="text-sm font-medium">On Request</span>
                              </div>
                            </div>
                          </div>

                          {/* Price Breakdown - Use priceUSD (converted from EUR) */}
                          {(() => {
                            const priceUSD = selectedAdventure?.priceUSD || 0;
                            const vatAmount = Math.round(priceUSD * 0.081); // 8.1% Swiss VAT
                            const totalWithVAT = priceUSD + vatAmount;
                            const pvcxEarnings = Math.round(priceUSD * 1.5);
                            return (
                              <div className="space-y-2.5 mb-4">
                                {priceUSD > 0 && !rawData.price_on_request ? (
                                  <>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">Base Price</span>
                                      <span className="text-gray-900">${priceUSD.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">VAT (8.1%)</span>
                                      <span className="text-gray-900">${vatAmount.toLocaleString()}</span>
                                    </div>

                                    {/* PVCX Earnings Box */}
                                    <div className="border border-gray-300 rounded-lg p-3 bg-blue-50/30 mt-3 mb-3">
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                          <Coins size={16} className="text-blue-600" />
                                          <span className="text-sm text-gray-700">Earnings $PVCX</span>
                                        </div>
                                        <span className="text-sm font-medium text-blue-900">{pvcxEarnings.toLocaleString()} $PVCX</span>
                                      </div>
                                    </div>

                                    <div className="flex justify-between text-base pt-2 border-t border-gray-300">
                                      <span className="font-semibold text-gray-900">Final Price</span>
                                      <span className="font-semibold text-gray-900">${totalWithVAT.toLocaleString()}</span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">Price</span>
                                      <span className="text-gray-900">{priceLabel}</span>
                                    </div>
                                    <div className="flex justify-between text-base pt-2 border-t border-gray-300">
                                      <span className="font-semibold text-gray-900">Final Price</span>
                                      <span className="font-semibold text-gray-900">{priceLabel}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        <button
                          className={`w-full py-3 rounded-lg font-bold transition-all mb-4 ${adventureSubmitting ? 'bg-gray-600 text-white cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}
                          disabled={adventureSubmitting}
                          onClick={async () => {
                            if (!user) {
                              alert('Please log in to submit a request.');
                              return;
                            }

                            try {
                              setAdventureSubmitting(true);
                              const offer = selectedAdventure?.rawData || {};

                              // Calculate price breakdown
                              const basePrice = selectedAdventure?.priceUSD || (offer.price ? Math.round(convertToUSD(offer.price, 'EUR')) : 0);
                              const platformFeePercent = 2.5;
                              const platformFee = Math.round(basePrice * (platformFeePercent / 100));
                              const vatPercent = 8.1; // Swiss VAT
                              const vatAmount = Math.round(basePrice * (vatPercent / 100));
                              const totalPrice = basePrice + platformFee + vatAmount;

                              const payload = {
                                // Core
                                offer_id: offer.id,
                                offer_title: offer.title || selectedAdventure?.name,
                                offer_type: offer.package_type || 'Adventure',
                                aircraft: offer.title || selectedAdventure?.name, // For unified extraction
                                category: offer.package_type || 'Adventure',
                                origin: offer.origin,
                                destination: offer.destination || selectedAdventure?.location,
                                image_url: offer.image_url || selectedAdventure?.image,
                                duration: offer.duration,
                                difficulty_level: offer.difficulty_level,
                                package_type: offer.package_type,
                                passengers: offer.passengers || offer.max_participants,
                                currency: 'USD',
                                // Full price breakdown
                                base_price: basePrice,
                                platform_fee: platformFee,
                                platform_fee_percent: platformFeePercent,
                                vat_amount: vatAmount,
                                vat_percent: vatPercent,
                                total_price: totalPrice,
                                price: basePrice, // Keep for backwards compatibility
                                original_price_eur: offer.price, // Store original EUR for reference
                                price_on_request: offer.price_on_request || !offer.price,
                                description: offer.description,

                                // Booking dates and guests
                                start_date: adventureStartDate || null,
                                end_date: adventureEndDate || null,
                                guests: adventureGuests,

                                // Client info
                                client_info: {
                                  user_id: user.id,
                                  email: user.email,
                                },

                                // Metadata
                                booking_source: 'glassmorphic_adventures_detail',
                                timestamp: new Date().toISOString(),
                              };

                              // DIRECT INSERT - matching working pattern
                              const { error: dbError } = await supabase
                                .from('user_requests')
                                .insert([{
                                  user_id: user.id,
                                  type: 'adventure_package',
                                  status: 'pending',
                                  data: payload
                                }]);

                              if (dbError) throw dbError;
                              setAdventureSubmitSuccess(true);
                              setTimeout(() => {
                                setAdventureSubmitSuccess(false);
                                setActiveCategory('requests'); // Navigate to My Requests
                              }, 2500);
                            } catch (err) {
                              console.error('Failed to submit adventure request', err);
                              alert('Failed to submit request. Please try again.');
                            } finally {
                              setAdventureSubmitting(false);
                            }
                          }}
                        >
                          {adventureSubmitting ? 'Submitting...' : adventureSubmitSuccess ? 'Request Sent ✓' : 'Request Quote'}
                        </button>

                        <button
                          className="w-full py-3 rounded-lg font-bold transition-all mb-4 border border-gray-300 text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            if (!user) {
                              alert('Please log in to pay with crypto.');
                              return;
                            }

                            const offer = selectedAdventure?.rawData || {};
                            const basePrice = offer.price || 0;
                            const isFree = hasNFT && basePrice < 1500;

                            if (isFree) {
                              alert('This adventure is FREE with your NFT membership! Click "Request Quote" instead.');
                              return;
                            }

                            if (!basePrice || offer.price_on_request) {
                              alert('Price on request. Please submit a quote request first.');
                              return;
                            }

                            // Apply NFT discount if applicable
                            const finalPrice = hasNFT ? basePrice * (1 - nftDiscount / 100) : basePrice;

                            setCryptoPaymentData({
                              amount: finalPrice,
                              currency: offer.currency || 'USD',
                              title: offer.title || selectedAdventure?.name || 'Adventure Package',
                              description: `${offer.destination || selectedAdventure?.location} - ${offer.duration || 'Flexible duration'}`,
                              orderId: `ADV-${offer.id}-${Date.now()}`,
                              userEmail: user.email,
                              userId: user.id,
                              serviceType: 'adventure_package',
                              serviceId: offer.id,
                              adventureData: {
                                offer_id: offer.id,
                                offer_title: offer.title || selectedAdventure?.name,
                                offer_type: offer.package_type || 'Adventure',
                                origin: offer.origin,
                                destination: offer.destination || selectedAdventure?.location,
                                image_url: offer.image_url || selectedAdventure?.image,
                                duration: offer.duration,
                                difficulty_level: offer.difficulty_level,
                                package_type: offer.package_type,
                                passengers: offer.passengers || offer.max_participants,
                                currency: offer.currency || 'USD',
                                price: basePrice,
                                final_price: finalPrice,
                                nft_discount_applied: hasNFT ? nftDiscount : 0,
                                price_on_request: false,
                                description: offer.description,
                                start_date: adventureStartDate || null,
                                end_date: adventureEndDate || null,
                                guests: adventureGuests,
                              }
                            });
                            setShowCryptoPayment(true);
                          }}
                        >
                          Pay with Crypto
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

                    {/* Contact Section - Need Assistance */}
                    <div className="bg-white/35 rounded-lg border border-gray-300/50 p-8 mt-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Need Assistance?</h3>
                        <p className="text-sm text-gray-600">Our team is here to help you plan the perfect adventure</p>
                      </div>

                      {/* Team Bubbles */}
                      <div className="flex justify-center gap-4 mb-6">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-gray-200 border-2 border-white shadow-md flex items-center justify-center text-2xl">
                            👨‍💼
                          </div>
                          <span className="text-xs text-gray-600 mt-2">Expert</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-gray-200 border-2 border-white shadow-md flex items-center justify-center text-2xl">
                            👩‍💼
                          </div>
                          <span className="text-xs text-gray-600 mt-2">Advisor</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-gray-200 border-2 border-white shadow-md flex items-center justify-center text-2xl">
                            🧑‍💼
                          </div>
                          <span className="text-xs text-gray-600 mt-2">Support</span>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="flex items-center justify-center gap-2 mb-6">
                        <Mail size={18} className="text-gray-600" />
                        <a href="mailto:bookings@privatecharterx.com" className="text-gray-900 hover:text-black font-medium">
                          bookings@privatecharterx.com
                        </a>
                      </div>

                      {/* Social Share */}
                      <div className="border-t border-gray-300 pt-6">
                        <p className="text-sm text-gray-600 text-center mb-3">Share this adventure</p>
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out this adventure on PrivateCharterX!')}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
                            className="w-10 h-10 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path></svg>
                          </button>
                          <button
                            onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                            className="w-10 h-10 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path></svg>
                          </button>
                          <button
                            onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
                            className="w-10 h-10 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"></path><circle cx="4" cy="4" r="2"></circle></svg>
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.href);
                              alert('Link copied to clipboard!');
                            }}
                            className="w-10 h-10 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* No Results */}
              {!isLoadingAdventures && !showAdventureDetail && adventuresData.length === 0 && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-sm text-gray-600">No adventures found matching your criteria.</div>
                </div>
              )}
            </div>
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
                        <FavouriteButton
                          item={{
                            id: car.id,
                            type: 'luxurycar',
                            name: car.name,
                            location: car.location,
                            image: car.image,
                            category: car.category,
                            price: car.totalPrice,
                            metadata: {
                              manufacturer: car.rawData?.manufacturer,
                              model: car.rawData?.model
                            }
                          }}
                          variant="floating"
                          size={18}
                        />
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
                      <FavouriteButton
                        item={{
                          id: project.id,
                          type: 'co2certificate',
                          name: project.name,
                          location: `${project.location}, ${project.country}`,
                          image: project.image,
                          category: project.category,
                          price: project.pricePerTon,
                          metadata: {
                            projectId: project.projectId,
                            ngoName: project.ngoName,
                            certificationStandard: project.certificationStandard,
                            methodology: project.methodology,
                            availableTons: project.availableTons
                          }
                        }}
                        variant="floating"
                        size={18}
                      />
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

      {/* Chat Widget - Intelligent support with team bubbles and glassmorphic design */}
      <ChatWidget />
    </div>
  );
};

export default TokenizedAssetsGlassmorphic;

