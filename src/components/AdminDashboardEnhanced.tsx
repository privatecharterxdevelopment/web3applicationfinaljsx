import React, { useEffect, useState } from "react";
import {
  Users, FileText, Calendar, Package, Plane, Gift, Wallet, Search,
  MessageSquare, Bell, Rocket, Building2, Coins, TrendingUp,
  Send, CheckCircle, XCircle, Clock, AlertCircle, DollarSign,
  ExternalLink, Eye, Edit, Trash2, Plus, Filter, Download,
  ShieldCheck, Image, Car, Bot, Flag, RefreshCw, LogOut, Wine, Cigarette,
  Crown, Award
} from "lucide-react";
import { supabase } from "../lib/supabase";

// Navigation structure with all sections
const navSections = [
  {
    id: "web3",
    label: "Web3 & DeFi",
    items: [
      { id: "launchpad_projects", label: "Launchpad Projects", icon: Rocket },
      { id: "launchpad_waitlist", label: "Waitlist", icon: Users },
      { id: "sto_investments", label: "STO Investments", icon: TrendingUp },
      { id: "sto_listings", label: "P2P Listings", icon: Coins },
      { id: "tokenization_services", label: "Tokenization Requests", icon: FileText },
      { id: "nfts", label: "NFTs", icon: Image },
      { id: "nft_benefits", label: "NFT Benefits", icon: Crown },
    ]
  },
  {
    id: "services",
    label: "Services",
    items: [
      { id: "spv_formations", label: "SPV Formations", icon: Building2 },
      { id: "support_tickets", label: "Support Tickets", icon: MessageSquare },
      { id: "booking_requests", label: "Bookings", icon: Calendar },
      { id: "user_requests", label: "User Requests", icon: FileText },
      { id: "chat_conversations", label: "AI Chat Support", icon: Bot },
      { id: "chat_reports", label: "Reported Issues", icon: Flag },
      { id: "taxi_bookings", label: "Taxi/Concierge", icon: Car },
    ]
  },
  {
    id: "marketplace",
    label: "Marketplace",
    items: [
      { id: "emptylegs", label: "Empty Legs", icon: Plane },
      { id: "fixed_offers", label: "Fixed Offers", icon: Gift },
    ]
  },
  {
    id: "inventory",
    label: "Inventory",
    items: [
      { id: "wines", label: "Wines", icon: Wine },
      { id: "cigars", label: "Premium Cigars", icon: Cigarette },
    ]
  },
  {
    id: "management",
    label: "Management",
    items: [
      { id: "users", label: "Users", icon: Users },
      { id: "kyc", label: "KYC Verification", icon: ShieldCheck },
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "wallet", label: "Wallet Transactions", icon: Wallet },
    ]
  }
];

