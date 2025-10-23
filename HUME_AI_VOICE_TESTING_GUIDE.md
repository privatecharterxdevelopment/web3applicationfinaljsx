# Hume AI Voice Testing Guide

## 🎤 How to Test Voice Conversation with AI

### **Prerequisites:**

✅ **Hume AI API Keys are configured** in `.env`:
```bash
VITE_HUME_API_KEY=MLoLorUHKhngtOaj0bQ3yO23mRhT8JBVMwGrBz4aL4fYbfSz
VITE_HUME_SECRET_KEY=2K9eCOGWGG80eQ0oShoEAuHhBsM6SdXgNFtlnsyJQ381cLWTcgXAzhXJ6kPAEgqv
```
✅ **Status:** ACTIVE and CONFIGURED ✅

---

## 🚀 Step-by-Step Testing Instructions

### **Step 1: Navigate to AI Chat**

1. Open your PrivateCharterX platform
2. Click on **"+New Chat"** button in left sidebar (below logo)
3. OR click **"History"** and select an existing chat
4. You're now in the AI Chat interface

---

### **Step 2: Locate the Microphone Button**

**Location:** Bottom of chat interface, next to the text input

```
┌─────────────────────────────────────┐
│ Type your message...     [🎤] [SEND]│
└─────────────────────────────────────┘
```

The microphone icon is the middle button.

---

### **Step 3: Enable Microphone Access**

**First Time Only:**

1. Click the **microphone button** (🎤)
2. Browser will ask: *"Allow access to your microphone?"*
3. Click **"Allow"** or **"Yes"**

If you see an alert saying *"Voice capture not configured"*:
- Check that Hume API keys are in `.env`
- Restart the dev server: `npm run dev`

---

### **Step 4: Start Voice Recording**

1. **Click the microphone button** (🎤)
2. Button will turn **BLACK** (indicating recording)
3. Status: **Listening... 🔴**
4. Start speaking your request

**Example phrases to test:**
- *"I need a jet from Zurich to Dubai"*
- *"Show me empty legs to Paris"*
- *"I need a helicopter from Geneva to Monaco"*
- *"Find me a luxury car in London"*

---

### **Step 5: Stop Recording**

1. **Click the microphone button again** to stop
2. Button returns to normal (not black)
3. Status: Processing...

**What happens next:**
1. Your voice is sent to Hume AI
2. Hume converts speech → text
3. AI processes your request
4. AI searches Supabase for results
5. **AI responds with VOICE** 🔊

---

### **Step 6: Hear AI Voice Response**

The AI will:
- ✅ Speak the response out loud
- ✅ Show text in chat simultaneously
- ✅ Display search results as cards

**Example AI voice response:**
> *"Flying to Dubai - excellent destination! Which city will you be departing from?"*

---

## 🎛️ Voice Controls

### **Microphone Button States:**

| State | Appearance | Meaning |
|-------|------------|---------|
| **Idle** | Light with border | Ready to record |
| **Recording** | Black background | Listening to you 🔴 |
| **Disabled** | Faded/Gray | Processing (wait) |

### **How to Use:**

1. **Click once** → Start recording
2. **Speak clearly** into microphone
3. **Click again** → Stop recording
4. **Wait** → AI processes and responds with voice

---

## 🧪 Test Scenarios

### **Test 1: Simple Jet Request**
```
You: [Click mic] "I need a jet to Dubai" [Click mic]
AI: [Voice] "Flying to Dubai - excellent destination!
             Which city will you be departing from?"
```

### **Test 2: Complete Request**
```
You: [Click mic] "I need a jet from Zurich to Dubai for 8 people" [Click mic]
AI: [Voice] "Perfect! I found 12 jets. I'd especially recommend
             the Gulfstream G550 at €12,500/hr - it's an excellent
             fit for your group..."
     [Shows search results cards]
```

### **Test 3: Follow-up Question**
```
You: [Click mic] "What about luxury cars?" [Click mic]
AI: [Voice] "Wonderful! Would you like me to arrange ground
             transportation in Dubai? I can organize luxury
             chauffeur service for you."
```

### **Test 4: Empty Legs (Budget)**
```
You: [Click mic] "Show me empty legs to Paris" [Click mic]
AI: [Voice] "Perfect choice for value! Empty legs offer 30-50% savings.
             I found 5 flights..."
     [Shows discounted options]
```

---

## 🎭 Hume AI Emotion Features

Hume AI detects your **emotion** in voice and adapts responses:

### **Emotion Detection:**
- 😊 **Excitement** → AI matches enthusiasm
- 😰 **Stress/Urgency** → AI responds faster, more direct
- 😤 **Frustration** → AI becomes more helpful, reassuring
- 😐 **Neutral** → AI stays professional, consultative

### **Example:**

**If you sound stressed:**
```
You: [stressed tone] "I need a jet NOW to Dubai"
AI: [empathetic] "I hear you – let me help you quickly!
                  I'm searching right now for immediate departures..."
```

**If you sound excited:**
```
You: [excited tone] "I need a jet to Dubai!"
AI: [enthusiastic] "Love the enthusiasm! Let's make it happen!
                    Flying to Dubai - where are you departing from?"
```

---

## 🔊 Audio Output

### **Voice Playback:**
- AI responses are spoken aloud automatically
- Uses Hume AI's emotion-aware text-to-speech
- Voice adapts to conversation context

### **Controls:**
- **Voice ON/OFF:** Currently automatic (future toggle)
- **Volume:** Use system volume controls

---

## 🛠️ Troubleshooting

### **Issue 1: "Microphone access denied"**

