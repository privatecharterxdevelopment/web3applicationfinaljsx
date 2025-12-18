import { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Send,
  X,
  CheckCircle,
  Clock,
  Users,
  User,
  RefreshCw,
  Eye,
  Trash2
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert' | 'promotion';
  is_read: boolean;
  link?: string;
  created_at: string;
  users?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'alert' | 'promotion',
    link: ''
  });

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, [typeFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('user_notifications')
        .select(`
          *,
          users:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const getUserName = (user: { first_name?: string; last_name?: string } | null) => {
    if (!user) return 'Unknown';
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return name || 'No name';
  };

  const sendNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      alert('Please fill in title and message');
      return;
    }

    if (!sendToAll && selectedUsers.length === 0) {
      alert('Please select at least one user or choose "Send to all users"');
      return;
    }

    try {
      setIsSending(true);
      const targetUsers = sendToAll ? users.map(u => u.id) : selectedUsers;

      const notificationsToInsert = targetUsers.map(userId => ({
        user_id: userId,
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        link: newNotification.link || null,
        is_read: false,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('user_notifications')
        .insert(notificationsToInsert);

      if (error) throw error;

      setNewNotification({ title: '', message: '', type: 'info', link: '' });
      setSelectedUsers([]);
      setSendToAll(false);
      setShowSendModal(false);
      await fetchNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
    } finally {
      setIsSending(false);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!confirm('Delete this notification?')) return;

    try {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredNotifications = notifications.filter(n => {
    const searchLower = searchTerm.toLowerCase();
    return (
      n.title?.toLowerCase().includes(searchLower) ||
      n.message?.toLowerCase().includes(searchLower) ||
      n.users?.email?.toLowerCase().includes(searchLower)
    );
  });

  const filteredUsers = users.filter(u => {
    const searchLower = userSearchTerm.toLowerCase();
    const name = getUserName(u).toLowerCase();
    return (
      name.includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.is_read).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">Send notifications to users</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotifications}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw size={18} className="text-gray-600" />
          </button>
          <button
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Send size={16} />
            Send
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Total Sent', value: stats.total, icon: Bell },
          { label: 'Unread', value: stats.unread, icon: Clock }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <stat.icon className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            <option value="all">All Types</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="alert">Alert</option>
            <option value="promotion">Promotion</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent"></div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No notifications found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notification</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent To</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <tr key={notification.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{notification.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{notification.message}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                      {notification.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-900">{getUserName(notification.users || null)}</p>
                      <p className="text-xs text-gray-500">{notification.users?.email || '-'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${
                      notification.is_read ? 'bg-gray-100 text-gray-600' : 'bg-gray-900 text-white'
                    }`}>
                      {notification.is_read ? <Eye size={10} /> : <Clock size={10} />}
                      {notification.is_read ? 'Read' : 'Unread'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">{formatDate(notification.created_at)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Send Notification Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Send Notification</h2>
                <p className="text-sm text-gray-500">Send to users via bell icon</p>
              </div>
              <button
                onClick={() => setShowSendModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Type */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Type</label>
                <div className="grid grid-cols-5 gap-2">
                  {(['info', 'success', 'warning', 'alert', 'promotion'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewNotification({ ...newNotification, type })}
                      className={`px-2 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        newNotification.type === type
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Title</label>
                <input
                  type="text"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  placeholder="Notification title..."
                  className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Message</label>
                <textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                  placeholder="Notification message..."
                  rows={3}
                  className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 resize-none"
                />
              </div>

              {/* Link */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Link (optional)</label>
                <input
                  type="text"
                  value={newNotification.link}
                  onChange={(e) => setNewNotification({ ...newNotification, link: e.target.value })}
                  placeholder="/dashboard or https://..."
                  className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>

              {/* Recipients */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Recipients</label>

                {/* Send to all */}
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={sendToAll}
                    onChange={(e) => {
                      setSendToAll(e.target.checked);
                      if (e.target.checked) setSelectedUsers([]);
                    }}
                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                  />
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Send to all users ({users.length})</span>
                  </div>
                </label>

                {/* User selection */}
                {!sendToAll && (
                  <>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                    </div>
                    <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                      {filteredUsers.length === 0 ? (
                        <p className="p-4 text-sm text-gray-500 text-center">No users found</p>
                      ) : (
                        filteredUsers.map((user) => (
                          <label
                            key={user.id}
                            className="flex items-center gap-3 p-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers([...selectedUsers, user.id]);
                                } else {
                                  setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                }
                              }}
                              className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                            />
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <User size={14} className="text-gray-500" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{getUserName(user)}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                              </div>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                    {selectedUsers.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">{selectedUsers.length} selected</p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendNotification}
                disabled={isSending || !newNotification.title || !newNotification.message || (!sendToAll && selectedUsers.length === 0)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isSending ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
