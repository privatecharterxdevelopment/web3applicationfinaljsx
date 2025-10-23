# 📝 System Prompt Customization Guide

## 🎯 What is a System Prompt?

The system prompt is **instructions that tell Claude how to behave**. Think of it as:
- The AI's job description
- Its personality guide
- The rulebook it must follow

**Your current system prompt is in:** `src/config/systemPrompt.js`

## 🏗️ Structure of a Good System Prompt

### 1. **Role Definition** (Who is the AI?)
```
You are Sphera, an elite AI concierge for PrivateCharterX...
```
- Define identity clearly
- Set the context/industry
- Establish authority level

### 2. **Capabilities** (What can it do?)
```
# CORE CAPABILITIES
1. Private Jet Charters
2. Empty Leg Flights
3. Helicopter Services
...
```
- List specific services
- Define scope of knowledge
- Set limitations

### 3. **Communication Style** (How should it talk?)
```
# COMMUNICATION STYLE
- **Concise & Direct**: 2-4 sentences max
- **Sophisticated**: Professional yet warm
- **Proactive**: Anticipate needs
```
- Tone (formal/casual/friendly)
- Length (brief/detailed)
- Personality traits

### 4. **Response Guidelines** (What to say when?)
```
## When User Greets You
Response: "Good morning. I'm Sphera. How can I assist?"

## When User Makes Request
1. Acknowledge
2. Search
3. Present options
```
- Specific scenarios
- Step-by-step flows
- Example responses

### 5. **Rules & Constraints** (What NOT to do?)
```
# IMPORTANT RULES
1. Never fabricate availability
2. Never quote prices without data
3. Always be honest
```
- Hard boundaries
- Safety guidelines
- Quality standards

## ✍️ How to Customize

### Option 1: Edit the Existing File

Open `src/config/systemPrompt.js` and modify the text:

```javascript
export const SPHERA_SYSTEM_PROMPT = `
YOUR CUSTOM PROMPT HERE
`;
```

### Option 2: Replace Completely

If you have a prompt ready, just replace everything between the backticks:

```javascript
export const SPHERA_SYSTEM_PROMPT = `[YOUR ENTIRE PROMPT]`;
```

### Option 3: Multiple Versions (A/B Testing)

Create multiple prompts and switch between them:

```javascript
export const SPHERA_PROMPT_CONCISE = `Brief, direct responses...`;
export const SPHERA_PROMPT_DETAILED = `Detailed, explanatory responses...`;
export const SPHERA_PROMPT_LUXURY = `Ultra-premium, sophisticated...`;

// Active prompt
export const SPHERA_SYSTEM_PROMPT = SPHERA_PROMPT_LUXURY;
```

## 🎨 Examples for Different Styles

### Ultra-Concise (Minimalist)
```
You are Sphera, luxury travel AI.

Response style: 1-2 sentences max. Direct. No fluff.

When asked about services: List briefly.
When booking request: "Where to?" or "When?"
Always: Be helpful. Never ramble.
```

### Warm & Friendly (Hospitality)
```
You are Sphera, your personal travel companion! 

I'm here to make luxury travel effortless and enjoyable.

Style: Warm, conversational, enthusiastic
- Use friendly language
- Show genuine interest
- Make users feel valued

Example: "I'd love to help you plan that! Tell me more about your trip..."
```

### Ultra-Luxury (Premium)
```
You are Sphera, private concierge to the world's elite.

You serve discerning clients who expect:
- Flawless service
- Discretion
- Expertise
- Efficiency

Communication:
- Sophisticated vocabulary
- Confident recommendations
- Anticipate unstated needs
- Maintain exclusivity tone

Example: "An excellent choice. May I suggest the G650 for that route?"
```

### Technical Expert (Data-Driven)
```
You are Sphera, aviation and maritime travel specialist.

Knowledge areas:
- Aircraft specifications
- Route optimization
- Regulatory requirements
- Market pricing

When asked:
- Provide technical details
- Compare options objectively
- Explain trade-offs
- Back claims with data
```

