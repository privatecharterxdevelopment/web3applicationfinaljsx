import React, { useState } from 'react';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  ChevronRight,
  X,
  Send,
  LifeBuoy
} from 'lucide-react';

interface SupportMessage {
  id: string;
  client_name: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  created_at: string;
}

interface ClientSupportWidgetProps {
  messages: SupportMessage[];
}

export const ClientSupportWidget: React.FC<ClientSupportWidgetProps> = ({ messages }) => {
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [replyText, setReplyText] = useState('');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedMessage) return;
    
    // In a real app, this would send the reply to the backend
    alert(`Reply sent to ${selectedMessage.client_name}: ${replyText}`);
    setReplyText('');
    setSelectedMessage(null);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-black flex items-center">
          <LifeBuoy className="w-5 h-5 mr-2 text-blue-600" />
          Client Support Messages
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
            {messages.filter(m => m.status === 'new').length} new
          </span>
        </div>
      </div>
      
      <div className="p-4 md:p-6">
        {messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => setSelectedMessage(message)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-black">{message.client_name}</p>
                      <p className="text-xs text-gray-500">{getTimeAgo(message.created_at)}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(message.status)}`}>
                    {message.status === 'in_progress' ? 'In Progress' : 
                     message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{message.message}</p>
                <div className="flex justify-end mt-2">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No support messages</p>
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Support Message</h2>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-black">{selectedMessage.client_name}</p>
                    <p className="text-xs text-gray-500">{getTimeAgo(selectedMessage.created_at)}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedMessage.status)}`}>
                  {selectedMessage.status === 'in_progress' ? 'In Progress' : 
                   selectedMessage.status.charAt(0).toUpperCase() + selectedMessage.status.slice(1)}
                </span>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-gray-700">{selectedMessage.message}</p>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium text-black">Reply to Client</h3>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  rows={4}
                ></textarea>
                
                <div className="flex space-x-3">
                  <button
                    className={`px-3 py-2 rounded-lg border border-gray-300 text-sm flex items-center space-x-1 ${
                      selectedMessage.status === 'new' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' : 'text-gray-600'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Mark In Progress</span>
                  </button>
                  <button
                    className={`px-3 py-2 rounded-lg border border-gray-300 text-sm flex items-center space-x-1 ${
                      selectedMessage.status !== 'resolved' ? 'bg-green-50 text-green-700 border-green-300' : 'text-gray-600'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark Resolved</span>
                  </button>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Reply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};