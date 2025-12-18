import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Users, 
  User, 
  Send, 
  Plus, 
  X, 
  Check, 
  Clock, 
  MessageSquare,
  Phone,
  Video,
  Info,
  MoreVertical,
  Image,
  Paperclip,
  Smile,
  Calendar,
  Link as LinkIcon,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/CRM/AuthContext';
import { useNotification } from '../../../contexts/CRM/NotificationContext';
import EmojiPicker, { EmojiStyle, EmojiClickData } from 'emoji-picker-react';

interface ChatUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  is_online: boolean;
  last_seen: string;
}

interface SystemUser {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

interface ChatConversation {
  id: string;
  name: string | null;
  is_group: boolean;
  created_by: string;
  created_at: string;
  participants?: ChatUser[];
  last_message?: {
    message: string;
    created_at: string;
    sender_name: string;
  };
  unread_count?: number;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    name: string;
    avatar_url: string | null;
  };
}

export const TeamChat: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [allUsers, setAllUsers] = useState<SystemUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      initializeChat();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      markConversationAsRead(selectedConversation.id);
      
      // Set up real-time subscription for new messages
      const subscription = supabase
        .channel(`conversation:${selectedConversation.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        }, payload => {
          const newMessage = payload.new as ChatMessage;
          fetchSingleMessage(newMessage.id);
        })
        .subscribe();
        
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      await ensureChatUser();
      await fetchConversations();
      await fetchAllUsers();
    } catch (err: any) {
      console.error('Error initializing chat:', err);
      showError('Chat Error', 'Failed to initialize chat');
    } finally {
      setIsLoading(false);
    }
  };

  const ensureChatUser = async () => {
    if (!user) return;

    try {
      // Check if user exists in chat_users
      const { data: existingUser, error: fetchError } = await supabase
        .from('chat_users')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingUser) {
        // Update last_seen and is_online
        const { error: updateError } = await supabase
          .from('chat_users')
          .update({ 
            last_seen: new Date().toISOString(),
            is_online: true
          })
          .eq('id', existingUser.id);

        if (updateError) throw updateError;
        setChatUser(existingUser);
      } else {
        // Create new chat user with the same ID as the system user
        const { data: systemUser } = await supabase
          .from('system_users')
          .select('id, name, avatar_url')
          .eq('email', user.email)
          .maybeSingle();

        const { data: newUser, error: insertError } = await supabase
          .from('chat_users')
          .insert([{
            id: systemUser?.id || user.id, // Use system user ID or auth user ID
            email: user.email,
            name: systemUser?.name || user.name || user.email.split('@')[0],
            avatar_url: systemUser?.avatar_url || null,
            is_online: true,
            last_seen: new Date().toISOString()
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        setChatUser(newUser);
      }
    } catch (err: any) {
      console.error('Error ensuring chat user:', err);
      throw err;
    }
  };

  const fetchConversations = async () => {
    if (!user?.email) return;

    try {
      // Get chat user ID
      const { data: chatUserData } = await supabase
        .from('chat_users')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (!chatUserData) return;

      // Get conversations where user is a participant
      const { data: participations, error: participationsError } = await supabase
        .from('chat_participants')
        .select('conversation_id')
        .eq('user_id', chatUserData.id);

      if (participationsError) throw participationsError;

      if (!participations || participations.length === 0) {
        setConversations([]);
        return;
      }

      const conversationIds = participations.map(p => p.conversation_id);

      // Get conversation details
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('chat_conversations')
        .select(`
          *,
          participants:chat_participants(
            user_id,
            user:chat_users(id, name, email, avatar_url, is_online, last_seen)
          )
        `)
        .in('id', conversationIds)
        .order('created_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Get last message for each conversation
      const conversationsWithLastMessage = await Promise.all(
        conversationsData.map(async (conversation) => {
          // Get last message - use maybeSingle() to handle conversations with no messages
          const { data: lastMessageData, error: lastMessageError } = await supabase
            .from('chat_messages')
            .select(`
              *,
              sender:chat_users!sender_id(name)
            `)
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (lastMessageError) {
            console.error('Error fetching last message:', lastMessageError);
          }

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conversation.id)
            .eq('is_read', false)
            .neq('sender_id', chatUserData.id);

          // Format participants
          const participants = conversation.participants.map((p: any) => p.user);

          return {
            ...conversation,
            participants,
            last_message: lastMessageData ? {
              message: lastMessageData.message,
              created_at: lastMessageData.created_at,
              sender_name: lastMessageData.sender?.name || 'Unknown'
            } : undefined,
            unread_count: unreadCount || 0
          };
        })
      );

      setConversations(conversationsWithLastMessage);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      throw err;
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:chat_users!sender_id(name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      showError('Error', 'Failed to load messages');
    }
  };

  const fetchSingleMessage = async (messageId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:chat_users!sender_id(name, avatar_url)
        `)
        .eq('id', messageId)
        .single();

      if (error) throw error;
      
      if (data) {
        setMessages(prev => {
          // Check if message already exists
          const exists = prev.some(msg => msg.id === data.id);
          if (exists) return prev;
          return [...prev, data];
        });
      }
    } catch (err: any) {
      console.error('Error fetching single message:', err);
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    if (!chatUser) return;
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', chatUser.id)
        .eq('is_read', false);

      if (error) throw error;
      
      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 } 
            : conv
        )
      );
    } catch (err: any) {
      console.error('Error marking conversation as read:', err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      // Fetch active system users instead of chat_users
      const { data, error } = await supabase
        .from('system_users')
        .select('id, email, name, role, department, avatar_url, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAllUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !chatUser || isSending) return;

    try {
      setIsSending(true);
      
      // Simple insert without triggering any functions that might cause the "net" schema error
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          conversation_id: selectedConversation.id,
          sender_id: chatUser.id,
          message: newMessage.trim(),
          message_type: 'text',
          is_read: false
        }]);

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
      
      setNewMessage('');
      
      // Refresh conversations to update last message
      await fetchConversations();
    } catch (err: any) {
      console.error('Error sending message:', err);
      showError('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const sendImageMessage = async (file: File) => {
    if (!selectedConversation || !chatUser) return;
    
    try {
      setUploadingImage(true);
      
      // 1. Upload the image to Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `chat/${selectedConversation.id}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat_images')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // 2. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat_images')
        .getPublicUrl(filePath);
      
      // 3. Send a message with the image URL
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert([{
          conversation_id: selectedConversation.id,
          sender_id: chatUser.id,
          message: `<img src="${publicUrl}" alt="Shared image" style="max-width: 100%; max-height: 300px; border-radius: 8px;" />`,
          message_type: 'image',
          is_read: false
        }]);
      
      if (messageError) throw messageError;
      
      // Refresh conversations to update last message
      await fetchConversations();
      showSuccess('Success', 'Image sent successfully');
    } catch (err: any) {
      console.error('Error sending image:', err);
      showError('Error', 'Failed to send image. Please try again.');
    } finally {
      setUploadingImage(false);
      setShowImageUpload(false);
    }
  };

  const sendLinkMessage = () => {
    if (!linkUrl || !selectedConversation || !chatUser) return;
    
    const displayText = linkText || linkUrl;
    const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline; display: flex; align-items: center;">${displayText} <span style="margin-left: 4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></span></a>`;
    
    try {
      supabase
        .from('chat_messages')
        .insert([{
          conversation_id: selectedConversation.id,
          sender_id: chatUser.id,
          message: linkHtml,
          message_type: 'link',
          is_read: false
        }])
        .then(() => {
          setLinkUrl('');
          setLinkText('');
          setShowLinkInput(false);
          fetchConversations();
        })
        .catch(err => {
          console.error('Error sending link:', err);
          showError('Error', 'Failed to send link');
        });
    } catch (err: any) {
      console.error('Error sending link:', err);
      showError('Error', 'Failed to send link');
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 1GB)
    if (file.size > 1024 * 1024 * 1024) {
      showError('Error', 'File size exceeds 1GB limit');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      showError('Error', 'Only image files are supported');
      return;
    }
    
    sendImageMessage(file);
  };

  const ensureChatUsersExist = async (userIds: string[]) => {
    try {
      // Get system users data for the selected users
      const { data: systemUsers, error: systemUsersError } = await supabase
        .from('system_users')
        .select('id, email, name, avatar_url')
        .in('id', userIds);

      if (systemUsersError) throw systemUsersError;

      // Check which users already exist in chat_users
      const { data: existingChatUsers, error: existingError } = await supabase
        .from('chat_users')
        .select('id')
        .in('id', userIds);

      if (existingError) throw existingError;

      const existingIds = existingChatUsers?.map(u => u.id) || [];
      const missingUsers = systemUsers?.filter(u => !existingIds.includes(u.id)) || [];

      // Create missing chat users
      if (missingUsers.length > 0) {
        const newChatUsers = missingUsers.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          is_online: false,
          last_seen: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from('chat_users')
          .insert(newChatUsers);

        if (insertError) throw insertError;
      }
    } catch (err: any) {
      console.error('Error ensuring chat users exist:', err);
      throw err;
    }
  };

  const createNewConversation = async () => {
    if (!chatUser) return;
    if (selectedUsers.length === 0) {
      showError('Error', 'Please select at least one user');
      return;
    }

    try {
      // Ensure all selected users exist in chat_users table
      await ensureChatUsersExist(selectedUsers);

      const isGroup = selectedUsers.length > 1;
      
      // Create conversation
      const { data: conversation, error: conversationError } = await supabase
        .from('chat_conversations')
        .insert([{
          name: isGroup ? (groupName || `Group (${selectedUsers.length + 1})`) : null,
          is_group: isGroup,
          created_by: chatUser.id
        }])
        .select()
        .single();

      if (conversationError) throw conversationError;

      // Add participants (including creator)
      const participants = [
        { conversation_id: conversation.id, user_id: chatUser.id },
        ...selectedUsers.map(userId => ({
          conversation_id: conversation.id,
          user_id: userId
        }))
      ];

      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      // Reset state and close modal
      setSelectedUsers([]);
      setGroupName('');
      setShowNewChatModal(false);
      
      // Refresh conversations and select the new one
      await fetchConversations();
      setSelectedConversation(conversation);
      
      showSuccess('Success', 'Conversation created');
    } catch (err: any) {
      console.error('Error creating conversation:', err);
      showError('Error', 'Failed to create conversation');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return new Date(dateString).toLocaleDateString();
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format time as HH:MM AM/PM
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Check if the message was sent today, yesterday, or earlier
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${timeString}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${timeString}`;
    } else {
      // Format date as MM/DD/YYYY for older messages
      const dateString = date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      return `${dateString} at ${timeString}`;
    }
  };

  const getConversationName = (conversation: ChatConversation) => {
    if (conversation.name) return conversation.name;
    if (!conversation.participants) return 'Chat';
    
    // For direct messages, show the other person's name
    if (!conversation.is_group && conversation.participants.length === 2) {
      const otherUser = conversation.participants.find(p => p.id !== chatUser?.id);
      return otherUser ? otherUser.name : 'Chat';
    }
    
    // For group chats without a name
    return `Group (${conversation.participants.length})`;
  };

  const getConversationAvatar = (conversation: ChatConversation) => {
    if (!conversation.participants) return null;
    
    // For direct messages, show the other person's avatar
    if (!conversation.is_group && conversation.participants.length === 2) {
      const otherUser = conversation.participants.find(p => p.id !== chatUser?.id);
      return otherUser?.avatar_url;
    }
    
    return null; // For groups, we'll use a default icon
  };

  const getOnlineStatus = (conversation: ChatConversation) => {
    if (conversation.is_group) return null;
    if (!conversation.participants) return null;
    
    // For direct messages, check if the other person is online
    const otherUser = conversation.participants.find(p => p.id !== chatUser?.id);
    return otherUser?.is_online;
  };

  // Filter to only show active system users that are not the current user
  const filteredUsers = allUsers.filter(user => 
    user.is_active && 
    user.id !== chatUser?.id && 
    (searchTerm === '' || 
     user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredConversations = conversations.filter(conversation => {
    if (!searchTerm) return true;
    
    // Search by conversation name
    if (conversation.name && conversation.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return true;
    }
    
    // Search by participant names
    if (conversation.participants && conversation.participants.some(
      p => p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )) {
      return true;
    }
    
    // Search by last message
    if (conversation.last_message && conversation.last_message.message.toLowerCase().includes(searchTerm.toLowerCase())) {
      return true;
    }
    
    return false;
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">Team Chat</h1>
            <p className="text-gray-600">Communicate with your team in real-time</p>
          </div>
          <button 
            onClick={() => setShowNewChatModal(true)}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-[calc(100vh-200px)]">
        <div className="flex h-full">
          {/* Conversations Sidebar */}
          <div className="w-80 border-r border-gray-200 flex flex-col h-full">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${
                        selectedConversation?.id === conversation.id ? 'bg-gray-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          {getConversationAvatar(conversation) ? (
                            <img
                              src={getConversationAvatar(conversation) || ''}
                              alt={getConversationName(conversation)}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              {conversation.is_group ? (
                                <Users className="w-5 h-5 text-gray-500" />
                              ) : (
                                <User className="w-5 h-5 text-gray-500" />
                              )}
                            </div>
                          )}
                          {getOnlineStatus(conversation) && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium text-black truncate">
                              {getConversationName(conversation)}
                            </h3>
                            {conversation.last_message && (
                              <span className="text-xs text-gray-500">
                                {getTimeAgo(conversation.last_message.created_at)}
                              </span>
                            )}
                          </div>
                          {conversation.last_message ? (
                            <p className="text-sm text-gray-500 truncate">
                              <span className="font-medium">{conversation.last_message.sender_name}: </span>
                              {conversation.last_message.message.replace(/<[^>]*>?/gm, '')}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">No messages yet</p>
                          )}
                        </div>
                        {conversation.unread_count > 0 && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-medium">
                              {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mb-2" />
                  <p className="text-gray-500 mb-4">No conversations yet</p>
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Start a new conversation
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col h-full">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {getConversationAvatar(selectedConversation) ? (
                        <img
                          src={getConversationAvatar(selectedConversation) || ''}
                          alt={getConversationName(selectedConversation)}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {selectedConversation.is_group ? (
                            <Users className="w-5 h-5 text-gray-500" />
                          ) : (
                            <User className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                      )}
                      {getOnlineStatus(selectedConversation) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-black">
                        {getConversationName(selectedConversation)}
                      </h3>
                      {selectedConversation.is_group ? (
                        <p className="text-xs text-gray-500">
                          {selectedConversation.participants?.length || 0} members
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          {getOnlineStatus(selectedConversation) ? 'Online' : 'Offline'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100">
                      <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100">
                      <Info className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length > 0 ? (
                    messages.map((message, index) => {
                      const isOwnMessage = message.sender_id === chatUser?.id;
                      const showDateHeader = index === 0 || 
                        new Date(message.created_at).toDateString() !== 
                        new Date(messages[index - 1].created_at).toDateString();
                      
                      return (
                        <React.Fragment key={message.id}>
                          {showDateHeader && (
                            <div className="flex items-center justify-center my-4">
                              <div className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-500 flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(message.created_at).toLocaleDateString([], {
                                  weekday: 'long',
                                  month: 'long', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                          )}
                          <div 
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex items-start space-x-2 max-w-[70%]`}>
                              {!isOwnMessage && (
                                <div className="flex-shrink-0 mt-1">
                                  {message.sender?.avatar_url ? (
                                    <img
                                      src={message.sender.avatar_url}
                                      alt={message.sender?.name || 'User'}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                      <User className="w-4 h-4 text-gray-500" />
                                    </div>
                                  )}
                                </div>
                              )}
                              <div>
                                {!isOwnMessage && (
                                  <p className="text-xs text-gray-500 mb-1">{message.sender?.name || 'Unknown'}</p>
                                )}
                                <div 
                                  className={`rounded-lg p-3 ${
                                    isOwnMessage 
                                      ? 'bg-blue-500 text-white' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {message.message_type === 'text' ? (
                                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                                  ) : (
                                    <div 
                                      className="text-sm" 
                                      dangerouslySetInnerHTML={{ __html: message.message }}
                                    />
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatMessageTime(message.created_at)}
                                  {isOwnMessage && (
                                    <span className="ml-1">
                                      {message.is_read ? (
                                        <Check className="w-3 h-3 inline text-blue-500" />
                                      ) : (
                                        <Clock className="w-3 h-3 inline text-gray-400" />
                                      )}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="w-12 h-12 text-gray-300 mb-2" />
                      <p className="text-gray-500">No messages yet</p>
                      <p className="text-sm text-gray-400">Send a message to start the conversation</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  {showLinkInput && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Add Link</h4>
                        <button 
                          onClick={() => setShowLinkInput(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <input
                          type="url"
                          placeholder="https://example.com"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Display text (optional)"
                          value={linkText}
                          onChange={(e) => setLinkText(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={sendLinkMessage}
                            disabled={!linkUrl}
                            className="px-3 py-1 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                          >
                            Add Link
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <button 
                        onClick={() => {
                          setShowEmojiPicker(!showEmojiPicker);
                          setShowImageUpload(false);
                          setShowLinkInput(false);
                        }}
                        className="p-2 text-gray-400 hover:text-black transition-colors"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute bottom-12 left-0 z-10">
                          <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            emojiStyle={EmojiStyle.APPLE}
                            width={320}
                            height={400}
                          />
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowEmojiPicker(false);
                        setShowLinkInput(false);
                      }}
                      className="p-2 text-gray-400 hover:text-black transition-colors"
                      disabled={uploadingImage}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      {uploadingImage ? (
                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Image className="w-5 h-5" />
                      )}
                    </button>
                    <button 
                      onClick={() => {
                        setShowLinkInput(!showLinkInput);
                        setShowEmojiPicker(false);
                      }}
                      className="p-2 text-gray-400 hover:text-black transition-colors"
                    >
                      <LinkIcon className="w-5 h-5" />
                    </button>
                    <div className="flex-1 relative">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder="Type a message..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                        rows={1}
                        disabled={isSending}
                      />
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="p-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No conversation selected</h3>
                <p className="text-gray-500 mb-6">Select a conversation or start a new one</p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Start New Conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">New Conversation</h2>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedUsers.length > 1 ? 'Group Name (Optional)' : 'Start a conversation'}
                </label>
                {selectedUsers.length > 1 && (
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent mb-4"
                  />
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>
              
              {selectedUsers.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected ({selectedUsers.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map(userId => {
                      const user = allUsers.find(u => u.id === userId);
                      return user ? (
                        <div 
                          key={userId}
                          className="flex items-center bg-gray-100 rounded-full pl-2 pr-1 py-1"
                        >
                          <span className="text-sm">{user.name}</span>
                          <button
                            onClick={() => toggleUserSelection(userId)}
                            className="ml-1 p-1 text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredUsers.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => toggleUserSelection(user.id)}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex items-center flex-1">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.name}
                              className="w-8 h-8 rounded-full mr-3 object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-black">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                            {user.department && (
                              <p className="text-xs text-gray-400">{user.department}</p>
                            )}
                          </div>
                        </div>
                        <div className="w-5 h-5 border border-gray-300 rounded-sm flex items-center justify-center">
                          {selectedUsers.includes(user.id) && (
                            <Check className="w-4 h-4 text-black" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-gray-500">No employees found</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowNewChatModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createNewConversation}
                disabled={selectedUsers.length === 0}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Start Conversation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};