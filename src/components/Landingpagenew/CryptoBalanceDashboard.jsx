import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, History, Wallet, MessageCircle, Shield, User, Award, Plus, X, ExternalLink, LogOut, RefreshCw, Coins, Plane, Leaf, Send, CheckCircle, Headphones, Camera, Loader2, Crown, ChevronRight } from 'lucide-react';
import { supportTicketService } from '../../services/supportTicketService';
import { LineChart, Line, ResponsiveContainer, YAxis, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { supabase } from '../../lib/supabase';
import { subscriptionService } from '../../services/subscriptionService';
import { formatEther } from 'viem';
import { base, mainnet } from 'viem/chains';
import { web3Service } from '../../lib/web3';

export default function CryptoBalanceDashboard({ setActiveCategory, onLogout }) {
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const chainId = useChainId();

  // State for balances
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [showChart, setShowChart] = useState(true);
  const [activeSection, setActiveSection] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // State for user data
  const [userRequests, setUserRequests] = useState([]);
  const [kycData, setKycData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [nftCount, setNftCount] = useState(0);
  const [investments, setInvestments] = useState([]);

  // State for PVCX data
  const [pvcxData, setPvcxData] = useState({
    balance: 0,
    earned_from_bookings: 0,
    earned_from_co2: 0
  });

  // State for manual refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State for Support modal
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportCategory, setSupportCategory] = useState('general');
  const [sendingSupport, setSendingSupport] = useState(false);
  const [supportSent, setSupportSent] = useState(false);

  // State for Edit Profile modal
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    // From KYC (read-only after submission)
    first_name: '',
    last_name: '',
    // Editable fields (stored in user_profiles)
    phone: '',
    address: '',
    city: '',
    country: ''
  });
  const [kycSubmitted, setKycSubmitted] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // State for profile avatar
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // State for subscription
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  // Fetch ETH balance on Base - refetch every 30 seconds
  const { data: baseEthBalance, refetch: refetchBaseEth } = useBalance({
    address: address,
    chainId: base.id,
    query: {
      enabled: !!address,
      refetchInterval: 30000, // 30 seconds
      staleTime: 10000,
    },
  });

  // Fetch ETH balance on Ethereum mainnet
  const { data: ethMainnetBalance, refetch: refetchMainnetEth } = useBalance({
    address: address,
    chainId: mainnet.id,
    query: {
      enabled: !!address,
      refetchInterval: 30000,
      staleTime: 10000,
    },
  });

  // Fetch USDC balance on Base (USDC has 6 decimals)
  const { data: usdcBalance, refetch: refetchUsdc } = useBalance({
    address: address,
    token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    chainId: base.id,
    query: {
      enabled: !!address,
      refetchInterval: 30000,
      staleTime: 10000,
    },
  });

  // Fetch native balance on current chain
  const { data: currentChainBalance, refetch: refetchCurrentChain } = useBalance({
    address: address,
    chainId: chainId,
    query: {
      enabled: !!address && !!chainId,
      refetchInterval: 30000,
      staleTime: 10000,
    },
  });

  // Fetch user profile and KYC data
  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
      fetchKYCData();
      fetchUserRequests();
      fetchInvestments();
      fetchNFTCount();
      fetchPVCXData();
      fetchSubscriptionData();
    }
  }, [user?.id]);

  // Fetch transactions when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchAllTransactions();
    }
  }, [isConnected, address]);

  // Update balances when wallet data changes OR chainId changes
  useEffect(() => {
    if (isConnected && address) {
      console.log('🔄 Wallet data changed - updating balances', { chainId, address });
      updateBalances();
      generateChartData();
    } else {
      // Show empty state when not connected
      setBalances([]);
      setTransactions([]);
    }
  }, [baseEthBalance, ethMainnetBalance, usdcBalance, currentChainBalance, isConnected, address, chainId, refreshTrigger]);

  // Force refresh when chain changes
  useEffect(() => {
    if (isConnected && address && chainId) {
      console.log('🔗 Chain changed to:', chainId, '- forcing refresh');
      refetchAllBalances();
    }
  }, [chainId]);

  // Auto-refresh balances and transactions every 60 seconds
  useEffect(() => {
    if (!isConnected || !address) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing balances and transactions (60s interval)');
      refetchAllBalances();
      fetchAllTransactions();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [isConnected, address]);

  // Real-time subscription for PVCX balance updates
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to real-time changes on pvcx_balance table
    const channel = supabase
      .channel('pvcx-balance-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'pvcx_balance',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🪙 PVCX balance updated in real-time:', payload);
          if (payload.new) {
            setPvcxData({
              balance: parseFloat(payload.new.balance) || 0,
              earned_from_bookings: parseFloat(payload.new.earned_from_bookings) || 0,
              earned_from_co2: parseFloat(payload.new.earned_from_co2) || 0
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 PVCX subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔕 Unsubscribing from PVCX balance updates');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Function to manually refetch all balances
  const refetchAllBalances = async () => {
    console.log('🔄 Refetching all balances...');
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchBaseEth?.(),
        refetchMainnetEth?.(),
        refetchUsdc?.(),
        refetchCurrentChain?.(),
      ]);
      setRefreshTrigger(prev => prev + 1);
      console.log('✅ All balances refetched');
    } catch (error) {
      console.error('Error refetching balances:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // Brief delay for visual feedback
    }
  };

  // Manual refresh handler
  const handleManualRefresh = () => {
    refetchAllBalances();
    fetchAllTransactions();
  };

  const fetchAllTransactions = async () => {
    if (!address) return;

    setLoadingTransactions(true);
    console.log('🔍 Fetching real transactions for wallet:', address);

    try {
      const allTxs = await web3Service.getAllChainTransactions(address, 50);
      console.log(`✅ Loaded ${allTxs.length} real transactions from blockchain`);

      if (allTxs.length > 0) {
        console.log('📋 First transaction:', allTxs[0]);
        setTransactions(allTxs);
      } else {
        console.log('⚠️ No transactions found for this wallet');
        setTransactions([]);
      }
    } catch (error) {
      console.error('❌ Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setUserProfile(data);
        // Set avatar URL if exists
        if (data.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchKYCData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('kyc_status, kyc_hash, kyc_verified_at, verification_level')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setKycData(data);
      }
    } catch (error) {
      console.error('Error fetching KYC data:', error);
    }
  };

  // Open Edit Profile modal and populate with current data from KYC submission
  const handleOpenEditProfile = async () => {
    console.log('📝 Opening Edit Profile modal...');
    console.log('👤 User ID:', user?.id);

    try {
      // Fetch KYC form data from documents table (contains firstName, lastName, etc.)
      console.log('🔍 Fetching KYC data from documents table...');
      const { data: kycDoc, error: kycError } = await supabase
        .from('documents')
        .select('verification_notes, document_type, created_at, status')
        .eq('user_id', user.id)
        .eq('document_type', 'kyc_form')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('📄 KYC Document result:', { kycDoc, kycError });

      // Fetch user_profiles for editable fields (phone, address, city, country)
      console.log('🔍 Fetching user_profiles data...');
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('phone, address, city, country')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('👤 Profile data result:', { profileData, profileError });

      let kycFormData = null;
      if (!kycError && kycDoc?.verification_notes) {
        try {
          console.log('📋 Raw verification_notes:', kycDoc.verification_notes);
          kycFormData = JSON.parse(kycDoc.verification_notes);
          console.log('✅ Parsed KYC Form Data:', kycFormData);
          setKycSubmitted(true);
        } catch (parseError) {
          console.error('❌ Error parsing KYC data:', parseError);
        }
      }

      // Populate form:
      // - Names from KYC (read-only)
      // - Phone/Address/City/Country: use user_profiles first (user may have updated), fallback to KYC
      const formData = {
        first_name: kycFormData?.firstName || '',
        last_name: kycFormData?.lastName || '',
        phone: profileData?.phone || kycFormData?.phoneNumber || '',
        address: profileData?.address || kycFormData?.address || '',
        city: profileData?.city || kycFormData?.city || '',
        country: profileData?.country || kycFormData?.country || ''
      };

      console.log('✅ Form data to display:', formData);
      setEditProfileData(formData);

    } catch (error) {
      console.error('❌ Error fetching data for edit profile:', error);
      setEditProfileData({
        first_name: '',
        last_name: '',
        phone: userProfile?.phone || '',
        address: userProfile?.address || '',
        city: userProfile?.city || '',
        country: userProfile?.country || ''
      });
    }
    setShowEditProfile(true);
  };

  // Save profile changes (only editable fields: phone, address, city, country)
  const handleSaveProfile = async () => {
    if (!user?.id) return;

    setSavingProfile(true);
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Only save editable fields (NOT first_name/last_name - those come from KYC)
      const profileUpdate = {
        phone: editProfileData.phone,
        address: editProfileData.address,
        city: editProfileData.city,
        country: editProfileData.country,
        updated_at: new Date().toISOString()
      };

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('user_profiles')
          .update(profileUpdate)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new profile
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            ...profileUpdate
          });

        if (error) throw error;
      }

      // Refresh profile data
      await fetchUserProfile();
      setShowEditProfile(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle avatar file selection and upload
  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    setUploadingAvatar(true);
    try {
      // Generate file path: userId/timestamp.extension
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      if (avatarUrl) {
        try {
          // Extract path from URL
          const oldPath = avatarUrl.split('/avatars/')[1];
          if (oldPath) {
            await supabase.storage.from('avatars').remove([oldPath]);
          }
        } catch (e) {
          console.log('Could not delete old avatar:', e);
        }
      }

      // Upload new avatar
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user_profiles with new avatar URL
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingProfile) {
        await supabase
          .from('user_profiles')
          .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_profiles')
          .insert({ user_id: user.id, avatar_url: publicUrl });
      }

      // Update local state
      setAvatarUrl(publicUrl);
      setAvatarPreview(null); // Clear preview, use actual URL

      console.log('Avatar uploaded successfully:', publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar. Please try again.');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const fetchUserRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('user_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUserRequests(data);
      }
    } catch (error) {
      console.error('Error fetching user requests:', error);
    }
  };

  const fetchInvestments = async () => {
    if (!address) return;

    try {
      const { data, error } = await supabase
        .from('launchpad_investments')
        .select('*, launchpad_projects(*)')
        .eq('wallet_address', address.toLowerCase())
        .order('created_at', { ascending: false });

      if (!error && data) {
        setInvestments(data);
      }
    } catch (error) {
      console.error('Error fetching investments:', error);
    }
  };

  const fetchNFTCount = async () => {
    if (!address) return;

    try {
      // Query NFT ownership - adjust table name based on your schema
      const { data, error } = await supabase
        .from('nft_memberships')
        .select('*')
        .eq('wallet_address', address.toLowerCase());

      if (!error && data) {
        setNftCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching NFT count:', error);
      // Default to showing 0 if table doesn't exist
      setNftCount(0);
    }
  };

  const fetchPVCXData = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('pvcx_balance')
        .select('balance, earned_from_bookings, earned_from_co2')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setPvcxData({
          balance: parseFloat(data.balance) || 0,
          earned_from_bookings: parseFloat(data.earned_from_bookings) || 0,
          earned_from_co2: parseFloat(data.earned_from_co2) || 0
        });
      }
    } catch (error) {
      console.error('Error fetching PVCX data:', error);
    }
  };

  const fetchSubscriptionData = async () => {
    if (!user?.id) {
      setLoadingSubscription(false);
      return;
    }

    try {
      setLoadingSubscription(true);
      const profile = await subscriptionService.getUserProfile(user.id);
      const chatStats = await subscriptionService.getChatStats(user.id);

      // Get messages per chat based on tier
      const getMessagesPerChat = (tier) => {
        if (tier === 'elite') return '∞';
        if (tier === 'traveller') return '25';
        return '10'; // explorer
      };

      setSubscriptionData({
        tier: profile?.subscription_tier || null,
        status: profile?.subscription_status || 'inactive',
        // Dates
        currentPeriodStart: profile?.current_period_start,
        currentPeriodEnd: profile?.current_period_end,
        chatsResetDate: profile?.chats_reset_date,
        // Usage
        chatsUsed: chatStats?.chatsUsed || 0,
        chatsLimit: chatStats?.chatsLimit || 0,
        chatsRemaining: chatStats?.chatsRemaining || 0,
        unlimited: chatStats?.unlimited || false,
        // Messages per chat
        messagesPerChat: getMessagesPerChat(profile?.subscription_tier)
      });
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setSubscriptionData(null);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const updateBalances = async () => {
    setLoading(true);
    const newBalances = [];
    const ethPrice = 3500; // Mock price - integrate coingecko API for real prices

    console.log('📊 Updating balances...', {
      baseEthBalance: baseEthBalance?.formatted,
      ethMainnetBalance: ethMainnetBalance?.formatted,
      usdcBalance: usdcBalance?.formatted,
      currentChainBalance: currentChainBalance?.formatted,
      currentChainId: chainId,
    });

    // Add ETH balance from Base
    if (baseEthBalance && baseEthBalance.value > 0n) {
      const ethValue = parseFloat(baseEthBalance.formatted);
      newBalances.push({
        symbol: 'ETH',
        name: 'Ethereum (Base)',
        balance: ethValue,
        value: ethValue * ethPrice,
        change: 2.4,
        chain: 'Base',
        chainId: base.id,
        isCurrentChain: chainId === base.id,
      });
    }

    // Add ETH balance from Ethereum mainnet
    if (ethMainnetBalance && ethMainnetBalance.value > 0n) {
      const ethValue = parseFloat(ethMainnetBalance.formatted);
      newBalances.push({
        symbol: 'ETH',
        name: 'Ethereum (Mainnet)',
        balance: ethValue,
        value: ethValue * ethPrice,
        change: 2.4,
        chain: 'Ethereum',
        chainId: mainnet.id,
        isCurrentChain: chainId === mainnet.id,
      });
    }

    // Add USDC balance from Base (USDC has 6 decimals - wagmi handles this with .formatted)
    if (usdcBalance && usdcBalance.value > 0n) {
      const usdcValue = parseFloat(usdcBalance.formatted);
      newBalances.push({
        symbol: 'USDC',
        name: 'USD Coin (Base)',
        balance: usdcValue,
        value: usdcValue * 1.0,
        change: 0.0,
        chain: 'Base',
        chainId: base.id,
        isCurrentChain: chainId === base.id,
      });
    }

    // Add current chain balance if it's a different chain (not Base or Mainnet)
    if (currentChainBalance && currentChainBalance.value > 0n && chainId !== base.id && chainId !== mainnet.id) {
      const nativeValue = parseFloat(currentChainBalance.formatted);
      newBalances.push({
        symbol: currentChainBalance.symbol,
        name: `${currentChainBalance.symbol} (Chain ${chainId})`,
        balance: nativeValue,
        value: nativeValue * ethPrice, // Assume same price as ETH for now
        change: 0.0,
        chain: `Chain ${chainId}`,
        chainId: chainId,
        isCurrentChain: true,
      });
    }

    // Sort: current chain first, then by value
    newBalances.sort((a, b) => {
      if (a.isCurrentChain && !b.isCurrentChain) return -1;
      if (!a.isCurrentChain && b.isCurrentChain) return 1;
      return b.value - a.value;
    });

    console.log('✅ Balances updated:', newBalances);
    setBalances(newBalances);
    setLoading(false);
  };

  const generateChartData = () => {
    // Generate mock chart data based on current portfolio
    // In production, fetch historical data from transactions table
    const data = [];
    const baseValue = balances.reduce((sum, b) => sum + b.value, 0) || 50000;

    for (let i = 0; i < 6; i++) {
      const variance = (Math.random() - 0.5) * 2000;
      data.push({
        time: `${i * 4}:00`,
        value: Math.max(0, baseValue + variance),
      });
    }

    setChartData(data);
  };

  const totalValue = balances.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...balances.map(b => b.value), 1);

  const handleSend = () => {
    // Open AppKit modal with send view
    open({ view: 'Account' });
  };

  const handleReceive = () => {
    // Open AppKit modal to show wallet address
    open({ view: 'Account' });
  };

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  // Handle support inquiry submission
  const handleSupportSubmit = async () => {
    if (!supportMessage.trim() || !user?.id) return;

    setSendingSupport(true);
    try {
      // Save to support_tickets table
      const { data, error } = await supabase
        .from('support_tickets')
        .insert([{
          user_id: user.id,
          subject: `Support Request - ${supportCategory.charAt(0).toUpperCase() + supportCategory.slice(1)}`,
          message: supportMessage.trim(),
          category: supportCategory,
          priority: 'normal',
          status: 'open',
          user_email: user.email,
          user_name: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email
        }])
        .select()
        .single();

      if (error) throw error;

      // Send email notification
      try {
        await supportTicketService.sendChatNotificationEmail({
          message: supportMessage.trim(),
          name: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email,
          email: user.email || '',
          phone: '',
          userId: user.id,
          ticketId: data.id,
          category: supportCategory
        });
      } catch (emailError) {
        console.error('Email notification error:', emailError);
      }

      setSupportSent(true);
      setSupportMessage('');
      setSupportCategory('general');

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowSupportModal(false);
        setSupportSent(false);
      }, 2000);

    } catch (error) {
      console.error('Error submitting support request:', error);
      alert('Failed to submit support request. Please try again.');
    } finally {
      setSendingSupport(false);
    }
  };

  const getRequestTypeLabel = (type) => {
    const labels = {
      'taxi_concierge': 'Airport Transfer',
      'ground_transport': 'Airport Transfer',
      'private_jet_charter': 'Private Jet Charter',
      'helicopter_charter': 'Helicopter Charter',
      'empty_leg': 'Empty Leg',
      'luxury_car': 'Luxury Car',
      'luxury_car_rental': 'Luxury Car Rental',
      'adventure_package': 'Adventure Package',
      'co2_certificate': 'CO2 Certificate',
      'fixed_offer': 'Fixed Offer',
      'yacht_charter': 'Yacht Charter',
      'booking': 'Multi-Service Booking',
      'ai_chat_bulk': 'AI Concierge Request',
      'spv_formation': 'SPV Formation',
      'tokenization': 'Asset Tokenization'
    };
    return labels[type] || type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Request';
  };

  // Helper to extract request details from data
  const getRequestDetails = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};

    // Extract items from AI Chat cart submissions
    const items = data.items || [];
    const firstItem = items[0] || {};

    // Common fields extraction
    const route = data.route || firstItem.route ||
      (data.from && data.to ? `${data.from} → ${data.to}` : null) ||
      (firstItem.from && firstItem.to ? `${firstItem.from} → ${firstItem.to}` : null) ||
      (data.departure_airport && data.arrival_airport ? `${data.departure_airport} → ${data.arrival_airport}` : null);

    const price = data.total_price || data.total || data.price || data.estimatedPrice ||
      firstItem.total_price || firstItem.price || firstItem.estimatedPrice;

    const aircraft = data.aircraft_model || data.aircraft || firstItem.aircraft_model ||
      firstItem.model || firstItem.name;

    const passengers = data.passenger_capacity || data.passengers || data.pax ||
      firstItem.max_passengers || firstItem.passengers;

    const date = data.departure_date || data.date || data.pickupDate ||
      firstItem.departure_date || firstItem.date;

    const carName = data.carName || firstItem.carName || firstItem.name;
    const carSeats = data.carSeats || firstItem.carSeats || firstItem.seats;

    return {
      route,
      price,
      aircraft,
      passengers,
      date,
      carName,
      carSeats,
      itemCount: items.length
    };
  };

  // Generate unique client number from user ID
  const generateClientNumber = (userId) => {
    if (!userId) return null;
    // Take last 8 chars of UUID and convert to uppercase
    const shortId = userId.replace(/-/g, '').slice(-8).toUpperCase();
    return `PCX-${shortId}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Wallet Not Connected Banner */}
        {!isConnected && (
          <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 mb-4 border border-gray-300/50">
            <div className="text-center">
              <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <h2 className="text-lg sm:text-xl font-light text-gray-900 mb-2">Wallet Not Connected</h2>
              <p className="text-gray-600 mb-4 text-sm">
                Connect your wallet to view your crypto balances and portfolio.
              </p>
              <button
                onClick={() => open()}
                className="px-6 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-all text-sm"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        )}

        {/* Total Balance Card with Chart - Only show when wallet is connected */}
        {isConnected && (
          <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 mb-4 border border-gray-300/50">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <p className="text-gray-500 text-xs mb-1">Total Value</p>
              <h2 className="text-3xl sm:text-4xl font-light text-gray-900 mb-1">
                ${totalValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p className="text-xs text-gray-500 mt-1">+2.4% today</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">{chainId === base.id ? 'Base' : chainId === mainnet.id ? 'Mainnet' : `Chain ${chainId}`}</p>
                <div className="px-2 py-1 bg-white/30 backdrop-blur-sm rounded-full text-xs text-gray-700 border border-gray-300/50">
                  Live
                </div>
              </div>
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-gray-300/50 hover:bg-white/40 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
                title="Refresh balances"
              >
                <RefreshCw className={`w-5 h-5 text-gray-700 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowChart(!showChart)}
                className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-gray-300/50 hover:bg-white/40 flex items-center justify-center transition-all active:scale-95"
              >
                {showChart ? (
                  <X className="w-5 h-5 text-gray-700 transition-transform duration-300" />
                ) : (
                  <Plus className="w-5 h-5 text-gray-700 transition-transform duration-300" />
                )}
              </button>
            </div>
          </div>

          {/* Collapsible Line Chart */}
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showChart ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
            {chartData.length > 0 && (
              <>
                <div className="h-24 -mx-4 mb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#000000"
                        strokeWidth={2}
                        dot={false}
                        animationDuration={1000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex justify-between text-xs text-gray-400 px-4">
                  <span>00:00</span>
                  <span>12:00</span>
                  <span>Now</span>
                </div>
              </>
            )}
          </div>
        </div>
        )}

        {/* Action Buttons - Only show when wallet is connected */}
        {isConnected && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            onClick={handleSend}
            className="flex-1 bg-black text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-sm font-medium">Send</span>
          </button>
          <button
            onClick={handleReceive}
            className="flex-1 bg-gray-100 text-black rounded-xl py-3 px-4 flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95 border border-gray-200"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Receive</span>
          </button>
        </div>
        )}

        {/* Quick Access Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* My Assets Section - Only show when wallet is connected */}
            {isConnected && (
            <div className="bg-white/15 backdrop-blur-xl border border-gray-300/50 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('assets')}
                className="w-full p-3 flex items-center justify-between hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">My Assets</span>
                </div>
                <Plus className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${activeSection === 'assets' ? 'rotate-45' : ''}`} />
              </button>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${activeSection === 'assets' ? 'max-h-96' : 'max-h-0'}`}>
                <div className="p-4 bg-white/10 space-y-2">
                  {balances.length > 0 ? (
                    balances.map((item) => (
                      <div key={`${item.symbol}-${item.chain}`} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">{item.symbol[0]}</span>
                          </div>
                          <span className="text-sm text-gray-900">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-600">${item.value.toLocaleString('de-DE', { maximumFractionDigits: 0 })}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No assets found</p>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* Blockchain Transactions Section - Only show when wallet is connected */}
            {isConnected && (
            <div className="bg-white/15 backdrop-blur-xl border border-gray-300/50 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('transactions')}
                className="w-full p-3 flex items-center justify-between hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Blockchain Transactions</span>
                  {transactions.length > 0 && (
                    <span className="px-2 py-0.5 bg-black text-white rounded-full text-xs">
                      {transactions.length}
                    </span>
                  )}
                  {loadingTransactions && (
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs animate-pulse">
                      Loading...
                    </span>
                  )}
                </div>
                <Plus className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${activeSection === 'transactions' ? 'rotate-45' : ''}`} />
              </button>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${activeSection === 'transactions' ? 'max-h-96 overflow-y-auto' : 'max-h-0'}`}>
                <div className="p-4 bg-white/10 space-y-2">
                  {loadingTransactions ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      <span>Fetching from blockchain...</span>
                    </div>
                  ) : transactions.length > 0 ? (
                    <>
                      <p className="text-[10px] text-gray-400 mb-2">Real transactions from Base & Ethereum</p>
                      {transactions.slice(0, 10).map((tx) => (
                        <div key={tx.hash} className="py-2 border-b border-gray-300/30 last:border-0">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900 capitalize">{tx.type}</p>
                                {tx.type === 'send' ? (
                                  <ArrowUpRight className="w-3 h-3 text-red-500" />
                                ) : (
                                  <ArrowDownLeft className="w-3 h-3 text-green-500" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                {new Date(tx.timestamp).toLocaleDateString('de-DE', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              <a
                                href={tx.etherscanUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                              >
                                View on Explorer <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {tx.tokenTransfers && tx.tokenTransfers.length > 0
                                  ? tx.tokenTransfers[0].valueFormatted
                                  : `${parseFloat(tx.valueInEth).toFixed(4)} ETH`}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {tx.etherscanUrl?.includes('basescan') ? 'Base' : 'Ethereum'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">No transactions found</p>
                      <p className="text-xs text-gray-400 mt-1">Transactions will appear here once you make transfers</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* My Requests Section */}
            <div className="bg-white/15 backdrop-blur-xl border border-gray-300/50 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('requests')}
                className="w-full p-3 flex items-center justify-between hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">My Requests</span>
                  {userRequests.length > 0 && (
                    <span className="px-2 py-0.5 bg-black text-white rounded-full text-xs">
                      {userRequests.length}
                    </span>
                  )}
                </div>
                <Plus className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${activeSection === 'requests' ? 'rotate-45' : ''}`} />
              </button>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${activeSection === 'requests' ? 'max-h-[600px] overflow-y-auto' : 'max-h-0'}`}>
                <div className="p-4 bg-white/10 space-y-3">
                  {userRequests.length > 0 ? (
                    <>
                      {userRequests.slice(0, 5).map((request) => {
                        const details = getRequestDetails(request);
                        const requestType = request.request_type || request.type;

                        return (
                          <div key={request.id} className="py-3 px-3 bg-white/5 rounded-lg border border-gray-200/30">
                            {/* Header with Type and Status */}
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {getRequestTypeLabel(requestType)}
                                </p>
                                {/* Show aircraft/car name if available */}
                                {details.aircraft && (
                                  <p className="text-xs text-gray-600 font-medium mt-0.5">{details.aircraft}</p>
                                )}
                                {details.carName && !details.aircraft && (
                                  <p className="text-xs text-gray-600 font-medium mt-0.5">{details.carName}</p>
                                )}
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                request.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                request.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                request.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {request.status}
                              </span>
                            </div>

                            {/* Route Info */}
                            {details.route && (
                              <div className="mb-2 py-2 px-2.5 bg-gray-100/50 rounded-lg">
                                <p className="text-xs text-gray-700 font-medium">{details.route}</p>
                              </div>
                            )}

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              {details.passengers && (
                                <div>
                                  <p className="text-[10px] text-gray-400">Passengers</p>
                                  <p className="text-xs font-medium text-gray-700">{details.passengers} pax</p>
                                </div>
                              )}
                              {details.carSeats && !details.passengers && (
                                <div>
                                  <p className="text-[10px] text-gray-400">Seats</p>
                                  <p className="text-xs font-medium text-gray-700">{details.carSeats}</p>
                                </div>
                              )}
                              {details.date && (
                                <div>
                                  <p className="text-[10px] text-gray-400">Travel Date</p>
                                  <p className="text-xs font-medium text-gray-700">{formatDate(details.date)}</p>
                                </div>
                              )}
                              {details.price && (
                                <div>
                                  <p className="text-[10px] text-gray-400">Price</p>
                                  <p className="text-xs font-medium text-gray-700">
                                    {typeof details.price === 'number' ? `$${details.price.toLocaleString()}` : details.price}
                                  </p>
                                </div>
                              )}
                              {details.itemCount > 1 && (
                                <div>
                                  <p className="text-[10px] text-gray-400">Items</p>
                                  <p className="text-xs font-medium text-gray-700">{details.itemCount} services</p>
                                </div>
                              )}
                            </div>

                            {/* Footer with dates */}
                            <div className="flex justify-between items-center text-[10px] text-gray-400 pt-2 border-t border-gray-200/30">
                              <span>Requested: {formatDate(request.created_at)}</span>
                              <span className="font-mono text-gray-500">#{request.id?.slice(0, 8)}</span>
                            </div>
                          </div>
                        );
                      })}
                      {userRequests.length > 5 && (
                        <button
                          onClick={() => setActiveCategory && setActiveCategory('requests')}
                          className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors text-center"
                        >
                          See all {userRequests.length} requests →
                        </button>
                      )}
                      {userRequests.length <= 5 && setActiveCategory && (
                        <button
                          onClick={() => setActiveCategory('requests')}
                          className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors text-center"
                        >
                          View all requests →
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">No active requests</p>
                  )}
                </div>
              </div>
            </div>

            {/* PVCX Token Section */}
            <div className="bg-white/15 backdrop-blur-xl border border-gray-300/50 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('pvcx')}
                className="w-full p-3 flex items-center justify-between hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">$PVCX Tokens</span>
                  {pvcxData.balance > 0 && (
                    <span className="px-2 py-0.5 bg-black text-white rounded-full text-xs">
                      {pvcxData.balance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
                <Plus className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${activeSection === 'pvcx' ? 'rotate-45' : ''}`} />
              </button>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${activeSection === 'pvcx' ? 'max-h-[400px]' : 'max-h-0'}`}>
                <div className="p-4 bg-white/10 space-y-3">
                  {/* Total Balance */}
                  <div className="py-3 px-3 bg-white/5 rounded-lg border border-gray-200/30">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">Total Balance</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-medium text-gray-900">
                          {pvcxData.balance.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                        </p>
                        <p className="text-xs text-gray-500">$PVCX</p>
                      </div>
                    </div>
                  </div>

                  {/* From Bookings */}
                  <div className="py-3 px-3 bg-white/5 rounded-lg border border-gray-200/30">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">From Bookings</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {pvcxData.earned_from_bookings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* From CO₂ Certificates */}
                  <div className="py-3 px-3 bg-white/5 rounded-lg border border-gray-200/30">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">From CO₂ Certificates</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {pvcxData.earned_from_co2.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {pvcxData.balance === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">
                      Earn $PVCX tokens by completing bookings and purchasing CO₂ certificates
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Wallet Card */}
            <div className="bg-white/15 backdrop-blur-xl border border-gray-300/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Wallet</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Connected Wallet</span>
                  {isConnected && address ? (
                    <span className="text-xs font-mono text-gray-900">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">Not connected</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Network</span>
                  {isConnected && chainId ? (
                    <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-900">
                      {chainId === base.id ? 'Base' : chainId === mainnet.id ? 'Ethereum' : `Chain ${chainId}`}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">-</span>
                  )}
                </div>
                {!isConnected && (
                  <button
                    onClick={() => open()}
                    className="w-full py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition-all"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>

            {/* Support Section */}
            <div className="bg-white/15 backdrop-blur-xl border border-gray-300/50 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('support')}
                className="w-full p-3 flex items-center justify-between hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Support</span>
                </div>
                <Plus className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${activeSection === 'support' ? 'rotate-45' : ''}`} />
              </button>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${activeSection === 'support' ? 'max-h-96' : 'max-h-0'}`}>
                <div className="p-4 bg-white/10">
                  <p className="text-sm text-gray-500 mb-2">Support available 24/7</p>
                  <button
                    onClick={() => setShowSupportModal(true)}
                    className="w-full py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition-all"
                  >
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Subscription Card - Minimalistic */}
            <div className="bg-white/15 backdrop-blur-xl border border-gray-300/50 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Subscription</span>
                </div>
                {subscriptionData?.tier && subscriptionData?.status === 'active' && (
                  <div className="px-2 py-0.5 bg-white/60 rounded-full border border-gray-200/50">
                    <span className="text-[10px] font-medium text-gray-700 uppercase">
                      {subscriptionData.tier === 'elite' ? 'Elite Club' : subscriptionData.tier}
                    </span>
                  </div>
                )}
              </div>

              {loadingSubscription ? (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading...
                </div>
              ) : subscriptionData?.tier && subscriptionData?.status === 'active' ? (
                <div className="space-y-2">
                  {/* Chat Usage */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Chats</span>
                    <span className="text-xs font-medium text-gray-900">
                      {subscriptionData.unlimited ? '∞' : `${subscriptionData.chatsUsed}/${subscriptionData.chatsLimit}`}
                    </span>
                  </div>

                  {/* Progress Bar (if not unlimited) */}
                  {!subscriptionData.unlimited && subscriptionData.chatsLimit > 0 && (
                    <div className="w-full bg-gray-200/60 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          (subscriptionData.chatsUsed / subscriptionData.chatsLimit) >= 0.9
                            ? 'bg-red-500'
                            : (subscriptionData.chatsUsed / subscriptionData.chatsLimit) >= 0.7
                              ? 'bg-amber-500'
                              : 'bg-gray-500'
                        }`}
                        style={{ width: `${Math.min(100, (subscriptionData.chatsUsed / subscriptionData.chatsLimit) * 100)}%` }}
                      />
                    </div>
                  )}

                  {/* Messages per Chat */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Msgs/Chat</span>
                    <span className="text-xs font-medium text-gray-900">
                      {subscriptionData.messagesPerChat}
                    </span>
                  </div>

                  {/* Billing Period - Started */}
                  {subscriptionData.currentPeriodStart && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Started</span>
                      <span className="text-xs font-medium text-gray-700">
                        {new Date(subscriptionData.currentPeriodStart).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}

                  {/* Renewal Date */}
                  {subscriptionData.currentPeriodEnd && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Renews</span>
                      <span className="text-xs font-medium text-emerald-600">
                        {new Date(subscriptionData.currentPeriodEnd).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}

                  {/* Manage Link */}
                  <button
                    onClick={() => setActiveCategory && setActiveCategory('subscriptions')}
                    className="w-full mt-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center gap-1"
                  >
                    Manage Subscription
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">No active subscription</p>
                  <button
                    onClick={() => setActiveCategory && setActiveCategory('subscriptions')}
                    className="w-full py-2 bg-white/60 hover:bg-white/80 text-gray-700 rounded-lg text-xs font-medium transition-all border border-gray-200/50"
                    style={{ backdropFilter: 'blur(8px)' }}
                  >
                    View Plans
                  </button>
                </div>
              )}
            </div>

            {/* KYC Badge */}
            <div className="bg-white/15 backdrop-blur-xl border border-gray-300/50 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">KYC Status</span>
                </div>
                <div className={`px-2 py-1 rounded-full ${
                  kycData?.kyc_status === 'verified' ? 'bg-black' : 'bg-gray-300'
                }`}>
                  <span className="text-xs text-white font-medium">
                    {kycData?.kyc_status === 'verified' ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Verification Level</span>
                  <span className="text-xs font-medium text-gray-900">
                    Level {kycData?.verification_level || '0'}
                  </span>
                </div>
                {kycData?.kyc_hash && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Hash</span>
                    <span className="text-xs font-mono text-gray-900">
                      {kycData.kyc_hash.slice(0, 6)}...{kycData.kyc_hash.slice(-4)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Registered Date</span>
                  <span className="text-xs text-gray-900">
                    {formatDate(userProfile?.created_at || user?.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Settings Card */}
            <div className="bg-white/15 backdrop-blur-xl border border-gray-300/50 rounded-xl p-4">
              {/* Client Number Badge */}
              {user?.id && (
                <div className="mb-3 p-2.5 bg-gray-100 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">Client Number</span>
                    <span className="text-sm font-mono font-medium text-gray-900 tracking-wider">
                      {generateClientNumber(user.id)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                {/* Clickable Avatar with Camera Overlay */}
                <div className="relative group">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-600" />
                    )}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  {/* Camera overlay - always visible */}
                  <label className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-black hover:bg-gray-800 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-md border border-white">
                    <Camera className="w-2.5 h-2.5 text-white" />
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleAvatarChange}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user?.name || user?.email?.split('@')[0] || 'User'}
                  </h3>
                  <p className="text-xs text-gray-500">{user?.email || 'No email'}</p>
                </div>
              </div>

              <button
                onClick={handleOpenEditProfile}
                className="w-full mt-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-900 transition-all"
              >
                Edit Profile
              </button>

              <button
                onClick={onLogout}
                className="w-full mt-2 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-medium text-red-600 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>

            {/* NFT Memberships Section */}
            <div className="bg-white/15 backdrop-blur-xl border border-gray-300/50 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('nft')}
                className="w-full p-3 flex items-center justify-between hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">NFT Memberships</span>
                  {nftCount > 0 && (
                    <span className="px-2 py-0.5 bg-black text-white rounded-full text-xs">
                      {nftCount}
                    </span>
                  )}
                </div>
                <Plus className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${activeSection === 'nft' ? 'rotate-45' : ''}`} />
              </button>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${activeSection === 'nft' ? 'max-h-[500px]' : 'max-h-0'}`}>
                <div className="p-4 bg-white/10 space-y-4">
                  {/* NFTs Owned Counter */}
                  <div className="flex justify-between items-center py-2 px-3 bg-white/5 rounded-lg border border-gray-200/30">
                    <span className="text-xs text-gray-500">NFTs Owned</span>
                    <span className="text-sm font-medium text-gray-900">{nftCount}</span>
                  </div>

                  {/* Show owned NFTs if any */}
                  {nftCount > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">Your membership NFTs are detected in your wallet</p>
                      {investments.slice(0, 5).map((inv) => (
                        <div key={inv.id} className="flex justify-between items-center py-2 border-b border-gray-200/30 last:border-0">
                          <span className="text-sm text-gray-900">
                            {inv.launchpad_projects?.name || 'Membership NFT'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {inv.token_amount || 1} NFT{(inv.token_amount || 1) > 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-sm text-gray-500 mb-3">No membership NFTs detected</p>
                      <p className="text-xs text-gray-400 mb-3">Get exclusive benefits with a PrivateCharterX membership NFT</p>
                    </div>
                  )}

                  {/* OpenSea Link */}
                  <a
                    href="https://opensea.io/collection/privatecharterx-membership-card"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {nftCount > 0 ? 'View on OpenSea' : 'Buy Membership NFT'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Cards - Only show when wallet is connected */}
        {isConnected && balances.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {balances.map((item) => (
              <div
                key={`${item.symbol}-${item.chain}`}
                className="bg-white/15 backdrop-blur-xl border border-gray-300/50 rounded-xl p-4 hover:bg-white/20 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">{item.symbol}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-black">{item.symbol}</h3>
                      <p className="text-xs text-gray-400">{item.name}</p>
                    </div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    item.change > 0 ? 'bg-gray-100 text-gray-600' :
                    item.change < 0 ? 'bg-gray-100 text-gray-600' :
                    'bg-gray-50 text-gray-400'
                  }`}>
                    {item.change > 0 ? '+' : ''}{item.change}%
                  </div>
                </div>

                <div>
                  <p className="text-xl font-light text-black mb-1">
                    ${item.value.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {item.balance.toLocaleString('de-DE', { minimumFractionDigits: 4 })} {item.symbol}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chart Overview - Only show when wallet is connected */}
        {isConnected && balances.length > 0 && (
          <div className="bg-white/15 backdrop-blur-xl border border-gray-300/50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-light text-gray-900 mb-6">Distribution</h3>

            {/* Donut Chart */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={balances.map(b => ({ name: b.symbol, value: b.value }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {balances.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={['#000000', '#404040', '#808080', '#A0A0A0'][index]}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <p className="text-xs text-gray-400 mb-1">Total</p>
                  <p className="text-xl font-light text-black">
                    ${(totalValue / 1000).toFixed(0)}k
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {balances.map((item) => {
                const percentage = (item.value / totalValue * 100);
                const barWidth = (item.value / maxValue * 100);

                return (
                  <div key={`${item.symbol}-${item.chain}`} className="group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-600">{item.symbol}</span>
                      <span className="text-xs text-gray-400">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-gray-800 rounded-full transition-all duration-500 group-hover:bg-black"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="text-xs text-gray-400">
                        {item.balance.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </span>
                      <span className="text-xs font-medium text-gray-600">
                        ${item.value.toLocaleString('de-DE', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Assets</p>
            <p className="text-xl font-light text-black">{isConnected ? balances.length : 0}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Requests</p>
            <p className="text-xl font-light text-black">{userRequests.length}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">NFTs</p>
            <p className="text-xl font-light text-black">{nftCount}</p>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-medium text-gray-900">Edit Profile</h2>
              <button
                onClick={() => setShowEditProfile(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Profile Avatar Upload */}
              <div className="flex flex-col items-center pb-4 border-b border-gray-100">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    {(avatarPreview || avatarUrl) ? (
                      <img
                        src={avatarPreview || avatarUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-gray-500" />
                    )}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-black hover:bg-gray-800 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-lg">
                    <Camera className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleAvatarChange}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-3">Click camera icon to upload photo</p>
                <p className="text-[10px] text-gray-300">Max 5MB · JPEG, PNG, WebP, GIF</p>
              </div>

              {/* KYC Info Section (Read-Only) */}
              {kycSubmitted && (editProfileData.first_name || editProfileData.last_name) && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-2">From KYC Verification (Read-Only)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">First Name</label>
                      <p className="text-sm text-gray-900 font-medium">{editProfileData.first_name || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Last Name</label>
                      <p className="text-sm text-gray-900 font-medium">{editProfileData.last_name || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Email (Read Only) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>

              {/* Editable Fields */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-3">Editable Information</p>

                {/* Phone */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editProfileData.phone}
                    onChange={(e) => setEditProfileData({ ...editProfileData, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>

                {/* Address */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Address
                  </label>
                  <input
                    type="text"
                    value={editProfileData.address}
                    onChange={(e) => setEditProfileData({ ...editProfileData, address: e.target.value })}
                    placeholder="Enter your street address"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>

                {/* City and Country Row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* City */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      value={editProfileData.city}
                      onChange={(e) => setEditProfileData({ ...editProfileData, city: e.target.value })}
                      placeholder="City"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Country
                    </label>
                    <input
                      type="text"
                      value={editProfileData.country}
                      onChange={(e) => setEditProfileData({ ...editProfileData, country: e.target.value })}
                      placeholder="Country"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowEditProfile(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="flex-1 py-2.5 bg-black hover:bg-gray-800 disabled:bg-gray-400 rounded-lg text-sm font-medium text-white transition-colors"
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Inquiry Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Close button */}
            <button
              onClick={() => {
                setShowSupportModal(false);
                setSupportSent(false);
                setSupportMessage('');
              }}
              className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            {/* Modal Content */}
            <div className="p-6">
              {supportSent ? (
                // Success State
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Request Sent!</h3>
                  <p className="text-gray-600">
                    Thank you for reaching out. We'll get back to you shortly.
                  </p>
                </div>
              ) : (
                // Form State
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                      <Headphones className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Contact Support</h3>
                      <p className="text-sm text-gray-500">We'll respond within 24 hours</p>
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What do you need help with?
                    </label>
                    <select
                      value={supportCategory}
                      onChange={(e) => setSupportCategory(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="booking">Booking Issue</option>
                      <option value="payment">Payment / Billing</option>
                      <option value="account">Account Settings</option>
                      <option value="technical">Technical Problem</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Message Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Describe your issue
                    </label>
                    <textarea
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder="Please describe how we can help you..."
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSupportSubmit}
                    disabled={!supportMessage.trim() || sendingSupport}
                    className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {sendingSupport ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Support Inquiry
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    We'll contact you at {user?.email}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