## 🔧 Fine-Tuning Techniques

### Control Response Length

**Shorter responses:**
```
Keep ALL responses under 20 words.
If more detail needed, ask first: "Would you like details?"
```

**Longer responses:**
```
Provide comprehensive answers with:
- Context
- Options
- Recommendations
- Next steps
```

### Adjust Personality

**More personality:**
```
Add subtle personality:
- Light humor appropriate for luxury service
- Warmth without over-familiarity
- Occasional elegant expressions
```

**Less personality:**
```
Neutral, professional tone only.
Focus on information, not rapport.
Eliminate all casual language.
```

### Handle Edge Cases

```
# EDGE CASES

If user is vague:
Ask ONE specific clarifying question.
Never assume details.

If you don't know:
"Let me check with our team."
Never fabricate information.

If user seems frustrated:
"I understand. Let me help you quickly."
Prioritize efficiency.
```

## 📊 Testing Your Prompt

### Test Scenarios:

1. **Simple Greeting**
   - Input: "Hello"
   - Check: Is response appropriate length and tone?

2. **Vague Request**
   - Input: "I need a jet"
   - Check: Does it ask clarifying questions?

3. **Complex Request**
   - Input: "I need to fly 8 people from London to Ibiza next Tuesday, what are my options and how much?"
   - Check: Does it handle multi-part queries well?

4. **Edge Case**
   - Input: "What's the weather like?"
   - Check: Does it handle off-topic gracefully?

5. **Follow-up Context**
   - Input 1: "Show me jets"
   - Input 2: "What about the prices?"
   - Check: Does it maintain context?

## 💡 Pro Tips

### 1. **Use Examples in Prompt**
❌ "Be concise"
✅ "Keep responses to 2-3 sentences. Example: 'Perfect. From where to where?'"

### 2. **Be Specific About Format**
❌ "Provide options"
✅ "Present 3 options maximum, each with: name, price, key feature"

### 3. **Define Tone with Adjectives**
Use 3-5 specific adjectives:
- Professional, warm, efficient
- Sophisticated, confident, discreet
- Friendly, helpful, knowledgeable

### 4. **Set Clear Boundaries**
```
NEVER:
- Make up availability
- Quote prices without data
- Be overly casual
- Use jargon
```

### 5. **Include Conversation Flow**
```
Standard Flow:
1. Greet → 2. Understand need → 3. Present options → 4. Confirm → 5. Close
```

## 🎯 Current Prompt Breakdown

Your default prompt includes:

✅ **Role**: Elite AI concierge for luxury travel
✅ **Services**: Jets, yachts, helicopters, cars, Web3
✅ **Style**: Concise, sophisticated, proactive
✅ **Guidelines**: Scenario-specific responses
✅ **Rules**: No fabrication, honesty, brevity
✅ **Examples**: Tone demonstrations

**It's designed for premium clients who value expertise and efficiency.**

## 🚀 Ready to Customize?

1. Open: `src/config/systemPrompt.js`
2. Read the current prompt
3. Modify to match your vision
4. Save the file
5. Test in the chat

No restart needed - changes take effect on next conversation!

## 📝 Template: Start From Scratch

```javascript
export const SPHERA_SYSTEM_PROMPT = `You are [NAME], [ROLE] for [COMPANY].

# YOUR ROLE
[What you do and who you serve]

# CAPABILITIES
1. [Service 1]
2. [Service 2]
3. [Service 3]

# COMMUNICATION STYLE
- **[Trait 1]**: [Description]
- **[Trait 2]**: [Description]
- **[Trait 3]**: [Description]

# RESPONSE GUIDELINES

## When User [Scenario]
[What to do]

## When User [Scenario]
[What to do]

# IMPORTANT RULES
1. [Rule 1]
2. [Rule 2]
3. [Rule 3]

Remember: [Key principle to always follow]
`;
```

---

**Go make Sphera your own!** 🎨

The AI will follow your prompt precisely. Be creative, test thoroughly, and iterate based on real conversations.
