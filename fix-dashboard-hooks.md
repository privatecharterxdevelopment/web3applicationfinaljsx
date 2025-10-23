# Dashboard.tsx Hooks Violation Fix

## Problem
React Hooks Rule Violation: `renderChatSupport()` function contains useState hooks, which is forbidden in React.

## Error Message
```
Warning: React has detected a change in the order of Hooks called by Dashboard.
Uncaught Error: Rendered more hooks than during the previous render.
```

## Solution

### 1. Add Chat States at Component Level (after line 1175)

Add these states after `const [favorites, setFavorites] = useState<string[]>([]);`:

```typescript
// Chat Support States
const [chatMessages, setChatMessages] = useState([
  {
    id: '1',
    from: 'support',
    text: `Hello ${user?.name || user?.email?.split('@')[0] || 'there'}! Welcome to PrivateCharterX support. How can we help you today?`,
    timestamp: new Date().toISOString()
  }
]);
const [chatNewMessage, setChatNewMessage] = useState('');
```

### 2. Delete renderChatSupport() Function (around line 3086-3194)

DELETE this entire function:
```typescript
const renderChatSupport = () => {
  const [messages, setMessages] = useState([...]); // ❌ HOOKS IN FUNCTION - BAD!
  const [newMessage, setNewMessage] = useState('');
  //... rest of function
};
```

### 3. Add sendChatMessage Handler (replace renderChatSupport)

```typescript
// Send message handler for chat
const sendChatMessage = () => {
  if (!chatNewMessage.trim()) return;

  const userMessage = {
    id: Date.now().toString(),
    from: 'user',
    text: chatNewMessage,
    timestamp: new Date().toISOString()
  };

  setChatMessages(prev => [...prev, userMessage]);
  setChatNewMessage('');

  // Simulate support response
  setTimeout(() => {
    const supportMessage = {
      id: (Date.now() + 1).toString(),
      from: 'support',
      text: 'Thank you for your message. Our support team will respond shortly.',
      timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, supportMessage]);
  }, 1000);
};
```

### 4. Replace Chat Render Call (around line 3344)

CHANGE FROM:
```typescript
{currentView === 'chat-support' && renderChatSupport()}
```

CHANGE TO:
```typescript
{currentView === 'chat-support' && (
  <div className="h-full flex flex-col bg-white">
    {/* Chat Header */}
    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-full flex items-center justify-center text-white text-sm font-medium">
            PCX
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">PrivateCharterX Support</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-gray-900">{user?.name || 'User'}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
      </div>
    </div>

    {/* Messages Area */}
    <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
      <div className="space-y-4">
        {chatMessages.map((message) => (
          <div key={message.id} className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
              message.from === 'user' ? 'bg-black text-white' : 'bg-white text-gray-900 border border-gray-200'
            }`}>
              <p className="text-sm">{message.text}</p>
              <p className={`text-xs mt-1 ${message.from === 'user' ? 'text-gray-300' : 'text-gray-500'}`}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Input Area */}
    <div className="p-4 border-t border-gray-200 bg-white">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={chatNewMessage}
          onChange={(e) => setChatNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && chatNewMessage.trim()) {
              sendChatMessage();
            }
          }}
          placeholder="Type your message..."
          className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none text-sm placeholder-gray-400 focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
        />
        <button
          onClick={sendChatMessage}
          disabled={!chatNewMessage.trim()}
          className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  </div>
)}
```

### 5. Fix Weather API 429 Errors

Add rate limiting or comment out weather API calls temporarily.

## SQL Setup Required

Run the SQL schema file:
```bash
mysql -u your_user -p your_database < database/schema_notifications_chat.sql
```

Or use your preferred SQL client to execute:
`C:/Users/User/thefinalwebapplicationpcx-main/database/schema_notifications_chat.sql`

## Next Steps

1. Create API endpoints for notifications (GET/POST/PUT)
2. Create API endpoints for chat (GET/POST conversations & messages)
3. Implement WebSocket for real-time chat
4. Add push notifications support
