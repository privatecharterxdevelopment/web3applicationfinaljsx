import React, { memo } from 'react';
import { Send, ShoppingCart, Crown, MessageSquare } from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';

const InputArea = memo(({
  currentMessage,
  setCurrentMessage,
  isSearching,
  messageLimitReached,
  cartItems,
  activeChat,
  user,
  handleSendMessage,
  setShowCartSidebar,
  setShowRequestForm,
  setShowSubscriptionModal,
  setChatHistory,
  setToast
}) => {
  const handleSupportRequest = async () => {
    // Add support request message to chat
    setChatHistory(prev => prev.map(c =>
      c.id === activeChat
        ? {
            ...c,
            messages: [...c.messages, {
              role: 'assistant',
              content: `We noticed you need support due to an error or specific assistance required.\n\nOur team will review this conversation and contact you shortly.\n\n**Please hold on** - a member of our support team will reach out to you via email at ${user?.email || 'your registered email'}.\n\nIn the meantime, feel free to continue chatting or describe the issue you're experiencing.`,
              isSupportRequest: true
            }]
          }
        : c
    ));
    setToast({ message: 'Support request sent. Our team will contact you.', type: 'success' });

    // Save to database
    if (user?.id) {
      const { error } = await supabase.from('user_requests').insert({
        user_id: user.id,
        request_type: 'support',
        status: 'pending',
        request_data: {
          conversation_id: activeChat,
          user_email: user.email,
          timestamp: new Date().toISOString(),
          context: 'User requested support via AI chat'
        }
      });
      if (error) console.error('Failed to save support request:', error);
    }
  };

  if (messageLimitReached) {
    return (
      <div className="flex-shrink-0 fixed sm:sticky bottom-0 left-0 right-0 sm:left-auto sm:right-auto z-30 px-4 sm:px-6 pb-4 sm:pb-6 pt-3 sm:pt-4 bg-white sm:bg-gradient-to-t sm:from-white sm:via-white/95 sm:to-transparent border-t border-gray-200 sm:border-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MessageSquare size={20} className="text-blue-500" />
                <span className="font-medium text-gray-900">Message Limit Reached</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                You've reached 20 messages for this conversation.
                {cartItems.length > 0 && ` You have ${cartItems.length} item${cartItems.length > 1 ? 's' : ''} in your cart.`}
              </p>
              <div className="flex gap-3">
                {cartItems.length > 0 ? (
                  <>
                    <button
                      onClick={() => setShowCartSidebar(true)}
                      className="flex-1 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={18} />
                      View Cart ({cartItems.length})
                    </button>
                    <button
                      onClick={() => setShowRequestForm(true)}
                      className="flex-1 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Send size={18} />
                      Send Request
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setShowRequestForm(true)}
                      className="flex-1 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Send size={18} />
                      Send Request
                    </button>
                    <button
                      onClick={() => setShowSubscriptionModal(true)}
                      className="flex-1 py-3 bg-white/60 text-gray-700 rounded-lg hover:bg-white/80 transition-colors font-medium border border-gray-200/50 flex items-center justify-center gap-2"
                      style={{ backdropFilter: 'blur(8px)' }}
                    >
                      <Crown size={18} className="text-gray-500" />
                      Upgrade
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowSubscriptionModal(true)}
                className="mt-3 w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center gap-1"
              >
                <Crown size={14} />
                Need more messages? Upgrade your plan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 fixed sm:sticky bottom-0 left-0 right-0 sm:left-auto sm:right-auto z-30 px-4 sm:px-6 pb-4 sm:pb-6 pt-3 sm:pt-4 bg-white sm:bg-gradient-to-t sm:from-white sm:via-white/95 sm:to-transparent border-t border-gray-200 sm:border-transparent">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && currentMessage.trim() && !isSearching) {
                handleSendMessage(currentMessage);
              }
            }}
            placeholder="Message Sphera..."
            disabled={isSearching}
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 disabled:cursor-not-allowed"
          />

          {/* Support Badge */}
          <button
            onClick={handleSupportRequest}
            className="flex-shrink-0 px-2 py-1 text-[10px] font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Need help? Click for support"
          >
            Support?
          </button>

          <button
            onClick={() => handleSendMessage(currentMessage)}
            disabled={!currentMessage.trim() || isSearching}
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              currentMessage.trim() && !isSearching
                ? 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:scale-110'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
});

InputArea.displayName = 'InputArea';

export default InputArea;
