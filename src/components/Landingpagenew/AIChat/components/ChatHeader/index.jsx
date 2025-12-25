import React, { memo } from 'react';
import { ArrowLeft, Crown, AlertCircle, MessageSquare, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ChatHeader = memo(({
  currentChat,
  cartItems,
  activeChat,
  chatHistory,
  userSubscriptionLimits,
  userProfile,
  messageCount,
  showChatSessions,
  setShowChatSessions,
  setShowCartSidebar,
  setShowSubscriptionModal,
  setShowReportIssueModal,
  setActiveChat,
  setWeather,
  setCartItems,
  setSearchResults,
  user,
  subscriptionService
}) => {
  const navigate = useNavigate();

  const rawTier = userSubscriptionLimits?.tier || userProfile?.subscription_tier;
  const displayTier = rawTier?.toLowerCase();

  return (
    <div className="fixed sm:sticky top-0 left-0 right-0 sm:left-auto sm:right-auto z-30 px-3 sm:px-6 py-2.5 bg-white sm:bg-white/15 border-b border-gray-200 sm:border-white/10 flex-shrink-0" style={{ backdropFilter: 'blur(50px) saturate(180%)', WebkitBackdropFilter: 'blur(50px) saturate(180%)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Back to Dashboard button - mobile only */}
          <button
            onClick={() => navigate('/dashboard')}
            className="sm:hidden p-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200"
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          {/* New Chat button - desktop only */}
          <button
            onClick={() => {
              setActiveChat('new');
              setWeather(null);
              setCartItems([]);
              setSearchResults(null);
            }}
            className="hidden sm:flex p-2 bg-white/25 text-gray-700 rounded-xl hover:bg-white/40 transition-all duration-200 border border-white/20"
            style={{ backdropFilter: 'blur(10px)' }}
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-sm sm:text-base font-medium sm:font-normal text-gray-800 sm:text-gray-700 truncate max-w-[180px] sm:max-w-md">
            {currentChat?.messages?.[0]?.content?.substring(0, 30) || currentChat?.title || 'Sphera AI'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Cart - Modern glass bubble */}
          <button
            onClick={() => setShowCartSidebar(true)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100/80 hover:bg-gray-200/90 text-gray-600 transition-all duration-200 border border-gray-200/50 hover:border-gray-300/60 group"
            style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            title="View Cart"
          >
            <span className="text-xs font-light tracking-wide" style={{ fontFamily: 'Satoshi, sans-serif' }}>Cart</span>
            {cartItems.length > 0 && (
              <span className="min-w-[18px] h-[18px] bg-gray-800 text-white text-[10px] font-medium rounded-full flex items-center justify-center px-1">
                {cartItems.length}
              </span>
            )}
          </button>

          {/* Subscription & Message Counter */}
          <button
            onClick={() => setShowSubscriptionModal(true)}
            className="px-2.5 py-1.5 bg-white/40 hover:bg-white/60 rounded-xl text-xs font-medium text-gray-700 transition-all duration-200 flex items-center gap-1.5 border border-gray-200/40 hover:border-gray-300/50"
            style={{ backdropFilter: 'blur(8px)' }}
            title="Click to manage subscription"
          >
            {displayTier === 'elite' ? (
              <span className="flex items-center gap-1">
                <Crown size={12} className="text-amber-600" />
                <span className="text-gray-700">Elite</span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500">∞</span>
              </span>
            ) : displayTier === 'traveller' ? (
              <span className="flex items-center gap-1">
                <span className="text-gray-600">Traveller</span>
                <span className="text-gray-300">•</span>
                <span className={`${messageCount >= 20 ? 'text-red-500' : messageCount >= 15 ? 'text-amber-500' : 'text-gray-500'}`}>
                  {messageCount}/25
                </span>
              </span>
            ) : displayTier === 'explorer' ? (
              <span className="flex items-center gap-1">
                <span className="text-gray-600">Explorer</span>
                <span className="text-gray-300">•</span>
                <span className={`${messageCount >= 8 ? 'text-red-500' : messageCount >= 5 ? 'text-amber-500' : 'text-gray-500'}`}>
                  {messageCount}/10
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span className="text-gray-500">No Plan</span>
              </span>
            )}
          </button>

          {/* Report Issue Button */}
          <button
            onClick={() => setShowReportIssueModal(true)}
            className="p-2 bg-white/40 hover:bg-white/60 rounded-xl text-gray-500 hover:text-gray-700 transition-all duration-200 border border-gray-200/40 hover:border-gray-300/50"
            style={{ backdropFilter: 'blur(8px)' }}
            title="Report an issue"
          >
            <AlertCircle size={14} />
          </button>

          {/* Chat Sessions Dropdown - Hidden */}
          <div className="relative hidden">
            <button
              onClick={() => setShowChatSessions(!showChatSessions)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-black transition-colors"
            >
              <MessageSquare size={16} />
              <span className="font-medium">
                {chatHistory.filter(c => c.id !== 'new').length} chats
              </span>
            </button>

            {showChatSessions && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowChatSessions(false)}
                />
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Your Chats</h3>
                      <button
                        onClick={async () => {
                          setShowChatSessions(false);
                          if (user?.id && subscriptionService) {
                            const { canStart } = await subscriptionService.canStartNewChat(user.id);
                            if (!canStart) {
                              setShowSubscriptionModal(true);
                              return;
                            }
                          }
                          setActiveChat('new');
                          setWeather(null);
                          setCartItems([]);
                          setSearchResults(null);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
                      >
                        <Plus size={14} />
                        <span>New Chat</span>
                      </button>
                    </div>

                    {userProfile && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">
                            {userProfile.chats_limit === null ? (
                              <span className="flex items-center gap-1 text-yellow-600">
                                <Crown size={12} />
                                <span className="font-medium">Unlimited chats</span>
                              </span>
                            ) : (
                              <span>
                                <span className="font-medium text-gray-900">{userProfile.chats_used}</span>
                                <span className="text-gray-500"> / {userProfile.chats_limit} used</span>
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {chatHistory.filter(c => c.id !== 'new').length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          No chat history yet
                        </div>
                      ) : (
                        chatHistory
                          .filter(c => c.id !== 'new')
                          .map((chat) => (
                            <button
                              key={chat.id}
                              onClick={() => {
                                setActiveChat(chat.id);
                                setShowChatSessions(false);
                              }}
                              className={`w-full text-left p-3 rounded-lg transition-colors ${
                                activeChat === chat.id
                                  ? 'bg-gray-100 border border-gray-300'
                                  : 'hover:bg-gray-50 border border-transparent'
                              }`}
                            >
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {chat.title}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-gray-500">{chat.date}</p>
                                <p className="text-xs text-gray-400">
                                  {chat.messages?.length || 0} messages
                                </p>
                              </div>
                            </button>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ChatHeader.displayName = 'ChatHeader';

export default ChatHeader;
