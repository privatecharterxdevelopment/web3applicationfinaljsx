import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../../thefinalwebapplicationpcx-main/src/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell({ isOpen, setIsOpen, onNavigate, onViewAll }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      const unread = (data || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notification event:', payload);

          if (payload.eventType === 'INSERT') {
            // Add new notification to the top
            setNotifications(prev => [payload.new, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Optional: Show browser notification
            if (Notification.permission === 'granted') {
              new Notification(payload.new.title, {
                body: payload.new.message,
                icon: payload.new.image_url || '/logo.png'
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            // Update existing notification
            setNotifications(prev =>
              prev.map(n => n.id === payload.new.id ? payload.new : n)
            );
            // Recalculate unread count
            fetchNotifications();
          } else if (payload.eventType === 'DELETE') {
            // Remove notification
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
            fetchNotifications();
          }
        }
      )
      .subscribe();

    // Request browser notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);

    if (notification.action_url && onNavigate) {
      onNavigate(notification.action_url);
      setIsOpen(false);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    const icons = {
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
      payment_link_sent: '💳'
    };
    return icons[type] || '🔔';
  };

  return (
    <>
      {/* Dropdown Panel */}
      {isOpen && (
        <div ref={dropdownRef}>
        <div className="absolute right-0 mt-2 w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-gray-700" />
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  title="Mark all as read"
                >
                  <CheckCheck size={16} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[500px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-gray-600">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-light">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${
                      !notification.is_read ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-black rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                          <button
                            onClick={(e) => deleteNotification(notification.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - View All Link (Always show unless loading) */}
          {!isLoading && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50/50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (onViewAll) onViewAll();
                }}
                className="w-full text-xs text-center text-blue-600 hover:text-blue-700 font-semibold hover:bg-blue-50 py-2 rounded-lg transition-colors"
              >
                View All Notifications →
              </button>
            </div>
          )}
        </div>
        </div>
      )}
    </>
  );
}

// Export function to get unread count (can be used by parent component)
export function useNotificationCount(userId) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const fetchCount = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (!error) {
        setUnreadCount(data?.length || 0);
      }
    };

    fetchCount();

    // Subscribe to changes
    const channel = supabase
      .channel('notification-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => fetchCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return unreadCount;
}
