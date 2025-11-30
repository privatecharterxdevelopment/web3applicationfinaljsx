import React, { useState, useEffect } from 'react';
import { ArrowLeft, History, Search, Filter, X, Sparkles, Plane, MapPin, Calendar, Users, CreditCard, Clock, Utensils, ChevronDown, ChevronUp, DollarSign, Ship, Car, Package, FileText, ExternalLink, Download, CheckCircle, AlertCircle, XCircle, MessageSquare, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface RequestHistoryProps {
  onBack: () => void;
  onOpenChat?: (chatId: string) => void;
}

interface Request {
  id: string;
  user_id: string;
  type: string;
  status: string;
  data: any;
  created_at: string;
  completed_at?: string;
  admin_notes?: string;
  admin?: {
    name: string;
    email: string;
  };
}

interface PriceBreakRequest {
  id: string;
  user_id: string;
  chat_id: string;
  service_type: string;
  service_details: any;
  quote_file_url: string;
  quote_file_type: string;
  quote_extracted_data: any;
  competitor_price: number | null;
  competitor_currency: string;
  our_offer_price: number | null;
  our_offer_currency: string;
  savings_amount: number | null;
  savings_percentage: number | null;
  status: string;
  coordinator_notes: string | null;
  response_message: string | null;
  created_at: string;
  analyzed_at: string | null;
  responded_at: string | null;
  expires_at: string;
  metadata: any;
}

interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  messages: any[];
  created_at: string;
  updated_at: string;
}

