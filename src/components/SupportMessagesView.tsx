import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Clock, CheckCheck, AlertCircle, Plus, ArrowLeft, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Chat {
  id: string;
  user_id: string;
  admin_id: string | null;
  subject: string | null;
  status: 'open' | 'closed' | 'waiting';
  unread_user: number;
  last_message_at: string | null;
  created_at: string;
  closed_at: string | null;
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

export default function SupportMessagesView() {
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newChatSubject, setNewChatSubject] = useState('');
  const [showNewChatForm, setShowNewChatForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Total unread count for badge
  const totalUnread = chats.reduce((sum, chat) => sum + (chat.unread_user || 0), 0);
  const openChats = chats.filter(c => c.status === 'open').length;
  const closedChats = chats.filter(c => c.status === 'closed').length;

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch user's chats
  const fetchChats = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('live_support_chats')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setChats(data || []);
    } catch (err: any) {
      console.error('Error fetching chats:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages for active chat
  const fetchMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('live_support_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark chat as read
      await supabase.rpc('mark_live_chat_as_read', {
        p_chat_id: chatId,
        p_is_admin: false
      });

      // Update local state
      setChats(prev => prev.map(c =>
        c.id === chatId ? { ...c, unread_user: 0 } : c
      ));
    } catch (err: any) {
      console.error('Error fetching messages:', err);
    }
  };

  // Create new chat
  const createChat = async (subject?: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('live_support_chats')
        .insert({
          user_id: user.id,
          subject: subject || 'Support Request',
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      setChats(prev => [data, ...prev]);
      setActiveChat(data);
      setView('chat');
      setMessages([]);
      setShowNewChatForm(false);
      setNewChatSubject('');
    } catch (err: any) {
      console.error('Error creating chat:', err);
      setError('Failed to create conversation');
    } finally {
      setIsLoading(false);
    }
  };

  // Send message
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
      sender_type: 'user',
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
          sender_type: 'user',
          message: messageText
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp message with real one
      setMessages(prev => prev.map(m =>
        m.id === tempMessage.id ? data : m
      ));
    } catch (err: any) {
      console.error('Error sending message:', err);
      // Remove failed message
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setNewMessage(messageText); // Restore message
      setError('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Open a chat
  const openChat = (chat: Chat) => {
    setActiveChat(chat);
    setView('chat');
    fetchMessages(chat.id);
  };

  // Go back to list
  const goBack = () => {
    setView('list');
    setActiveChat(null);
    setMessages([]);
    fetchChats(); // Refresh list
  };

  // Load chats on mount
  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    // Subscribe to new chats
    const chatsChannel = supabase
      .channel('live-support-chats-view')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_support_chats',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setChats(prev => [payload.new as Chat, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setChats(prev => prev.map(c =>
              c.id === payload.new.id ? payload.new as Chat : c
            ));
            if (activeChat?.id === payload.new.id) {
              setActiveChat(payload.new as Chat);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatsChannel);
    };
  }, [user, activeChat?.id]);

  // Subscribe to messages in active chat
  useEffect(() => {
    if (!activeChat) return;

    const messagesChannel = supabase
      .channel(`live-support-messages-view-${activeChat.id}`)
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
          // Only add if not already in list (avoid duplicates from optimistic update)
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            // Remove any temp messages and add real one
            return [...prev.filter(m => !m.id.startsWith('temp-')), newMsg];
          });

          // Mark as read if it's from admin
          if (newMsg.sender_type === 'admin') {
            supabase.rpc('mark_live_chat_as_read', {
              p_chat_id: activeChat.id,
              p_is_admin: false
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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-500 font-light">Please log in to access messages.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {view === 'chat' && (
              <button onClick={goBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft size={18} className="text-gray-500" />
              </button>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter">
                {view === 'chat' ? (activeChat?.subject || 'Support Chat') : 'Messages'}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {view === 'chat'
                  ? (activeChat?.status === 'closed' ? 'This conversation is closed' : 'Chat with our support team')
                  : `${chats.length} conversation${chats.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
          {view === 'list' && (
            <button
              onClick={() => setShowNewChatForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Plus size={14} />
              New Chat
            </button>
          )}
        </div>

        {/* Stats row */}
        {view === 'list' && (
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Active</span>
              <span className="ml-1 font-medium text-gray-900">{openChats}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Closed</span>
              <span className="ml-1 font-medium text-gray-900">{closedChats}</span>
            </div>
            {totalUnread > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Unread</span>
                <span className="ml-1 font-medium text-red-600">{totalUnread}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-6 mt-4 px-4 py-3 rounded-lg flex items-center gap-2 text-red-700 text-xs border border-red-200 bg-red-50/50">
          <AlertCircle size={14} />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* New Chat Form Modal */}
      {showNewChatForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200/50">
            <h3 className="text-lg font-light text-gray-900 mb-4 tracking-tight">Start New Conversation</h3>
            <input
              type="text"
              value={newChatSubject}
              onChange={(e) => setNewChatSubject(e.target.value)}
              placeholder="What can we help you with?"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 mb-4 bg-gray-50/50"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNewChatForm(false);
                  setNewChatSubject('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => createChat(newChatSubject || 'Support Request')}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Start Chat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-6 py-4">
        {/* Chat List View */}
        {view === 'list' && (
          <>
            {isLoading && chats.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mb-3"></div>
                  <p className="text-sm text-gray-500 font-light">Loading conversations...</p>
                </div>
              </div>
            ) : chats.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageCircle size={20} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 font-light">No conversations yet</p>
                <p className="text-xs text-gray-400 mt-1">Start a chat with our support team</p>
                <button
                  onClick={() => setShowNewChatForm(true)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition-colors mx-auto"
                >
                  <Plus size={14} />
                  New Conversation
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => openChat(chat)}
                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-gray-200 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        chat.status === 'open' ? 'bg-emerald-500' :
                        chat.status === 'waiting' ? 'bg-amber-500' : 'bg-gray-300'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {chat.subject || 'Support Chat'}
                          </p>
                          {chat.unread_user > 0 && (
                            <span className="w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center flex-shrink-0">
                              {chat.unread_user}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                          <Clock size={10} />
                          <span>{formatTime(chat.last_message_at || chat.created_at)}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            chat.status === 'closed'
                              ? 'bg-gray-100 text-gray-500'
                              : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {chat.status === 'closed' ? 'Closed' : 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Chat View */}
        {view === 'chat' && activeChat && (
          <div className="flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageCircle size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-900 font-light">Start the conversation!</p>
                  <p className="text-xs text-gray-400 mt-1">Our team typically responds within a few minutes</p>
                </div>
              ) : (
                <div className="space-y-3 max-w-2xl mx-auto">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                          msg.sender_type === 'user'
                            ? 'bg-gray-900 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}
                      >
                        {msg.sender_type === 'admin' && (
                          <p className="text-[10px] text-gray-500 mb-1 font-medium">Support Team</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words font-light">{msg.message}</p>
                        <div className={`flex items-center gap-1 mt-1.5 text-[10px] ${
                          msg.sender_type === 'user' ? 'text-gray-400 justify-end' : 'text-gray-400'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.sender_type === 'user' && msg.is_read && (
                            <CheckCheck size={12} className="text-blue-400 ml-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            {activeChat.status !== 'closed' ? (
              <div className="pt-4 border-t border-gray-100">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex items-center gap-3 max-w-2xl mx-auto"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 bg-gray-50/50"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="w-11 h-11 bg-gray-900 hover:bg-gray-800 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-500">This conversation has been closed</p>
                <button
                  onClick={() => setShowNewChatForm(true)}
                  className="mt-2 text-xs text-gray-900 hover:underline"
                >
                  Start a new conversation
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
