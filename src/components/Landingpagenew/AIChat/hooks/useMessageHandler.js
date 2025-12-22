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
  setCart
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
    const confirmMessage = {
      role: 'assistant',
      content: `Ready to proceed with your booking:\n\n✈️ **${toolResult.cartItem.name}**\n${toolResult.cartItem.from && toolResult.cartItem.to ? `📍 ${toolResult.cartItem.from} → ${toolResult.cartItem.to}\n` : ''}${toolResult.cartItem.date ? `📅 ${toolResult.cartItem.date}${toolResult.cartItem.time ? ` at ${toolResult.cartItem.time}` : ''}\n` : ''}${toolResult.cartItem.passengers ? `👥 ${toolResult.cartItem.passengers} passengers\n` : ''}${toolResult.cartItem.catering ? `🥤 ${toolResult.cartItem.catering === 'complimentary' ? 'Complimentary refreshments' : toolResult.cartItem.catering}\n` : ''}\nChoose how you'd like to proceed:`,
      action: 'confirm_booking',
      bookingData: toolResult.cartItem
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
    if (toolResult.cartItem && setCart) {
      setCart(prev => [...prev, toolResult.cartItem]);
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
  }, [setChatHistory, setCart]);

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

      // Filter to valid Claude roles
      const uiOnlyRoles = ['results', 'place', 'hotels', 'adventures', 'confirm_booking', 'loading'];
      const claudeMessages = conversationHistory
        .filter(msg => !uiOnlyRoles.includes(msg.role) && !msg.isLoading)
        .map(msg => ({ role: msg.role, content: msg.content }));

      const response = await claudeEdgeService.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
        messages: claudeMessages,
        tools: aiToolDefinitions.map((tool, index) =>
          index === aiToolDefinitions.length - 1
            ? { ...tool, cache_control: { type: "ephemeral" } }
            : tool
        ),
        tool_choice: { type: "auto" }
      });

      console.log('🤖 Claude response:', response);

      if (response.stop_reason === 'tool_use') {
        // Check for initial text before tool call
        const textBlock = response.content.find(block => block.type === 'text');
        if (textBlock?.text?.trim()) {
          const initialMessage = { role: 'assistant', content: textBlock.text };
          setChatHistory(prev => prev.map(c =>
            c.id === workingChatId
              ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), initialMessage] }
              : c
          ));
          await chatService.updateChatMessages(workingChatId, [...conversationHistory, initialMessage], user.id);
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

            // Process search results into tabs
            const { tabs, hasRestriction } = processToolResultsToTabs(toolUse, toolResult);

            if (tabs.length > 0) {
              const resultsMessage = {
                role: 'results',
                content: JSON.stringify({ tabs }),
                tabs: tabs
              };

              setChatHistory(prev => prev.map(c =>
                c.id === workingChatId
                  ? { ...c, messages: [...c.messages, resultsMessage] }
                  : c
              ));

              await chatService.updateChatMessages(workingChatId, [...conversationHistory, resultsMessage], user.id);
            }
          }

          // Get AI follow-up response
          const followUp = await claudeEdgeService.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
            messages: [
              ...claudeMessages,
              { role: 'assistant', content: response.content },
              { role: 'user', content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(toolResult) }] }
            ]
          });

          const aiText = followUp.content.find(block => block.type === 'text')?.text || 'Found results!';
          const aiMessage = { role: 'assistant', content: aiText };

          let followUpMessageIndex = 0;
          setChatHistory(prev => {
            const updated = prev.map(c => {
              if (c.id === workingChatId) {
                const newMessages = [...c.messages.filter(m => !m.isLoading), aiMessage];
                followUpMessageIndex = newMessages.length - 1;
                return { ...c, messages: newMessages };
              }
              return c;
            });
            return updated;
          });

          setTimeout(() => {
            setTypingMessageIndex(followUpMessageIndex);
          }, 50);

          await chatService.updateChatMessages(workingChatId, [...conversationHistory, aiMessage], user.id);
        }
      } else {
        // Regular text response
        const textBlock = response.content.find(block => block.type === 'text');
        const aiMessage = { role: 'assistant', content: textBlock?.text || 'How can I help?' };

        let newMessageIndex = 0;
        setChatHistory(prev => {
          const updated = prev.map(c => {
            if (c.id === workingChatId) {
              const newMessages = [...c.messages.filter(m => !m.isLoading), aiMessage];
              newMessageIndex = newMessages.length - 1;
              return { ...c, messages: newMessages };
            }
            return c;
          });
          return updated;
        });

        setTimeout(() => {
          setTypingMessageIndex(newMessageIndex);
        }, 50);

        await chatService.updateChatMessages(workingChatId, [...conversationHistory, aiMessage], user.id);
      }
    } catch (error) {
      console.error('❌ AI service error:', error);
      setToast({ message: 'Error - please open a new chat or contact support', type: 'error' });
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
    handleLookupPlaceTool, handleSearchHotelsTool, handleAddHotelToCartTool, setCart
  ]);

  return {
    handleSendMessage,
    processToolResultsToTabs
  };
};

export default useMessageHandler;
