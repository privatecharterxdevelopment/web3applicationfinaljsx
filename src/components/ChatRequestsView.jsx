import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, Users, DollarSign, Package, Clock, CheckCircle, XCircle, AlertCircle, CalendarPlus, FileText, Loader2, Download, ChevronDown } from 'lucide-react';
import CreateEventModal from './Calendar/CreateEventModal';
import { generateRequestConfirmationPDF, savePDFToStorage } from '../services/pdfGeneratorService';
import { generateRequestConfirmationHTML, downloadHTMLAsPDF } from '../services/pdfHtmlGenerator';
import { format, formatDistanceToNow } from 'date-fns';

/**
 * ChatRequestsView - Shows user's saved chat requests from AI Chat
 * Enhanced with cart items display and PDF download functionality
 */
const ChatRequestsView = ({ userId, user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Service type to icon mapping
  const getServiceIcon = (type) => {
    const icons = {
      'jets': '✈️',
      'private-jet': '✈️',
      'jet': '✈️',
      'private_jet': '✈️',
      'helicopters': '🚁',
      'helicopter': '🚁',
      'empty_legs': '✈️',
      'emptyleg': '✈️',
      'empty_leg': '✈️',
      'luxury_cars': '🚗',
      'cars': '🚗',
      'car': '🚗',
      'yachts': '🛥️',
      'yacht': '🛥️',
      'adventures': '🏔️',
      'adventure': '🏔️',
      'taxi': '🚕',
      'ground_transport': '🚕',
      'transfer': '🚕',
      'wine': '🍷',
      'wines': '🍷',
      'champagne': '🍾',
      'cigars': '🚬',
      'caviar': '🥂',
      'delicatesse': '🍾',
      'delicacies': '🍾',
      'concierge': '🎩',
      'restaurant': '🍽️',
      'flowers': '💐',
      'tokenization': '🪙'
    };
    return icons[type?.toLowerCase()] || '📝';
  };

  // Service type to category name mapping
  const getCategoryName = (type) => {
    const categories = {
      'jets': 'Private Jet Charter',
      'private-jet': 'Private Jet Charter',
      'jet': 'Private Jet Charter',
      'private_jet': 'Private Jet Charter',
      'helicopters': 'Helicopter Charter',
      'helicopter': 'Helicopter Charter',
      'empty_legs': 'Empty Leg Flight',
      'emptyleg': 'Empty Leg Flight',
      'empty_leg': 'Empty Leg Flight',
      'luxury_cars': 'Luxury Car Rental',
      'cars': 'Car Rental',
      'car': 'Ground Transport',
      'yachts': 'Yacht Charter',
      'yacht': 'Yacht Charter',
      'adventures': 'Adventure Package',
      'adventure': 'Adventure Package',
      'taxi': 'Airport Transfer',
      'ground_transport': 'Ground Transport',
      'transfer': 'Airport Transfer',
      'wine': 'Premium Wines',
      'wines': 'Premium Wines',
      'champagne': 'Champagne',
      'cigars': 'Premium Cigars',
      'caviar': 'Caviar & Delicacies',
      'delicatesse': 'Delicacies',
      'delicacies': 'Delicacies',
      'concierge': 'Concierge Service',
      'restaurant': 'Restaurant Reservation',
      'flowers': 'Flowers & Gifts',
      'tokenization': 'Asset Tokenization'
    };
    return categories[type?.toLowerCase()] || type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Service';
  };

  // Handle PDF download for a request
  const handleDownloadPDF = async (request, e) => {
    if (e) e.stopPropagation();
    setGeneratingPDF(request.id);
    try {
      // Parse cart items from request metadata if available
      const cartItems = request.cart_items || request.metadata?.cart_items || [];

      // Format request data for PDF generator
      const pdfRequest = {
        id: request.id,
        type: request.service_type || 'chat_request',
        service_type: request.service_type,
        created_at: request.created_at,
        client_email: user?.email,
        client_name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
        client_phone: user?.user_metadata?.phone || user?.phone || '',
        data: {
          query: request.query,
          from: request.from_location,
          to: request.to_location,
          date: request.date_start,
          passengers: request.passengers,
          budget: request.budget,
          name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
          email: user?.email,
          phone: user?.user_metadata?.phone || user?.phone || '',
          cart_items: cartItems
        }
      };

      // Create detailed cart items for HTML PDF
      let detailedCartItems = [];

      if (cartItems.length > 0) {
        detailedCartItems = cartItems.map(item => ({
          type: item.type || request.service_type,
          name: item.name || item.rawItemName || item.title || request.query,
          rawItemName: item.rawItemName || item.name || item.title,
          category: item.category || getCategoryName(item.type || request.service_type),
          details: {
            from: item.from || item.from_city || request.from_location,
            to: item.to || item.to_city || request.to_location,
            date: item.date || item.departure_date || request.date_start,
            passengers: item.passengers || request.passengers
          },
          price: item.price || item.basePrice || item.totalWithFee || 0,
          currency: item.currency || 'USD',
          quantity: item.quantity || 1
        }));
      } else {
        // Single item request
        detailedCartItems = [{
          type: request.service_type || 'chat_request',
          name: request.query || 'Chat Request',
          rawItemName: request.query || 'Chat Request',
          category: getCategoryName(request.service_type),
          details: {
            from: request.from_location,
            to: request.to_location,
            date: request.date_start,
            passengers: request.passengers
          },
          price: request.budget || 0,
          currency: 'USD',
          quantity: 1
        }];
      }

      // Generate beautiful HTML-based PDF (user-facing)
      const htmlContent = generateRequestConfirmationHTML(pdfRequest, detailedCartItems, {
        userName: user?.user_metadata?.full_name || user?.user_metadata?.name || 'Valued Client',
        userEmail: user?.email
      });

      // Download PDF
      await downloadHTMLAsPDF(htmlContent, `PrivateCharterX_Request_${request.id.substring(0, 8).toUpperCase()}.pdf`);

      // Also save jsPDF version to storage for admin CRM access
      try {
        const { blob, filename } = await generateRequestConfirmationPDF(pdfRequest);
        await savePDFToStorage(blob, filename, 'chat_request', request.id);
      } catch (storageErr) {
        console.warn('Could not save PDF to storage:', storageErr);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setGeneratingPDF(null);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchChatRequests();
    }
  }, [userId, filter]);

  const fetchChatRequests = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('chat_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching chat requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Pending' },
      in_progress: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'In Progress' },
      completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Completed' },
      cancelled: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Cancelled' }
    };
    return configs[status] || configs.pending;
  };

  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount && amount !== 0) return '-';
    const symbols = { USD: '$', EUR: '€', GBP: '£', CHF: 'CHF ' };
    const symbol = symbols[currency] || '$';
    return `${symbol}${Number(amount).toLocaleString()}`;
  };

  // Get request title - show first item + more if cart
  const getRequestTitle = (request) => {
    const cartItems = request.cart_items || request.metadata?.cart_items || [];
    if (cartItems.length > 1) {
      const firstName = cartItems[0]?.name || cartItems[0]?.title || cartItems[0]?.rawItemName;
      if (firstName) {
        return `${firstName} + ${cartItems.length - 1} more`;
      }
      return `${cartItems.length} Items`;
    }
    return request.query || 'Chat Request';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Chat Requests</h2>
        <p className="text-gray-600">
          View all your travel search requests from AI Chat. Download PDF confirmations anytime.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              filter === status
                ? 'bg-black text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests yet</h3>
          <p className="text-gray-600 mb-6">
            When you search for services in AI Chat, they'll be saved here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const statusConfig = getStatusConfig(request.status);
            const StatusIcon = statusConfig.icon;
            const isExpanded = expandedId === request.id;
            const cartItems = request.cart_items || request.metadata?.cart_items || [];
            const hasCartItems = cartItems.length > 0;

            return (
              <div
                key={request.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-all"
              >
                {/* Main Row - Clickable to expand */}
                <div
                  className="px-4 py-4 flex items-center gap-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : request.id)}
                >
                  {/* Service Icon */}
                  <div className="text-2xl flex-shrink-0">
                    {getServiceIcon(request.service_type)}
                  </div>

                  {/* Title & Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {getRequestTitle(request)}
                      </p>
                      {hasCartItems && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full">
                          {cartItems.length} items
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{getCategoryName(request.service_type)}</span>
                      {request.date_start && (
                        <>
                          <span>•</span>
                          <span>{format(new Date(request.date_start), 'MMM d, yyyy')}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>

                  {/* Budget/Price */}
                  {request.budget && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(request.budget)}
                      </p>
                      <p className="text-[10px] text-gray-400">Budget</p>
                    </div>
                  )}

                  {/* Expand Icon */}
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                    {/* Cart Items Display */}
                    {hasCartItems && (
                      <div className="mb-4">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">
                          Order Items ({cartItems.length})
                        </p>
                        <div className="space-y-2">
                          {cartItems.map((item, idx) => {
                            const itemIcon = getServiceIcon(item.type);
                            const categoryName = getCategoryName(item.type);
                            const itemName = item.name || item.title || item.rawItemName || categoryName;
                            const itemPrice = item.price || item.basePrice || item.totalWithFee || 0;
                            const hasRoute = item.from || item.to || item.from_city || item.to_city;

                            return (
                              <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                <span className="text-xl">{itemIcon}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{itemName}</p>
                                  <p className="text-[10px] text-gray-500">{categoryName}</p>
                                  {hasRoute && (
                                    <p className="text-xs text-gray-600 mt-0.5">
                                      {item.from || item.from_city} → {item.to || item.to_city}
                                    </p>
                                  )}
                                  {(item.date || item.departure_date) && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {format(new Date(item.date || item.departure_date), 'MMM d, yyyy')}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {formatCurrency(itemPrice, item.currency)}
                                  </p>
                                  {item.quantity > 1 && (
                                    <p className="text-[10px] text-gray-500">x{item.quantity}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Request Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {request.service_type && (
                        <div className="flex items-center gap-2">
                          <Package size={14} className="text-gray-400" />
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase">Service</p>
                            <p className="text-sm font-medium text-gray-900">
                              {getCategoryName(request.service_type)}
                            </p>
                          </div>
                        </div>
                      )}

                      {(request.from_location || request.to_location) && (
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-gray-400" />
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase">Route</p>
                            <p className="text-sm font-medium text-gray-900">
                              {request.from_location || 'Any'} → {request.to_location || 'Any'}
                            </p>
                          </div>
                        </div>
                      )}

                      {request.date_start && (
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase">Date</p>
                            <p className="text-sm font-medium text-gray-900">
                              {format(new Date(request.date_start), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      )}

                      {request.passengers && (
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-gray-400" />
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase">Passengers</p>
                            <p className="text-sm font-medium text-gray-900">{request.passengers}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Results Summary */}
                    {request.has_results && request.results_summary && (
                      <div className="bg-green-50 rounded-lg p-3 mb-4 border border-green-200">
                        <p className="text-xs text-green-600 font-medium mb-2">✓ Found Results:</p>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(request.results_summary).map(([key, count]) => (
                            <div key={key} className="text-xs">
                              <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                              <span className="ml-1 font-semibold text-gray-900">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Special Requirements */}
                    {request.special_requirements && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <p className="text-[10px] text-gray-400 uppercase mb-1">Special Requirements</p>
                        <p className="text-sm text-gray-900">{request.special_requirements}</p>
                      </div>
                    )}

                    {/* Notes from Admin */}
                    {request.notes && (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 mb-4">
                        <p className="text-xs text-blue-600 font-medium mb-1">Update from our team:</p>
                        <p className="text-sm text-gray-900">{request.notes}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                      {/* Download PDF Button - Always available */}
                      <button
                        onClick={(e) => handleDownloadPDF(request, e)}
                        disabled={generatingPDF === request.id}
                        className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {generatingPDF === request.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Download size={16} />
                        )}
                        {generatingPDF === request.id ? 'Generating...' : 'Download PDF'}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequest(request);
                          setShowCalendarModal(true);
                        }}
                        className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <CalendarPlus size={16} />
                        Calendar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendarModal && selectedRequest && (
        <CreateEventModal
          onClose={() => {
            setShowCalendarModal(false);
            setSelectedRequest(null);
          }}
          onEventCreated={() => {
            setShowCalendarModal(false);
            setSelectedRequest(null);
            fetchChatRequests();
          }}
          user={user}
          linkedChatRequest={selectedRequest}
        />
      )}
    </div>
  );
};

export default ChatRequestsView;
