import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Eye,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Send,
  User,
  Mail
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface SupportTicket {
  id: string;
  user_id: string;
  name?: string;
  email?: string;
  subject: string;
  message?: string;
  description?: string;
  status: string;
  priority: string;
  category?: string;
  created_at: string;
  updated_at: string;
  users?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface TicketReply {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

export default function SupportTicketsManagement() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [replyMessage, setReplyMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [ticketReplies, setTicketReplies] = useState<TicketReply[]>([]);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          users:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketReplies = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_replies')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching replies:', error);
        setTicketReplies([]);
      } else {
        setTicketReplies(data || []);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
      setTicketReplies([]);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;

      await fetchTickets();
      if (selectedTicket) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    try {
      setIsUpdating(true);

      const { error: replyError } = await supabase
        .from('ticket_replies')
        .insert([{
          ticket_id: selectedTicket.id,
          user_id: selectedTicket.user_id,
          message: replyMessage,
          is_admin: true
        }]);

      if (replyError) {
        console.error('Reply insert error:', replyError);
      }

      if (selectedTicket.status === 'pending') {
        await supabase
          .from('support_tickets')
          .update({ status: 'open', updated_at: new Date().toISOString() })
          .eq('id', selectedTicket.id);
      }

      setReplyMessage('');
      await fetchTicketReplies(selectedTicket.id);
      await fetchTickets();
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getUserName = (ticket: SupportTicket) => {
    if (ticket.users?.first_name || ticket.users?.last_name) {
      return `${ticket.users.first_name || ''} ${ticket.users.last_name || ''}`.trim();
    }
    return ticket.name || 'Unknown';
  };

  const getUserEmail = (ticket: SupportTicket) => {
    return ticket.users?.email || ticket.email || 'No email';
  };

  const filteredTickets = tickets.filter(ticket => {
    const subject = ticket.subject || '';
    const userEmail = getUserEmail(ticket);
    const userName = getUserName(ticket);
    const searchLower = searchTerm.toLowerCase();

    return (
      subject.toLowerCase().includes(searchLower) ||
      userEmail.toLowerCase().includes(searchLower) ||
      userName.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t.status === 'pending').length,
    open: tickets.filter(t => t.status === 'open').length,
    solved: tickets.filter(t => t.status === 'solved' || t.status === 'closed').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage customer support inquiries</p>
        </div>
        <button
          onClick={fetchTickets}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: MessageSquare },
          { label: 'Pending', value: stats.pending, icon: Clock },
          { label: 'Open', value: stats.open, icon: AlertCircle },
          { label: 'Solved', value: stats.solved, icon: CheckCircle }
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
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="open">Open</option>
            <option value="solved">Solved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent"></div>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No tickets found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{ticket.subject}</p>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                        {ticket.message || ticket.description || '-'}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-900">{getUserName(ticket)}</p>
                      <p className="text-xs text-gray-500">{getUserEmail(ticket)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                      ticket.status === 'solved' || ticket.status === 'closed'
                        ? 'bg-gray-900 text-white'
                        : ticket.status === 'open'
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                      ticket.priority === 'urgent' || ticket.priority === 'high'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">{formatRelativeTime(ticket.created_at)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedTicket(ticket);
                        fetchTicketReplies(ticket.id);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedTicket.subject}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                    selectedTicket.status === 'solved' || selectedTicket.status === 'closed'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {selectedTicket.status}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(selectedTicket.created_at)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm text-gray-900">{getUserName(selectedTicket)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm text-gray-900">{getUserEmail(selectedTicket)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Original Message */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Message</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedTicket.message || selectedTicket.description || 'No message'}
                  </p>
                </div>
              </div>

              {/* Replies */}
              {ticketReplies.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Conversation</h3>
                  <div className="space-y-3">
                    {ticketReplies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`p-4 rounded-xl ${
                          reply.is_admin ? 'bg-gray-900 text-white ml-8' : 'bg-gray-50 mr-8'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${reply.is_admin ? 'text-gray-300' : 'text-gray-500'}`}>
                            {reply.is_admin ? 'Support' : 'Customer'}
                          </span>
                          <span className={`text-xs ${reply.is_admin ? 'text-gray-400' : 'text-gray-400'}`}>
                            {formatRelativeTime(reply.created_at)}
                          </span>
                        </div>
                        <p className="text-sm">{reply.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply Input */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Reply</h3>
                <div className="flex gap-2">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex gap-2">
                {selectedTicket.status !== 'solved' && (
                  <button
                    onClick={() => updateTicketStatus(selectedTicket.id, 'solved')}
                    disabled={isUpdating}
                    className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    Mark Solved
                  </button>
                )}
                {selectedTicket.status === 'pending' && (
                  <button
                    onClick={() => updateTicketStatus(selectedTicket.id, 'open')}
                    disabled={isUpdating}
                    className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Mark Open
                  </button>
                )}
              </div>
              <button
                onClick={sendReply}
                disabled={isUpdating || !replyMessage.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Send size={14} />
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
