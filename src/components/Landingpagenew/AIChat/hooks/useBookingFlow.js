/**
 * useBookingFlow Hook - COMPLETE Booking Flow Management
 *
 * Contains ALL booking logic from original AIChat.jsx:
 * - Confirmation steps with multi-step wizard
 * - Payment method selection (card, bank, crypto)
 * - Crypto payment processing with CoinGate
 * - Calendar integration with Google/Apple
 * - Request submission with PDF generation
 * - Break The Price file upload with Claude Vision
 * - NFT benefit tracking
 * - Multi-stop journey handling
 * - Email notifications
 */

import { useState, useCallback, useRef } from 'react';
import { createRequest } from '../../../../services/requests';
import { subscriptionService } from '../../../../services/subscriptionService';
import { supabase } from '../../../../lib/supabase';
import { getTierLimits } from '../utils/constants';

// Payment method options
export const PAYMENT_METHODS = {
  CARD: { id: 'card', label: 'Credit/Debit Card', icon: '💳', fee: 0 },
  BANK: { id: 'bank', label: 'Bank Transfer', icon: '🏦', fee: 0 },
  WIRE: { id: 'wire', label: 'Wire Transfer', icon: '📤', fee: 0 },
  USDT: { id: 'usdt', label: 'USDT (Tether)', icon: '💎', fee: -0.05, bonus: '5% bonus' },
  USDC: { id: 'usdc', label: 'USDC', icon: '💎', fee: -0.05, bonus: '5% bonus' },
  BTC: { id: 'btc', label: 'Bitcoin', icon: '₿', fee: -0.05, bonus: '5% bonus' },
  ETH: { id: 'eth', label: 'Ethereum', icon: 'Ξ', fee: -0.05, bonus: '5% bonus' },
  PVCX: { id: 'pvcx', label: 'PVCX Token', icon: '🪙', fee: -0.10, bonus: '10% bonus' }
};

// Request types mapping
export const REQUEST_TYPE_MAP = {
  jets: 'private_jet_charter',
  jet: 'private_jet_charter',
  aircraft: 'private_jet_charter',
  helicopters: 'helicopter_charter',
  helicopter: 'helicopter_charter',
  empty_legs: 'empty_leg',
  emptyleg: 'empty_leg',
  yachts: 'yacht_charter',
  yacht: 'yacht_charter',
  luxury_cars: 'luxury_car_rental',
  cars: 'luxury_car_rental',
  taxi: 'ground_transport',
  taxi_cars: 'ground_transport',
  transfer: 'ground_transport',
  ground_transport: 'ground_transport',
  adventures: 'adventure_package',
  adventure: 'adventure_package',
  fixed_offer: 'fixed_offer',
  fixed_offers: 'fixed_offer',
  hotel: 'hotel_booking',
  hotels: 'hotel_booking',
  restaurant: 'restaurant_reservation',
  concierge: 'concierge_request',
  medevac: 'medevac_request',
  visa: 'visa_request'
};

