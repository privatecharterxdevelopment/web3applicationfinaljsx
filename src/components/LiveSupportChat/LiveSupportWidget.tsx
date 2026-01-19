import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2, Clock, CheckCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

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

interface LiveSupportWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LiveSupportWidget({ isOpen, onClose }: LiveSupportWidgetProps) {
  const { user } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Total unread count for badge
  const totalUnread = chats.reduce((sum, chat) => sum + (chat.unread_user || 0), 0);

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
      setError('Failed to load chats');
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
  const createChat = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('live_support_chats')
        .insert({
          user_id: user.id,
          subject: 'Support Request',
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      setChats(prev => [data, ...prev]);
      setActiveChat(data);
      setView('chat');
      setMessages([]);
    } catch (err: any) {
      console.error('Error creating chat:', err);
      setError('Failed to create chat');
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

  // Load chats when widget opens
  useEffect(() => {
    if (isOpen && user) {
      fetchChats();
    }
  }, [isOpen, user]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    // Subscribe to new chats
    const chatsChannel = supabase
      .channel('live-support-chats')
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
      .channel(`live-support-messages-${activeChat.id}`)
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

  if (!user) return null;

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

  if (!isOpen) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all ${
        isMinimized ? 'w-72 h-14' : 'w-96 h-[500px]'
      }`}
    >
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} />
          <span className="font-medium">
            {view === 'chat' && activeChat ? 'Live Support' : 'Support'}
          </span>
          {activeChat?.status === 'closed' && (
            <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">Closed</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
          >
            <Minimize2 size={16} />
          </button>
          <button
            onClick={() => {
              onClose();
              setView('list');
              setActiveChat(null);
            }}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

          {!isMinimized && (
            <>
              {/* Error Banner */}
              {error && (
                <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 text-red-700 text-sm">
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

              {/* Chat List View */}
              {view === 'list' && (
                <div className="flex flex-col h-[calc(500px-52px)]">
                  {/* New Chat Button */}
                  <div className="p-4 border-b border-gray-100">
                    <button
                      onClick={createChat}
                      disabled={isLoading}
                      className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Creating...' : 'Start New Chat'}
                    </button>
                  </div>

                  {/* Chats List */}
                  <div className="flex-1 overflow-y-auto">
                    {chats.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                        <MessageCircle size={40} className="text-gray-300 mb-2" />
                        <p className="text-sm">No conversations yet</p>
                        <p className="text-xs text-gray-400">Start a new chat to get help</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {chats.map((chat) => (
                          <button
                            key={chat.id}
                            onClick={() => openChat(chat)}
                            className="w-full px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                chat.status === 'open' ? 'bg-green-500' :
                                chat.status === 'waiting' ? 'bg-yellow-500' : 'bg-gray-400'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900 truncate">
                                    {chat.subject || 'Support Chat'}
                                  </span>
                                  {chat.unread_user > 0 && (
                                    <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                      {chat.unread_user}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                  <Clock size={10} />
                                  {formatTime(chat.last_message_at || chat.created_at)}
                                  {chat.status === 'closed' && (
                                    <span className="text-gray-400 ml-1">• Closed</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Chat View */}
              {view === 'chat' && activeChat && (
                <div className="flex flex-col h-[calc(500px-52px)]">
                  {/* Back Button */}
                  <div className="px-4 py-2 border-b border-gray-100">
                    <button
                      onClick={goBack}
                      className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                    >
                      ← Back to chats
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm py-8">
                        <p>Start the conversation!</p>
                        <p className="text-xs text-gray-400 mt-1">Our team typically responds within minutes</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                              msg.sender_type === 'user'
                                ? 'bg-gray-900 text-white rounded-br-md'
                                : 'bg-gray-100 text-gray-900 rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                            <div className={`flex items-center gap-1 mt-1 text-[10px] ${
                              msg.sender_type === 'user' ? 'text-gray-400 justify-end' : 'text-gray-500'
                            }`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {msg.sender_type === 'user' && msg.is_read && (
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
                    <div className="p-3 border-t border-gray-100">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          sendMessage();
                        }}
                        className="flex items-center gap-2"
                      >
                        <input
                          ref={inputRef}
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-gray-400"
                          disabled={isSending}
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim() || isSending}
                          className="w-10 h-10 bg-gray-900 hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send size={16} />
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
                      <p className="text-sm text-gray-500">This chat has been closed</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
    </div>
  );
}
