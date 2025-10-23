# Blog Sync Testing Guide

## Quick Test Steps

### 1. Open Browser Console
Press `F12` or `Cmd+Option+I` to open Developer Tools

### 2. Navigate to Community Page
- Go to Web3.0 mode
- Click "Community" in the menu
- OR go to RWS mode → Click "Community"

### 3. Click "Sync Blog Posts" Button
You should see in the console:

```
🔍 Fetching blog posts from privatecharterx.blog...
📦 Raw feed data: { ... }
📝 Found X total posts
🔍 First entry sample: { ... }
✅ Formatted X Web3 posts
🔄 Starting blog sync to database...
📥 Fetched X posts from source
📊 Found X existing posts in database
📝 Inserting X new posts...
✅ Successfully synced X new blog posts!
```

### 4. Check Results

**Success Alert:**
```
✅ Sync complete! X new posts added.
```

**Already Synced:**
```
✅ Sync complete! 0 new posts added.
```

### 5. Verify in Supabase
- Go to Supabase Dashboard
- Table Editor → `blog_posts`
- Should see posts with:
  - `source = 'privatecharterx.blog'`
  - `category = 'web3'`
  - Real titles, excerpts, images
  - Tags array

---

## Troubleshooting

### No Posts Showing?

**Check Console for Errors:**
```javascript
// Manual test in console:
import { fetchBlogPostsFromSource } from './services/blogService';
const posts = await fetchBlogPostsFromSource();
console.log('Posts:', posts);
```

### CORS Error?

The service automatically uses CORS proxy if direct fetch fails:
```
⚠️ Direct fetch failed, trying CORS proxy...
```

### Database Error?

Check:
1. ✅ `blog_posts` table exists in Supabase
2. ✅ RLS policies are correct
3. ✅ `source_url` field is unique

---

## Manual Database Check

```sql
-- Check blog posts
SELECT
  id,
  title,
  author,
  source,
  category,
  views,
  likes,
  published_at,
  created_at
FROM blog_posts
WHERE source = 'privatecharterx.blog'
ORDER BY published_at DESC;

-- Count posts
SELECT COUNT(*) as total_posts
FROM blog_posts
WHERE source = 'privatecharterx.blog'
AND category = 'web3';
```

---

## Force Fresh Sync

If you want to delete all posts and sync fresh:

```sql
-- CAUTION: This deletes all blog posts!
DELETE FROM blog_posts
WHERE source = 'privatecharterx.blog';

-- Then click "Sync Blog Posts" button
```

---

## Check Blog Feed URL

Visit in browser:
```
https://www.privatecharterx.blog/feeds/posts/default?alt=json&max-results=10
```

Should return JSON with `feed.entry` array.

---

## Expected Post Structure

Each post should have:
```json
{
  "title": "Your Post Title",
  "excerpt": "First 200 chars...",
  "content": "<html>Full content...</html>",
  "featured_image": "https://...",
  "author": "PrivateCharterX Team",
  "source": "privatecharterx.blog",
  "category": "web3",
  "source_url": "https://privatecharterx.blog/...",
  "tags": ["Web3", "Blockchain", "Aviation"],
  "published_at": "2025-01-15T10:00:00Z"
}
```

---

## Automatic Sync

The sync runs automatically:
- **On app startup**
- **Every 60 minutes** after that

Check console for:
```
✅ Blog sync activated
```

---

## Debug Mode

Add to console for detailed logs:
```javascript
// Enable verbose logging
localStorage.setItem('DEBUG_BLOG_SYNC', 'true');

// Then reload page
```

---

## Common Issues

### 1. "No entries found in feed"
- Blog might be empty
- Check feed URL in browser
- Verify blog is published

### 2. "All posts already synced"
- Posts are already in database
- Check `blog_posts` table in Supabase
- Delete and re-sync if needed

### 3. CORS errors persisting
- CORS proxy might be down
- Try alternative: `https://corsproxy.io/?${encodeURIComponent(url)}`
- Or set up your own backend proxy

### 4. Posts not filtered correctly
- Check category/tag names in blog
- Modify filter logic in `blogService.js` line 56-75

---

## Next Steps After Successful Sync

1. ✅ Posts appear in Community page
2. ✅ Click a post → Opens detail view
3. ✅ Connect wallet → Can comment
4. ✅ Sign message → Comment submitted
5. ✅ Approve in database → Comment appears

---

**Last Updated:** 2025-01-15
