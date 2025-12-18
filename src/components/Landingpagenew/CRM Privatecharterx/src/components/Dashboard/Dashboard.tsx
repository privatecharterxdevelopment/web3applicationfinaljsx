import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  Settings, 
  Plane, 
  Ship, 
  Zap, 
  Car,
  FileText,
  Bell,
  UserPlus,
  Activity,
  ShoppingBag,
  Building2,
  UserCog,
  CalendarDays,
  Mail,
  FolderOpen,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  ChevronRight,
  X,
  Send,
  LifeBuoy,
  File,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { SalesRevenueDashboard } from './SalesRevenueDashboard';
import { ClientSupportWidget } from './ClientSupportWidget';
import { PreviewsTab } from './PreviewsTab';
import { AdminDashboardSettings } from './AdminDashboardSettings';
import { RecentUserActivity } from './RecentUserActivity';

interface DashboardMetric {
  id: string;
  title: string;
  value: number;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ReactNode;
}

interface SupportMessage {
  id: string;
  client_name: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  created_at: string;
}

interface Document {
  id: string;
  title: string;
  type: 'news' | 'document' | 'announcement';
  content: string;
  created_at: string;
  created_by: string;
}

interface StorageFile {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  folder: string;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  is_public: boolean;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [activeTab, setActiveTab] = useState<'overview' | 'support' | 'documents'>('overview');
  const [metrics, setMetrics] = useState<DashboardMetric[]>([
    {
      id: 'total_clients',
      title: 'Clients',
      value: 0,
      change: '0% from last month',
      changeType: 'positive',
      icon: <Users className="w-6 h-6 text-blue-500" />
    },
    {
      id: 'active_bookings',
      title: 'Bookings',
      value: 0,
      change: '0% from last month',
      changeType: 'positive',
      icon: <Calendar className="w-6 h-6 text-green-500" />
    },
    {
      id: 'services',
      title: 'Services',
      value: 0,
      change: '0% from last month',
      changeType: 'positive',
      icon: <Plane className="w-6 h-6 text-yellow-500" />
    },
    {
      id: 'pending_requests',
      title: 'Requests',
      value: 0,
      change: '0% from last month',
      changeType: 'positive',
      icon: <TrendingUp className="w-6 h-6 text-purple-500" />
    }
  ]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [recentFiles, setRecentFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // New state for live activities
  const [latestBookings, setLatestBookings] = useState<any[]>([]);
  const [latestRequests, setLatestRequests] = useState<any[]>([]);
  const [latestSupportMessages, setLatestSupportMessages] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time subscription for metrics updates
    const metricsSubscription = supabase
      .channel('dashboard-metrics')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'clients' 
      }, () => {
        fetchMetrics();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'employee_bookings' 
      }, () => {
        fetchMetrics();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'service_orders' 
      }, () => {
        fetchMetrics();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_requests' 
      }, () => {
        fetchMetrics();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'sales_deals' 
      }, () => {
        fetchMetrics();
      })
      .subscribe();
      
