# 🚀 Claude 3.5 Integration - Quick Reference

## 📁 Files You Care About

| File | Purpose | Action |
|------|---------|--------|
| `src/config/systemPrompt.js` | **Customize AI personality** | ✏️ Edit this! |
| `.env` | API keys | 🔑 Add your key here |
| `src/services/claudeService.js` | API client | 🔧 Advanced config |
| `src/components/Landingpagenew/AIChat.jsx` | Chat UI | 🎨 UI changes |

## ⚡ Quick Actions

### 🔑 Add API Key
```bash
# In .env file:
VITE_ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

### ✏️ Edit System Prompt
```bash
# Open and edit:
src/config/systemPrompt.js
```

### 🔄 Restart Server
```bash
npm run dev
```

### 🧪 Test
1. Open chat
2. Type: "Hello"
3. Should see AI response!

## 🎯 Key Settings

### Response Length (in claudeService.js)
```javascript
maxTokens: 512  // Increase for longer responses
```

### Creativity (in claudeService.js)
```javascript
temperature: 0.7  // 0.0=focused, 1.0=creative
```

### Model (in claudeService.js)
```javascript
model: 'claude-3-5-sonnet-20241022'  // Latest Claude
```

## 💰 Cost Estimate

| Usage | Cost |
|-------|------|
| 1 conversation (10 msgs) | $0.01-0.02 |
| 100 conversations | $1-2 |
| 1000 conversations | $10-20 |

## 🔗 Important Links

- **Get API Key**: https://console.anthropic.com/
- **Claude Docs**: https://docs.anthropic.com/
- **API Reference**: https://docs.anthropic.com/claude/reference/

## 🛠️ Common Tasks

### Change AI Tone
Edit `src/config/systemPrompt.js` → Change "COMMUNICATION STYLE" section

### Make Responses Shorter
In prompt: "Keep ALL responses under 3 sentences"

### Make Responses Longer
In prompt: Remove brevity constraints + increase maxTokens

### Add New Capability
In prompt: Add to "CORE CAPABILITIES" section

### Handle New Scenario
In prompt: Add new "## When User..." section

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "API key not configured" | Add key to .env, restart server |
| Responses too generic | Improve system prompt specificity |
| Rate limit errors | Upgrade Anthropic plan |
| No response | Check console for errors |

## 📚 Full Documentation

- **Setup**: `CLAUDE_AI_SETUP.md`
- **Summary**: `CLAUDE_INTEGRATION_SUMMARY.md`
- **Prompt Guide**: `SYSTEM_PROMPT_GUIDE.md`
- **This file**: `QUICK_REFERENCE.md`

## ✅ Checklist

- [ ] Get Anthropic API key
- [ ] Add to `.env` file
- [ ] Restart dev server
- [ ] Test basic chat
- [ ] Read current system prompt
- [ ] Customize system prompt
- [ ] Test with real queries
- [ ] Monitor usage/costs
- [ ] Iterate based on feedback

---

**Need help?** Check the full guides or Anthropic documentation.

**Ready to go?** Add your API key and start customizing! 🎉
