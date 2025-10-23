# 🗨️ Chat Requests System - Setup Guide

## Overview
Complete AI chat request tracking system that saves ALL user requests from Sphera AI chat (with and without results) to Supabase, viewable in the dashboard sidebar.

---

## ✅ What's Been Implemented

### 1. **Database Table: `chat_requests`**
- Stores ALL user travel requests from AI chat
- Tracks search parameters (location, dates, passengers, etc.)
- Saves conversation history
- Records search results (if any)
- Captures cart items and totals
- Status tracking: `pending` → `in_progress` → `completed` → `cancelled`

### 2. **Service Layer: `chatRequestService.js`**
- `saveChatRequest()` - Save requests to Supabase
- `getUserChatRequests()` - Fetch user's requests
- `getPendingCount()` - Count pending requests
- `updateRequestStatus()` - Update request status
- `deleteRequest()` - Delete a request

### 3. **AI Chat Integration**
- **AIChat.jsx** updated to save requests to Supabase:
  - When user saves a request (Save Request button)
  - When search returns NO results (auto-saves for team review)
  - Includes full conversation context
  - Extracts search parameters automatically

### 4. **Dashboard Integration**
- **Chat Requests** menu item in sidebar (already present)
- **ChatRequestsView.jsx** component displays saved requests
- Shows all requests with filters (pending, in_progress, completed, cancelled)
- Displays request details, status, and conversation history

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

Open Supabase SQL Editor and run:

```bash
c:\Users\User\thefinalwebapplicationpcx-main\database\fix_tokenization_services_and_chat_requests.sql
```

**This will:**
1. ✅ Fix the tokenization_services admin policy error
2. ✅ Create chat_requests table with RLS policies
3. ✅ Add helper functions for queries
4. ✅ Create indexes for performance

### Step 2: Verify Table Creation

Run this query in Supabase SQL Editor:

```sql
SELECT * FROM chat_requests LIMIT 5;
```

Should return empty results (no error).

### Step 3: Test the Integration

1. **Go to your dashboard** (tokenized-assets-glassmorphic)
2. **Click "AI Chat"** in the sidebar
3. **Ask Sphera a question:**
   - "I need a private jet to Monaco for 4 passengers"
   - "Show me empty legs to Paris next week"
   - "Find me a helicopter tour in Dubai"

4. **Save the request:**
   - Click **"Save Request"** button in chat
   - OR search will auto-save if no results found

5. **View saved requests:**
   - Click **"Chat Requests"** in sidebar
   - See your saved request with full details
   - Check status, conversation, and search parameters

---

## 📊 Database Schema

### `chat_requests` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | User who made the request (FK to auth.users) |
| `query` | TEXT | Original user question/request |
| `confidence_score` | INTEGER | AI confidence (0-100) |
| `service_type` | TEXT | 'jets', 'empty_legs', 'helicopters', etc. |
| `from_location` | TEXT | Departure location |
| `to_location` | TEXT | Destination location |
| `date_start` | DATE | Start date |
| `date_end` | DATE | End date |
| `passengers` | INTEGER | Number of passengers |
| `budget` | DECIMAL | Budget amount |
| `pets` | INTEGER | Number of pets |
| `special_requirements` | TEXT | Special requests |
| `conversation_history` | JSONB | Full chat conversation |
| `has_results` | BOOLEAN | Whether search found results |
| `results_count` | INTEGER | Number of results found |
| `results_summary` | JSONB | Summary by category |
| `cart_items` | JSONB | Items user added to cart |
| `cart_total` | DECIMAL | Total cart value |
| `status` | TEXT | pending, in_progress, completed, cancelled |
| `assigned_to` | UUID | Admin handling this |
| `notes` | TEXT | Admin notes |
| `created_at` | TIMESTAMPTZ | When request was made |
| `updated_at` | TIMESTAMPTZ | Last update |

---

## 🔐 Security (Row Level Security)

### User Policies:
- ✅ Users can **view** their own requests
- ✅ Users can **create** their own requests
- ✅ Users can **update** their own requests

### Admin Policies:
- ✅ Admins can **view** all requests
- ✅ Admins can **manage** all requests
- ✅ Admins can assign requests to team members

---

## 🎯 User Flow

### Scenario 1: User Searches (Results Found)
1. User asks: "Private jet to Monaco for 4 people"
2. Sphera searches and finds 12 jets
3. User adds 2 jets to cart
4. User clicks **"Save Request"**
5. Request saved to `chat_requests` with:
   - `has_results = true`
   - `results_count = 12`
   - `cart_items = [jet1, jet2]`
   - `status = 'pending'`

