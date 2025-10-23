# Community Blog Feature - Setup Guide

## Overview

The Community feature fetches blog posts from https://www.privatecharterx.blog/category/web3/ and displays them with wallet-verified comments.

## Current Status

✅ Frontend components created (CommunityPage, BlogPostDetail)
✅ Database schema ready (create_community_tables.sql)
✅ Blog fetching service with 3-tier strategy
✅ Wallet signature verification for comments
✅ Glassmorphic design with compact spacing
⏳ Need to deploy Supabase Edge Function for reliable fetching

## Setup Steps

### 1. Create Database Tables

Run the SQL script in Supabase Dashboard > SQL Editor:

```bash
supabase/create_community_tables.sql
```

This creates:
- `blog_posts` - Stores fetched blog posts
- `blog_comments` - Wallet-verified comments with signatures
- `blog_post_likes` - User likes on posts

### 2. Deploy Edge Function (Recommended)

The Edge Function solves CORS issues by fetching blog posts server-side.

```bash
# Install Supabase CLI (if needed)
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy fetch-blog-posts
```

**Find your project ref:** Supabase Dashboard > Settings > General > Reference ID

### 3. Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to Community section in Web3.0 or RWS mode

3. Check browser console for fetch logs:
   - ✅ `Edge Function successful!` = Best case
   - ⚠️ `Direct fetch successful!` = CORS allowed (rare)
   - ⚠️ `Proxy successful!` = Fallback working
   - ❌ `All fetch strategies failed` = Need to deploy Edge Function

### 4. Verify Comment System

1. Connect wallet (top right)
2. Click on any blog post
3. Write a comment
4. Sign with wallet when prompted
5. Comment will be saved with `pending` status

## Blog Fetching Strategy

The system tries 3 methods in order:

### 1. Supabase Edge Function (Best)
- Server-side request (no CORS)
- Most reliable
- **Requires deployment** (see step 2 above)

### 2. Direct RSS Fetch
- Client-side request
- Usually blocked by CORS
- Automatic fallback if Edge Function unavailable

### 3. CORS Proxy Services
- Public proxies as last resort
- Less reliable
- Tries multiple services: corsproxy.io, api.codetabs.com, api.allorigins.win

## Database Schema

### blog_posts
```sql
- id (UUID)
- title (TEXT)
- excerpt (TEXT)
- content (TEXT)
- featured_image (TEXT)
- author (TEXT)
- source (TEXT) = 'privatecharterx.blog'
- category (TEXT) = 'web3'
- source_url (TEXT) - Original post URL
- tags (TEXT[])
- views (INTEGER)
- likes (INTEGER)
- published_at (TIMESTAMP)
```

### blog_comments
```sql
- id (UUID)
- post_id (UUID) - References blog_posts
- wallet_address (TEXT) - User's wallet
- comment_text (TEXT)
- signature (TEXT) - Wallet signature
- signed_message (TEXT) - Original message
- status (TEXT) - 'pending', 'approved', 'rejected'
- created_at (TIMESTAMP)
```

## Comment Verification Flow

1. User writes comment
2. App creates message with: Post ID + Comment + Wallet + Timestamp
3. User signs message with wallet (MetaMask popup)
4. Comment saved to database with signature
5. Status = 'pending' (requires admin approval)
6. Approved comments appear publicly

## Features

### Community Page
- 📱 Responsive grid layout
- 🔍 Filter by: All Posts, Latest, Popular
- 📊 View counts, likes, comment counts
- 🎨 Glassmorphic cards with backdrop blur
- 🔄 Auto-sync in background (non-blocking)
- 💾 Sample posts from SQL for instant display

### Blog Post Detail
- 🖼️ Featured image (h-64, compact)
- 📝 Full post content
- 💬 Comments section (wallet-verified)
- 👍 Like functionality
- 🔒 Signature requirement for comments
- 🔗 Link to original post

### Design
- Font: DM Sans (font-light, tracking-tighter)
- Cards: `bg-white/35 backdrop-blur-md`
- No white backgrounds (glassmorphic throughout)
- Compact spacing (smaller padding, margins)
- Consistent with Marketplace design

## Menu Integration

### Web3.0 Mode
- Community added after "DAO"
- Icon: MessageCircle
- Sidebar position: between DAO and Calendar

### RWS Mode
- Community added as main menu item
- Same icon and styling

## Troubleshooting

### No posts showing
1. Check console logs for fetch strategy results
2. Deploy Edge Function: `supabase functions deploy fetch-blog-posts`
3. Sample posts from SQL should always show

### Comments not saving
1. Verify wallet is connected
2. Check user signed the message (MetaMask popup)
3. Check database tables exist
4. Review RLS policies in Supabase

### CORS errors
1. Deploy Edge Function (step 2)
2. If all strategies fail, Edge Function is required
3. Check Edge Function logs: `supabase functions logs fetch-blog-posts`

## Sample Data

The `create_community_tables.sql` includes sample posts for testing:
- "Understanding Web3 Asset Tokenization"
- "The Future of Luxury Asset Investment"
- "Blockchain and Aviation: A Perfect Match"

These appear immediately while background sync fetches real posts.

## Next Steps

1. ✅ Deploy database tables
2. ✅ Deploy Edge Function
3. ✅ Test blog fetching
4. ✅ Test comment system
5. 🔄 Set up comment moderation workflow
6. 🔄 Configure automatic sync interval (currently 60 minutes)
7. 🔄 Add admin panel for comment approval

## Files Modified/Created

- `src/components/Landingpagenew/CommunityPage.jsx` ← Main blog listing
- `src/components/Landingpagenew/BlogPostDetail.jsx` ← Post detail + comments
- `src/services/blogService.js` ← Fetching logic
- `supabase/create_community_tables.sql` ← Database schema
- `supabase/functions/fetch-blog-posts/index.ts` ← Edge Function
- `src/components/Landingpagenew/tokenized-assets-glassmorphic.jsx` ← App routing

## Support

If issues persist after deploying Edge Function:
1. Check Supabase function logs
2. Verify RSS feed is accessible: https://www.privatecharterx.blog/feeds/posts/default/-/web3?alt=json
3. Test Edge Function directly: https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-blog-posts
