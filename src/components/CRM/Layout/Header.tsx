import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, User, LogOut, Settings, ChevronDown, Clock, MapPin, X, MessageSquare, Menu, Shield, Briefcase } from 'lucide-react';
import { useAuth } from '../../../contexts/CRM/AuthContext';
import { ProfileSettings } from '../Profile/ProfileSettings';
import { supabase } from '../../../lib/supabase';

interface LocationData {
  timezone: string;
  city: string;
  country: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  data: any;
  is_read: boolean;
  created_at: string;
}

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<LocationData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Get user's location and timezone based on IP
    const fetchLocation = async () => {
      try {
        // Create an AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch('https://ipapi.co/json/', {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Validate the response data
        if (data && data.timezone) {
          setLocation({
            timezone: data.timezone,
            city: data.city || 'Unknown',
            country: data.country_name || 'Unknown'
          });
        } else {
          throw new Error('Invalid response data');
        }
      } catch (error) {
        console.warn('Error fetching location data:', error);
        
        // Fallback to browser timezone and generic location
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setLocation({
          timezone: browserTimezone,
          city: 'Your Location',
          country: 'Local Time'
        });
      }
    };

    fetchLocation();
  }, []);

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      
      // Set up real-time subscription for notifications
      const subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications'
          },
          (payload) => {
            // Check if the notification is for the current user
            const notification = payload.new as Notification;
            
            // Get current user from system_users
            supabase
              .from('system_users')
              .select('id')
              .eq('email', user.email)
              .single()
              .then(({ data: systemUser }) => {
                if (systemUser && notification.user_id === systemUser.id) {
                  setNotifications(prev => [notification, ...prev]);
                  setUnreadCount(prev => prev + 1);
                  
                  // Show browser notification
                  if (Notification && Notification.permission === 'granted') {
                    new Notification(notification.title, {
                      body: notification.message || '',
                      icon: '/vite.svg'
                    });
                  }
                }
              });
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user?.id, user?.email]);

  // Request notification permission
  useEffect(() => {
    if (Notification && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  const fetchNotifications = async () => {
    if (!user?.email) return;

    try {
      // Get current user from system_users
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!systemUser) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', systemUser.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAsRead = async (notificationId: string) => {
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
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.email) return;

    try {
      // Get current user from system_users
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!systemUser) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', systemUser.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const formatTime = (date: Date, timezone?: string) => {
    if (!timezone) return date.toLocaleTimeString();
    
    try {
      return date.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (error) {
      return date.toLocaleTimeString();
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'calendar_invitation':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'booking_request':
        return <Bell className="w-4 h-4 text-yellow-500" />;
      case 'chat_message':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Handle different notification types
    switch (notification.type) {
      case 'calendar_invitation':
        // Navigate to calendar
        window.location.hash = '#calendar';
        break;
      case 'booking_request':
        // Navigate to bookings
        window.location.hash = '#bookings';
        break;
      case 'chat_message':
        // Navigate to chat
        window.location.hash = '#chat';
        break;
    }
    
    setShowNotifications(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'sales': return 'bg-green-100 text-green-800';
      case 'marketing': return 'bg-purple-100 text-purple-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'sales': return <DollarSign className="w-4 h-4" />;
      case 'marketing': return <Mail className="w-4 h-4" />;
      default: return <Briefcase className="w-4 h-4" />;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4 flex-1">
          {/* Welcome Message - Hidden on mobile */}
          <div className="hidden md:block">
            <h2 className="text-lg font-semibold text-black">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}!
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(currentTime, location?.timezone)}</span>
              </div>
              {location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{location.city}, {location.country}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-gray-600 hover:text-black transition-colors">
            <Menu className="w-6 h-6" />
          </button>

          {/* Search Bar */}
          <div className={`${showMobileSearch ? 'flex' : 'hidden md:flex'} relative max-w-md flex-1`}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search clients, bookings, requests..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            {showMobileSearch && (
              <button 
                onClick={() => setShowMobileSearch(false)}
                className="md:hidden absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Mobile Search Button */}
          <button 
            onClick={() => {
              setShowMobileSearch(true);
              setTimeout(() => searchInputRef.current?.focus(), 100);
            }}
            className="md:hidden p-2 text-gray-600 hover:text-black transition-colors"
          >
            <Search className="w-6 h-6" />
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Role Badge - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border border-gray-200 shadow-sm">
            {getRoleIcon(user?.role || 'employee')}
            <span className={`capitalize ${getRoleBadgeColor(user?.role || 'employee')}`}>
              {user?.role || 'Employee'}
            </span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
              }}
              className="relative p-2 text-gray-600 hover:text-black transition-colors bg-gray-100 rounded-full"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                  <h3 className="font-medium text-black">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                
                {notifications.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                          !notification.is_read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start">
                          <div className="mr-3 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm ${!notification.is_read ? 'font-medium text-black' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            {notification.message && (
                              <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">{getTimeAgo(notification.created_at)}</p>
                          </div>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No notifications</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-black">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button 
                  onClick={() => {
                    setShowProfileSettings(true);
                    setShowProfile(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <hr className="my-1" />
                <button 
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showProfile || showNotifications) && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => {
            setShowProfile(false);
            setShowNotifications(false);
          }}
        />
      )}

      {/* Profile Settings Modal */}
      <ProfileSettings
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
      />
    </header>
  );
};

// DollarSign component for the role icon
const DollarSign: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

// Mail component for the role icon
const Mail: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);