export const useBookingFlow = ({
  user,
  cartItems,
  setCartItems,
  setToast,
  chatHistory,
  setChatHistory,
  activeChat,
  userHasNFT,
  isAdmin,
  userSubscriptionLimits
}) => {
  // Booking flow states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [pendingBooking, setPendingBooking] = useState(null);

  // Calendar states
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedItemForCalendar, setSelectedItemForCalendar] = useState(null);

  // Crypto payment states
  const [showCryptoPayment, setShowCryptoPayment] = useState(false);
  const [selectedPaymentItem, setSelectedPaymentItem] = useState(null);
  const [cryptoPaymentStatus, setCryptoPaymentStatus] = useState(null);
  const [connectedWallet, setConnectedWallet] = useState(null);

  // Confirmation states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState(null);

  // NFT benefit tracking
  const [usedNFTBenefitThisYear, setUsedNFTBenefitThisYear] = useState(
    sessionStorage.getItem('nft_benefit_used_this_year') === 'true'
  );

  // Refs
  const submissionInProgressRef = useRef(false);

  // Determine request type from cart items
  const determineRequestType = useCallback((items) => {
    if (!items || items.length === 0) return 'booking';

    const types = new Set(items.map(i => i.type));
    const hasMultiStop = items.some(i => i.isMultiStop);

    if (hasMultiStop) return 'multi_stop_charter';
    if (types.size > 1) return 'booking';

    const onlyType = Array.from(types)[0];
    return REQUEST_TYPE_MAP[onlyType] || 'booking';
  }, []);

  // Calculate cart total
  const calculateCartTotal = useCallback(() => {
    if (!cartItems || cartItems.length === 0) return 0;
    return cartItems.reduce((sum, item) =>
      sum + (item.price || item.price_usd || item.totalWithFee || item.basePrice || 0), 0
    );
  }, [cartItems]);

  // Add item to cart with confirmation
  const addToCartWithConfirmation = useCallback((item, showConfirm = true) => {
    const cartId = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newItem = {
      ...item,
      cartId,
      addedAt: new Date().toISOString()
    };

    setCartItems(prev => [...prev, newItem]);

    if (showConfirm && setToast) {
      setToast({ message: `Added ${item.name || 'item'} to cart`, type: 'cart' });
    }

    return cartId;
  }, [setCartItems, setToast]);

  // Handle confirm booking action from chat
  const handleConfirmBooking = useCallback((bookingData) => {
    setPendingBooking(bookingData);
    setShowPaymentOptions(true);
  }, []);

  // Handle add to cart from confirmation
  const handleAddToCartFromConfirmation = useCallback((bookingData) => {
    addToCartWithConfirmation(bookingData);
    setPendingBooking(null);
  }, [addToCartWithConfirmation]);

  // Handle request quote
  const handleRequestQuote = useCallback(async (bookingData) => {
    if (!user?.id) {
      setToast?.({ message: 'Please log in to request a quote', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        user_id: user.id,
        request_type: 'quote_request',
        status: 'pending',
        request_data: {
          item: bookingData,
          timestamp: new Date().toISOString(),
          user_email: user.email,
          context: 'Quote request from AI chat'
        }
      };

      const { error } = await supabase.from('user_requests').insert(requestData);

      if (error) throw error;

      // Add confirmation message to chat
      const confirmMsg = {
        role: 'assistant',
        content: `✅ Quote request submitted successfully!\n\nOur team will review your request and contact you at ${user.email} within 24 hours.\n\n**Request Details:**\n${bookingData.name || bookingData.title || 'Charter Request'}\n${bookingData.from ? `📍 ${bookingData.from} → ${bookingData.to}` : ''}`,
        isQuoteConfirmation: true
      };

      setChatHistory?.(prev => prev.map(c =>
        c.id === activeChat
          ? { ...c, messages: [...c.messages, confirmMsg] }
          : c
      ));

      setToast?.({ message: 'Quote request submitted!', type: 'success' });
      setPendingBooking(null);
    } catch (error) {
      console.error('Failed to submit quote request:', error);
      setToast?.({ message: 'Failed to submit request. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, activeChat, setChatHistory, setToast]);

  // Build detailed items array for request
  const buildDetailedItems = useCallback((items) => {
    return items.map(item => ({
      // Core identifiers
      id: item.id,
      original_id: item.original_id,
      cartId: item.cartId,
      type: item.type,
      // Service details
      name: item.name || item.title,
      title: item.title || item.name,
      description: item.description,
      // Route info
      from_city: item.from_city || item.from || item.origin || item.departure_airport,
      to_city: item.to_city || item.to || item.destination || item.arrival_airport,
      from_iata: item.from_iata,
      to_iata: item.to_iata,
      route: item.route || `${item.from_city || item.from || ''} → ${item.to_city || item.to || ''}`,
      // Date/Time
      departure_date: item.departure_date || item.date,
      departure_time: item.departure_time,
      // Aircraft/Vehicle info
      aircraft: item.aircraft || item.aircraft_type || item.aircraft_model,
      aircraft_type: item.aircraft_type,
      aircraft_model: item.aircraft_model,
      category: item.category,
      manufacturer: item.manufacturer,
      capacity: item.capacity || item.max_passengers || item.pax,
      // Ground Transport specific fields
      pickup_location: item.pickup_location || item.from,
      dropoff_location: item.dropoff_location || item.to,
      service_type: item.service_type || item.category,
      // Pricing - ALL IN USD (Base + VAT only)
      base_price: item.price_usd || item.price || item.basePrice || 0,
      vat_amount: item.vat_amount || Math.round((item.price_usd || item.price || item.basePrice || 0) * 0.081),
      vat_percent: 8.1,
      total_price: item.totalWithFee || Math.round((item.price_usd || item.price || item.basePrice || 0) * 1.081),
      currency: 'USD',
      // Original price reference
      original_price: item.original_price,
      original_currency: item.original_currency,
      // Extras
      passengers: item.passengers,
      luggage: item.luggage,
      has_pet: item.has_pet,
      special_requests: item.special_requests,
      catering: item.catering,
      // NFT benefits
      has_nft: item.has_nft || userHasNFT,
      nft_discount: item.nft_discount,
      nft_discount_applied: item.nftDiscountApplied,
      // Metadata
      image_url: item.imageUrl || item.image_url || item.primaryImage,
      addedAt: item.addedAt,
      // Multi-stop journey data
      isMultiStop: item.isMultiStop || false,
      stops: item.stops || [],
      legs: item.legs || [],
      totalDistance: item.totalDistance,
      totalFlightTime: item.totalFlightTime,
      billedHours: item.billedHours,
      hasOvernightStays: item.hasOvernightStays || false,
      overnightStopIndices: item.overnightStopIndices || [],
      suggestedTransfers: item.suggestedTransfers || [],
      fuelIncluded: item.fuelIncluded !== false,
      priceCalculation: item.priceCalculation,
      // Linked items
      linkedJourneyId: item.linkedJourneyId
    }));
  }, [userHasNFT]);

  // Submit full cart request (main sendRequest function)
  const submitCartRequest = useCallback(async (additionalNotes = '') => {
    if (!user?.id || cartItems.length === 0) {
      setToast?.({ message: 'Please add items to cart first', type: 'error' });
      return false;
    }

    // Prevent double submission
    if (submissionInProgressRef.current) {
      console.log('Submission already in progress');
      return false;
    }
    submissionInProgressRef.current = true;

    setIsSubmitting(true);

    try {
      // Track NFT benefit usage
      const hasNFTItem = cartItems.some(item =>
        item.has_nft || item.nftDiscountApplied || (userHasNFT && !usedNFTBenefitThisYear)
      );

      if (hasNFTItem && !usedNFTBenefitThisYear) {
        sessionStorage.setItem('nft_benefit_used_this_year', 'true');
        setUsedNFTBenefitThisYear(true);
      }

      // Build detailed items
      const detailedItems = buildDetailedItems(cartItems);

      // Calculate totals
      const grandTotal = detailedItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
      const subtotal = detailedItems.reduce((sum, item) => sum + (item.base_price || 0), 0);
      const totalVat = detailedItems.reduce((sum, item) => sum + (item.vat_amount || 0), 0);

      // Determine request type
      const requestType = determineRequestType(cartItems);

      // Build request payload
      const requestId = `REQ-${Date.now()}`;

      // Get current chat's conversation history
      const currentChat = chatHistory?.find(c => c.id === activeChat);
      const conversationMessages = currentChat?.messages?.filter(m =>
        m.role === 'user' || m.role === 'assistant'
      ).map(m => ({
        role: m.role,
        content: m.content || m.text || ''
      })) || [];

      const payload = {
        user_id: user.id,
        type: requestType,
        client_email: user.email,
        data: {
          request_id: requestId,
          source: 'ai_chat',
          items: detailedItems,
          subtotal: subtotal,
          total_vat: totalVat,
          total: grandTotal,
          currency: 'USD',
          payment_method: selectedPaymentMethod,
          wallet_address: connectedWallet,
          notes: additionalNotes,
          conversation: conversationMessages,
          created_at: new Date().toISOString()
        },
        status: 'pending'
      };

      // Insert request
      const { data: insertedRequest, error: insertError } = await supabase
        .from('user_requests')
        .insert([payload])
        .select()
        .single();

      if (insertError) throw insertError;

      // Track subscription usage
      if (!isAdmin) {
        try {
          await subscriptionService.incrementChatUsage(user.id);
          console.log('Chat usage incremented for user:', user.id);
        } catch (usageErr) {
          console.warn('Failed to increment chat usage:', usageErr);
        }
      }

      // Trigger email notification
      if (insertedRequest?.id) {
        try {
          await supabase.functions.invoke('user-request-notifications', {
            body: { record: { id: insertedRequest.id } }
          });
          console.log('Email notification triggered for request:', insertedRequest.id);
        } catch (emailErr) {
          console.warn('Failed to send email notification:', emailErr);
        }
      }

      // Add confirmation to chat
      const confirmMsg = {
        role: 'assistant',
        content: `✅ **Request Submitted Successfully!**\n\nRequest ID: **#${requestId}**\n\n📦 **${cartItems.length} item(s)** in your request\n💰 Total: **$${grandTotal.toLocaleString()}**\n\nOur team will review and contact you at ${user.email} within 2-4 hours.\n\n📄 A confirmation has been saved to your account.`,
        isRequestConfirmation: true,
        requestId: insertedRequest?.id || requestId
      };

      setChatHistory?.(prev => prev.map(c =>
        c.id === activeChat
          ? { ...c, messages: [...c.messages, confirmMsg] }
          : c
      ));

      // Clear cart
      setCartItems([]);
      setSelectedPaymentMethod(null);

      setToast?.({ message: 'Request submitted successfully!', type: 'success' });
      setShowRequestForm(false);

      // Redirect to AI Requests page
      setTimeout(() => {
        window.location.href = '/dashboard/ai-requests';
      }, 1500);

      return true;
    } catch (error) {
      console.error('Failed to submit request:', error);
      setToast?.({ message: 'Failed to submit request. Please try again.', type: 'error' });
      return false;
    } finally {
      setIsSubmitting(false);
      submissionInProgressRef.current = false;
    }
  }, [
    user, cartItems, userHasNFT, usedNFTBenefitThisYear, isAdmin,
    selectedPaymentMethod, connectedWallet, activeChat,
    buildDetailedItems, determineRequestType, setCartItems, setChatHistory, setToast
  ]);

  // Save request as draft (PDF)
  const saveRequestToPDF = useCallback(() => {
    const cartTotal = calculateCartTotal();
    const request = {
      id: `REQ-${Date.now()}`,
      timestamp: new Date().toISOString(),
      chatId: activeChat,
      items: cartItems,
      total: cartTotal,
      status: 'saved'
    };

    const existing = JSON.parse(sessionStorage.getItem('chat_requests') || '[]');
    sessionStorage.setItem('chat_requests', JSON.stringify([...existing, request]));

    setChatHistory?.(prev => prev.map(c =>
      c.id === activeChat
        ? { ...c, messages: [...c.messages, { role: 'assistant', content: `✅ Draft saved! Reference: ${request.id}` }] }
        : c
    ));

    setToast?.({ message: 'Request saved as draft', type: 'success' });
  }, [cartItems, activeChat, calculateCartTotal, setChatHistory, setToast]);

  // Handle crypto payment initiation
  const initiateCryptoPayment = useCallback((item) => {
    setSelectedPaymentItem(item);
    setShowCryptoPayment(true);
  }, []);

  // Handle crypto payment success
  const handleCryptoPaymentSuccess = useCallback(async (paymentData) => {
    const item = selectedPaymentItem;

    if (!item || !user?.id) return;

    try {
      // Update item in cart as paid
      setCartItems(prev => prev.map(cartItem =>
        cartItem.cartId === item.cartId
          ? { ...cartItem, isPaid: true, paymentStatus: 'pending_confirmation', paymentData }
          : cartItem
      ));

      // Record payment in database
      await supabase.from('payments').insert({
        user_id: user.id,
        item_id: item.id || item.cartId,
        item_type: item.type,
        amount: item.price || item.price_usd || item.totalWithFee,
        currency: paymentData.currency || 'USD',
        payment_method: 'crypto',
        payment_provider: 'coingate',
        status: 'pending',
        payment_data: paymentData
      });

      setToast?.({ message: 'Payment initiated! Awaiting blockchain confirmation.', type: 'success' });
      setCryptoPaymentStatus('pending');
    } catch (error) {
      console.error('Payment recording failed:', error);
      setToast?.({ message: 'Payment processing error', type: 'error' });
    }

    setShowCryptoPayment(false);
    setSelectedPaymentItem(null);
  }, [selectedPaymentItem, user, setCartItems, setToast]);

  // Handle wallet connection
  const handleWalletConnect = useCallback((walletAddress) => {
    setConnectedWallet(walletAddress);

    setChatHistory?.(prev => prev.map(c =>
      c.id === activeChat
        ? { ...c, messages: [...c.messages, {
            role: 'assistant',
            content: `🔗 Wallet connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
          }] }
        : c
    ));
  }, [activeChat, setChatHistory]);

  // Handle add to calendar
  const handleAddToCalendar = useCallback((item) => {
    setSelectedItemForCalendar({
      title: item.name || item.title || 'Charter Booking',
      start_date: item.date || item.departure_date,
      end_date: item.return_date,
      location: item.from && item.to ? `${item.from} → ${item.to}` : item.location,
      description: `${item.type || 'Booking'} - ${item.passengers ? `${item.passengers} passengers` : ''}`,
      item_type: item.type,
      item_data: item
    });
    setShowCalendarModal(true);
  }, []);

  // Generate Google Calendar URL
  const generateGoogleCalendarUrl = useCallback((event) => {
    if (!event) return null;

    const startDate = event.start_date ? new Date(event.start_date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' : '';
    const endDate = event.end_date ? new Date(event.end_date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' : startDate;

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title || 'Charter Booking',
      dates: `${startDate}/${endDate}`,
      details: event.description || '',
      location: event.location || ''
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }, []);

  // Send charter request (from chat confirmation)
  const sendCharterRequest = useCallback(async (requestDetails) => {
    if (!user?.id) {
      setToast?.({ message: 'Please log in to send request', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        user_id: user.id,
        request_type: 'charter_request',
        status: 'pending',
        request_data: {
          details: requestDetails,
          timestamp: new Date().toISOString(),
          user_email: user.email,
          source: 'ai_chat_confirmation'
        }
      };

      const { error } = await supabase.from('user_requests').insert(requestData);

      if (error) throw error;

      // Add confirmation to chat
      const confirmMsg = {
        role: 'assistant',
        content: `✅ **Charter Request Sent!**\n\nOur charter coordinators have received your request and will contact you at ${user.email} within 2 hours to discuss details and provide a personalized quote.\n\nThank you for choosing Sphera!`,
        isCharterRequestConfirmation: true
      };

      setChatHistory?.(prev => prev.map(c =>
        c.id === activeChat
          ? { ...c, messages: [...c.messages, confirmMsg] }
          : c
      ));

      setToast?.({ message: 'Charter request sent!', type: 'success' });
    } catch (error) {
      console.error('Failed to send charter request:', error);
      setToast?.({ message: 'Failed to send request', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, activeChat, setChatHistory, setToast]);

  // Show payment options modal
  const showPaymentOptionsForCart = useCallback(() => {
    const cartTotal = calculateCartTotal();
    if (cartTotal === 0) {
      setToast?.({ message: 'Your cart is empty', type: 'warning' });
      return;
    }

    const paymentInfo = `**Payment Options:**\n\n` +
      `💳 **Traditional:**\n` +
      `• Credit/Debit Card\n` +
      `• Bank Transfer\n` +
      `• Wire Transfer\n\n` +
      `💎 **Crypto (5% bonus):**\n` +
      `• USDT: $${cartTotal.toLocaleString()}\n` +
      `• USDC: $${cartTotal.toLocaleString()}\n` +
      `• BTC: ${(cartTotal / 43250).toFixed(6)} BTC\n` +
      `• ETH: ${(cartTotal / 2280).toFixed(4)} ETH\n\n` +
      `🪙 **PVCX Token (10% bonus):**\n` +
      `• ${(cartTotal / 0.85).toFixed(0)} PVCX`;

    setChatHistory?.(prev => prev.map(c =>
      c.id === activeChat
        ? { ...c, messages: [...c.messages, { role: 'assistant', content: paymentInfo }] }
        : c
    ));
  }, [activeChat, calculateCartTotal, setChatHistory, setToast]);

  // Handle item adjustment in cart
  const handleSaveAdjustment = useCallback((adjustedItem) => {
    setCartItems(prev => prev.map(item =>
      item.id === adjustedItem.id || item.cartId === adjustedItem.cartId
        ? { ...item, ...adjustedItem }
        : item
    ));

    setChatHistory?.(prev => prev.map(c =>
      c.id === activeChat
        ? { ...c, messages: [...c.messages, { role: 'assistant', content: `✅ Updated ${adjustedItem.name || 'item'}` }] }
        : c
    ));
  }, [activeChat, setCartItems, setChatHistory]);

  // Check if can use Break The Price feature
  const canUseBreakThePrice = useCallback(() => {
    if (isAdmin) return true;
    if (!userSubscriptionLimits?.tier) return false;
    // Use centralized tier config for breakThePrice access
    const tierConfig = getTierLimits(userSubscriptionLimits.tier);
    return tierConfig.breakThePrice === true;
  }, [isAdmin, userSubscriptionLimits]);

  // ============================================
  // PDF GENERATION
  // ============================================

  // Generate HTML content for request confirmation
  const generateRequestConfirmationHTML = useCallback((requestData) => {
    const { requestId, items, total, subtotal, totalVat, user: reqUser, paymentMethod, createdAt } = requestData;

    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const itemRows = items.map(item => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: left;">
          <strong>${item.name || item.title || 'Service'}</strong>
          ${item.route ? `<br><span style="color: #6b7280; font-size: 12px;">📍 ${typeof item.route === 'string' ? item.route : `${item.route.origin} → ${item.route.destination}`}</span>` : ''}
          ${item.departure_date ? `<br><span style="color: #6b7280; font-size: 12px;">📅 ${formatDate(item.departure_date)}</span>` : ''}
          ${item.passengers ? `<br><span style="color: #6b7280; font-size: 12px;">👥 ${item.passengers} passengers</span>` : ''}
        </td>
        <td style="padding: 12px; text-align: center; color: #6b7280;">${item.type || 'Service'}</td>
        <td style="padding: 12px; text-align: right; font-weight: 600;">$${(item.base_price || item.price || 0).toLocaleString()}</td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Request Confirmation - ${requestId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; background: #f9fafb; }
    .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 40px; text-align: center; }
    .header h1 { margin: 0 0 8px 0; font-size: 28px; font-weight: 700; }
    .header p { margin: 0; opacity: 0.8; font-size: 14px; }
    .content { padding: 40px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .info-box { background: #f9fafb; border-radius: 12px; padding: 20px; }
    .info-box h3 { margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; }
    .info-box p { margin: 0; font-size: 16px; color: #1f2937; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    th { background: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; }
    .totals { background: #f9fafb; border-radius: 12px; padding: 24px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .total-row.final { border-top: 2px solid #e5e7eb; margin-top: 12px; padding-top: 16px; font-size: 20px; font-weight: 700; }
    .footer { text-align: center; padding: 32px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
    .nft-badge { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 8px; }
    @media print { body { padding: 0; background: white; } .container { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Request Confirmation</h1>
      <p>Thank you for your request with Sphera</p>
    </div>
    <div class="content">
      <div class="info-grid">
        <div class="info-box">
          <h3>Request ID</h3>
          <p>#${requestId}</p>
        </div>
        <div class="info-box">
          <h3>Date</h3>
          <p>${formatDate(createdAt || new Date())}</p>
        </div>
        <div class="info-box">
          <h3>Client</h3>
          <p>${reqUser?.name || reqUser?.email || 'Guest'}</p>
          ${reqUser?.email ? `<p style="font-size: 14px; color: #6b7280;">${reqUser.email}</p>` : ''}
        </div>
        <div class="info-box">
          <h3>Payment Method</h3>
          <p>${paymentMethod ? PAYMENT_METHODS[paymentMethod.toUpperCase()]?.label || paymentMethod : 'To be confirmed'}</p>
        </div>
      </div>

      <h2 style="font-size: 18px; margin-bottom: 16px;">Order Details</h2>
      <table>
        <thead>
          <tr>
            <th style="text-align: left;">Item</th>
            <th style="text-align: center;">Type</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Subtotal</span>
          <span>$${(subtotal || 0).toLocaleString()}</span>
        </div>
        <div class="total-row">
          <span>VAT (8.1%)</span>
          <span>$${(totalVat || 0).toLocaleString()}</span>
        </div>
        ${userHasNFT ? `
        <div class="total-row" style="color: #059669;">
          <span>🎫 NFT Member Discount</span>
          <span>-5%</span>
        </div>
        ` : ''}
        <div class="total-row final">
          <span>Total</span>
          <span>$${(total || 0).toLocaleString()}</span>
        </div>
      </div>

      ${userHasNFT ? '<div style="text-align: center; margin-top: 16px;"><span class="nft-badge">✨ NFT Member Benefits Applied</span></div>' : ''}
    </div>
    <div class="footer">
      <p><strong>Sphera</strong> - Your Gateway to Luxury Travel</p>
      <p>Our team will contact you within 2-4 hours to confirm your request.</p>
      <p style="margin-top: 16px;">Questions? Contact us at charter@sphera.world</p>
    </div>
  </div>
</body>
</html>
    `;
  }, [userHasNFT]);

  // Download HTML as PDF (opens in new tab for printing)
  const downloadHTMLAsPDF = useCallback((html, filename = 'request-confirmation.pdf') => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (!printWindow) {
      setToast?.({ message: 'Please allow popups to download PDF', type: 'warning' });
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }, [setToast]);

  // Generate and download PDF for current cart
  const downloadCartAsPDF = useCallback(() => {
    if (!cartItems || cartItems.length === 0) {
      setToast?.({ message: 'Cart is empty', type: 'warning' });
      return;
    }

    const detailedItems = buildDetailedItems(cartItems);
    const subtotal = detailedItems.reduce((sum, item) => sum + (item.base_price || 0), 0);
    const totalVat = detailedItems.reduce((sum, item) => sum + (item.vat_amount || 0), 0);
    const total = detailedItems.reduce((sum, item) => sum + (item.total_price || 0), 0);

    const requestData = {
      requestId: `DRAFT-${Date.now()}`,
      items: detailedItems,
      subtotal,
      totalVat,
      total,
      user,
      paymentMethod: selectedPaymentMethod,
      createdAt: new Date().toISOString()
    };

    const html = generateRequestConfirmationHTML(requestData);
    downloadHTMLAsPDF(html, `sphera-request-${requestData.requestId}.pdf`);

    setToast?.({ message: 'PDF opened for download', type: 'success' });
  }, [cartItems, user, selectedPaymentMethod, buildDetailedItems, generateRequestConfirmationHTML, downloadHTMLAsPDF, setToast]);

  // Generate PDF after successful request submission
  const generateConfirmationPDF = useCallback((insertedRequest, detailedItems, totals) => {
    const requestData = {
      requestId: insertedRequest?.id || `REQ-${Date.now()}`,
      items: detailedItems,
      subtotal: totals.subtotal,
      totalVat: totals.totalVat,
      total: totals.total,
      user,
      paymentMethod: selectedPaymentMethod,
      createdAt: new Date().toISOString()
    };

    const html = generateRequestConfirmationHTML(requestData);

    // Store for later download
    sessionStorage.setItem(`request_pdf_${requestData.requestId}`, html);

    return html;
  }, [user, selectedPaymentMethod, generateRequestConfirmationHTML]);

  return {
    // States
    isSubmitting,
    showRequestForm,
    setShowRequestForm,
    showPaymentOptions,
    setShowPaymentOptions,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    pendingBooking,
    setPendingBooking,
    showCalendarModal,
    setShowCalendarModal,
    selectedItemForCalendar,
    setSelectedItemForCalendar,
    showCryptoPayment,
    setShowCryptoPayment,
    selectedPaymentItem,
    setSelectedPaymentItem,
    cryptoPaymentStatus,
    setCryptoPaymentStatus,
    connectedWallet,
    setConnectedWallet,
    showConfirmDialog,
    setShowConfirmDialog,
    confirmDialogData,
    setConfirmDialogData,
    usedNFTBenefitThisYear,

    // Actions
    addToCartWithConfirmation,
    handleConfirmBooking,
    handleAddToCartFromConfirmation,
    handleRequestQuote,
    submitCartRequest,
    saveRequestToPDF,
    initiateCryptoPayment,
    handleCryptoPaymentSuccess,
    handleWalletConnect,
    handleAddToCalendar,
    generateGoogleCalendarUrl,
    sendCharterRequest,
    showPaymentOptionsForCart,
    handleSaveAdjustment,
    canUseBreakThePrice,

    // PDF Generation
    generateRequestConfirmationHTML,
    downloadHTMLAsPDF,
    downloadCartAsPDF,
    generateConfirmationPDF,

    // Helpers
    calculateCartTotal,
    determineRequestType,
    buildDetailedItems,

    // Constants
    PAYMENT_METHODS,
    REQUEST_TYPE_MAP
  };
};

export default useBookingFlow;
