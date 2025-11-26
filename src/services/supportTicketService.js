import { supabase } from '../lib/supabase';

class SupportTicketService {
  constructor() {
    this.zendeskId = '6GKFd6WxOGPjZNIFrggoADvCiUU9v0Wd8oqC';
    this.apiEndpoint = '/api/support';
  }

  /**
   * Create a new support ticket for consultation booking
   */
  async createConsultationTicket(ticketData) {
    try {
      const { user } = await supabase.auth.getUser();
      
      if (!user?.data?.user) {
        throw new Error('User not authenticated');
      }

      const ticket = {
        ...ticketData,
        userId: user.data.user.id,
        userEmail: user.data.user.email,
        zendeskId: this.zendeskId,
        type: 'consultation',
        status: 'open',
        priority: ticketData.urgency || 'normal',
        subject: `Tokenization Consultation Request - ${ticketData.topic}`,
        description: this.formatTicketDescription(ticketData),
        tags: ['consultation', 'tokenization', 'web3', ticketData.topic],
        customFields: {
          consultation_type: ticketData.consultationType,
          preferred_time: ticketData.preferredTime,
          company: ticketData.company,
          phone: ticketData.phone
        }
      };

      // Store ticket in local database first
      const { data: localTicket, error: localError } = await supabase
        .from('support_tickets')
        .insert([{
          user_id: user.data.user.id,
          zendesk_ticket_id: null, // Will be updated after Zendesk creation
          subject: ticket.subject,
          description: ticket.description,
          status: 'pending',
          priority: ticket.priority,
          tags: ticket.tags,
          ticket_data: ticket,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (localError) {
        console.error('Error creating local ticket:', localError);
        throw new Error('Failed to create support ticket');
      }

      // Create ticket in Zendesk (via your backend API)
      try {
        const response = await fetch(`${this.apiEndpoint}/create-ticket`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify(ticket)
        });

        if (response.ok) {
          const zendeskTicket = await response.json();
          
          // Update local ticket with Zendesk ID
          await supabase
            .from('support_tickets')
            .update({
              zendesk_ticket_id: zendeskTicket.ticket.id,
              status: 'open',
              external_url: zendeskTicket.ticket.url
            })
            .eq('id', localTicket.id);

          return {
            success: true,
            ticket: {
              ...localTicket,
              zendesk_ticket_id: zendeskTicket.ticket.id,
              external_url: zendeskTicket.ticket.url
            }
          };
        } else {
          console.warn('Zendesk API failed, but local ticket created');
          return {
            success: true,
            ticket: localTicket,
            warning: 'Ticket created locally, Zendesk sync pending'
          };
        }
      } catch (apiError) {
        console.error('Zendesk API error:', apiError);
        return {
          success: true,
          ticket: localTicket,
          warning: 'Ticket created locally, Zendesk sync pending'
        };
      }

    } catch (error) {
      console.error('Error creating consultation ticket:', error);
      throw error;
    }
  }

  /**
   * Get user's support tickets and chat history
   */
  async getUserTickets(userId = null) {
    try {
      let targetUserId = userId;
      
      if (!targetUserId) {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          throw new Error('User not authenticated');
        }
        targetUserId = user.id;
      }

      const { data: tickets, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user tickets:', error);
        throw error;
      }

      return tickets || [];
    } catch (error) {
      console.error('Error getting user tickets:', error);
      throw error;
    }
  }

  /**
   * Get ticket messages/conversation history
   */
  async getTicketMessages(ticketId) {
    try {
      // First try to get from local database
      const { data: localMessages, error: localError } = await supabase
        .from('support_ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (!localError && localMessages?.length > 0) {
        return localMessages;
      }

      // If no local messages, try to sync from Zendesk
      try {
        const response = await fetch(`${this.apiEndpoint}/ticket/${ticketId}/messages`, {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });

        if (response.ok) {
          const messages = await response.json();
          
          // Store messages locally for caching
          if (messages.length > 0) {
            await supabase
              .from('support_ticket_messages')
              .upsert(
                messages.map(msg => ({
                  ticket_id: ticketId,
                  zendesk_message_id: msg.id,
                  author_name: msg.author_name,
                  author_email: msg.author_email,
                  content: msg.content,
                  is_public: msg.public,
                  message_type: msg.type,
                  created_at: msg.created_at
                })),
                { onConflict: 'zendesk_message_id' }
              );
          }

          return messages;
        }
      } catch (apiError) {
        console.warn('Failed to sync messages from Zendesk:', apiError);
      }

      return localMessages || [];
    } catch (error) {
      console.error('Error getting ticket messages:', error);
      throw error;
    }
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(ticketId, status) {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) {
        throw error;
      }

      // Also try to update in Zendesk
      try {
        await fetch(`${this.apiEndpoint}/ticket/${ticketId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ status })
        });
      } catch (apiError) {
        console.warn('Failed to update Zendesk ticket status:', apiError);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw error;
    }
  }

  /**
   * Format ticket description with user details
   */
  formatTicketDescription(ticketData) {
    const sections = [
      `Consultation Request: ${ticketData.topic.replace(/_/g, ' ').toUpperCase()}`,
      '',
      'Contact Information:',
      `- Name: ${ticketData.name}`,
      `- Email: ${ticketData.email}`,
      ticketData.company ? `- Company: ${ticketData.company}` : null,
      ticketData.phone ? `- Phone: ${ticketData.phone}` : null,
      '',
      'Request Details:',
      ticketData.message,
      ''
    ];

    if (ticketData.consultationType === 'zendesk' && ticketData.preferredTime) {
      sections.push(`Preferred meeting time: ${ticketData.preferredTime}`);
    }

    if (ticketData.urgency && ticketData.urgency !== 'normal') {
      sections.push(`Priority: ${ticketData.urgency.toUpperCase()}`);
    }

    sections.push('');
    sections.push('---');
    sections.push('This ticket was automatically created via the PrivateCharterX consultation booking system.');

    return sections.filter(Boolean).join('\n');
  }

  /**
   * Create a simple chat support ticket
   * Stores full user details and queues email notification to support@privatecharterx.com
   */
  async createChatTicket(message, userInfo = {}) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      // Allow ticket creation even if not authenticated (guest support)
      const userId = user?.id || userInfo.userId || null;
      const userEmail = user?.email || userInfo.email || 'guest@privatecharterx.com';
      const userName = userInfo.name || user?.user_metadata?.name || 'Guest User';
      const userPhone = userInfo.phone || user?.user_metadata?.phone || '';

      // Build comprehensive ticket with all user details
      const ticket = {
        user_id: userId,
        zendesk_ticket_id: null,
        subject: 'Chat Support Request',
        description: message,
        status: 'pending',
        priority: 'normal',
        tags: ['chat', 'support', 'web'],
        ticket_data: {
          message,
          source: userInfo.source || 'chat_widget',
          timestamp: userInfo.timestamp || new Date().toISOString(),
          // Full user details for support team
          user_details: {
            name: userName,
            email: userEmail,
            phone: userPhone,
            user_id: userId
          },
          // Email recipients
          support_email: 'support@privatecharterx.com',
          send_copy_to_user: true
        },
        created_at: new Date().toISOString()
      };

      const { data: localTicket, error: localError } = await supabase
        .from('support_tickets')
        .insert([ticket])
        .select()
        .single();

      if (localError) {
        console.error('Error creating chat ticket:', localError);
        throw new Error('Failed to create support ticket');
      }

      // Create notification for the user (if authenticated)
      if (userId) {
        try {
          await supabase
            .from('notifications')
            .insert([{
              user_id: userId,
              type: 'support_ticket_created',
              title: 'Support Ticket Created',
              message: `Your support ticket #${localTicket.id} has been created. Our team will respond within 24 hours.`,
              is_read: false,
              action_url: '/dashboard/support-tickets',
              created_at: new Date().toISOString()
            }]);
        } catch (notifError) {
          console.warn('Failed to create notification:', notifError);
          // Don't fail ticket creation if notification fails
        }
      }

      // Send email notifications via Supabase Edge Function (uses AWS SES)
      try {
        const { data: emailResult, error: emailError } = await supabase.functions.invoke(
          'chat-support-notifications',
          {
            body: {
              ticketId: localTicket.id,
              message: message,
              userName: userName,
              userEmail: userEmail,
              userPhone: userPhone,
              userId: userId
            }
          }
        );

        if (emailError) {
          console.warn('Edge function error (continuing with ticket):', emailError);
        } else {
          console.log('✅ Email notifications sent:', emailResult);
        }
      } catch (emailError) {
        console.warn('Failed to send email notifications (continuing with ticket):', emailError);
        // Don't fail ticket creation if email fails
      }

      // Try to create in Zendesk (optional, won't fail if backend is down)
      try {
        const zendeskTicket = {
          subject: `Chat Support Request from ${userName}`,
          description: `Message: ${message}\n\nUser Details:\nName: ${userName}\nEmail: ${userEmail}\nPhone: ${userPhone}`,
          priority: 'normal',
          tags: ['chat', 'support'],
          requester: {
            email: userEmail,
            name: userName
          }
        };

        const response = await fetch(`${this.apiEndpoint}/create-ticket`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': user ? `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` : ''
          },
          body: JSON.stringify(zendeskTicket)
        });

        if (response.ok) {
          const zendeskData = await response.json();

          await supabase
            .from('support_tickets')
            .update({
              zendesk_ticket_id: zendeskData.ticket?.id,
              status: 'open',
              external_url: zendeskData.ticket?.url
            })
            .eq('id', localTicket.id);
        }
      } catch (apiError) {
        console.warn('Zendesk API error (continuing with local ticket):', apiError);
      }

      return {
        success: true,
        ticket: localTicket
      };

    } catch (error) {
      console.error('Error creating chat ticket:', error);
      throw error;
    }
  }

  /**
   * Send email notification for chat messages (no ticket creation)
   * Just triggers email to support team
   */
  async sendChatNotificationEmail(userInfo) {
    try {
      // Send email notification via Supabase Edge Function
      const { data: emailResult, error: emailError } = await supabase.functions.invoke(
        'chat-support-notifications',
        {
          body: {
            message: userInfo.message,
            userName: userInfo.name || 'Guest User',
            userEmail: userInfo.email || '',
            userPhone: userInfo.phone || '',
            userId: userInfo.userId || null,
            type: 'chat_notification'
          }
        }
      );

      if (emailError) {
        console.warn('Edge function error:', emailError);
        return { success: false, error: emailError };
      }

      console.log('✅ Chat notification email sent:', emailResult);
      return { success: true, result: emailResult };
    } catch (error) {
      console.error('Error sending chat notification email:', error);
      return { success: false, error };
    }
  }

  /**
   * Get ticket statistics for dashboard
   */
  async getTicketStats(userId = null) {
    try {
      let targetUserId = userId;
      
      if (!targetUserId) {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          throw new Error('User not authenticated');
        }
        targetUserId = user.id;
      }

      const { data: tickets, error } = await supabase
        .from('support_tickets')
        .select('status, created_at')
        .eq('user_id', targetUserId);

      if (error) {
        throw error;
      }

      const stats = {
        total: tickets.length,
        open: tickets.filter(t => ['open', 'pending'].includes(t.status)).length,
        closed: tickets.filter(t => ['closed', 'solved'].includes(t.status)).length,
        recent: tickets.filter(t => {
          const created = new Date(t.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return created > weekAgo;
        }).length
      };

      return stats;
    } catch (error) {
      console.error('Error getting ticket stats:', error);
      return { total: 0, open: 0, closed: 0, recent: 0 };
    }
  }
}

export const supportTicketService = new SupportTicketService();
export default supportTicketService;