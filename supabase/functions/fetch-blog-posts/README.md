# Blog Post Fetching Edge Function

This Supabase Edge Function fetches blog posts from privatecharterx.blog and bypasses CORS restrictions by making the request server-side.

## Why This Solution?

The privatecharterx.blog RSS feed blocks direct browser requests due to CORS policy. This Edge Function:
- ✅ Makes requests server-side (no CORS issues)
- ✅ Validates responses before parsing
- ✅ Returns clean JSON data
- ✅ More reliable than public CORS proxies

## Deployment

### 1. Install Supabase CLI (if not already installed)

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link to Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Find your project ref in Supabase Dashboard > Settings > General > Reference ID

### 4. Deploy the Function

```bash
supabase functions deploy fetch-blog-posts
```

### 5. Test the Function

```bash
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-blog-posts
```

Or visit in browser:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-blog-posts
```

## Usage in Application

The blogService.js automatically detects and uses this Edge Function if available:

```javascript
// Automatically tries Edge Function first
const posts = await fetchBlogPostsFromSource();
```

## Fallback Strategy

If Edge Function is not deployed, the service automatically falls back to:
1. Direct RSS fetch (if CORS allows)
2. CORS proxy services (as last resort)

## Response Format

```json
{
  "success": true,
  "posts": [
    {
      "title": "Post Title",
      "excerpt": "Short description...",
      "content": "Full HTML content",
      "featured_image": "https://...",
      "author": "Author Name",
      "source": "privatecharterx.blog",
      "category": "web3",
      "source_url": "https://www.privatecharterx.blog/...",
      "tags": ["blockchain", "web3"],
      "published_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 10
}
```

## Troubleshooting

### Function not found (404)
- Make sure you deployed: `supabase functions deploy fetch-blog-posts`
- Check function name matches exactly: `fetch-blog-posts`

### No posts returned
- Check the blog RSS feed is accessible: https://www.privatecharterx.blog/feeds/posts/default/-/web3?alt=json
- View function logs: `supabase functions logs fetch-blog-posts`

### CORS errors in browser
- Edge Functions automatically include CORS headers
- Make sure you're using the correct project URL

## Updating the Function

After making changes to `index.ts`:

```bash
supabase functions deploy fetch-blog-posts
```

## Local Development

Test locally before deploying:

```bash
supabase functions serve fetch-blog-posts
```

Then access at: http://localhost:54321/functions/v1/fetch-blog-posts
