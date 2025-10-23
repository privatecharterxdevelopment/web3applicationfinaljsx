import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Clock, CheckCircle, Circle, AlertCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../../thefinalwebapplicationpcx-main/src/context/AuthContext';
// @ts-ignore
import { supportTicketService } from '../services/supportTicketService';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'pending' | 'open' | 'hold' | 'solved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  zendesk_ticket_id?: number;
  external_url?: string;
}

export default function SupportTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject.trim() || !newTicket.description.trim()) return;

    try {
      setIsSubmitting(true);
      
      // Create ticket using the Zendesk-integrated service
      const ticketData = {
        subject: newTicket.subject,
        description: newTicket.description,
        priority: newTicket.priority,
        urgency: newTicket.priority,
        topic: 'Support Request',
        consultationType: 'general',
        preferredTime: new Date().toISOString(),
        company: user?.email?.split('@')[1] || 'N/A',
        phone: 'N/A'
      };

      const result = await supportTicketService.createConsultationTicket(ticketData);

      if (result.success) {
        // Refresh tickets list
        await fetchTickets();
        setShowNewTicketModal(false);
        setNewTicket({ subject: '', description: '', priority: 'normal' });
        
        if (result.warning) {
          alert(result.warning);
        }
      } else {
        throw new Error('Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create support ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'open':
        return <Circle className="w-4 h-4 text-blue-500" />;
      case 'hold':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'solved':
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700';
      case 'open':
        return 'bg-blue-50 text-blue-700';
      case 'hold':
        return 'bg-yellow-50 text-yellow-700';
      case 'solved':
      case 'closed':
        return 'bg-green-50 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'normal':
        return 'bg-gray-100 text-gray-700';
      case 'low':
        return 'bg-gray-50 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
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

  return (
    <div className="w-full h-full p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">Support Tickets</h1>
        </div>
        <button
          onClick={() => setShowNewTicketModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No support tickets yet</h3>
          <p className="text-sm text-gray-500 mb-4">Create your first support ticket to get help</p>
          <button
            onClick={() => setShowNewTicketModal(true)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Create Ticket
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="border border-gray-300/50 rounded-xl p-4 hover:bg-white/40 transition-colors cursor-pointer bg-white/35"
              style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(ticket.status)}
                    <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(ticket.status)}`}>
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(ticket.created_at)}
                    </span>
                    {ticket.zendesk_ticket_id && (
                      <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        Zendesk #{ticket.zendesk_ticket_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div className="bg-white/35 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-300/50" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create Support Ticket</h2>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                  rows={5}
                  placeholder="Provide detailed information about your issue"
                  required
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