    // Set up real-time subscription for user activity
    const activitySubscription = supabase
      .channel('user-activity')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'user_activity_logs' 
      }, () => {
        fetchRecentUserActivity();
      })
      .subscribe();
    
    return () => {
      // Clean up all subscriptions
      metricsSubscription.unsubscribe();
      activitySubscription.unsubscribe();
    };
  }, [user]);

  // Set up real-time subscriptions for live activities
  useEffect(() => {
    // Set up subscription for new bookings
    const bookingsSubscription = supabase
      .channel('bookings-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'employee_bookings' }, 
        () => {
          fetchLatestBookings();
        }
      )
      .subscribe();
      
    // Set up subscription for new support requests
    const supportSubscription = supabase
      .channel('support-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'user_requests', filter: 'type=eq.support' }, 
        () => {
          fetchLatestSupportMessages();
        }
      )
      .subscribe();
      
    // Set up subscription for new general requests
    const requestsSubscription = supabase
      .channel('requests-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'user_requests' }, 
        () => {
          fetchLatestRequests();
        }
      )
      .subscribe();
    
    // Initial fetch
    fetchLatestBookings();
    fetchLatestRequests();
    fetchLatestSupportMessages();
    
    return () => {
      bookingsSubscription.unsubscribe();
      supportSubscription.unsubscribe();
      requestsSubscription.unsubscribe();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchMetrics(),
        fetchSupportMessages(),
        fetchDocuments(),
        fetchRecentFiles(),
        fetchRecentUserActivity()
      ]);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLatestBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_bookings')
        .select(`
          id,
          booking_number,
          client_name,
          service_type,
          departure,
          arrival,
          departure_date,
          status,
          priority,
          created_at,
          system_users!employee_id (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setLatestBookings(data || []);
    } catch (err) {
      console.error('Error fetching latest bookings:', err);
    }
  };

  const fetchLatestRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('user_requests')
        .select(`
          id,
          type,
          status,
          data,
          created_at,
          system_users!user_id (name)
        `)
        .not('type', 'eq', 'support') // Exclude support requests as they're handled separately
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setLatestRequests(data || []);
    } catch (err) {
      console.error('Error fetching latest requests:', err);
    }
  };

  const fetchLatestSupportMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('user_requests')
        .select(`
          id,
          status,
          data,
          created_at,
          system_users!user_id (name)
        `)
        .eq('type', 'support')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setLatestSupportMessages(data || []);
    } catch (err) {
      console.error('Error fetching latest support messages:', err);
    }
  };

  const refreshAllData = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchLatestBookings(),
      fetchLatestRequests(),
      fetchLatestSupportMessages(),
      fetchRecentUserActivity()
    ]);
    setIsRefreshing(false);
  };

  const fetchMetrics = async () => {
    try {
      // First check if there are custom admin settings
      if (user?.role === 'admin') {
        const { data: settingsData } = await supabase
          .from('admin_settings')
          .select('settings')
          .eq('user_id', user.id)
          .maybeSingle();

        if (settingsData?.settings?.dashboard) {
          const dashboardSettings = settingsData.settings.dashboard;
          setMetrics(prev => prev.map(metric => ({
            ...metric,
            value: dashboardSettings[metric.id] || 0
          })));
          return;
        }
      }

      // Otherwise fetch real metrics
      const [clientsResponse, bookingsResponse, ordersResponse, requestsResponse] = await Promise.all([
        supabase.from('clients').select('count', { count: 'exact', head: true }),
        supabase.from('employee_bookings').select('count', { count: 'exact', head: true }).eq('status', 'confirmed'),
        supabase.from('service_orders').select('total_amount').gte('created_at', new Date(new Date().setDate(1)).toISOString()),
        supabase.from('user_requests').select('count', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      // Fix for the sales_deals query - fetch all pending deals and calculate client-side
      const { data: pendingDeals, error: dealsError } = await supabase
        .from('sales_deals')
        .select('deal_amount')
        .eq('status', 'pending');

      if (dealsError) throw dealsError;

      const totalClients = clientsResponse.count || 0;
      const activeBookings = bookingsResponse.count || 0;
      const monthlyRevenue = ordersResponse.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const pendingRequests = requestsResponse.count || 0;
      const pendingDealsCount = pendingDeals?.length || 0;
      const pendingDealsValue = pendingDeals?.reduce((sum, deal) => sum + (deal.deal_amount || 0), 0) || 0;

      setMetrics(prev => [
        { ...prev[0], value: totalClients },
        { ...prev[1], value: activeBookings },
        { ...prev[2], value: monthlyRevenue },
        { ...prev[3], value: pendingRequests + pendingDealsCount }
      ]);
    } catch (err: any) {
      console.error('Error fetching metrics:', err);
    }
  };

  const fetchSupportMessages = async () => {
    try {
      // Fetch support requests from user_requests table
      const { data: supportRequests, error } = await supabase
        .from('user_requests')
        .select('*')
        .eq('type', 'support')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Extract client IDs from the data field
      const clientIds = supportRequests
        ?.map(request => request.data?.client_id)
        .filter(Boolean) || [];

      // If we have client IDs, fetch their names
      let clientNames: Record<string, string> = {};
      if (clientIds.length > 0) {
        const { data: clients } = await supabase
          .from('clients')
          .select('id, name')
          .in('id', clientIds);

        if (clients) {
          clientNames = clients.reduce((acc, client) => {
            acc[client.id] = client.name;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Map support requests to the format we need
      const formattedMessages = supportRequests?.map(request => {
        const clientId = request.data?.client_id;
        const clientName = clientId ? clientNames[clientId] || 'Unknown Client' : 
                          request.data?.client_name || 'Anonymous';
        
        return {
          id: request.id,
          client_name: clientName,
          message: request.data?.message || 'No message provided',
          status: request.status === 'pending' ? 'new' : 
                 request.status === 'in_progress' ? 'in_progress' : 'resolved',
          created_at: request.created_at
        };
      }) || [];

      setSupportMessages(formattedMessages);
    } catch (err: any) {
      console.error('Error fetching support messages:', err);
    }
  };

  const fetchDocuments = async () => {
    try {
      // In a real app, this would fetch from the database
      // For demo purposes, we'll use mock data
      const mockDocuments: Document[] = [
        {
          id: '1',
          title: 'Q2 2025 Business Update',
          type: 'news',
          content: 'We are pleased to announce that our Q2 2025 results exceeded expectations with a 15% increase in revenue compared to the same period last year. Our private jet charter services saw the highest growth at 22%, followed by yacht charters at 18%.',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          created_by: 'Marketing Team'
        },
        {
          id: '2',
          title: 'New Service Announcement: Helicopter Tours',
          type: 'announcement',
          content: 'Starting next month, we will be offering exclusive helicopter tours in select European destinations. These tours will provide our clients with breathtaking aerial views of iconic landmarks and natural wonders.',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
          created_by: 'Product Team'
        },
        {
          id: '3',
          title: 'Updated Terms of Service',
          type: 'document',
          content: 'Please review our updated Terms of Service, effective from July 1, 2025. Key changes include revised cancellation policies, enhanced privacy protections, and updated payment terms for international clients.',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
          created_by: 'Legal Department'
        },
        {
          id: '4',
          title: 'Summer 2025 Fleet Expansion',
          type: 'news',
          content: 'We are excited to announce the addition of five new aircraft to our fleet: two Gulfstream G700s, two Bombardier Global 7500s, and one Dassault Falcon 10X. This expansion will significantly enhance our long-range charter capabilities.',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
          created_by: 'Operations Team'
        },
        {
          id: '5',
          title: 'Client Appreciation Event',
          type: 'announcement',
          content: 'Join us for our annual Client Appreciation Gala on August 15, 2025, at The Grand Hotel in Monaco. This exclusive event will feature gourmet dining, entertainment, and networking opportunities with industry leaders.',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
          created_by: 'Events Team'
        }
      ];
      
      setDocuments(mockDocuments);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
    }
  };

  const fetchRecentFiles = async () => {
    try {
      // Fetch recent files from storage_files table
      const { data, error } = await supabase
        .from('storage_files')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // If we have real files, use them
      if (data && data.length > 0) {
        setRecentFiles(data);
      } else {
        // Otherwise use mock data
        const mockFiles: StorageFile[] = [
          {
            id: '1',
            name: 'Client Agreement.pdf',
            type: 'application/pdf',
            size: 2500000,
            path: '/Documents/Client Agreement.pdf',
            folder: '/Documents',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            created_by: 'Admin',
            updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            is_public: false
          },
          {
            id: '2',
            name: 'Service Catalog.docx',
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            size: 1800000,
            path: '/Documents/Service Catalog.docx',
            folder: '/Documents',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
            created_by: 'Admin',
            updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
            is_public: true
          },
          {
            id: '3',
            name: 'Price List 2025.xlsx',
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: 950000,
            path: '/Documents/Price List 2025.xlsx',
            folder: '/Documents',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
            created_by: 'Sales Team',
            updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
            is_public: false
          },
          {
            id: '4',
            name: 'Gulfstream G700.jpg',
            type: 'image/jpeg',
            size: 3500000,
            path: '/Images/Gulfstream G700.jpg',
            folder: '/Images',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
            created_by: 'Marketing Team',
            updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
            is_public: true
          },
          {
            id: '5',
            name: 'Bombardier Global 7500.jpg',
            type: 'image/jpeg',
            size: 2800000,
            path: '/Images/Bombardier Global 7500.jpg',
            folder: '/Images',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
            created_by: 'Marketing Team',
            updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
            is_public: true
          }
        ];
        setRecentFiles(mockFiles);
      }
    } catch (err: any) {
      console.error('Error fetching recent files:', err);
    }
  };

  const fetchRecentUserActivity = async () => {
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select(`
          id,
          action,
          details,
          created_at,
          system_users!user_id (name, email, role)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setRecentActivities(data || []);
    } catch (err: any) {
      console.error('Error fetching user activities:', err);
    }
  };

  const updateDashboardSettings = () => {
    fetchDashboardData();
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <File className="w-4 h-4 text-blue-500" />;
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      return <File className="w-4 h-4 text-green-500" />;
    } else if (fileType.includes('pdf')) {
      return <File className="w-4 h-4 text-red-500" />;
    } else if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar')) {
      return <File className="w-4 h-4 text-yellow-500" />;
    } else if (fileType.includes('html') || fileType.includes('javascript') || fileType.includes('css')) {
      return <File className="w-4 h-4 text-purple-500" />;
    } else if (fileType.includes('video')) {
      return <File className="w-4 h-4 text-pink-500" />;
    } else if (fileType.includes('audio')) {
      return <File className="w-4 h-4 text-indigo-500" />;
    } else {
      return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}! Here's an overview of your business.</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowSettings(true)}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Dashboard Settings</span>
          </button>
        )}
      </div>

      {/* Dashboard Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'overview'
              ? 'text-black border-b-2 border-black'
              : 'text-gray-500 hover:text-black'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'support'
              ? 'text-black border-b-2 border-black'
              : 'text-gray-500 hover:text-black'
          }`}
        >
          Support
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'documents'
              ? 'text-black border-b-2 border-black'
              : 'text-gray-500 hover:text-black'
          }`}
        >
          Documents
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric) => (
              <div key={metric.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    {metric.icon}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    metric.changeType === 'positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {metric.change}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">{metric.title}</h3>
                <p className="text-2xl font-bold text-black">
                  {metric.id === 'monthly_revenue' 
                    ? `$${metric.value.toLocaleString()}`
                    : metric.value.toLocaleString()
                  }
                </p>
              </div>
            ))}
          </div>

          {/* Recent User Activity */}
          <div className="mb-8">
            <RecentUserActivity activities={recentActivities} />
          </div>
          
          {/* Live Activities Dashboard */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black">Live Activities</h2>
              <button 
                onClick={refreshAllData}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              {/* Latest Bookings */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-black flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                    Latest Bookings
                  </h3>
                  <button 
                    onClick={() => window.location.hash = "#bookings"}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    View All
                  </button>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {latestBookings.length > 0 ? (
                    latestBookings.map((booking) => (
                      <div key={booking.id} className="p-2 hover:bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{booking.client_name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {booking.departure} → {booking.arrival}
                        </p>
                        <div className="flex justify-between items-center mt-1 text-xs text-gray-400">
                          <span>{new Date(booking.created_at).toLocaleString()}</span>
                          <span>By {booking.system_users?.name || 'Unknown'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No recent bookings</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Latest Requests */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-black flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-purple-500" />
                    Latest Requests
                  </h3>
                  <button 
                    onClick={() => window.location.hash = "#support"}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    View All
                  </button>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {latestRequests.length > 0 ? (
                    latestRequests.map((request) => (
                      <div key={request.id} className="p-2 hover:bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm capitalize">{request.type} Request</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {request.data?.message || request.data?.subject || 'No details'}
                        </p>
                        <div className="flex justify-between items-center mt-1 text-xs text-gray-400">
                          <span>{new Date(request.created_at).toLocaleString()}</span>
                          <span>By {request.system_users?.name || 'Unknown'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No recent requests</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Latest Support Messages */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-black flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2 text-green-500" />
                    Support Messages
                  </h3>
                  <button 
                    onClick={() => window.location.hash = "#support"}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    View All
                  </button>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {latestSupportMessages.length > 0 ? (
                    latestSupportMessages.map((message) => (
                      <div key={message.id} className="p-2 hover:bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{message.data?.client_name || 'Client'}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            message.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            message.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {message.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {message.data?.message || 'No message'}
                        </p>
                        <div className="flex justify-between items-center mt-1 text-xs text-gray-400">
                          <span>{new Date(message.created_at).toLocaleString()}</span>
                          <span>By {message.system_users?.name || 'Unknown'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No support messages</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sales Revenue Dashboard */}
          <SalesRevenueDashboard />

          {/* Support and Documents */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ClientSupportWidget messages={supportMessages} />
            
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-purple-600" />
                  Recent Documents
                </h2>
                <button
                  onClick={() => setActiveTab('documents')}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-4 md:p-6">
                <div className="space-y-4">
                  {recentFiles.map((file) => (
                    <div key={file.id} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-black">{file.name}</h3>
                        <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                        <div className="flex items-center mt-1 text-xs text-gray-400">
                          <span>{file.created_by || 'Unknown'}</span>
                          <span className="mx-1">•</span>
                          <span>{new Date(file.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {recentFiles.length === 0 && (
                    <div className="text-center py-6">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No documents uploaded yet</p>
                      <button 
                        onClick={() => window.location.hash = "#storage"}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        Upload Documents
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Featured Services */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-black">Featured Services</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Plane className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-medium text-black">Private Jets</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Luxury private jet charters to destinations worldwide with personalized service.
                  </p>
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    View Details
                  </button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Ship className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-medium text-black">Luxury Yachts</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Exclusive yacht charters in the world's most beautiful waters.
                  </p>
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    View Details
                  </button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-medium text-black">Helicopters</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Helicopter transfers and tours for efficient and scenic travel.
                  </p>
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    View Details
                  </button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Car className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h3 className="font-medium text-black">Luxury Cars</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Premium car rentals and chauffeur services worldwide.
                  </p>
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Support Tab */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-black flex items-center">
                <LifeBuoy className="w-5 h-5 mr-2 text-blue-600" />
                Client Support Requests
              </h2>
            </div>
            
            <div className="p-6">
              {supportMessages.length > 0 ? (
                <div className="space-y-4">
                  {supportMessages.map((message) => (
                    <div key={message.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-black">{message.client_name}</h3>
                            <p className="text-xs text-gray-500">{new Date(message.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          message.status === 'new' ? 'bg-red-100 text-red-800' : 
                          message.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'
                        }`}>
                          {message.status === 'new' ? 'New' : 
                           message.status === 'in_progress' ? 'In Progress' : 
                           'Resolved'}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-4">{message.message}</p>
                      
                      <div className="flex space-x-3">
                        {message.status === 'new' && (
                          <button className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-sm flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>Mark In Progress</span>
                          </button>
                        )}
                        
                        {message.status !== 'resolved' && (
                          <button className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>Mark Resolved</span>
                          </button>
                        )}
                        
                        <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm flex items-center space-x-1">
                          <Send className="w-4 h-4" />
                          <span>Reply</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <LifeBuoy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No support requests</h3>
                  <p className="text-gray-500">There are no active support requests at this time.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-black">Create Support Request</h2>
            </div>
            
            <div className="p-6">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">Select a client</option>
                    <option value="1">John Smith</option>
                    <option value="2">Sarah Johnson</option>
                    <option value="3">Michael Brown</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Brief description of the issue"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Detailed description of the support request"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <PreviewsTab documents={documents} />
      )}

      {/* Dashboard Settings Modal */}
      <AdminDashboardSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSettingsUpdated={updateDashboardSettings}
      />
    </div>
  );
};