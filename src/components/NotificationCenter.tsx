import React, { useState, useEffect } from 'react';
import { Bell, Mail, Calendar, Plane, FileCheck, Check, X, Trash2, Search, Filter, CheckCircle, Circle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../../thefinalwebapplicationpcx-main/src/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  action_url?: string;
  metadata?: any;
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Subscribe to real-time updates
      const channel = supabase
        .channel('notifications-page')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) {
      setError('Please log in to view notifications');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      waitlist_join: '🎯',
      p2p_bid: '💰',
      p2p_bid_accepted: '✅',
      p2p_bid_rejected: '❌',
      new_project_launched: '🚀',
      project_approved: '✅',
      project_rejected: '❌',
      support_ticket_created: '📝',
      support_ticket_response: '💬',
      launchpad_bid: '💎',
      token_purchase: '🪙',
      token_sale: '💵',
      marketplace_purchase: '🛍️',
      payment_received: '💳',
      kyc_approved: '✅',
      kyc_rejected: '❌',
      transaction_completed: '✅',
      calendar_entry: '📅',
      request_placed: '📝',
      request_confirmed: '✅',
      request_rejected: '❌',
      payment_link_sent: '💳',
      welcome: '👋',
      taxi_booking_confirmed: '🚗',
      taxi_quote_requested: '🚕',
      booking_update: '✈️',
      document_status: '📄'
    };
    return icons[type] || '🔔';
  };

  const filteredNotifications = notifications.filter(notification => {
    // Filter by tab
    let matchesTab = true;
    if (activeTab === 'unread') {
      matchesTab = !notification.is_read;
    } else if (activeTab === 'booking_update') {
      // Booking related notifications
      matchesTab = ['booking_update', 'taxi_booking_confirmed', 'taxi_quote_requested'].includes(notification.type);
    } else if (activeTab === 'document_status') {
      // Document related notifications
      matchesTab = ['document_status', 'kyc_approved', 'kyc_rejected'].includes(notification.type);
    } else if (activeTab === 'p2p_bid') {
      // P2P Marketplace related notifications
      matchesTab = ['p2p_bid', 'p2p_bid_accepted', 'p2p_bid_rejected', 'marketplace_purchase'].includes(notification.type);
    } else if (activeTab === 'calendar_entry') {
      // Calendar related notifications
      matchesTab = ['calendar_entry', 'request_placed', 'request_confirmed', 'request_rejected'].includes(notification.type);
    } else if (activeTab !== 'all') {
      matchesTab = notification.type === activeTab;
    }

    // Filter by search query
    const matchesSearch = searchQuery === '' ||
      notification.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.type?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  // Group notifications by date
  const groupNotificationsByDate = (notifications: Notification[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { [key: string]: Notification[] } = {
      'Today': [],
      'Yesterday': [],
      'Older': []
    };

    notifications.forEach(notification => {
      const notifDate = new Date(notification.created_at);
      notifDate.setHours(0, 0, 0, 0);

      if (notifDate.getTime() === today.getTime()) {
        groups['Today'].push(notification);
      } else if (notifDate.getTime() === yesterday.getTime()) {
        groups['Yesterday'].push(notification);
      } else {
        groups['Older'].push(notification);
      }
    });

    return groups;
  };

  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="w-full h-full p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle size={16} />
          Mark All Read
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search notifications by title, message, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300/50 rounded-lg bg-white/60 text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
            style={{ backdropFilter: 'blur(10px) saturate(150%)' }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-white/60 text-gray-700 hover:bg-white/80 border border-gray-300/50'
            }`}
            style={activeTab !== 'all' ? { backdropFilter: 'blur(10px) saturate(150%)' } : {}}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'unread'
                ? 'bg-gray-900 text-white'
                : 'bg-white/60 text-gray-700 hover:bg-white/80 border border-gray-300/50'
            }`}
            style={activeTab !== 'unread' ? { backdropFilter: 'blur(10px) saturate(150%)' } : {}}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button
            onClick={() => setActiveTab('booking_update')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'booking_update'
                ? 'bg-gray-900 text-white'
                : 'bg-white/60 text-gray-700 hover:bg-white/80 border border-gray-300/50'
            }`}
            style={activeTab !== 'booking_update' ? { backdropFilter: 'blur(10px) saturate(150%)' } : {}}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveTab('document_status')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'document_status'
                ? 'bg-gray-900 text-white'
                : 'bg-white/60 text-gray-700 hover:bg-white/80 border border-gray-300/50'
            }`}
            style={activeTab !== 'document_status' ? { backdropFilter: 'blur(10px) saturate(150%)' } : {}}
          >
            Documents
          </button>
          <button
            onClick={() => setActiveTab('p2p_bid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'p2p_bid'
                ? 'bg-gray-900 text-white'
                : 'bg-white/60 text-gray-700 hover:bg-white/80 border border-gray-300/50'
            }`}
            style={activeTab !== 'p2p_bid' ? { backdropFilter: 'blur(10px) saturate(150%)' } : {}}
          >
            P2P Bids
          </button>
          <button
            onClick={() => setActiveTab('calendar_entry')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'calendar_entry'
                ? 'bg-gray-900 text-white'
                : 'bg-white/60 text-gray-700 hover:bg-white/80 border border-gray-300/50'
            }`}
            style={activeTab !== 'calendar_entry' ? { backdropFilter: 'blur(10px) saturate(150%)' } : {}}
          >
            Calendar
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Bell className="w-12 h-12 text-red-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Notifications</h3>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Bell className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No notifications found' : 'No notifications yet'}
          </h3>
          <p className="text-sm text-gray-500">
            {searchQuery
              ? 'Try adjusting your search'
              : activeTab === 'unread'
              ? 'All caught up! You have no unread notifications.'
              : activeTab === 'booking_update'
              ? 'No booking updates at the moment.'
              : activeTab === 'document_status'
              ? 'No document status updates.'
              : 'You will see notifications here as they come in.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Render grouped notifications */}
          {Object.entries(groupedNotifications).map(([dateGroup, groupNotifications]) => {
            if (groupNotifications.length === 0) return null;

            return (
              <div key={dateGroup}>
                <h2 className="text-sm font-semibold text-gray-500 mb-3 px-1">
                  {dateGroup}
                </h2>
                <div className="space-y-3">
                  {groupNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`border rounded-xl p-4 transition-all ${
                        !notification.is_read
                          ? 'border-gray-400/60 bg-white/50 shadow-sm'
                          : 'border-gray-300/50 bg-white/35'
                      } hover:bg-white/60`}
                      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Notification Icon */}
                        <div className={`w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center text-lg ${
                          !notification.is_read ? 'bg-gray-100' : 'bg-gray-50'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Notification Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`font-medium text-sm ${
                                  !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {notification.title}
                                </h3>
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                                  {notification.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 ml-2">
                              {!notification.is_read && (
                                <button
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Mark as read"
                                >
                                  <CheckCircle size={16} className="text-gray-600" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(notification.id)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete notification"
                              >
                                <Trash2 size={16} className="text-red-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}