export default function RequestHistory({ onBack, onOpenChat }: RequestHistoryProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [priceBreakRequests, setPriceBreakRequests] = useState<PriceBreakRequest[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPriceBreak, setLoadingPriceBreak] = useState(true);
  const [loadingChats, setLoadingChats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'requests' | 'ai_requests' | 'pricebreak' | 'chat_history'>('chat_history');
  const [expandedChatId, setExpandedChatId] = useState<string | null>(null);
  const [expandedAIRequestId, setExpandedAIRequestId] = useState<string | null>(null);
  const [chatPage, setChatPage] = useState(1);
  const [aiRequestPage, setAiRequestPage] = useState(1);
  const CHATS_PER_PAGE = 9;
  const AI_REQUESTS_PER_PAGE = 9;

  useEffect(() => {
    fetchRequests();
    fetchPriceBreakRequests();
    fetchChatSessions();
  }, []);

  const fetchRequests = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error: requestError } = await supabase
        .from('user_requests')
        .select('*')  // ← FIXED: Removed the admin join that was causing the error
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (requestError) throw new Error(requestError.message);
      setRequests(data || []);
    } catch (err) {
      setError('Failed to load requests');
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceBreakRequests = async () => {
    if (!user?.id) return;

    try {
      setLoadingPriceBreak(true);
      const { data, error: priceBreakError } = await supabase
        .from('price_break_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (priceBreakError) throw new Error(priceBreakError.message);
      setPriceBreakRequests(data || []);
    } catch (err) {
      console.error('Error fetching price break requests:', err);
    } finally {
      setLoadingPriceBreak(false);
    }
  };

  const fetchChatSessions = async () => {
    if (!user?.id) return;

    try {
      setLoadingChats(true);
      const { data, error: chatError } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (chatError) throw new Error(chatError.message);
      setChatSessions(data || []);
    } catch (err) {
      console.error('Error fetching chat sessions:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  const getPriceBreakStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'offer_made':
      case 'accepted':
        return 'bg-gray-900 text-white';
      case 'analyzing':
      case 'pending':
      case 'reviewed':
        return 'bg-gray-200 text-gray-700';
      case 'declined':
      case 'expired':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriceBreakStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'offer_made':
      case 'accepted':
        return <CheckCircle size={14} className="text-gray-900" />;
      case 'analyzing':
      case 'pending':
      case 'reviewed':
        return <Clock size={14} className="text-gray-600" />;
      case 'declined':
      case 'expired':
        return <XCircle size={14} className="text-gray-400" />;
      default:
        return <AlertCircle size={14} className="text-gray-500" />;
    }
  };

  const createSampleRequest = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_requests')
        .insert([{
          user_id: user.id,
          type: 'flight_quote',
          status: 'pending',
          data: {
            origin: 'London Heathrow (LHR)',
            destination: 'Paris Charles de Gaulle (CDG)',
            passengers: 4,
            date: new Date().toISOString(),
            aircraft_preference: 'Light Jet'
          }
        }]);

      if (error) throw error;
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Error creating sample request:', error);
    }
  };

  // Helper function to check if a request is from AI Chat
  const isAIRequest = (request: Request): boolean => {
    // Check if source is AI Chat
    if (request.data?.source?.toLowerCase().includes('ai')) return true;
    if (request.data?.Source?.toLowerCase().includes('ai')) return true;

    // Check for AI-specific request types
    if (request.type === 'ai_chat_bulk') return true;
    if (request.type === 'custom_charter_request') return true;
    if (request.type === 'custom_request' && request.data?.source?.toLowerCase().includes('ai')) return true;

    // Check if conversationSummary exists (AI requests have this)
    if (request.data?.conversationSummary || request.data?.ConversationSummary) return true;

    return false;
  };

  // Separate requests into AI and standard
  const aiRequests = requests.filter(request => isAIRequest(request));
  const standardRequests = requests.filter(request => !isAIRequest(request));

  const filteredRequests = standardRequests.filter(request => {
    // Apply type filter
    if (typeFilter !== 'all' && request.type !== typeFilter) {
      return false;
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        request.type.toLowerCase().includes(searchLower) ||
        request.status.toLowerCase().includes(searchLower) ||
        JSON.stringify(request.data).toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const filteredAIRequests = aiRequests.filter(request => {
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        request.type.toLowerCase().includes(searchLower) ||
        request.status.toLowerCase().includes(searchLower) ||
        JSON.stringify(request.data).toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Helper to get friendly type name
  const getTypeName = (type: string) => {
    const typeNames: Record<string, string> = {
      ai_chat_bulk: 'AI Chat Request',
      custom_charter_request: 'Custom Charter Request',
      custom_request: 'Custom Request',
      flight_quote: 'Flight Quote',
      private_jet_charter: 'Private Jet Charter',
      helicopter_charter: 'Helicopter Charter',
      empty_leg: 'Empty Leg',
      luxury_car_rental: 'Luxury Car Rental',
      yacht_charter: 'Yacht Charter',
      ground_transport: 'Ground Transport',
      taxi_concierge: 'Taxi / Concierge',
      adventure_package: 'Adventure Package',
      fixed_offer: 'Fixed Offer'
    };
    return typeNames[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to clean and format conversation summary
  const formatConversationSummary = (summary: string): { role: 'user' | 'assistant' | 'results'; content: string }[] => {
    if (!summary) return [];

    // Split by common patterns
    const messages: { role: 'user' | 'assistant' | 'results'; content: string }[] = [];

    // Split by user:/assistant:/results: patterns
    const parts = summary.split(/(?=user:|assistant:|results:)/gi);

    parts.forEach(part => {
      const trimmed = part.trim();
      if (!trimmed) return;

      let role: 'user' | 'assistant' | 'results' = 'assistant';
      let content = trimmed;

      if (trimmed.toLowerCase().startsWith('user:')) {
        role = 'user';
        content = trimmed.substring(5).trim();
      } else if (trimmed.toLowerCase().startsWith('assistant:')) {
        role = 'assistant';
        content = trimmed.substring(10).trim();
      } else if (trimmed.toLowerCase().startsWith('results:')) {
        role = 'results';
        content = trimmed.substring(8).trim();
      }

      // Clean up the content - remove JSON artifacts and special characters
      content = content
        .replace(/\{"[^}]+"\}/g, '') // Remove inline JSON objects
        .replace(/\[\{"[^}]+"\}\]/g, '') // Remove JSON arrays
        .replace(/\\n/g, '\n') // Convert escaped newlines
        .replace(/\*\*/g, '') // Remove markdown bold
        .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
        .trim();

      if (content) {
        messages.push({ role, content });
      }
    });

    return messages;
  };

  // Parse route from JSON string if needed
  const parseRoute = (route: any): string => {
    if (!route) return '';
    if (typeof route === 'string') {
      // Check if it's JSON
      if (route.startsWith('{')) {
        try {
          const parsed = JSON.parse(route);
          return `${parsed.from || ''} → ${parsed.to || ''}`;
        } catch {
          return route;
        }
      }
      return route;
    }
    if (typeof route === 'object') {
      return `${route.from || ''} → ${route.to || ''}`;
    }
    return '';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-gray-900 text-white';
      case 'pending':
        return 'bg-gray-200 text-gray-700';
      case 'in_progress':
        return 'bg-gray-300 text-gray-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getRequestIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      ai_chat_bulk: <Sparkles size={20} className="text-gray-600" />,
      flight_quote: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path></svg>,
      private_jet_charter: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path></svg>,
      fixed_offer: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>,
      helicopter_charter: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6"></path><path d="m15.5 3.5-3.5 3.5-3.5-3.5"></path><path d="m20.5 8.5-3.5 3.5-3.5-3.5"></path></svg>,
      empty_leg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path></svg>,
      luxury_car_rental: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18.4 10c-.4-.8-1.2-1.3-2.1-1.3H7.7c-.9 0-1.7.5-2.1 1.3l-2.1 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>,
      ground_transport: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18.4 10c-.4-.8-1.2-1.3-2.1-1.3H7.7c-.9 0-1.7.5-2.1 1.3l-2.1 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>,
      yacht_charter: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"></path><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"></path><path d="M12 10v4"></path></svg>,
      adventure_package: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="m8 3 4 8 5-5 5 15H2L8 3z"></path></svg>,
      concierge: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"></path><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"></path><path d="M4 15v-3a6 6 0 0 1 6-6h0"></path><path d="M14 6h0a6 6 0 0 1 6 6v3"></path></svg>,
      document: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="m9 15 2 2 4-4"></path></svg>,
      support: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
      visa: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><rect width="20" height="14" x="2" y="5" rx="2"></rect><line x1="2" x2="22" y1="10" y2="10"></line></svg>,
      payment: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><rect width="20" height="14" x="2" y="5" rx="2"></rect><line x1="2" x2="22" y1="10" y2="10"></line></svg>,
      booking: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>
    };
    
    return iconMap[type] || <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h2 className="text-xl font-bold">Request History</h2>
        </div>

        {activeTab === 'requests' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent appearance-none"
              >
                <option value="all">All Types</option>
                <option value="private_jet_charter">Private Jet Charter</option>
                <option value="helicopter_charter">Helicopter Charter</option>
                <option value="empty_leg">Empty Leg</option>
                <option value="luxury_car_rental">Luxury Car</option>
                <option value="yacht_charter">Yacht Charter</option>
                <option value="ground_transport">Ground Transport</option>
                <option value="taxi_concierge">Taxi / Concierge</option>
                <option value="flight_quote">Flight Quote</option>
                <option value="booking">Booking</option>
                <option value="document">Document</option>
                <option value="visa">Visa</option>
                <option value="support">Support</option>
                <option value="payment">Payment</option>
              </select>
              <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('chat_history')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'chat_history'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={16} />
            Chat History
            {chatSessions.length > 0 && (
              <span className="bg-gray-900 text-white px-2 py-0.5 rounded-full text-xs">{chatSessions.length}</span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('ai_requests')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'ai_requests'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} />
            AI Requests
            {aiRequests.length > 0 && (
              <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">{aiRequests.length}</span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('pricebreak')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'pricebreak'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <DollarSign size={16} />
            Break the Price
            {priceBreakRequests.length > 0 && (
              <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">{priceBreakRequests.length}</span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'requests'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <History size={16} />
            All Requests
            {standardRequests.length > 0 && (
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{standardRequests.length}</span>
            )}
          </div>
        </button>
      </div>

      {/* Chat History Tab Content */}
      {activeTab === 'chat_history' && (
        <>
          {loadingChats ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
            </div>
          ) : chatSessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No Chat History</h3>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                Your AI conversations will appear here. Start a new chat to get personalized travel recommendations.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Pagination Info */}
              {chatSessions.length > CHATS_PER_PAGE && (
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <span>Showing {Math.min((chatPage - 1) * CHATS_PER_PAGE + 1, chatSessions.length)}-{Math.min(chatPage * CHATS_PER_PAGE, chatSessions.length)} of {chatSessions.length} conversations</span>
                </div>
              )}

              {chatSessions
                .slice((chatPage - 1) * CHATS_PER_PAGE, chatPage * CHATS_PER_PAGE)
                .map((chat) => {
                const messageCount = chat.messages?.length || 0;
                const lastMessage = chat.messages?.[chat.messages.length - 1];
                const isExpanded = expandedChatId === chat.id;

                return (
                  <div
                    key={chat.id}
                    className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-all"
                  >
                    {/* Chat Header */}
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedChatId(isExpanded ? null : chat.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MessageSquare size={20} className="text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {chat.title || 'Untitled Conversation'}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              <span>{formatDate(chat.updated_at)}</span>
                              <span className="text-gray-300">•</span>
                              <span>{messageCount} messages</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          {onOpenChat && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenChat(chat.id);
                              }}
                              className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                            >
                              <ExternalLink size={14} />
                              Continue
                            </button>
                          )}
                          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Preview of last message when collapsed */}
                      {!isExpanded && lastMessage && (
                        <div className="mt-3 pl-13 ml-13">
                          <div className="text-sm text-gray-500 line-clamp-2 bg-gray-50 p-2 rounded-lg">
                            <span className="font-medium text-gray-600">
                              {lastMessage.role === 'user' ? 'You: ' : 'Sphera: '}
                            </span>
                            {typeof lastMessage.content === 'string'
                              ? lastMessage.content.substring(0, 150) + (lastMessage.content.length > 150 ? '...' : '')
                              : 'Message content'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Expanded Chat Messages */}
                    {isExpanded && chat.messages && chat.messages.length > 0 && (
                      <div className="border-t border-gray-100">
                        <div className="p-4 max-h-96 overflow-y-auto space-y-3 bg-gray-50/50">
                          {chat.messages.slice(-10).map((msg: any, idx: number) => (
                            <div
                              key={idx}
                              className={`flex gap-3 ${msg.role === 'user' ? '' : 'flex-row-reverse'}`}
                            >
                              <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                                msg.role === 'user'
                                  ? 'bg-gray-900 text-white'
                                  : 'bg-gray-200 text-gray-700'
                              }`}>
                                {msg.role === 'user' ? 'U' : 'S'}
                              </div>
                              <div className={`flex-1 p-3 rounded-lg text-sm ${
                                msg.role === 'user'
                                  ? 'bg-gray-900 text-white'
                                  : 'bg-white text-gray-900 border border-gray-200'
                              }`}>
                                {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
                              </div>
                            </div>
                          ))}
                          {chat.messages.length > 10 && (
                            <div className="text-center text-xs text-gray-400 py-2">
                              Showing last 10 of {chat.messages.length} messages
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pagination Controls */}
              {chatSessions.length > CHATS_PER_PAGE && (
                <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setChatPage(p => Math.max(1, p - 1))}
                    disabled={chatPage === 1}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.ceil(chatSessions.length / CHATS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setChatPage(page)}
                        className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                          chatPage === page
                            ? 'bg-gray-900 text-white'
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setChatPage(p => Math.min(Math.ceil(chatSessions.length / CHATS_PER_PAGE), p + 1))}
                    disabled={chatPage >= Math.ceil(chatSessions.length / CHATS_PER_PAGE)}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* AI Requests Tab Content - Clean Expandable List Design */}
      {activeTab === 'ai_requests' && (
        <>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
            </div>
          ) : filteredAIRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles size={24} className="text-gray-300" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">No AI Requests</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                Start a conversation with our AI to create booking requests.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Stats Bar */}
              <div className="flex items-center justify-between text-xs text-gray-500 py-2 px-1">
                <span>{filteredAIRequests.length} request{filteredAIRequests.length !== 1 ? 's' : ''}</span>
                <div className="flex gap-3">
                  <span>{filteredAIRequests.filter(r => r.status === 'pending').length} pending</span>
                  <span>{filteredAIRequests.filter(r => r.status === 'completed').length} completed</span>
                </div>
              </div>

              {/* Pagination Info */}
              {filteredAIRequests.length > AI_REQUESTS_PER_PAGE && (
                <div className="text-xs text-gray-400 pb-2">
                  Showing {Math.min((aiRequestPage - 1) * AI_REQUESTS_PER_PAGE + 1, filteredAIRequests.length)}-{Math.min(aiRequestPage * AI_REQUESTS_PER_PAGE, filteredAIRequests.length)} of {filteredAIRequests.length}
                </div>
              )}

              {/* Request List */}
              <div className="border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-100">
                {filteredAIRequests
                  .slice((aiRequestPage - 1) * AI_REQUESTS_PER_PAGE, aiRequestPage * AI_REQUESTS_PER_PAGE)
                  .map((request) => {
                    const isExpanded = expandedAIRequestId === request.id;
                    const route = request.data?.route || request.data?.Route;
                    const hasConversation = request.data?.conversationSummary || request.data?.ConversationSummary;

                    return (
                      <div key={request.id} className="bg-white">
                        {/* Collapsed Row */}
                        <div
                          onClick={() => setExpandedAIRequestId(isExpanded ? null : request.id)}
                          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          {/* Icon */}
                          <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Sparkles size={14} className="text-gray-400" />
                          </div>

                          {/* Main Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {getTypeName(request.type)}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">AI</span>
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              {route ? parseRoute(route) : formatDate(request.created_at)}
                            </div>
                          </div>

                          {/* Status */}
                          <span className={`px-2 py-0.5 text-[10px] font-medium rounded capitalize ${getStatusColor(request.status)}`}>
                            {request.status.replace('_', ' ')}
                          </span>

                          {/* Chevron */}
                          <ChevronDown
                            size={16}
                            className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-0 border-t border-gray-50">
                            {/* Quick Details */}
                            <div className="flex flex-wrap gap-2 py-3">
                              {route && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                  <MapPin size={12} className="text-gray-400" />
                                  {parseRoute(route)}
                                </div>
                              )}
                              {(request.data?.passengers || request.data?.Passengers || request.data?.pax) && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                  <Users size={12} className="text-gray-400" />
                                  {request.data?.passengers || request.data?.Passengers || request.data?.pax} pax
                                </div>
                              )}
                              {(request.data?.SelectedAircraft || request.data?.selectedAircraft || request.data?.aircraft || request.data?.aircraft_type) && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                  <Plane size={12} className="text-gray-400" />
                                  {request.data?.SelectedAircraft || request.data?.selectedAircraft || request.data?.aircraft || request.data?.aircraft_type}
                                </div>
                              )}
                              {/* Travel Date (not created_at) */}
                              {(request.data?.date || request.data?.Date || request.data?.departure_date || request.data?.travel_date) && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                  <Calendar size={12} className="text-gray-400" />
                                  {request.data?.date || request.data?.Date || request.data?.departure_date || request.data?.travel_date}
                                </div>
                              )}
                              {/* Time */}
                              {(request.data?.time || request.data?.Time || request.data?.departure_time) && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                  <Clock size={12} className="text-gray-400" />
                                  {request.data?.time || request.data?.Time || request.data?.departure_time}
                                </div>
                              )}
                              {/* Price/Total */}
                              {(request.data?.price || request.data?.Price || request.data?.total || request.data?.Total || request.data?.estimated_price || request.data?.grand_total) && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-900 text-white px-2 py-1 rounded">
                                  <DollarSign size={12} />
                                  €{(request.data?.price || request.data?.Price || request.data?.total || request.data?.Total || request.data?.estimated_price || request.data?.grand_total || 0).toLocaleString()}
                                </div>
                              )}
                              {/* Request submitted date */}
                              <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                                Submitted: {formatDate(request.created_at)}
                              </div>
                            </div>

                            {/* Items Details */}
                            {request.data?.items && Array.isArray(request.data.items) && request.data.items.length > 0 && (
                              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                                  Requested Items ({request.data.items.length})
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {request.data.items.map((item: any, idx: number) => (
                                    <div key={idx} className="bg-white p-2 rounded border border-gray-200">
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <div className="text-xs font-medium text-gray-900">
                                            {item.name || item.aircraft_model || item.title ||
                                             (item.brand && item.model ? `${item.brand} ${item.model}` : 'Item')}
                                          </div>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {item.type && (
                                              <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${
                                                item.type === 'jets' ? 'bg-blue-100 text-blue-700' :
                                                item.type === 'helicopters' ? 'bg-green-100 text-green-700' :
                                                item.type === 'yachts' ? 'bg-cyan-100 text-cyan-700' :
                                                item.type === 'luxury_cars' ? 'bg-gray-200 text-gray-700' :
                                                item.type === 'ground_transport' ? 'bg-teal-100 text-teal-700' :
                                                'bg-gray-100 text-gray-600'
                                              }`}>
                                                {item.type === 'luxury_cars' ? 'Car' :
                                                 item.type === 'ground_transport' ? 'Transfer' :
                                                 item.type.replace('_', ' ')}
                                              </span>
                                            )}
                                            {(item.from || item.origin) && (item.to || item.destination) && (
                                              <span className="text-[10px] text-gray-500">
                                                {item.from || item.origin} → {item.to || item.destination}
                                              </span>
                                            )}
                                            {item.date && (
                                              <span className="text-[10px] text-gray-500">{item.date}</span>
                                            )}
                                            {item.time && (
                                              <span className="text-[10px] text-gray-500">{item.time}</span>
                                            )}
                                            {item.passengers && (
                                              <span className="text-[10px] text-gray-500">{item.passengers} pax</span>
                                            )}
                                          </div>
                                        </div>
                                        {(item.price || item.estimated_price || item.price_per_day) && (
                                          <div className="text-xs font-semibold text-gray-900 ml-2">
                                            €{(item.price || item.estimated_price || item.price_per_day || 0).toLocaleString()}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {/* Summary */}
                                {request.data?.summary && (
                                  <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center">
                                    <span className="text-[10px] text-gray-500">
                                      {request.data.summary.services_count || request.data.items.length} service(s)
                                    </span>
                                    <span className="text-xs font-bold text-gray-900">
                                      Total: €{(request.data.summary.grand_total || request.data.total || 0).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Conversation Preview */}
                            {hasConversation && (
                              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-2">Conversation</div>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  {formatConversationSummary(request.data?.conversationSummary || request.data?.ConversationSummary)
                                    .slice(0, 4)
                                    .map((msg, idx) => (
                                      <div key={idx} className="flex gap-2">
                                        <span className={`text-[10px] font-medium ${msg.role === 'user' ? 'text-gray-900' : 'text-gray-500'}`}>
                                          {msg.role === 'user' ? 'You:' : 'Sphera:'}
                                        </span>
                                        <span className="text-xs text-gray-600 line-clamp-1">{msg.content}</span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}

                            {/* Admin Response */}
                            {request.admin_notes && (
                              <div className="bg-gray-900 rounded-lg p-3 mb-3">
                                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Response</div>
                                <p className="text-xs text-white">{request.admin_notes}</p>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-[10px] text-gray-300 font-mono">{request.id.slice(0, 8)}</span>
                              <div className="flex gap-2">
                                {request.data?.conversation_id && onOpenChat && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenChat(request.data.conversation_id);
                                    }}
                                    className="px-2.5 py-1 text-[11px] font-medium bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors flex items-center gap-1"
                                  >
                                    <MessageSquare size={10} />
                                    Continue
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Pagination Controls */}
              {filteredAIRequests.length > AI_REQUESTS_PER_PAGE && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    onClick={() => setAiRequestPage(p => Math.max(1, p - 1))}
                    disabled={aiRequestPage === 1}
                    className="px-2.5 py-1 text-xs font-medium rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Prev
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.ceil(filteredAIRequests.length / AI_REQUESTS_PER_PAGE) }, (_, i) => i + 1)
                      .slice(0, 5)
                      .map(page => (
                        <button
                          key={page}
                          onClick={() => setAiRequestPage(page)}
                          className={`w-6 h-6 text-xs font-medium rounded transition-colors ${
                            aiRequestPage === page
                              ? 'bg-gray-900 text-white'
                              : 'hover:bg-gray-100 text-gray-500'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                  </div>
                  <button
                    onClick={() => setAiRequestPage(p => Math.min(Math.ceil(filteredAIRequests.length / AI_REQUESTS_PER_PAGE), p + 1))}
                    disabled={aiRequestPage >= Math.ceil(filteredAIRequests.length / AI_REQUESTS_PER_PAGE)}
                    className="px-2.5 py-1 text-xs font-medium rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Break the Price Tab Content */}
      {activeTab === 'pricebreak' && (
        <>
          {loadingPriceBreak ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
            </div>
          ) : priceBreakRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No Price Break Requests</h3>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                Upload a competitor quote in the AI Chat to get a better price. Our team will beat any legitimate quote within 12 hours.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {priceBreakRequests.map((request) => (
                <div key={request.id} className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors">
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FileText size={20} className="text-gray-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {request.metadata?.reference || `#BTP-${request.id.slice(-6)}`}
                            </span>
                            <span className="text-xs text-gray-500 capitalize">
                              {request.service_type !== 'unknown' ? request.service_type : 'Quote'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(request.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPriceBreakStatusIcon(request.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getPriceBreakStatusColor(request.status)}`}>
                          {request.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Extracted Data */}
                    {request.quote_extracted_data && Object.keys(request.quote_extracted_data).length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-2">
                        <div className="text-xs font-medium text-gray-500 uppercase mb-2">Extracted Quote Data</div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {request.quote_extracted_data.route && (
                            <div className="flex items-start gap-2">
                              <MapPin size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-gray-500 text-xs">Route</div>
                                <div className="text-gray-900">{request.quote_extracted_data.route}</div>
                              </div>
                            </div>
                          )}
                          {request.quote_extracted_data.date && (
                            <div className="flex items-start gap-2">
                              <Calendar size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-gray-500 text-xs">Date</div>
                                <div className="text-gray-900">{request.quote_extracted_data.date}</div>
                              </div>
                            </div>
                          )}
                          {request.quote_extracted_data.aircraft && (
                            <div className="flex items-start gap-2">
                              <Plane size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-gray-500 text-xs">Aircraft</div>
                                <div className="text-gray-900">{request.quote_extracted_data.aircraft}</div>
                              </div>
                            </div>
                          )}
                          {request.quote_extracted_data.passengers && (
                            <div className="flex items-start gap-2">
                              <Users size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-gray-500 text-xs">Passengers</div>
                                <div className="text-gray-900">{request.quote_extracted_data.passengers}</div>
                              </div>
                            </div>
                          )}
                          {request.quote_extracted_data.broker && (
                            <div className="flex items-start gap-2">
                              <Sparkles size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-gray-500 text-xs">Competitor</div>
                                <div className="text-gray-900">{request.quote_extracted_data.broker}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Price Comparison */}
                    <div className="flex items-center gap-4 mb-4">
                      {request.competitor_price && (
                        <div className="flex-1 bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-xs text-gray-500 mb-1">Competitor Price</div>
                          <div className="text-lg font-semibold text-gray-700">
                            {request.competitor_currency} {request.competitor_price.toLocaleString()}
                          </div>
                        </div>
                      )}
                      {request.our_offer_price && (
                        <>
                          <div className="text-gray-400">→</div>
                          <div className="flex-1 bg-gray-900 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-300 mb-1">Our Offer</div>
                            <div className="text-lg font-bold text-white">
                              {request.our_offer_currency} {request.our_offer_price.toLocaleString()}
                            </div>
                            {request.savings_percentage && (
                              <div className="text-xs text-gray-300 mt-1">
                                Save {request.savings_percentage}%
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Coordinator Response */}
                    {request.response_message && (
                      <div className="bg-gray-100 p-4 rounded-lg mb-4 border border-gray-200">
                        <div className="text-xs font-medium text-gray-700 uppercase mb-2">Response from Sphera</div>
                        <p className="text-sm text-gray-900">{request.response_message}</p>
                        {request.responded_at && (
                          <div className="text-xs text-gray-500 mt-2">
                            Responded: {formatDate(request.responded_at)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Document Link */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">{request.metadata?.fileName || 'Quote Document'}</span>
                        {request.metadata?.pagesAnalyzed && (
                          <span className="ml-2 text-xs text-gray-400">
                            ({request.metadata.pagesAnalyzed} page{request.metadata.pagesAnalyzed > 1 ? 's' : ''} analyzed)
                          </span>
                        )}
                      </div>
                      {request.quote_file_url && (
                        <a
                          href={request.quote_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900 font-medium"
                        >
                          <ExternalLink size={14} />
                          View Document
                        </a>
                      )}
                    </div>

                    {/* Expiry Warning */}
                    {request.status === 'pending' && request.expires_at && (
                      <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        Response expected by: {formatDate(request.expires_at)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Regular Requests Tab Content */}
      {activeTab === 'requests' && (loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Error Loading Requests</h3>
          <p className="text-gray-500 mt-2">{error}</p>
          <button 
            onClick={fetchRequests}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                      {getRequestIcon(request.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">
                          {/* Show specific title if available, otherwise type name */}
                          {request.data?.offer_title || request.data?.adventure_title || request.data?.helicopter_name || request.data?.jet_name || request.data?.car_name || request.data?.yacht_name || getTypeName(request.type)}
                        </span>
                        {/* Items count badge for bulk requests */}
                        {request.data?.summary?.total_items > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                            {request.data.summary.total_items} item{request.data.summary.total_items > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {/* Show type as subtitle when we have a specific title */}
                      {(request.data?.offer_title || request.data?.adventure_title || request.data?.helicopter_name || request.data?.jet_name || request.data?.car_name || request.data?.yacht_name) && (
                        <div className="text-xs text-gray-400">
                          {getTypeName(request.type)}
                        </div>
                      )}
                      <div className="text-sm text-gray-500">
                        {formatDate(request.created_at)}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(request.status)}`}>
                    {request.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Request Details - Properly formatted */}
                <div className="text-sm text-gray-600 space-y-3">
                  {request.data && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      {/* Route Information */}
                      {(request.data.from || request.data.origin || request.data.departure_city || request.data.to || request.data.destination || request.data.arrival_city) && (
                        <div className="flex items-start gap-3">
                          <MapPin size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900">Route</div>
                            <div className="text-gray-700">
                              {request.data.from || request.data.origin || request.data.departure_city || '—'}
                              <span className="mx-2 text-gray-400">→</span>
                              {request.data.to || request.data.destination || request.data.arrival_city || '—'}
                            </div>
                            {(request.data.from_iata || request.data.to_iata) && (
                              <div className="text-xs text-gray-500">
                                {request.data.from_iata && `${request.data.from_iata}`}
                                {request.data.from_iata && request.data.to_iata && ' → '}
                                {request.data.to_iata && `${request.data.to_iata}`}
                              </div>
                            )}
                            {request.data.distance_km && (
                              <div className="text-xs text-gray-500">Distance: {request.data.distance_km.toLocaleString()} km</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Date & Time */}
                      {(request.data.date || request.data.departure_date || request.data.travel_date) && (
                        <div className="flex items-start gap-3">
                          <Calendar size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900">Date & Time</div>
                            <div className="text-gray-700">
                              {request.data.date || request.data.departure_date || request.data.travel_date}
                              {request.data.time && ` at ${request.data.time}`}
                              {request.data.departure_time && ` at ${request.data.departure_time}`}
                            </div>
                            {request.data.return_date && (
                              <div className="text-gray-600">Return: {request.data.return_date}</div>
                            )}
                            {request.data.estimated_flight_time && (
                              <div className="text-xs text-gray-500">Est. Flight Time: {request.data.estimated_flight_time}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Passengers */}
                      {(request.data.passengers || request.data.pax || request.data.guests) && (
                        <div className="flex items-start gap-3">
                          <Users size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900">Passengers</div>
                            <div className="text-gray-700">{request.data.passengers || request.data.pax || request.data.guests} passengers</div>
                          </div>
                        </div>
                      )}

                      {/* Aircraft / Vehicle Info */}
                      {(request.data.aircraft || request.data.aircraft_type || request.data.aircraft_model || request.data.vehicle || request.data.yacht_name) && (
                        <div className="flex items-start gap-3">
                          <Plane size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {request.type.includes('yacht') ? 'Yacht' : request.type.includes('car') ? 'Vehicle' : 'Aircraft'}
                            </div>
                            <div className="text-gray-700">
                              {request.data.aircraft || request.data.aircraft_type || request.data.aircraft_model || request.data.vehicle || request.data.yacht_name}
                            </div>
                            {request.data.aircraft_category && (
                              <div className="text-xs text-gray-500">Category: {request.data.aircraft_category}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Luxury Car Details */}
                      {(request.type === 'luxury_car_rental' || request.data.items?.some((i: any) => i.type === 'luxury_cars')) && (
                        <div className="flex items-start gap-3">
                          <Car size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900">Luxury Car</div>
                            {request.data.items?.filter((i: any) => i.type === 'luxury_cars').map((car: any, idx: number) => (
                              <div key={idx} className="text-gray-700 mt-1">
                                <div className="font-medium">{car.brand} {car.model}</div>
                                {car.year && <div className="text-xs text-gray-500">Year: {car.year}</div>}
                                {car.category && <div className="text-xs text-gray-500">Category: {car.category}</div>}
                                {car.transmission && <div className="text-xs text-gray-500">Transmission: {car.transmission}</div>}
                                {car.seats && <div className="text-xs text-gray-500">Seats: {car.seats}</div>}
                                {car.location && <div className="text-xs text-gray-500">Location: {car.location}</div>}
                                {car.rental_days && <div className="text-xs text-gray-500">Rental: {car.rental_days} day(s)</div>}
                                {(car.price || car.price_per_day) && (
                                  <div className="text-emerald-600 font-medium mt-1">
                                    €{(car.price || car.price_per_day || 0).toLocaleString()}{car.price_per_day ? '/day' : ''}
                                  </div>
                                )}
                              </div>
                            )) || (
                              <div className="text-gray-700">
                                {request.data.brand && `${request.data.brand} `}
                                {request.data.model && request.data.model}
                                {request.data.year && <div className="text-xs text-gray-500">Year: {request.data.year}</div>}
                                {request.data.category && <div className="text-xs text-gray-500">Category: {request.data.category}</div>}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Ground Transport / Taxi / Chauffeur Details */}
                      {(request.type === 'ground_transport' || request.data.items?.some((i: any) => i.type === 'ground_transport')) && (
                        <div className="flex items-start gap-3">
                          <Car size={16} className="text-teal-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900">Ground Transport</div>
                            {request.data.items?.filter((i: any) => i.type === 'ground_transport').map((transport: any, idx: number) => (
                              <div key={idx} className="text-gray-700 mt-1">
                                <div className="font-medium">{transport.name || `${transport.brand || ''} ${transport.model || ''}`.trim()}</div>
                                {transport.category && <div className="text-xs text-gray-500">Service: {transport.category}</div>}
                                {transport.seats && <div className="text-xs text-gray-500">Seats: {transport.seats}</div>}
                                {(transport.pickup_location || transport.from) && (
                                  <div className="text-xs text-gray-500">Pickup: {transport.pickup_location || transport.from}</div>
                                )}
                                {(transport.dropoff_location || transport.to) && (
                                  <div className="text-xs text-gray-500">Drop-off: {transport.dropoff_location || transport.to}</div>
                                )}
                                {transport.date && <div className="text-xs text-gray-500">Date: {transport.date}</div>}
                                {transport.time && <div className="text-xs text-gray-500">Time: {transport.time}</div>}
                                {(transport.price || transport.estimated_price) && (
                                  <div className="text-emerald-600 font-medium mt-1">
                                    €{(transport.price || transport.estimated_price || 0).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            )) || (
                              <div className="text-gray-700">
                                {request.data.vehicle_type || request.data.service_type || 'Chauffeur Service'}
                                {request.data.pickup_location && <div className="text-xs text-gray-500">Pickup: {request.data.pickup_location}</div>}
                                {request.data.dropoff_location && <div className="text-xs text-gray-500">Drop-off: {request.data.dropoff_location}</div>}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Yacht Charter Details */}
                      {request.type === 'yacht_charter' && (
                        <div className="flex items-start gap-3">
                          <Ship size={16} className="text-cyan-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-2">Yacht Charter Request</div>
                            <div className="space-y-1.5 text-gray-700">
                              {request.data.destination && (
                                <div className="flex items-start gap-2">
                                  <span className="text-gray-500 text-xs min-w-[80px]">Destination:</span>
                                  <span>{request.data.destination}</span>
                                </div>
                              )}
                              {request.data.dates && (
                                <div className="flex items-start gap-2">
                                  <span className="text-gray-500 text-xs min-w-[80px]">Dates:</span>
                                  <span>{request.data.dates}</span>
                                </div>
                              )}
                              {request.data.guests && (
                                <div className="flex items-start gap-2">
                                  <span className="text-gray-500 text-xs min-w-[80px]">Guests:</span>
                                  <span>{request.data.guests}</span>
                                </div>
                              )}
                              {request.data.budget && (
                                <div className="flex items-start gap-2">
                                  <span className="text-gray-500 text-xs min-w-[80px]">Budget:</span>
                                  <span>{request.data.budget}</span>
                                </div>
                              )}
                              {request.data.yacht_type && (
                                <div className="flex items-start gap-2">
                                  <span className="text-gray-500 text-xs min-w-[80px]">Yacht Type:</span>
                                  <span>{request.data.yacht_type}</span>
                                </div>
                              )}
                              {request.data.crew_preferences && (
                                <div className="flex items-start gap-2">
                                  <span className="text-gray-500 text-xs min-w-[80px]">Crew:</span>
                                  <span>{request.data.crew_preferences}</span>
                                </div>
                              )}
                              {request.data.activities && (
                                <div className="flex items-start gap-2">
                                  <span className="text-gray-500 text-xs min-w-[80px]">Activities:</span>
                                  <span>{request.data.activities}</span>
                                </div>
                              )}
                              {request.data.special_requests && request.data.special_requests !== 'None' && request.data.special_requests !== 'none' && (
                                <div className="flex items-start gap-2">
                                  <span className="text-gray-500 text-xs min-w-[80px]">Special:</span>
                                  <span>{request.data.special_requests}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Price / Total */}
                      {(request.data.price || request.data.total || request.data.estimated_price || request.data.total_price) && (
                        <div className="flex items-start gap-3">
                          <DollarSign size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900">Price</div>
                            <div className="text-gray-700 font-semibold">
                              €{(request.data.price || request.data.total || request.data.estimated_price || request.data.total_price || 0).toLocaleString()}
                            </div>
                            {request.data.price_breakdown && (
                              <div className="text-xs text-gray-500">{request.data.price_breakdown}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Payment Method */}
                      {request.data.payment_method && (
                        <div className="flex items-start gap-3">
                          <CreditCard size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900">Payment Method</div>
                            <div className="text-gray-700 capitalize">
                              {request.data.payment_method === 'crypto' ? 'Cryptocurrency (70+ currencies)' :
                               request.data.payment_method === 'bank' ? 'Bank Transfer' :
                               request.data.payment_method === 'card' ? 'Credit Card' :
                               request.data.payment_method}
                            </div>
                            {request.data.wallet_address && (
                              <div className="text-xs text-gray-500 font-mono">Wallet: {request.data.wallet_address.slice(0, 8)}...{request.data.wallet_address.slice(-6)}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Catering */}
                      {request.data.catering && (
                        <div className="flex items-start gap-3">
                          <Utensils size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900">Catering</div>
                            {typeof request.data.catering === 'object' ? (
                              <div className="text-gray-700">
                                {request.data.catering.package && <div>Package: {request.data.catering.package}</div>}
                                {request.data.catering.dietary && <div className="text-xs text-gray-500">Dietary: {request.data.catering.dietary}</div>}
                                {request.data.catering.allergies && <div className="text-xs text-gray-500">Allergies: {request.data.catering.allergies}</div>}
                                {request.data.catering.specialRequests && <div className="text-xs text-gray-500">Special: {request.data.catering.specialRequests}</div>}
                              </div>
                            ) : (
                              <div className="text-gray-700">{request.data.catering}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* AI Bulk Request Summary */}
                      {request.type === 'ai_chat_bulk' && request.data.summary && (
                        <div className="flex items-start gap-3 mb-4">
                          <Sparkles size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-2">Request Summary</div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="bg-gray-100 p-2 rounded">
                                <div className="text-gray-600 text-xs">Services</div>
                                <div className="font-semibold text-gray-900">{request.data.summary.services_count || 0}</div>
                              </div>
                              {request.data.summary.extras_count > 0 && (
                                <div className="bg-gray-100 p-2 rounded">
                                  <div className="text-gray-600 text-xs">Custom Extras</div>
                                  <div className="font-semibold text-gray-900">{request.data.summary.extras_count} (TBC)</div>
                                </div>
                              )}
                              <div className="bg-gray-100 p-2 rounded col-span-2">
                                <div className="text-gray-600 text-xs">Estimated Total</div>
                                <div className="font-semibold text-gray-900 text-lg">
                                  {request.data.summary.has_estimates ? '~' : ''}€{(request.data.summary.grand_total || 0).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            {request.data.summary.has_custom_requests && (
                              <div className="mt-2 text-xs text-gray-600 flex items-center gap-1">
                                <Clock size={12} />
                                Custom items require availability confirmation
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Multiple Items (Cart) */}
                      {request.data.items && Array.isArray(request.data.items) && request.data.items.length > 0 && (
                        <div className="flex items-start gap-3">
                          <Package size={16} className="text-pink-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-2">
                              {request.type === 'ai_chat_bulk' ? 'Requested Items' : 'Cart Items'} ({request.data.items.length})
                            </div>
                            <div className="space-y-2">
                              {request.data.items.map((item: any, idx: number) => (
                                <div key={idx} className={`bg-white p-2 rounded border ${item.type === 'custom_extra' ? 'border-amber-200' : 'border-gray-200'}`}>
                                  <div className="flex justify-between items-start">
                                    <div className="font-medium text-gray-800">
                                      {item.name || item.aircraft_model || item.title ||
                                       (item.brand && item.model ? `${item.brand} ${item.model}` : 'Item')}
                                    </div>
                                    {(item.price || item.estimated_price || item.price_per_day) && (
                                      <div className={`text-sm font-semibold ${item.isEstimate ? 'text-gray-600' : 'text-emerald-600'}`}>
                                        {item.isEstimate ? '~' : ''}€{(item.price || item.estimated_price || item.price_per_day || 0).toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-600 space-y-0.5 mt-1">
                                    {item.type && (
                                      <span className={`inline-block px-1.5 py-0.5 rounded capitalize mr-1 ${
                                        item.type === 'custom_extra' ? 'bg-amber-100 text-amber-700' :
                                        item.type === 'jets' ? 'bg-blue-100 text-blue-700' :
                                        item.type === 'helicopters' ? 'bg-green-100 text-green-700' :
                                        item.type === 'yachts' ? 'bg-cyan-100 text-cyan-700' :
                                        item.type === 'luxury_cars' ? 'bg-gray-200 text-gray-800' :
                                        item.type === 'ground_transport' ? 'bg-teal-100 text-teal-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {item.type === 'luxury_cars' ? 'Supercar' :
                                         item.type === 'ground_transport' ? 'Transfer' :
                                         item.type === 'jets' ? 'Private Jet' :
                                         item.type === 'helicopters' ? 'Helicopter' :
                                         item.type === 'yachts' ? 'Yacht' :
                                         item.type === 'empty_legs' ? 'Empty Leg' :
                                         item.type === 'custom_extra' ? (item.category || 'Extra') :
                                         item.type.replace('_', ' ')}
                                      </span>
                                    )}
                                    {item.requiresConfirmation && (
                                      <span className="inline-block px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-[10px]">TBC</span>
                                    )}

                                    {/* Route for flights - with IATA codes */}
                                    {(item.from || item.origin) && (item.to || item.destination) && (
                                      <div className="font-medium text-gray-700">
                                        {item.from || item.origin} → {item.to || item.destination}
                                        {(item.from_iata || item.to_iata) && (
                                          <span className="text-gray-500 ml-1">
                                            ({item.from_iata || ''}{item.from_iata && item.to_iata ? ' → ' : ''}{item.to_iata || ''})
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {/* Date & Time - CRITICAL */}
                                    {(item.date || item.departure_date) && (
                                      <div className="flex items-center gap-1">
                                        <Calendar size={10} className="text-gray-400" />
                                        <span>{item.date || item.departure_date}</span>
                                        {(item.time || item.departure_time) && (
                                          <span className="ml-1">at {item.time || item.departure_time}</span>
                                        )}
                                      </div>
                                    )}
                                    {item.return_date && (
                                      <div className="text-gray-500">Return: {item.return_date}</div>
                                    )}

                                    {/* Passengers */}
                                    {(item.passengers || item.pax) && (
                                      <div className="flex items-center gap-1">
                                        <Users size={10} className="text-gray-400" />
                                        <span>{item.passengers || item.pax} passengers</span>
                                      </div>
                                    )}

                                    {/* Flight details for jets/helicopters */}
                                    {(item.type === 'jets' || item.type === 'helicopters') && (
                                      <>
                                        {item.aircraft_model && <div>Aircraft: {item.aircraft_model}</div>}
                                        {item.estimated_flight_time && <div>Flight time: {item.estimated_flight_time}</div>}
                                        {item.distance_km && <div>Distance: {item.distance_km.toLocaleString()} km</div>}
                                        {item.range_km && <div>Range: {item.range_km.toLocaleString()} km</div>}
                                      </>
                                    )}

                                    {/* Custom extra details */}
                                    {item.type === 'custom_extra' && (
                                      <>
                                        {item.quantity && item.quantity > 1 && <div>Qty: {item.quantity}</div>}
                                        {item.notes && <div className="text-gray-500 italic">"{item.notes}"</div>}
                                      </>
                                    )}

                                    {/* Luxury car details */}
                                    {item.type === 'luxury_cars' && (
                                      <>
                                        {item.category && <div>Category: {item.category}</div>}
                                        {item.year && <div>Year: {item.year}</div>}
                                        {item.transmission && <div>Transmission: {item.transmission}</div>}
                                        {item.seats && <div>Seats: {item.seats}</div>}
                                        {item.horsepower && <div>Power: {item.horsepower} HP</div>}
                                        {item.location && <div>Location: {item.location}</div>}
                                        {item.rental_days && <div>Rental: {item.rental_days} day(s)</div>}
                                        {item.price_per_day && <div>Rate: €{item.price_per_day.toLocaleString()}/day</div>}
                                      </>
                                    )}

                                    {/* Ground transport details */}
                                    {item.type === 'ground_transport' && (
                                      <>
                                        {(item.service_type || item.category) && <div>Service: {item.service_type || item.category}</div>}
                                        {item.seats && <div>Seats: {item.seats}</div>}
                                        {(item.pickup_location || item.from) && <div>Pickup: {item.pickup_location || item.from}</div>}
                                        {(item.dropoff_location || item.to) && <div>Drop-off: {item.dropoff_location || item.to}</div>}
                                        {item.duration && <div>Duration: {item.duration}</div>}
                                        {item.distanceKm && <div>Distance: {item.distanceKm} km</div>}
                                      </>
                                    )}

                                    {/* Yacht details */}
                                    {item.type === 'yachts' && (
                                      <>
                                        {item.length_m && <div>Length: {item.length_m}m</div>}
                                        {item.cabins && <div>Cabins: {item.cabins}</div>}
                                        {item.crew && <div>Crew: {item.crew}</div>}
                                        {item.price_per_week && <div>Rate: €{item.price_per_week.toLocaleString()}/week</div>}
                                      </>
                                    )}

                                    {/* Catering */}
                                    {item.cateringOption && item.cateringOption !== 'standard' && (
                                      <div className="flex items-center gap-1">
                                        <Utensils size={10} className="text-gray-400" />
                                        <span>Catering: {item.cateringOption}</span>
                                        {item.cateringPrice > 0 && <span className="text-gray-500">(+€{item.cateringPrice})</span>}
                                      </div>
                                    )}

                                    {/* Airport fee */}
                                    {item.airportPickupFee > 0 && (
                                      <div className="text-gray-500">Airport fee: €{item.airportPickupFee}</div>
                                    )}

                                    {/* Notes */}
                                    {item.notes && item.type !== 'custom_extra' && (
                                      <div className="text-gray-500 italic mt-1">Note: {item.notes}</div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Special Requests / Notes */}
                      {(request.data.notes || request.data.special_requests || request.data.message) && (
                        <div className="flex items-start gap-3">
                          <Clock size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900">Notes</div>
                            <div className="text-gray-700">{request.data.notes || request.data.special_requests || request.data.message}</div>
                          </div>
                        </div>
                      )}

                      {/* Request ID */}
                      {request.data.request_id && (
                        <div className="pt-2 border-t border-gray-200 text-xs text-gray-500">
                          Request ID: {request.data.request_id}
                        </div>
                      )}
                    </div>
                  )}

                  {request.admin_notes && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="font-medium text-blue-800 text-xs uppercase tracking-wide">Admin Response</div>
                      <p className="mt-1 text-blue-900">{request.admin_notes}</p>
                    </div>
                  )}

                  {request.completed_at && (
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={12} />
                      Completed: {formatDate(request.completed_at)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <History size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No Requests Yet</h3>
          <p className="text-gray-500 mt-2">
            {searchTerm || typeFilter !== 'all'
              ? 'No requests match your search criteria'
              : 'Your requests will appear here once you make your first booking or support request'}
          </p>
          {(searchTerm || typeFilter !== 'all') && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
              }}
              className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          )}
          {!searchTerm && typeFilter === 'all' && (
            <div className="mt-4 space-y-2">
              <button 
                onClick={() => window.location.href = '/'}
                className="block mx-auto px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Book Your First Flight
              </button>
              <button 
                onClick={createSampleRequest}
                className="block mx-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Create Sample Request (Demo)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}