import React, { memo } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';
import CreateEventModal from '../../../../Calendar/CreateEventModal';
import RequestAdjustmentModal from '../../../../modals/RequestAdjustmentModal';
import ConsultationBookingModal from '../../../../modals/ConsultationBookingModal';
import WalletConnect from '../../../../WalletConnect';
import BulkOrderInterface from '../../../../BulkOrderInterface';
import SubscriptionModal from '../../../../SubscriptionModal';
import CryptoPaymentModal from '../../../../Payment/CryptoPaymentModal';

// Report Issue Modal Component
const ReportIssueModal = memo(({
  show,
  onClose,
  user,
  currentChat,
  reportIssueForm,
  setReportIssueForm,
  isSubmittingReport,
  setIsSubmittingReport,
  setToast
}) => {
  if (!show) return null;

  const handleSubmit = async () => {
    if (!reportIssueForm.message.trim()) {
      setToast({ message: 'Please describe the issue', type: 'warning' });
      return;
    }
    setIsSubmittingReport(true);
    try {
      const { error } = await supabase
        .from('ai_chat_reports')
        .insert({
          user_id: user?.id,
          user_email: user?.email,
          user_name: user?.name,
          chat_id: currentChat?.id,
          rating: reportIssueForm.rating,
          message: reportIssueForm.message,
          chat_context: JSON.stringify(currentChat?.messages?.slice(-5) || [])
        });

      if (error) throw error;

      setToast({ message: 'Report submitted successfully. Thank you for your feedback!', type: 'success' });
      onClose();
      setReportIssueForm({ message: '', rating: 0 });
    } catch (err) {
      console.error('Error submitting report:', err);
      setToast({ message: 'Failed to submit report. Please try again.', type: 'error' });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Report an Issue</h2>
              <p className="text-sm text-gray-500 mt-1">Help us improve your experience</p>
            </div>
            <button
              onClick={() => {
                onClose();
                setReportIssueForm({ message: '', rating: 0 });
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-500 mb-2">Reporting as:</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {(user?.email || user?.name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.email || 'No email'}</p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Rate your experience</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReportIssueForm(prev => ({ ...prev, rating: star }))}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <svg
                    className={`w-8 h-8 ${reportIssueForm.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-500">
                {reportIssueForm.rating > 0 ? `${reportIssueForm.rating}/5` : 'Select rating'}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Describe the issue</label>
            <textarea
              value={reportIssueForm.message}
              onChange={(e) => setReportIssueForm(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Please describe what went wrong or how we can improve..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none text-sm"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                onClose();
                setReportIssueForm({ message: '', rating: 0 });
              }}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmittingReport}
              className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:bg-gray-400"
            >
              {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ReportIssueModal.displayName = 'ReportIssueModal';

// Main Modals Container
const Modals = memo(({
  // Calendar Modal
  showCalendarModal,
  setShowCalendarModal,
  selectedItemForCalendar,

  // Adjust Modal
  showAdjustModal,
  setShowAdjustModal,
  itemToAdjust,
  setItemToAdjust,
  handleSaveAdjustment,
  addToCart,
  sendRequest,

  // Wallet Connect
  showWalletConnect,
  setShowWalletConnect,
  handleWalletConnect,

  // Consultation Modal
  showConsultationModal,
  setShowConsultationModal,
  consultationTopic,

  // Bulk Order Interface
  showBulkOrderInterface,
  setShowBulkOrderInterface,
  cartItems,
  setCartItems,
  saveRequestToPDF,
  handleSendMessage,

  // Subscription Modal
  showSubscriptionModal,
  setShowSubscriptionModal,
  userProfile,
  userSubscriptionLimits,
  loadUserProfile,
  setToast,

  // Report Issue Modal
  showReportIssueModal,
  setShowReportIssueModal,
  reportIssueForm,
  setReportIssueForm,
  isSubmittingReport,
  setIsSubmittingReport,

  // Crypto Payment Modal
  showCryptoPayment,
  setShowCryptoPayment,
  selectedPaymentItem,
  setSelectedPaymentItem,

  // Common
  user,
  currentChat,
  activeChat,
  setChatHistory
}) => {
  return (
    <>
      {/* Calendar Modal */}
      {showCalendarModal && selectedItemForCalendar && (
        <CreateEventModal
          isOpen={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          defaultTitle={`${selectedItemForCalendar.name || selectedItemForCalendar.type} Booking`}
          defaultDate={selectedItemForCalendar.departureDate || selectedItemForCalendar.date}
          defaultDetails={{
            type: selectedItemForCalendar.type,
            from: selectedItemForCalendar.from || selectedItemForCalendar.origin,
            to: selectedItemForCalendar.to || selectedItemForCalendar.destination,
            price: selectedItemForCalendar.price
          }}
          onEventCreated={() => {
            setShowCalendarModal(false);
            setChatHistory(prev => prev.map(c =>
              c.id === activeChat ? { ...c, messages: [...c.messages, { role: 'assistant', content: 'Added to calendar' }] } : c
            ));
          }}
          user={user}
          linkedBooking={selectedItemForCalendar}
        />
      )}

      {/* Adjust Modal */}
      {showAdjustModal && itemToAdjust && (
        <RequestAdjustmentModal
          show={showAdjustModal}
          onClose={() => {
            setShowAdjustModal(false);
            setItemToAdjust(null);
          }}
          item={itemToAdjust}
          onSave={handleSaveAdjustment}
          onSendRequest={(item) => {
            addToCart(item);
            setShowAdjustModal(false);
            setTimeout(() => sendRequest(), 500);
          }}
        />
      )}

      {/* Wallet Connect */}
      {showWalletConnect && (
        <WalletConnect
          show={showWalletConnect}
          onClose={() => setShowWalletConnect(false)}
          onConnect={handleWalletConnect}
          onError={(error) => {
            setChatHistory(prev => prev.map(c =>
              c.id === activeChat ? { ...c, messages: [...c.messages, { role: 'assistant', content: `Wallet error: ${error}` }] } : c
            ));
          }}
        />
      )}

      {/* Consultation Modal */}
      <ConsultationBookingModal
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
        topic={consultationTopic}
      />

      {/* Bulk Order Interface */}
      {showBulkOrderInterface && cartItems.length > 0 && (
        <BulkOrderInterface
          cartItems={cartItems}
          onUpdateItem={(itemId, updates) => {
            setCartItems(prev => prev.map(item =>
              item.cartId === itemId ? { ...item, ...updates } : item
            ));
          }}
          onRemoveItem={(itemId) => {
            setCartItems(prev => prev.filter(item => item.cartId !== itemId));
          }}
          onSubmit={(sendImmediately) => {
            setShowBulkOrderInterface(false);
            if (sendImmediately) {
              sendRequest();
            } else {
              saveRequestToPDF();
            }
          }}
          onChatAdjust={(message) => {
            handleSendMessage(message);
          }}
        />
      )}

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={async () => {
          setShowSubscriptionModal(false);
          if (user?.id) {
            await loadUserProfile();
          }
        }}
        currentTier={userProfile?.subscription_tier || userSubscriptionLimits?.tier}
        onUpgrade={async (tierId) => {
          console.log('Plan selected:', tierId);
        }}
        onToast={({ message, type }) => setToast({ message, type })}
      />

      {/* Report Issue Modal */}
      <ReportIssueModal
        show={showReportIssueModal}
        onClose={() => setShowReportIssueModal(false)}
        user={user}
        currentChat={currentChat}
        reportIssueForm={reportIssueForm}
        setReportIssueForm={setReportIssueForm}
        isSubmittingReport={isSubmittingReport}
        setIsSubmittingReport={setIsSubmittingReport}
        setToast={setToast}
      />

      {/* Crypto Payment Modal */}
      {showCryptoPayment && selectedPaymentItem && (
        <CryptoPaymentModal
          isOpen={showCryptoPayment}
          onClose={() => {
            setShowCryptoPayment(false);
            setSelectedPaymentItem(null);
          }}
          service={{
            ...selectedPaymentItem,
            price: selectedPaymentItem.price_usd || selectedPaymentItem.price || selectedPaymentItem.discounted_price || 0,
            price_usd: selectedPaymentItem.price_usd || selectedPaymentItem.price || 0,
            totalWithFee: selectedPaymentItem.totalWithFee || selectedPaymentItem.price_with_vat || Math.round((selectedPaymentItem.price_usd || selectedPaymentItem.price || 0) * 1.106),
            currency: 'USD',
            id: selectedPaymentItem.original_id || selectedPaymentItem.id
          }}
          serviceType={
            selectedPaymentItem.type === 'empty_legs' || selectedPaymentItem.type === 'emptyleg'
              ? 'empty_leg'
              : selectedPaymentItem.type === 'adventure'
                ? 'adventure'
                : 'charter'
          }
          onSuccess={(paymentData) => {
            console.log('Crypto payment initiated:', paymentData);
            setShowCryptoPayment(false);
            setSelectedPaymentItem(null);

            setCartItems(prev => prev.map(item =>
              item.cartId === selectedPaymentItem.cartId
                ? { ...item, isPaid: true, paymentStatus: 'pending_confirmation', coingateOrderId: paymentData?.order_id }
                : item
            ));

            setToast({ message: 'Payment initiated! Complete the payment on CoinGate.', type: 'success' });

            const otherUnpaidItems = cartItems.filter(item => item.cartId !== selectedPaymentItem.cartId && !item.isPaid);
            const confirmMsg = {
              role: 'assistant',
              content: `Payment initiated for ${selectedPaymentItem.name || selectedPaymentItem.title || 'your booking'}!\n\nPlease complete the payment on CoinGate. Once confirmed:\n• You'll receive a confirmation email\n• Your booking will appear in "My Bookings"\n• You'll earn 1.5% PVCX rewards${otherUnpaidItems.length > 0 ? `\n\nYou still have ${otherUnpaidItems.length} other item${otherUnpaidItems.length > 1 ? 's' : ''} in your cart.` : ''}\n\nThank you for choosing Sphera World!`
            };
            setChatHistory(prev => prev.map(c =>
              c.id === activeChat
                ? { ...c, messages: [...c.messages, confirmMsg] }
                : c
            ));
          }}
        />
      )}

      {/* Duplicate Wallet Connect at end (as in original) */}
      <WalletConnect
        show={showWalletConnect}
        onClose={() => setShowWalletConnect(false)}
        onConnect={handleWalletConnect}
        onError={(error) => {
          console.error('Wallet error:', error);
        }}
      />
    </>
  );
});

Modals.displayName = 'Modals';

export default Modals;
export { ReportIssueModal };
