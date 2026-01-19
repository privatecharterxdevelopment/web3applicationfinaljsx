import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Clock, CheckCheck, User, Archive, RefreshCw, Search, ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Chat {
  id: string;
  user_id: string;
  admin_id: string | null;
  subject: string | null;
  status: 'open' | 'closed' | 'waiting';
  unread_admin: number;
  last_message_at: string | null;
  created_at: string;
  closed_at: string | null;
  user_profile?: {
    full_name: string | null;
    email: string | null;
  };
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_type: 'user' | 'admin';
  message: string;
  is_read: boolean;
  created_at: string;
}

interface AdminSupportDashboardProps {
  onBack?: () => void;
}

export default function AdminSupportDashboard({ onBack }: AdminSupportDashboardProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [filter, setFilter] = useState<'open' | 'closed' | 'all'>('open');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Total unread for badge
  const totalUnread = chats.filter(c => c.status === 'open').reduce((sum, c) => sum + (c.unread_admin || 0), 0);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch all chats (admin sees all)
  const fetchChats = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('live_support_chats')
        .select(`
          *,
          user_profile:user_id (
            full_name,
            email
          )
        `)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to flatten user_profile
      const transformedData = (data || []).map((chat: any) => ({
        ...chat,
        user_profile: Array.isArray(chat.user_profile)
          ? chat.user_profile[0]
          : chat.user_profile
      }));

      setChats(transformedData);
    } catch (err: any) {
      console.error('Error fetching chats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages for chat
  const fetchMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('live_support_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark as read for admin
      await supabase.rpc('mark_live_chat_as_read', {
        p_chat_id: chatId,
        p_is_admin: true
      });

      // Update local state
      setChats(prev => prev.map(c =>
        c.id === chatId ? { ...c, unread_admin: 0 } : c
      ));
    } catch (err: any) {
      console.error('Error fetching messages:', err);
    }
  };

  // Send message as admin
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat || !user || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      chat_id: activeChat.id,
      sender_id: user.id,
      sender_type: 'admin',
      message: messageText,
      is_read: false,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const { data, error } = await supabase
        .from('live_support_messages')
        .insert({
          chat_id: activeChat.id,
          sender_id: user.id,
          sender_type: 'admin',
          message: messageText
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp message
      setMessages(prev => prev.map(m =>
        m.id === tempMessage.id ? data : m
      ));

      // Assign admin to chat if not already assigned
      if (!activeChat.admin_id) {
        await supabase
          .from('live_support_chats')
          .update({ admin_id: user.id })
          .eq('id', activeChat.id);
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  // Close chat
  const closeChat = async (chatId: string) => {
    try {
      await supabase.rpc('close_live_chat', { p_chat_id: chatId });

      // Update local state
      setChats(prev => prev.map(c =>
        c.id === chatId ? { ...c, status: 'closed' as const, closed_at: new Date().toISOString() } : c
      ));

      if (activeChat?.id === chatId) {
        setActiveChat(prev => prev ? { ...prev, status: 'closed', closed_at: new Date().toISOString() } : null);
      }
    } catch (err: any) {
      console.error('Error closing chat:', err);
    }
  };

  // Reopen chat
  const reopenChat = async (chatId: string) => {
    try {
      await supabase.rpc('reopen_live_chat', { p_chat_id: chatId });

      setChats(prev => prev.map(c =>
        c.id === chatId ? { ...c, status: 'open' as const, closed_at: null } : c
      ));

      if (activeChat?.id === chatId) {
        setActiveChat(prev => prev ? { ...prev, status: 'open', closed_at: null } : null);
      }
    } catch (err: any) {
      console.error('Error reopening chat:', err);
    }
  };

  // Open chat
  const openChat = (chat: Chat) => {
    setActiveChat(chat);
    fetchMessages(chat.id);
  };

  // Filter chats by search
  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      chat.subject?.toLowerCase().includes(query) ||
      chat.user_profile?.full_name?.toLowerCase().includes(query) ||
      chat.user_profile?.email?.toLowerCase().includes(query)
    );
  });

  // Load chats on mount and filter change
  useEffect(() => {
    fetchChats();
  }, [filter]);

  // Subscribe to realtime updates
  useEffect(() => {
    // Subscribe to all chat updates
    const chatsChannel = supabase
      .channel('admin-live-support-chats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_support_chats'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch full chat with user profile
            fetchChats();
          } else if (payload.eventType === 'UPDATE') {
            setChats(prev => prev.map(c =>
              c.id === payload.new.id ? { ...c, ...payload.new } : c
            ));
            if (activeChat?.id === payload.new.id) {
              setActiveChat(prev => prev ? { ...prev, ...payload.new as Chat } : null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatsChannel);
    };
  }, [activeChat?.id]);

  // Subscribe to messages in active chat
  useEffect(() => {
    if (!activeChat) return;

    const messagesChannel = supabase
      .channel(`admin-live-support-messages-${activeChat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_support_messages',
          filter: `chat_id=eq.${activeChat.id}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev.filter(m => !m.id.startsWith('temp-')), newMsg];
          });

          // Mark as read if from user
          if (newMsg.sender_type === 'user') {
            supabase.rpc('mark_live_chat_as_read', {
              p_chat_id: activeChat.id,
              p_is_admin: true
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [activeChat?.id]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft size={20} />
              </button>
            )}
            <h2 className="text-xl font-semibold text-gray-900">Live Support</h2>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {totalUnread} unread
              </span>
            )}
          </div>
          <button
            onClick={fetchChats}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(['open', 'closed', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  filter === f
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List */}
        <div className={`w-80 border-r border-gray-200 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw size={24} className="animate-spin text-gray-400" />
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <MessageCircle size={32} className="text-gray-300 mb-2" />
                <p className="text-sm">No chats found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => openChat(chat)}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                      activeChat?.id === chat.id ? 'bg-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={18} className="text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {chat.user_profile?.full_name || chat.user_profile?.email || 'Unknown User'}
                          </span>
                          {chat.unread_admin > 0 && (
                            <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                              {chat.unread_admin}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {chat.subject || 'Support Chat'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`w-2 h-2 rounded-full ${
                            chat.status === 'open' ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          <span className="text-xs text-gray-400">
                            {formatTime(chat.last_message_at || chat.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat View */}
        <div className={`flex-1 flex flex-col ${activeChat ? 'flex' : 'hidden md:flex'}`}>
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveChat(null)}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User size={18} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {activeChat.user_profile?.full_name || activeChat.user_profile?.email || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activeChat.user_profile?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeChat.status === 'open' ? (
                    <button
                      onClick={() => closeChat(activeChat.id)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-1 transition-colors"
                    >
                      <Archive size={14} />
                      Close Chat
                    </button>
                  ) : (
                    <button
                      onClick={() => reopenChat(activeChat.id)}
                      className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw size={14} />
                      Reopen
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-8">
                    <p>No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          msg.sender_type === 'admin'
                            ? 'bg-gray-900 text-white rounded-br-md'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        <div className={`flex items-center gap-1 mt-1 text-[10px] ${
                          msg.sender_type === 'admin' ? 'text-gray-400 justify-end' : 'text-gray-500'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.sender_type === 'admin' && msg.is_read && (
                            <CheckCheck size={12} className="text-blue-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {activeChat.status !== 'closed' ? (
                <div className="p-4 border-t border-gray-200 bg-white">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="flex items-center gap-3"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                      disabled={isSending}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || isSending}
                      className="w-10 h-10 bg-gray-900 hover:bg-gray-800 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
                  <p className="text-sm text-gray-500">Chat is closed</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <MessageCircle size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-lg font-medium text-gray-700">Select a chat</p>
                <p className="text-sm">Choose a conversation from the list</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
