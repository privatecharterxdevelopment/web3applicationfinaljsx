import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Shield, Bell, Heart, Home, Layers, FolderOpen, Plus,
  Plane, Zap, Mountain, Car, MapPin, Sparkles, Rocket,
  Leaf, Award, Settings, User, ChevronRight, ChevronDown, X, LogOut, MessageSquare, MessageCircle,
  Users, Calendar, Package, Compass, ArrowLeft, Wallet, History, Crown, Gift, LayoutDashboard,
  Mail, Phone, Globe, FileText, Edit3, Check, Loader2, Building2, Coins, Share2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import IntelligentSearch from '../IntelligentSearch';
import { eventsService } from '../../services/eventsService';
import { useAccount } from 'wagmi';
import { web3Service } from '../../lib/web3';
import WalletMenu from '../WalletMenu';
import Dashboard from '../Dashboard';
import { createRequest } from '../../services/requests';
import LoginModal from '../LoginModalNew';
import RegisterModal from '../RegisterModalNew';
import ForgotPasswordModal from '../ForgotPasswordModal';
import { ToastContainer } from '../Toast';
import { useToast } from '../../hooks/useToast';
import UnifiedBookingFlow from '../../components/UnifiedBookingFlow';
import TokenizeAssetFlow from './TokenizeAssetFlow';
import SPVFormationFlow from '../SPVFormation/SPVFormationFlow_NEW';
import TokenSwap from './TokenSwap';
import AIChat from './AIChat';
import ChatRequestsView from '../ChatRequestsView';
import CalendarView from '../Calendar/CalendarView';
import FavouritesView from '../Favourites/FavouritesView';
import MyRequestsView from '../MyRequestsView';
import MembershipCard from '../MembershipCard';
import ReferralCard from '../ReferralCard';
import SubscriptionManagement from '../SubscriptionManagement';
import ChatSupport from '../ChatSupport';
import SupportTicketsPage from '../SupportTicketsPage';
import AIChatComingSoon from '../AIChatComingSoon';
import KYCForm from '../KYCForm';
import ProfileSettings from '../ProfileSettings';
import ProfileOverview from './ProfileOverview';
import ProfileOverviewEnhanced from './ProfileOverviewEnhanced';
import STOUTLDashboard from './STOUTLDashboard';
import Marketplace from './Marketplace';
import P2PMarketplace from './P2PMarketplace';
import TokenizedAssetsShowcase from './TokenizedAssetsShowcase';
import CommunityPage from './CommunityPage';
import MyLaunches from './MyLaunches';
import LaunchpadPage from './LaunchpadPage';
import TransactionsPage from './TransactionsPage';
import NFTsPage from './NFTsPage';
import NFTMarketplace from './NFTMarketplace';
import NotificationBell, { useNotificationCount } from '../NotificationBell';
import NotificationCenter from '../NotificationCenter';

