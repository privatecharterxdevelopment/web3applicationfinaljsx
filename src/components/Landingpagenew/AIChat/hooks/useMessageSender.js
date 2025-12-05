// useMessageSender Hook
// Handles AI message flow with Claude API

import { useCallback, useRef } from 'react';
import { claudeEdgeService } from '../../../../services/claudeEdgeService';
import { chatService } from '../../../../services/chatService';
import { MAX_MESSAGES_PER_CHAT } from '../utils/constants';

export function useMessageSender({
  chatManager,
  user,
  userSubscriptionLimits,
  isAdmin,
  aiToolDefinitions,
  executeTool,
  getSystemPrompt,
  onToast
}) {
  const processingRef = useRef(false);

  /**
   * Send a message and get AI response
   * @param {string} message - User message
   * @param {Object} options - { skipAddUserMessage, workingChatId }
   */
  const sendMessage = useCallback(async (message, options = {}) => {
    const { skipAddUserMessage = false } = options;

    if (!message?.trim() || processingRef.current) return;
    if (chatManager.isProcessing) return;

    processingRef.current = true;
    chatManager.setProcessing(true);

    const { activeChat, chatHistory } = chatManager;
    const existingChat = chatHistory.find(c => c.id === activeChat);
    const currentMsgCount = existingChat?.messages?.filter(m => m.role === 'user').length || 0;

    // Check message limit (Elite has unlimited)
    const hasUnlimitedMessages = userSubscriptionLimits?.unlimited_messages === true;

    if (!hasUnlimitedMessages && currentMsgCount >= MAX_MESSAGES_PER_CHAT && activeChat !== 'new') {
      chatManager.setMessageLimitReached(true);
      onToast?.({
        message: `Message limit reached (${MAX_MESSAGES_PER_CHAT} messages per chat). Upgrade for more messages.`,
        type: 'warning'
      });
      chatManager.setProcessing(false);
      processingRef.current = false;
      return;
    }

    // Update message count
    if (!hasUnlimitedMessages) {
      chatManager.setMessageCount(currentMsgCount + 1);
    }

    chatManager.setShowWelcomeMessage(false);
    const userMessage = { role: 'user', content: message };
    let workingChatId = activeChat;

    // Handle new chat creation
    const isFirstUserMessage = existingChat &&
      existingChat.messages.length === 1 &&
      existingChat.messages[0].role === 'assistant' &&
      existingChat.title === 'New Chat';

    try {
      if (isFirstUserMessage) {
        // Update existing chat title
        const newTitle = message.substring(0, 50) + (message.length > 50 ? '...' : '');
        await chatManager.updateChatTitle(activeChat, newTitle);
        chatManager.addMessage(activeChat, userMessage);
        await chatManager.saveMessages(activeChat, [...existingChat.messages, userMessage]);

      } else if (activeChat === 'new') {
        // Create new chat
        const title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
        const newChat = await chatManager.createChat(title, userMessage);

        if (!newChat) {
          chatManager.setProcessing(false);
          processingRef.current = false;
          return;
        }

        workingChatId = newChat.id;

        // Add loading message
        chatManager.addMessage(workingChatId, { role: 'assistant', content: '...', isLoading: true });

      } else {
        // Regular message in existing chat
        if (!skipAddUserMessage) {
          chatManager.addMessage(activeChat, userMessage);
          if (existingChat) {
            await chatManager.saveMessages(activeChat, [...existingChat.messages, userMessage]);
          }
        }
      }

      // Add loading message if not new chat
      if (activeChat !== 'new') {
        chatManager.addMessage(workingChatId, { role: 'assistant', content: '...', isLoading: true });
      }

      // Build conversation history
      let conversationHistory;
      const currentChatObj = chatHistory.find(c => c.id === workingChatId) ||
                             chatHistory.find(c => c.id === activeChat);

      if (currentChatObj) {
        conversationHistory = [...currentChatObj.messages.filter(msg => !msg.isLoading), userMessage];
      } else {
        conversationHistory = [userMessage];
      }

      // Call Claude API
      const systemPrompt = getSystemPrompt();
      const claudeMessages = conversationHistory
        .filter(msg => msg.role !== 'results')
        .map(msg => ({ role: msg.role, content: msg.content }));

      console.log('📡 Sending to Claude:', { messageCount: claudeMessages.length });

      const response = await claudeEdgeService.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
        messages: claudeMessages,
        tools: aiToolDefinitions?.map((tool, index) =>
          index === aiToolDefinitions.length - 1
            ? { ...tool, cache_control: { type: "ephemeral" } }
            : tool
        ),
        tool_choice: { type: "auto" }
      });

      console.log('🤖 Claude response:', response);

      // Handle tool use
      if (response.stop_reason === 'tool_use') {
        const textBlock = response.content.find(block => block.type === 'text');
        if (textBlock?.text?.trim()) {
          chatManager.removeLoadingMessages(workingChatId);
          chatManager.addMessage(workingChatId, { role: 'assistant', content: textBlock.text });
        } else {
          chatManager.removeLoadingMessages(workingChatId);
        }

        const toolUse = response.content.find(block => block.type === 'tool_use');
        if (toolUse && executeTool) {
          console.log('🔧 Tool used:', toolUse.name, toolUse.input);

          const toolResult = await executeTool(toolUse.name, toolUse.input);
          console.log('📊 Tool result:', toolResult);

          // Process tool result - this is handled by the calling component
          return {
            type: 'tool_result',
            toolUse,
            toolResult,
            workingChatId,
            conversationHistory
          };
        }
      } else {
        // Regular text response
        const textContent = response.content
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('\n');

        chatManager.removeLoadingMessages(workingChatId);

        if (textContent) {
          const assistantMessage = { role: 'assistant', content: textContent };
          chatManager.addMessage(workingChatId, assistantMessage);

          // Save to database
          const updatedChat = chatHistory.find(c => c.id === workingChatId);
          if (updatedChat) {
            await chatManager.saveMessages(workingChatId, [...updatedChat.messages, assistantMessage]);
          }

          // Start typing animation
          chatManager.setAssistantTyping(true);
          const currentChatMessages = chatHistory.find(c => c.id === workingChatId)?.messages || [];
          chatManager.setTypingMessageIndex(currentChatMessages.length);

          return {
            type: 'text',
            content: textContent,
            workingChatId
          };
        }
      }
    } catch (error) {
      console.error('❌ Claude API error:', error);
      chatManager.removeLoadingMessages(workingChatId);

      const errorMsg = error.message || 'Failed to get AI response';
      onToast?.({ message: `AI Error: ${errorMsg}`, type: 'error' });

      return { type: 'error', error };
    } finally {
      chatManager.setProcessing(false);
      processingRef.current = false;
    }
  }, [
    chatManager,
    user,
    userSubscriptionLimits,
    isAdmin,
    aiToolDefinitions,
    executeTool,
    getSystemPrompt,
    onToast
  ]);

  /**
   * Send a follow-up message to Claude (after tool use)
   */
  const sendFollowUp = useCallback(async (conversationHistory, toolResults, workingChatId) => {
    try {
      const systemPrompt = getSystemPrompt();

      const followUp = await claudeEdgeService.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: [{ type: "text", text: systemPrompt }],
        messages: [
          ...conversationHistory.map(msg => ({ role: msg.role, content: msg.content })),
          ...toolResults
        ]
      });

      const followUpText = followUp.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      if (followUpText) {
        const followUpMessage = { role: 'assistant', content: followUpText };
        chatManager.addMessage(workingChatId, followUpMessage);

        const updatedChat = chatManager.chatHistory.find(c => c.id === workingChatId);
        if (updatedChat) {
          await chatManager.saveMessages(workingChatId, [...updatedChat.messages, followUpMessage]);
        }

        chatManager.setAssistantTyping(true);
      }

      return followUpText;
    } catch (error) {
      console.error('Follow-up error:', error);
      return null;
    }
  }, [chatManager, getSystemPrompt]);

  return {
    sendMessage,
    sendFollowUp,
    isProcessing: chatManager.isProcessing
  };
}

export default useMessageSender;