### Scenario 2: User Searches (No Results)
1. User asks: "Helicopter tour in Antarctica for 10 people"
2. Sphera searches but finds 0 results
3. **Auto-saves request** with message:
   > "No matches found. I've saved your request for our team to review. They'll respond within 2-4 hours."
4. Request saved to `chat_requests` with:
   - `has_results = false`
   - `results_count = 0`
   - `status = 'pending'`

### Scenario 3: User Views Requests
1. User clicks **"Chat Requests"** in sidebar
2. Sees list of all saved requests
3. Can filter by status
4. Can view full conversation history
5. Can see request details

---

## 📱 Dashboard Features

### In Chat Requests View:
- 📋 **List all requests** with filters
- 🔍 **Search by keyword**
- 🎯 **Filter by status:**
  - Pending (yellow badge)
  - In Progress (blue badge)
  - Completed (green badge)
  - Cancelled (gray badge)
- 📅 **Sort by date**
- 💬 **View full conversation**
- 📊 **See search parameters**
- 🛒 **View cart items**
- 💰 **See total amount**

---

## 🔧 Admin Features (Future Enhancement)

Admins can:
- View all user requests
- Assign requests to team members
- Update request status
- Add internal notes
- Filter by assigned team member

---

## 🐛 Troubleshooting

### Issue: "column user_profiles.role does not exist"
**Solution:** Run the database migration (Step 1). This fixes the broken policy.

### Issue: Requests not saving
**Check:**
1. User is logged in (`supabase.auth.getUser()` returns user)
2. Table exists: `SELECT * FROM chat_requests;`
3. RLS policies are enabled
4. Browser console for errors

### Issue: Can't see requests in dashboard
**Check:**
1. User is logged in
2. `user?.id` is defined
3. ChatRequestsView component is imported
4. `activeCategory === 'chat-requests'` is working

---

## 📝 Example Request Data

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "user-uuid-here",
  "query": "I need a private jet to Monaco for 4 passengers next week",
  "confidence_score": 85,
  "service_type": "jets",
  "from_location": "London",
  "to_location": "Monaco",
  "date_start": "2025-10-18",
  "date_end": "2025-10-25",
  "passengers": 4,
  "conversation_history": [
    {
      "role": "user",
      "content": "I need a private jet to Monaco for 4 passengers next week"
    },
    {
      "role": "assistant",
      "content": "I found 12 private jets available for your trip..."
    }
  ],
  "has_results": true,
  "results_count": 12,
  "cart_items": [
    {
      "id": "jet-1",
      "name": "Gulfstream G650",
      "price": 15000,
      "type": "jets"
    }
  ],
  "cart_total": 15000,
  "status": "pending",
  "created_at": "2025-10-11T10:30:00Z"
}
```

---

## ✅ Success Checklist

- [ ] Database migration completed successfully
- [ ] `chat_requests` table exists in Supabase
- [ ] AI Chat saves requests when "Save Request" clicked
- [ ] AI Chat auto-saves when no results found
- [ ] Dashboard shows "Chat Requests" in sidebar
- [ ] Clicking "Chat Requests" shows ChatRequestsView
- [ ] User can see their saved requests
- [ ] Filters work (pending, in_progress, completed, cancelled)
- [ ] No errors in browser console
- [ ] User receives confirmation message after saving

---

## 🎉 Summary

You now have a **complete chat request tracking system**:

1. ✅ **All requests saved** - Both with and without results
2. ✅ **Full conversation context** - Complete chat history
3. ✅ **Dashboard integration** - Easy to view and manage
4. ✅ **Status tracking** - pending → in_progress → completed
5. ✅ **Admin ready** - RLS policies for team management
6. ✅ **User friendly** - Clear UI with filters and search

Users can now:
- Save any request from AI chat
- View all their requests in one place
- Track request status
- See full conversation history
- Never lose a booking inquiry

**Your team can:**
- See all pending requests
- Assign requests to team members
- Track completion status
- Add internal notes
- Provide better customer service

---

## 📞 Next Steps

1. **Run the database migration** (Step 1 above)
2. **Test by making a request** in Sphera AI chat
3. **View the request** in Dashboard → Chat Requests
4. **Customize** ChatRequestsView.jsx if needed
5. **Add team management** features (optional)

Everything is ready to deploy! 🚀