export default function AdminDashboardEnhanced() {
  const [activeSection, setActiveSection] = useState("web3");
  const [activeTab, setActiveTab] = useState("launchpad_projects");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // State for all data
  const [users, setUsers] = useState([]);
  const [launchpadProjects, setLaunchpadProjects] = useState([]);
  const [launchpadWaitlist, setLaunchpadWaitlist] = useState([]);
  const [stoInvestments, setStoInvestments] = useState([]);
  const [stoListings, setStoListings] = useState([]);
  const [tokenizationServices, setTokenizationServices] = useState([]);
  const [spvFormations, setSpvFormations] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [emptylegs, setEmptylegs] = useState([]);
  const [fixedOffers, setFixedOffers] = useState([]);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [kycApplications, setKycApplications] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [nftBenefits, setNftBenefits] = useState([]);
  const [chatConversations, setChatConversations] = useState([]);
  const [chatReports, setChatReports] = useState([]);
  const [taxiBookings, setTaxiBookings] = useState([]);
  const [wines, setWines] = useState([]);
  const [cigars, setCigars] = useState([]);

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showNftBenefitModal, setShowNftBenefitModal] = useState(false);
  const [newNftBenefit, setNewNftBenefit] = useState({
    user_id: '',
    nft_token_id: '',
    benefit_type: 'free_empty_leg',
    service_name: '',
    service_value: 0,
    wallet_address: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all tables in parallel
      const [
        usersData,
        projectsData,
        waitlistData,
        investmentsData,
        listingsData,
        tokenizationData,
        spvData,
        ticketsData,
        bookingsData,
        requestsData,
        emptylegsData,
        offersData,
        walletsData,
        notificationsData,
        kycData,
        nftsData,
        nftBenefitsData,
        chatData,
        chatReportsData,
        taxiData,
        winesData,
        cigarsData
      ] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('launchpad_projects').select('*').order('created_at', { ascending: false }),
        supabase.from('launchpad_waitlist').select('*, project:launchpad_projects(name)').order('created_at', { ascending: false }),
        supabase.from('sto_investments').select('*, user:user_id(email), asset:asset_id(*)').order('created_at', { ascending: false }),
        supabase.from('sto_listings').select('*, seller:seller_id(email), asset:asset_id(*)').order('created_at', { ascending: false }),
        supabase.from('tokenization_drafts').select('*').order('updated_at', { ascending: false }),
        supabase.from('spv_formations').select('*').order('created_at', { ascending: false }),
        supabase.from('support_tickets').select('*').order('created_at', { ascending: false }),
        supabase.from('booking_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('user_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('emptylegs').select('*').order('created_at', { ascending: false }),
        supabase.from('fixed_offers').select('*').order('created_at', { ascending: false }),
        supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('kyc_applications').select('*, users:user_id(email, first_name, last_name)').order('created_at', { ascending: false }),
        supabase.from('nfts').select('*, owner:owner_id(email)').order('created_at', { ascending: false }),
        supabase.from('nft_benefits_used').select('*, user:user_id(email, first_name, last_name)').order('used_at', { ascending: false }),
        supabase.from('chat_conversations').select('*, user:user_id(email, first_name, last_name)').order('updated_at', { ascending: false }).limit(100),
        supabase.from('chat_reports').select('*, user:user_id(email), conversation:conversation_id(title)').order('created_at', { ascending: false }),
        supabase.from('taxi_bookings').select('*, user:user_id(email, first_name, last_name)').order('created_at', { ascending: false }),
        supabase.from('wines').select('*').order('name', { ascending: true }),
        supabase.from('premium_cigars').select('*').order('brand', { ascending: true })
      ]);

      setUsers(usersData.data || []);
      setLaunchpadProjects(projectsData.data || []);
      setLaunchpadWaitlist(waitlistData.data || []);
      setStoInvestments(investmentsData.data || []);
      setStoListings(listingsData.data || []);
      setTokenizationServices(tokenizationData.data || []);
      setSpvFormations(spvData.data || []);
      setSupportTickets(ticketsData.data || []);
      setBookingRequests(bookingsData.data || []);
      setUserRequests(requestsData.data || []);
      setEmptylegs(emptylegsData.data || []);
      setFixedOffers(offersData.data || []);
      setWalletTransactions(walletsData.data || []);
      setNotifications(notificationsData.data || []);
      setKycApplications(kycData.data || []);
      setNfts(nftsData.data || []);
      setNftBenefits(nftBenefitsData.data || []);
      setChatConversations(chatData.data || []);
      setChatReports(chatReportsData.data || []);
      setTaxiBookings(taxiData.data || []);
      setWines(winesData.data || []);
      setCigars(cigarsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenizationApproval = async (tokenization, newStatus) => {
    try {
      const isApproval = newStatus === 'approved';
      const now = new Date();

      // Calculate timeline dates based on token type
      let updateData = {
        status: newStatus,
        updated_at: now.toISOString()
      };

      if (isApproval) {
        const isUTO = tokenization.token_type === 'utility';
        const estimatedDays = isUTO ? 14 : (tokenization.estimated_launch_days || 21); // Default to 21 for STO if not set

        // For UTOs: waitlist opens 24h after approval
        const waitlistDate = new Date(now);
        waitlistDate.setHours(waitlistDate.getHours() + 24);

        // Launch date is estimated days from approval
        const launchDate = new Date(now);
        launchDate.setDate(launchDate.getDate() + estimatedDays);

        updateData = {
          ...updateData,
          approved_at: now.toISOString(),
          waitlist_opens_at: isUTO ? waitlistDate.toISOString() : null,
          marketplace_launch_at: launchDate.toISOString(),
          estimated_launch_days: estimatedDays
        };
      }

      // Update tokenization status
      const { error: updateError } = await supabase
        .from('tokenization_drafts')
        .update(updateData)
        .eq('id', tokenization.id);

      if (updateError) throw updateError;

      // Send notification to user
      const tokenType = tokenization.token_type === 'utility' ? 'UTO' : 'STO';
      const notificationMessage = isApproval
        ? `Great news! Your ${tokenType} tokenization request for "${tokenization.asset_name}" has been approved. ${tokenization.token_type === 'utility' ? 'Waitlist opens in 24 hours. Launch date: ' + new Date(updateData.marketplace_launch_at).toLocaleDateString() : 'Estimated launch: ' + (updateData.estimated_launch_days || 21) + ' days'}.`
        : `Your tokenization request for "${tokenization.asset_name}" has been rejected. Please contact support for more information.`;

      await supabase
        .from('notifications')
        .insert({
          user_id: tokenization.user_id,
          type: isApproval ? 'tokenization_approved' : 'tokenization_rejected',
          title: `${tokenType} Request ${isApproval ? 'Approved' : 'Rejected'}`,
          message: notificationMessage,
          metadata: {
            tokenization_id: tokenization.id,
            asset_name: tokenization.asset_name,
            token_type: tokenization.token_type,
            status: newStatus,
            ...(isApproval && {
              approved_at: updateData.approved_at,
              waitlist_opens_at: updateData.waitlist_opens_at,
              marketplace_launch_at: updateData.marketplace_launch_at,
              estimated_launch_days: updateData.estimated_launch_days
            })
          },
          is_read: false
        });

      // Refresh data
      await fetchAllData();
      alert(`Tokenization ${isApproval ? 'approved' : 'rejected'} successfully!`);
    } catch (error) {
      console.error('Error updating tokenization:', error);
      alert('Failed to update tokenization status');
    }
  };

  const handleStatusUpdate = async (table, id, status) => {
    try {
      const { error } = await supabase
        .from(table)
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      // Refresh data
      await fetchAllData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleSendPaymentLink = async (userId, requestId, amount, currency, paymentUrl, description) => {
    try {
      const { data, error } = await supabase.rpc('send_payment_link_notification', {
        p_user_id: userId,
        p_request_id: requestId,
        p_amount: amount,
        p_currency: currency,
        p_payment_url: paymentUrl,
        p_description: description
      });

      if (error) throw error;

      alert('Payment link sent successfully!');
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Error sending payment link:', error);
      alert('Failed to send payment link');
    }
  };

  const handleSendNotification = async (userId, type, title, message, actionUrl) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          action_url: actionUrl,
          is_read: false
        });

      if (error) throw error;

      alert('Notification sent successfully!');
      setShowNotificationModal(false);
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    }
  };

  // NFT Benefit status update
  const handleNftBenefitStatusUpdate = async (benefitId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('nft_benefits_used')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', benefitId);

      if (error) throw error;

      // Refresh data
      await fetchAllData();
      alert(`Benefit marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating NFT benefit status:', error);
      alert('Failed to update benefit status');
    }
  };

  // Add new NFT benefit usage
  const handleAddNftBenefit = async () => {
    try {
      if (!newNftBenefit.user_id || !newNftBenefit.nft_token_id) {
        alert('Please fill in all required fields');
        return;
      }

      const { error } = await supabase
        .from('nft_benefits_used')
        .insert({
          user_id: newNftBenefit.user_id,
          nft_token_id: newNftBenefit.nft_token_id,
          wallet_address: newNftBenefit.wallet_address,
          benefit_type: newNftBenefit.benefit_type,
          service_name: newNftBenefit.service_name || null,
          service_value: newNftBenefit.service_value || null,
          status: 'pending',
          used_at: new Date().toISOString()
        });

      if (error) throw error;

      // Reset form and close modal
      setNewNftBenefit({
        user_id: '',
        nft_token_id: '',
        benefit_type: 'free_empty_leg',
        service_name: '',
        service_value: 0,
        wallet_address: ''
      });
      setShowNftBenefitModal(false);

      // Refresh data
      await fetchAllData();
      alert('NFT benefit usage recorded successfully');
    } catch (error) {
      console.error('Error adding NFT benefit:', error);
      alert('Failed to record NFT benefit usage');
    }
  };

  // KYC verification toggle - updates both kyc_applications and users table
  const handleKYCVerification = async (userId: string, kycId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
      const isVerifying = newStatus === 'approved';

      // Update KYC application status
      const { error: kycError } = await supabase
        .from('kyc_applications')
        .update({
          status: newStatus,
          reviewed_at: isVerifying ? new Date().toISOString() : null
        })
        .eq('id', kycId);

      if (kycError) throw kycError;

      // Update user's email_verified status (this activates the green badge)
      const { error: userError } = await supabase
        .from('users')
        .update({ email_verified: isVerifying })
        .eq('id', userId);

      if (userError) throw userError;

      // Also update user_profiles if exists
      await supabase
        .from('user_profiles')
        .update({ is_verified: isVerifying })
        .eq('user_id', userId);

      // Send notification to user
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: isVerifying ? 'kyc_approved' : 'kyc_revoked',
          title: isVerifying ? 'KYC Verified!' : 'KYC Status Changed',
          message: isVerifying
            ? 'Congratulations! Your identity has been verified. You now have access to all premium features.'
            : 'Your KYC verification status has been changed. Please contact support for more information.',
          is_read: false
        });

      // Refresh data
      await fetchAllData();
      alert(`KYC ${isVerifying ? 'approved' : 'revoked'} successfully!`);
    } catch (error) {
      console.error('Error updating KYC status:', error);
      alert('Failed to update KYC status');
    }
  };

  // Toggle user verification directly from users list
  const handleUserVerificationToggle = async (userId: string, currentVerified: boolean) => {
    try {
      const newVerified = !currentVerified;

      // Update user's verification status
      const { error: userError } = await supabase
        .from('users')
        .update({ email_verified: newVerified })
        .eq('id', userId);

      if (userError) throw userError;

      // Also update user_profiles if exists
      await supabase
        .from('user_profiles')
        .update({ is_verified: newVerified })
        .eq('user_id', userId);

      // Update or create KYC application
      if (newVerified) {
        // Check if KYC application exists
        const { data: existingKyc } = await supabase
          .from('kyc_applications')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (existingKyc) {
          await supabase
            .from('kyc_applications')
            .update({ status: 'approved', reviewed_at: new Date().toISOString() })
            .eq('user_id', userId);
        }
      }

      // Refresh data
      await fetchAllData();
    } catch (error) {
      console.error('Error toggling verification:', error);
      alert('Failed to toggle verification');
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'confirmed':
      case 'approved':
      case 'active':
      case 'solved':
      case 'closed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
      case 'upcoming':
      case 'open':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'rejected':
      case 'cancelled':
      case 'expired':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'hold':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const filter = (arr, fields) => {
    const term = searchTerm.toLowerCase();
    if (!term) return arr;
    return arr.filter((item) =>
      fields.some((field) => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], item);
        return value?.toString().toLowerCase().includes(term);
      })
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "launchpad_projects":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light text-gray-900">Launchpad Projects ({launchpadProjects.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filter(launchpadProjects, ['name', 'symbol', 'category', 'status']).map((project) => (
                <div
                  key={project.id}
                  className="border border-gray-300/50 rounded-xl p-4 bg-white/35 hover:bg-white/40 transition-colors"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{project.name}</h3>
                    <span className={getStatusBadge(project.status)}>{project.status}</span>
                  </div>
                  {project.logo_url && (
                    <img src={project.logo_url} alt={project.name} className="w-16 h-16 object-cover rounded-lg mb-3" />
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Symbol</span>
                      <span className="font-medium">{project.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category</span>
                      <span className="capitalize">{project.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Goal</span>
                      <span className="font-medium text-green-600">${project.funding_goal?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Waitlist</span>
                      <span>{project.current_waitlist || 0} users</span>
                    </div>
                  </div>
                  {project.status === 'pending_approval' && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate('launchpad_projects', project.id, 'active')}
                        className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate('launchpad_projects', project.id, 'rejected')}
                        className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "launchpad_waitlist":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light text-gray-900">Launchpad Waitlist ({launchpadWaitlist.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filter(launchpadWaitlist, ['project.name', 'user_id']).map((entry) => (
                <div
                  key={entry.id}
                  className="border border-gray-300/50 rounded-xl p-4 bg-white/35"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Project</span>
                      <span className="font-medium">{entry.project?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">User ID</span>
                      <span className="font-mono text-xs">{entry.user_id?.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Joined</span>
                      <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "sto_investments":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light text-gray-900">STO Investments ({stoInvestments.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filter(stoInvestments, ['user.email', 'status', 'wallet_address']).map((investment) => (
                <div
                  key={investment.id}
                  className="border border-gray-300/50 rounded-xl p-4 bg-white/35"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 text-sm">Investment</h3>
                    <span className={getStatusBadge(investment.status)}>{investment.status}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Investor</span>
                      <span className="text-xs">{investment.user?.email?.slice(0, 20)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shares</span>
                      <span className="font-medium">{investment.shares_purchased}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount</span>
                      <span className="font-medium text-green-600">${investment.investment_amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wallet</span>
                      <span className="font-mono text-xs">{investment.wallet_address?.slice(0, 10)}...</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "sto_listings":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light text-gray-900">P2P Marketplace Listings ({stoListings.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filter(stoListings, ['seller.email', 'status']).map((listing) => (
                <div
                  key={listing.id}
                  className="border border-gray-300/50 rounded-xl p-4 bg-white/35"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 text-sm">Listing</h3>
                    <span className={getStatusBadge(listing.status)}>{listing.status}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Seller</span>
                      <span className="text-xs">{listing.seller?.email?.slice(0, 20)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shares</span>
                      <span className="font-medium">{listing.shares_for_sale}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price/Share</span>
                      <span className="font-medium">${listing.price_per_share}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Value</span>
                      <span className="font-medium text-green-600">${listing.total_value?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "tokenization_services":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light text-gray-900">Tokenization Requests ({tokenizationServices.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filter(tokenizationServices, ['asset_name', 'status', 'token_symbol', 'asset_category']).map((service) => (
                <div
                  key={service.id}
                  className="border border-gray-300/50 rounded-xl p-4 bg-white/35"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  {/* Logo/Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {service.logo_url ? (
                        <img src={service.logo_url} alt={service.asset_name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{service.asset_name || 'Untitled'}</h3>
                        {service.token_symbol && (
                          <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">${service.token_symbol}</span>
                        )}
                      </div>
                    </div>
                    <span className={getStatusBadge(service.status)}>{service.status}</span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type</span>
                      <span className="capitalize font-medium">{service.token_type || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category</span>
                      <span>{service.asset_category || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Supply</span>
                      <span>{service.total_supply?.toLocaleString() || 'N/A'}</span>
                    </div>
                    {service.price_per_token && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price/Token</span>
                        <span className="font-medium text-green-600">${parseFloat(service.price_per_token).toLocaleString()}</span>
                      </div>
                    )}
                    {service.issuer_wallet_address && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Issuer Wallet</span>
                        <span className="text-xs font-mono">{service.issuer_wallet_address.slice(0, 6)}...{service.issuer_wallet_address.slice(-4)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Submitted</span>
                      <span>{service.submitted_at ? new Date(service.submitted_at).toLocaleDateString() : 'Draft'}</span>
                    </div>
                  </div>

                  {/* Timeline for Approved Tokenizations */}
                  {service.status === 'approved' && service.marketplace_launch_at && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-xs font-medium text-gray-900 mb-2">Timeline</div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Approved</span>
                          <span className="text-green-600 font-medium">{new Date(service.approved_at).toLocaleDateString()}</span>
                        </div>
                        {service.waitlist_opens_at && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Waitlist Opens</span>
                            <span className="text-blue-600 font-medium">{new Date(service.waitlist_opens_at).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Launch Date</span>
                          <span className="text-purple-600 font-medium">{new Date(service.marketplace_launch_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {service.status === 'submitted' && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleTokenizationApproval(service, 'approved')}
                        className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleTokenizationApproval(service, 'rejected')}
                        className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-3 h-3" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "spv_formations":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light text-gray-900">SPV Formations ({spvFormations.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filter(spvFormations, ['jurisdiction', 'tier', 'status']).map((spv) => (
                <div
                  key={spv.id}
                  className="border border-gray-300/50 rounded-xl p-4 bg-white/35"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{spv.jurisdiction}</h3>
                    <span className={getStatusBadge(spv.status)}>{spv.status}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tier</span>
                      <span className="uppercase font-medium">{spv.tier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Formation Fee</span>
                      <span className="font-medium">${spv.jurisdiction_formation_fee?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Annual Fee</span>
                      <span>${spv.jurisdiction_annual_fee?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created</span>
                      <span>{new Date(spv.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {spv.status === 'pending' && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate('spv_formations', spv.id, 'in_progress')}
                        className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        Start Process
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "support_tickets":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light text-gray-900">Support Tickets ({supportTickets.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filter(supportTickets, ['subject', 'status', 'priority']).map((ticket) => (
                <div
                  key={ticket.id}
                  className="border border-gray-300/50 rounded-xl p-4 bg-white/35"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{ticket.subject}</h3>
                    <span className={getStatusBadge(ticket.status)}>{ticket.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priority</span>
                      <span className={`capitalize ${
                        ticket.priority === 'urgent' ? 'text-red-600 font-medium' :
                        ticket.priority === 'high' ? 'text-orange-600' : 'text-gray-900'
                      }`}>{ticket.priority}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created</span>
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                    {ticket.zendesk_ticket_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Zendesk #</span>
                        <span className="font-mono text-xs">{ticket.zendesk_ticket_id}</span>
                      </div>
                    )}
                  </div>
                  {ticket.status === 'pending' || ticket.status === 'open' ? (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate('support_tickets', ticket.id, 'solved')}
                        className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                      >
                        Mark Solved
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        );

      case "booking_requests":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light text-gray-900">Booking Requests ({bookingRequests.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filter(bookingRequests, ['request_type', 'origin', 'destination', 'status']).map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-300/50 rounded-xl p-4 bg-white/35"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 capitalize">{booking.request_type}</h3>
                    <span className={getStatusBadge(booking.status)}>{booking.status}</span>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm font-medium text-gray-900">{booking.origin}</span>
                    <Plane className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{booking.destination}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Passengers</span>
                      <span>{booking.passengers}</span>
                    </div>
                    {booking.departure_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Departure</span>
                        <span>{new Date(booking.departure_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {booking.estimated_price && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Est. Price</span>
                        <span className="font-medium text-green-600">${booking.estimated_price?.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  {booking.status === 'pending' && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate('booking_requests', booking.id, 'confirmed')}
                        className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(booking);
                          setShowPaymentModal(true);
                        }}
                        className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        Send Payment
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "user_requests":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light text-gray-900">User Requests ({userRequests.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filter(userRequests, ['type', 'status', 'service_type', 'data']).map((request) => {
                // Parse request data
                let requestData = request.data || {};
                if (typeof requestData === 'string') {
                  try { requestData = JSON.parse(requestData); } catch (e) { requestData = {}; }
                }

                const isSupportInquiry = request.type === 'support_inquiry';
                const userName = requestData.user_name || requestData.name || 'Unknown';
                const userEmail = requestData.user_email || requestData.email || '';
                const userPhone = requestData.user_phone || requestData.phone || '';
                const message = requestData.message || requestData.notes || '';
                const category = requestData.category || request.service_type || request.type;

                return (
                  <div
                    key={request.id}
                    className="border border-gray-300/50 rounded-xl p-4 bg-white/35"
                    style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {isSupportInquiry && (
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900 capitalize text-sm">
                            {isSupportInquiry ? 'Support Inquiry' : request.type?.replace(/_/g, ' ')}
                          </h3>
                          {category && !isSupportInquiry && (
                            <span className="text-xs text-gray-500 capitalize">{category}</span>
                          )}
                        </div>
                      </div>
                      <span className={getStatusBadge(request.status)}>{request.status}</span>
                    </div>

                    {/* User Info */}
                    <div className="space-y-2 text-sm mb-3">
                      {userName && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name</span>
                          <span className="font-medium">{userName}</span>
                        </div>
                      )}
                      {userEmail && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email</span>
                          <span className="text-xs">{userEmail}</span>
                        </div>
                      )}
                      {userPhone && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone</span>
                          <span>{userPhone}</span>
                        </div>
                      )}
                      {isSupportInquiry && category && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Category</span>
                          <span className="capitalize">{category}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created</span>
                        <span>{new Date(request.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Message */}
                    {message && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Message:</p>
                        <p className="text-sm text-gray-700 line-clamp-3">{message}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {request.status === 'pending' && (
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => handleStatusUpdate('user_requests', request.id, 'confirmed')}
                          className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleStatusUpdate('user_requests', request.id, 'closed')}
                          className="flex-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "emptylegs":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light text-gray-900">Empty Legs ({emptylegs.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filter(emptylegs, ['from', 'to', 'aircraft_type']).map((leg) => (
                <div
                  key={leg.id}
                  className="border border-gray-300/50 rounded-xl p-4 bg-white/35"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="font-medium text-gray-900">{leg.from}</span>
                    <Plane className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{leg.to}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Aircraft</span>
                      <span>{leg.aircraft_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price</span>
                      <span className="font-semibold text-green-600">${leg.price?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Departure</span>
                      <span>{new Date(leg.departure_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "fixed_offers":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light text-gray-900">Fixed Offers ({fixedOffers.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filter(fixedOffers, ['title', 'origin', 'destination']).map((offer) => (
                <div
                  key={offer.id}
                  className="border border-gray-300/50 rounded-xl p-4 bg-white/35"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <h3 className="font-medium text-gray-900 mb-3">{offer.title}</h3>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm text-gray-900">{offer.origin}</span>
                    <Plane className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{offer.destination}</span>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price</span>
                      <span className="font-semibold text-green-600">${offer.price?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "users":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light text-gray-900">Users ({users.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filter(users, ['email', 'user_role', 'first_name', 'last_name']).map((user) => (
                <div
                  key={user.id}
                  className="border border-gray-300/50 rounded-xl p-4 bg-white/35"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      user.email_verified ? 'bg-emerald-100' : 'bg-blue-100'
                    }`}>
                      <span className={`font-medium ${user.email_verified ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {user.first_name && user.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : user.email?.split('@')[0]
                          }
                        </p>
                        {user.email_verified && (
                          <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Role</span>
                      <span className="capitalize">{user.user_role || 'user'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created</span>
                      <span>{new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">KYC Status</span>
                      <button
                        onClick={() => handleUserVerificationToggle(user.id, user.email_verified)}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          user.email_verified
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {user.email_verified ? 'Verified ✓' : 'Not Verified'}
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleUserVerificationToggle(user.id, user.email_verified)}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
                        user.email_verified
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {user.email_verified ? (
                        <>
                          <XCircle className="w-3 h-3" />
                          Revoke KYC
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3 h-3" />
                          Verify KYC
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItem(user);
                        setShowNotificationModal(true);
                      }}
                      className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-3 h-3" />
                      Notify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light text-gray-900">Recent Notifications ({notifications.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filter(notifications, ['title', 'message', 'type']).map((notif) => (
                <div
                  key={notif.id}
                  className="border border-gray-300/50 rounded-xl p-4 bg-white/35"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      notif.is_read ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {notif.is_read ? 'Read' : 'Unread'}
                    </span>
                    <span className="text-xs text-gray-500">{notif.type}</span>
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm mb-2">{notif.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{notif.message}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{new Date(notif.created_at).toLocaleDateString()}</span>
                    <span>{new Date(notif.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "wallet":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light text-gray-900">Wallet Transactions ({walletTransactions.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filter(walletTransactions, ['wallet_address', 'transaction_type', 'status']).map((tx) => (
                <div
                  key={tx.id}
                  className="border border-gray-300/50 rounded-xl p-4 bg-white/35"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 capitalize text-sm">{tx.transaction_type}</h3>
                    <span className={getStatusBadge(tx.status)}>{tx.status}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600 block mb-1">Wallet</span>
                      <p className="font-mono text-xs bg-white/40 p-2 rounded border border-gray-300/30">
                        {tx.wallet_address?.slice(0, 10)}...{tx.wallet_address?.slice(-8)}
                      </p>
                    </div>
                    {tx.blockchain_tx_hash && (
                      <div>
                        <span className="text-gray-600 block mb-1">TX Hash</span>
                        <p className="font-mono text-xs bg-white/40 p-2 rounded border border-gray-300/30 text-blue-600 truncate">
                          {tx.blockchain_tx_hash?.slice(0, 20)}...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "kyc":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light text-gray-900">KYC Verification ({kycApplications.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filter(kycApplications, ['users.email', 'users.first_name', 'status']).map((kyc) => (
                <div
                  key={kyc.id}
                  className="border border-gray-300/50 rounded-xl p-4 bg-white/35"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">
                          {kyc.users?.first_name} {kyc.users?.last_name}
                        </h3>
                        <p className="text-xs text-gray-500">{kyc.users?.email}</p>
                      </div>
                    </div>
                    <span className={getStatusBadge(kyc.status)}>{kyc.status}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Document Type</span>
                      <span className="capitalize">{kyc.document_type || 'ID Card'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Submitted</span>
                      <span>{new Date(kyc.created_at).toLocaleDateString()}</span>
                    </div>
                    {kyc.reviewed_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reviewed</span>
                        <span>{new Date(kyc.reviewed_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    {kyc.status !== 'approved' ? (
                      <button
                        onClick={() => handleKYCVerification(kyc.user_id, kyc.id, kyc.status)}
                        className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Verify User
                      </button>
                    ) : (
                      <button
                        onClick={() => handleKYCVerification(kyc.user_id, kyc.id, kyc.status)}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Revoke Verification
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {kycApplications.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No KYC applications yet
                </div>
              )}
            </div>
          </div>
        );

      case "nfts":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light text-gray-900">NFTs ({nfts.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filter(nfts, ['name', 'collection', 'owner.email']).map((nft) => (
                <div
                  key={nft.id}
                  className="border border-gray-300/50 rounded-xl p-4 bg-white/35"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    {nft.image_url ? (
                      <img src={nft.image_url} alt={nft.name} className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Image className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{nft.name}</h3>
                      <p className="text-xs text-gray-500">{nft.collection || 'PrivateCharterX'}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Token ID</span>
                      <span className="font-mono text-xs">{nft.token_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Owner</span>
                      <span className="text-xs">{nft.owner?.email?.slice(0, 20)}...</span>
                    </div>
                    {nft.tier && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tier</span>
                        <span className="capitalize font-medium">{nft.tier}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Minted</span>
                      <span>{new Date(nft.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              {nfts.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No NFTs minted yet
                </div>
              )}
            </div>
          </div>
        );

      case "nft_benefits":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light text-gray-900">NFT Benefits Tracking ({nftBenefits.length})</h2>
              <button
                onClick={() => setShowNftBenefitModal(true)}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Benefit Usage
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="border border-gray-300/50 rounded-xl p-4 bg-white/35" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                    <Plane className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-medium text-gray-900">
                      {nftBenefits.filter(b => b.benefit_type === 'free_empty_leg').length}
                    </p>
                    <p className="text-xs text-gray-500">Empty Legs Redeemed</p>
                  </div>
                </div>
              </div>
              <div className="border border-gray-300/50 rounded-xl p-4 bg-white/35" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Car className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-medium text-gray-900">
                      {nftBenefits.filter(b => b.benefit_type === 'limousine_transfer').length}
                    </p>
                    <p className="text-xs text-gray-500">Limo Transfers Used</p>
                  </div>
                </div>
              </div>
              <div className="border border-gray-300/50 rounded-xl p-4 bg-white/35" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-medium text-gray-900">
                      {nftBenefits.filter(b => b.benefit_type === 'discount_applied').length}
                    </p>
                    <p className="text-xs text-gray-500">Discounts Applied</p>
                  </div>
                </div>
              </div>
              <div className="border border-gray-300/50 rounded-xl p-4 bg-white/35" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-medium text-gray-900">
                      {new Set(nftBenefits.map(b => b.nft_token_id)).size}
                    </p>
                    <p className="text-xs text-gray-500">Unique NFT Holders</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Table */}
            <div className="border border-gray-300/50 rounded-xl overflow-hidden bg-white/35" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
              <table className="w-full text-sm">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NFT Token ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Benefit Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used At</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {filter(nftBenefits, ['user.email', 'nft_token_id', 'benefit_type', 'service_name']).map((benefit: any) => (
                    <tr key={benefit.id} className="hover:bg-white/20">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{benefit.user?.first_name} {benefit.user?.last_name}</p>
                          <p className="text-xs text-gray-500">{benefit.user?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">#{benefit.nft_token_id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          benefit.benefit_type === 'free_empty_leg' ? 'bg-emerald-100 text-emerald-700' :
                          benefit.benefit_type === 'limousine_transfer' ? 'bg-purple-100 text-purple-700' :
                          benefit.benefit_type === 'discount_applied' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {benefit.benefit_type === 'free_empty_leg' && <Plane className="w-3 h-3" />}
                          {benefit.benefit_type === 'limousine_transfer' && <Car className="w-3 h-3" />}
                          {benefit.benefit_type === 'discount_applied' && <Crown className="w-3 h-3" />}
                          {benefit.benefit_type?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-900">{benefit.service_name || '-'}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {benefit.service_value ? `$${benefit.service_value.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(benefit.used_at).toLocaleDateString()} {new Date(benefit.used_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          benefit.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          benefit.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          benefit.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {benefit.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                          {benefit.status === 'pending' && <Clock className="w-3 h-3" />}
                          {benefit.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                          {benefit.status || 'active'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {benefit.status !== 'completed' && (
                            <button
                              onClick={() => handleNftBenefitStatusUpdate(benefit.id, 'completed')}
                              className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs flex items-center gap-1 hover:bg-emerald-200"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Mark Complete
                            </button>
                          )}
                          {benefit.status !== 'cancelled' && (
                            <button
                              onClick={() => handleNftBenefitStatusUpdate(benefit.id, 'cancelled')}
                              className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs flex items-center gap-1 hover:bg-red-200"
                            >
                              <XCircle className="w-3 h-3" />
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {nftBenefits.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No NFT benefits used yet</p>
                  <p className="text-xs text-gray-400 mt-1">Benefits will appear here when NFT holders redeem them</p>
                </div>
              )}
            </div>
          </div>
        );

      case "chat_conversations":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light text-gray-900">AI Chat Conversations ({chatConversations.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filter(chatConversations, ['title', 'user.email']).map((chat) => (
                <div
                  key={chat.id}
                  className="border border-gray-300/50 rounded-xl p-4 bg-white/35"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{chat.title || 'Untitled Chat'}</h3>
                      <p className="text-xs text-gray-500">{chat.user?.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Messages</span>
                      <span>{chat.message_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Activity</span>
                      <span>{new Date(chat.updated_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created</span>
                      <span>{new Date(chat.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              {chatConversations.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No chat conversations yet
                </div>
              )}
            </div>
          </div>
        );

      case "chat_reports":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light text-gray-900">Reported Issues ({chatReports.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filter(chatReports, ['reason', 'user.email', 'status']).map((report) => (
                <div
                  key={report.id}
                  className="border border-gray-300/50 rounded-xl p-4 bg-white/35"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                        <Flag className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm capitalize">{report.reason || 'Issue Report'}</h3>
                        <p className="text-xs text-gray-500">{report.user?.email}</p>
                      </div>
                    </div>
                    <span className={getStatusBadge(report.status || 'pending')}>{report.status || 'pending'}</span>
                  </div>
                  {report.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{report.description}</p>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reported</span>
                      <span>{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                    {report.conversation?.title && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Chat</span>
                        <span className="text-xs truncate max-w-[120px]">{report.conversation.title}</span>
                      </div>
                    )}
                  </div>
                  {(report.status === 'pending' || !report.status) && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate('chat_reports', report.id, 'resolved')}
                        className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {chatReports.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No reported issues
                </div>
              )}
            </div>
          </div>
        );

      case "taxi_bookings":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light text-gray-900">Taxi/Concierge Bookings ({taxiBookings.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filter(taxiBookings, ['pickup_location', 'dropoff_location', 'user.email', 'status']).map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-300/50 rounded-xl p-4 bg-white/35"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-full flex items-center justify-center">
                        <Car className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">
                          {booking.user?.first_name} {booking.user?.last_name}
                        </h3>
                        <p className="text-xs text-gray-500">{booking.user?.email}</p>
                      </div>
                    </div>
                    <span className={getStatusBadge(booking.status)}>{booking.status}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600 text-xs">Pickup</span>
                      <p className="text-gray-900 truncate">{booking.pickup_location}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 text-xs">Dropoff</span>
                      <p className="text-gray-900 truncate">{booking.dropoff_location}</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date</span>
                      <span>{new Date(booking.pickup_datetime || booking.created_at).toLocaleDateString()}</span>
                    </div>
                    {booking.estimated_price && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Est. Price</span>
                        <span className="font-medium text-green-600">€{booking.estimated_price}</span>
                      </div>
                    )}
                  </div>
                  {booking.status === 'pending' && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate('taxi_bookings', booking.id, 'confirmed')}
                        className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleStatusUpdate('taxi_bookings', booking.id, 'cancelled')}
                        className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {taxiBookings.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No taxi bookings yet
                </div>
              )}
            </div>
          </div>
        );

      case "wines":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light text-gray-900">Wine Inventory ({wines.length})</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  Total Value: €{wines.reduce((sum, w) => sum + (w.typical_price_eur || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filter(wines, ['name', 'producer', 'region', 'country', 'type', 'category']).map((wine) => (
                <div
                  key={wine.id}
                  className="border border-gray-300/50 rounded-xl p-4 bg-white/35"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    {wine.image_url ? (
                      <img src={wine.image_url} alt={wine.name} className="w-16 h-20 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-20 bg-gradient-to-br from-purple-500 to-red-500 rounded-lg flex items-center justify-center">
                        <Wine className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">{wine.name}</h3>
                      {wine.vintage && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{wine.vintage}</span>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{wine.producer}</p>
                    </div>
                    {wine.is_active ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Inactive</span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type</span>
                      <span className="capitalize">{wine.type || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category</span>
                      <span>{wine.category || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Region</span>
                      <span>{wine.region || wine.country || 'N/A'}</span>
                    </div>
                    {wine.classification && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Classification</span>
                        <span className="text-xs">{wine.classification}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price</span>
                      <span className="font-semibold text-green-600">
                        {wine.price_range_eur || (wine.typical_price_eur ? `€${wine.typical_price_eur.toLocaleString()}` : 'On request')}
                      </span>
                    </div>
                    {wine.rating_points && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rating</span>
                        <span className="font-medium">{wine.rating_points} pts</span>
                      </div>
                    )}
                  </div>
                  {wine.tasting_notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600 line-clamp-2">{wine.tasting_notes}</p>
                    </div>
                  )}
                </div>
              ))}
              {wines.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No wines in inventory
                </div>
              )}
            </div>
          </div>
        );

      case "cigars":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light text-gray-900">Premium Cigars Inventory ({cigars.length})</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  Avg. Price: ${cigars.length > 0 ? Math.round(cigars.reduce((sum, c) => sum + (c.price_per_stick_usd || 0), 0) / cigars.length) : 0}/stick
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filter(cigars, ['name', 'brand', 'origin', 'strength']).map((cigar) => (
                <div
                  key={cigar.id}
                  className="border border-gray-300/50 rounded-xl p-4 bg-white/35"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    {cigar.image_url ? (
                      <img src={cigar.image_url} alt={cigar.name} className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-700 to-amber-900 rounded-lg flex items-center justify-center">
                        <Cigarette className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">{cigar.brand}</h3>
                      <p className="text-xs text-gray-600">{cigar.name}</p>
                    </div>
                    {cigar.is_active ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Inactive</span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Origin</span>
                      <span>{cigar.origin || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Strength</span>
                      <span className="capitalize">{cigar.strength || 'N/A'}</span>
                    </div>
                    {cigar.ring_gauge && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ring Gauge</span>
                        <span>{cigar.ring_gauge}</span>
                      </div>
                    )}
                    {cigar.length && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Length</span>
                        <span>{cigar.length}"</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price/Stick</span>
                      <span className="font-semibold text-green-600">
                        {cigar.price_per_stick_usd ? `$${cigar.price_per_stick_usd}` : 'On request'}
                      </span>
                    </div>
                  </div>
                  {cigar.flavor_profile && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">Flavor: {cigar.flavor_profile}</p>
                    </div>
                  )}
                  {cigar.description && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 line-clamp-2">{cigar.description}</p>
                    </div>
                  )}
                </div>
              ))}
              {cigars.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No cigars in inventory
                </div>
              )}
            </div>
          </div>
        );

      default:
        return <div className="text-center text-gray-500 py-12">Select a section from the menu</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Manage all platform operations</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all bg-white text-sm"
              />
            </div>
            <button
              onClick={fetchAllData}
              className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="mb-6 space-y-3">
          {navSections.map((section) => (
            <div key={section.id} className="bg-white rounded-xl border border-gray-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{section.label}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(section.id);
                        setActiveTab(item.id);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === item.id
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
              <span className="text-sm text-gray-600">Loading data...</span>
            </div>
          ) : (
            renderContent()
          )}
        </div>

        {/* Payment Link Modal */}
        {showPaymentModal && selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white/35 rounded-2xl max-w-md w-full p-6 border border-gray-300/50" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Send Payment Link</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-gray-100/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  handleSendPaymentLink(
                    selectedItem.user_id,
                    selectedItem.id,
                    parseFloat(formData.get('amount')),
                    formData.get('currency'),
                    formData.get('payment_url'),
                    formData.get('description')
                  );
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Amount</label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:border-gray-400/50 bg-white/20"
                    style={{ backdropFilter: 'blur(10px)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Currency</label>
                  <select
                    name="currency"
                    required
                    className="w-full px-3 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:border-gray-400/50 bg-white/20"
                    style={{ backdropFilter: 'blur(10px)' }}
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Payment URL</label>
                  <input
                    name="payment_url"
                    type="url"
                    required
                    className="w-full px-3 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:border-gray-400/50 bg-white/20"
                    style={{ backdropFilter: 'blur(10px)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Description (optional)</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:border-gray-400/50 bg-white/20"
                    style={{ backdropFilter: 'blur(10px)' }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Send Link
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Send Notification Modal */}
        {showNotificationModal && selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white/35 rounded-2xl max-w-md w-full p-6 border border-gray-300/50" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Send Notification</h2>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="p-2 hover:bg-gray-100/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  handleSendNotification(
                    selectedItem.id,
                    formData.get('type'),
                    formData.get('title'),
                    formData.get('message'),
                    formData.get('action_url') || null
                  );
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">User</label>
                  <input
                    type="text"
                    value={selectedItem.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300/50 rounded-lg bg-white/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Type</label>
                  <select
                    name="type"
                    required
                    className="w-full px-3 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:border-gray-400/50 bg-white/20"
                    style={{ backdropFilter: 'blur(10px)' }}
                  >
                    <option value="project_approved">Project Approved</option>
                    <option value="project_rejected">Project Rejected</option>
                    <option value="payment_received">Payment Received</option>
                    <option value="kyc_approved">KYC Approved</option>
                    <option value="request_confirmed">Request Confirmed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Title</label>
                  <input
                    name="title"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:border-gray-400/50 bg-white/20"
                    style={{ backdropFilter: 'blur(10px)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Message</label>
                  <textarea
                    name="message"
                    rows={4}
                    required
                    className="w-full px-3 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:border-gray-400/50 bg-white/20"
                    style={{ backdropFilter: 'blur(10px)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Action URL (optional)</label>
                  <input
                    name="action_url"
                    type="url"
                    className="w-full px-3 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:border-gray-400/50 bg-white/20"
                    style={{ backdropFilter: 'blur(10px)' }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNotificationModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* NFT Benefit Modal */}
        {showNftBenefitModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white/35 rounded-2xl max-w-md w-full p-6 border border-gray-300/50" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Record NFT Benefit Usage</h2>
                <button
                  onClick={() => setShowNftBenefitModal(false)}
                  className="p-2 hover:bg-gray-100/50 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">User ID *</label>
                  <select
                    value={newNftBenefit.user_id}
                    onChange={(e) => setNewNftBenefit(prev => ({ ...prev, user_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:border-gray-400/50 bg-white/20"
                    style={{ backdropFilter: 'blur(10px)' }}
                  >
                    <option value="">Select User</option>
                    {users.map((user: any) => (
                      <option key={user.id} value={user.id}>{user.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">NFT Token ID *</label>
                  <input
                    type="text"
                    value={newNftBenefit.nft_token_id}
                    onChange={(e) => setNewNftBenefit(prev => ({ ...prev, nft_token_id: e.target.value }))}
                    placeholder="e.g., 1, 2, 42"
                    className="w-full px-3 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:border-gray-400/50 bg-white/20"
                    style={{ backdropFilter: 'blur(10px)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Wallet Address</label>
                  <input
                    type="text"
                    value={newNftBenefit.wallet_address}
                    onChange={(e) => setNewNftBenefit(prev => ({ ...prev, wallet_address: e.target.value }))}
                    placeholder="0x..."
                    className="w-full px-3 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:border-gray-400/50 bg-white/20"
                    style={{ backdropFilter: 'blur(10px)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Benefit Type *</label>
                  <select
                    value={newNftBenefit.benefit_type}
                    onChange={(e) => setNewNftBenefit(prev => ({ ...prev, benefit_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:border-gray-400/50 bg-white/20"
                    style={{ backdropFilter: 'blur(10px)' }}
                  >
                    <option value="free_empty_leg">Free Empty Leg Flight</option>
                    <option value="limousine_transfer">Limousine Transfer</option>
                    <option value="discount_applied">Discount Applied</option>
                    <option value="priority_access">Priority Access</option>
                    <option value="vip_event">VIP Event Invitation</option>
                    <option value="pvcx_rewards">$PVCX Rewards</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Service Name</label>
                  <input
                    type="text"
                    value={newNftBenefit.service_name}
                    onChange={(e) => setNewNftBenefit(prev => ({ ...prev, service_name: e.target.value }))}
                    placeholder="e.g., Empty Leg NYC-LAX"
                    className="w-full px-3 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:border-gray-400/50 bg-white/20"
                    style={{ backdropFilter: 'blur(10px)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Service Value (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newNftBenefit.service_value}
                    onChange={(e) => setNewNftBenefit(prev => ({ ...prev, service_value: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:border-gray-400/50 bg-white/20"
                    style={{ backdropFilter: 'blur(10px)' }}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNftBenefitModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNftBenefit}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Record Benefit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
