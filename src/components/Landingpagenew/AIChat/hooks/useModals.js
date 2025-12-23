/**
 * useModals Hook
 * Manages all modal visibility states for AIChat
 */

import { useState, useCallback } from 'react';

export const useModals = () => {
  // Calendar Modal
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedItemForCalendar, setSelectedItemForCalendar] = useState(null);

  // Adjust/Edit Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [itemToAdjust, setItemToAdjust] = useState(null);

  // Wallet Connect Modal
  const [showWalletConnect, setShowWalletConnect] = useState(false);

  // Consultation Modal
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [consultationTopic, setConsultationTopic] = useState('');

  // Bulk Order Interface
  const [showBulkOrderInterface, setShowBulkOrderInterface] = useState(false);

  // Chat Sessions Modal
  const [showChatSessions, setShowChatSessions] = useState(false);

  // Subscription Modal
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Report Issue Modal
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);
  const [reportIssueForm, setReportIssueForm] = useState({ message: '', rating: 0 });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Request Form
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Crypto Payment Modal
  const [showCryptoPayment, setShowCryptoPayment] = useState(false);
  const [selectedPaymentItem, setSelectedPaymentItem] = useState(null);

  // Break the Price Modal
  const [showBreakThePrice, setShowBreakThePrice] = useState(false);
  const [breakThePriceFile, setBreakThePriceFile] = useState(null);
  const [isUploadingQuote, setIsUploadingQuote] = useState(false);

  // Extras Modal
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [showInlineExtras, setShowInlineExtras] = useState(false);
  const [selectedExtraCategory, setSelectedExtraCategory] = useState(null);

  // Subscription Blocker
  const [showSubscriptionBlocker, setShowSubscriptionBlocker] = useState(false);
  const [subscriptionBlockerReason, setSubscriptionBlockerReason] = useState('');

  // Cart Sidebar
  const [showCartSidebar, setShowCartSidebar] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showCartWidget, setShowCartWidget] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState(null);

  // Close all modals
  const closeAllModals = useCallback(() => {
    setShowCalendarModal(false);
    setShowAdjustModal(false);
    setShowWalletConnect(false);
    setShowConsultationModal(false);
    setShowBulkOrderInterface(false);
    setShowChatSessions(false);
    setShowSubscriptionModal(false);
    setShowReportIssueModal(false);
    setShowRequestForm(false);
    setShowCryptoPayment(false);
    setShowBreakThePrice(false);
    setShowExtrasModal(false);
    setShowCartSidebar(false);
    setShowSubscriptionBlocker(false);
  }, []);

  // Open calendar modal with item
  const openCalendarModal = useCallback((item) => {
    setSelectedItemForCalendar(item);
    setShowCalendarModal(true);
  }, []);

  // Open adjust modal with item
  const openAdjustModal = useCallback((item) => {
    setItemToAdjust(item);
    setShowAdjustModal(true);
  }, []);

  // Open consultation modal with topic
  const openConsultationModal = useCallback((topic = '') => {
    setConsultationTopic(topic);
    setShowConsultationModal(true);
  }, []);

  // Open crypto payment with item
  const openCryptoPayment = useCallback((item) => {
    setSelectedPaymentItem(item);
    setShowCryptoPayment(true);
  }, []);

  // Open subscription blocker with reason
  const openSubscriptionBlocker = useCallback((reason) => {
    setSubscriptionBlockerReason(reason);
    setShowSubscriptionBlocker(true);
  }, []);

  return {
    // Calendar
    showCalendarModal,
    setShowCalendarModal,
    selectedItemForCalendar,
    setSelectedItemForCalendar,
    openCalendarModal,

    // Adjust
    showAdjustModal,
    setShowAdjustModal,
    itemToAdjust,
    setItemToAdjust,
    openAdjustModal,

    // Wallet
    showWalletConnect,
    setShowWalletConnect,

    // Consultation
    showConsultationModal,
    setShowConsultationModal,
    consultationTopic,
    setConsultationTopic,
    openConsultationModal,

    // Bulk Order
    showBulkOrderInterface,
    setShowBulkOrderInterface,

    // Chat Sessions
    showChatSessions,
    setShowChatSessions,

    // Subscription
    showSubscriptionModal,
    setShowSubscriptionModal,

    // Report Issue
    showReportIssueModal,
    setShowReportIssueModal,
    reportIssueForm,
    setReportIssueForm,
    isSubmittingReport,
    setIsSubmittingReport,

    // Request Form
    showRequestForm,
    setShowRequestForm,

    // Crypto Payment
    showCryptoPayment,
    setShowCryptoPayment,
    selectedPaymentItem,
    setSelectedPaymentItem,
    openCryptoPayment,

    // Break the Price
    showBreakThePrice,
    setShowBreakThePrice,
    breakThePriceFile,
    setBreakThePriceFile,
    isUploadingQuote,
    setIsUploadingQuote,

    // Extras
    showExtrasModal,
    setShowExtrasModal,
    showInlineExtras,
    setShowInlineExtras,
    selectedExtraCategory,
    setSelectedExtraCategory,

    // Subscription Blocker
    showSubscriptionBlocker,
    setShowSubscriptionBlocker,
    subscriptionBlockerReason,
    setSubscriptionBlockerReason,
    openSubscriptionBlocker,

    // Cart Sidebar
    showCartSidebar,
    setShowCartSidebar,
    showCart,
    setShowCart,
    showCartWidget,
    setShowCartWidget,

    // Toast
    toast,
    setToast,

    // Utils
    closeAllModals
  };
};

export default useModals;