**Solution:**
1. Browser Settings → Privacy → Microphone
2. Allow microphone for your site
3. Refresh page
4. Try again

### **Issue 2: "Voice capture not configured"**

**Solution:**
1. Check `.env` file has Hume API keys
2. Restart dev server: `npm run dev`
3. Clear browser cache
4. Try again

### **Issue 3: No voice response (text only)**

**Cause:** Voice output may be disabled or browser blocked audio

**Solution:**
1. Check system volume is ON
2. Check browser didn't block autoplay audio
3. Click anywhere on page first (browser audio policy)
4. Try again

### **Issue 4: Microphone not detecting voice**

**Solution:**
1. Check microphone is working (test in system settings)
2. Speak clearly and closer to microphone
3. Check microphone permissions
4. Try a different browser (Chrome recommended)

---

## 💡 Best Practices for Voice Testing

### **✅ DO:**
- Speak clearly and at normal pace
- Wait for button to turn black before speaking
- Give specific details (cities, dates, numbers)
- Let AI finish speaking before interrupting

### **❌ DON'T:**
- Speak too fast or mumble
- Talk while recording button is not black
- Interrupt AI mid-response
- Use voice in noisy environments

---

## 🎯 Expected Behavior

### **Full Voice Conversation Flow:**

```
1. User clicks microphone 🎤
2. Button turns BLACK → Recording starts
3. User speaks: "I need a jet to Dubai"
4. User clicks microphone again → Recording stops
5. Hume AI: Speech → Text conversion
6. OpenRouter AI: Processes request
7. Supabase: Searches database
8. AI: Generates response
9. Hume AI: Text → Speech conversion
10. Browser: Plays AI voice response 🔊
11. Screen: Shows text + search results
12. User can click microphone again for follow-up
```

**Total time:** ~3-5 seconds

---

## 📊 Technical Details

### **Voice Pipeline:**

```
Your Voice
    ↓
[Microphone] → MediaRecorder API
    ↓
[Audio Blob] → Hume AI WebSocket
    ↓
[Speech-to-Text] → Transcript
    ↓
[AI Processing] → OpenRouter/OpenAI
    ↓
[Search] → Supabase UnifiedSearch
    ↓
[Response Generation] → AI Text
    ↓
[Text-to-Speech] → Hume AI
    ↓
[Audio Output] → Browser plays
    ↓
You hear AI voice! 🔊
```

---

## 🔑 API Keys Status

**Current Configuration:**

```bash
✅ VITE_HUME_API_KEY: Configured
✅ VITE_HUME_SECRET_KEY: Configured
✅ VITE_OPENAI_API_KEY: Configured
✅ VITE_OPENROUTER_API_KEY: Configured
```

**All systems operational!** 🎉

---

## 🎬 Video Demo Script

### **Quick 30-second demo:**

1. **Open AI Chat** → Click "+New Chat"
2. **Click microphone** → Button turns black
3. **Say:** *"I need a jet from Zurich to Dubai for 8 people"*
4. **Click microphone** → Stop recording
5. **Listen:** AI responds with voice
6. **Watch:** Search results appear as cards
7. **Click microphone** again
8. **Say:** *"The Gulfstream looks good"*
9. **Listen:** AI suggests add-ons (ground transport, CO2)
10. **Done!** Complete voice booking flow

---

## 📱 Browser Compatibility

| Browser | Voice Input | Voice Output | Status |
|---------|-------------|--------------|--------|
| Chrome | ✅ | ✅ | **Recommended** |
| Edge | ✅ | ✅ | Supported |
| Firefox | ✅ | ✅ | Supported |
| Safari | ⚠️ | ⚠️ | Limited |

**Best experience:** Use Chrome or Edge

---

## 🎤 Sample Voice Test Phrases

### **Beginner Level:**
- *"I need a jet"*
- *"Show me empty legs"*
- *"Book a helicopter"*

### **Intermediate Level:**
- *"I need a jet from Zurich to Dubai"*
- *"Show me empty legs to Paris tomorrow"*
- *"Find helicopters in Monaco for 4 people"*

### **Advanced Level:**
- *"I need a jet from Zurich to Dubai for 8 people departing tomorrow with full catering"*
- *"Show me empty legs to Paris under 10,000 euros"*
- *"Book a Gulfstream from Geneva to London with ground transportation"*

---

## 🎯 Success Criteria

You'll know it's working when:

✅ Microphone button turns black when clicked
✅ You see "Listening..." indicator
✅ Your speech converts to text in chat
✅ AI responds with text message
✅ **You HEAR AI voice speaking the response** 🔊
✅ Search results appear if applicable
✅ You can have multi-turn voice conversation

---

## 🚀 Quick Start Commands

```bash
# Start the dev server
npm run dev

# Open browser
http://localhost:5173

# Navigate to AI Chat
Click "+New Chat" in sidebar

# Test voice
Click microphone → Speak → Click again → Listen!
```

---

## 📞 Need Help?

If voice isn't working:

1. **Check console** (F12) for errors
2. **Verify API keys** in `.env`
3. **Test microphone** in system settings
4. **Allow permissions** in browser
5. **Try different browser** (Chrome)
6. **Restart dev server**

---

## ✨ Summary

**To test Hume AI voice conversation:**

1. Go to AI Chat
2. Click microphone button (🎤)
3. Allow microphone access
4. Speak your request
5. Click microphone again to stop
6. **Listen to AI respond with voice!** 🔊
7. Continue conversation with voice

**It's that simple!** 🎉

The AI will speak responses, show search results as cards, and you can have a complete hands-free luxury travel consultation experience!
