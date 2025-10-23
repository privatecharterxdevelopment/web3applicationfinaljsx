# Claude 3.5 Sonnet AI Integration - Setup Guide

## 🚀 Overview

Your AIChat now uses **Claude 3.5 Sonnet** (Anthropic's most advanced model) for intelligent, context-aware responses.

## 📋 What Was Added

### New Files:
1. **`src/services/claudeService.js`** - Claude API client with streaming support
2. **`src/config/systemPrompt.js`** - Customizable system prompt for Sphera AI
3. **`CLAUDE_AI_SETUP.md`** - This guide

### Modified Files:
1. **`src/components/Landingpagenew/AIChat.jsx`** - Integrated Claude responses
2. **`.env.example`** - Added VITE_ANTHROPIC_API_KEY

## 🔑 Getting Your API Key

1. Go to: https://console.anthropic.com/
2. Sign up / Log in
3. Navigate to **API Keys** section
4. Click **Create Key**
5. Copy your API key (starts with `sk-ant-api03-...`)

## ⚙️ Setup Instructions

### Step 1: Add API Key to .env

Create or edit `.env` file in your project root:

```bash
VITE_ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

**Important**: Never commit this file to git! It's already in `.gitignore`.

### Step 2: Restart Dev Server

```bash
npm run dev
```

### Step 3: Test the Chat

1. Open the app
2. Navigate to the AI Chat
3. Try: "Hello" or "I need a private jet from London to Paris"
4. You should see dynamic AI responses!

## 🎨 Customizing the System Prompt

Edit `src/config/systemPrompt.js` to customize Sphera's personality and behavior:

```javascript
export const SPHERA_SYSTEM_PROMPT = `You are Sphera...

# YOUR CUSTOM INSTRUCTIONS HERE

`;
```

**Tips for customization:**
- Keep it concise (Claude works best with clear, structured prompts)
- Define the tone you want (formal, casual, technical, etc.)
- Specify any rules or constraints
- Include examples of desired responses
- Define what NOT to do

## 📊 Cost Information

**Claude 3.5 Sonnet Pricing:**
- Input: $3 per million tokens (~750,000 words)
- Output: $15 per million tokens (~750,000 words)

**Estimated costs:**
- Typical conversation (10 messages): ~$0.01 - $0.02
- 1000 conversations: ~$10 - $20
- Very cost-effective for premium concierge service!

**Cost optimization in code:**
- `maxTokens: 512` - Limits response length
- Only last 3 messages sent for context (in parameter extraction)
- Fallback to simple responses if API fails

## 🔧 Features

### 1. **Dynamic Responses**
- Contextual understanding of luxury travel requests
- Adapts to user's communication style
- Remembers conversation history

### 2. **Parameter Extraction**
- Automatically extracts: service type, locations, passengers, dates
- Falls back to regex if API unavailable
- Smart context understanding

### 3. **Streaming Support** (Ready but not enabled)
```javascript
// To enable real-time typing effect:
await claudeService.streamMessage(messages, (chunk, fullText) => {
  // Update UI with each word as it's generated
});
```

### 4. **Graceful Fallback**
- If API key missing: Uses simple hardcoded responses
- If API fails: Returns friendly error message
- Never breaks the user experience

## 🧪 Testing

### Test Cases:

1. **Simple Greeting:**
   - User: "Hello"
   - Expected: Personalized greeting from Claude

2. **Service Request:**
   - User: "I need a helicopter in Monaco"
   - Expected: Intelligent acknowledgment + search

3. **Complex Query:**
   - User: "What's the difference between a light jet and a midsize jet for a 6-person trip to Ibiza?"
   - Expected: Detailed, knowledgeable response

4. **Follow-up Questions:**
   - User: "What about the costs?"
   - Expected: Context-aware pricing information

## 🛠️ Advanced Configuration

### Adjust Response Style

In `AIChat.jsx`, find `getClaudeResponse`:

```javascript
const response = await claudeService.sendMessage(conversationHistory, {
  maxTokens: 512,      // Increase for longer responses
  temperature: 0.7     // 0.0 = focused, 1.0 = creative
});
```

### Enable Streaming (Real-time Typing)

Replace the `getClaudeResponse` function with:

```javascript
const getClaudeResponse = async (conversationHistory, onUpdate) => {
  let fullResponse = '';
  
  await claudeService.streamMessage(
    conversationHistory,
    (chunk, fullText) => {
      fullResponse = fullText;
      onUpdate(fullText); // Update UI in real-time
    },
    { maxTokens: 512, temperature: 0.7 }
  );
  
  return fullResponse;
};
```

## 🐛 Troubleshooting

### "Claude API key not configured"
- Check `.env` file exists and has correct key
- Restart dev server after adding key
- Key should start with `sk-ant-api03-`

### "Failed to fetch" or CORS errors
- Claude SDK uses `dangerouslyAllowBrowser: true`
- If still issues, consider proxying through your backend

### Responses are too long/short
- Adjust `maxTokens` in `getClaudeResponse` function
- Modify system prompt to emphasize brevity

### API rate limits
- Free tier: 5 requests/min
- Paid tier: Much higher limits
- Consider caching responses for common queries

## 📚 Resources

- **Anthropic Docs**: https://docs.anthropic.com/
- **Claude API Reference**: https://docs.anthropic.com/claude/reference/
- **Best Practices**: https://docs.anthropic.com/claude/docs/prompt-engineering
- **System Prompts Guide**: https://docs.anthropic.com/claude/docs/system-prompts

## 🎯 Next Steps

1. **Get API key** and add to `.env`
2. **Test basic functionality**
3. **Customize system prompt** to match your brand voice
4. **Monitor usage** in Anthropic console
5. **Iterate on prompt** based on user feedback

## 💡 Pro Tips

1. **System Prompt is King**: Spend time perfecting it
2. **Show, Don't Tell**: Include examples in prompt
3. **Test Edge Cases**: Try confusing/ambiguous queries
4. **Monitor Costs**: Set up billing alerts
5. **User Feedback**: Collect and iterate

---

**Need help?** Check the Anthropic documentation or reach out to support.

**Ready to customize?** Edit `src/config/systemPrompt.js` and make Sphera truly yours!
