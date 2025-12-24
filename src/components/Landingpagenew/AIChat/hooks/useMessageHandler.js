/**
 * useMessageHandler Hook - COMPLETE MESSAGE HANDLING LOGIC
 *
 * Contains the full handleSendMessage implementation from original AIChat.jsx
 * Including all tool_use handling, streaming, error handling, and special flows
 */

import { useState, useCallback, useRef } from 'react';
import { claudeEdgeService } from '../../../../services/claudeEdgeService';
import { chatService } from '../../../../services/chatService';
import { subscriptionService } from '../../../../services/subscriptionService';
import { getSystemPrompt } from '../../../../lib/aiKnowledgeBase';
import { aiToolDefinitions, executeTool } from '../../../../services/aiTools';
import {
  checkServiceAccess,
  getMessageLimit,
  hasUnlimitedAccess
} from '../utils/constants';

// Debug: Check if aiToolDefinitions was imported correctly
console.log('📦 aiToolDefinitions imported:', aiToolDefinitions?.length || 0, 'tools');

export const useMessageHandler = ({
  user,
  isAdmin,
  chatHistory,
  setChatHistory,
  activeChat,
  setActiveChat,
  userProfile,
  setToast,
  setIsProcessing,
  setTypingMessageIndex,
  setShowSubscriptionBlocker,
  setSubscriptionBlockerReason,
  setChatLimitReached,
  setMessageCount,
  setMessageLimitReached,
  multiLegChatMode,
  setPendingLegData,
  cartItems,
  setCartItems
}) => {
  // Refs
  const toolResultsRef = useRef([]);

  // Process tool results into UI tabs
  const processToolResultsToTabs = useCallback((toolUse, toolResult) => {
    const tabs = [];

    if (toolResult.restriction) {
      return { tabs: [], hasRestriction: true, restriction: toolResult.restriction };
    }

    if (toolUse.name === 'searchEmptyLegs' && toolResult.results?.length > 0) {
      tabs.push({
        id: 'emptylegs',
        title: 'Empty Legs',
        count: toolResult.results.length,
        items: toolResult.results
      });
    } else if (toolUse.name === 'searchPrivateJets' && toolResult.results?.length > 0) {
      tabs.push({
        id: 'jets',
        title: toolResult.showingAlternatives ? 'Alternative Jets' : 'Private Jets',
        count: toolResult.results.length,
        items: toolResult.results,
        showingAlternatives: toolResult.showingAlternatives,
        requestedModel: toolResult.requestedModel,
        alternativeMessage: toolResult.alternativeMessage
      });
    } else if (toolUse.name === 'searchHelicopters' && toolResult.results?.length > 0) {
      tabs.push({
        id: 'helicopters',
        title: toolResult.showingAlternatives ? 'Alternative Helicopters' : 'Helicopters',
        count: toolResult.results.length,
        items: toolResult.results,
        showingAlternatives: toolResult.showingAlternatives,
        requestedModel: toolResult.requestedModel,
        alternativeMessage: toolResult.alternativeMessage
      });
    } else if (toolUse.name === 'searchLuxuryCars' && toolResult.results?.length > 0) {
      tabs.push({
        id: 'luxury_cars',
        title: 'Luxury Cars',
        count: toolResult.results.length,
        items: toolResult.results
      });
    } else if (toolUse.name === 'searchWines' && toolResult.results?.length > 0) {
      tabs.push({
        id: 'wines',
        title: 'Wines',
        count: toolResult.results.length,
        items: toolResult.results
      });
    } else if (toolUse.name === 'searchDelicatesse' && toolResult.results?.length > 0) {
      tabs.push({
        id: 'delicatesse',
        title: 'Delicacies',
        count: toolResult.results.length,
        items: toolResult.results
      });
    } else if (toolUse.name === 'searchCigars' && toolResult.results?.length > 0) {
      tabs.push({
        id: 'cigars',
        title: 'Premium Cigars',
        count: toolResult.results.length,
        items: toolResult.results
      });
    }

    return { tabs, hasRestriction: false };
  }, []);

  // Handle addToCart tool result
  const handleAddToCartTool = useCallback((toolResult, workingChatId) => {
    const item = toolResult.cartItem;
    const display = toolResult.displayInfo || {};

    // Determine icon based on type
    const isHelicopter = item.type === 'helicopters' || item.type === 'helicopter';
    const icon = isHelicopter ? '🚁' : '✈️';

    // Build content with all available info including price
    let content = `Ready to proceed with your booking:\n\n${icon} **${item.name}**`;

    if (item.from && item.to) {
      content += `\n📍 ${item.from} → ${item.to}`;
    }
    if (item.flightDuration || display.flightDuration) {
      content += `\n⏱️ Est. Flight: ${item.flightDuration || display.flightDuration}`;
    }
    if (item.date) {
      content += `\n📅 ${item.date}${item.time ? ` at ${item.time}` : ''}`;
    }
    if (item.passengers) {
      content += `\n👥 ${item.passengers} passengers`;
    }
    // Show estimated price with calculation
    if (item.price && item.price > 0) {
      content += `\n💵 **Est. Total: €${item.price.toLocaleString()}**`;
      if (item.priceCalculation || display.priceCalculation) {
        content += ` (${item.priceCalculation || display.priceCalculation})`;
      }
    } else if (item.hourlyRate && item.hourlyRate > 0) {
      content += `\n💰 Rate: €${item.hourlyRate.toLocaleString()}/hr`;
    }
    if (item.catering) {
      content += `\n🥤 ${item.catering === 'complimentary' ? 'Complimentary refreshments' : item.catering}`;
    }
    // Show special notes/requests
    if (item.notes) {
      content += `\n📝 ${item.notes}`;
    }

    content += '\n\nChoose how you\'d like to proceed:';
    content += '\n\n*Tip: Use the **+ Add Extras** button in your cart to add wine, champagne, catering, or other services.*';

    const confirmMessage = {
      role: 'assistant',
      content,
      action: 'confirm_booking',
      bookingData: item
    };

    setChatHistory(prev => prev.map(c =>
      c.id === workingChatId
        ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), confirmMessage] }
        : c
    ));
    return true; // Signal to exit early
  }, [setChatHistory]);

  // Handle addCustomExtra tool result
  const handleAddCustomExtraTool = useCallback((toolResult, workingChatId) => {
    const confirmMessage = {
      role: 'assistant',
      content: `Ready to add this custom item:\n\n🍷 **${toolResult.cartItem.name}**\n📦 Category: ${toolResult.cartItem.category}\n💰 Est. Price: $${(toolResult.cartItem.price || 0).toLocaleString()}\n${toolResult.cartItem.quantity > 1 ? `📊 Quantity: ${toolResult.cartItem.quantity}\n` : ''}\nChoose how you'd like to proceed:`,
      action: 'confirm_booking',
      bookingData: toolResult.cartItem
    };

    setChatHistory(prev => prev.map(c =>
      c.id === workingChatId
        ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), confirmMessage] }
        : c
    ));
    return true;
  }, [setChatHistory]);

  // Handle lookupLuxuryItem tool result
  const handleLookupLuxuryItemTool = useCallback((toolResult, workingChatId) => {
    const item = toolResult.item || {};
    const categoryEmoji = {
      wine: '🍷', champagne: '🥂', spirits: '🥃', caviar: '🐟',
      cigars: '🚬', flowers: '💐', cake: '🎂', decorations: '🎊',
      music: '🎵', photography: '📸', catering: '🍽️', other: '✨'
    };
    const emoji = categoryEmoji[item.category] || '✨';

    const confirmMessage = {
      role: 'assistant',
      content: `Found: **${item.name}**\n\n${emoji} Category: ${item.category?.charAt(0).toUpperCase() + item.category?.slice(1)}\n💰 Est. Price: ${item.unitPriceFormatted || `$${(item.unitPrice || 0).toLocaleString()}`}${item.quantity > 1 ? ` × ${item.quantity} = ${item.totalPriceFormatted}` : ''}\n${toolResult.availability?.status === 'requires_confirmation' ? '\n⏳ Availability requires confirmation by our team' : ''}\n\nWould you like to add this to your cart?`,
      action: 'confirm_booking',
      bookingData: toolResult.cartItem
    };

    setChatHistory(prev => prev.map(c =>
      c.id === workingChatId
        ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), confirmMessage] }
        : c
    ));
    return true;
  }, [setChatHistory]);

  // Handle lookupPlaceAddress tool result
  const handleLookupPlaceTool = useCallback(async (toolResult, toolUse, workingChatId, claudeMessages, systemPrompt, response) => {
    const placeMessage = {
      role: 'place',
      content: toolResult.message || `Found ${toolResult.place.name}`,
      place: toolResult.place,
      alternatives: toolResult.alternatives || [],
      canArrangeTransfer: toolResult.canArrangeTransfer
    };

    setChatHistory(prev => prev.map(c =>
      c.id === workingChatId
        ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), placeMessage] }
        : c
    ));

    // Get AI follow-up with summarized version
    const placeSummary = {
      success: true,
      place: {
        name: toolResult.place.name,
        fullAddress: toolResult.place.fullAddress,
        category: toolResult.place.category,
        rating: toolResult.place.rating,
        reviewCount: toolResult.place.reviewCount,
        priceLevel: toolResult.place.priceLevel,
        phone: toolResult.place.phone,
        website: toolResult.place.website ? 'Available' : null,
        openNow: toolResult.place.openingHours?.openNow
      },
      canArrangeTransfer: toolResult.canArrangeTransfer
    };

    try {
      const placeFollowUp = await claudeEdgeService.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
        messages: [
          ...claudeMessages,
          { role: 'assistant', content: response.content },
          { role: 'user', content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(placeSummary) }] }
        ]
      });

      const placeAiText = placeFollowUp.content.find(block => block.type === 'text')?.text;
      if (placeAiText) {
        setChatHistory(prev => prev.map(c =>
          c.id === workingChatId
            ? { ...c, messages: [...c.messages, { role: 'assistant', content: placeAiText }] }
            : c
        ));
      }
    } catch (followUpError) {
      console.warn('Place follow-up failed:', followUpError);
    }

    return true;
  }, [setChatHistory]);

  // Handle searchHotels tool result
  const handleSearchHotelsTool = useCallback(async (toolResult, toolUse, workingChatId, claudeMessages, systemPrompt, response) => {
    const hotelMessage = {
      role: 'hotels',
      content: toolResult.message || `Found ${toolResult.results.length} hotels in ${toolResult.city}`,
      hotels: toolResult.results,
      city: toolResult.city,
      params: toolResult.params,
      isDemo: toolResult.isDemo
    };

    setChatHistory(prev => prev.map(c =>
      c.id === workingChatId
        ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), hotelMessage] }
        : c
    ));

    // Get AI follow-up
    const hotelSummary = {
      success: true,
      city: toolResult.city,
      hotelCount: toolResult.results.length,
      hotels: toolResult.results.slice(0, 3).map(h => ({
        name: h.hotel?.name,
        rating: h.hotel?.rating,
        starRating: h.hotel?.starRating,
        minRate: h.totalRate || h.hotel?.minRate,
        amenities: h.hotel?.amenities?.slice(0, 4)
      }))
    };

    try {
      const hotelFollowUp = await claudeEdgeService.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
        messages: [
          ...claudeMessages,
          { role: 'assistant', content: response.content },
          { role: 'user', content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(hotelSummary) }] }
        ]
      });

      const hotelAiText = hotelFollowUp.content.find(block => block.type === 'text')?.text;
      if (hotelAiText) {
        setChatHistory(prev => prev.map(c =>
          c.id === workingChatId
            ? { ...c, messages: [...c.messages, { role: 'assistant', content: hotelAiText }] }
            : c
        ));
      }
    } catch (followUpError) {
      console.warn('Hotel follow-up failed:', followUpError);
    }

    return true;
  }, [setChatHistory]);

  // Handle addHotelToCart tool result
  const handleAddHotelToCartTool = useCallback((toolResult, workingChatId) => {
    if (toolResult.cartItem && setCartItems) {
      setCartItems(prev => [...prev, toolResult.cartItem]);
    }

    const confirmMessage = {
      role: 'confirm_booking',
      content: toolResult.additionalServicesPrompt || toolResult.message,
      bookingType: 'hotel_booking',
      bookingData: toolResult.cartItem,
      displayInfo: toolResult.displayInfo
    };

    setChatHistory(prev => prev.map(c =>
      c.id === workingChatId
        ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), confirmMessage] }
        : c
    ));
    return true;
  }, [setChatHistory, setCartItems]);

  // Handle Multi-Leg Chat Mode
  const handleMultiLegChatMode = useCallback((message, workingChatId) => {
    const cityPattern = /(?:from\s+)?(\w+(?:\s+\w+)?)\s*(?:to|→|->)\s*(\w+(?:\s+\w+)?)|(?:to\s+)?(\w+(?:\s+\w+)?)/i;
    const datePattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]?\d{0,4}|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*(?:\s+\d{2,4})?)/i;
    const timePattern = /(\d{1,2}[:\.]?\d{0,2}\s*(?:am|pm)?|\d{2}:\d{2})/i;

    const cityMatch = message.match(cityPattern);
    const dateMatch = message.match(datePattern);
    const timeMatch = message.match(timePattern);

    if (cityMatch) {
      const parsedCity = cityMatch[2] || cityMatch[3] || cityMatch[1];
      const parsedDate = dateMatch ? dateMatch[1] : null;
      const parsedTime = timeMatch ? timeMatch[1] : null;

      // Add loading message
      setChatHistory(prev => prev.map(c =>
        c.id === workingChatId
          ? { ...c, messages: [...c.messages, { role: 'assistant', content: '...', isLoading: true }] }
          : c
      ));

      setTimeout(() => {
        const newLegData = {
          city: parsedCity?.trim(),
          code: parsedCity?.substring(0, 3).toUpperCase(),
          date: parsedDate || 'TBD',
          time: parsedTime || 'TBD',
          stopDuration: 0
        };

        setPendingLegData(newLegData);

        const confirmContent = `Got it! Here's what I understood:

**Destination:** ${newLegData.city} (${newLegData.code})
**Date:** ${newLegData.date}
**Time:** ${newLegData.time}

Click **"Add to Route"** to confirm this stop, or provide corrections.`;

        const responseMsg = {
          role: 'assistant',
          content: confirmContent,
          isMultiLegChat: true,
          pendingLeg: newLegData
        };

        setChatHistory(prev => prev.map(c =>
          c.id === workingChatId
            ? { ...c, messages: c.messages.map((m, i) => i === c.messages.length - 1 && m.isLoading ? responseMsg : m) }
            : c
        ));
        setIsProcessing(false);
      }, 600);
      return true;
    }
    return false;
  }, [setChatHistory, setPendingLegData, setIsProcessing]);

  // Check for confirmation requests
  const checkForConfirmation = useCallback((message, existingChat) => {
    const lowerMessage = message.toLowerCase().trim();
    const isConfirmation = /^(confirm|send it|yes send|submit|book it|go ahead|yes please|ja|bestätigen|abschicken)$/i.test(lowerMessage);

    const recentMessages = existingChat?.messages?.slice(-5) || [];
    const hasCharterRequestContext = recentMessages.some(m =>
      m.role === 'assistant' &&
      (m.content?.includes('custom charter request') ||
       m.content?.includes('booking request') ||
       (m.content?.includes('Route:') && m.content?.includes('Date:') && m.content?.includes('Passengers:')))
    );

    return isConfirmation && hasCharterRequestContext;
  }, []);

  // Main handleSendMessage function
  const handleSendMessage = useCallback(async (message) => {
    if (!message?.trim()) return;

    const trimmedMessage = message.trim();
    console.log('📤 handleSendMessage:', trimmedMessage);

    const existingChat = chatHistory.find(c => c.id === activeChat);
    const isFirstUserMessage = existingChat && existingChat.messages?.length <= 1;
    let workingChatId = activeChat;

    // Check subscription limits for new chats
    // IMPORTANT: Handle both 'new' and null/undefined as new chat indicators
    const isNewChat = !activeChat || activeChat === 'new' || activeChat === 'null';

    // MESSAGE LIMIT CHECK - Enforce per-chat message limits based on subscription tier
    // Only check for existing chats (not new chats)
    if (!isAdmin && !isNewChat && existingChat) {
      const currentMsgCount = existingChat.messages?.filter(m => m.role === 'user').length || 0;
      const tier = userProfile?.subscription_tier;

      // Get message limit from centralized helpers
      const tierMessageLimit = hasUnlimitedAccess(tier) ? Infinity : getMessageLimit(tier);

      if (currentMsgCount >= tierMessageLimit) {
        setMessageLimitReached(true);
        // Add message explaining the limit
        const travellerLimit = getMessageLimit('traveller');
        const limitMessage = {
          role: 'assistant',
          content: `You've reached the message limit for this chat (${tierMessageLimit} messages).\n\n${!tier || tier.toLowerCase() === 'explorer' ? `Upgrade to Traveller for ${travellerLimit} messages per chat, or Elite for unlimited messages.` : 'Upgrade to Elite for unlimited messages per chat.'}`
        };
        setChatHistory(prev => prev.map(c =>
          c.id === activeChat
            ? { ...c, messages: [...c.messages, limitMessage] }
            : c
        ));
        // Show subscription blocker popup
        setSubscriptionBlockerReason('message_limit');
        setShowSubscriptionBlocker(true);
        setIsProcessing(false);
        return;
      }
      setMessageCount(currentMsgCount + 1);
    }

    // FEATURE RESTRICTION CHECK - Check if user is requesting a service requiring higher tier
    const currentTier = userProfile?.subscription_tier || null;
    const serviceAccessCheck = checkServiceAccess(trimmedMessage, currentTier);

    if (!serviceAccessCheck.hasAccess && !isAdmin) {
      const tierDisplayName = serviceAccessCheck.requiredTier === 'elite' ? 'Elite Club' : 'Traveller';

      // Add user message to chat
      const userMessage = { role: 'user', content: trimmedMessage };
      setChatHistory(prev => prev.map(c =>
        c.id === activeChat
          ? { ...c, messages: [...c.messages, userMessage] }
          : c
      ));

      // Add assistant response explaining the upgrade requirement
      setTimeout(() => {
        const upgradeMessage = {
          role: 'assistant',
          content: `I'd love to help you with **${serviceAccessCheck.displayName}**, but this premium service requires a **${tierDisplayName}** subscription or higher.\n\nYour current plan: **${currentTier ? currentTier.charAt(0).toUpperCase() + currentTier.slice(1) : 'None'}**\n\nUpgrade now to unlock:\n• ${serviceAccessCheck.displayName}\n• ${serviceAccessCheck.requiredTier === 'elite' ? 'Unlimited chats & messages' : 'More chats & messages'}\n• Priority support`
        };

        setChatHistory(prev => prev.map(c =>
          c.id === activeChat
            ? { ...c, messages: [...c.messages, upgradeMessage] }
            : c
        ));

        setSubscriptionBlockerReason('feature_restricted');
        setShowSubscriptionBlocker(true);
      }, 500);

      setIsProcessing(false);
      return;
    }

    if (isNewChat) {
      if (user?.id && !isAdmin) {
        try {
          const { canStart, chatsUsed, chatsLimit } = await subscriptionService.canStartNewChat(user.id);
          if (!canStart) {
            setChatLimitReached(true);
            setSubscriptionBlockerReason('chat_limit');
            setShowSubscriptionBlocker(true);
            setIsProcessing(false);
            return;
          }
        } catch (error) {
          console.warn('Failed to check chat limit:', error);
        }
      }

      setMessageCount(0);
      setMessageLimitReached(false);

      const title = chatService.generateTitle({ content: trimmedMessage });
      const userMessage = { role: 'user', content: trimmedMessage };

      try {
        const { success, chat } = await chatService.createChat(user.id, title, userMessage);

        if (success && chat) {
          workingChatId = chat.id;

          if (!isAdmin) {
            try {
              await subscriptionService.incrementChatUsage(user.id);
              await subscriptionService.createChatSession(user.id, chat.id);
            } catch (usageError) {
              console.warn('Failed to update chat usage:', usageError);
            }
          }

          const loadingMsg = { role: 'assistant', content: '...', isLoading: true };
          const newChat = {
            id: chat.id,
            title: chat.title,
            date: 'Just now',
            messages: [userMessage, loadingMsg]
          };

          setChatHistory(prev => {
            if (prev.find(c => c.id === chat.id)) return prev;
            return [newChat, ...prev];
          });
          setActiveChat(chat.id);
        } else {
          throw new Error('Chat creation returned false');
        }
      } catch (error) {
        console.error('Database error, creating temp chat:', error);
        workingChatId = `temp-${Date.now()}`;
        const tempChat = {
          id: workingChatId,
          title: title,
          date: 'Just now',
          messages: [{ role: 'user', content: trimmedMessage }, { role: 'assistant', content: '...', isLoading: true }]
        };
        setChatHistory(prev => [tempChat, ...prev]);
        setActiveChat(workingChatId);
        setToast({ message: 'Using offline mode', type: 'warning' });
      }
    } else {
      const userMessage = { role: 'user', content: trimmedMessage };
      const loadingMsg = { role: 'assistant', content: '...', isLoading: true };
      setChatHistory(prev => prev.map(c =>
        c.id === activeChat
          ? { ...c, messages: [...c.messages, userMessage, loadingMsg] }
          : c
      ));

      if (existingChat) {
        await chatService.updateChatMessages(activeChat, [...existingChat.messages, userMessage], user.id);
      }
    }

    // SAFEGUARD: Ensure workingChatId is never null/undefined before proceeding
    if (!workingChatId || workingChatId === 'new' || workingChatId === 'null') {
      console.error('❌ workingChatId is invalid after chat setup, creating temp chat');
      workingChatId = `temp-${Date.now()}`;
      const tempChat = {
        id: workingChatId,
        title: chatService.generateTitle({ content: trimmedMessage }),
        date: 'Just now',
        messages: [{ role: 'user', content: trimmedMessage }, { role: 'assistant', content: '...', isLoading: true }]
      };
      setChatHistory(prev => [tempChat, ...prev]);
      setActiveChat(workingChatId);
    }

    setIsProcessing(true);

    // Check for confirmation requests
    if (checkForConfirmation(trimmedMessage, existingChat)) {
      const lastAssistantMsg = [...(existingChat?.messages || [])].reverse().find(m => m.role === 'assistant');
      const confirmationMsg = {
        role: 'assistant',
        content: '✅ Perfect! Click the button below to submit your charter request:',
        action: 'send_charter_request',
        requestDetails: lastAssistantMsg?.content || ''
      };

      setChatHistory(prev => prev.map(c =>
        c.id === workingChatId
          ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), confirmationMsg] }
          : c
      ));
      setIsProcessing(false);
      return;
    }

    // Handle Multi-Leg Chat Mode
    if (multiLegChatMode) {
      const handled = handleMultiLegChatMode(trimmedMessage, workingChatId);
      if (handled) return;
    }

    // YACHT REDIRECT
    const lowerMessage = trimmedMessage.toLowerCase();
    if (lowerMessage.match(/yacht|boat|vessel|sailing|catamaran|superyacht/) && !lowerMessage.match(/luxury\s*car/)) {
      const yachtRedirectMessage = `For yacht charters, please contact our dedicated charter team directly:

📧 **bookings@privatecharterx.com**

They will personally arrange your perfect yacht experience with custom itineraries, crew selection, and all amenities tailored to your preferences.

*AI-assisted yacht charter bookings coming Q1/2026*`;

      setChatHistory(prev => prev.map(c =>
        c.id === workingChatId
          ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), { role: 'assistant', content: yachtRedirectMessage }] }
          : c
      ));
      setIsProcessing(false);
      return;
    }

    // Build conversation history
    const currentChatObj = chatHistory.find(c => c.id === workingChatId) || existingChat;
    const conversationHistory = currentChatObj
      ? [...currentChatObj.messages.filter(msg => !msg.isLoading), { role: 'user', content: trimmedMessage }]
      : [{ role: 'user', content: trimmedMessage }];

    try {
      const systemPrompt = getSystemPrompt(userProfile?.subscription_tier);

      // ═══════════════════════════════════════════════════════════════════════════
      // FORCED TOOL DETECTION - Force specific tools for certain keywords
      // ═══════════════════════════════════════════════════════════════════════════
      let forcedTool = null;
      let forcedToolMessage = '';

      // MEDEVAC - Do NOT force tool. Let Claude collect patient info first, then call tool.

      // WINE/CHAMPAGNE - Force searchWines tool
      if (lowerMessage.match(/\bwine\b|champagne|bordeaux|burgundy|sommelier|krug|dom\s*p[eé]rignon|cristal|petrus|margaux|mouton|lafite|latour/i)) {
        forcedTool = 'searchWines';
        forcedToolMessage = '\n\n🍷 WINE REQUEST - You MUST call searchWines tool immediately.';
        console.log('🍷 Forcing searchWines tool for:', trimmedMessage);
      }

      // DELICACIES/FOOD - Force searchDelicatesse tool
      if (lowerMessage.match(/caviar|truffle|foie\s*gras|delicatesse|delicacy|delicacies|gourmet|beluga|ossetra/i)) {
        forcedTool = 'searchDelicatesse';
        forcedToolMessage = '\n\n🍽️ DELICACY REQUEST - You MUST call searchDelicatesse tool immediately.';
        console.log('🍽️ Forcing searchDelicatesse tool for:', trimmedMessage);
      }

      // CIGARS - Force searchCigars tool
      if (lowerMessage.match(/\bcigar\b|\bcigars\b|cohiba|montecristo|partagas|davidoff|romeo\s*y\s*julieta/i)) {
        forcedTool = 'searchCigars';
        forcedToolMessage = '\n\n🚬 CIGAR REQUEST - You MUST call searchCigars tool immediately.';
        console.log('🚬 Forcing searchCigars tool for:', trimmedMessage);
      }

      // Filter to valid Claude roles (only 'user' and 'assistant' are valid for Claude API)
      const uiOnlyRoles = ['results', 'place', 'hotels', 'adventures', 'confirm_booking', 'loading', 'medevac_request', 'visa_request'];
      const claudeMessages = conversationHistory
        .filter(msg => !uiOnlyRoles.includes(msg.role) && !msg.isLoading)
        .map(msg => ({ role: msg.role, content: msg.content }));

      // Prepare tools with cache control on last item
      const toolsWithCache = aiToolDefinitions?.map((tool, index) =>
        index === aiToolDefinitions.length - 1
          ? { ...tool, cache_control: { type: "ephemeral" } }
          : tool
      ) || [];

      console.log('🔧 Tools count:', toolsWithCache.length, 'Tool names:', toolsWithCache.map(t => t.name));

      const response = await claudeEdgeService.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: [{ type: "text", text: systemPrompt + forcedToolMessage, cache_control: { type: "ephemeral" } }],
        messages: claudeMessages,
        tools: toolsWithCache,
        tool_choice: forcedTool
          ? { type: "tool", name: forcedTool }
          : { type: "auto" }
      });

      console.log('🤖 Claude response:', response);

      if (response.stop_reason === 'tool_use') {
        // Check for initial text before tool call
        // BUT: If a tool was FORCED, suppress the text - user wants results, not descriptions
        const textBlock = response.content.find(block => block.type === 'text');
        if (textBlock?.text?.trim() && !forcedTool) {
          // Only show text if NO tool was forced (natural conversation)
          const initialMessage = { role: 'assistant', content: textBlock.text };
          setChatHistory(prev => prev.map(c =>
            c.id === workingChatId
              ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), initialMessage] }
              : c
          ));
          await chatService.updateChatMessages(workingChatId, [...conversationHistory, initialMessage], user.id);
        } else if (forcedTool) {
          console.log('🔇 Suppressing AI text - tool was forced:', forcedTool);
          // DON'T remove loading here - keep it until we have actual content to show
          // The loading will be removed when results or AI message is added
        }

        const toolUse = response.content.find(block => block.type === 'tool_use');
        if (toolUse) {
          console.log('🔧 Tool used:', toolUse.name, toolUse.input);
          const toolResult = await executeTool(toolUse.name, toolUse.input);
          console.log('📊 Tool result:', toolResult);

          if (toolResult.success) {
            // Handle specific tool types
            if (toolUse.name === 'addToCart' && toolResult.action === 'ADD_TO_CART' && toolResult.cartItem) {
              if (handleAddToCartTool(toolResult, workingChatId)) {
                setIsProcessing(false);
                return;
              }
            }

            if (toolUse.name === 'addCustomExtra' && toolResult.cartItem) {
              if (handleAddCustomExtraTool(toolResult, workingChatId)) {
                setIsProcessing(false);
                return;
              }
            }

            if (toolUse.name === 'lookupLuxuryItem' && toolResult.cartItem) {
              if (handleLookupLuxuryItemTool(toolResult, workingChatId)) {
                setIsProcessing(false);
                return;
              }
            }

            if (toolUse.name === 'lookupPlaceAddress' && toolResult.place) {
              await handleLookupPlaceTool(toolResult, toolUse, workingChatId, claudeMessages, systemPrompt, response);
              setIsProcessing(false);
              return;
            }

            if (toolUse.name === 'searchHotels' && toolResult.results?.length > 0) {
              await handleSearchHotelsTool(toolResult, toolUse, workingChatId, claudeMessages, systemPrompt, response);
              setIsProcessing(false);
              return;
            }

            if (toolUse.name === 'addHotelToCart' && toolResult.success) {
              if (handleAddHotelToCartTool(toolResult, workingChatId)) {
                setIsProcessing(false);
                return;
              }
            }

            // Handle MEDEVAC request - show card with Add to Cart button
            if (toolUse.name === 'createMedevacRequest' && toolResult.action === 'SHOW_MEDEVAC_REQUEST' && toolResult.medevacRequest) {
              console.log('🚨 MEDEVAC Request created:', toolResult.medevacRequest);

              // UI-only message for displaying the card
              const medevacMessage = {
                role: 'medevac_request',
                content: toolResult.message || 'Medical evacuation request prepared',
                medevacRequest: toolResult.medevacRequest,
                urgencyInfo: toolResult.urgencyInfo,
                displayMessage: toolResult.displayMessage
              };

              // Also add an assistant message for conversation context (so Claude knows what happened)
              const assistantContextMessage = {
                role: 'assistant',
                content: `I've prepared your medical evacuation request from ${toolResult.medevacRequest.route?.origin || 'origin'} to ${toolResult.medevacRequest.route?.destination || 'destination'}. The request card is displayed above - you can review the details and add it to your cart when ready. Is there anything else you need, such as ground transport or additional assistance?`
              };

              setChatHistory(prev => prev.map(c =>
                c.id === workingChatId
                  ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), medevacMessage, assistantContextMessage] }
                  : c
              ));

              await chatService.updateChatMessages(workingChatId, [...conversationHistory, medevacMessage, assistantContextMessage], user.id);
              setIsProcessing(false);
              return;
            }

            // Handle VISA request - show card with Add to Cart button
            if (toolUse.name === 'createVisaRequest' && toolResult.action === 'SHOW_VISA_REQUEST' && toolResult.visaRequest) {
              console.log('🛂 Visa Request created:', toolResult.visaRequest);

              // UI-only message for displaying the card
              const visaMessage = {
                role: 'visa_request',
                content: toolResult.message || 'Express visa request prepared',
                visaRequest: toolResult.visaRequest,
                displayMessage: toolResult.displayMessage
              };

              // Also add an assistant message for conversation context
              const assistantContextMessage = {
                role: 'assistant',
                content: `I've prepared your express visa request for ${toolResult.visaRequest.destination || 'your destination'}. The request card is displayed above - you can review the details and add it to your cart when ready. Is there anything else you need?`
              };

              setChatHistory(prev => prev.map(c =>
                c.id === workingChatId
                  ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), visaMessage, assistantContextMessage] }
                  : c
              ));

              await chatService.updateChatMessages(workingChatId, [...conversationHistory, visaMessage, assistantContextMessage], user.id);
              setIsProcessing(false);
              return;
            }

            // Process search results into tabs
            const { tabs, hasRestriction } = processToolResultsToTabs(toolUse, toolResult);

            if (tabs.length > 0) {
              const resultsMessage = {
                role: 'results',
                content: JSON.stringify({ tabs }),
                tabs: tabs
              };

              // Filter out loading message when adding results
              setChatHistory(prev => prev.map(c =>
                c.id === workingChatId
                  ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), resultsMessage] }
                  : c
              ));

              await chatService.updateChatMessages(workingChatId, [...conversationHistory, resultsMessage], user.id);
            }
          }

          // Get AI follow-up response (include tools so AI can chain tool calls)
          const followUp = await claudeEdgeService.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
            messages: [
              ...claudeMessages,
              { role: 'assistant', content: response.content },
              { role: 'user', content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(toolResult) }] }
            ],
            tools: toolsWithCache,
            tool_choice: { type: "auto" }
          });

          const aiText = followUp.content.find(block => block.type === 'text')?.text || 'Found results!';
          const aiMessage = { role: 'assistant', content: aiText };

          // Calculate the new message index BEFORE updating state
          const currentChat = chatHistory.find(c => c.id === workingChatId);
          const filteredMessages = currentChat?.messages?.filter(m => !m.isLoading) || [];
          const newMessageIndex = filteredMessages.length; // This will be the index of the new message

          // Set typing index FIRST, then add the message
          setTypingMessageIndex(newMessageIndex);

          setChatHistory(prev => prev.map(c =>
            c.id === workingChatId
              ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), aiMessage] }
              : c
          ));

          await chatService.updateChatMessages(workingChatId, [...conversationHistory, aiMessage], user.id);
        }
      } else {
        // Regular text response
        const textBlock = response.content.find(block => block.type === 'text');
        const aiMessage = { role: 'assistant', content: textBlock?.text || 'How can I help?' };

        // Calculate the new message index BEFORE updating state
        const currentChat = chatHistory.find(c => c.id === workingChatId);
        const filteredMessages = currentChat?.messages?.filter(m => !m.isLoading) || [];
        const newMessageIndex = filteredMessages.length; // This will be the index of the new message

        // Set typing index FIRST, then add the message
        setTypingMessageIndex(newMessageIndex);

        setChatHistory(prev => prev.map(c =>
          c.id === workingChatId
            ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), aiMessage] }
            : c
        ));

        await chatService.updateChatMessages(workingChatId, [...conversationHistory, aiMessage], user.id);
      }
    } catch (error) {
      console.error('❌ AI service error:', error);
      // Remove loading message and show error in chat
      setChatHistory(prev => prev.map(c =>
        c.id === workingChatId
          ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), { role: 'assistant', content: 'Sorry, I encountered an error. Please try again or open a new chat.' }] }
          : c
      ));
      setToast({ message: 'Error - please try again', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  }, [
    user, isAdmin, chatHistory, setChatHistory, activeChat, setActiveChat,
    userProfile, setToast, setIsProcessing, setTypingMessageIndex,
    setShowSubscriptionBlocker, setSubscriptionBlockerReason, setChatLimitReached,
    setMessageCount, setMessageLimitReached, multiLegChatMode, setPendingLegData,
    checkForConfirmation, handleMultiLegChatMode, processToolResultsToTabs,
    handleAddToCartTool, handleAddCustomExtraTool, handleLookupLuxuryItemTool,
    handleLookupPlaceTool, handleSearchHotelsTool, handleAddHotelToCartTool, setCartItems
  ]);

  return {
    handleSendMessage,
    processToolResultsToTabs
  };
};

export default useMessageHandler;
