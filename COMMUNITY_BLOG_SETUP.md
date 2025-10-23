# Community & Blog Setup Guide

## Overview
The Community feature fetches blog posts from **www.privatecharterx.blog** (Web3 section) and displays them in both RWS and Web3.0 modes with wallet-verified comments.

---

## Features

### 1. **Blog Post Fetching**
- Automatically fetches posts from privatecharterx.blog RSS feed
- Filters for Web3/Blockchain/Crypto category posts
- Stores in Supabase `blog_posts` table
- Includes title, excerpt, content, featured image, tags, author

### 2. **Wallet-Verified Comments** 🔐
- Users MUST sign with their wallet to post comments
- Signature verification ensures authenticity
- Comments require admin approval before appearing
- Prevents spam and fake comments

### 3. **Engagement Features**
- Like/Unlike posts (wallet-verified)
- View count tracking
- Comment moderation system
- Real-time updates

---

## Database Setup

### Step 1: Deploy Community Tables

Run the SQL file in Supabase SQL Editor:

```bash
# File location
database/create_community_tables.sql
```

This creates:
- `blog_posts` - Stores blog posts from privatecharterx.blog
- `blog_comments` - Wallet-verified comments with signatures
- `post_likes` - Like tracking per wallet address
- RPC functions for views/likes increment
- RLS policies for security

### Step 2: Verify Tables

Check in Supabase Dashboard → Table Editor:
- ✅ blog_posts
- ✅ blog_comments (with signature and signed_message fields)
- ✅ post_likes

---

## Blog Post Fetching

### Method 1: Automatic Sync (Recommended)

Add to your app initialization (e.g., `App.jsx` or main component):

```javascript
import { setupBlogSync } from './services/blogService';

// In useEffect or app init
useEffect(() => {
  // Sync blog posts every 60 minutes
  setupBlogSync(60);
}, []);
```

### Method 2: Manual Sync

```javascript
import { syncBlogPostsToDatabase } from './services/blogService';

// Call manually when needed
const syncPosts = async () => {
  const result = await syncBlogPostsToDatabase();
  console.log(`Synced ${result.count} posts`);
};
```

### Method 3: Manual Addition

If automatic fetching doesn't work:

```javascript
import { addBlogPostManually } from './services/blogService';

const addPost = async () => {
  const result = await addBlogPostManually({
    title: 'Your Post Title',
    excerpt: 'Short description...',
    content: '<p>Full HTML content...</p>',
    featuredImage: 'https://image-url.jpg',
    author: 'PrivateCharterX Team',
    sourceUrl: 'https://privatecharterx.blog/post-url',
    tags: ['Web3', 'Aviation', 'Blockchain'],
    publishedAt: '2025-01-15T10:00:00Z'
  });
};
```

---

## How Comments Work

### User Flow:

1. **User writes comment** in text area
2. **Click "Post Comment"** button
3. **Wallet signature popup appears**
   - Message shows: Post ID, Comment text, Wallet address, Timestamp
4. **User signs in wallet** (MetaMask, WalletConnect, etc.)
5. **Comment submitted** with signature to database
6. **Status: "pending"** - awaiting admin approval
7. **After approval** - Comment appears publicly

### Signature Message Format:

```
PrivateCharterX Blog Comment

Post ID: abc-123-xyz
Comment: This is my comment text
Wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Timestamp: 1705334400000
```

### Admin Approval:

Comments with `status='pending'` need approval in Supabase:

```sql
-- Approve a comment
UPDATE blog_comments
SET status = 'approved'
WHERE id = 'comment-uuid-here';

-- Reject a comment
UPDATE blog_comments
SET status = 'rejected'
WHERE id = 'comment-uuid-here';
```

---

## Navigation

### RWS Mode:
`Events & Sports > Jets > Helis > Empty Legs > Adventures > Luxury Cars > Taxi/Concierge > **Community** > CO₂/SAF`

### Web3.0 Mode:
`Tokenized Assets > Marketplace > P2P Trading > Swap > **Community** > DAO Governance > Memberships/NFT > Launchpad`

