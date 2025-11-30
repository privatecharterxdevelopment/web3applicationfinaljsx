import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Search,
  Filter,
  Eye,
  X,
  Send,
  User,
  RefreshCw,
  Clock,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface ChatConversation {
  user_id: string;
  last_message: string;
  last_message_at: string;
  message_count: number;
  unread_count: number;
  user_name: string;
  user_email: string;
}

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  sender_type: 'user' | 'admin' | 'system';
  admin_name?: string;
  created_at: string;
}

export default function ChatMessagesManagement() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    subscribeToNewMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);

      // Get all unique users who have chat messages
      const { data: chatUsers, error } = await supabase
        .from('chat_messages')
        .select(`
          user_id,
          content,
          created_at,
          sender_type
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by user and get conversation summaries
      const userMap = new Map<string, any>();

      for (const msg of chatUsers || []) {
        if (!userMap.has(msg.user_id)) {
          userMap.set(msg.user_id, {
            user_id: msg.user_id,
            last_message: msg.content,
            last_message_at: msg.created_at,
            message_count: 1,
            unread_count: msg.sender_type === 'user' ? 1 : 0
          });
        } else {
          const existing = userMap.get(msg.user_id);
          existing.message_count++;
          if (msg.sender_type === 'user') {
            existing.unread_count++;
          }
        }
      }

      // Fetch user details
      const userIds = Array.from(userMap.keys());
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds);

        const conversationList: ChatConversation[] = Array.from(userMap.values()).map(conv => {
          const user = users?.find(u => u.id === conv.user_id);
          return {
            ...conv,
            user_name: user?.name || 'Unknown User',
            user_email: user?.email || 'No email'
          };
        });

        // Sort by last message time
        conversationList.sort((a, b) =>
          new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        );

        setConversations(conversationList);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const subscribeToNewMessages = () => {
    const subscription = supabase
      .channel('admin_chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, payload => {
        // Refresh conversations list
        fetchConversations();

        // If viewing the same user's messages, add the new message
        if (selectedConversation && payload.new.user_id === selectedConversation.user_id) {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedConversation) return;

    try {
      setIsSending(true);
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          user_id: selectedConversation.user_id,
          content: replyMessage,
          sender_type: 'admin',
          admin_name: 'Support Team'
        }]);

      if (error) throw error;

      setReplyMessage('');
      await fetchMessages(selectedConversation.user_id);
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send message');
    } finally {
      setIsSending(false);
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

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchTerm.toLowerCase();
    return (
      conv.user_name.toLowerCase().includes(searchLower) ||
      conv.user_email.toLowerCase().includes(searchLower) ||
      conv.last_message.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: conversations.length,
    active: conversations.filter(c => {
      const lastMsg = new Date(c.last_message_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastMsg.getTime()) / (1000 * 60 * 60);
      return hoursDiff < 24;
    }).length,
    unread: conversations.reduce((sum, c) => sum + c.unread_count, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chat Support Messages</h1>
            <p className="text-sm text-gray-500">Manage live chat conversations with users</p>
          </div>
        </div>
        <button
          onClick={fetchConversations}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Conversations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active (24h)</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <Clock className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unread Messages</p>
              <p className="text-2xl font-bold text-blue-600">{stats.unread}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="overflow-y-auto max-h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.user_id}
                  onClick={() => {
                    setSelectedConversation(conv);
                    fetchMessages(conv.user_id);
                  }}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.user_id === conv.user_id ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 truncate">{conv.user_name}</h4>
                          {conv.unread_count > 0 && (
                            <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{conv.user_email}</p>
                        <p className="text-sm text-gray-600 truncate mt-1">{conv.last_message}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                      {formatDate(conv.last_message_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat View */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedConversation.user_name}</h3>
                    <p className="text-xs text-gray-500">{selectedConversation.user_email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No messages in this conversation</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          msg.sender_type === 'user'
                            ? 'bg-gray-100 text-gray-900'
                            : msg.sender_type === 'admin'
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        {msg.sender_type === 'admin' && msg.admin_name && (
                          <p className="text-xs font-medium mb-1 opacity-90">
                            {msg.admin_name}
                          </p>
                        )}
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatMessageTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                    placeholder="Type your message..."
                    className="flex-1 resize-none px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    rows={2}
                  />
                  <button
                    onClick={sendReply}
                    disabled={isSending || !replyMessage.trim()}
                    className="bg-green-500 text-white p-3 rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Conversation</h3>
                <p className="text-sm text-gray-500">Choose a conversation from the list to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