import EventsSportsView from '../EventsSports/EventsSportsView';
import EventCart from '../EventsSports/EventCart';
import SearchIndexPage from '../SearchIndexPage';
import ReferralPage from './ReferralPage';
import Subscriptionplans from './Subscriptionplans';
import AdminDashboardEnhanced from '../AdminDashboardEnhanced';
import TaxiConciergeView from '../TaxiConcierge/TaxiConciergeView';
import PVCXTokenView from '../PVCXTokenView';

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
      fetchProfileData();
      sendWelcomeNotificationIfNeeded();
    }
  }, [user?.id]);

  const sendWelcomeNotificationIfNeeded = async () => {
    if (!user?.id) return;

    try {
      // Check if user already has a welcome notification
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'welcome')
        .maybeSingle();

      // If no welcome notification exists, create one
      if (!existingNotification) {
        await supabase
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
          });

        console.log('Welcome notification sent to user:', user.id);
      }
    } catch (error) {
      console.error('Error sending welcome notification:', error);
      // Don't block dashboard if notification fails
    }
  };

  const fetchProfileData = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

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
        await createDefaultProfile();
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load profile data'
      });
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
          <div className="flex items-center gap-3">
            <Loader2 size={24} className="animate-spin text-gray-400" />
            <span className="text-gray-600">Loading profile data...</span>
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
                  setActiveCategory('wallet-nfts');
                }}
                className="w-full flex items-center gap-2 p-3 text-left hover:bg-white/20 rounded-lg transition-all duration-200 group"
              >
                <Wallet size={16} className="text-gray-600 group-hover:text-gray-900" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Wallet & NFTs</div>
                  <div className="text-xs text-gray-600">Manage your assets</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TokenizedAssetsGlassmorphic = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, profile } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  const [showDashboard, setShowDashboard] = useState(false);
  const [adventureSubmitting, setAdventureSubmitting] = useState(false);
  const [adventureSubmitSuccess, setAdventureSubmitSuccess] = useState(false);
  const [luxuryCarSubmitting, setLuxuryCarSubmitting] = useState(false);
  const [luxuryCarSubmitSuccess, setLuxuryCarSubmitSuccess] = useState(false);
  const { isConnected, address } = useAccount();

  const [activeCategory, setActiveCategory] = useState('overview');
  const [dashboardView, setDashboardView] = useState('overview');
  const [expandedMenus, setExpandedMenus] = useState({});
  const [bookingStep, setBookingStep] = useState(0);

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

  // Event Cart state
  const [eventCart, setEventCart] = useState([]);

  // Web Mode state
  const [webMode, setWebMode] = useState('rws'); // 'rws' or 'web3'
  const [isTransitioning, setIsTransitioning] = useState(false);

  // AI Chat state
  const [showChatOverview, setShowChatOverview] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [chatUsageCount, setChatUsageCount] = useState(0);
  const [chatLimit, setChatLimit] = useState(2); // Default for Explorer
  
  // SPV state
  const [userSPVs, setUserSPVs] = useState([]);
  const [loadingSPVs, setLoadingSPVs] = useState(false);

  // Tokenization state
  const [userTokenizations, setUserTokenizations] = useState([]);
  const [loadingTokenizations, setLoadingTokenizations] = useState(false);

  // Empty Legs state
  const [emptyLegs, setEmptyLegs] = useState([]);
  const [currentEmptyLegIndex, setCurrentEmptyLegIndex] = useState(0);
  const [loadingEmptyLegs, setLoadingEmptyLegs] = useState(false);

  // Events state
  const [events, setEvents] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [loadingEvents, setLoadingEvents] = useState(false);

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

  // Speech Recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [chatHistory, setChatHistory] = useState([]);

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
  const [jetsViewMode, setJetsViewMode] = useState('grid'); // 'grid' or 'tabs'

  // Helicopters state variables
  const [helicoptersData, setHelicoptersData] = useState([]);
  const [isLoadingHelicopters, setIsLoadingHelicopters] = useState(false);
  const [helicoptersFilter, setHelicoptersFilter] = useState('all');
  const [helicoptersSearch, setHelicoptersSearch] = useState('');
  const [helicoptersLocation, setHelicoptersLocation] = useState('');
  const [helicoptersMaxPrice, setHelicoptersMaxPrice] = useState('');
  const [currentHelicoptersPage, setCurrentHelicoptersPage] = useState(1);
  const helicoptersPerPage = 6;
  const [helicoptersViewMode, setHelicoptersViewMode] = useState('grid');
  const [selectedHelicopter, setSelectedHelicopter] = useState(null);
  const [showHelicopterDetail, setShowHelicopterDetail] = useState(false);
  const [currentHelicopterImageIndex, setCurrentHelicopterImageIndex] = useState(0);

  // Empty Legs state variables
  const [emptyLegsData, setEmptyLegsData] = useState([]);
  const [isLoadingEmptyLegs, setIsLoadingEmptyLegs] = useState(false);
  const [emptyLegsFilter, setEmptyLegsFilter] = useState('all');
  const [emptyLegsLocation, setEmptyLegsLocation] = useState('');
  const [emptyLegsDate, setEmptyLegsDate] = useState('');
  const [emptyLegsMaxPrice, setEmptyLegsMaxPrice] = useState('');
  const [currentEmptyLegsPage, setCurrentEmptyLegsPage] = useState(1);
  const emptyLegsPerPage = 6;
  const [emptyLegsViewMode, setEmptyLegsViewMode] = useState('grid');
  const [selectedEmptyLeg, setSelectedEmptyLeg] = useState(null);
  const [showEmptyLegDetail, setShowEmptyLegDetail] = useState(false);
  const [currentEmptyLegImageIndex, setCurrentEmptyLegImageIndex] = useState(0);

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
  const [adventuresViewMode, setAdventuresViewMode] = useState('grid');
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
  const [luxuryCarsViewMode, setLuxuryCarsViewMode] = useState('grid');
  const [selectedLuxuryCar, setSelectedLuxuryCar] = useState(null);
  const [showLuxuryCarDetail, setShowLuxuryCarDetail] = useState(false);
  const [currentLuxuryCarImageIndex, setCurrentLuxuryCarImageIndex] = useState(0);
  const [luxuryCarDetailTab, setLuxuryCarDetailTab] = useState('details'); // 'details' | 'specs' | 'pricing'

  // CO2 Projects state variables
  const [selectedCO2Project, setSelectedCO2Project] = useState(null);
  const [showCO2ProjectDetail, setShowCO2ProjectDetail] = useState(false);
  const [currentCO2ProjectImageIndex, setCurrentCO2ProjectImageIndex] = useState(0);
  const [co2ActiveTab, setCO2ActiveTab] = useState('details');

  // Blog post state
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

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      setShowDashboard(false);
    }
  }, [isAuthenticated]);

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
        // Determine if returning user or new user
        const isReturning = user.last_sign_in_at && user.created_at !== user.last_sign_in_at;
        const firstName = user.first_name || user.name || user.email?.split('@')[0] || 'User';

        // Show personalized toast
        const message = isReturning
          ? `Welcome back, ${firstName}!`
          : `Successfully logged in, ${firstName}!`;

        showToast(message, 'success');

        // Mark toast as shown for this session
        sessionStorage.setItem(toastShownKey, 'true');
      }

      // Trigger smooth dashboard animation
      setTimeout(() => {
        setShowDashboard(true);
      }, 300);
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

  // Fetch user's KYC status
  useEffect(() => {
    const fetchKycStatus = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('kyc_applications')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setKycStatus(data.status || 'not_started');
        } else {
          setKycStatus('not_started');
        }
      } catch (error) {
        console.error('Error fetching KYC status:', error);
        setKycStatus('not_started');
      }
    };

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

  // Fetch latest blog post based on webMode (Aviation for RWS, Web3 for Web3.0)
  useEffect(() => {
    const fetchLatestBlogPost = async () => {
      try {
        setBlogLoading(true);
        // Aviation category ID: 137, Web3 category ID: 131
        const categoryId = webMode === 'web3' ? '131' : '137';
        const response = await fetch(
          `https://www.privatecharterx.blog/wp-json/wp/v2/posts?_embed&per_page=1&orderby=date&order=desc&categories=${categoryId}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const posts = await response.json();
          if (posts && posts.length > 0) {
            const post = posts[0];
            setLatestBlogPost({
              title: post.title.rendered.replace(/<[^>]*>/g, ''),
              link: `https://www.privatecharterx.blog/${post.slug}`,
              date: post.date,
            });
          }
        }
      } catch (error) {
        console.log('Failed to fetch blog post:', error);
      } finally {
        setBlogLoading(false);
      }
    };

    fetchLatestBlogPost();
  }, [webMode]);

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

  // Check for dashboard tab from user menu navigation
  useEffect(() => {
    const dashboardTab = sessionStorage.getItem('dashboardTab');
    if (dashboardTab) {
      setActiveCategory('dashboard');
      setDashboardView(dashboardTab);
      sessionStorage.removeItem('dashboardTab'); // Clear after using
    }
  }, []);

  // Check for secret admin route
  useEffect(() => {
    const checkAdminRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      // Secret admin path: /x8833gulfstream66admin or #x8833gulfstream66admin
      if (path.includes('x8833gulfstream66admin') || hash.includes('x8833gulfstream66admin')) {
        // Verify user is admin
        if (user && (user.email === 'admin@domain.com' || profile?.role === 'admin' || user?.role === 'admin')) {
          setActiveCategory('admin-dashboard');
          // Clean URL without reloading
          window.history.replaceState({}, document.title, window.location.pathname.replace('/x8833gulfstream66admin', ''));
        } else {
          console.log('Unauthorized admin access attempt');
        }
      }
    };

    checkAdminRoute();

    // Listen for hash changes
    window.addEventListener('hashchange', checkAdminRoute);
    return () => window.removeEventListener('hashchange', checkAdminRoute);
  }, [user, profile]);

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

  // Fetch user's tokenization requests
  const fetchUserTokenizations = async () => {
    if (!user?.id) return;

    setLoadingTokenizations(true);
    try {
      const { data, error } = await supabase
        .from('tokenization_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setUserTokenizations(data || []);
    } catch (error) {
      console.error('Error fetching tokenizations:', error);
      setUserTokenizations([]);
    } finally {
      setLoadingTokenizations(false);
    }
  };

  // Fetch events for rotating display from Events API (Ticketmaster & Eventbrite)
  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      // Use user's city from profile, fallback to Miami, then New York
      const userCity = profileData?.city || 'Miami';
      console.log('🎫 Fetching events from Ticketmaster and Eventbrite for:', userCity);

      // Fetch upcoming events from Ticketmaster and Eventbrite via eventsService
      const now = new Date();
      const events = await eventsService.searchEvents({
        startDate: now.toISOString(),
        city: userCity,
        size: 10
      });

      console.log(`✅ Events fetched from Events API (${userCity}):`, events?.length || 0);
      if (events && events.length > 0) {
        console.log('📍 First event:', events[0]);
      } else {
        console.warn(`⚠️ No events returned from API for ${userCity}`);

        // If no events found for user's city, try New York as fallback
        if (userCity !== 'New York' && userCity !== 'Miami') {
          console.log('🔄 Trying New York as fallback...');
          const fallbackEvents = await eventsService.searchEvents({
            startDate: now.toISOString(),
            city: 'New York',
            size: 10
          });

          if (fallbackEvents && fallbackEvents.length > 0) {
            console.log('✅ Found events in New York:', fallbackEvents.length);
            const transformedFallback = (fallbackEvents || []).map(event => ({
              id: event.id,
              name: event.name,
              event_name: event.name,
              description: event.description,
              date: event.date,
              event_date: event.date,
              location: event.venue?.city || event.venue?.name || 'TBA',
              venue: event.venue,
              category: event.category,
              subcategory: event.subcategory,
              price_min: event.price?.min,
              price_max: event.price?.max,
              currency: event.price?.currency,
              is_free: event.price?.min === 0 && event.price?.max === 0,
              status: event.status,
              url: event.url,
              image: event.image,
              platform: event.platform,
              source: event.platform
            }));
            setEvents(transformedFallback);
            setLoadingEvents(false);
            return;
          }
        }
      }

      // The eventsService already returns normalized events with the correct format
      // Just need to ensure compatibility with our display format
      const transformedEvents = (events || []).map(event => ({
        id: event.id,
        name: event.name,
        event_name: event.name,
        description: event.description,
        date: event.date,
        event_date: event.date,
        location: event.venue?.city || event.venue?.name || 'TBA',
        venue: event.venue,
        category: event.category,
        subcategory: event.subcategory,
        price_min: event.price?.min,
        price_max: event.price?.max,
        currency: event.price?.currency,
        is_free: event.price?.min === 0 && event.price?.max === 0,
        status: event.status,
        url: event.url,
        image: event.image,
        platform: event.platform,
        source: event.platform // 'ticketmaster' or 'eventbrite'
      }));

      console.log('🔄 Transformed events:', transformedEvents.length);
      setEvents(transformedEvents);
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      console.error('Error details:', error.message, error.stack);
      setEvents([]);
    } finally {
      setLoadingEvents(false);
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
        .from('user_pvcx_balances')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setPvcxBalance(parseFloat(data.balance) || 0);
      } else if (!error || error.code === 'PGRST116') {
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

  // Load SPVs when viewing My SPVs page
  useEffect(() => {
    if (activeCategory === 'my-spvs' && user?.id) {
      fetchUserSPVs();
    }
  }, [activeCategory, user?.id]);

  // Load tokenizations when viewing My Tokenized Assets page
  useEffect(() => {
    if (activeCategory === 'my-tokenized-assets' && user?.id) {
      fetchUserTokenizations();
    }
  }, [activeCategory, user?.id]);

  // Fetch marketplace tokenized assets on mount (for Web3 overview display)
  useEffect(() => {
    fetchTokenizedAssets();
  }, []);

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

  // Fetch events on mount and set up rotation
  useEffect(() => {
    fetchEvents();

    // Rotate events every 5 minutes (300000ms)
    const rotationInterval = setInterval(() => {
      setCurrentEventIndex((prevIndex) => {
        if (events.length === 0) return 0;
        return (prevIndex + 1) % events.length;
      });
    }, 300000); // 5 minutes

    return () => clearInterval(rotationInterval);
  }, [events.length]);

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
              totalPrice: heli.price ? `€${parseFloat(heli.price).toLocaleString()}/hr` : 'Request Quote',
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
          const transformedData = (data || []).map(leg => ({
            id: leg.id,
            name: `${leg.from_city || leg.from} → ${leg.to_city || leg.to}`,
            location: `${leg.from_iata} → ${leg.to_iata}`,
            category: leg.category || leg.aircraft_type,
            totalPrice: `$${leg.price?.toLocaleString() || 'N/A'}`,
            capacity: `${leg.capacity || leg.pax || 'N/A'} pax`,
            departureDate: new Date(leg.departure_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            image: leg.image_url || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800',
            isEmptyLeg: true,
            isFreeWithNFT: leg.price && leg.price <= 1500,
            rawPrice: leg.price,
            rawData: leg
          }));
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

  const handleLogout = useCallback(() => {
    console.log('User logged out');
  }, []);

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
        const transformedData = (data || []).map(offer => ({
          id: offer.id,
          name: offer.title,
          location: offer.destination || offer.origin,
          category: offer.package_type || 'Adventure',
          totalPrice: offer.price_on_request ? 'On Request' : `€${offer.price?.toLocaleString() || 'N/A'}`,
          yield: offer.duration || 'Flexible',
          period: offer.difficulty_level || 'All levels',
          image: offer.image_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
          isAdventure: true,
          rawPrice: offer.price,
          isFreeWithNFT: offer.price && offer.price <= 1500,
          rawData: offer
        }));
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
          totalPrice: car.price_per_day ? `€${Number(car.price_per_day).toLocaleString()}/day` : 'On Request',
          yield: car.price_per_hour ? `€${Number(car.price_per_hour).toLocaleString()}/hr` : 'On Request',
          period: car.price_per_week ? `€${Number(car.price_per_week).toLocaleString()}/wk` : 'TO BE DISCUSSED',
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

  // Handle Web Mode switching with transition
  const [targetMode, setTargetMode] = useState(null);

  const handleWebModeSwitch = (mode) => {
    if (mode === webMode) return;

    setTargetMode(mode);
    setIsTransitioning(true);

    // Quick transition: 400ms total
    setTimeout(() => {
      setWebMode(mode);
      // Always reset to overview page when switching modes
      setActiveCategory('overview');
      setTimeout(() => {
        setIsTransitioning(false);
        setTargetMode(null);
      }, 200);
    }, 200);
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
  const rwsCategoryMenu = [
    { id: 'jets', label: 'Jets', icon: Plane, category: 'jets' },
    { id: 'helicopter', label: 'Helis', icon: Zap, category: 'helicopter' },
    { id: 'empty-legs', label: 'Empty Legs', icon: MapPin, category: 'empty-legs' },
    { id: 'adventures', label: 'Adventures', icon: Mountain, category: 'adventures' },
    { id: 'assets', label: 'Events & Sports', icon: Calendar, category: 'assets' },
    { id: 'luxury-cars', label: 'Luxury Cars', icon: Car, category: 'luxury-cars' },
    { id: 'ground-transport', label: 'Taxi/Concierge', icon: Car, category: 'ground-transport' },
    { id: 'community', label: 'Community', icon: MessageCircle, category: 'community' },
    // { id: 'tailored-services', label: 'AI Travel Designer', icon: Compass, category: 'chat' },
    { id: 'co2-saf', label: 'CO₂/SAF', icon: Leaf, category: 'co2-saf' }
  ];

  // Web3 Category menu - for Crypto/Blockchain services
  const web3CategoryMenu = [
    { id: 'assets', label: 'My DeFi Assets', icon: Sparkles, category: 'assets' },
    { id: 'marketplace', label: 'Marketplace', icon: Package, category: 'marketplace' },
    { id: 'p2p-trading', label: 'P2P Trading', icon: Share2, category: 'p2p-trading' },
    { id: 'swap', label: 'Swap', icon: ArrowLeft, category: 'swap' },
    { id: 'community', label: 'Community', icon: MessageCircle, category: 'community' },
    { id: 'dao', label: 'DAO Governance', icon: Users, category: 'dao' },
    { id: 'nft-marketplace', label: 'NFT Marketplace', icon: Shield, category: 'nft-marketplace' },
    { id: 'launchpad', label: 'Launchpad', icon: Zap, category: 'launchpad' }
  ];

  // Active category menu based on webMode
  const categoryMenu = webMode === 'rws' ? rwsCategoryMenu : web3CategoryMenu;

  // User menu - for sidebar navigation (dashboard-related items)
  const userMenuBase = [
    { id: 'overview', label: 'Overview', icon: Home, category: 'overview' },
    { id: 'profile', label: 'Profile', icon: User, category: 'dashboard', dashboardTab: 'profile' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, category: 'calendar' },
    { id: 'requests', label: 'My Requests', icon: FolderOpen, category: 'requests' },
    { id: 'my-launches', label: 'My Launches', icon: Rocket, category: 'my-launches', web3Only: true },
    // { id: 'chat-requests', label: 'Chat Requests', icon: MessageSquare, category: 'chat-requests' },
    // { id: 'subscription', label: 'Subscription', icon: Crown, category: 'subscription' },
    // { id: 'referral', label: 'Referral Program', icon: Gift, category: 'referral' },
    { id: 'transactions', label: 'Transactions', icon: Award, category: 'transactions', web3Only: true },
    { id: 'tokenized-assets', label: 'My DeFi Assets', icon: Sparkles, category: 'assets', web3Only: true },
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
    { id: 'co2-certificates', label: 'CO2 Certificates', icon: Leaf, category: 'co2-certificates' },
    { id: 'chat-support', label: 'Chat Support', icon: MessageSquare, category: 'chat-support' },
    { id: 'nft-marketplace', label: 'NFT Marketplace', icon: Shield, category: 'nft-marketplace', web3Only: true },
    { id: 'kyc', label: 'KYC Verification', icon: Shield, category: 'kyc-verification' }
  ];

  // Filter userMenu based on webMode
  const userMenu = userMenuBase.filter(item => {
    if (item.rwsOnly && webMode !== 'rws') return false;
    if (item.web3Only && webMode !== 'web3') return false;
    return true;
  });

  const recentActivities = [
    { id: 1, title: 'Gulfstream G650 Charter', time: '23 hours' },
    { id: 2, title: 'Empty Leg Zurich-London', time: '2 days ago' },
    { id: 3, title: 'CO2 Certificate Purchase', time: '3 weeks ago' }
  ];

  return (
    <div className="min-h-screen font-['DM_Sans'] relative">
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
      <div className="relative z-10 flex h-screen items-center justify-center p-8">
        {/* COMPLETE FLOATING GLASSMORPHIC CONTAINER - Sidebar + Content als ein Stück */}
        <div className={`relative flex w-full max-w-7xl h-[90vh] rounded-3xl shadow-2xl border overflow-hidden transition-all duration-700 ease-out ${
          showDashboard ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } ${
          webMode === 'web3'
            ? 'bg-white/30 backdrop-blur-3xl border-white/40'
            : 'bg-white/80 backdrop-blur-3xl border-gray-200/80'
        }`} style={{ backdropFilter: webMode === 'web3' ? 'blur(60px) saturate(120%)' : 'blur(40px) saturate(180%)' }}>
          {/* Glassmorphic Sidebar - EXPANDABLE ON HOVER */}
          <aside className={`group w-16 hover:w-60 border-r flex flex-col py-4 transition-all duration-300 ease-in-out overflow-hidden ${
            webMode === 'web3'
              ? 'border-white/30'
              : 'bg-white/70 border-gray-200/70'
          }`} style={webMode === 'web3' ? { backgroundColor: '#efefef' } : { backdropFilter: 'blur(20px) saturate(180%)' }}>
          {/* Logo */}
          <div className="mb-6 px-2 group-hover:px-4 transition-all duration-300">
            <div className="w-12 h-12 group-hover:w-auto flex items-center justify-center overflow-hidden">
              {webMode === 'web3' ? (
                <>
                  {/* Animated logo when collapsed - Web3.0 only */}
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-12 w-12 object-contain group-hover:hidden"
                  >
                    <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/videoExport-2025-10-19@14-08-49.871-540x540@60fps.mp4" type="video/mp4" />
                  </video>
                  {/* Full logo when expanded */}
                  <img
                    src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_Logo_written-removebg-preview.png"
                    alt="PrivateCharterX"
                    className="hidden group-hover:block h-12 w-auto object-contain"
                  />
                </>
              ) : (
                <>
                  {/* Static X icon when collapsed - RWS mode */}
                  <img
                    src="https://i.imgur.com/iu42DU1.png"
                    alt="PrivateCharterX"
                    className="h-12 w-12 object-contain group-hover:hidden"
                  />
                  {/* Full logo when expanded */}
                  <img
                    src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_Logo_written-removebg-preview.png"
                    alt="PrivateCharterX"
                    className="hidden group-hover:block h-12 w-auto object-contain"
                  />
                </>
              )}
            </div>
          </div>

          {/* AI Chat Section - Compact Frame */}
          <div className="px-2 group-hover:px-4 mb-4 transition-all duration-300">
            {/* Frame Container */}
            <div className={`border rounded-lg p-2 transition-all duration-300 backdrop-blur-xl ${
              webMode === 'web3'
                ? 'bg-white/20 border-gray-300/50'
                : 'bg-gray-200/40 border-gray-300/60'
            }`}>
              {/* New Chat Button */}
              <button
                onClick={() => {
                  setActiveChat('new');
                  setActiveCategory('chat');
                  setAiChatQuery(''); // Clear any existing query
                }}
                className={`w-full h-8 rounded-md flex items-center justify-center group-hover:justify-start group-hover:gap-2 group-hover:px-3 border transition-all duration-300 mb-2 backdrop-blur-xl ${
                  webMode === 'web3'
                    ? 'bg-white/30 hover:bg-white/40 text-gray-900 border-gray-300/50'
                    : 'bg-white/50 hover:bg-white/70 text-gray-800 border-gray-300/50'
                }`}
                title="New Chat"
              >
                <Plus size={14} />
                <span className="hidden group-hover:inline-block text-xs font-medium whitespace-nowrap">New Chat</span>
              </button>

              {/* Latest Chat + History */}
              <div className="space-y-1 overflow-x-hidden">
                {/* Latest Chat - HIDDEN */}
                {/* {chatHistory.length > 0 && (
                  <button
                    onClick={() => {
                      setActiveChat(chatHistory[0].id);
                      setActiveCategory('chat');
                    }}
                    className={`w-full h-8 flex items-center justify-center group-hover:justify-start group-hover:gap-2 group-hover:px-2 rounded-md transition-all duration-300 backdrop-blur-xl ${
                      webMode === 'web3'
                        ? activeChat === chatHistory[0].id && activeCategory === 'chat'
                          ? 'bg-white/30 text-gray-900'
                          : 'text-gray-800 hover:bg-white/20'
                        : activeChat === chatHistory[0].id && activeCategory === 'chat'
                        ? 'bg-white/60 text-gray-900'
                        : 'text-gray-700 hover:bg-white/30'
                    }`}
                    title={chatHistory[0].title}
                  >
                    <MessageSquare size={12} className="flex-shrink-0" />
                    <span className="hidden group-hover:inline-block text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                      {chatHistory[0].title}
                    </span>
                  </button>
                )} */}

                {/* History Button */}
                <button
                  onClick={() => {
                    setActiveCategory('chat-history');
                  }}
                  className={`w-full h-8 flex items-center justify-center group-hover:justify-start group-hover:gap-2 group-hover:px-2 rounded-md transition-all duration-300 backdrop-blur-xl ${
                    webMode === 'web3'
                      ? activeCategory === 'chat-history'
                        ? 'bg-white/30 text-gray-900'
                        : 'text-gray-800 hover:bg-white/20'
                      : activeCategory === 'chat-history'
                        ? 'bg-white/60 text-gray-900'
                        : 'text-gray-600 hover:bg-white/30'
                  }`}
                  title="Chat History"
                >
                  <Calendar size={12} className="flex-shrink-0" />
                  <span className="hidden group-hover:inline-block text-xs font-medium">History</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Menu - Expandable (USER MENU ONLY) */}
          <nav className="flex-1 overflow-y-auto space-y-2 px-2 group-hover:px-4 transition-all duration-300">
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
                      if (hasSubmenu) {
                        setExpandedMenus(prev => ({
                          ...prev,
                          [item.id]: !prev[item.id]
                        }));
                      } else {
                        setActiveCategory(item.category);
                        if (item.dashboardTab) {
                          setDashboardView(item.dashboardTab);
                        }
                      }
                    }}
                    className={`w-10 group-hover:w-full h-8 flex items-center justify-center group-hover:justify-between group-hover:gap-2 group-hover:px-2 rounded-lg transition-all duration-300 backdrop-blur-xl ${
                      webMode === 'web3'
                        ? isActive || isExpanded
                          ? 'bg-white/30 text-gray-900 shadow-lg'
                          : 'text-gray-800 hover:bg-white/20'
                        : isActive || isExpanded
                        ? 'bg-white/20 text-gray-800 shadow-lg'
                        : 'text-gray-600 hover:bg-white/10'
                    }`}
                    style={isActive || isExpanded ? { backdropFilter: 'blur(10px)' } : {}}
                    title={item.label}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon size={12} className="flex-shrink-0" />
                      <span className="hidden group-hover:inline-block text-xs whitespace-nowrap">{item.label}</span>
                    </div>
                    {hasSubmenu && (
                      <ChevronDown
                        size={10}
                        className={`hidden group-hover:inline-block transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    )}
                  </button>

                  {/* Submenu */}
                  {hasSubmenu && isExpanded && (
                    <div className="hidden group-hover:block ml-4 mt-1 space-y-1 pl-2 border-l border-white/20">
                      {item.submenu.map((subItem) => {
                        const isSubActive = activeCategory === subItem.category;
                        return (
                          <button
                            key={subItem.id}
                            onClick={() => {
                              setActiveCategory(subItem.category);
                            }}
                            className={`w-full h-7 flex items-center gap-2 px-2 rounded-lg transition-all duration-300 backdrop-blur-xl text-xs ${
                              webMode === 'web3'
                                ? isSubActive
                                  ? 'bg-white/20 text-gray-900'
                                  : 'text-gray-700 hover:bg-white/10'
                                : isSubActive
                                ? 'bg-white/15 text-gray-800'
                                : 'text-gray-600 hover:bg-white/5'
                            }`}
                            title={subItem.label}
                          >
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
          </nav>

          {/* Bottom Section - Expandable */}
          <div className="mt-auto pt-4 border-t border-gray-600/30 transition-all duration-300">
            {/* User Profile - Expandable with username and membership tier */}
            <div className="relative px-2 group-hover:px-4 transition-all duration-300">
              <button
                onClick={() => {
                  setActiveView('subscription');
                }}
                className="w-10 group-hover:w-full h-10 rounded-full group-hover:rounded-lg flex items-center justify-center group-hover:justify-start group-hover:gap-3 group-hover:px-2 group-hover:bg-white/10 hover:bg-white/5 text-xs font-semibold transition-all duration-300"
                title={user?.email?.split('@')[0] || 'User'}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-white">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden group-hover:flex flex-col items-start flex-1 text-left">
                  <span className="text-xs font-semibold text-gray-900 truncate max-w-[120px]">
                    {user?.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="text-[10px] text-gray-600 capitalize">
                    {subscriptionTier === 'explorer' ? 'Free' : subscriptionTier}
                  </span>
                </div>
                <ChevronRight size={14} className="hidden group-hover:block text-gray-400 flex-shrink-0" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area - PART OF SAME CONTAINER */}
        <main className={`flex-1 overflow-y-auto flex flex-col ${webMode === 'web3' ? 'bg-white/10' : ''}`}>
          {/* HEADER - Only greeting and icons - HIDDEN IN CHAT WITH CSS */}
          <div className={`backdrop-blur-xl border-b sticky top-0 z-50 ${
            activeCategory === 'chat' ? 'hidden' : ''
          } ${
            webMode === 'web3'
              ? 'bg-white/25 border-white/30'
              : 'bg-white/30 border-gray-200/50'
          }`}>
            <div className="flex justify-between items-center px-8 py-3">
              {/* Dynamic Greeting */}
              <div className="flex items-center gap-4">
                <span className={`text-lg font-semibold ${webMode === 'web3' ? 'text-gray-900' : 'text-gray-800'}`}>
                  Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.email?.split('@')[0] || 'User'}
                </span>
                
                {/* Chat Usage Counter - HIDDEN */}
                {/* <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-xl border ${webMode === 'web3' ? 'bg-white/30 border-gray-300/50' : 'bg-white/35 border-gray-300/50'}`}>
                  <MessageSquare size={14} className={webMode === 'web3' ? 'text-gray-800' : 'text-gray-700'} />
                  <span className={`text-xs font-semibold ${webMode === 'web3' ? 'text-gray-900' : 'text-gray-800'}`}>
                    {chatUsageCount}/{chatLimit === Infinity ? '∞' : chatLimit}
                  </span>
                  {chatUsageCount >= chatLimit && chatLimit !== Infinity && (
                    <span className="text-[10px] text-red-600 font-medium">Limit reached</span>
                  )}
                </div> */}

                {/* Web Mode Switcher - Adapts to mode */}
                <div className={`flex items-center gap-2 border rounded-full p-1 shadow-sm backdrop-blur-xl ${
                  webMode === 'web3'
                    ? 'bg-white/30 border-gray-300/50'
                    : 'bg-white/35 border-gray-300/50'
                }`}>
                  <button
                    onClick={() => handleWebModeSwitch('rws')}
                    disabled={isTransitioning}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                      webMode === 'rws'
                        ? 'bg-black text-white shadow-md'
                        : webMode === 'web3'
                        ? 'text-gray-700 hover:text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    } ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    RWS
                  </button>
                  <button
                    onClick={() => handleWebModeSwitch('web3')}
                    disabled={isTransitioning}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                      webMode === 'web3'
                        ? 'bg-black text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900'
                    } ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Web 3.0
                  </button>
                </div>

              </div>

              {/* Right Icons - Adapt to mode */}
              <div className="flex items-center gap-1.5">
                {/* PVCX Balance Widget - RWS: switches to Web3.0, Web3.0: opens token page */}
                <button
                  onClick={() => {
                    if (webMode === 'rws') {
                      handleWebModeSwitch('web3');
                    } else {
                      setActiveCategory('pvcx-token');
                    }
                  }}
                  className={`px-3 py-1.5 backdrop-blur-xl rounded-lg flex items-center gap-1.5 transition-all duration-200 border ${
                    webMode === 'web3'
                      ? 'bg-white/40 hover:bg-white/50 text-gray-800 border-gray-300/50'
                      : 'bg-white/35 hover:bg-white/40 text-gray-700 border-gray-300/50'
                  }`}
                  title={webMode === 'rws' ? 'Switch to Web3.0 for $PVCX Token' : '$PVCX Token Balance'}
                >
                  <img
                    src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/PaymentIcons/Title-removebg-preview.png"
                    alt="PVCX"
                    className="w-4 h-4 object-contain"
                  />
                  <span className="text-xs font-semibold">
                    {loadingPvcxBalance ? '...' : pvcxBalance.toFixed(3)}
                  </span>
                  <span className="text-xs text-gray-500">$PVCX</span>
                </button>

                {/* Tokenize/Charter Button - RWS: Charter, Web3.0: Tokenize */}
                <button
                  onClick={() => {
                    if (webMode === 'rws') {
                      setActiveCategory('private-jet');
                    } else {
                      setActiveCategory('tokenization');
                    }
                  }}
                  className={`h-7 backdrop-blur-xl rounded-lg flex items-center justify-center gap-1 px-3 transition-all duration-200 border ${
                    webMode === 'web3'
                      ? 'bg-black hover:bg-gray-800 text-white border-gray-800'
                      : 'bg-gray-800 hover:bg-black text-white border-gray-700'
                  }`}
                  title={webMode === 'rws' ? 'Charter a Jet' : 'Tokenize Asset'}
                >
                  <Plus size={14} />
                  <span className="text-xs font-medium">{webMode === 'rws' ? 'Charter' : 'Tokenize'}</span>
                </button>

                {/* Favorites/Heart Icon - Only in RWS mode */}
                {webMode !== 'web3' && (
                  <button
                    onClick={() => {
                      console.log('Favourites icon clicked');
                      setActiveCategory('favourites');
                    }}
                    className="relative w-7 h-7 backdrop-blur-xl rounded-lg flex items-center justify-center transition-all duration-200 border bg-white/35 hover:bg-white/40 text-gray-700 border-gray-300/50"
                    title="Favourites"
                  >
                    <Heart size={14} className={activeCategory === 'favourites' ? 'fill-red-500 text-red-500' : ''} />
                    {favorites.length > 0 && (
                      <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-[8px] text-white font-medium">{favorites.length}</span>
                      </div>
                    )}
                  </button>
                )}

                {/* Notifications Bell - Real-time */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative w-7 h-7 backdrop-blur-xl rounded-lg flex items-center justify-center transition-all duration-200 border ${
                      webMode === 'web3'
                        ? 'bg-white/40 hover:bg-white/50 text-gray-800 border-gray-300/50'
                        : 'bg-white/35 hover:bg-white/40 text-gray-700 border-gray-300/50'
                    }`}
                  >
                    <Bell size={14} />
                    {useNotificationCount(user?.id) > 0 && (
                      <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-[8px] text-white font-medium">
                          {useNotificationCount(user?.id) > 9 ? '9+' : useNotificationCount(user?.id)}
                        </span>
                      </div>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  <NotificationBell
                    isOpen={showNotifications}
                    setIsOpen={setShowNotifications}
                    onNavigate={(url) => {
                      // Handle internal navigation from notifications
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

                {/* Settings Icon */}
                <button
                  onClick={() => {
                    setActiveCategory('settings');
                    setShowSettings(false);
                  }}
                  className={`w-7 h-7 backdrop-blur-xl rounded-lg flex items-center justify-center transition-all duration-200 border ${
                    webMode === 'web3'
                      ? 'bg-white/40 hover:bg-white/50 text-gray-800 border-gray-300/50'
                      : 'bg-white/35 hover:bg-white/40 text-gray-700 border-gray-300/50'
                  }`}
                >
                  <Settings size={14} />
                </button>

                {/* User Profile - Icon only in Web3.0, with details in RWS */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setActiveCategory('dashboard');
                      setDashboardView('profile');
                    }}
                    className={`flex items-center gap-2 backdrop-blur-xl rounded-lg transition-all duration-200 border ${
                      webMode === 'web3'
                        ? 'w-7 h-7 justify-center bg-white/40 hover:bg-white/50 text-gray-800 border-gray-300/50'
                        : 'px-2 py-1 bg-white/35 hover:bg-white/40 text-gray-700 border-gray-300/50'
                    }`}
                  >
                    <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center text-white text-xs font-medium">
                      {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                    {webMode !== 'web3' && (
                      <div className="hidden sm:block text-left">
                        <div className="text-xs font-medium">{user?.name || 'User'}</div>
                        <div className="text-[10px] text-gray-500 truncate max-w-20">{user?.email}</div>
                      </div>
                    )}
                  </button>
                </div>

                {/* Wallet Connection Button - Only show in Web3 mode */}
                {webMode === 'web3' && (
                  <div className="relative">
                    <WalletMenu onConnect={handleWalletConnect} iconOnly={true} />
                    {isConnected && (
                      <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white pointer-events-none z-10"></div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Navigation - Adapts to mode - HIDDEN IN CHAT */}
          <div className={`flex items-center gap-2 px-8 py-3 overflow-x-auto border-b ${
            activeCategory === 'chat' ? 'hidden' : ''
          } ${
            webMode === 'web3' ? 'border-white/30' : 'border-gray-200/50'
          }`}>
            {categoryMenu
              .filter(item => {
                // Hide "My DeFi Assets" bubble in Web3.0 mode (keep in sidebar only)
                if (webMode === 'web3' && item.id === 'assets') return false;
                return true;
              })
              .map((item) => {
              const isActive = activeCategory === item.category;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveCategory(item.category);
                    setShowJetDetail(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border backdrop-blur-xl ${
                    webMode === 'web3'
                      ? isActive
                        ? 'bg-black text-white border-gray-800'
                        : 'bg-white/30 text-gray-800 border-gray-300/50 hover:bg-white/40'
                      : isActive
                      ? 'bg-white text-gray-900 border-gray-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  <item.icon size={14} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* CONTENT AREA */}
          <div className={`flex-1 ${activeCategory === 'chat' ? 'overflow-hidden' : 'overflow-y-auto'} ${activeCategory === 'ground-transport' || activeCategory === 'chat' ? 'p-0' : 'p-8'}`}>

          {/* Transition Loader - Professional Minimalistic Animation */}
          {isTransitioning && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-md">
              <div className="relative flex flex-col items-center gap-8">
                {/* Minimalist spinner - single rotating arc */}
                <div className="relative w-16 h-16">
                  {/* Subtle rotating arc */}
                  <svg className="w-16 h-16 animate-spin" style={{ animationDuration: '1s' }} viewBox="0 0 50 50">
                    <circle
                      cx="25"
                      cy="25"
                      r="20"
                      fill="none"
                      stroke="#000000"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="80, 200"
                      opacity="0.3"
                    />
                  </svg>
                </div>

                {/* Simple text - no gradient, no animation */}
                <div className="flex flex-col items-center gap-3">
                  <div className="text-sm font-medium text-gray-900 tracking-wide">
                    {targetMode === 'web3' ? 'Switching to Web 3.0' : 'Switching to Real World Services'}
                  </div>
                </div>
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

          {/* Profile Overview View - Enhanced Analytics Dashboard */}
          {!isTransitioning && activeCategory === 'dashboard' && dashboardView === 'profile' && (
            <div className="w-full h-full overflow-y-auto">
              <ProfileOverviewEnhanced />
            </div>
          )}

          {/* My Requests View */}
          {!isTransitioning && activeCategory === 'requests' && (
            <div className="w-full h-full overflow-y-auto">
              <div className="mb-6 px-4 pt-4">
                <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter font-['DM_Sans']">My Requests</h2>
              </div>
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
                <Dashboard initialTab="requests" />
              </div>
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

          {/* Subscription Management View */}
          {!isTransitioning && activeCategory === 'subscription' && (
            <div className="w-full h-full overflow-y-auto">
              <Subscriptionplans />
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

          {/* Event Cart View - HIDDEN */}
          {/* {!isTransitioning && activeCategory === 'cart' && (
            <div className="w-full h-full overflow-y-auto">
              <EventCart cart={eventCart} setCart={setEventCart} />
            </div>
          )} */}

          {/* Tokenized Assets View - User's Portfolio (Removed old Dashboard, now handled by 'assets' category) */}

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

          {/* Chat Support View */}
          {!isTransitioning && activeCategory === 'chat-support' && (
            <div className="w-full h-full overflow-y-auto">
              <SupportTicketsPage />
            </div>
          )}

          {/* AI Chat Coming Soon View */}
          {!isTransitioning && activeCategory === 'ai-chat-coming-soon' && (
            <div className="w-full h-full overflow-y-auto">
              <AIChatComingSoon />
            </div>
          )}

          {/* Wallet & NFTs View - Show NFTsPage */}
          {!isTransitioning && activeCategory === 'wallet-nfts' && (
            <div className="w-full h-full overflow-y-auto">
              <NFTsPage />
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

          {/* Overview Section (Chat Interface) */}
          {!isTransitioning && activeCategory === 'overview' && (
            <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
              {/* Spacer to keep content centered */}
              <div className="mb-8"></div>
              <div className="flex-1 flex flex-col">
                {/* RWS Mode Only: Search Input & Quick Action Buttons */}
                {webMode === 'rws' && (
                  <>
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
                          } else if (item.action === 'chat') {
                            // Never open travel concierge - show contact instead
                            // This should not happen, but just in case
                            setActiveCategory('overview');
                          } else {
                            // Navigate to category
                            setActiveCategory(item.action);
                          }
                        }}
                        onOpenAIChat={(query) => {
                          // Open AI chat with the search query
                          setActiveCategory('chat');
                          setAiChatQuery(query);
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
                  <div className="flex items-center gap-2 px-1">
                    <ChevronRight size={12} className={webMode === 'web3' ? 'text-gray-700' : 'text-gray-400'} />
                    <h3 className={`text-xs font-medium ${webMode === 'web3' ? 'text-gray-800' : 'text-gray-600'}`}>
                      {webMode === 'web3' ? 'Tokenized Assets' : 'Your recent chats'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
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

                        {/* Charter Aviation Card (Helicopter/Jet) */}
                        <button
                          onClick={() => setActiveCategory('private-jet')}
                          className="border rounded-xl p-3 text-left transition-all group bg-white/35 hover:bg-white/40 border-gray-300/50 relative overflow-hidden"
                          style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="mb-2">
                                <span className="text-[10px] font-bold font-['DM_Sans'] text-gray-500 uppercase tracking-wider">Aviation</span>
                              </div>
                              <h4 className="text-xs font-medium mb-0.5 font-['DM_Sans'] text-gray-800 transition-all duration-500">
                                {currentAviationType === 0 ? 'Charter a Helicopter' : 'Charter a Jet'}
                              </h4>
                              <p className="text-[10px] font-['DM_Sans'] text-gray-600">
                                Book your private flight
                              </p>
                            </div>
                            <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden relative">
                              <img
                                src={currentAviationType === 0
                                  ? "https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/%20%20(3).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi8gICgzKS5wbmciLCJpYXQiOjE3NjA5NjIwMDcsImV4cCI6MTc5MjQ5ODAwN30.7yFk178KYOXi874bcWv4v8JBczbebcQFgpfDV0MH_MI"
                                  : "https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/serviceImagesVector/pngtree-sleek-private-jet-in-flight-ready-for-business-travel-png-image_20073193.png"
                                }
                                alt={currentAviationType === 0 ? "Helicopter" : "Private Jet"}
                                className="w-full h-full object-contain group-hover:scale-110 transition-all duration-500"
                                key={currentAviationType}
                              />
                            </div>
                          </div>
                        </button>

                        {/* Ongoing Booking Card (Taxi/Concierge or Empty Leg) */}
                        <button
                          onClick={() => setActiveCategory('favourites')}
                          className="border rounded-xl p-3 text-left transition-all group bg-white/35 hover:bg-white/40 border-gray-300/50"
                          style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                        >
                          <div className="mb-2">
                            <span className="text-[10px] font-bold font-['DM_Sans'] text-gray-500 uppercase tracking-wider">
                              Upcoming Ride
                            </span>
                          </div>
                          {loadingBooking ? (
                            <>
                              <h4 className="text-xs font-medium mb-0.5 font-['DM_Sans'] text-gray-800">Loading...</h4>
                              <p className="text-[10px] font-['DM_Sans'] text-gray-600">Checking bookings</p>
                            </>
                          ) : ongoingBooking ? (
                            <>
                              <h4 className="text-xs font-medium mb-0.5 font-['DM_Sans'] text-gray-800 line-clamp-1">
                                {ongoingBooking.type === 'taxi_concierge'
                                  ? `${ongoingBooking.data?.carType?.name || 'Taxi'} ${ongoingBooking.data?.bookNow ? '(Now)' : ''}`
                                  : ongoingBooking.type === 'empty_leg_booking'
                                  ? `${ongoingBooking.data?.from || 'N/A'} → ${ongoingBooking.data?.to || 'N/A'}`
                                  : 'Booking'}
                              </h4>
                              <p className="text-[10px] font-['DM_Sans'] text-gray-600 mb-2">
                                {ongoingBooking.type === 'taxi_concierge'
                                  ? `${ongoingBooking.data?.pickupDate ? new Date(ongoingBooking.data.pickupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBA'} • ${bookingCountdown}`
                                  : ongoingBooking.type === 'empty_leg_booking'
                                  ? `${ongoingBooking.data?.departureDate ? new Date(ongoingBooking.data.departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBA'} • ${bookingCountdown}`
                                  : bookingCountdown}
                              </p>
                              <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-medium font-['DM_Sans'] ${
                                ongoingBooking.status === 'confirmed'
                                  ? 'bg-green-100 text-green-700'
                                  : ongoingBooking.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {ongoingBooking.status.replace('_', ' ')}
                              </span>
                            </>
                          ) : (
                            <>
                              <h4 className="text-xs font-medium mb-0.5 font-['DM_Sans'] text-gray-800">No Ongoing Booking</h4>
                              <p className="text-[10px] font-['DM_Sans'] text-gray-600">Book a ride to get started</p>
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {/* Web3 Mode - Show marketplace tokenized assets */}
                    {webMode === 'web3' && (
                      <>
                        {loadingAssets ? (
                          <div className="col-span-3 flex items-center justify-center py-12">
                            <Loader2 size={24} className="animate-spin text-gray-400" />
                          </div>
                        ) : tokenizedAssets.length > 0 ? (
                          tokenizedAssets.slice(0, 3).map((asset) => (
                            <button
                              key={asset.id}
                              onClick={() => setActiveCategory('marketplace')}
                              className="border rounded-xl p-3 text-left transition-all group bg-white/35 hover:bg-white/40 border-gray-300/50"
                              style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                            >
                              <div className="flex items-start gap-2 mb-2">
                                <div className="text-sm">{asset.icon}</div>
                              </div>
                              <h4 className="text-xs font-medium mb-0.5 font-['DM_Sans'] text-gray-900 truncate">
                                {asset.name}
                              </h4>
                              <p className="text-[10px] font-['DM_Sans'] text-gray-600 mb-1">{asset.type}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-medium text-gray-900">
                                  ${asset.value?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                </span>
                                <span className={`text-[10px] font-mono ${
                                  parseFloat(asset.change24h) >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {parseFloat(asset.change24h) >= 0 ? '+' : ''}{asset.change24h}%
                                </span>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="col-span-3 border rounded-xl p-6 text-center bg-white/35 border-gray-300/50" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                            <Coins size={20} className="text-gray-600 mx-auto mb-2" />
                            <p className="text-xs text-gray-600">No assets available</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Weather & News Cards - unterhalb der recent chats */}
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    {/* Card #7 - Weather Card */}
                    <div className="border rounded-xl p-4 bg-white/35 border-gray-300/50" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                      <div className="flex items-center gap-3 mb-2">
                        <div>
                          <p className={`text-xs mb-0.5 font-['DM_Sans'] ${webMode === 'web3' ? 'text-gray-700' : 'text-gray-600'}`}>{weatherData.city}</p>
                          <p className={`text-2xl font-semibold font-['DM_Sans'] ${webMode === 'web3' ? 'text-gray-900' : 'text-gray-800'}`}>{weatherData.temp}°C</p>
                        </div>
                        <div className="text-3xl">{weatherData.condition}</div>
                      </div>
                      <p className={`text-[10px] font-['DM_Sans'] ${webMode === 'web3' ? 'text-gray-600' : 'text-gray-600'}`}>{weatherData.description} H:{weatherData.high}° L:{weatherData.low}°</p>
                    </div>

                    {/* Card #8 - News Card */}
                    <a
                      href={latestBlogPost?.link || 'https://www.privatecharterx.blog'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block border rounded-xl p-4 transition-all cursor-pointer bg-white/35 hover:bg-white/40 border-gray-300/50"
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
                </div>
              </div>
            </div>
          )}

          {/* Tokenize Asset Flow */}
          {!isTransitioning && activeCategory === 'tokenization' && (
            <TokenizeAssetFlow onBack={() => setActiveCategory('overview')} />
          )}

          {/* My Tokenized Assets View */}
          {!isTransitioning && activeCategory === 'my-tokenized-assets' && (
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
                  <h1 className="text-3xl font-light text-gray-900 mb-2">My Tokenized Assets</h1>
                  <p className="text-gray-600">View and manage your tokenization requests</p>
                </div>

                {/* Tokenization List */}
                {loadingTokenizations ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                      <Loader2 size={32} className="animate-spin text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">Loading tokenizations...</p>
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
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center overflow-hidden">
                              {token.logo_url ? (
                                <img src={token.logo_url} alt={token.asset_name} className="w-full h-full object-cover" />
                              ) : (
                                <Sparkles size={24} className="text-white" />
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
                            {token.asset_category || 'No category'}
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
                          {token.price_per_token && (
                            <p className="text-sm font-medium text-gray-900 mb-4">
                              Price: ${parseFloat(token.price_per_token).toLocaleString()} per token
                            </p>
                          )}

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
                                // TODO: Load draft and open tokenization flow
                                console.log('View/Edit tokenization:', token.id);
                              }}
                              className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
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

          {/* SPV Formation Flow */}
          {!isTransitioning && activeCategory === 'spv-formation' && (
            <div className="w-full h-full overflow-y-auto">
              <SPVFormationFlow onBack={() => setActiveCategory('overview')} />
            </div>
          )}

          {/* My SPVs View */}
          {!isTransitioning && activeCategory === 'my-spvs' && (
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
                  <h1 className="text-3xl font-light text-gray-900 mb-2">My SPVs</h1>
                  <p className="text-gray-600">View and manage your SPV formations</p>
                </div>

                {/* SPV List */}
                {loadingSPVs ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                      <Loader2 size={32} className="animate-spin text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">Loading SPVs...</p>
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

                      return (
                        <div key={spv.id} className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <Building2 size={24} className="text-white" />
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[spv.status] || 'bg-gray-100 text-gray-700'}`}>
                              {spv.status || 'pending'}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {spv.service_type || 'SPV Formation'}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">
                            {spv.details || 'SPV formation request'}
                          </p>
                          <p className="text-xs text-gray-500 mb-4">
                            Requested: {new Date(spv.created_at).toLocaleDateString()}
                          </p>
                          {spv.estimated_cost && (
                            <p className="text-sm font-medium text-gray-900 mb-4">
                              Est. Cost: ${parseFloat(spv.estimated_cost).toLocaleString()}
                            </p>
                          )}
                          <div className="pt-4 border-t border-gray-200">
                            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
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

          {/* My Launches View */}
          {!isTransitioning && activeCategory === 'my-launches' && (
            <div className="w-full h-full overflow-y-auto">
              <MyLaunches />
            </div>
          )}

          {/* Launchpad */}
          {!isTransitioning && activeCategory === 'launchpad' && (
            <div className="w-full h-full overflow-y-auto">
              <LaunchpadPage />
            </div>
          )}

          {/* STO/UTL Dashboard */}
          {!isTransitioning && activeCategory === 'sto-utl' && (
            <div className="w-full h-full overflow-y-auto">
              <STOUTLDashboard />
            </div>
          )}

          {/* Marketplace */}
          {!isTransitioning && activeCategory === 'marketplace' && (
            <div className="w-full h-full overflow-y-auto">
              <Marketplace />
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

          {/* Community */}
          {!isTransitioning && activeCategory === 'community' && (
            <div className="w-full h-full overflow-y-auto">
              <CommunityPage />
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
              {bookingStep === 0 && (
                <div className="text-center mb-8">
                  <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-tighter">
                    Charter the Smart Way
                  </h2>
                </div>
              )}
              <div className="w-full max-w-7xl mx-auto">
                <UnifiedBookingFlow onStepChange={setBookingStep} />
              </div>
            </div>
          )}

          {/* Assets View - Events & Sports (RWS) or Tokenized Assets (Web3) */}
          {!isTransitioning && activeCategory === 'assets' && (
            <div className="w-full flex-1 flex flex-col">
              {/* Show EventsSportsView for RWS mode */}
              {webMode === 'rws' ? (
                <EventsSportsView
                  cart={eventCart}
                  setCart={setEventCart}
                  user={user}
                />
              ) : (
                <TokenizedAssetsShowcase />
              )}
            </div>
          )}

          {/* Taxi/Concierge View */}
          {!isTransitioning && activeCategory === 'ground-transport' && (
            <div className="w-full h-full">
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
              {/* Floating Banner with Video Background */}
              {!showJetDetail && (
                <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-8 shadow-lg bg-black">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover rounded-2xl"
                  >
                    <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/fucking%20videos/5778800-uhd_3840_2160_24fps.mp4" type="video/mp4" />
                  </video>

                {/* Brighter Grey Gradient Filter - Light to Dark */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-gray-300/60 to-gray-600/70 pointer-events-none rounded-2xl" />
                </div>
              )}

              {!showJetDetail && (
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">Private Jets</h2>

                  <div className="flex items-center gap-3">
                    {/* View Mode Switcher */}
                    <div className="flex items-center gap-2 bg-white/35 border border-gray-300/50 rounded-lg p-1" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                      <button
                        onClick={() => setJetsViewMode('grid')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                          jetsViewMode === 'grid'
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        Grid View
                      </button>
                      <button
                        onClick={() => setJetsViewMode('tabs')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                          jetsViewMode === 'tabs'
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        Tabs View
                      </button>
                    </div>

                    {/* Charter a Jet Button */}
                    <button
                      onClick={() => setActiveCategory('private-jet')}
                      className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
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

              {/* Filters - Glassmorphic - Only show when not viewing detail */}
              {!showJetDetail && (
                <div className="bg-white/35 rounded-lg border border-gray-300/50 p-5 mb-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-800 mb-2">Aircraft Category</label>
                    <select
                      value={jetsFilter}
                      onChange={(e) => setJetsFilter(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/35 border border-gray-300/50 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
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
                    <label className="block text-xs font-medium text-gray-800 mb-2">Manufacturer</label>
                    <input
                      type="text"
                      placeholder="e.g. Gulfstream, Bombardier"
                      value={jetsSearch}
                      onChange={(e) => setJetsSearch(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/35 border border-gray-300/50 rounded-xl text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-800 mb-2">Model</label>
                    <input
                      type="text"
                      placeholder="e.g. G650, Global 7500"
                      value={jetsSearch}
                      onChange={(e) => setJetsSearch(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/35 border border-gray-300/50 rounded-xl text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-800 mb-2">Max Price</label>
                    <input
                      type="text"
                      placeholder="e.g. €50,000/hr"
                      value={jetsMaxPrice}
                      onChange={(e) => setJetsMaxPrice(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/35 border border-gray-300/50 rounded-xl text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setJetsSearch('');
                        setJetsMaxPrice('');
                        setJetsFilter('all');
                      }}
                      className="w-full px-4 py-2.5 bg-white/35 hover:bg-white/40 border border-gray-300/50 text-gray-700 rounded-xl text-sm transition-all"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
                </div>
              )}

              {/* Loading State */}
              {!showJetDetail && isLoadingJets && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-sm text-gray-600">Loading jets...</div>
                </div>
              )}

              {/* Jets Grid View - Glassmorphic Cards */}
              {!showJetDetail && !isLoadingJets && jetsViewMode === 'grid' && (
                <>
                <div className="grid grid-cols-2 gap-5">
                  {jetsData
                    .slice((currentJetsPage - 1) * jetsPerPage, currentJetsPage * jetsPerPage)
                    .map((jet) => (
                    <div
                      key={jet.id}
                      onClick={() => handleJetClick(jet)}
                      className="bg-white/35 hover:bg-white/40 rounded-xl flex h-64 hover:shadow-lg transition-all cursor-pointer border border-gray-300/50"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      <div className="w-2/5 bg-white/10 relative flex-shrink-0 rounded-l-xl overflow-hidden">
                        {jet.image && (
                          <img
                            src={jet.image}
                            alt={jet.name}
                            className="w-full h-64 object-cover"
                          />
                        )}
                        <div className="absolute top-3 left-3 flex flex-col space-y-1.5">
                          <div className="flex space-x-1.5">
                            <div className="bg-white/90 px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 backdrop-blur-sm">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                              <span className="text-gray-800">{jet.location}</span>
                            </div>
                            <div className="bg-white/90 px-2 py-1 rounded text-xs font-medium text-gray-800 backdrop-blur-sm">⌂ {jet.category}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">PCX</span>
                          <div className="flex space-x-2">
                            <button className="w-6 h-6 border border-gray-600/40 bg-white/20 rounded flex items-center justify-center text-xs backdrop-blur-sm">⎘</button>
                            <button className="w-6 h-6 border border-gray-600/40 bg-white/20 rounded flex items-center justify-center text-xs backdrop-blur-sm">◉</button>
                          </div>
                        </div>
                        <h3 className="text-base font-semibold text-gray-800 mb-4 line-clamp-2 overflow-hidden">{jet.name}</h3>
                        <div className="flex space-x-6 border-b border-gray-600/30 mb-5">
                          <button className="pb-3 text-xs relative text-gray-800">
                            Properties
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800"></div>
                          </button>
                          <button className="pb-3 text-xs text-gray-600">Description</button>
                        </div>

                        {/* Jet specific fields */}
                        <div className="flex justify-between mt-auto mb-5">
                          <div className="flex flex-col space-y-1">
                            <span className="text-xs text-gray-600">Price Range</span>
                            <span className="text-sm font-semibold text-gray-800">{jet.totalPrice}</span>
                          </div>
                          <div className="flex flex-col space-y-1">
                            <span className="text-xs text-gray-600">Capacity</span>
                            <span className="text-sm font-semibold text-gray-800">{jet.capacity}</span>
                          </div>
                          <div className="flex flex-col space-y-1">
                            <span className="text-xs text-gray-600">Range</span>
                            <span className="text-sm font-semibold text-gray-800">{jet.range}</span>
                          </div>
                        </div>

                        <div className="flex space-x-4 pt-4 border-t border-gray-600/30 text-xs">
                          <a href="#" className="text-gray-600 hover:text-gray-800">See details ↗</a>
                          <a href="#" className="text-gray-600 hover:text-gray-800">Aircraft specs ⚖</a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

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
                </>
              )}

              {/* Jets Tabs View - List Format */}
              {!showJetDetail && !isLoadingJets && jetsViewMode === 'tabs' && (
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
                      <div className="flex items-center p-4 gap-4">
                        {/* Icon/Image */}
                        <div className="w-16 h-16 bg-gray-100/50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {jet.image ? (
                            <img src={jet.image} alt={jet.name} className="w-full h-full object-cover" />
                          ) : (
                            <Plane size={24} className="text-gray-400" />
                          )}
                        </div>

                        {/* Jet Name & Description */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-800">{jet.name}</h3>
                          <p className="text-xs text-gray-600">{jet.category}</p>
                        </div>

                        {/* Capacity */}
                        <div className="text-center px-4">
                          <div className="text-sm font-light text-gray-800">{jet.capacity}</div>
                          <div className="text-[10px] text-gray-600">Capacity</div>
                        </div>

                        {/* Price Range */}
                        <div className="text-center px-4">
                          <div className="text-sm font-light text-gray-800">{jet.totalPrice}</div>
                          <div className="text-[10px] text-gray-600">Price Range</div>
                        </div>

                        {/* Range */}
                        <div className="text-center px-4">
                          <div className="text-sm font-light text-gray-800">{jet.range}</div>
                          <div className="text-[10px] text-gray-600">Range</div>
                        </div>

                        {/* Buttons */}
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
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="px-4 py-2 bg-white/20 border border-gray-300/50 text-gray-800 rounded-lg text-xs font-medium hover:bg-white/30 transition-all"
                          >
                            Read More
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

              {/* Jet Detail View - Inline (not modal) */}
              {showJetDetail && selectedJet && (() => {
                const jetImages = getAllJetImages();
                const currentImage = jetImages[currentImageIndex] || selectedJet.image;
                return (
                  <div className="w-full">
                    {/* Jet Header Card */}
                    <div className="bg-white/35 rounded-lg border border-gray-300/50 mb-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                      <div className="flex h-80">
                        {/* Left side - Aircraft Image with Gallery */}
                        <div className="w-2/5 relative bg-gray-100/50">
                          <img
                            src={currentImage}
                            alt={selectedJet.name}
                            className="w-full h-full object-cover"
                          />

                          {jetImages.length > 1 && (
                            <>
                              <button
                                onClick={handlePrevImage}
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-black w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg text-sm"
                              >
                                ←
                              </button>
                              <button
                                onClick={handleNextImage}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-black w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg text-sm"
                              >
                                →
                              </button>
                              <div className="absolute bottom-3 right-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                                {currentImageIndex + 1} / {jetImages.length}
                              </div>
                            </>
                          )}

                          <div className="absolute top-3 left-3 flex space-x-1.5">
                            <div className="bg-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                              <span>Available</span>
                            </div>
                            <div className="bg-white px-2 py-1 rounded text-xs font-medium">✈ Private Jet</div>
                          </div>
                        </div>

                        {/* Right side - Jet info */}
                        <div className="flex-1 p-5 flex flex-col">
                          <div className="flex items-center justify-between mb-3">
                            <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">PCX JETS</span>
                            <div className="flex space-x-2">
                              <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">⎘</button>
                              <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">◉</button>
                            </div>
                          </div>

                          <h1 className="text-2xl font-semibold mb-4 text-gray-900">
                            {selectedJet.name}
                          </h1>
                          <p className="text-sm text-gray-600 mb-4">
                            {selectedJet.location} · {selectedJet.category}
                          </p>

                          {/* Tab Navigation */}
                          <div className="flex space-x-6 border-b border-gray-300 mb-5">
                            <button
                              onClick={() => setActiveTab('details')}
                              className={`pb-3 text-xs relative ${activeTab === 'details' ? 'text-black' : 'text-gray-600'}`}
                            >
                              Aircraft Details
                              {activeTab === 'details' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                            </button>
                            <button
                              onClick={() => setActiveTab('specs')}
                              className={`pb-3 text-xs relative ${activeTab === 'specs' ? 'text-black' : 'text-gray-600'}`}
                            >
                              Specifications
                              {activeTab === 'specs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                            </button>
                            <button
                              onClick={() => setActiveTab('pricing')}
                              className={`pb-3 text-xs relative ${activeTab === 'pricing' ? 'text-black' : 'text-gray-600'}`}
                            >
                              Pricing
                              {activeTab === 'pricing' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>}
                            </button>
                          </div>

                          {/* Key metrics */}
                          <div className="flex justify-between mt-auto mb-5">
                            <div className="flex flex-col space-y-1">
                              <span className="text-xs text-gray-500">Price Range</span>
                              <span className="text-sm font-semibold text-black">{selectedJet.totalPrice}</span>
                            </div>
                            <div className="flex flex-col space-y-1">
                              <span className="text-xs text-gray-500">Capacity</span>
                              <span className="text-sm font-semibold text-black">{selectedJet.capacity}</span>
                            </div>
                            <div className="flex flex-col space-y-1">
                              <span className="text-xs text-gray-500">Range</span>
                              <span className="text-sm font-semibold text-black">{selectedJet.range}</span>
                            </div>
                          </div>

                          {/* Links */}
                          <div className="flex space-x-4 pt-4 border-t border-gray-100 text-xs">
                            <button className="text-gray-600 hover:text-black">Aircraft specs ↗</button>
                            <button className="text-gray-600 hover:text-black">Terms & Conditions ⚖</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content and Booking Section */}
                    <div className="grid grid-cols-3 gap-6">
                      {/* Left Column - Content */}
                      <div className="col-span-2">
                        <div className="bg-white/35 rounded-lg border border-gray-300/50 p-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                          {activeTab === 'details' && (
                            <div className="space-y-6">
                              <div>
                                <h3 className="text-sm font-semibold text-black mb-3">Aircraft Description</h3>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  The {selectedJet.name} by {selectedJet.location} is a premium private jet offering exceptional comfort and performance. This {selectedJet.category} provides an outstanding flight experience with state-of-the-art amenities and technology.
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                                <div className="flex items-start space-x-3">
                                  <Plane className="text-gray-600 mt-0.5" size={20} />
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">Manufacturer</p>
                                    <p className="text-sm font-semibold text-black">{selectedJet.location}</p>
                                  </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                  <Users className="text-gray-600 mt-0.5" size={20} />
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">Passenger Capacity</p>
                                    <p className="text-sm font-semibold text-black">{selectedJet.capacity}</p>
                                  </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                  <MapPin className="text-gray-600 mt-0.5" size={20} />
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">Range</p>
                                    <p className="text-sm font-semibold text-black">{selectedJet.range}</p>
                                  </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                  <Calendar className="text-gray-600 mt-0.5" size={20} />
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">Category</p>
                                    <p className="text-sm font-semibold text-black">{selectedJet.category}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeTab === 'specs' && (
                            <div className="space-y-4">
                              <h3 className="text-sm font-semibold text-black mb-4">Technical Specifications</h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50/50 rounded">
                                  <p className="text-xs text-gray-500 mb-1">Aircraft Model</p>
                                  <p className="text-sm font-semibold text-black">{selectedJet.name}</p>
                                </div>
                                <div className="p-3 bg-gray-50/50 rounded">
                                  <p className="text-xs text-gray-500 mb-1">Category</p>
                                  <p className="text-sm font-semibold text-black">{selectedJet.category}</p>
                                </div>
                                <div className="p-3 bg-gray-50/50 rounded">
                                  <p className="text-xs text-gray-500 mb-1">Capacity</p>
                                  <p className="text-sm font-semibold text-black">{selectedJet.capacity}</p>
                                </div>
                                <div className="p-3 bg-gray-50/50 rounded">
                                  <p className="text-xs text-gray-500 mb-1">Range</p>
                                  <p className="text-sm font-semibold text-black">{selectedJet.range}</p>
                                </div>
                                <div className="p-3 bg-gray-50/50 rounded">
                                  <p className="text-xs text-gray-500 mb-1">Manufacturer</p>
                                  <p className="text-sm font-semibold text-black">{selectedJet.location}</p>
                                </div>
                                <div className="p-3 bg-gray-50/50 rounded">
                                  <p className="text-xs text-gray-500 mb-1">Price Range</p>
                                  <p className="text-sm font-semibold text-black">{selectedJet.totalPrice}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeTab === 'pricing' && (
                            <div className="space-y-4">
                              <h3 className="text-sm font-semibold text-black mb-4">Charter Pricing</h3>
                              <div className="p-4 bg-gray-50/50 rounded-lg">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="text-sm text-gray-600">Estimated Price Range</span>
                                  <span className="text-lg font-bold text-black">{selectedJet.totalPrice}</span>
                                </div>
                                <p className="text-xs text-gray-500">
                                  Final pricing depends on route, flight time, positioning, and additional services. Request a quote for exact pricing.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Image Gallery */}
                          {jetImages.length > 1 && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                              <h3 className="text-sm font-semibold text-black mb-3">Gallery</h3>
                              <div className="grid grid-cols-3 gap-3">
                                {jetImages.map((img, idx) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt={`${selectedJet.name} ${idx + 1}`}
                                    onClick={() => setCurrentImageIndex(idx)}
                                    className={`w-full h-24 object-cover rounded cursor-pointer transition-all ${
                                      idx === currentImageIndex ? 'ring-2 ring-black' : 'opacity-60 hover:opacity-100'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Column - Booking Widget */}
                      <div className="col-span-1">
                        <div className="bg-white/35 rounded-lg border border-gray-300/50 p-6 sticky top-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                          <h3 className="text-lg font-semibold text-black mb-4">Request Charter Quote</h3>

                          <div className="space-y-4 mb-6">
                            <div className="p-3 bg-gray-50/50 rounded">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Aircraft</span>
                                <span className="text-sm font-semibold text-black">{selectedJet.name}</span>
                              </div>
                            </div>
                            <div className="p-3 bg-gray-50/50 rounded">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Capacity</span>
                                <span className="text-sm font-semibold text-black">{selectedJet.capacity}</span>
                              </div>
                            </div>
                            <div className="p-3 bg-gray-50/50 rounded">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Est. Price Range</span>
                                <span className="text-sm font-semibold text-black">{selectedJet.totalPrice}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all mb-3"
                          >
                            Request Quote
                          </button>

                          <button
                            className="w-full bg-white border-2 border-black text-black py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                          >
                            Check NFT Membership
                          </button>

                          <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-xs text-gray-500 leading-relaxed">
                              Our concierge team will contact you within 24 hours with exact pricing and availability. NFT members receive priority service and exclusive discounts.
                            </p>
                          </div>
                        </div>
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
              {/* Floating Banner with Video Background */}
              {!showHelicopterDetail && (
                <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-8 shadow-lg bg-black">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover rounded-2xl"
                    onLoadedData={() => console.log('Video loaded successfully')}
                    onError={(e) => console.error('Video error:', e)}
                  >
                    <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/fucking%20videos/2771611-uhd_3840_2160_24fps.mp4" type="video/mp4" />
                  </video>

                  {/* Brighter Grey Gradient Filter - Light to Dark */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-gray-300/60 to-gray-600/70 pointer-events-none rounded-2xl" />
                </div>
              )}

              {!showHelicopterDetail && (
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">Helicopter Charters</h2>

                  <div className="flex items-center gap-3">
                    {/* View Mode Switcher */}
                    <div className="flex items-center gap-2 bg-white/35 border border-gray-300/50 rounded-lg p-1" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                      <button
                        onClick={() => setHelicoptersViewMode('grid')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                          helicoptersViewMode === 'grid'
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        Grid View
                      </button>
                      <button
                        onClick={() => setHelicoptersViewMode('tabs')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                          helicoptersViewMode === 'tabs'
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        Tabs View
                      </button>
                    </div>

                    {/* Charter a Heli Button */}
                    <button
                      onClick={() => setActiveCategory('private-jet')}
                      className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
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

              {/* Filters - Glassmorphic */}
              {!showHelicopterDetail && (
              <div className="mb-8">
                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-800 mb-2">Category</label>
                    <select
                      value={helicoptersFilter}
                      onChange={(e) => setHelicoptersFilter(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/35 border border-gray-300/50 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
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
                    <label className="block text-xs font-medium text-gray-800 mb-2">Model/Manufacturer</label>
                    <input
                      type="text"
                      placeholder="e.g. Airbus H135, AW109"
                      value={helicoptersSearch}
                      onChange={(e) => setHelicoptersSearch(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/35 border border-gray-300/50 rounded-xl text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-800 mb-2">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Monaco, Switzerland"
                      value={helicoptersLocation}
                      onChange={(e) => setHelicoptersLocation(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/35 border border-gray-300/50 rounded-xl text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-800 mb-2">Max Price/Hour (€)</label>
                    <input
                      type="number"
                      placeholder="e.g. 8000"
                      value={helicoptersMaxPrice}
                      onChange={(e) => setHelicoptersMaxPrice(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/35 border border-gray-300/50 rounded-xl text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setHelicoptersSearch('');
                        setHelicoptersLocation('');
                        setHelicoptersMaxPrice('');
                        setHelicoptersFilter('all');
                      }}
                      className="w-full px-4 py-2.5 bg-white/35 hover:bg-white/40 border border-gray-300/50 text-gray-700 rounded-xl text-sm transition-all"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
              )}

              {/* Loading State */}
              {isLoadingHelicopters && !showHelicopterDetail && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-sm text-gray-600">Loading helicopters...</div>
                </div>
              )}

              {/* Helicopters Grid View */}
              {!isLoadingHelicopters && !showHelicopterDetail && helicoptersViewMode === 'grid' && (
                <>
                <div className="grid grid-cols-2 gap-5">
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
                      className="bg-white/35 hover:bg-white/40 rounded-xl flex h-64 hover:shadow-lg transition-all cursor-pointer border border-gray-300/50"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      <div className="w-2/5 bg-white/10 relative flex-shrink-0 rounded-l-xl overflow-hidden">
                        {heli.image && (
                          <img
                            src={heli.image}
                            alt={heli.name}
                            className="w-full h-64 object-cover"
                          />
                        )}
                        <div className="absolute top-3 left-3 flex flex-col space-y-1.5">
                          <div className="flex space-x-1.5">
                            <div className="bg-white/90 px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 backdrop-blur-sm">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                              <span className="text-gray-800">{heli.location}</span>
                            </div>
                            <div className="bg-white/90 px-2 py-1 rounded text-xs font-medium text-gray-800 backdrop-blur-sm">🚁 {heli.category.substring(0, 20)}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">PCX</span>
                          <div className="flex space-x-2">
                            <button className="w-6 h-6 border border-gray-600/40 bg-white/20 rounded flex items-center justify-center text-xs backdrop-blur-sm">⎘</button>
                            <button className="w-6 h-6 border border-gray-600/40 bg-white/20 rounded flex items-center justify-center text-xs backdrop-blur-sm">◉</button>
                          </div>
                        </div>
                        <h3 className="text-base font-semibold text-gray-800 mb-4 line-clamp-2 overflow-hidden">{heli.name}</h3>
                        <div className="flex space-x-6 border-b border-gray-600/30 mb-5">
                          <button className="pb-3 text-xs relative text-gray-800">
                            Properties
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800"></div>
                          </button>
                          <button className="pb-3 text-xs text-gray-600">Description</button>
                        </div>

                        <div className="flex justify-between mt-auto mb-5">
                          <div className="flex flex-col space-y-1">
                            <span className="text-xs text-gray-600">Price/Hour</span>
                            <span className="text-sm font-semibold text-gray-800">{heli.totalPrice}</span>
                          </div>
                          <div className="flex flex-col space-y-1">
                            <span className="text-xs text-gray-600">Capacity</span>
                            <span className="text-sm font-semibold text-gray-800">{heli.capacity}</span>
                          </div>
                          <div className="flex flex-col space-y-1">
                            <span className="text-xs text-gray-600">Range</span>
                            <span className="text-sm font-semibold text-gray-800">{heli.range}</span>
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
                </>
              )}

              {/* Helicopters Tabs View - List Format */}
              {!isLoadingHelicopters && !showHelicopterDetail && helicoptersViewMode === 'tabs' && (
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
                      <div className="flex items-center p-4 gap-4">
                        {/* Icon/Image */}
                        <div className="w-16 h-16 bg-gray-100/50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {heli.image ? (
                            <img src={heli.image} alt={heli.name} className="w-full h-full object-cover" />
                          ) : (
                            <Zap size={24} className="text-gray-400" />
                          )}
                        </div>

                        {/* Helicopter Name & Description */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-800">{heli.name}</h3>
                          <p className="text-xs text-gray-600">{heli.category.substring(0, 50)}</p>
                        </div>

                        {/* Price */}
                        <div className="text-center px-4">
                          <div className="text-sm font-light text-gray-800">{heli.totalPrice}</div>
                          <div className="text-[10px] text-gray-600">Price/Hour</div>
                        </div>

                        {/* Capacity */}
                        <div className="text-center px-4">
                          <div className="text-sm font-light text-gray-800">{heli.capacity}</div>
                          <div className="text-[10px] text-gray-600">Capacity</div>
                        </div>

                        {/* Range */}
                        <div className="text-center px-4">
                          <div className="text-sm font-light text-gray-800">{heli.range}</div>
                          <div className="text-[10px] text-gray-600">Range</div>
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

              {/* Helicopter Detail View */}
              {showHelicopterDetail && selectedHelicopter && (() => {
                const rawData = selectedHelicopter.rawData || {};
                return (
                  <div className="w-full max-w-7xl">
                    {/* Header with Image and Info */}
                    <div className="bg-white/35 rounded-lg border border-gray-300/50 mb-6 overflow-hidden" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                      <div className="grid grid-cols-2 gap-0">
                        {/* Left: Helicopter Image */}
                        <div className="relative h-96">
                          <img src={selectedHelicopter.image} alt={selectedHelicopter.name} className="w-full h-full object-cover" />
                          <div className="absolute top-4 left-4 flex gap-2">
                            <span className="bg-white px-3 py-1 rounded-full text-xs font-medium">● Available</span>
                            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">🚁 Helicopter</span>
                          </div>
                        </div>

                        {/* Right: Helicopter Info */}
                        <div className="flex-1 p-5 flex flex-col">
                          <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase w-fit">PCX HELICOPTER</span>
                          <h1 className="text-2xl font-semibold mb-4 text-gray-900">{selectedHelicopter.name}</h1>

                          {/* Tabs */}
                          <div className="flex space-x-6 border-b border-gray-300/50 mb-4">
                            <button className="pb-3 text-sm font-medium text-gray-800 border-b-2 border-gray-800">Details</button>
                            <button className="pb-3 text-sm font-medium text-gray-600">Specifications</button>
                            <button className="pb-3 text-sm font-medium text-gray-600">Operator</button>
                          </div>

                          {/* Key Info Grid */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Hourly Rate</p>
                              <p className="text-base font-semibold text-gray-800">{selectedHelicopter.totalPrice}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Capacity</p>
                              <p className="text-base font-semibold text-gray-800">{selectedHelicopter.capacity}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Location</p>
                              <p className="text-base font-semibold text-gray-800">{selectedHelicopter.location || 'Global'}</p>
                            </div>
                          </div>

                          {/* Links */}
                          <div className="flex space-x-4 text-xs mt-auto">
                            <a href="#" className="text-gray-600 hover:text-gray-800">Aircraft specs ↗</a>
                            <a href="#" className="text-gray-600 hover:text-gray-800">Terms & Conditions ⚖</a>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Section: Helicopter Details + Booking */}
                    <div className="grid grid-cols-3 gap-6">
                      {/* Left: Helicopter Details */}
                      <div className="col-span-2 bg-white/35 rounded-lg border border-gray-300/50 p-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Helicopter Details</h2>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Model</p>
                            <p className="text-sm font-semibold text-gray-800">{selectedHelicopter.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Status</p>
                            <p className="text-sm font-semibold text-gray-800">Available</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Base Location</p>
                            <p className="text-sm font-semibold text-gray-800">{rawData.base_location || 'Multiple locations'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Passengers</p>
                            <p className="text-sm font-semibold text-gray-800">{rawData.capacity || selectedHelicopter.capacity}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Hourly Rate</p>
                            <p className="text-sm font-semibold text-gray-800">{selectedHelicopter.totalPrice}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Range</p>
                            <p className="text-sm font-semibold text-gray-800">{rawData.range || selectedHelicopter.range || '690 km'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Cruise Speed</p>
                            <p className="text-sm font-semibold text-gray-800">{rawData.cruise_speed || selectedHelicopter.speed || '220 km/h'}</p>
                          </div>
                        </div>

                        <h3 className="text-base font-semibold text-gray-900 mb-3">Description</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {rawData.description || 'The Bell 206 JetRanger is a versatile light helicopter offering panoramic views through large windows. It features a spacious cabin with comfortable seating, low noise levels, and smooth flight characteristics. Popular for executive transport, sightseeing tours, and charter flights, it provides an excellent introduction to helicopter travel with reliable performance and safety record.'}
                        </p>
                      </div>

                      {/* Right: Book This Helicopter */}
                      <div className="bg-white/35 rounded-lg border border-gray-300/50 p-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Book This Helicopter</h2>

                        <div className="space-y-4 mb-6">
                          <div>
                            <label className="block text-xs text-gray-600 mb-2">Hourly Rate:</label>
                            <p className="text-xl font-bold text-gray-900">{selectedHelicopter.totalPrice}</p>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-2">Max Capacity</label>
                            <p className="text-base font-semibold text-gray-800">{selectedHelicopter.capacity}</p>
                          </div>
                        </div>

                        <div className="space-y-3 mb-6">
                          <h3 className="text-sm font-semibold text-gray-900">Charter Details</h3>

                          <div>
                            <label className="block text-xs text-gray-600 mb-2">Passengers</label>
                            <div className="flex items-center justify-between border border-gray-300 rounded px-3 py-2">
                              <button className="text-gray-600 hover:text-gray-900">−</button>
                              <span className="text-sm font-medium">1</span>
                              <button className="text-gray-600 hover:text-gray-900">+</button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-2">Flight Duration (hours)</label>
                            <div className="flex items-center justify-between border border-gray-300 rounded px-3 py-2">
                              <button className="text-gray-600 hover:text-gray-900">−</button>
                              <span className="text-sm font-medium">1</span>
                              <button className="text-gray-600 hover:text-gray-900">+</button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-2">Special Requests (optional)</label>
                            <textarea
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
                              rows="3"
                              placeholder="Landing site preferences, special equipment, etc."
                            ></textarea>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4 text-sm border-t border-gray-300 pt-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Hourly Rate:</span>
                            <span className="font-bold text-gray-900">{selectedHelicopter.totalPrice}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span>1 hour €</span>
                          </div>
                        </div>

                        <button className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-all mb-4">
                          Request Charter
                        </button>

                        <p className="text-xs text-gray-500 text-center">Helicopter ID: {rawData.id || 'N/A'}</p>
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
              {/* Floating Banner with Video Background */}
              {!showEmptyLegDetail && (
                <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-8 shadow-lg bg-black">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover rounded-2xl"
                  >
                    <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/fucking%20videos/12427469_3840_2160_24fps.mp4" type="video/mp4" />
                  </video>

                  {/* Brighter Grey Gradient Filter - Light to Dark */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-gray-300/60 to-gray-600/70 pointer-events-none rounded-2xl" />
                </div>
              )}

              {!showEmptyLegDetail && (
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">Empty Legs</h2>

                {/* View Mode Switcher */}
                <div className="flex items-center gap-2 bg-white/35 border border-gray-300/50 rounded-lg p-1" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                  <button
                    onClick={() => setEmptyLegsViewMode('grid')}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                      emptyLegsViewMode === 'grid'
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Grid View
                  </button>
                  <button
                    onClick={() => setEmptyLegsViewMode('tabs')}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                      emptyLegsViewMode === 'tabs'
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Tabs View
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

              {/* Filters - Glassmorphic */}
              {!showEmptyLegDetail && (
                <div className="bg-white/35 rounded-lg border border-gray-300/50 p-5 mb-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-800 mb-2">Region</label>
                    <select
                      value={emptyLegsFilter}
                      onChange={(e) => setEmptyLegsFilter(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/35 border border-gray-300/50 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      <option value="all">All Regions</option>
                      <option value="europe">Europe</option>
                      <option value="usa">USA</option>
                      <option value="asia">Asia</option>
                      <option value="africa">Africa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-800 mb-2">Location/IATA</label>
                    <input
                      type="text"
                      placeholder="e.g. London, LHR"
                      value={emptyLegsLocation}
                      onChange={(e) => setEmptyLegsLocation(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/35 border border-gray-300/50 rounded-xl text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-800 mb-2">Departure Date</label>
                    <input
                      type="date"
                      value={emptyLegsDate}
                      onChange={(e) => setEmptyLegsDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/35 border border-gray-300/50 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-800 mb-2">Max Price (€)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={emptyLegsMaxPrice}
                      onChange={(e) => setEmptyLegsMaxPrice(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/35 border border-gray-300/50 rounded-xl text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all duration-200"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setEmptyLegsLocation('');
                        setEmptyLegsDate('');
                        setEmptyLegsMaxPrice('');
                        setEmptyLegsFilter('all');
                      }}
                      className="w-full px-4 py-2.5 bg-white/35 hover:bg-white/40 border border-gray-300/50 text-gray-700 rounded-xl text-sm transition-all"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
                </div>
              )}

              {/* Loading State */}
              {isLoadingEmptyLegs && !showEmptyLegDetail && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-sm text-gray-600">Loading empty legs...</div>
                </div>
              )}

              {/* Grid View */}
              {!isLoadingEmptyLegs && !showEmptyLegDetail && emptyLegsViewMode === 'grid' && (
                <>
                <div className="grid grid-cols-2 gap-5">
                  {emptyLegsData
                    .slice((currentEmptyLegsPage - 1) * emptyLegsPerPage, currentEmptyLegsPage * emptyLegsPerPage)
                    .map((leg) => (
                    <div
                      key={leg.id}
                      onClick={() => {
                        setSelectedEmptyLeg(leg);
                        setShowEmptyLegDetail(true);
                        setCurrentEmptyLegImageIndex(0);
                      }}
                      className="bg-white/35 hover:bg-white/40 rounded-xl flex h-64 hover:shadow-lg transition-all cursor-pointer border border-gray-300/50"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
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
                            {leg.isFreeWithNFT && (
                              <div className="bg-yellow-400/90 px-2 py-1 rounded text-xs font-medium text-gray-800 backdrop-blur-sm">🎫 Free with NFT</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">PCX</span>
                        </div>
                        <h3 className="text-base font-semibold text-gray-800 mb-4 line-clamp-2 overflow-hidden">{leg.name}</h3>
                        <div className="flex space-x-6 border-b border-gray-600/30 mb-5">
                          <button className="pb-3 text-xs relative text-gray-800">
                            Details
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800"></div>
                          </button>
                        </div>

                        <div className="flex justify-between mt-auto mb-5">
                          <div className="flex flex-col space-y-1">
                            <span className="text-xs text-gray-600">Price</span>
                            <span className="text-sm font-semibold text-gray-800">{leg.totalPrice}</span>
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

              {/* Tabs View - List Format */}
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
                      }}
                      className="bg-white/35 hover:bg-white/40 rounded-lg border border-gray-300/50 overflow-hidden transition-all cursor-pointer"
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      <div className="flex items-center p-4 gap-4">
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
                          <h3 className="text-base font-semibold text-gray-800">{leg.name}</h3>
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

              {/* Empty Leg Detail View - Full Layout */}
              {showEmptyLegDetail && selectedEmptyLeg && (() => {
                const rawData = selectedEmptyLeg.rawData || {};
                return (
                  <div className="w-full max-w-7xl">
                    {/* Header Section with Image and Main Info */}
                    <div className="bg-white/35 rounded-lg border border-gray-300/50 mb-6 overflow-hidden" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                      <div className="grid grid-cols-2 gap-0">
                        {/* Left: Aircraft Image */}
                        <div className="relative h-96">
                          <img
                            src={selectedEmptyLeg.image}
                            alt={selectedEmptyLeg.name}
                            className="w-full h-full object-cover"
                          />
                          {/* Badges on Image */}
                          <div className="absolute top-4 left-4 flex gap-2">
                            <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-gray-800">● Available</span>
                            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">✈ Empty Leg</span>
                          </div>
                        </div>

                        {/* Right: Flight Info */}
                        <div className="flex-1 p-5 flex flex-col">
                          <div className="flex items-center justify-between mb-3">
                            <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">PCX EMPTY LEG</span>
                            <div className="flex space-x-2">
                              <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">⎘</button>
                              <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">◉</button>
                            </div>
                          </div>

                          <h1 className="text-2xl font-semibold mb-4 text-gray-900">{selectedEmptyLeg.name}</h1>
                          <p className="text-sm text-gray-600 mb-4">{rawData.from_city || 'Departure'} to {rawData.to_city || 'Arrival'}</p>

                          {/* Tabs */}
                          <div className="flex space-x-6 border-b border-gray-300/50 mb-4">
                            <button className="pb-3 text-sm font-medium text-gray-800 border-b-2 border-gray-800">Flight Details</button>
                            <button className="pb-3 text-sm font-medium text-gray-600 hover:text-gray-800">Aircraft</button>
                            <button className="pb-3 text-sm font-medium text-gray-600 hover:text-gray-800">Operator</button>
                            <button className="pb-3 text-sm font-medium text-gray-600 hover:text-gray-800">Map</button>
                          </div>

                          {/* Key Info Grid */}
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Departure</p>
                              <p className="text-base font-semibold text-gray-800">{selectedEmptyLeg.departureDate}</p>
                              <p className="text-xs text-gray-500">TBD</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Capacity</p>
                              <p className="text-base font-semibold text-gray-800">{rawData.capacity || rawData.pax || 'N/A'} passengers</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Price</p>
                              <p className="text-base font-semibold text-gray-800">{selectedEmptyLeg.totalPrice}</p>
                            </div>
                          </div>

                          {/* Links */}
                          <div className="flex space-x-4 text-xs mt-auto">
                            <a href="#" className="text-gray-600 hover:text-gray-800">Flight tracking ↗</a>
                            <a href="#" className="text-gray-600 hover:text-gray-800">Terms & Conditions ⚖</a>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Section: Flight Details + Booking */}
                    <div className="grid grid-cols-3 gap-6">
                      {/* Left: Flight Details */}
                      <div className="col-span-2 bg-white/35 rounded-lg border border-gray-300/50 p-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Flight Details</h2>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">From</p>
                            <p className="text-sm font-semibold text-gray-800">{rawData.from_city || 'Teterboro'} ({rawData.from_iata || 'TEB'})</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">To</p>
                            <p className="text-sm font-semibold text-gray-800">{rawData.to_city || 'Porto Alegre'} ({rawData.to_iata || 'POA'})</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Departure Date</p>
                            <p className="text-sm font-semibold text-gray-800">{selectedEmptyLeg.departureDate}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Departure Time</p>
                            <p className="text-sm font-semibold text-gray-800">Flexible</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Flight Duration</p>
                            <p className="text-sm font-semibold text-gray-800">TBD</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Distance</p>
                            <p className="text-sm font-semibold text-gray-800">N/A</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Passengers</p>
                            <p className="text-sm font-semibold text-gray-800">{rawData.capacity || rawData.pax || '14'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Luggage Capacity</p>
                            <p className="text-sm font-semibold text-gray-800">Standard</p>
                          </div>
                        </div>

                        {/* GREEN CO2 Certificate Box */}
                        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
                          <div className="flex items-start gap-3 mb-3">
                            <span className="text-2xl">🌿</span>
                            <div>
                              <h3 className="text-base font-bold text-green-900 mb-2">CO₂ Certificate INCLUDED</h3>
                              <p className="text-sm text-green-800 mb-3">All empty leg flights include a complimentary CO₂ offset certificate – no additional cost!</p>
                              <div className="flex items-start gap-2">
                                <span className="text-green-600">✓</span>
                                <p className="text-sm text-green-900">
                                  <span className="font-semibold">Classic or Blockchain Certificate:</span> Choose between traditional carbon offset certificate or blockchain-verified NFT certificate at checkout.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Book This Flight Sidebar */}
                      <div className="bg-white/35 rounded-lg border border-gray-300/50 p-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Book This Flight</h2>

                        <div className="space-y-3 mb-6">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Base Price</p>
                            <p className="text-xl font-semibold text-gray-800">{selectedEmptyLeg.totalPrice}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Departure</p>
                            <p className="text-sm font-semibold text-gray-800">{selectedEmptyLeg.departureDate}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Max Capacity</p>
                            <p className="text-sm font-semibold text-gray-800">{rawData.capacity || rawData.pax || '14'} pax</p>
                          </div>
                        </div>

                        <div className="border-t border-gray-300/50 pt-6 mb-6">
                          <h3 className="text-sm font-semibold text-gray-900 mb-4">Booking Details</h3>

                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div>
                              <p className="text-xs text-gray-600 mb-2">Passengers</p>
                              <div className="flex items-center justify-between border border-gray-300 rounded px-2 py-1">
                                <button className="text-gray-600 hover:text-gray-900">−</button>
                                <span className="text-sm font-medium">1</span>
                                <button className="text-gray-600 hover:text-gray-900">+</button>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-2">Luggage</p>
                              <div className="flex items-center justify-between border border-gray-300 rounded px-2 py-1">
                                <button className="text-gray-600 hover:text-gray-900">−</button>
                                <span className="text-sm font-medium">0</span>
                                <button className="text-gray-600 hover:text-gray-900">+</button>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-2">Pet</p>
                              <div className="flex items-center justify-center border border-gray-300 rounded px-2 py-1">
                                <span className="text-sm font-medium">No</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 mb-4 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Base Price:</span>
                              <span className="font-bold text-gray-900">{selectedEmptyLeg.totalPrice}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                              <span>Total:</span>
                              <span>{selectedEmptyLeg.totalPrice}</span>
                            </div>
                          </div>
                        </div>

                        <button className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-all mb-4">
                          Request Flight
                        </button>

                        <a href="#" className="block text-center text-sm text-blue-600 hover:underline">
                          Check NFT Membership for Discounts
                        </a>

                        <p className="text-xs text-gray-500 text-center mt-4">0xe2ee...801b</p>
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

          {/* ADVENTURES SECTION */}
          {!isTransitioning && activeCategory === 'adventures' && (
            <div className="w-full flex-1 flex flex-col">
              {/* Floating Banner with Video Background */}
              {!showAdventureDetail && (
                <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-8 shadow-lg bg-black">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover rounded-2xl"
                  >
                    <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/fucking%20videos/3573961-uhd_3840_2160_30fps.mp4" type="video/mp4" />
                  </video>

                  {/* Brighter Grey Gradient Filter - Light to Dark */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-gray-300/60 to-gray-600/70 pointer-events-none rounded-2xl" />
                </div>
              )}

              {/* Adventures Header with View Switcher */}
              {!showAdventureDetail && (
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">Adventures</h2>
                  <div className="flex items-center gap-2 bg-white/35 border border-gray-300/50 rounded-lg p-1" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                    <button
                      onClick={() => setAdventuresViewMode('grid')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        adventuresViewMode === 'grid'
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-600 hover:bg-white/20'
                      }`}
                    >
                      Grid View
                    </button>
                    <button
                      onClick={() => setAdventuresViewMode('tabs')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        adventuresViewMode === 'tabs'
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-600 hover:bg-white/20'
                      }`}
                    >
                      Tabs View
                    </button>
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

              {/* Adventures Filters */}
              {!showAdventureDetail && (
                <div className="bg-white/35 rounded-lg border border-gray-300/50 p-5 mb-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-800 mb-2">Region</label>
                      <select
                        value={adventuresFilter}
                        onChange={(e) => setAdventuresFilter(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300/50 rounded-lg bg-white/60 text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
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
                      <label className="block text-xs font-medium text-gray-800 mb-2">Package Type</label>
                      <input
                        type="text"
                        placeholder="e.g. Safari, Yacht"
                        value={adventuresPackageType}
                        onChange={(e) => setAdventuresPackageType(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300/50 rounded-lg bg-white/60 text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                        style={{ backdropFilter: 'blur(10px) saturate(150%)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-800 mb-2">Destination</label>
                      <input
                        type="text"
                        placeholder="e.g. Dubai, Paris"
                        value={adventuresDestination}
                        onChange={(e) => setAdventuresDestination(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300/50 rounded-lg bg-white/60 text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                        style={{ backdropFilter: 'blur(10px) saturate(150%)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-800 mb-2">Max Price (€)</label>
                      <input
                        type="number"
                        placeholder="e.g. 50000"
                        value={adventuresMaxPrice}
                        onChange={(e) => setAdventuresMaxPrice(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300/50 rounded-lg bg-white/60 text-sm text-gray-600 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                        style={{ backdropFilter: 'blur(10px) saturate(150%)' }}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setAdventuresSearch('');
                          setAdventuresPackageType('');
                          setAdventuresDestination('');
                          setAdventuresMaxPrice('');
                          setAdventuresFilter('all');
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
              {isLoadingAdventures && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-sm text-gray-600">Loading adventures...</div>
                </div>
              )}

              {/* Adventures Grid View */}
              {!isLoadingAdventures && !showAdventureDetail && adventuresViewMode === 'grid' && (
                <>
                <div className="grid grid-cols-2 gap-5">
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
                      className={`bg-white/35 hover:bg-white/40 rounded-xl flex h-64 hover:shadow-lg transition-all cursor-pointer border ${
                        adventure.isFreeWithNFT
                          ? 'border-2 border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:shadow-[0_0_30px_rgba(74,222,128,0.5)]'
                          : 'border-gray-300/50'
                      }`}
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
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
                      </div>
                      <div className="flex-1 p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">PCX</span>
                          <div className="flex space-x-2">
                            <button className="w-6 h-6 border border-gray-600/40 bg-white/20 rounded flex items-center justify-center text-xs backdrop-blur-sm">⎘</button>
                            <button className="w-6 h-6 border border-gray-600/40 bg-white/20 rounded flex items-center justify-center text-xs backdrop-blur-sm">◉</button>
                          </div>
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
                          <div className="flex flex-col space-y-1">
                            <span className="text-xs text-gray-600">Level</span>
                            <span className="text-sm font-semibold text-gray-800">{adventure.period}</span>
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
                            <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">PCX ADVENTURE</span>
                            <div className="flex space-x-2">
                              <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">⎘</button>
                              <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">◉</button>
                            </div>
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
                            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
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

                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div>
                              <p className="text-xs text-gray-600 mb-2">Guests</p>
                              <div className="flex items-center justify-between border border-gray-300 rounded px-2 py-1">
                                <button className="text-gray-600 hover:text-gray-900">−</button>
                                <span className="text-sm font-medium">2</span>
                                <button className="text-gray-600 hover:text-gray-900">+</button>
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

                          <div className="space-y-2 mb-4 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Base Price:</span>
                              <span className="font-bold text-gray-900">{priceLabel}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                              <span>Total:</span>
                              <span>{priceLabel}</span>
                            </div>
                          </div>
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

                              const payload = {
                                // Core
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
                                currency: offer.currency || 'EUR',
                                price: offer.price || null,
                                price_on_request: offer.price_on_request || !offer.price,
                                description: offer.description,

                                // Client info
                                client_info: {
                                  user_id: user.id,
                                  email: user.email,
                                },

                                // Metadata
                                booking_source: 'glassmorphic_adventures_detail',
                                timestamp: new Date().toISOString(),
                              };

                              const { error } = await createRequest({
                                userId: user.id,
                                type: 'adventure_package',
                                data: payload,
                              });

                              if (error) throw new Error(error);
                              setAdventureSubmitSuccess(true);
                              setTimeout(() => setAdventureSubmitSuccess(false), 2500);
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

                        <a href="#" className="block text-center text-sm text-blue-600 hover:underline">
                          Check NFT Membership for Perks
                        </a>

                        <p className="text-xs text-gray-500 text-center mt-4">0xe2ee...801b</p>
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
              {/* Floating Banner with Video Background */}
              {!showLuxuryCarDetail && (
                <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-8 shadow-lg bg-black">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover rounded-2xl"
                  >
                    <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/fucking%20videos/8747374-uhd_3840_2160_30fps.mp4" type="video/mp4" />
                  </video>

                  {/* Brighter Grey Gradient Filter - Light to Dark */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-gray-300/60 to-gray-600/70 pointer-events-none rounded-2xl" />
                </div>
              )}

              {/* Luxury Cars Header with View Switcher */}
              {!showLuxuryCarDetail && (
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">Luxury Cars</h2>
                  <div className="flex items-center gap-2 bg-white/35 border border-gray-300/50 rounded-lg p-1" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                    <button
                      onClick={() => setLuxuryCarsViewMode('grid')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        luxuryCarsViewMode === 'grid'
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-600 hover:bg-white/20'
                      }`}
                    >
                      Grid View
                    </button>
                    <button
                      onClick={() => setLuxuryCarsViewMode('tabs')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        luxuryCarsViewMode === 'tabs'
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-600 hover:bg-white/20'
                      }`}
                    >
                      Tabs View
                    </button>
                  </div>
                </div>
              )}

              {/* Luxury Cars Filters */}
              {!showLuxuryCarDetail && (
                <div className="bg-white/35 rounded-lg border border-gray-300/50 p-5 mb-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
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
                      <label className="block text-xs font-medium text-gray-800 mb-2">Max Price/Day (€)</label>
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
                  <div className="text-sm text-gray-600">Loading luxury cars...</div>
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
                          <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">PCX</span>
                          <div className="flex space-x-2">
                            <button className="w-6 h-6 border border-gray-600/40 bg-white/20 rounded flex items-center justify-center text-xs backdrop-blur-sm">⎘</button>
                            <button className="w-6 h-6 border border-gray-600/40 bg-white/20 rounded flex items-center justify-center text-xs backdrop-blur-sm">◉</button>
                          </div>
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
                const priceDayLabel = car.price_per_day ? `€${car.price_per_day?.toLocaleString()}/day` : 'On Request';
                const priceHourLabel = car.price_per_hour ? `€${car.price_per_hour?.toLocaleString()}/hr` : 'On Request';
                const priceWeekLabel = car.price_per_week ? `€${car.price_per_week?.toLocaleString()}/wk` : 'On Request';
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
                            <div className="flex space-x-2">
                              <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">⎘</button>
                              <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">◉</button>
                            </div>
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
                      <div className="col-span-2 bg-white/35 rounded-lg border border-gray-300/50 p-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
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
                            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
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
                      <div className="bg-white/35 rounded-lg border border-gray-300/50 p-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
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
                              const payload = {
                                car_id: car.id,
                                brand: car.brand,
                                model: car.model,
                                type: car.type || selectedLuxuryCar.category || 'Luxury Car',
                                location: car.location || selectedLuxuryCar.location,
                                year: car.year,
                                transmission: car.transmission,
                                fuel_type: car.fuel_type,
                                seats: car.seats,
                                currency: 'EUR',
                                price_per_day: car.price_per_day ?? null,
                                price_per_hour: car.price_per_hour ?? null,
                                price_per_week: car.price_per_week ?? null,
                                image_url: car.image_url || selectedLuxuryCar.image,
                                description: car.description,
                                client_info: {
                                  user_id: user.id,
                                  email: user.email,
                                },
                                booking_source: 'glassmorphic_luxury_cars_detail',
                                timestamp: new Date().toISOString(),
                              };

                              const { error } = await createRequest({
                                userId: user.id,
                                type: 'luxury_car_rental',
                                data: payload,
                              });

                              if (error) throw new Error(error);
                              setLuxuryCarSubmitSuccess(true);
                              setTimeout(() => setLuxuryCarSubmitSuccess(false), 2500);
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

                        <a href="#" className="block text-center text-sm text-blue-600 hover:underline">
                          Check NFT Membership for Perks
                        </a>

                        <p className="text-xs text-gray-500 text-center mt-4">0xe2ee...801b</p>
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
            <AIChat
              showChatOverview={showChatOverview}
              setShowChatOverview={setShowChatOverview}
              activeChat={activeChat}
              setActiveChat={setActiveChat}
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
              currentMessage={currentMessage}
              setCurrentMessage={setCurrentMessage}
              isRecording={isRecording}
              toggleRecording={toggleRecording}
              speechSupported={speechSupported}
              user={user}
              walletAddress={address}
              isWalletConnected={isConnected}
              userNFTs={userNFTs}
              onRequestWalletConnect={handleWalletConnect}
              initialQuery={aiChatQuery}
              onQueryProcessed={() => setAiChatQuery('')}
            />
          )}

          {/* CHAT HISTORY VIEW */}
          {!isTransitioning && activeCategory === 'chat-history' && (
            <div className="p-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-semibold text-gray-900 mb-2">Chat History</h1>
                <p className="text-sm text-gray-600">View and manage your AI conversations with Sphera</p>
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
                    }}
                    className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all inline-flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Start New Chat
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {chatHistory.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => {
                        setActiveChat(chat.id);
                        setActiveCategory('chat');
                      }}
                      className="bg-white/30 backdrop-blur-xl border border-gray-300/50 rounded-2xl p-6 cursor-pointer hover:shadow-lg hover:border-gray-400/50 transition-all group"
                    >
                      {/* Chat Icon */}
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <MessageSquare size={24} className="text-white" />
                      </div>

                      {/* Chat Info */}
                      <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                        {chat.title}
                      </h3>
                      <p className="text-xs text-gray-600 mb-3">{chat.date}</p>

                      {/* Message Count */}
                      <div className="flex items-center gap-2 text-xs text-gray-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {chat.messages.length} {chat.messages.length === 1 ? 'message' : 'messages'}
                      </div>

                      {/* Preview last message */}
                      {chat.messages.length > 0 && (
                        <p className="text-xs text-gray-600 mt-3 line-clamp-2">
                          {chat.messages[chat.messages.length - 1].content}
                        </p>
                      )}
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
              {/* Floating Banner with Video Background */}
              <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-8 shadow-lg bg-black">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-2xl"
                >
                  <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/fucking%20videos/200439-912684352_small%20(1).mp4" type="video/mp4" />
                </video>

                {/* Brighter Grey Gradient Filter - Light to Dark */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-gray-300/60 to-gray-600/70 pointer-events-none rounded-2xl" />
              </div>

              {/* Header with Title */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">CO₂ Offset & SAF Projects</h2>
              </div>

              {/* CO2 Projects Grid */}
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
                          <button className="w-6 h-6 border border-gray-600/40 bg-white/20 rounded flex items-center justify-center text-xs backdrop-blur-sm">⎘</button>
                          <button className="w-6 h-6 border border-gray-600/40 bg-white/20 rounded flex items-center justify-center text-xs backdrop-blur-sm">◉</button>
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
                        <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">⎘</button>
                        <button className="w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center text-xs">◉</button>
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

      {/* Modals */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
          onSuccess={() => setShowLoginModal(false)}
          onSwitchToForgotPassword={() => {
            setShowLoginModal(false);
            setShowForgotPasswordModal(true);
          }}
        />
      )}
      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
          onSuccess={() => setShowRegisterModal(false)}
        />
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

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default TokenizedAssetsGlassmorphic;