---

## Components

### CommunityPage.jsx
- Main blog listing page
- Filter by: All Posts, Latest, Popular
- Displays: Title, Excerpt, Image, Views, Likes, Comments
- Click card → Opens BlogPostDetail

### BlogPostDetail.jsx
- Full blog post view
- Like/Unlike functionality
- **Wallet-verified comment form**
- Shows all approved comments
- Signature verification in action

### blogService.js
- Fetches posts from privatecharterx.blog RSS feed
- Syncs to Supabase database
- Handles WordPress API (if available)
- Deduplicates existing posts

---

## Security Features

### 1. **Wallet Signature Verification**
- Every comment requires wallet signature
- Prevents impersonation
- Proves ownership of wallet address

### 2. **Comment Moderation**
- All comments start as "pending"
- Admin must approve before public display
- Can reject spam/inappropriate comments

### 3. **Row Level Security (RLS)**
- Public can only read approved comments
- Authenticated users can create comments
- Service role manages all data

### 4. **Rate Limiting**
- One like per wallet per post
- Signature prevents automated spam

---

## Testing

### 1. Test Blog Fetching

```javascript
import { fetchBlogPostsFromSource } from './services/blogService';

const testFetch = async () => {
  const posts = await fetchBlogPostsFromSource();
  console.log('Fetched posts:', posts);
};
```

### 2. Test Comment Signature

1. Go to Community page
2. Open any blog post
3. Connect wallet (MetaMask, etc.)
4. Write a test comment
5. Click "Post Comment"
6. **Signature popup should appear** ✅
7. Sign the message
8. Check Supabase → blog_comments table
9. Verify `signature` and `signed_message` fields are populated

### 3. Test Approval Flow

```sql
-- View pending comments
SELECT * FROM blog_comments WHERE status = 'pending';

-- Approve first comment
UPDATE blog_comments
SET status = 'approved'
WHERE status = 'pending'
LIMIT 1;

-- Refresh page - comment should now be visible
```

---

## Troubleshooting

### Blog posts not fetching?

**Check:**
1. RSS feed URL is correct: `https://www.privatecharterx.blog/feeds/posts/default?alt=json`
2. Posts have Web3/Blockchain tags
3. Network connection
4. CORS settings (may need backend proxy)

**Solution:** Use manual addition method if RSS fails

### Signature popup not appearing?

**Check:**
1. Wallet is connected (isConnected === true)
2. `useSignMessage` hook is imported
3. wagmi is properly configured
4. Browser console for errors

### Comments not saving?

**Check:**
1. Database tables exist
2. RLS policies are correct
3. signature and signed_message fields exist in blog_comments table
4. Browser console for errors

---

## Production Checklist

- [ ] Deploy `create_community_tables.sql` to Supabase
- [ ] Add blog sync to app initialization
- [ ] Test wallet signature flow
- [ ] Set up comment moderation process
- [ ] Add admin interface for approving comments (optional)
- [ ] Configure CORS if needed for RSS fetching
- [ ] Test on mobile (signature popup)
- [ ] Monitor signature verification logs

---

## Future Enhancements

### Planned Features:
1. **Reply to comments** (nested comments)
2. **Reactions** (emoji reactions per comment)
3. **Comment threading** (discussions)
4. **Notification system** (when someone replies)
5. **Admin dashboard** (bulk comment moderation)
6. **Comment editing** (with new signature)
7. **Profile system** (ENS names, avatar NFTs)
8. **Reputation scores** (based on engagement)

---

## API Endpoints (Future)

If you need a backend API for blog fetching:

```javascript
// Backend endpoint to fetch and sync
POST /api/blog/sync
Response: { success: true, count: 5 }

// Verify signature endpoint
POST /api/comments/verify
Body: { signature, message, walletAddress }
Response: { valid: true }
```

---

## Support

For questions or issues:
- Check Supabase logs
- Verify wallet connection
- Test signature in isolation
- Review browser console errors

---

**Last Updated:** 2025-01-15
**Version:** 1.0.0
