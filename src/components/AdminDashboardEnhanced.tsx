import React, { useEffect, useState } from "react";
import {
  Users, FileText, Calendar, Package, Plane, Gift, Wallet, Search,
  MessageSquare, Bell, Rocket, Building2, Coins, TrendingUp,
  Send, CheckCircle, XCircle, Clock, AlertCircle, DollarSign,
  ExternalLink, Eye, Edit, Trash2, Plus, Filter, Download
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
    id: "management",
    label: "Management",
    items: [
      { id: "users", label: "Users", icon: Users },
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

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

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
        notificationsData
      ] = await Promise.all([
        supabase.from('auth.users').select('*').order('created_at', { ascending: false }),
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
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100)
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
              {filter(userRequests, ['type', 'status', 'service_type']).map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-300/50 rounded-xl p-4 bg-white/35"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 capitalize">{request.type}</h3>
                    <span className={getStatusBadge(request.status)}>{request.status}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service</span>
                      <span className="capitalize">{request.service_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created</span>
                      <span>{new Date(request.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
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
              {filter(users, ['email', 'user_role']).map((user) => (
                <div
                  key={user.id}
                  className="border border-gray-300/50 rounded-xl p-4 bg-white/35"
                  style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">{user.email?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      {user.is_admin && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Admin</span>}
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
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setSelectedItem(user);
                        setShowNotificationModal(true);
                      }}
                      className="w-full px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-3 h-3" />
                      Send Notification
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

      default:
        return <div className="text-center text-gray-500 py-12">Select a section from the menu</div>;
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">Admin Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Manage all platform operations</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300/50 rounded-lg w-64 focus:outline-none focus:border-gray-400/50 transition-colors bg-white/20 text-sm"
              style={{ backdropFilter: 'blur(10px)' }}
            />
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="mb-6 space-y-4">
          {navSections.map((section) => (
            <div key={section.id}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{section.label}</span>
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
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                        activeTab === item.id
                          ? 'bg-white/40 text-gray-900 shadow-sm border-gray-300/50'
                          : 'bg-white/20 text-gray-600 hover:bg-white/30 border-gray-300/30'
                      }`}
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="border border-gray-300/50 rounded-2xl p-6 bg-white/35" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
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
      </div>
    </div>
  );
}
